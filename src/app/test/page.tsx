"use client"

import { useState } from 'react'

export default function TestPage() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [webhookStatus, setWebhookStatus] = useState<string>('')

  const checkUsers = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/test/users')
      const data = await response.json()
      
      if (data.success) {
        setUsers(data.data.users)
        setWebhookStatus(`Found ${data.data.totalUsers} users in database`)
      } else {
        setWebhookStatus(`Error: ${data.error}`)
      }
    } catch (error) {
      setWebhookStatus(`Error: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  const testUserCreation = async () => {
    setLoading(true)
    try {
      const testUser = {
        clerkId: `test_${Date.now()}`,
        email: `test${Date.now()}@example.com`,
        firstName: 'Test',
        lastName: 'User'
      }

      const response = await fetch('/api/test/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testUser)
      })

      const data = await response.json()
      
      if (data.success) {
        setWebhookStatus(`✅ Test user created successfully: ${testUser.email}`)
        checkUsers() // Refresh the list
      } else {
        setWebhookStatus(`❌ Failed to create test user: ${data.error}`)
      }
    } catch (error) {
      setWebhookStatus(`❌ Error: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen p-8 bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">
          🧪 User Database Test Page
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <button
            onClick={checkUsers}
            disabled={loading}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Loading...' : '🔍 Check Users in Database'}
          </button>

          <button
            onClick={testUserCreation}
            disabled={loading}
            className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? 'Creating...' : '➕ Create Test User'}
          </button>
        </div>

        {webhookStatus && (
          <div className="mb-6 p-4 bg-white rounded-lg shadow">
            <h3 className="font-semibold mb-2">Status:</h3>
            <p className="text-sm">{webhookStatus}</p>
          </div>
        )}

        {users.length > 0 && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b">
              <h3 className="text-lg font-semibold">Users in Database ({users.length})</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Clerk ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {users.map((user, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 text-sm font-mono text-gray-900">{user.clerkId}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{user.email}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {user.firstName} {user.lastName}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="mt-8 p-6 bg-white rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">🔧 Troubleshooting Steps</h3>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>
              <strong>Check Environment Variables:</strong> Ensure <code>CLERK_WEBHOOK_SECRET</code> is set in <code>.env.local</code>
            </li>
            <li>
              <strong>Check ngrok:</strong> Make sure ngrok is running on port 3000 and webhook URL is configured in Clerk Dashboard
            </li>
            <li>
              <strong>Check Webhook Events:</strong> In Clerk Dashboard → Webhooks, verify events are subscribed: user.created, user.updated, user.deleted
            </li>
            <li>
              <strong>Check MongoDB:</strong> Verify MongoDB connection string is correct and database is accessible
            </li>
            <li>
              <strong>Test Signup:</strong> Try signing up a new user and check if webhook fires
            </li>
            <li>
              <strong>Check Console Logs:</strong> Look for webhook logs in your terminal when users sign up
            </li>
          </ol>
        </div>

        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            <strong>Note:</strong> If no users appear after signup, the webhook might not be configured correctly. 
            Check the Clerk Dashboard webhook delivery logs for any errors.
          </p>
        </div>
      </div>
    </div>
  )
}
