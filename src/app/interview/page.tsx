"use client"

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import InterviewQuestionsGenerator from "@/components/InterviewQuestionsGenerator"
import { SessionUtils } from '@/lib/sessionUtils'

export default function InterviewPage() {
  const searchParams = useSearchParams()
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [isCreatingSession, setIsCreatingSession] = useState(true)

  useEffect(() => {
    const initializeSession = async () => {
      try {
        // Check URL params first
        const urlSessionId = searchParams.get('sessionId')
        
        if (urlSessionId) {
          // Use session from URL
          console.log('Using session from URL:', urlSessionId)
          setSessionId(urlSessionId)
          SessionUtils.setSessionId(urlSessionId)
          setIsCreatingSession(false)
          return
        }

        // Check local storage
        const storedSessionId = SessionUtils.getSessionId()
        
        if (storedSessionId) {
          // Verify the session exists in database
          const response = await fetch(`/api/interview-sessions/${storedSessionId}`)
          const data = await response.json()
          
          if (data.success) {
            console.log('Using existing session from storage:', storedSessionId)
            setSessionId(storedSessionId)
            setIsCreatingSession(false)
            return
          } else {
            // Session doesn't exist, clear it
            SessionUtils.clearSessionId()
          }
        }

        // No valid session found, create a new one
        console.log('Creating new interview session')
        const createResponse = await fetch('/api/interview-sessions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            jobPostingUrl: 'pending', // Will be updated when user submits
            metadata: {
              expected_keywords: [],
              difficulty: 'medium',
              topic: 'Interview'
            }
          })
        })

        const createData = await createResponse.json()
        
        if (createData.success && createData.data?._id) {
          const newSessionId = createData.data._id.toString()
          console.log('New session created:', newSessionId)
          setSessionId(newSessionId)
          SessionUtils.setSessionId(newSessionId)
        }
      } catch (error) {
        console.error('Error initializing session:', error)
      } finally {
        setIsCreatingSession(false)
      }
    }

    initializeSession()
  }, [searchParams])

  if (isCreatingSession) {
    return (
      <div className="min-h-screen p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Initializing session...</p>
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