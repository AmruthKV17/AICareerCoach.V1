import { NextResponse } from 'next/server'
import { UserService } from '@/lib/userService'
import { getDatabase } from '@/lib/mongodb'

export async function GET() {
  try {
    console.log('🔍 Testing user database connection...')
    
    // Get database connection
    const db = await getDatabase()
    const usersCollection = db.collection('users')
    
    // Count total users
    const userCount = await usersCollection.countDocuments()
    console.log(`📊 Total users in database: ${userCount}`)
    
    // Get all users (limit to 10 for safety)
    const users = await usersCollection.find({}).limit(10).toArray()
    console.log('👥 Users found:', users.map(u => ({ clerkId: u.clerkId, email: u.email })))
    
    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      data: {
        totalUsers: userCount,
        users: users.map(user => ({
          clerkId: user.clerkId,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          createdAt: user.createdAt
        }))
      }
    })
  } catch (error) {
    console.error('❌ Error testing user database:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Database connection failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { clerkId, email, firstName, lastName } = body
    
    if (!clerkId || !email) {
      return NextResponse.json(
        { success: false, error: 'clerkId and email are required' },
        { status: 400 }
      )
    }
    
    console.log('🧪 Testing user creation with:', { clerkId, email, firstName, lastName })
    
    const userId = await UserService.createUser(clerkId, email, firstName, lastName)
    
    console.log('✅ Test user created with ID:', userId)
    
    return NextResponse.json({
      success: true,
      message: 'Test user created successfully',
      data: { userId }
    })
  } catch (error) {
    console.error('❌ Error creating test user:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create test user',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
