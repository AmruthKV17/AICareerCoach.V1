import { NextResponse } from 'next/server'
import {
  getCrewStatusSnapshot,
  isDetailedAnalysisPayload,
  parseOutputPayload,
  resolveCrewConfig,
} from '@/lib/crew'

type RouteContext = {
  params: {
    kickoffId?: string
  }
}

export async function GET(request: Request, props: { params: Promise<{ kickoffId: string }> }) {
  try {
    const params = await props.params;
    const { kickoffId } = params;

    if (!kickoffId?.trim()) {
      return NextResponse.json({ error: 'kickoffId param is required.' }, { status: 400 })
    }

    const { baseUrl, apiKey } = resolveCrewConfig()

    if (!apiKey) {
      return NextResponse.json({ error: 'CrewAI API key is not configured.' }, { status: 500 })
    }

    const statusData = await getCrewStatusSnapshot(kickoffId, { baseUrl, apiKey })
    const payload: Record<string, unknown> = {
      kickoff_id: kickoffId,
      status: statusData.state,
    }

    if (statusData.last_executed_task?.output) {
      const parsed = parseOutputPayload(statusData.last_executed_task.output)

      if (isDetailedAnalysisPayload(parsed)) {
        return NextResponse.json({
          kickoff_id: kickoffId,
          status: statusData.state,
          ...parsed,
        })
      }

      payload.analysis = parsed
    }

    return NextResponse.json(payload)
  } catch (error) {
    console.error('Crew status lookup failed:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to retrieve CrewAI run status.' },
      { status: 500 }
    )
  }
}
