import { NextResponse } from 'next/server'
import { InterviewService } from '@/lib/interviewService'
import { InterviewMetadata } from '@/types/interview'
import { dummyInterviewData, dummyInterviewMetadata } from '@/types/questions'

interface InterviewQuestionsRequest {
  job_posting_url: string
  use_dummy_data?: boolean
}


export async function POST(request: Request) {
  try {
    const body: InterviewQuestionsRequest = await request.json()
    const { job_posting_url, use_dummy_data = false } = body

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
          expected_keywords: dummyInterviewMetadata.expected_keywords,
          difficulty: dummyInterviewMetadata.difficulty as 'easy' | 'medium' | 'hard',
          topic: dummyInterviewMetadata.topic
        };

        // Store only the metadata in MongoDB
        const sessionId = await InterviewService.createInterviewSession(
          job_posting_url,
          metadata
        );

        console.log('Dummy interview session stored with ID:', sessionId);

        return NextResponse.json({
          success: true,
          data: dummyInterviewData,
          metadata: dummyInterviewMetadata,
          sessionId: sessionId,
          message: 'Using dummy data for testing'
        });
      } catch (dbError) {
        console.error('Database error with dummy data:', dbError);
        // Still return the dummy data even if database storage fails
        return NextResponse.json({
          success: true,
          data: dummyInterviewData,
          metadata: dummyInterviewMetadata,
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

          // Store only metadata in MongoDB
          try {
            // Extract metadata from the questions response
            const metadata: InterviewMetadata = {
              expected_keywords: questions.expected_keywords || [],
              difficulty: questions.difficulty || 'medium',
              topic: questions.topic || 'Interview'
            };

            const sessionId = await InterviewService.createInterviewSession(
              job_posting_url,
              metadata
            );
            
            console.log('Interview session stored with ID:', sessionId);

            return NextResponse.json({
              success: true,
              data: questions,
              sessionId: sessionId
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

