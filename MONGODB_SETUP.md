# MongoDB Setup Instructions

## Environment Variables

Create a `.env.local` file in the `my-app` directory with the following variables:

```env
# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/interview_app
# Or for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/interview_app?retryWrites=true&w=majority

# CrewAI API Key
CREWAI_API_KEY=your_crewai_api_key_here
```

## MongoDB Setup Options

### Option 1: Local MongoDB
1. Install MongoDB locally
2. Start MongoDB service
3. Use `mongodb://localhost:27017/interview_app` as your MONGODB_URI

### Option 2: MongoDB Atlas (Cloud)
1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a new cluster
3. Get your connection string
4. Replace `<username>`, `<password>`, and `<cluster>` in the connection string
5. Use the full connection string as your MONGODB_URI

## Database Schema

The application will automatically create the following collections:

- `interview_sessions`: Stores generated interview questions and session data
  - `jobPostingUrl`: The original job posting URL
  - `questions`: Array of interview questions
  - `createdAt`: Timestamp when session was created
  - `updatedAt`: Timestamp when session was last updated
  - `status`: Current status of the interview session
  - `sessionId`: Optional session identifier

## API Endpoints

### Generate Interview Questions
- **POST** `/api/generate-interview-questions`
- **Body**: `{ "job_posting_url": "https://example.com/job", "use_dummy_data": true }`
- **Response**: Returns generated questions and session ID
- **Note**: Set `use_dummy_data: true` to use pre-defined React Native questions for testing

### Get All Interview Sessions
- **GET** `/api/interview-sessions`
- **Response**: Returns all interview sessions

### Get Specific Interview Session
- **GET** `/api/interview-sessions/[id]`
- **Response**: Returns specific interview session by ID

### Update Interview Session Status
- **PUT** `/api/interview-sessions/[id]`
- **Body**: `{ "status": "in_progress" | "completed" }`
- **Response**: Confirmation of update

### Delete Interview Session
- **DELETE** `/api/interview-sessions/[id]`
- **Response**: Confirmation of deletion

### Save QA Pairs
- **POST** `/api/interview-sessions/[id]/qa-pairs`
- **Body**: `{ "qaPairs": [{"question": "...", "answer": "..."}] }`
- **Response**: Confirmation of save

### Get QA Pairs
- **GET** `/api/interview-sessions/[id]/qa-pairs`
- **Response**: Returns QA pairs for the session

### Get Interview Metadata
- **GET** `/api/interview-sessions/[id]/metadata`
- **Response**: Returns metadata (expected_keywords, difficulty, topic) for the session

## Testing with Dummy Data

The application includes pre-defined React Native interview questions for testing purposes:

### Features:
- **Technical Questions**: 6 questions about React Native, TypeScript, APIs, hooks, etc.
- **Behavioral Questions**: 4 questions about collaboration, problem-solving, attention to detail
- **Situational Questions**: 4 scenario-based questions about debugging, navigation, app store submission

### How to Use:
1. Check the "Use dummy data for testing" checkbox in the UI
2. Enter any job posting URL (it will be stored but not processed)
3. Click "Generate Questions" to get the pre-defined questions
4. Questions will be stored in MongoDB with the provided URL

### Benefits:
- No API calls to external services
- Consistent test data
- Faster development and testing
- No dependency on CrewAI API availability

## Export Functionality

The VapiWidget component includes comprehensive export functionality for QA pairs:

### Export Formats:
- **JSON**: Structured data with metadata
- **TXT**: Human-readable text format
- **CSV**: Spreadsheet-compatible format

### Export Methods:
1. **Manual Export**: Click export buttons after interview ends
2. **Auto Export**: Automatically export when call ends
3. **Copy to Clipboard**: Copy data for immediate use
4. **MongoDB Storage**: Save QA pairs to database

### Usage Examples:

#### Basic Usage with Auto Export:
```tsx
<VapiWidget
  apiKey="your_api_key"
  assistantId="your_assistant_id"
  autoExport={true}
  exportFormat="json"
  onExport={(qaPairs) => console.log('Exported:', qaPairs)}
/>
```

#### Save to MongoDB:
```javascript
// After interview ends, save QA pairs
const response = await fetch(`/api/interview-sessions/${sessionId}/qa-pairs`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ qaPairs: qaPairs })
});
```

#### Retrieve from MongoDB:
```javascript
// Get saved QA pairs
const response = await fetch(`/api/interview-sessions/${sessionId}/qa-pairs`);
const data = await response.json();
console.log('QA Pairs:', data.data);
```

#### Retrieve Interview Metadata:
```javascript
// Get interview metadata only
const response = await fetch(`/api/interview-sessions/${sessionId}/metadata`);
const data = await response.json();
if (data.success) {
  const metadata = data.data.metadata;
  console.log('Expected Keywords:', metadata.expected_keywords);
  console.log('Difficulty:', metadata.difficulty);
  console.log('Topic:', metadata.topic);
}

// Or get full session (includes metadata)
const fullResponse = await fetch(`/api/interview-sessions/${sessionId}`);
const fullData = await fullResponse.json();
const metadata = fullData.data.metadata;
```

#### Using MetadataUtils for Analysis:
```javascript
import { MetadataUtils } from '@/lib/metadataUtils';

// Get metadata
const metadata = await MetadataUtils.getMetadata(sessionId);

// Evaluate a candidate's answer
const evaluation = MetadataUtils.evaluateAnswer(
  "I used React Native with TypeScript and implemented hooks like useState and useEffect",
  metadata
);

console.log('Score:', evaluation.overallScore);
console.log('Feedback:', evaluation.feedback);
```

## Session ID Management

The system automatically generates and manages session IDs for each interview session:

### Getting Session ID:

#### 1. From API Response:
```javascript
const response = await fetch('/api/generate-interview-questions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    job_posting_url: 'https://example.com/job',
    use_dummy_data: true
  })
});

const data = await response.json();
const sessionId = data.sessionId; // This is your session ID!
```

#### 2. From SessionUtils:
```javascript
import { SessionUtils } from '@/lib/sessionUtils';

// Get session ID from localStorage
const sessionId = SessionUtils.getSessionId();

// Get session ID from URL parameters
const sessionId = SessionUtils.getSessionIdFromURL();

// Get session info from multiple sources
const { sessionId, source } = SessionUtils.getSessionInfo();
```

#### 3. Session ID Features:
- **Auto-storage**: Automatically stored in localStorage
- **URL sharing**: Generate shareable URLs with session ID
- **Validation**: Validates MongoDB ObjectId format
- **Persistence**: Survives page refreshes

### Using Session ID:

#### Pass to VapiWidget:
```tsx
<VapiWidget
  apiKey="your_api_key"
  assistantId="your_assistant_id"
  sessionId={sessionId} // Pass the session ID
  autoExport={true}
  onExport={(qaPairs) => {
    console.log('Interview completed!', qaPairs);
  }}
/>
```

#### Retrieve Session Data:
```javascript
// Get full session data
const response = await fetch(`/api/interview-sessions/${sessionId}`);
const session = await response.json();

// Get only metadata
const metadataResponse = await fetch(`/api/interview-sessions/${sessionId}/metadata`);
const metadata = await metadataResponse.json();

// Get QA pairs
const qaResponse = await fetch(`/api/interview-sessions/${sessionId}/qa-pairs`);
const qaPairs = await qaResponse.json();
```
