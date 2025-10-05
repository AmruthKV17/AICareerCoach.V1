# Local Development Guide (Without Webhooks)

## Good News! 🎉

You can **develop and test the application locally WITHOUT setting up webhooks**. The system will automatically create users in MongoDB when they first interact with the application.

## How It Works

The application now uses **lazy user creation** instead of webhooks:

1. User signs up via Clerk ✅
2. User navigates to `/interview` page ✅
3. When creating their first interview session, the API automatically:
   - Fetches user data from Clerk
   - Creates user in MongoDB
   - Links the session to the user ✅

**No webhook needed for local development!**

## Setup Steps

### 1. Environment Variables

Make sure your `.env.local` has:
```env
# Clerk (required)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# MongoDB (required)
MONGODB_URI=mongodb+srv://...

# Webhook (optional for local dev - can skip this)
# CLERK_WEBHOOK_SECRET=whsec_...
```

### 2. Start Development Server

```bash
npm run dev
```

### 3. Test the Flow

1. **Sign Up**: Go to http://localhost:3000 and click "Sign Up"
2. **Create Session**: Navigate to `/interview` page
3. **Generate Questions**: Create an interview session
4. **Check MongoDB**: 
   - Open MongoDB Compass or Atlas
   - Check `users` collection - user should be created automatically
   - Check `interview_sessions` collection - session should have `userId` field

## When Do You Need Webhooks?

Webhooks are only needed in **production** for:
- Real-time user data sync when users update their profile in Clerk
- Automatic user deletion when users delete their account
- Keeping user data perfectly in sync across systems

For local development, the lazy creation approach works perfectly fine!

## Production Deployment (When Ready)

When you deploy to production, you'll need to set up webhooks:

### Option 1: After Deployment (Easiest)
1. Deploy your app to Vercel/Netlify/etc.
2. You'll get a public URL (e.g., `https://your-app.vercel.app`)
3. Configure webhook: `https://your-app.vercel.app/api/webhooks/clerk`
4. Add `CLERK_WEBHOOK_SECRET` to production environment variables

### Option 2: Use ngrok for Testing (Optional)

If you want to test webhooks locally:

1. **Install ngrok**: https://ngrok.com/download
2. **Start your app**: `npm run dev`
3. **Start ngrok**: `ngrok http 3000`
4. **Copy the URL**: e.g., `https://abc123.ngrok.io`
5. **Configure Clerk webhook**: `https://abc123.ngrok.io/api/webhooks/clerk`
6. **Add secret to `.env.local`**: `CLERK_WEBHOOK_SECRET=whsec_...`

**Note**: ngrok URL changes each restart (unless you have a paid plan)

## Testing Checklist

- [ ] User can sign up successfully
- [ ] User can sign in successfully
- [ ] User is redirected to sign-in when accessing `/interview` without auth
- [ ] User can create interview sessions
- [ ] Sessions appear in MongoDB with `userId` field
- [ ] User appears in MongoDB `users` collection (after first session creation)
- [ ] User can only see their own sessions

## Troubleshooting

### User Not Created in MongoDB?
- Check that you're creating an interview session (user is created on first session)
- Verify MongoDB connection string is correct
- Check server logs for errors

### Sessions Not Linked to User?
- Ensure you're signed in when creating sessions
- Check that Clerk authentication is working
- Verify `userId` is present in the session document

### Authentication Issues?
- Clear browser cookies and try again
- Check Clerk dashboard for any configuration issues
- Verify environment variables are set correctly

## Summary

✅ **For Local Development**: No webhooks needed - users are created automatically

🚀 **For Production**: Set up webhooks after deployment for real-time sync

🔧 **For Testing Webhooks Locally**: Use ngrok (optional)

You can start developing and testing immediately without any webhook configuration!
