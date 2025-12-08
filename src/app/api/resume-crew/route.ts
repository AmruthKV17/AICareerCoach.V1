import { NextResponse } from 'next/server'
import { isDetailedAnalysisPayload, pollCrewStatus, resolveCrewConfig } from '@/lib/crew'

type ResumeCrewRequest = {
  resume_text: string
  target_role: string
  job_posting_url: string
}

type CrewKickoffResponse = {
  kickoff_id?: string
  success?: boolean
}

export async function POST(request: Request) {
  try {
    const { baseUrl: CREW_BASE_URL, apiKey: CREW_API_KEY } = resolveCrewConfig()
    console.log('CREW_API_KEY', CREW_API_KEY)

    if (!CREW_API_KEY) {
      return NextResponse.json({ success: false, error: 'CrewAI API key is not configured.' }, { status: 500 })
    }

    const { resume_text, target_role, job_posting_url }: ResumeCrewRequest = await request.json()

    if (!resume_text?.trim() || !target_role?.trim() || !job_posting_url?.trim()) {
      return NextResponse.json(
        { success: false, error: 'resume_text, target_role, and job_posting_url are required.' },
        { status: 400 }
      )
    }

    const kickoffResponse = await fetch(`${CREW_BASE_URL}/kickoff`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${CREW_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: {
          resume_text,
          target_role,
          job_posting_url,
        },
      }),
    })

    if (!kickoffResponse.ok) {
      const errorPayload = await kickoffResponse.text()
      throw new Error(`CrewAI kickoff failed (${kickoffResponse.status}): ${errorPayload}`)
    }

    const kickoffPayload = (await kickoffResponse.json()) as CrewKickoffResponse
    if (!kickoffPayload.kickoff_id) {
      throw new Error('CrewAI did not return a kickoff_id')
    }

    // Async Mode: Return ID immediately so frontend can redirect and poll
    return NextResponse.json({
      success: true,
      kickoff_id: kickoffPayload.kickoff_id,
      status: 'STARTED'
    })

  } catch (error) {
    console.error('Crew resume analysis error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to analyze resume with CrewAI.',
      },
      { status: 500 }
    )
  }
}
