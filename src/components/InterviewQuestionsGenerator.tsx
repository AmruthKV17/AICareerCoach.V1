"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useInterviewQuestions } from '@/context/InterviewQuestionsContext'
import { SessionUtils } from '@/lib/sessionUtils'
import { AnimatedGridPattern } from '@/components/ui/animated-grid-pattern'
import { cn } from '@/lib/utils'

interface InterviewQuestionsProps {}

// Animated Background Component (Original Flowing Lines)
function FloatingPaths({ position }: { position: number }) {
    const paths = Array.from({ length: 36 }, (_, i) => ({
        id: i,
        d: `M-${380 - i * 5 * position} -${189 + i * 6}C-${
            380 - i * 5 * position
        } -${189 + i * 6} -${312 - i * 5 * position} ${216 - i * 6} ${
            152 - i * 5 * position
        } ${343 - i * 6}C${616 - i * 5 * position} ${470 - i * 6} ${
            684 - i * 5 * position
        } ${875 - i * 6} ${684 - i * 5 * position} ${875 - i * 6}`,
        color: `rgba(15,23,42,${0.2 + i * 0.05})`,
        width: 0.8 + i * 0.05,
    }));

    return (
        <div className="absolute inset-0 pointer-events-none">
            <svg
                className="w-full h-full text-slate-950 dark:text-white opacity-30"
                viewBox="0 0 696 316"
                fill="none"
            >
                <title>Background Paths</title>
                {paths.map((path) => (
                    <motion.path
                        key={path.id}
                        d={path.d}
                        stroke="currentColor"
                        strokeWidth={path.width}
                        strokeOpacity={0.12 + path.id * 0.015}
                        initial={{ pathLength: 0.3, opacity: 0.4 }}
                        animate={{
                            pathLength: 1,
                            opacity: [0.15, 0.4, 0.15],
                            pathOffset: [0, 1, 0],
                        }}
                        transition={{
                            duration: 20 + Math.random() * 10,
                            repeat: Number.POSITIVE_INFINITY,
                            ease: "linear",
                        }}
                    />
                ))}
            </svg>
        </div>
    );
}

