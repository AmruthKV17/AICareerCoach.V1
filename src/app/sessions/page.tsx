"use client"

import { useEffect, useState } from 'react'
import { useAuth } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'

interface InterviewSession {
  _id: string
  userId: string
  jobPostingUrl: string
  metadata: {
    expected_keywords: string[]
    difficulty: string
    topic: string
  }
  createdAt: string
  updatedAt: string
  status: string
}

export default function SessionsPage() {
  const { isLoaded, isSignedIn } = useAuth()
  const router = useRouter()
  const [sessions, setSessions] = useState<InterviewSession[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isLoaded) return
    if (!isSignedIn) {
      router.push('/sign-in')
      return
    }

    fetchSessions()
  }, [isLoaded, isSignedIn])

  const fetchSessions = async () => {
    try {
      const response = await fetch('/api/interview-sessions')
      const data = await response.json()
      
      if (data.success) {
        setSessions(data.data)
      }
    } catch (error) {
      console.error('Error fetching sessions:', error)
    } finally {
      setLoading(false)
    }
  }

  const viewSession = (sessionId: string) => {
    router.push(`/interview?sessionId=${sessionId}`)
  }

  const createNewSession = () => {
    router.push('/interview')
  }

  if (loading) {
    return (
      <div className="min-h-screen p-8 flex items-center justify-center bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading your sessions...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-2">
              Your Interview Sessions
            </h1>
            <p className="text-gray-600">View and manage your past interview sessions</p>
          </div>
          <button
            onClick={createNewSession}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
          >
            🚀 New Interview
          </button>
        </div>

        {/* Sessions List */}
        {sessions.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-xl border border-gray-200/50 rounded-3xl p-12 text-center shadow-xl">
            <div className="text-6xl mb-4">📝</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">No Sessions Yet</h2>
            <p className="text-gray-600 mb-6">Start your first interview session to get personalized questions!</p>
            <button
              onClick={createNewSession}
              className="px-8 py-4 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white rounded-2xl font-bold text-lg shadow-2xl hover:shadow-blue-500/30 transition-all duration-300 hover:scale-105"
            >
              Get Started ✨
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sessions.map((session) => (
              <div
                key={session._id}
                className="bg-white/80 backdrop-blur-xl border border-gray-200/50 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 cursor-pointer"
                onClick={() => viewSession(session._id)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg">
                    <span className="text-white text-xl">📋</span>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    session.status === 'completed' 
                      ? 'bg-green-100 text-green-700' 
                      : session.status === 'in_progress'
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-blue-100 text-blue-700'
                  }`}>
                    {session.status}
                  </span>
                </div>

                <h3 className="font-bold text-gray-800 mb-2 line-clamp-1">
                  {session.metadata.topic || 'Interview Session'}
                </h3>
                
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {session.jobPostingUrl !== 'pending' 
                    ? session.jobPostingUrl 
                    : 'No job posting URL provided'}
                </p>

                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>
                    {new Date(session.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </span>
                  <span className="px-2 py-1 bg-gray-100 rounded-full">
                    {session.metadata.difficulty}
                  </span>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    viewSession(session._id)
                  }}
                  className="mt-4 w-full px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold text-sm hover:opacity-90 transition-opacity"
                >
                  View Session →
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
