// // filepath: c:\Users\amrut\OneDrive\Desktop\AIMockInterview.v1\my-app\src\app\mock-interview\page.tsx
"use client"

import { useState, useEffect } from 'react'
import VapiWidget from '@/components/VapiWidget'
import { useInterviewQuestions } from '@/context/InterviewQuestionsContext'
import { SessionUtils } from '@/lib/sessionUtils'

export default function MockInterviewPage() {
  const { questions } = useInterviewQuestions()
  const [sessionId, setSessionId] = useState<string | null>(null)

  // Get sessionId from localStorage or URL
  useEffect(() => {
    const sessionInfo = SessionUtils.getSessionInfo()
    if (sessionInfo.sessionId) {
      setSessionId(sessionInfo.sessionId)
      console.log('📋 Session ID found:', sessionInfo.sessionId, 'from', sessionInfo.source)
    } else {
      console.warn('⚠️ No session ID found. QA pairs will not be saved to database.')
    }
  }, [])

  if (!questions) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">No Questions Available</h1>
          <p className="text-gray-600">Please generate interview questions first.</p>
        </div>
      </div>
    )
  }

  // Format questions for display and assistant
  const allQuestions: string[] = []
  Object.values(questions).forEach(category => {
    allQuestions.push(...category)
  })

  // Format questions for the assistant
  const formattedQuestions = allQuestions.map((q, index) => `${index + 1}. ${q}`).join('\n')

  // Assistant configuration
  const assistantOptions = {
    name: "AI Recruiter",
    firstMessage: "Hi there! Welcome to your React Developer interview. Let's get started with a few questions!",
    transcriber: {
      provider: "deepgram" as const,
      model: "nova-2",
      language: "en-US" as const,
    },
    voice: {
      provider: "playht" as const,
      voiceId: "jennifer",
    },
    model: {
      provider: "openai" as const,
      model: "gpt-4" as const,
      messages: [
        {
          role: "system" as const,
          content: `
You are an AI voice assistant conducting interviews.
Your job is to ask candidates provided interview questions, assess their responses.
Begin the conversation with a friendly introduction, setting a relaxed yet professional tone.
Ask one question at a time and wait for the candidate's response before proceeding. Keep the questions clear and concise. 

Below are the Questions to ask:
${formattedQuestions}

If the candidate struggles, offer hints or rephrase the question without giving away the answer. Example:
"Need a hint? Think about how React tracks component updates!"
Provide brief, encouraging feedback after each answer. Example:
"Nice! That's a solid answer."
"Hmm, not quite! Want to try again?"
Keep the conversational natural and engaging—use casual phrases like "Alright, next up..." or "Let's tackle a tricky one!"
After 5-7 questions, wrap up the interview smoothly by summarizing their performance. Example:
"That was great! You handled some tough questions well. Keep sharpening your skills!"
End on a positive note: 
"Thanks for chatting! Hope to see you crushing projects soon!"
Key Guidelines:
✅ Be friendly, engaging, and witty 🎤
✅ Keep responses short and natural, like a real conversation
✅ Adapt based on the candidate's confidence level
✅ Ensure the interview remains focused on React
`.trim(),
        },
      ],
    },
  }

  return (
    <div className="w-full h-full ">
      {/* <h1 className="text-3xl font-bold mb-8">Mock Interview Session</h1>
      <div className="bg-white shadow-lg rounded-lg p-6">
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-4">React Developer Interview Questions</h2>
            <p className="text-gray-600 mb-6">
              Click the microphone button to start your voice interview with our AI recruiter!
            </p>
          </div>
          
          <div className="grid gap-4">
            <h3 className="text-lg font-medium">Questions that will be asked:</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {allQuestions.map((question, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium text-blue-600">{index + 1}.</span> {question}
                </div>
              ))}
            </div>
          </div>
          
          <div className="text-center">
            <p className="text-sm text-gray-500 mb-4">
              The AI interviewer will ask these questions one by one and provide feedback on your answers.
            </p>
          </div>
        </div>
      </div> */}
      
      {/* VapiWidget for voice interaction */}
      <VapiWidget 
        apiKey={process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY as string} 
        assistantOptions={assistantOptions}
        sessionId={sessionId || undefined}
      />
    </div>
  )
}