// filepath: c:\Users\amrut\OneDrive\Desktop\AIMockInterview.v1\my-app\src\app\mock-interview\page.tsx
"use client"

import { useInterviewQuestions } from '@/context/InterviewQuestionsContext'

export default function MockInterviewPage() {
  const { questions } = useInterviewQuestions()

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

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Mock Interview Session</h1>
      <div className="bg-white shadow-lg rounded-lg p-6">
        {/* Add your mock interview interface here */}
        <p className="text-gray-600 mb-4">Your mock interview session will begin shortly...</p>
        {/* You can add more mock interview related components here */}
      </div>
    </div>
  )
}