import { getDatabase } from './mongodb'
import { InterviewSession, InterviewQuestion, InterviewMetadata } from '@/types/interview'
import { ObjectId } from 'mongodb'

export class InterviewService {
  private static async getCollection() {
    const db = await getDatabase()
    return db.collection<InterviewSession>('interview_sessions')
  }

  static async createInterviewSession(
    jobPostingUrl: string,
    metadata: InterviewMetadata
  ): Promise<string> {
    const collection = await this.getCollection()
    
    const interviewSession: Omit<InterviewSession, '_id'> = {
      jobPostingUrl,
      metadata,
      qaPairs: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'generated'
    }

    const result = await collection.insertOne(interviewSession)
    return result.insertedId.toString()
  }

  static async getInterviewSession(sessionId: string): Promise<InterviewSession | null> {
    const collection = await this.getCollection()
    
    try {
      const session = await collection.findOne({ _id: new ObjectId(sessionId) })
      return session
    } catch (error) {
      console.error('Error fetching interview session:', error)
      return null
    }
  }

  static async getAllInterviewSessions(): Promise<InterviewSession[]> {
    const collection = await this.getCollection()
    
    try {
      const sessions = await collection
        .find({})
        .sort({ createdAt: -1 })
        .toArray()
      return sessions
    } catch (error) {
      console.error('Error fetching interview sessions:', error)
      return []
    }
  }

  static async updateInterviewSessionStatus(
    sessionId: string,
    status: 'generated' | 'in_progress' | 'completed'
  ): Promise<boolean> {
    const collection = await this.getCollection()
    
    try {
      const result = await collection.updateOne(
        { _id: new ObjectId(sessionId) },
        { 
          $set: { 
            status,
            updatedAt: new Date()
          }
        }
      )
      return result.modifiedCount > 0
    } catch (error) {
      console.error('Error updating interview session:', error)
      return false
    }
  }

  static async deleteInterviewSession(sessionId: string): Promise<boolean> {
    const collection = await this.getCollection()
    
    try {
      const result = await collection.deleteOne({ _id: new ObjectId(sessionId) })
      return result.deletedCount > 0
    } catch (error) {
      console.error('Error deleting interview session:', error)
      return false
    }
  }

  static async saveQAPairs(sessionId: string, qaPairs: Array<{ question: string, answer: string }>): Promise<boolean> {
    const collection = await this.getCollection()
    
    try {
      const result = await collection.updateOne(
        { _id: new ObjectId(sessionId) },
        { 
          $set: { 
            qaPairs: qaPairs,
            updatedAt: new Date(),
            status: 'completed'
          }
        }
      )
      return result.modifiedCount > 0
    } catch (error) {
      console.error('Error saving QA pairs:', error)
      return false
    }
  }

  static async getQAPairs(sessionId: string): Promise<Array<{ question: string, answer: string }> | null> {
    const collection = await this.getCollection()
    
    try {
      const session = await collection.findOne(
        { _id: new ObjectId(sessionId) },
        { projection: { qaPairs: 1 } }
      )
      return session?.qaPairs || null
    } catch (error) {
      console.error('Error fetching QA pairs:', error)
      return null
    }
  }

  static async getInterviewMetadata(sessionId: string): Promise<InterviewMetadata | null> {
    const collection = await this.getCollection()
    
    try {
      const session = await collection.findOne(
        { _id: new ObjectId(sessionId) },
        { projection: { metadata: 1, jobPostingUrl: 1, createdAt: 1, status: 1 } }
      )
      return session?.metadata || null
    } catch (error) {
      console.error('Error fetching interview metadata:', error)
      return null
    }
  }
}
