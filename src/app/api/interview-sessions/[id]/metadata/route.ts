import { NextResponse } from 'next/server'
import { InterviewService } from '@/lib/interviewService'

interface RouteParams {
  params: {
    id: string
  }
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = params
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Session ID is required' },
        { status: 400 }
      )
    }

    const session = await InterviewService.getInterviewSession(id)
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Interview session not found' },
        { status: 404 }
      )
    }

    // Return only the metadata
    return NextResponse.json({
      success: true,
      data: {
        metadata: session.metadata,
        jobPostingUrl: session.jobPostingUrl,
        createdAt: session.createdAt,
        status: session.status
      }
    })
  } catch (error) {
    console.error('Error fetching interview metadata:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch interview metadata' },
      { status: 500 }
    )
  }
}
