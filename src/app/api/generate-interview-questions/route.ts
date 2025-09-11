import { NextResponse } from 'next/server'
import { useInterviewQuestions } from '@/context/InterviewQuestionsContext';

interface InterviewQuestionsRequest {
  job_posting_url: string
}


export async function POST(request: Request) {
  try {
    const body: InterviewQuestionsRequest = await request.json()
    const { job_posting_url } = body

    if (!job_posting_url) {
      return NextResponse.json(
        { success: false, error: 'Job posting URL is required' },
        { status: 400 }
      )
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
          
          return NextResponse.json({
            success: true,
            data: questions
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

    return pollStatus('STARTED')

  } catch (error) {
    console.error('Error calling CrewAI:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to generate interview questions' },
      { status: 500 }
    )
  }
}

