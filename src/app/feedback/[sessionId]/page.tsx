"use client"

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { InterviewMetadata } from '@/types/interview'

interface InterviewData {
  metadata: InterviewMetadata
  qaPairs: Array<{ question: string, answer: string }>
  sessionId: string
}

export default function FeedbackPage() {
  const params = useParams()
  const router = useRouter()
  const sessionId = params.sessionId as string
  
  const [interviewData, setInterviewData] = useState<InterviewData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [crewResponse, setCrewResponse] = useState<any>(null)
  const [sendingToCrew, setSendingToCrew] = useState(false)

  // Fetch interview data from API endpoints
  useEffect(() => {
    const fetchInterviewData = async () => {
      try {
        setLoading(true)
        
        // Fetch metadata and QA pairs from API endpoints
        const [metadataResponse, qaPairsResponse] = await Promise.all([
          fetch(`/api/interview-sessions/${sessionId}/metadata`),
          fetch(`/api/interview-sessions/${sessionId}/qa-pairs`)
        ])

        if (!metadataResponse.ok || !qaPairsResponse.ok) {
          throw new Error('Failed to fetch interview data')
        }

        const metadataData = await metadataResponse.json()
        const qaPairsData = await qaPairsResponse.json()

        if (!metadataData.success || !qaPairsData.success) {
          throw new Error('Interview session not found or no QA pairs available')
        }

        setInterviewData({
          metadata: metadataData.data.metadata,
          qaPairs: qaPairsData.data,
          sessionId
        })

        console.log('📊 Interview data loaded:', { metadata: metadataData.data.metadata, qaPairs: qaPairsData.data.length })
        
      } catch (err) {
        console.error('❌ Error fetching interview data:', err)
        setError(err instanceof Error ? err.message : 'Failed to load interview data')
      } finally {
        setLoading(false)
      }
    }

    if (sessionId) {
      fetchInterviewData()
    }
  }, [sessionId])

  // Send data to CrewAI
  const sendToCrewAI = async () => {
    if (!interviewData) return

    try {
      setSendingToCrew(true)
      
      const response = await fetch('/api/crew/kickoff', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: interviewData.sessionId,
          metadata: interviewData.metadata,
          qaPairs: interviewData.qaPairs,
          interviewSummary: {
            totalQuestions: interviewData.qaPairs.length,
            topic: interviewData.metadata.topic,
            difficulty: interviewData.metadata.difficulty,
            expectedKeywords: interviewData.metadata.expected_keywords
          }
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const crewData = await response.json()
      setCrewResponse(crewData)
      console.log('✅ CrewAI response:', crewData)
      
    } catch (err) {
      console.error('❌ Error sending to CrewAI:', err)
      setError(err instanceof Error ? err.message : 'Failed to send data to CrewAI')
    } finally {
      setSendingToCrew(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-700">Loading Interview Data...</h2>
          <p className="text-gray-500">Fetching your interview session from database</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center max-w-md">
          <div className="text-red-500 text-6xl mb-4">❌</div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Error Loading Data</h2>
          <p className="text-gray-500 mb-4">{error}</p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Interview Feedback</h1>
          <p className="text-gray-600">Session ID: {sessionId}</p>
        </div>

        {/* Interview Summary */}
        {interviewData && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Metadata Card */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Interview Details</h2>
              <div className="space-y-3">
                <div>
                  <span className="font-medium text-gray-600">Topic:</span>
                  <span className="ml-2 text-gray-800">{interviewData.metadata.topic}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Difficulty:</span>
                  <span className={`ml-2 px-2 py-1 rounded text-sm ${
                    interviewData.metadata.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                    interviewData.metadata.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {interviewData.metadata.difficulty}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Expected Keywords:</span>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {interviewData.metadata.expected_keywords.map((keyword, index) => (
                      <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* QA Pairs Summary */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Interview Summary</h2>
              <div className="space-y-3">
                <div>
                  <span className="font-medium text-gray-600">Total Questions:</span>
                  <span className="ml-2 text-gray-800">{interviewData.qaPairs.length}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Session Status:</span>
                  <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-sm rounded">
                    Completed
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* QA Pairs Display */}
        {interviewData && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Question & Answer Pairs</h2>
            <div className="space-y-4">
              {interviewData.qaPairs.map((qa, index) => (
                <div key={index} className="border-l-4 border-blue-500 pl-4">
                  <div className="font-medium text-gray-800 mb-1">
                    Q{index + 1}: {qa.question}
                  </div>
                  <div className="text-gray-600">
                    A{index + 1}: {qa.answer}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CrewAI Integration */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">AI Feedback Analysis</h2>
          
          {!crewResponse ? (
            <div className="text-center">
              <p className="text-gray-600 mb-4">
                Click the button below to send your interview data to our AI analysis system for detailed feedback.
              </p>
              <button
                onClick={sendToCrewAI}
                disabled={sendingToCrew}
                className={`px-6 py-3 rounded-lg font-medium ${
                  sendingToCrew
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                } text-white`}
              >
                {sendingToCrew ? (
                  <span className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Analyzing...
                  </span>
                ) : (
                  'Get AI Feedback'
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-semibold text-green-800 mb-2">✅ Analysis Complete</h3>
                <p className="text-green-700">Your interview data has been successfully analyzed by our AI system.</p>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 mb-2">AI Response:</h3>
                <pre className="text-sm text-gray-600 whitespace-pre-wrap">
                  {JSON.stringify(crewResponse, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
