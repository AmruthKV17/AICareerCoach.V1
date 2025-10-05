import { getDatabase } from './mongodb'
import { InterviewSession, InterviewQuestion, InterviewMetadata } from '@/types/interview'
import { InterviewQuestions } from '@/types/questions'
import { ObjectId } from 'mongodb'

export class InterviewService {
  private static async getCollection() {
    const db = await getDatabase()
    return db.collection<InterviewSession>('interview_sessions')
  }

  static async createInterviewSession(
    userId: string,
    jobPostingUrl: string,
    metadata: InterviewMetadata
  ): Promise<string> {
    const collection = await this.getCollection()
    
    const interviewSession: Omit<InterviewSession, '_id'> = {
      userId,
      jobPostingUrl,
      metadata,
      qaPairs: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'generated'
    }

    console.log('💾 Inserting interview session into MongoDB:', {
      userId,
      jobPostingUrl,
      status: interviewSession.status
    })
    const result = await collection.insertOne(interviewSession)
    console.log('✅ Interview session inserted with _id:', result.insertedId.toString())
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

  static async getUserInterviewSessions(userId: string): Promise<InterviewSession[]> {
    const collection = await this.getCollection()
    
    try {
      const sessions = await collection
        .find({ userId })
        .sort({ createdAt: -1 })
        .toArray()
      return sessions
    } catch (error) {
      console.error('Error fetching user interview sessions:', error)
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

  static async saveQuestions(sessionId: string, questions: InterviewQuestions): Promise<boolean> {
    const collection = await this.getCollection()
    
    try {
      const result = await collection.updateOne(
        { _id: new ObjectId(sessionId) },
        { 
          $set: { 
            questions: questions,
            updatedAt: new Date()
          }
        }
      )
      return result.modifiedCount > 0 || result.matchedCount > 0
    } catch (error) {
      console.error('Error saving questions:', error)
      return false
    }
  }

  static async updateSessionWithQuestions(
    sessionId: string, 
    jobPostingUrl: string,
    metadata: InterviewMetadata,
    questions: InterviewQuestions
  ): Promise<boolean> {
    const collection = await this.getCollection()
    
    try {
      const result = await collection.updateOne(
        { _id: new ObjectId(sessionId) },
        { 
          $set: { 
            jobPostingUrl: jobPostingUrl,
            metadata: metadata,
            questions: questions,
            updatedAt: new Date()
          }
        }
      )
      return result.modifiedCount > 0 || result.matchedCount > 0
    } catch (error) {
      console.error('Error updating session with questions:', error)
      return false
    }
  }

  static async getQuestions(sessionId: string): Promise<InterviewQuestions | null> {
    console.log(sessionId);
    
    const collection = await this.getCollection()
    
    try {
      const session = await collection.findOne(
        { _id: new ObjectId(sessionId) },
        { projection: { questions: 1 } }
      )
      return session?.questions || null
    } catch (error) {
      console.error('Error fetching questions:', error)
      return null
    }
  }

  static async saveAnalysis(sessionId: string, analysis: any): Promise<boolean> {
    const collection = await this.getCollection()
    
    try {
      console.log('💾 Saving analysis for session:', sessionId)
      const result = await collection.updateOne(
        { _id: new ObjectId(sessionId) },
        { 
          $set: { 
            analysis: analysis,
            updatedAt: new Date()
          }
        }
      )
      console.log('✅ Analysis saved successfully')
      return result.modifiedCount > 0 || result.matchedCount > 0
    } catch (error) {
      console.error('Error saving analysis:', error)
      return false
    }
  }

  static async getAnalysis(sessionId: string): Promise<any | null> {
    const collection = await this.getCollection()
    
    try {
      console.log('🔍 Fetching analysis for session:', sessionId)
      const session = await collection.findOne(
        { _id: new ObjectId(sessionId) },
        { projection: { analysis: 1 } }
      )
      if (session?.analysis) {
        console.log('✅ Analysis found in database')
      } else {
        console.log('❌ No analysis found in database')
      }
      return session?.analysis || null
    } catch (error) {
      console.error('Error fetching analysis:', error)
      return null
    }
  }
}
