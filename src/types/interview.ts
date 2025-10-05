import { ObjectId } from 'mongodb'
import { InterviewQuestions } from './questions'

export interface InterviewQuestion {
  id: string
  question: string
  difficulty: 'easy' | 'medium' | 'hard'
  category: string
  expectedAnswer?: string
  tips?: string[]
}

export interface InterviewMetadata {
  expected_keywords: string[]
  difficulty: 'easy' | 'medium' | 'hard'
  topic: string
}

export interface InterviewSession {
  _id?: ObjectId
  userId: string // Clerk user ID
  jobPostingUrl: string
  metadata: InterviewMetadata
  questions?: InterviewQuestions
  qaPairs?: Array<{ question: string, answer: string }>
  analysis?: any // Stores the AI-generated analysis result
  createdAt: Date
  updatedAt: Date
  status: 'generated' | 'in_progress' | 'completed'
  sessionId?: string
}
