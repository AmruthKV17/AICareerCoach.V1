import { NextResponse } from 'next/server'
import { InterviewService } from '@/lib/interviewService'

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
