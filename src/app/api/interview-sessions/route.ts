import { NextResponse } from 'next/server'
import { InterviewService } from '@/lib/interviewService'
import { InterviewMetadata } from '@/types/interview'
import { auth, currentUser } from '@clerk/nextjs/server'
import { UserService } from '@/lib/userService'

export async function GET() {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user's interview sessions
    const sessions = await InterviewService.getUserInterviewSessions(userId)
    
    return NextResponse.json({
      success: true,
      data: sessions
    })
  } catch (error) {
    console.error('Error fetching interview sessions:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch interview sessions' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    console.log('📝 POST /api/interview-sessions - Starting...')
    const { userId } = await auth()

    if (!userId) {
      console.log('❌ No userId from auth()')
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('✅ Authenticated user:', userId)

    // Get user info from Clerk and ensure user exists in database
    const user = await currentUser()
    console.log('👤 User data from Clerk:', {
      id: userId,
      email: user?.emailAddresses[0]?.emailAddress,
      firstName: user?.firstName,
      lastName: user?.lastName
    })

    const createdUser = await UserService.getOrCreateUser(
      userId,
      user?.emailAddresses[0]?.emailAddress || '',
      user?.firstName || undefined,
      user?.lastName || undefined,
      user?.imageUrl || undefined
    )

    if (createdUser) {
      console.log('✅ User ensured in MongoDB:', createdUser.clerkId)
    } else {
      console.log('⚠️ User creation/retrieval returned null')
    }

    const body = await request.json()
    const { jobPostingUrl, metadata } = body

    if (!jobPostingUrl || !metadata) {
      return NextResponse.json(
        { success: false, error: 'Job posting URL and metadata are required' },
        { status: 400 }
      )
    }

    console.log('📊 Creating interview session with userId:', userId)
    const sessionId = await InterviewService.createInterviewSession(
      userId,
      jobPostingUrl,
      metadata as InterviewMetadata
    )

    console.log('✅ Session created with ID:', sessionId)

    const session = await InterviewService.getInterviewSession(sessionId)

    console.log('✅ Interview session created for user:', userId)
    console.log('📄 Session data:', JSON.stringify(session, null, 2))

    return NextResponse.json({
      success: true,
      data: session,
      sessionId: sessionId
    })
  } catch (error) {
    console.error('Error creating interview session:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create interview session' },
      { status: 500 }
    )
  }
}
