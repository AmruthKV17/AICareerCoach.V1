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
    // console.log(id);
    
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Session ID is required' },
        { status: 400 }
      )
    }

    const questions = await InterviewService.getQuestions(id)
    // console.log(questions);
    
    if (!questions) {
      return NextResponse.json(
        { success: false, error: 'No questions found for this session' },
        { status: 404 }
      )
    }
    // console.log(questions);
    

    return NextResponse.json({
      success: true,
      data: questions
    })
  } catch (error) {
    console.error('Error fetching questions:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch questions' },
      { status: 500 }
    )
  }
}
