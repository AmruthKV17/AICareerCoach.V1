# ✅ Webhook Setup - Complete Checklist

## What We Fixed

1. ✅ **Sign-in redirect** - Users now redirect to `/interview` after signing in
2. ✅ **Sign-up redirect** - Users now redirect to `/interview` after signing up
3. ✅ **Comprehensive logging** - Added detailed logs to track user creation
4. ✅ **Webhook endpoint** - Ready to receive Clerk events

## Current Status

### ✅ Completed
- Middleware configured for public/protected routes
- User and InterviewSession schemas with userId field
- UserService with all CRUD operations
- InterviewService updated to link sessions to users
- Webhook endpoint created at `/api/webhooks/clerk`
- Sign-in/Sign-up pages with proper redirects
- Detailed logging for debugging

### 🔄 Next Steps (Do These Now)

#### 1. Make Sure ngrok is Running on Port 3000

Stop the current ngrok (running on port 80) and restart on port 3000:

```bash
# In a separate terminal
ngrok http 3000
```

You should see something like:
```
Forwarding    https://abc123.ngrok-free.app -> http://localhost:3000
```

**Copy this URL!**

#### 2. Configure Clerk Webhook

1. Go to: https://dashboard.clerk.com
2. Select your application
3. Click **Webhooks** in sidebar
4. Click **"+ Add Endpoint"**
5. **Endpoint URL**: `https://your-ngrok-url.ngrok-free.app/api/webhooks/clerk`
   - Example: `https://abc123.ngrok-free.app/api/webhooks/clerk`
6. **Subscribe to events**:
   - ✅ `user.created`
   - ✅ `user.updated`
   - ✅ `user.deleted`
7. Click **"Create"**
8. **Copy the Signing Secret** (starts with `whsec_...`)

#### 3. Add Webhook Secret to .env.local

Open `.env.local` and add:
```env
CLERK_WEBHOOK_SECRET=whsec_your_secret_here
```

Your complete `.env.local` should have:
```env
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...

# MongoDB
MONGODB_URI=mongodb+srv://...

# Other API keys
CREWAI_API_KEY2=...
NEXT_PUBLIC_VAPI_PUBLIC_KEY=...
```

#### 4. Restart Dev Server

Stop your dev server (Ctrl+C) and restart:
```bash
npm run dev
```

## Testing the Complete Flow

### Test 1: Sign Up New User

1. **Go to**: http://localhost:3000
2. **Click**: "Sign Up"
3. **Fill in**: Email and password
4. **Complete**: Sign up process
5. **Expected**: 
   - Redirected to `/interview` page
   - Terminal shows: `✅ User created in MongoDB: user_xxx`
   - MongoDB `users` collection has new user

### Test 2: Create Interview Session

1. **On** `/interview` page
2. **Wait** for session initialization
3. **Check terminal** for logs:
   ```
   📝 POST /api/interview-sessions - Starting...
   ✅ Authenticated user: user_xxx
   👤 User data from Clerk: { ... }
   🔍 Checking if user exists: user_xxx
   ✅ User already exists in MongoDB
   💾 Inserting interview session into MongoDB: { userId: 'user_xxx', ... }
   ✅ Interview session inserted with _id: xxx
   ```
4. **Check MongoDB**:
   - `interview_sessions` collection has session with `userId` field

### Test 3: Verify Webhook

1. **Go to**: Clerk Dashboard → Webhooks → Your endpoint
2. **Check**: Delivery logs
3. **Expected**: 
   - Status: 200 (success)
   - Event: `user.created`
   - Timestamp: Recent

## Verification Checklist

- [ ] ngrok running on port 3000
- [ ] ngrok URL copied
- [ ] Webhook configured in Clerk Dashboard
- [ ] Webhook secret added to `.env.local`
- [ ] Dev server restarted
- [ ] New user can sign up
- [ ] User redirects to `/interview` after sign up
- [ ] Terminal shows user creation logs
- [ ] MongoDB `users` collection has user
- [ ] Interview session created with `userId`
- [ ] Clerk webhook shows successful delivery

## Expected Terminal Output

When everything is working, you'll see:

```bash
# When user signs up (webhook fires)
✅ User created in MongoDB: user_2abc123...

# When user creates interview session
📝 POST /api/interview-sessions - Starting...
✅ Authenticated user: user_2abc123...
👤 User data from Clerk: { id: 'user_2abc123...', email: 'user@example.com', ... }
🔍 Checking if user exists: user_2abc123...
✅ User already exists in MongoDB
📊 Creating interview session with userId: user_2abc123...
💾 Inserting interview session into MongoDB: { userId: 'user_2abc123...', ... }
✅ Interview session inserted with _id: 507f1f77bcf86cd799439011
✅ Interview session created for user: user_2abc123...
```

## MongoDB Collections

### users
```json
{
  "_id": ObjectId("..."),
  "clerkId": "user_2abc123...",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "imageUrl": "https://...",
  "createdAt": ISODate("..."),
  "updatedAt": ISODate("...")
}
```

### interview_sessions
```json
{
  "_id": ObjectId("..."),
  "userId": "user_2abc123...",  // ← Links to user's clerkId
  "jobPostingUrl": "pending",
  "metadata": { ... },
  "qaPairs": [],
  "createdAt": ISODate("..."),
  "updatedAt": ISODate("..."),
  "status": "generated"
}
```

## Troubleshooting

### No logs appearing
- Check ngrok is running on port 3000 (not 80)
- Verify webhook URL matches ngrok URL
- Check webhook secret is correct

### User not created in MongoDB
- Check Clerk webhook delivery logs for errors
- Verify MongoDB connection string
- Check terminal for error messages

### Session created without userId
- This shouldn't happen anymore
- Check terminal logs for authentication errors
- Verify user is signed in

## Important Notes

⚠️ **ngrok URL Changes**: Free ngrok URLs change on restart. Update Clerk webhook URL when this happens.

💡 **Keep Terminals Open**: 
- Terminal 1: `npm run dev`
- Terminal 2: `ngrok http 3000`

🔒 **Security**: Never commit `.env.local` to git. It contains sensitive keys.

## Success! 🎉

Once you see:
- ✅ Users in MongoDB `users` collection
- ✅ Sessions with `userId` in `interview_sessions` collection
- ✅ Successful webhook deliveries in Clerk Dashboard
- ✅ All logs showing in terminal

Your user management system is fully operational!
