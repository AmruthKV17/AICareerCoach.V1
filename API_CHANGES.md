# API Changes Summary

## Breaking Changes

### Interview Session Creation
**Before:**
```typescript
InterviewService.createInterviewSession(
  jobPostingUrl: string,
  metadata: InterviewMetadata
)
```

**After:**
```typescript
InterviewService.createInterviewSession(
  userId: string,        // NEW: Required Clerk user ID
  jobPostingUrl: string,
  metadata: InterviewMetadata
)
```

### Interview Session Schema
**Before:**
```typescript
interface InterviewSession {
  _id?: ObjectId
  jobPostingUrl: string
  metadata: InterviewMetadata
  // ... other fields
}
```

**After:**
```typescript
interface InterviewSession {
  _id?: ObjectId
  userId: string         // NEW: Clerk user ID
  jobPostingUrl: string
  metadata: InterviewMetadata
  // ... other fields
}
```

## New API Endpoints

### Webhook Endpoint
- **URL**: `/api/webhooks/clerk`
- **Method**: POST
- **Purpose**: Sync user data from Clerk to MongoDB
- **Authentication**: Svix webhook signature verification
- **Events Handled**:
  - `user.created`
  - `user.updated`
  - `user.deleted`

## Updated API Endpoints

### GET `/api/interview-sessions`
**Before**: Returned all interview sessions

**After**: 
- Requires authentication
- Returns only the authenticated user's sessions
- Returns 401 if not authenticated

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "userId": "user_2abc123...",
      "jobPostingUrl": "...",
      "metadata": {...},
      "createdAt": "...",
      "updatedAt": "...",
      "status": "generated"
    }
  ]
}
```

### POST `/api/interview-sessions`
**Before**: Created session without user association

**After**:
- Requires authentication
- Automatically links session to authenticated user
- Creates user in MongoDB if doesn't exist
- Returns 401 if not authenticated

**Request Body:**
```json
{
  "jobPostingUrl": "https://...",
  "metadata": {
    "expected_keywords": [],
    "difficulty": "medium",
    "topic": "Interview"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "userId": "user_2abc123...",
    "jobPostingUrl": "...",
    "metadata": {...},
    "createdAt": "...",
    "updatedAt": "...",
    "status": "generated"
  },
  "sessionId": "..."
}
```

## New Service Methods

### UserService
```typescript
// Create new user
UserService.createUser(
  clerkId: string,
  email: string,
  firstName?: string,
  lastName?: string,
  imageUrl?: string
): Promise<string>

// Get user by Clerk ID
UserService.getUserByClerkId(clerkId: string): Promise<User | null>

// Get user by MongoDB ID
UserService.getUserById(userId: string): Promise<User | null>

// Update user
UserService.updateUser(
  clerkId: string,
  updates: Partial<User>
): Promise<boolean>

// Delete user
UserService.deleteUser(clerkId: string): Promise<boolean>

// Get or create user (ensures user exists)
UserService.getOrCreateUser(
  clerkId: string,
  email: string,
  firstName?: string,
  lastName?: string,
  imageUrl?: string
): Promise<User | null>
```

### InterviewService (New Methods)
```typescript
// Get all sessions for a specific user
InterviewService.getUserInterviewSessions(
  userId: string
): Promise<InterviewSession[]>
```

## Authentication Flow

### Protected Routes
All routes except the following require authentication:
- `/` (home page)
- `/sign-in`
- `/sign-up`
- `/api/webhooks/*`

### Client-Side Authentication Check
The interview page now checks authentication:
```typescript
const { isLoaded, isSignedIn, userId } = useAuth()

if (!isLoaded) {
  // Show loading state
}

if (!isSignedIn) {
  // Redirect to sign-in
  router.push('/sign-in')
}
```

### Server-Side Authentication
API routes use Clerk's `auth()` helper:
```typescript
import { auth } from '@clerk/nextjs/server'

const { userId } = await auth()

if (!userId) {
  return NextResponse.json(
    { success: false, error: 'Unauthorized' },
    { status: 401 }
  )
}
```

## Migration Guide

### For Existing Code

If you have code that creates interview sessions, update it:

**Before:**
```typescript
const sessionId = await InterviewService.createInterviewSession(
  jobPostingUrl,
  metadata
)
```

**After:**
```typescript
import { auth } from '@clerk/nextjs/server'

const { userId } = await auth()
if (!userId) throw new Error('Unauthorized')

const sessionId = await InterviewService.createInterviewSession(
  userId,
  jobPostingUrl,
  metadata
)
```

### For Existing Database Documents

Run this MongoDB query to add userId to existing sessions:
```javascript
db.interview_sessions.updateMany(
  { userId: { $exists: false } },
  { $set: { userId: "PLACEHOLDER_USER_ID" } }
)
```

Replace `PLACEHOLDER_USER_ID` with an actual Clerk user ID or delete old test sessions.

## Environment Variables Required

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...

# MongoDB
MONGODB_URI=mongodb+srv://...
```

## Testing Checklist

- [ ] Install svix package: `npm install svix`
- [ ] Add `CLERK_WEBHOOK_SECRET` to `.env.local`
- [ ] Configure webhook in Clerk dashboard
- [ ] Test user sign-up (check MongoDB users collection)
- [ ] Test interview session creation (verify userId field)
- [ ] Test fetching sessions (only user's sessions returned)
- [ ] Test authentication redirect on interview page
- [ ] Verify webhook events in Clerk dashboard
