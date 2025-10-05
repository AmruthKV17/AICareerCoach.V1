import { NextResponse } from 'next/server'
import { InterviewService } from '@/lib/interviewService'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sessionId } = await params
    console.log('📊 GET /api/interview-sessions/[id]/analysis - sessionId:', sessionId)
    
    const analysis = await InterviewService.getAnalysis(sessionId)
    
    if (!analysis) {
      return NextResponse.json({
        success: false,
        message: 'No analysis found for this session'
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: analysis
    })
  } catch (error) {
    console.error('Error fetching analysis:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch analysis' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sessionId } = await params
    const body = await request.json()
    console.log('body in anlysis route:', body);
    
    const { analysis } = body

    if (!analysis) {
      return NextResponse.json(
        { success: false, error: 'Analysis data is required' },
        { status: 400 }
      )
    }

    console.log('💾 POST /api/interview-sessions/[id]/analysis - Saving analysis for session:', sessionId)
    
    const saved = await InterviewService.saveAnalysis(sessionId, analysis)
    
    if (!saved) {
      return NextResponse.json(
        { success: false, error: 'Failed to save analysis' },
        { status: 500 }
      )
    }

    console.log('✅ Analysis saved successfully for session:', sessionId)

    return NextResponse.json({
      success: true,
      message: 'Analysis saved successfully'
    })
  } catch (error) {
    console.error('Error saving analysis:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to save analysis' },
      { status: 500 }
    )
  }
}
