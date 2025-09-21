"use client"

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { InterviewMetadata } from '@/types/interview'
import { motion } from 'framer-motion'

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

        const interviewDataObj = {
          metadata: metadataData.data.metadata,
          qaPairs: qaPairsData.data,
          sessionId
        }

        setInterviewData(interviewDataObj)

        // Store data in localStorage for the analysis page
        localStorage.setItem(`interview_${sessionId}`, JSON.stringify(interviewDataObj))

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

  // Redirect to analysis page
  const startAnalysis = () => {
    if (!interviewData) return
    
    // Navigate to the analysis page
    router.push(`/feedback/${sessionId}/analysis`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-blue-200/30 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute top-3/4 right-1/4 w-96 h-96 bg-purple-200/30 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-indigo-200/30 rounded-full blur-3xl animate-pulse delay-500"></div>
        </div>
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="relative z-10 text-center"
        >
          <motion.div 
            className="relative mb-8"
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <div className="w-20 h-20 mx-auto">
              <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-500 border-r-purple-500"></div>
              <div className="absolute inset-2 rounded-full border-4 border-transparent border-b-indigo-500 border-l-cyan-500"></div>
            </div>
          </motion.div>
          
          <motion.h2 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="text-3xl font-bold mb-4 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent"
          >
            Loading Interview Data
          </motion.h2>
          
          <motion.p 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="text-gray-600 text-lg"
          >
            Preparing your personalized feedback experience...
          </motion.p>
          
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
            transition={{ delay: 0.8, duration: 1.5, repeat: Infinity }}
            className="mt-8 h-1 bg-gradient-to-r from-blue-400 via-purple-400 to-indigo-400 rounded-full mx-auto max-w-xs"
          />
        </motion.div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-rose-50 to-pink-50 flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/3 left-1/4 w-64 h-64 bg-red-200/40 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-rose-200/40 rounded-full blur-3xl animate-pulse delay-700"></div>
        </div>
        
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="relative z-10 text-center max-w-md mx-4"
        >
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5, type: "spring" }}
            className="text-8xl mb-6"
          >
            ⚠️
          </motion.div>
          
          <motion.h2 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="text-3xl font-bold mb-4 bg-gradient-to-r from-red-600 via-rose-600 to-pink-600 bg-clip-text text-transparent"
          >
            Oops! Something went wrong
          </motion.h2>
          
          <motion.p 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="text-gray-700 mb-8 text-lg leading-relaxed"
          >
            {error}
          </motion.p>
          
          <motion.button
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            whileHover={{ scale: 1.05, boxShadow: "0 10px 25px rgba(239, 68, 68, 0.3)" }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.back()}
            className="px-8 py-4 bg-gradient-to-r from-red-500 to-rose-500 text-white font-semibold rounded-xl shadow-lg hover:from-red-600 hover:to-rose-600 transition-all duration-300"
          >
            Go Back
          </motion.button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-200/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-purple-200/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-0 left-1/3 w-72 h-72 bg-indigo-200/20 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>
      
      <div className="relative z-10 min-h-screen py-8">
        <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative mb-8"
        >
          <div className="bg-white/70 backdrop-blur-xl border border-gray-200/50 rounded-3xl p-8 shadow-2xl">
            <div className="text-center">
              <motion.h1 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.6 }}
                className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent"
              >
                Interview Feedback
              </motion.h1>
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ delay: 0.5, duration: 0.8 }}
                className="h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500 rounded-full mx-auto mb-4 max-w-xs"
              />
              <motion.p 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.6 }}
                className="text-gray-700 text-lg font-medium"
              >
                Session ID: <span className="text-blue-600 font-mono">{sessionId}</span>
              </motion.p>
            </div>
          </div>
        </motion.div>

        {/* Interview Summary */}
        {interviewData && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8"
          >
            {/* Metadata Card */}
            <motion.div 
              whileHover={{ scale: 1.02, y: -5 }}
              transition={{ duration: 0.3 }}
              className="bg-white/80 backdrop-blur-xl border border-gray-200/50 rounded-3xl p-8 shadow-2xl hover:shadow-3xl"
            >
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mr-4">
                  <span className="text-white text-xl">📋</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-800">Interview Details</h2>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50/80 rounded-2xl backdrop-blur-sm border border-gray-100">
                  <span className="font-medium text-gray-600">Topic:</span>
                  <span className="text-gray-800 font-semibold">{interviewData.metadata.topic}</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50/80 rounded-2xl backdrop-blur-sm border border-gray-100">
                  <span className="font-medium text-gray-600">Difficulty:</span>
                  <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
                    interviewData.metadata.difficulty === 'easy' ? 'bg-green-100 text-green-700 border border-green-200' :
                    interviewData.metadata.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700 border border-yellow-200' :
                    'bg-red-100 text-red-700 border border-red-200'
                  }`}>
                    {interviewData.metadata.difficulty}
                  </span>
                </div>
                <div className="p-4 bg-gray-50/80 rounded-2xl backdrop-blur-sm border border-gray-100">
                  <span className="font-medium text-gray-600 block mb-3">Expected Keywords:</span>
                  <div className="flex flex-wrap gap-2">
                    {interviewData.metadata.expected_keywords.map((keyword, index) => (
                      <span key={index} className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full border border-blue-200 font-medium">
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* QA Pairs Summary */}
            <motion.div 
              whileHover={{ scale: 1.02, y: -5 }}
              transition={{ duration: 0.3 }}
              className="bg-white/80 backdrop-blur-xl border border-gray-200/50 rounded-3xl p-8 shadow-2xl hover:shadow-3xl"
            >
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-teal-500 rounded-full flex items-center justify-center mr-4">
                  <span className="text-white text-xl">📊</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-800">Interview Summary</h2>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50/80 rounded-2xl backdrop-blur-sm border border-gray-100">
                  <span className="font-medium text-gray-600">Total Questions:</span>
                  <span className="text-gray-800 font-semibold text-xl">{interviewData.qaPairs.length}</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50/80 rounded-2xl backdrop-blur-sm border border-gray-100">
                  <span className="font-medium text-gray-600">Session Status:</span>
                  <span className="px-4 py-2 bg-green-100 text-green-700 text-sm rounded-full border border-green-200 font-semibold">
                    ✅ Completed
                  </span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* QA Pairs Display */}
        {interviewData && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.8 }}
            className="bg-white/80 backdrop-blur-xl border border-gray-200/50 rounded-3xl p-8 shadow-2xl mb-8"
          >
            <div className="flex items-center mb-8">
              <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center mr-4">
                <span className="text-white text-xl">💬</span>
              </div>
              <h2 className="text-3xl font-bold text-gray-800">Question & Answer Pairs</h2>
            </div>
            <div className="space-y-6">
              {interviewData.qaPairs.map((qa, index) => (
                <motion.div 
                  key={index}
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.9 + index * 0.1, duration: 0.6 }}
                  className="bg-gray-50/80 backdrop-blur-sm border border-gray-100 rounded-2xl p-6 hover:bg-gray-100/80 transition-all duration-300"
                >
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      {index + 1}
                    </div>
                    <div className="flex-1 space-y-4">
                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                        <div className="flex items-center mb-2">
                          <span className="text-blue-700 font-semibold text-sm">QUESTION</span>
                        </div>
                        <p className="text-gray-800 font-medium text-lg leading-relaxed">{qa.question}</p>
                      </div>
                      <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                        <div className="flex items-center mb-2">
                          <span className="text-green-700 font-semibold text-sm">ANSWER</span>
                        </div>
                        <p className="text-gray-700 leading-relaxed">{qa.answer}</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* AI Analysis Section */}
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0, duration: 0.8 }}
          className="relative overflow-hidden"
        >
          <div className="bg-white/80 backdrop-blur-xl border border-gray-200/50 rounded-3xl p-12 shadow-2xl text-center relative">
            {/* Animated background elements */}
            <div className="absolute inset-0 overflow-hidden rounded-3xl">
              <div className="absolute -top-10 -left-10 w-40 h-40 bg-blue-200/30 rounded-full blur-2xl animate-pulse"></div>
              <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-purple-200/30 rounded-full blur-2xl animate-pulse delay-1000"></div>
            </div>
            
            <div className="relative z-10">
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 1.2, duration: 0.6, type: "spring" }}
                className="w-20 h-20 bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500 rounded-full flex items-center justify-center mx-auto mb-6"
              >
                <span className="text-white text-3xl">🤖</span>
              </motion.div>
              
              <motion.h2 
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 1.3, duration: 0.6 }}
                className="text-4xl font-bold mb-6 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent"
              >
                AI Feedback Analysis
              </motion.h2>
              
              <motion.p 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 1.4, duration: 0.6 }}
                className="text-gray-700 text-xl mb-8 leading-relaxed max-w-2xl mx-auto"
              >
                Ready to unlock detailed insights about your interview performance? Our advanced AI system will analyze your responses and provide personalized feedback to help you excel.
              </motion.p>
              
              <motion.button
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 1.5, duration: 0.6 }}
                whileHover={{ 
                  scale: 1.05, 
                  boxShadow: "0 20px 40px rgba(59, 130, 246, 0.3)",
                  background: "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 50%, #6366f1 100%)"
                }}
                whileTap={{ scale: 0.95 }}
                onClick={startAnalysis}
                className="group relative px-12 py-6 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white rounded-2xl font-bold text-xl shadow-2xl transition-all duration-300 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <span className="relative z-10 flex items-center justify-center">
                  <span className="mr-3 text-2xl">🚀</span>
                  Start AI Analysis
                  <span className="ml-3 text-2xl">✨</span>
                </span>
              </motion.button>
              
              <motion.p 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 1.6, duration: 0.6 }}
                className="text-gray-600 mt-6 text-lg"
              >
                Experience real-time analysis with personalized insights and actionable feedback
              </motion.p>
            </div>
          </div>
        </motion.div>
        </div>
      </div>
    </div>
  )
}
