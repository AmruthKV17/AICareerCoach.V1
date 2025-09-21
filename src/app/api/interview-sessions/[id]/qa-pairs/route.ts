import { NextResponse } from 'next/server'
import { InterviewService } from '@/lib/interviewService'

interface RouteParams {
  params: {
    id: string
  }
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params
    const body = await request.json()
    const { qaPairs } = body
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Session ID is required' },
        { status: 400 }
      )
    }

    if (!qaPairs || !Array.isArray(qaPairs)) {
      return NextResponse.json(
        { success: false, error: 'QA pairs array is required' },
        { status: 400 }
      )
    }

    const success = await InterviewService.saveQAPairs(id, qaPairs)
    
    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Failed to save QA pairs' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'QA pairs saved successfully'
    })
  } catch (error) {
    console.error('Error saving QA pairs:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to save QA pairs' },
      { status: 500 }
    )
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

    const qaPairs = await InterviewService.getQAPairs(id)
    
    if (qaPairs === null) {
      return NextResponse.json(
        { success: false, error: 'Interview session not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: qaPairs
    })
  } catch (error) {
    console.error('Error fetching QA pairs:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch QA pairs' },
      { status: 500 }
    )
  }
}
