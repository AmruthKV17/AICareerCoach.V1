import { ObjectId } from 'mongodb'

export interface User {
  _id?: ObjectId
  clerkId: string // Clerk user ID
  email: string
  firstName?: string
  lastName?: string
  imageUrl?: string
  createdAt: Date
  updatedAt: Date
}
