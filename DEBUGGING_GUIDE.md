# Debugging Guide - User & Session Creation

## Issue: Users not being created in MongoDB

### Step-by-Step Debugging

#### 1. Check Server Logs

After signing in and navigating to `/interview`, you should see these logs in your terminal:

```
📝 POST /api/interview-sessions - Starting...
✅ Authenticated user: user_2abc123...
👤 User data from Clerk: { id: 'user_2abc123...', email: 'user@example.com', ... }
🔍 Checking if user exists: user_2abc123...
❌ User not found, creating new user...
👥 Creating user in MongoDB: { clerkId: 'user_2abc123...', email: '...', ... }
✅ User created with MongoDB _id: 507f1f77bcf86cd799439011
✅ User successfully created and retrieved
✅ User ensured in MongoDB: user_2abc123...
📊 Creating interview session with userId: user_2abc123...
💾 Inserting interview session into MongoDB: { userId: 'user_2abc123...', ... }
✅ Interview session inserted with _id: 507f1f77bcf86cd799439012
✅ Session created with ID: 507f1f77bcf86cd799439012
✅ Interview session created for user: user_2abc123...
📄 Session data: { ... }
```

#### 2. What Each Log Means

| Log | Meaning | What to Check |
|-----|---------|---------------|
| `📝 POST /api/interview-sessions` | API endpoint called | ✅ Interview page is working |
| `✅ Authenticated user` | Clerk auth successful | ✅ User is signed in |
| `👤 User data from Clerk` | User info retrieved | ✅ Clerk integration working |
| `🔍 Checking if user exists` | Looking for user in DB | Check MongoDB connection |
| `👥 Creating user in MongoDB` | Inserting new user | Check MongoDB write permissions |
| `✅ User created with MongoDB _id` | User inserted successfully | ✅ User should be in DB |
| `💾 Inserting interview session` | Creating session | Check session has userId |
| `✅ Interview session inserted` | Session saved | ✅ Session should be in DB |

#### 3. Common Issues & Solutions

##### Issue: No logs appearing
**Problem**: API endpoint not being called
**Solution**: 
- Check browser console for errors
- Verify you're on the `/interview` page
- Check network tab for failed requests

##### Issue: "❌ No userId from auth()"
**Problem**: User not authenticated
**Solution**:
- Sign out and sign in again
- Clear browser cookies
- Check Clerk configuration in `.env.local`

##### Issue: MongoDB connection errors
**Problem**: Can't connect to MongoDB
**Solution**:
- Verify `MONGODB_URI` in `.env.local`
- Check MongoDB Atlas network access (allow your IP)
- Test connection with MongoDB Compass

##### Issue: User created but not found in MongoDB
**Problem**: Wrong database or collection
**Solution**:
- Check database name in `src/lib/mongodb.ts` (should be `interview_app`)
- Look in the `users` collection
- Verify MongoDB connection string includes correct database

#### 4. Manual Verification

##### Check MongoDB Directly

1. **Open MongoDB Compass** or **MongoDB Atlas**
2. **Connect to your database**
3. **Navigate to**: `interview_app` database
4. **Check collections**:
   - `users` - Should have documents with `clerkId`, `email`, etc.
   - `interview_sessions` - Should have documents with `userId` field

##### Expected User Document
```json
{
  "_id": ObjectId("..."),
  "clerkId": "user_2abc123...",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "imageUrl": "https://...",
  "createdAt": ISODate("2025-10-02T06:00:00Z"),
  "updatedAt": ISODate("2025-10-02T06:00:00Z")
}
```

##### Expected Session Document
```json
{
  "_id": ObjectId("..."),
  "userId": "user_2abc123...",  // ← Should match user's clerkId
  "jobPostingUrl": "pending",
  "metadata": {
    "expected_keywords": [],
    "difficulty": "medium",
    "topic": "Interview"
  },
  "qaPairs": [],
  "createdAt": ISODate("2025-10-02T06:00:00Z"),
  "updatedAt": ISODate("2025-10-02T06:00:00Z"),
  "status": "generated"
}
```

#### 5. Test Checklist

- [ ] Server is running (`npm run dev`)
- [ ] User can access home page
- [ ] User can click "Sign Up" or "Sign In"
- [ ] User successfully signs in
- [ ] User is redirected to `/interview` page
- [ ] Check terminal logs for user creation messages
- [ ] Check MongoDB for `users` collection
- [ ] Check MongoDB for user document with correct `clerkId`
- [ ] Check MongoDB for `interview_sessions` collection
- [ ] Check session document has `userId` field

#### 6. Quick Test Commands

##### Test MongoDB Connection
Create a test file `test-mongodb.js`:
```javascript
const { MongoClient } = require('mongodb')

async function test() {
  const client = new MongoClient(process.env.MONGODB_URI)
  try {
    await client.connect()
    console.log('✅ Connected to MongoDB')
    const db = client.db('interview_app')
    const collections = await db.listCollections().toArray()
    console.log('📁 Collections:', collections.map(c => c.name))
  } catch (error) {
    console.error('❌ MongoDB Error:', error)
  } finally {
    await client.close()
  }
}

test()
```

Run: `node test-mongodb.js`

#### 7. Force User Creation

If you want to manually trigger user creation, you can:

1. **Delete existing session** from localStorage:
   - Open browser DevTools → Application → Local Storage
   - Delete `interview_session_id` key

2. **Navigate to `/interview` again**
   - This will create a new session
   - User should be created automatically

3. **Check logs and MongoDB**

#### 8. Environment Variables Checklist

Verify your `.env.local` has:
```env
# Clerk (Required)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# MongoDB (Required)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/interview_app?retryWrites=true&w=majority

# Webhook (Optional for local dev)
# CLERK_WEBHOOK_SECRET=whsec_...
```

#### 9. Still Not Working?

If you've tried everything above and it's still not working:

1. **Restart the dev server**:
   ```bash
   # Stop the server (Ctrl+C)
   npm run dev
   ```

2. **Clear Next.js cache**:
   ```bash
   rm -rf .next
   npm run dev
   ```

3. **Check for TypeScript errors**:
   ```bash
   npm run build
   ```

4. **Share the logs**: Copy the terminal output and check for any error messages

#### 10. Success Indicators

You'll know it's working when:
- ✅ Terminal shows all the emoji logs in sequence
- ✅ MongoDB `users` collection has your user
- ✅ MongoDB `interview_sessions` collection has sessions with `userId`
- ✅ No error messages in terminal or browser console
- ✅ User can create and view interview sessions

## Need More Help?

If you're still having issues, provide:
1. Terminal logs (copy the entire output)
2. Browser console errors (if any)
3. MongoDB connection string format (hide credentials)
4. Which step in the checklist is failing
