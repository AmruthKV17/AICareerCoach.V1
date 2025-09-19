import { ObjectId } from 'mongodb'

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
  jobPostingUrl: string
  metadata: InterviewMetadata
  qaPairs?: Array<{ question: string, answer: string }>
  createdAt: Date
  updatedAt: Date
  status: 'generated' | 'in_progress' | 'completed'
  sessionId?: string
}
