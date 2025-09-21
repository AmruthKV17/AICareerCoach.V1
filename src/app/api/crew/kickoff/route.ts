import { NextResponse } from 'next/server'
import { InterviewMetadata } from '@/types/interview'
import { InterviewService } from '@/lib/interviewService'

interface CrewAIRequestBody {
  sessionId: string
  metadata: InterviewMetadata
  qaPairs: Array<{ question: string, answer: string }>
  interviewSummary: {
    totalQuestions: number
    topic: string
    difficulty: string
    expectedKeywords: string[]
  }
}

interface CrewAIResponse {
  kickoff_id?: string
  success?: boolean
  analysisId?: string
  feedback?: any
  metadata?: any
}

interface CrewAIStatusResponse {
  state: 'STARTED' | 'RUNNING' | 'SUCCESS' | 'FAILED'
  last_executed_task?: {
    output: string | any
  }
}

export async function POST(request: Request) {
  try {
    const body: CrewAIRequestBody = await request.json()
    const { sessionId, metadata, qaPairs, interviewSummary } = body

    // Validate required fields
    if (!sessionId || !metadata || !qaPairs || !interviewSummary) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields: sessionId, metadata, qaPairs, or interviewSummary' 
        },
        { status: 400 }
      )
    }

    // Validate qaPairs structure
    if (!Array.isArray(qaPairs) || qaPairs.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'qaPairs must be a non-empty array' 
        },
        { status: 400 }
      )
    }

    console.log('🚀 CrewAI Kickoff Request:', {
      sessionId,
      totalQuestions: qaPairs.length,
      topic: metadata.topic,
      difficulty: metadata.difficulty
    })

    // Prepare data for CrewAI - try multiple formats
    const crewAIData = {
      inputs : {
      interview_data: {
        topic: metadata.topic,
        difficulty: metadata.difficulty,
        expected_keywords: metadata.expected_keywords,
        items: qaPairs.map((qa, index) => ({
          question: qa.question,
          answer: qa.answer
        }))
      }
    }}

    // // For now, we'll simulate a CrewAI response
    // // In production, you would make an actual API call to CrewAI here
    // const mockCrewAIResponse = {
    //   success: true,
    //   analysisId: `analysis_${sessionId}_${Date.now()}`,
    //   feedback: {
    //     overallScore: Math.floor(Math.random() * 40) + 60, // 60-100
    //     strengths: [
    //       'Good technical understanding',
    //       'Clear communication style',
    //       'Practical problem-solving approach'
    //     ],
    //     areasForImprovement: [
    //       'Could mention more specific technologies',
    //       'Consider providing more detailed examples',
    //       'Try to relate answers more directly to the role'
    //     ],
    //     detailedAnalysis: qaPairs.map((qa, index) => ({
    //       questionNumber: index + 1,
    //       question: qa.question,
    //       answer: qa.answer,
    //       score: Math.floor(Math.random() * 30) + 70, // 70-100
    //       feedback: `Good answer for question ${index + 1}. Consider adding more technical details.`,
    //       keywordMatches: metadata.expected_keywords.filter(keyword => 
    //         qa.answer.toLowerCase().includes(keyword.toLowerCase())
    //       )
    //     })),
    //     recommendations: [
    //       'Practice explaining complex technical concepts in simple terms',
    //       'Prepare specific examples from past projects',
    //       'Review the job requirements and align answers accordingly'
    //     ],
    //     nextSteps: [
    //       'Continue practicing with similar technical questions',
    //       'Focus on the areas mentioned in the feedback',
    //       'Consider taking additional courses in the identified weak areas'
    //     ]
    //   },
    //   metadata: {
    //     analyzedAt: new Date().toISOString(),
    //     sessionId,
    //     totalQuestions: qaPairs.length,
    //     analysisDuration: '2.3s'
    //   }
    // }

    // Log the data being sent to CrewAI
    console.log('📤 Sending data to CrewAI:', JSON.stringify(crewAIData, null, 2))
    
    // Try CrewAI API call, fallback to mock if it fails
    let crewData: CrewAIResponse;
    console.log(crewAIData);
    
    
    try {
      const crewAIResponse = await fetch('https://holistic-interview-evaluation-with-advanced-750b8ccd.crewai.com/kickoff', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.CREWAI_API_KEY2}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: {
            interview_data: {
              // Your interview data JSON goes here
              expected_keywords: metadata.expected_keywords,
              topic: metadata.topic,
              difficulty: metadata.difficulty,
              questions_and_answers: [
                // ... your interview data
                qaPairs.map((qa, index) => ({
                  question: qa.question,
                  answer: qa.answer
                }))
              ]
            }
          }
        })
      })
      
      if (!crewAIResponse.ok) {
        const errorText = await crewAIResponse.text()
        console.error('CrewAI API Error Details:', {
          status: crewAIResponse.status,
          statusText: crewAIResponse.statusText,
          url: crewAIResponse.url,
          response: errorText
        })
        throw new Error(`CrewAI API error: ${crewAIResponse.status} - ${crewAIResponse.statusText}`)
      }

      crewData = await crewAIResponse.json()
      console.log('✅ CrewAI API call successful')
      console.log(crewData)
      
      // Function to check status
      const checkStatus = async (): Promise<CrewAIStatusResponse> => {
        if (!crewData.kickoff_id) {
          throw new Error('No kickoff_id available for status checking')
        }
        
        const statusResponse = await fetch(
          `https://holistic-interview-evaluation-with-advanced-750b8ccd.crewai.com/status/${crewData.kickoff_id}`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${process.env.CREWAI_API_KEY2}`,
            }
          }
        )

        if (!statusResponse.ok) {
          throw new Error(`Status check failed: ${statusResponse.status}`)
        }

        const statusData = await statusResponse.json()
        console.log('Status Response:', statusData.last_executed_task?.output) // Debug log
        return statusData
      }

      // Poll until completion
      const pollStatus = async (status: string) => {
        let attempts = 0;
        const maxAttempts = 60; // 5 minutes maximum (with 5-second intervals)

        while (attempts < maxAttempts) {
          const result = await checkStatus();
          status = result.state;
          console.log('Current status:', status);

          // Check if we have a valid output, regardless of status
          if (result.last_executed_task?.output) {
            console.log('Task output received');
            console.log('Result:', result.last_executed_task);
            
            let output = result.last_executed_task.output;
            
            // Clean the output string if needed
            if (typeof output === 'string') {
              // Remove any markdown code block indicators
              output = output.replace(/```json\n?/g, '').replace(/```\n?/g, '');
              // Trim any whitespace
              output = output.trim();
            }

            let analysisResult;
            try {
              analysisResult = typeof output === 'string' ? JSON.parse(output) : output;
              
              // Check if the parsed result has the expected structure
              if (analysisResult && (analysisResult.overall_performance || analysisResult.score !== undefined)) {
                console.log('Valid analysis result received, treating as SUCCESS');
                
                // Return the successful analysis result
                return NextResponse.json({
                  success: true,
                  data: analysisResult,
                  sessionId: sessionId,
                  message: 'Interview analysis completed successfully'
                });
              }
            } catch (parseError) {
              console.error('JSON Parse Error:', parseError);
              console.log('Raw output:', output);
              // Continue polling if parse fails
            }
          }

          if (status === 'SUCCESS') {
            console.log('Task completed successfully');
            
            if (!result.last_executed_task?.output) {
              throw new Error('No output available from completed task')
            }
            
            // This code path should now be rarely reached due to the check above
            let output = result.last_executed_task.output;
            let analysisResult = typeof output === 'string' ? JSON.parse(output) : output;

            return NextResponse.json({
              success: true,
              data: analysisResult,
              sessionId: sessionId,
              message: 'Interview analysis completed successfully'
            });
            
          } else if (status === 'FAILED') {
            throw new Error('Task processing failed');
          }

          // Continue polling if status is "STARTED" or "RUNNING"
          attempts++;
          await new Promise(resolve => setTimeout(resolve, 5000));
        }

        throw new Error('Timeout: Task took too long to complete');
      }

      return await pollStatus('STARTED')
      
    } catch (apiError) {
      console.warn('⚠️ CrewAI API failed, using mock response:', apiError)
      
      // Fallback to mock response
      crewData = {
        success: true,
        analysisId: `analysis_${sessionId}_${Date.now()}`,
        feedback: {
          overallScore: Math.floor(Math.random() * 40) + 60, // 60-100
          strengths: [
            'Good technical understanding',
            'Clear communication style',
            'Practical problem-solving approach'
          ],
          areasForImprovement: [
            'Could mention more specific technologies',
            'Consider providing more detailed examples',
            'Try to relate answers more directly to the role'
          ],
          detailedAnalysis: qaPairs.map((qa, index) => ({
            questionNumber: index + 1,
            question: qa.question,
            answer: qa.answer,
            score: Math.floor(Math.random() * 30) + 70, // 70-100
            feedback: `Good answer for question ${index + 1}. Consider adding more technical details.`,
            keywordMatches: metadata.expected_keywords.filter(keyword => 
              qa.answer.toLowerCase().includes(keyword.toLowerCase())
            )
          })),
          recommendations: [
            'Practice explaining complex technical concepts in simple terms',
            'Prepare specific examples from past projects',
            'Review the job requirements and align answers accordingly'
          ],
          nextSteps: [
            'Continue practicing with similar technical questions',
            'Focus on the areas mentioned in the feedback',
            'Consider taking additional courses in the identified weak areas'
          ]
        },
        metadata: {
          analyzedAt: new Date().toISOString(),
          sessionId,
          totalQuestions: qaPairs.length,
          analysisDuration: '2.3s',
          source: 'mock_fallback'
        }
      }
    }

    // This should only be reached if using mock response
    console.log('✅ CrewAI Analysis Complete (Mock):', {
      analysisId: crewData.analysisId || `analysis_${sessionId}_${Date.now()}`,
      overallScore: crewData.feedback?.overallScore || 'N/A'
    })

    return NextResponse.json({
      success: true,
      data: crewData,
      message: 'Interview analysis completed successfully (mock fallback)'
    })

  } catch (error) {
    console.error('❌ CrewAI Kickoff Error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to process interview data with CrewAI',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
