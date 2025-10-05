# User Management Setup Guide

## Overview
This application now has complete user management integration with Clerk authentication and MongoDB. Users are automatically saved to MongoDB when they sign up, and their interview sessions are linked to their user accounts.

## What Was Implemented

### 1. Database Schema
- **Users Collection**: Stores user data from Clerk
  - `clerkId`: Clerk user ID (unique identifier)
  - `email`: User's email address
  - `firstName`, `lastName`: User's name
  - `imageUrl`: Profile image URL
  - `createdAt`, `updatedAt`: Timestamps

- **Interview Sessions Collection** (Updated):
  - Added `userId` field to link sessions to users
  - Each session is now associated with a specific user

### 2. New Services

#### UserService (`src/lib/userService.ts`)
- `createUser()`: Create new user in MongoDB
- `getUserByClerkId()`: Fetch user by Clerk ID
- `getUserById()`: Fetch user by MongoDB ID
- `updateUser()`: Update user information
- `deleteUser()`: Delete user from database
- `getOrCreateUser()`: Ensure user exists (creates if not found)

#### InterviewService (Updated)
- `createInterviewSession()`: Now requires `userId` parameter
- `getUserInterviewSessions()`: Fetch all sessions for a specific user

### 3. API Endpoints

#### Webhook Endpoint (`/api/webhooks/clerk`)
Automatically syncs user data from Clerk to MongoDB:
- **user.created**: Creates user in MongoDB when they sign up
- **user.updated**: Updates user data when changed in Clerk
- **user.deleted**: Removes user from MongoDB when deleted

#### Interview Sessions API (Updated)
- **GET `/api/interview-sessions`**: Now returns only the authenticated user's sessions
- **POST `/api/interview-sessions`**: Creates session linked to authenticated user

### 4. Authentication Flow
- Home page (`/`) is public (no auth required)
- Interview page (`/interview`) requires authentication
- Unauthenticated users are redirected to sign-in page
- Sessions are automatically created for authenticated users

## Setup Instructions

### Step 1: Install Required Package
Run this command to install the Svix package for webhook verification:
```bash
npm install svix
```

### Step 2: Configure Clerk Webhook

1. **Go to Clerk Dashboard**: https://dashboard.clerk.com
2. **Navigate to**: Your Application → Webhooks
3. **Click**: "Add Endpoint"
4. **Set Endpoint URL**: `https://your-domain.com/api/webhooks/clerk`
   - For local development: `http://localhost:3000/api/webhooks/clerk`
   - You may need to use a tool like ngrok for local webhook testing
5. **Subscribe to Events**:
   - ✅ `user.created`
   - ✅ `user.updated`
   - ✅ `user.deleted`
6. **Copy the Signing Secret**

### Step 3: Update Environment Variables

Add to your `.env.local` file:
```env
# Existing Clerk variables
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_publishable_key
CLERK_SECRET_KEY=your_secret_key

# Add this new variable
CLERK_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx

# Existing MongoDB variable
MONGODB_URI=your_mongodb_connection_string
```

### Step 4: Test the Integration

1. **Start your development server**:
   ```bash
   npm run dev
   ```

2. **Sign up a new user**:
   - Go to http://localhost:3000
   - Click "Sign Up"
   - Complete the sign-up process

3. **Verify in MongoDB**:
   - Check your MongoDB database
   - You should see a new document in the `users` collection
   - The `clerkId` should match the Clerk user ID

4. **Create an interview session**:
   - Navigate to `/interview`
   - Create a new interview session
   - Check MongoDB - the session should have a `userId` field

## Database Structure

### Users Collection
```javascript
{
  _id: ObjectId("..."),
  clerkId: "user_2abc123...",
  email: "user@example.com",
  firstName: "John",
  lastName: "Doe",
  imageUrl: "https://...",
  createdAt: ISODate("2025-10-02T06:00:00Z"),
  updatedAt: ISODate("2025-10-02T06:00:00Z")
}
```

### Interview Sessions Collection
```javascript
{
  _id: ObjectId("..."),
  userId: "user_2abc123...",  // Links to user's clerkId
  jobPostingUrl: "https://...",
  metadata: {
    expected_keywords: [...],
    difficulty: "medium",
    topic: "Interview"
  },
  questions: {...},
  qaPairs: [...],
  createdAt: ISODate("2025-10-02T06:00:00Z"),
  updatedAt: ISODate("2025-10-02T06:00:00Z"),
  status: "generated"
}
```

## Key Features

### 🔐 Automatic User Sync
- Users are automatically created in MongoDB when they sign up via Clerk
- User data stays in sync through webhooks
- No manual user management required

### 📊 User-Specific Sessions
- Each interview session is linked to a user
- Users can only see their own sessions
- Sessions persist across devices and browsers

### 🛡️ Security
- All API routes are protected with Clerk authentication
- Webhook endpoint verifies requests using Svix
- Users can only access their own data

### 🔄 Data Flow
1. User signs up → Clerk creates account
2. Clerk webhook fires → User saved to MongoDB
3. User creates interview session → Session linked to userId
4. User fetches sessions → Only their sessions returned

## Troubleshooting

### Webhook Not Firing
- Ensure webhook URL is correct and accessible
- Check Clerk dashboard for webhook delivery logs
- For local development, use ngrok or similar tunneling service

### User Not Created in MongoDB
- Check webhook secret is correct in `.env.local`
- Verify MongoDB connection string is valid
- Check server logs for error messages

### Sessions Not Linked to User
- Ensure user is authenticated when creating session
- Check that `userId` is being passed to `createInterviewSession()`
- Verify Clerk authentication is working properly

## Migration Notes

### For Existing Sessions
If you have existing interview sessions without a `userId`, you'll need to either:
1. Delete them (if test data)
2. Manually add `userId` field to existing documents
3. Create a migration script to assign sessions to users

Example migration query:
```javascript
// In MongoDB shell or Compass
db.interview_sessions.updateMany(
  { userId: { $exists: false } },
  { $set: { userId: "default_user_id" } }
)
```

## Next Steps

### Recommended Enhancements
1. **User Dashboard**: Create a page showing user's interview history
2. **Session Sharing**: Allow users to share sessions with others
3. **Analytics**: Track user engagement and session completion rates
4. **Export Data**: Allow users to export their interview data
5. **User Settings**: Let users manage their profile and preferences

## Support
For issues or questions, check:
- Clerk Documentation: https://clerk.com/docs
- MongoDB Documentation: https://docs.mongodb.com
- Next.js Documentation: https://nextjs.org/docs
