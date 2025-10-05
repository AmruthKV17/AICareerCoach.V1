import { getDatabase } from './mongodb'
import { User } from '@/types/user'
import { ObjectId } from 'mongodb'

export class UserService {
  private static async getCollection() {
    const db = await getDatabase()
    return db.collection<User>('users')
  }

  /**
   * Create a new user from Clerk data
   */
  static async createUser(
    clerkId: string,
    email: string,
    firstName?: string,
    lastName?: string,
    imageUrl?: string
  ): Promise<string> {
    const collection = await this.getCollection()
    
    const user: Omit<User, '_id'> = {
      clerkId,
      email,
      firstName,
      lastName,
      imageUrl,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    console.log('👥 Creating user in MongoDB:', { clerkId, email, firstName, lastName })
    const result = await collection.insertOne(user)
    console.log('✅ User created with MongoDB _id:', result.insertedId.toString())
    return result.insertedId.toString()
  }

  /**
   * Get user by Clerk ID
   */
  static async getUserByClerkId(clerkId: string): Promise<User | null> {
    const collection = await this.getCollection()
    
    try {
      const user = await collection.findOne({ clerkId })
      return user
    } catch (error) {
      console.error('Error fetching user by Clerk ID:', error)
      return null
    }
  }

  /**
   * Get user by MongoDB _id
   */
  static async getUserById(userId: string): Promise<User | null> {
    const collection = await this.getCollection()
    
    try {
      const user = await collection.findOne({ _id: new ObjectId(userId) })
      return user
    } catch (error) {
      console.error('Error fetching user by ID:', error)
      return null
    }
  }

  /**
   * Update user information
   */
  static async updateUser(
    clerkId: string,
    updates: Partial<Omit<User, '_id' | 'clerkId' | 'createdAt'>>
  ): Promise<boolean> {
    const collection = await this.getCollection()
    
    try {
      const result = await collection.updateOne(
        { clerkId },
        { 
          $set: { 
            ...updates,
            updatedAt: new Date()
          }
        }
      )
      return result.modifiedCount > 0 || result.matchedCount > 0
    } catch (error) {
      console.error('Error updating user:', error)
      return false
    }
  }

  /**
   * Delete user
   */
  static async deleteUser(clerkId: string): Promise<boolean> {
    const collection = await this.getCollection()
    
    try {
      const result = await collection.deleteOne({ clerkId })
      return result.deletedCount > 0
    } catch (error) {
      console.error('Error deleting user:', error)
      return false
    }
  }

  /**
   * Get or create user (useful for ensuring user exists)
   */
  static async getOrCreateUser(
    clerkId: string,
    email: string,
    firstName?: string,
    lastName?: string,
    imageUrl?: string
  ): Promise<User | null> {
    console.log('🔍 Checking if user exists:', clerkId)
    let user = await this.getUserByClerkId(clerkId)
    
    if (!user) {
      console.log('❌ User not found, creating new user...')
      await this.createUser(clerkId, email, firstName, lastName, imageUrl)
      user = await this.getUserByClerkId(clerkId)
      if (user) {
        console.log('✅ User successfully created and retrieved')
      } else {
        console.log('⚠️ User creation succeeded but retrieval failed')
      }
    } else {
      console.log('✅ User already exists in MongoDB')
    }
    
    return user
  }
}
