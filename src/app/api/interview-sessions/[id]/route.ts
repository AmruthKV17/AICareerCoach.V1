import { NextResponse } from 'next/server'
import { InterviewService } from '@/lib/interviewService'

interface RouteParams {
  params: {
    id: string
  }
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params
    
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

    return NextResponse.json({
      success: true,
      data: session
    })
  } catch (error) {
    console.error('Error fetching interview session:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch interview session' },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params
    const body = await request.json()
    const { status } = body
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Session ID is required' },
        { status: 400 }
      )
    }

    if (!status || !['generated', 'in_progress', 'completed'].includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Valid status is required' },
        { status: 400 }
      )
    }

    const success = await InterviewService.updateInterviewSessionStatus(id, status)
    
    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Failed to update interview session' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Interview session updated successfully'
    })
  } catch (error) {
    console.error('Error updating interview session:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update interview session' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Session ID is required' },
        { status: 400 }
      )
    }

    const success = await InterviewService.deleteInterviewSession(id)
    
    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Failed to delete interview session' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Interview session deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting interview session:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete interview session' },
      { status: 500 }
    )
  }
}