export default function InterviewQuestionsGenerator({}: InterviewQuestionsProps) {
  const router = useRouter()
  const [jobUrl, setJobUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [useDummyData, setUseDummyData] = useState(true)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const { questions, setQuestions } = useInterviewQuestions()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!jobUrl.trim()) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/generate-interview-questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          job_posting_url: jobUrl.trim(),
          use_dummy_data: useDummyData
        })
      })

      const data = await response.json()
      console.log('Response Data:', data);

      if (!data.success) {
        throw new Error(data.error || 'Failed to generate questions')
      }

      setQuestions(data.data)
      setSessionId(data.sessionId)
      SessionUtils.setSessionId(data.sessionId)
      console.log('Questions set:', data.data);
      console.log('Session ID:', data.sessionId);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleStartMockInterview = () => {
    router.push('/mock-interview')
  }

  return (
    <div className="relative min-h-screen w-full bg-white dark:bg-neutral-950">
      {/* Layered Background Animations */}
      <div className="absolute inset-0 z-0">
        {/* Layer 1: Flowing Lines Animation */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-full max-w-4xl">
            <FloatingPaths position={1} />
            <FloatingPaths position={-1} />
          </div>
        </div>
        
        {/* Layer 2: Animated Grid Pattern */}
        <div className="absolute inset-0">
          <AnimatedGridPattern
            numSquares={25}
            maxOpacity={0.12}
            duration={4}
            repeatDelay={1.5}
            className={cn(
              "[mask-image:radial-gradient(600px_circle_at_center,white,transparent)]",
              "fill-blue-500/15 stroke-blue-500/15 dark:fill-blue-400/15 dark:stroke-blue-400/15",
            )}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-4xl mx-auto p-6 py-12">
        {/* Animated Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-10"
        >
          <h1 className="text-5xl md:text-6xl font-bold mb-4 tracking-tighter">
            {'Interview Questions'.split('').map((letter, index) => (
              <motion.span
                key={index}
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{
                  delay: index * 0.03,
                  type: "spring",
                  stiffness: 150,
                  damping: 25,
                }}
                className="inline-block text-transparent bg-clip-text 
                bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600"
              >
                {letter === ' ' ? '\u00A0' : letter}
              </motion.span>
            ))}
          </h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="text-lg text-gray-600 dark:text-gray-300"
          >
            Generate AI-powered interview questions from any job posting
          </motion.p>
        </motion.div>
        
        {/* Form Section with Glass Effect */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8 }}
        >
          <form onSubmit={handleSubmit} className="mb-6">
            <div className="bg-white/80 dark:bg-black/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl 
                          border border-gray-200 dark:border-gray-800">
              <div className="space-y-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <input
                    type="url"
                    value={jobUrl}
                    onChange={(e) => setJobUrl(e.target.value)}
                    placeholder="Enter job posting URL..."
                    className="flex-1 px-5 py-3 bg-white dark:bg-gray-900 border border-gray-300 
                             dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 
                             focus:border-transparent transition-all duration-200
                             placeholder:text-gray-400 dark:placeholder:text-gray-500"
                    required
                  />
                  <motion.button
                    type="submit"
                    disabled={loading}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white 
                             rounded-xl hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 
                             transition-all duration-200 font-semibold shadow-lg 
                             hover:shadow-xl disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Generating...
                      </span>
                    ) : 'Generate Questions'}
                  </motion.button>
                </div>
                
                {/* Toggle for dummy data */}
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={useDummyData}
                      onChange={(e) => setUseDummyData(e.target.checked)}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded 
                               focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300 
                                   group-hover:text-gray-900 dark:group-hover:text-gray-100 
                                   transition-colors">
                      Use dummy data for testing (React Native questions)
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </form>
        </motion.div>

        {error && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-4 p-4 bg-red-100/90 backdrop-blur-sm border border-red-400 
                     text-red-700 rounded-xl shadow-md"
          >
            {error}
          </motion.div>
        )}

        {questions && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {/* Session ID Display with Glass Effect */}
            {sessionId && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/50 
                         dark:to-purple-950/50 backdrop-blur-sm border border-blue-200 
                         dark:border-blue-800 rounded-xl p-5 mb-6 shadow-lg"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-blue-800 dark:text-blue-300 text-lg">
                      Interview Session Created
                    </h3>
                    <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                      Session ID: <code className="bg-blue-100 dark:bg-blue-900/50 px-2 py-1 
                                                rounded font-mono">{sessionId}</code>
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        navigator.clipboard.writeText(sessionId);
                        alert('Session ID copied to clipboard!');
                      }}
                      className="text-sm px-4 py-2 bg-blue-600 text-white rounded-lg 
                               hover:bg-blue-700 transition-colors shadow-md"
                    >
                      Copy Session ID
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        const shareableURL = SessionUtils.getShareableURL(sessionId);
                        navigator.clipboard.writeText(shareableURL);
                        alert('Shareable URL copied to clipboard!');
                      }}
                      className="text-sm px-4 py-2 bg-green-600 text-white rounded-lg 
                               hover:bg-green-700 transition-colors shadow-md"
                    >
                      Copy Shareable URL
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Questions Display with Enhanced Styling */}
            <div className="bg-white/80 dark:bg-black/80 backdrop-blur-xl border border-gray-200 
                          dark:border-gray-800 rounded-2xl p-8 space-y-8 shadow-xl">
              {/* Job Information and Metadata with Glass Effect */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-gradient-to-r from-blue-50/50 to-purple-50/50 dark:from-blue-950/30 dark:to-purple-950/30
                           backdrop-blur-sm border border-blue-200 dark:border-blue-800 rounded-xl p-6 mb-6"
              >
                <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-300 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Job Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white/60 dark:bg-gray-900/60 rounded-lg p-4">
                    <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Topic</h4>
                    <p className="text-blue-600 dark:text-blue-400 font-semibold">{questions.topic}</p>
                  </div>
                  <div className="bg-white/60 dark:bg-gray-900/60 rounded-lg p-4">
                    <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Difficulty</h4>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${questions.difficulty === 'easy' ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' :
                                                                                    questions.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300' :
                                                                                    'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'}`}>
                      {questions.difficulty.charAt(0).toUpperCase() + questions.difficulty.slice(1)}
                    </span>
                  </div>
                  <div className="bg-white/60 dark:bg-gray-900/60 rounded-lg p-4">
                    <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Expected Keywords</h4>
                    <div className="flex flex-wrap gap-1">
                      {questions.expected_keywords.slice(0, 6).map((keyword, index) => (
                        <span key={index} className="px-2 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300
                                                     text-xs rounded-md">
                          {keyword}
                        </span>
                      ))}
                      {questions.expected_keywords.length > 6 && (
                        <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400
                                        text-xs rounded-md">
                          +{questions.expected_keywords.length - 6} more
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Technical Questions */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <h3 className="text-lg font-semibold text-blue-600 dark:text-blue-400 mb-4 
                             flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full"></span>
                  Technical Questions
                </h3>
                <ul className="list-disc pl-8 space-y-3">
                  {questions.items['technical-questions'].map((question, index) => (
                    <motion.li
                      key={`tech-${index}`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + index * 0.05 }}
                      className="text-gray-700 dark:text-gray-300 leading-relaxed"
                    >
                      {question}
                    </motion.li>
                  ))}
                </ul>
              </motion.div>

              {/* Behavioral Questions */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
              >
                <h3 className="text-lg font-semibold text-green-600 dark:text-green-400 mb-4 
                             flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-600 dark:bg-green-400 rounded-full"></span>
                  Behavioral Questions
                </h3>
                <ul className="list-disc pl-8 space-y-3">
                  {questions.items['behavioral-questions'].map((question, index) => (
                    <motion.li
                      key={`behav-${index}`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.6 + index * 0.05 }}
                      className="text-gray-700 dark:text-gray-300 leading-relaxed"
                    >
                      {question}
                    </motion.li>
                  ))}
                </ul>
              </motion.div>

              {/* Situational Questions */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 }}
              >
                <h3 className="text-lg font-semibold text-purple-600 dark:text-purple-400 mb-4 
                             flex items-center gap-2">
                  <span className="w-2 h-2 bg-purple-600 dark:bg-purple-400 rounded-full"></span>
                  Situational Questions
                </h3>
                <ul className="list-disc pl-8 space-y-3">
                  {questions.items['situational-questions'].map((question, index) => (
                    <motion.li
                      key={`sit-${index}`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.8 + index * 0.05 }}
                      className="text-gray-700 dark:text-gray-300 leading-relaxed"
                    >
                      {question}
                    </motion.li>
                  ))}
                </ul>
              </motion.div>
            </div>

            {/* Start Mock Interview Button with Enhanced Animation */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
              className="mt-10 flex justify-center"
            >
              <motion.button
                onClick={handleStartMockInterview}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className="px-10 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white 
                         rounded-xl hover:from-green-700 hover:to-emerald-700 
                         transition-all duration-300 font-semibold text-lg shadow-xl
                         hover:shadow-2xl flex items-center gap-3 group"
              >
                <span>Start Mock Interview Now</span>
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-5 w-5 group-hover:translate-x-1 transition-transform" 
                  viewBox="0 0 20 20" 
                  fill="currentColor"
                >
                  <path fillRule="evenodd" 
                        d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" 
                        clipRule="evenodd" 
                  />
                </svg>
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  )
}