import { NextResponse } from 'next/server'
import { InterviewService } from '@/lib/interviewService'
import { InterviewMetadata } from '@/types/interview'

export async function GET() {
  try {
    const sessions = await InterviewService.getAllInterviewSessions()
    
    return NextResponse.json({
      success: true,
      data: sessions
    })
  } catch (error) {
    console.error('Error fetching interview sessions:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch interview sessions' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { jobPostingUrl, metadata } = body

    if (!jobPostingUrl || !metadata) {
      return NextResponse.json(
        { success: false, error: 'Job posting URL and metadata are required' },
        { status: 400 }
      )
    }

    const sessionId = await InterviewService.createInterviewSession(
      jobPostingUrl,
      metadata as InterviewMetadata
    )

    const session = await InterviewService.getInterviewSession(sessionId)

    return NextResponse.json({
      success: true,
      data: session,
      sessionId: sessionId
    })
  } catch (error) {
    console.error('Error creating interview session:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create interview session' },
      { status: 500 }
    )
  }
}
