import { NextResponse } from 'next/server'
import { InterviewService } from '@/lib/interviewService'
import { InterviewMetadata } from '@/types/interview'
import { dummyInterviewData } from '@/types/questions'
import { auth, currentUser } from '@clerk/nextjs/server'
import { UserService } from '@/lib/userService'

interface InterviewQuestionsRequest {
  job_posting_url: string
  use_dummy_data?: boolean
  session_id?: string
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user info from Clerk and ensure user exists in database
    const user = await currentUser()

    const createdUser = await UserService.getOrCreateUser(
      userId,
      user?.emailAddresses[0]?.emailAddress || '',
      user?.firstName || undefined,
      user?.lastName || undefined,
      user?.imageUrl || undefined
    )

    if (createdUser) {
      console.log('✅ User ensured in MongoDB:', createdUser.clerkId)
    } else {
      console.log('⚠️ User creation/retrieval returned null')
    }

    const body: InterviewQuestionsRequest = await request.json()
    const { job_posting_url, use_dummy_data = false, session_id } = body

    if (!job_posting_url) {
      return NextResponse.json(
        { success: false, error: 'Job posting URL is required' },
        { status: 400 }
      )
    }

    // Use dummy data for testing if requested
    if (use_dummy_data) {
      try {
        // Create metadata from dummy data
        const metadata: InterviewMetadata = {
          expected_keywords: dummyInterviewData.expected_keywords,
          difficulty: dummyInterviewData.difficulty as 'easy' | 'medium' | 'hard',
          topic: dummyInterviewData.topic
        };

        let finalSessionId: string;

        // Use existing session if provided, otherwise create new one
        if (session_id) {
          finalSessionId = session_id;
          console.log('Using existing session:', finalSessionId);
          // Update existing session with complete data
          const updated = await InterviewService.updateSessionWithQuestions(
            finalSessionId,
            job_posting_url,
            metadata,
            dummyInterviewData
          );
          if (!updated) {
            console.error('Failed to update session with questions');
            throw new Error('Failed to save questions to database');
          }
        } else {
          // Create new session with metadata
          finalSessionId = await InterviewService.createInterviewSession(
            userId,
            job_posting_url,
            metadata
          );
          console.log('Created new session:', finalSessionId);
          // Save the questions to the new session
          const saved = await InterviewService.saveQuestions(finalSessionId, dummyInterviewData);
          if (!saved) {
            console.error('Failed to save questions to new session');
            throw new Error('Failed to save questions to database');
          }
        }

        console.log('✅ Dummy interview questions successfully saved to session:', finalSessionId);

        return NextResponse.json({
          success: true,
          data: dummyInterviewData,
          metadata: {
            expected_keywords: dummyInterviewData.expected_keywords,
            difficulty: dummyInterviewData.difficulty,
            topic: dummyInterviewData.topic
          },
          sessionId: finalSessionId,
          message: 'Using dummy data for testing'
        });
      } catch (dbError) {
        console.error('Database error with dummy data:', dbError);
        // Still return the dummy data even if database storage fails
        return NextResponse.json({
          success: true,
          data: dummyInterviewData,
          metadata: {
            expected_keywords: dummyInterviewData.expected_keywords,
            difficulty: dummyInterviewData.difficulty,
            topic: dummyInterviewData.topic
          },
          warning: 'Dummy data generated but failed to save to database'
        });
      }
    }

    const response = await fetch('https://interview-questions-generator-v1-147660c7-2-48dda158.crewai.com/kickoff', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.CREWAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: {
          job_posting_url: job_posting_url
        }
      })
    })

    if (!response.ok) {
      throw new Error(`CrewAI API error: ${response.status}`)
    }

    const responseData = await response.json()
    // Extract kickoff_id from the response
    const kickoffId = responseData.kickoff_id || responseData.id
    console.log('Kickoff ID:', kickoffId)

    if (!kickoffId) {
      throw new Error('No kickoff ID received from the API')
    }

    // Function to check status
    const checkStatus = async () => {
      const statusResponse = await fetch(
        `https://interview-questions-generator-v1-147660c7-2-48dda158.crewai.com/status/${kickoffId}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${process.env.CREWAI_API_KEY}`,
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

        if (status === 'SUCCESS') {
          console.log('Task completed successfully');
          console.log('Result:', result.last_executed_task);
          
          let output = result.last_executed_task.output;
          
          // Clean the output string if needed
          if (typeof output === 'string') {
            // Remove any markdown code block indicators
            output = output.replace(/```json\n?/g, '').replace(/```\n?/g, '');
            // Trim any whitespace
            output = output.trim();
          }

          let questions;
          try {
            questions = typeof output === 'string' ? JSON.parse(output) : output;
          } catch (parseError) {
            console.error('JSON Parse Error:', parseError);
            console.log('Raw output:', output);
            throw new Error('Failed to parse interview questions');
          }

          // Store metadata and questions in MongoDB
          try {
            // Extract metadata from the questions response
            const metadata: InterviewMetadata = {
              expected_keywords: questions.expected_keywords || [],
              difficulty: questions.difficulty || 'medium',
              topic: questions.topic || 'Interview'
            };

            let finalSessionId: string;

            // Use existing session if provided, otherwise create new one
            if (session_id) {
              finalSessionId = session_id;
              console.log('Using existing session:', finalSessionId);
              // Update existing session with complete data
              const updated = await InterviewService.updateSessionWithQuestions(
                finalSessionId,
                job_posting_url,
                metadata,
                questions
              );
              if (!updated) {
                console.error('Failed to update session with questions');
                throw new Error('Failed to save questions to database');
              }
            } else {
              // Create new session with metadata
              finalSessionId = await InterviewService.createInterviewSession(
                userId,
                job_posting_url,
                metadata
              );
              console.log('Created new session:', finalSessionId);
              // Save the questions to the new session
              const saved = await InterviewService.saveQuestions(finalSessionId, questions);
              if (!saved) {
                console.error('Failed to save questions to new session');
                throw new Error('Failed to save questions to database');
              }
            }
            
            console.log('✅ Interview questions successfully saved to session:', finalSessionId);

            return NextResponse.json({
              success: true,
              data: questions,
              sessionId: finalSessionId
            });
          } catch (dbError) {
            console.error('Database error:', dbError);
            // Still return the questions even if database storage fails
            return NextResponse.json({
              success: true,
              data: questions,
              warning: 'Questions generated but failed to save to database'
            });
          }
        } else if (status === 'FAILED') {
          throw new Error('Task processing failed');
        }

        // Continue polling if status is "STARTED" or "RUNNING"
        attempts++;
        await new Promise(resolve => setTimeout(resolve, 5000));
      }

      throw new Error('Timeout: Task took too long to complete');
    }

    return pollStatus('STARTED')

  } catch (error) {
    console.error('Error calling CrewAI:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to generate interview questions' },
      { status: 500 }
    )
  }
}

