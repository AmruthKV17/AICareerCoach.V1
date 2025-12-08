const DEFAULT_CREW_BASE = 'https://holistic-interview-evaluator-with-reference-ae2ff779.crewai.com'

export type CrewStatusResponse = {
  state: 'STARTED' | 'RUNNING' | 'SUCCESS' | 'FAILED'
  last_executed_task?: {
    output?: unknown
  }
}

export type DetailedAnalysisPayload = {
  kickoff_id?: string
  analysis_metadata: Record<string, unknown>
  resume_analysis: Record<string, unknown>
  cover_letter?: Record<string, unknown>
  summary?: Record<string, unknown>
}

export const resolveCrewConfig = () => {
  const baseUrl = process.env.CREWAI_RESUME_BASE_URL ?? DEFAULT_CREW_BASE
  const apiKey = process.env.CREWAI_API_KEY3 ?? process.env.CREWAI_API_KEY ?? ''
  console.log('Crew config:', { baseUrl, apiKey })
  return { baseUrl, apiKey }
}

export const cleanJsonString = (raw: string) =>
  raw
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .replace(/,(\s*[}\]])/g, '$1')
    .trim()

export const parseOutputPayload = (output: unknown): Record<string, unknown> => {
  if (output && typeof output === 'object') {
    return output as Record<string, unknown>
  }

  if (typeof output !== 'string') {
    return { raw_output: output }
  }

  let cleaned = cleanJsonString(output)
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
  if (jsonMatch) {
    cleaned = jsonMatch[0]
  }

  try {
    return JSON.parse(cleaned)
  } catch {
    return { raw_output: cleaned }
  }
}

export const isDetailedAnalysisPayload = (
  payload: Record<string, unknown>
): payload is DetailedAnalysisPayload => 'analysis_metadata' in payload && 'resume_analysis' in payload

const fetchCrewStatusOnce = async (
  kickoffId: string,
  baseUrl: string,
  apiKey: string
): Promise<CrewStatusResponse> => {
  const statusResponse = await fetch(`${baseUrl}/status/${kickoffId}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  })

  if (!statusResponse.ok) {
    throw new Error(`Status check failed (${statusResponse.status})`)
  }

  return (await statusResponse.json()) as CrewStatusResponse
}

export const pollCrewStatus = async (
  kickoffId: string,
  options: {
    baseUrl: string
    apiKey: string
    maxAttempts?: number
    intervalMs?: number
  }
): Promise<Record<string, unknown>> => {
  const { baseUrl, apiKey, maxAttempts = 60, intervalMs = 5000 } = options

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const statusData = await fetchCrewStatusOnce(kickoffId, baseUrl, apiKey)

    if (statusData.state === 'SUCCESS') {
      if (!statusData.last_executed_task?.output) {
        throw new Error('CrewAI finished without output payload')
      }
      return parseOutputPayload(statusData.last_executed_task.output)
    }

    if (statusData.state === 'FAILED') {
      throw new Error('CrewAI run failed')
    }

    await new Promise((resolve) => setTimeout(resolve, intervalMs))
  }

  throw new Error('CrewAI run timed out')
}

export const getCrewStatusSnapshot = async (
  kickoffId: string,
  options: { baseUrl: string; apiKey: string }
) => fetchCrewStatusOnce(kickoffId, options.baseUrl, options.apiKey)

type CrewStatusOnceArgs = Parameters<typeof fetchCrewStatusOnce>
export type FetchCrewStatusConfig = {
  kickoffId: string
  baseUrl: CrewStatusOnceArgs[1]
  apiKey: CrewStatusOnceArgs[2]
}

export { DEFAULT_CREW_BASE }
