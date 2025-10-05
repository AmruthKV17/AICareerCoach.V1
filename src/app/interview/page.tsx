"use client"
import { useAuth } from "@clerk/clerk-react";
import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import InterviewQuestionsGenerator from "@/components/InterviewQuestionsGenerator"
import { SessionUtils } from '@/lib/sessionUtils'

export default function InterviewPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const { isLoaded, isSignedIn, userId, getToken } = useAuth()

  useEffect(() => {
    if (!isLoaded) return
    
    if (!isSignedIn) {
      router.push('/sign-in')
      return
    }

    // Check if viewing an existing session via URL parameter
    const urlSessionId = searchParams.get('sessionId')
    
    if (urlSessionId) {
      // User wants to view a specific existing session
      console.log('📖 Viewing existing session from URL:', urlSessionId)
      setSessionId(urlSessionId)
      SessionUtils.setSessionId(urlSessionId)
    } else {
      // No URL parameter - user will create session when generating questions
      console.log('👤 User authenticated, ready to generate questions')
      // Clear any old session from localStorage
      SessionUtils.clearSessionId()
      setSessionId(null)
    }
    
    setIsCheckingAuth(false)
  }, [isLoaded, isSignedIn, searchParams])

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-8">
      <InterviewQuestionsGenerator initialSessionId={sessionId || undefined} />
    </div>
  )
}