"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useInterviewQuestions } from '@/context/InterviewQuestionsContext'

interface InterviewQuestionsProps {}

export default function InterviewQuestionsGenerator({}: InterviewQuestionsProps) {
  const router = useRouter()
  const [jobUrl, setJobUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { questions, setQuestions } = useInterviewQuestions()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!jobUrl.trim()) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/generate-interview-questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          job_posting_url: jobUrl.trim()
        })
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Failed to generate questions')
      }

      setQuestions(data.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleStartMockInterview = () => {
    router.push('/mock-interview')
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Interview Questions Generator</h1>
      
      <form onSubmit={handleSubmit} className="mb-6">
        <div className="flex gap-4">
          <input
            type="url"
            value={jobUrl}
            onChange={(e) => setJobUrl(e.target.value)}
            placeholder="Enter job posting URL..."
            className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? 'Generating...' : 'Generate Questions'}
          </button>
        </div>
      </form>

      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {questions && (
        <>
          <div className="bg-white border rounded-lg p-6 space-y-6">
            <h2 className="text-xl font-semibold mb-4">Interview Questions</h2>
            
            {/* Technical Questions */}
            <div>
              <h3 className="text-lg font-semibold text-blue-600 mb-3">Technical Questions</h3>
              <ul className="list-disc pl-5 space-y-2">
                {questions['technical-questions'].map((question, index) => (
                  <li key={`tech-${index}`} className="text-gray-700">{question}</li>
                ))}
              </ul>
            </div>

            {/* Behavioral Questions */}
            <div>
              <h3 className="text-lg font-semibold text-green-600 mb-3">Behavioral Questions</h3>
              <ul className="list-disc pl-5 space-y-2">
                {questions['behavioral-questions'].map((question, index) => (
                  <li key={`behav-${index}`} className="text-gray-700">{question}</li>
                ))}
              </ul>
            </div>

            {/* Situational Questions */}
            <div>
              <h3 className="text-lg font-semibold text-purple-600 mb-3">Situational Questions</h3>
              <ul className="list-disc pl-5 space-y-2">
                {questions['situational-questions'].map((question, index) => (
                  <li key={`sit-${index}`} className="text-gray-700">{question}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Add the new button below questions */}
          <div className="mt-8 flex justify-center">
            <button
              onClick={handleStartMockInterview}
              className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 
                       transition-colors duration-200 font-semibold text-lg shadow-lg
                       flex items-center gap-2"
            >
              <span>Start Mock Interview Now</span>
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-5 w-5" 
                viewBox="0 0 20 20" 
                fill="currentColor"
              >
                <path fillRule="evenodd" 
                      d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" 
                      clipRule="evenodd" 
                />
              </svg>
            </button>
          </div>
        </>
      )}
    </div>
  )
}