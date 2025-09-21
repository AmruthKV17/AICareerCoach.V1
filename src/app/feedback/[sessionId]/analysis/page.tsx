"use client"

import React, { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { InterviewMetadata } from '@/types/interview'
import { ChevronDown, ChevronUp, Code, Zap, Target, TrendingUp, Award, BookOpen, Users, Rocket, Brain, MessageSquare, CheckCircle, AlertCircle, Star, Activity, ExternalLink, Clock, Calendar, Lightbulb, GitBranch, PlayCircle, FileText, Link2 } from 'lucide-react';

interface InterviewData {
  metadata: InterviewMetadata
  qaPairs: Array<{ question: string, answer: string }>
  sessionId: string
}

export default function AnalysisPage() {
  const params = useParams()
  const router = useRouter()
  const sessionId = params.sessionId as string
  
  const [interviewData, setInterviewData] = useState<InterviewData | null>(null)
  const [analysisResult, setAnalysisResult] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [analysisStep, setAnalysisStep] = useState(0)
  const [apiCallMade, setApiCallMade] = useState(false) // Prevent duplicate API calls
  const isAnalysisRunning = useRef(false) // Additional protection against double calls
  
  // State for expandable sections and tabs (moved here to avoid hooks order issues)
  const [expandedSections, setExpandedSections] = useState({
    competency: false,
    feedback: false,
    gaps: false
  })
  const [activeTab, setActiveTab] = useState('immediate')
  const [expandedResources, setExpandedResources] = useState<{ [key: string]: boolean }>({})
  const [hoveredResource, setHoveredResource] = useState<string | null>(null)

  const toggleSection = (section: 'competency' | 'feedback' | 'gaps') => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const toggleResource = (resourceId: string) => {
    setExpandedResources(prev => ({
      ...prev,
      [resourceId]: !prev[resourceId]
    }))
  }

  // Helper function to safely access analysis data
  const getAnalysisData = () => {
    // analysisResult contains the final_assessment directly
    return analysisResult || {}
  }

  // Helper function to format resource links
  const formatResourceLink = (resource: string) => {
    // Check if it's a YouTube link
    if (resource.toLowerCase().includes('youtube')) {
      return { type: 'video', url: `https://www.youtube.com/results?search_query=${encodeURIComponent(resource)}` }
    }
    // Check if it's documentation
    if (resource.toLowerCase().includes('documentation') || resource.toLowerCase().includes('docs')) {
      const searchTerm = resource.replace(/documentation|docs/gi, '').trim()
      return { type: 'docs', url: `https://www.google.com/search?q=${encodeURIComponent(searchTerm + ' documentation')}` }
    }
    // Check if it's a course
    if (resource.toLowerCase().includes('udemy') || resource.toLowerCase().includes('codecademy') || resource.toLowerCase().includes('pluralsight') || resource.toLowerCase().includes('freecodecamp')) {
      return { type: 'course', url: `https://www.google.com/search?q=${encodeURIComponent(resource)}` }
    }
    // Default to Google search
    return { type: 'general', url: `https://www.google.com/search?q=${encodeURIComponent(resource)}` }
  }

  // Get icon for resource type
  const getResourceIcon = (type: string) => {
    switch(type) {
      case 'video': return PlayCircle
      case 'docs': return FileText
      case 'course': return BookOpen
      default: return Link2
    }
  }

  // Animation steps for loading
  const analysisSteps = [
    "Initializing AI Analysis System...",
    "Processing Interview Questions...",
    "Analyzing Response Quality...",
    "Evaluating Technical Knowledge...",
    "Calculating Performance Metrics...",
    "Generating Personalized Feedback...",
    "Finalizing Analysis Report..."
  ]
  const CircularProgress = ({ score, size = 200, strokeWidth = 15 }: { score: number; size?: number; strokeWidth?: number }) => {
    const [animatedScore, setAnimatedScore] = useState(0);
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (animatedScore / 100) * circumference;

    useEffect(() => {
      const timer = setTimeout(() => setAnimatedScore(score), 100);
      return () => clearTimeout(timer);
    }, [score]);

    const getColor = (score: number) => {
      if (score >= 80) return '#10b981';
      if (score >= 60) return '#3b82f6';
      return '#f59e0b';
    };

    return (
      <div className="relative inline-flex items-center justify-center">
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#e5e7eb"
            strokeWidth={strokeWidth}
            fill="none"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={getColor(score)}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-1000 ease-out"
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            {animatedScore}%
          </span>
          <span className="text-sm text-gray-600 mt-1">Competency</span>
        </div>
      </div>
    );
  };

  const MiniProgress = ({ label, score, icon: Icon, color }: { label: string; score: number; icon: any; color: string }) => {
    const [width, setWidth] = useState(0);
    
    useEffect(() => {
      setTimeout(() => setWidth(score), 200);
    }, [score]);

    return (
      <div className="bg-white rounded-xl p-4 shadow-lg hover:shadow-xl transition-shadow">
        <div className="flex items-center mb-3">
          <div className={`p-2 rounded-lg ${color} mr-3`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
          <span className="text-sm font-medium text-gray-700">{label}</span>
        </div>
        <div className="relative">
          <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full ${color} transition-all duration-1000 ease-out rounded-full`}
              style={{ width: `${width}%` }}
            />
          </div>
          <span className="absolute right-0 -top-6 text-sm font-semibold text-gray-700">
            {score}%
          </span>
        </div>
      </div>
    );
  };

  // Fetch interview data and start analysis (with duplicate call prevention)
  useEffect(() => {
    const fetchDataAndAnalyze = async () => {
      // Double protection against duplicate API calls
      if (apiCallMade || isAnalysisRunning.current) {
        console.log('🚫 API call already made or running, skipping duplicate request')
        return
      }

      try {
        console.log('🔍 Fetching interview data for session:', sessionId)
        setApiCallMade(true) // Mark API call as made
        isAnalysisRunning.current = true // Set ref flag
        
        // Get interview data from localStorage first
        let data: InterviewData | null = null
        const storedData = localStorage.getItem(`interview_${sessionId}`)
        
        if (storedData) {
          data = JSON.parse(storedData)
          console.log('📋 Interview data loaded from localStorage:', data)
        } else {
          // Fallback: fetch from API if not in localStorage
          console.log('📋 No localStorage data found, fetching from API...')
          
          const [metadataResponse, qaPairsResponse] = await Promise.all([
            fetch(`/api/interview-sessions/${sessionId}/metadata`),
            fetch(`/api/interview-sessions/${sessionId}/qa-pairs`)
          ])

          if (!metadataResponse.ok || !qaPairsResponse.ok) {
            throw new Error('Failed to fetch interview data from API')
          }

          const metadataData = await metadataResponse.json()
          const qaPairsData = await qaPairsResponse.json()

          if (!metadataData.success || !qaPairsData.success) {
            throw new Error('Interview session not found or no QA pairs available')
          }

          data = {
            metadata: metadataData.data.metadata,
            qaPairs: qaPairsData.data,
            sessionId
          }

          // Store in localStorage for future use
          localStorage.setItem(`interview_${sessionId}`, JSON.stringify(data))
          console.log('📋 Interview data fetched from API and stored:', data)
        }

        if (!data) {
          throw new Error('Interview data not found')
        }

        setInterviewData(data)

        // Start analysis
        await startAnalysis(data)
        
      } catch (err) {
        console.error('❌ Error fetching interview data:', err)
        setError(err instanceof Error ? err.message : 'Failed to load interview data')
        setLoading(false)
        setApiCallMade(false) // Reset on error so user can retry
        isAnalysisRunning.current = false // Reset ref flag
      }
    }

    if (sessionId && !apiCallMade) {
      fetchDataAndAnalyze()
    }
  }, [sessionId, apiCallMade]) // Added apiCallMade to dependencies

  // Animate through analysis steps
  useEffect(() => {
    if (loading && !error) {
      const interval = setInterval(() => {
        setAnalysisStep(prev => (prev + 1) % analysisSteps.length)
      }, 2000) // Change step every 2 seconds

      return () => clearInterval(interval)
    }
  }, [loading, error])

  const startAnalysis = async (data: InterviewData) => {
    try {
      console.log('🚀 Starting CrewAI analysis...')
      console.log('📋 Interview Metadata:', data.metadata)
      console.log('📝 Interview Topic:', data.metadata.topic)
      console.log('📊 Interview Difficulty:', data.metadata.difficulty)
      
      const response = await fetch('/api/crew/kickoff', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: data.sessionId,
          metadata: data.metadata,
          qaPairs: data.qaPairs,
          interviewSummary: {
            totalQuestions: data.qaPairs.length,
            topic: data.metadata.topic,
            difficulty: data.metadata.difficulty,
            expectedKeywords: data.metadata.expected_keywords
          }
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('API Error Response:', errorText)
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`)
      }

      const result = await response.json()
      console.log(result);
      
      console.log('✅ Analysis API Response:', result)
      
      // Check if we got a successful response with data
      if (result.success && result.data) {
        // Check if we have final_assessment in the data
        if (result.data.final_assessment) {
          setAnalysisResult(result.data.final_assessment)
          console.log('✅ Analysis complete with final_assessment:', result.data.final_assessment)
        } else {
          // Fallback to the full data object
          setAnalysisResult(result.data)
          console.log('✅ Analysis complete with full data:', result.data)
        }
      } else {
        console.error('❌ API returned success but no data:', result)
        throw new Error('Analysis completed but no data was returned')
      }
      
    } catch (err) {
      console.error('❌ Error during analysis:', err)
      setError(err instanceof Error ? err.message : 'Analysis failed')
    } finally {
      setLoading(false)
      isAnalysisRunning.current = false // Reset ref flag when analysis completes
    }
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100">
        <div className="text-center max-w-md bg-white rounded-xl shadow-lg p-8">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Analysis Failed</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-y-3">
            <button
              onClick={() => router.push(`/feedback/${sessionId}`)}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Back to Feedback
            </button>
            <button
              onClick={() => window.location.reload()}
              className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Retry Analysis
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center max-w-lg">
          {/* Main Loading Animation */}
          <div className="relative mb-8">
            <div className="w-32 h-32 mx-auto relative">
              {/* Outer rotating ring */}
              <div className="absolute inset-0 border-4 border-blue-200 rounded-full animate-spin border-t-blue-600"></div>
              {/* Inner pulsing circle */}
              <div className="absolute inset-4 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-pulse flex items-center justify-center">
                <div className="text-white text-2xl">🤖</div>
              </div>
            </div>
            
            {/* Floating particles */}
            <div className="absolute top-0 left-0 w-full h-full">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-2 h-2 bg-blue-400 rounded-full animate-bounce"
                  style={{
                    left: `${20 + i * 12}%`,
                    top: `${30 + (i % 2) * 40}%`,
                    animationDelay: `${i * 0.2}s`,
                    animationDuration: '2s'
                  }}
                ></div>
              ))}
            </div>
          </div>

          {/* Progress Steps */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">AI Analysis in Progress</h2>
            
            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
              <div 
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${((analysisStep + 1) / analysisSteps.length) * 100}%` }}
              ></div>
            </div>

            {/* Current Step */}
            <div className="text-lg font-medium text-gray-700 mb-2">
              {analysisSteps[analysisStep]}
            </div>
            
            {/* Step Counter */}
            <div className="text-sm text-gray-500">
              Step {analysisStep + 1} of {analysisSteps.length}
            </div>
          </div>

          {/* Fun Facts */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">💡 Did you know?</h3>
            <p className="text-gray-600 text-sm">
              Our AI analyzes over 50 different aspects of your interview performance, 
              including communication clarity, technical accuracy, and confidence levels.
            </p>
          </div>

          {/* Session Info */}
          {interviewData && (
            <div className="mt-6 text-center">
              <div className="inline-flex items-center space-x-4 text-sm text-gray-600 bg-white rounded-full px-4 py-2 shadow-md">
                <span>📋 {interviewData.qaPairs.length} Questions</span>
                <span>•</span>
                <span>🎯 {interviewData.metadata.topic}</span>
                <span>•</span>
                <span className={`px-2 py-1 rounded text-xs ${
                  interviewData.metadata.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                  interviewData.metadata.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {interviewData.metadata.difficulty}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Analysis Results Display
  return (
    <div>
      {/* Debug Information */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed top-4 right-4 bg-black text-white p-4 rounded-lg text-xs max-w-md z-50">
          <h3 className="font-bold mb-2">Debug Info:</h3>
          <p>Loading: {loading.toString()}</p>
          <p>Error: {error || 'none'}</p>
          <p>Analysis Result: {analysisResult ? 'exists' : 'null'}</p>
          <p>Has Holistic Assessment: {analysisResult?.holistic_assessment ? 'yes' : 'no'}</p>
          <p>Has Action Plan: {analysisResult?.recommended_action_plan ? 'yes' : 'no'}</p>
          <button 
            onClick={() => {
              const mockData = {
                topic: "React Development",
                difficulty: "Intermediate",
                holistic_assessment: {
                  overall_competency_score: 78,
                  communication_effectiveness: 75,
                  knowledge_consistency: 82,
                  problem_solving_approach: 76,
                  comprehensive_strengths: [
                    "Strong understanding of React fundamentals",
                    "Good problem-solving approach"
                  ],
                  improvement_areas: [
                    "State management patterns",
                    "Performance optimization"
                  ],
                  competency_analysis: {
                    strengths: "You demonstrate solid React knowledge and clear thinking.",
                    areas_for_improvement: "Focus on advanced patterns and optimization techniques."
                  },
                  detailed_feedback: "Overall strong performance with room for growth in advanced topics."
                },
                recommended_action_plan: {
                  immediate_focus: [
                    { area: "State Management", recommendation: "Study Redux and Context API patterns" }
                  ],
                  medium_term_development: [
                    { goal: "Performance", recommendation: "Learn React optimization techniques" }
                  ],
                  strength_utilization: [
                    { strength: "Problem Solving", recommendation: "Apply your analytical skills to complex scenarios" }
                  ]
                }
              };
              setAnalysisResult(mockData);
              setLoading(false);
            }}
            className="mt-2 px-2 py-1 bg-blue-600 text-white rounded text-xs"
          >
            Load Mock Data
          </button>
          {analysisResult && (
            <details className="mt-2">
              <summary className="cursor-pointer">Raw Result</summary>
              <pre className="mt-2 text-xs overflow-auto max-h-32">
                {JSON.stringify(analysisResult, null, 2)}
              </pre>
            </details>
          )}
        </div>
      )}
      
      {/* Analysis Results */}
      {analysisResult && (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
          {/* Header */}
          <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white">
            <div className="absolute inset-0 bg-black opacity-10"></div>
            <div className="relative container mx-auto px-4 py-16">
              <div className="text-center">
                <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-4">
                  <Code className="w-5 h-5" />
                  <span className="text-sm font-medium">Assessment Report</span>
                </div>
                <h1 className="text-5xl md:text-6xl font-bold mb-4 animate-fade-in">
                  {interviewData?.metadata?.topic || 'Interview Analysis'}
                </h1>
                <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-sm px-6 py-3 rounded-full">
                  <Activity className="w-5 h-5" />
                  <span className="text-lg">Difficulty: {interviewData?.metadata?.difficulty || 'N/A'}</span>
                </div>
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-slate-50 to-transparent"></div>
          </div>

          {/* Main Score Section */}
          <div className="container mx-auto px-4 -mt-12 relative z-10">
            <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div className="flex justify-center">
                  <CircularProgress score={getAnalysisData().holistic_assessment?.overall_competency_score || 75} />
                </div>
                <div className="space-y-4">
                  <MiniProgress
                    label="Communication Effectiveness"
                    score={getAnalysisData().holistic_assessment?.communication_effectiveness || 70}
                    icon={MessageSquare}
                    color="bg-blue-500"
                  />
                  <MiniProgress
                    label="Knowledge Consistency"
                    score={getAnalysisData().holistic_assessment?.knowledge_consistency || 75}
                    icon={BookOpen}
                    color="bg-purple-500"
                  />
                  <MiniProgress
                    label="Problem Solving Approach"
                    score={getAnalysisData().holistic_assessment?.problem_solving_approach || 72}
                    icon={Brain}
                    color="bg-pink-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Strengths and Improvements Cards */}
          <div className="container mx-auto px-4 mt-12">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Strengths Card */}
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-500 rounded-2xl blur-xl opacity-30 group-hover:opacity-40 transition-opacity"></div>
                <div className="relative bg-white rounded-2xl shadow-xl p-6 border border-green-100">
                  <div className="flex items-center mb-4">
                    <div className="p-3 bg-gradient-to-r from-green-400 to-emerald-500 rounded-xl mr-4">
                      <Award className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800">Comprehensive Strengths</h3>
                  </div>
                  <div className="space-y-3">
                    {(getAnalysisData().holistic_assessment?.comprehensive_strengths || ['Good technical understanding', 'Clear communication']).map((strength: string, idx: number) => (
                      <div key={idx} className="flex items-start gap-3 p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
                        <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{strength}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Improvement Areas Card */}
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-orange-500 rounded-2xl blur-xl opacity-30 group-hover:opacity-40 transition-opacity"></div>
                <div className="relative bg-white rounded-2xl shadow-xl p-6 border border-amber-100">
                  <div className="flex items-center mb-4">
                    <div className="p-3 bg-gradient-to-r from-amber-400 to-orange-500 rounded-xl mr-4">
                      <Target className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800">Improvement Areas</h3>
                  </div>
                  <div className="space-y-3">
                    {(getAnalysisData().holistic_assessment?.improvement_areas || ['Technical depth', 'Practical examples']).map((area: string, idx: number) => (
                      <div key={idx} className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg hover:bg-amber-100 transition-colors">
                        <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{area}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Expandable Analysis Sections */}
          <div className="container mx-auto px-4 mt-12 space-y-4">
            {/* Competency Analysis */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <button
                onClick={() => toggleSection('competency')}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
                    <Zap className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-lg font-semibold text-gray-800">Competency Analysis</span>
                </div>
                {expandedSections.competency ? <ChevronUp /> : <ChevronDown />}
              </button>
              {expandedSections.competency && (
                <div className="px-6 pb-6 space-y-4 animate-fade-in">
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl">
                    <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <Star className="w-4 h-4 text-blue-500" />
                      Strengths
                    </h4>
                    <p className="text-gray-600">{getAnalysisData().holistic_assessment?.competency_analysis?.strengths || 'You demonstrate good technical understanding and clear communication skills.'}</p>
                  </div>
                  {getAnalysisData().holistic_assessment?.competency_analysis?.gaps && (
                    <div className="p-4 bg-gradient-to-r from-red-50 to-pink-50 rounded-xl">
                      <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-red-500" />
                        Knowledge Gaps
                      </h4>
                      <p className="text-gray-600">{getAnalysisData().holistic_assessment?.competency_analysis?.gaps}</p>
                    </div>
                  )}
                  {getAnalysisData().holistic_assessment?.competency_analysis?.areas_for_improvement && (
                    <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl">
                      <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-amber-500" />
                        Areas for Improvement
                      </h4>
                      <p className="text-gray-600">{getAnalysisData().holistic_assessment?.competency_analysis?.areas_for_improvement}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Detailed Feedback */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <button
                onClick={() => toggleSection('feedback')}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
                    <MessageSquare className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-lg font-semibold text-gray-800">Brief Feedback</span>
                </div>
                {expandedSections.feedback ? <ChevronUp /> : <ChevronDown />}
              </button>
              {expandedSections.feedback && (
                <div className="px-6 pb-6 animate-fade-in">
                  <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl">
                    <p className="text-gray-600 leading-relaxed">
                      {getAnalysisData().holistic_assessment?.detailed_feedback || 'Overall performance shows good potential with opportunities for improvement in technical depth and practical application examples.'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Plan Section */}
          {(getAnalysisData().recommended_action_plan || true) && (
            <div className="container mx-auto px-4 mt-12 mb-12">
              <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6 text-white">
                  <div className="flex items-center gap-3">
                    <Rocket className="w-8 h-8" />
                    <h2 className="text-2xl font-bold">Recommended Action Plan</h2>
                  </div>
                </div>
                
                {/* Tab Navigation */}
                <div className="flex flex-wrap border-b">
                  <button
                    onClick={() => setActiveTab('immediate')}
                    className={`px-6 py-3 font-medium transition-colors ${
                      activeTab === 'immediate'
                        ? 'bg-indigo-50 text-indigo-600 border-b-2 border-indigo-600'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    Immediate Focus
                  </button>
                  <button
                    onClick={() => setActiveTab('medium')}
                    className={`px-6 py-3 font-medium transition-colors ${
                      activeTab === 'medium'
                        ? 'bg-indigo-50 text-indigo-600 border-b-2 border-indigo-600'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    Medium-Term Development
                  </button>
                  <button
                    onClick={() => setActiveTab('strengths')}
                    className={`px-6 py-3 font-medium transition-colors ${
                      activeTab === 'strengths'
                        ? 'bg-indigo-50 text-indigo-600 border-b-2 border-indigo-600'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    Strength Utilization
                  </button>
                </div>

                {/* Tab Content */}
                <div className="p-6">
                  {activeTab === 'immediate' && (
                    <div className="space-y-6 animate-fade-in">
                      {(getAnalysisData().recommended_action_plan?.immediate_focus || []).map((item: any, idx: number) => {
                        const resourceId = `immediate-${idx}`
                        const isExpanded = expandedResources[resourceId]
                        
                        return (
                          <div key={idx} className="relative group">
                            <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 rounded-2xl blur-xl opacity-0 group-hover:opacity-20 transition-opacity"></div>
                            <div className="relative bg-white border border-purple-100 rounded-2xl p-6 hover:shadow-xl transition-all duration-300">
                              {/* Topic Header */}
                              <div className="flex items-start justify-between mb-4">
                                <div className="flex items-start gap-4">
                                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                                    {idx + 1}
                                  </div>
                                  <div className="flex-1">
                                    <h4 className="font-bold text-xl text-gray-800 mb-2">{item.topic || item.area}</h4>
                                    <p className="text-gray-600 leading-relaxed">{item.description || item.recommendation}</p>
                                  </div>
                                </div>
                                {item.resources && (
                                  <button
                                    onClick={() => toggleResource(resourceId)}
                                    className="p-2 hover:bg-purple-50 rounded-lg transition-colors"
                                  >
                                    {isExpanded ? <ChevronUp className="w-5 h-5 text-purple-600" /> : <ChevronDown className="w-5 h-5 text-purple-600" />}
                                  </button>
                                )}
                              </div>
                              
                              {/* Resources Section */}
                              {item.resources && isExpanded && (
                                <div className="mt-4 pt-4 border-t border-purple-100 animate-fade-in">
                                  <h5 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                    <Lightbulb className="w-4 h-4 text-yellow-500" />
                                    Recommended Resources
                                  </h5>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {item.resources.map((resource: string, rIdx: number) => {
                                      const resourceLink = formatResourceLink(resource)
                                      const Icon = getResourceIcon(resourceLink.type)
                                      const isHovered = hoveredResource === `${resourceId}-${rIdx}`
                                      
                                      return (
                                        <a
                                          key={rIdx}
                                          href={resourceLink.url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          onMouseEnter={() => setHoveredResource(`${resourceId}-${rIdx}`)}
                                          onMouseLeave={() => setHoveredResource(null)}
                                          className={`flex items-center gap-3 p-3 rounded-lg border transition-all duration-200 ${
                                            isHovered
                                              ? 'bg-gradient-to-r from-purple-50 to-pink-50 border-purple-300 shadow-md transform -translate-y-0.5'
                                              : 'bg-gray-50 border-gray-200 hover:border-purple-200'
                                          }`}
                                        >
                                          <Icon className={`w-5 h-5 flex-shrink-0 ${
                                            isHovered ? 'text-purple-600' : 'text-gray-500'
                                          }`} />
                                          <span className="text-sm text-gray-700 flex-1">{resource}</span>
                                          <ExternalLink className={`w-4 h-4 ${
                                            isHovered ? 'text-purple-600' : 'text-gray-400'
                                          }`} />
                                        </a>
                                      )
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {activeTab === 'medium' && (
                    <div className="animate-fade-in">
                      {getAnalysisData().recommended_action_plan?.medium_term_development && (
                        <div className="space-y-6">
                          {/* Check if medium_term_development is an array or object */}
                          {Array.isArray(getAnalysisData().recommended_action_plan?.medium_term_development) ? (
                            // Handle array structure
                            getAnalysisData().recommended_action_plan?.medium_term_development.map((phase: any, phaseIdx: number) => (
                              <div key={phaseIdx} className="space-y-4">
                                {/* Timeline Header for each phase */}
                                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl">
                                  <div className="flex items-center gap-3 mb-3">
                                    <Calendar className="w-6 h-6 text-blue-600" />
                                    <h3 className="text-xl font-bold text-gray-800">
                                      Development Phase {phaseIdx + 1}
                                    </h3>
                                  </div>
                                  <p className="text-gray-600 mb-2">
                                    <span className="font-semibold">Duration:</span> {phase.timeline || '3-6 months'}
                                  </p>
                                  <div className="flex items-center gap-2 text-sm text-gray-500">
                                    <Clock className="w-4 h-4" />
                                    <span>Consistent practice and dedication required</span>
                                  </div>
                                </div>

                                {/* Topics Grid for this phase */}
                                {phase.specific_topics && (
                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {phase.specific_topics.map((topic: string, idx: number) => (
                                      <div
                                        key={idx}
                                        className="group relative bg-white border border-blue-100 rounded-xl p-5 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                                      >
                                        <div className="absolute top-3 right-3">
                                          <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-full flex items-center justify-center text-white text-xs font-bold">
                                            {idx + 1}
                                          </div>
                                        </div>
                                        <GitBranch className="w-8 h-8 text-blue-500 mb-3" />
                                        <h4 className="font-semibold text-gray-800 mb-2 pr-8">{topic}</h4>
                                        <div className="mt-3 pt-3 border-t border-gray-100">
                                          <span className="text-xs text-gray-500">Phase {phaseIdx + 1} Topic</span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))
                          ) : (
                            // Handle object structure (backward compatibility)
                            <>
                              {/* Timeline Header */}
                              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl">
                                <div className="flex items-center gap-3 mb-3">
                                  <Calendar className="w-6 h-6 text-blue-600" />
                                  <h3 className="text-xl font-bold text-gray-800">Development Timeline</h3>
                                </div>
                                <p className="text-gray-600 mb-2">
                                  <span className="font-semibold">Duration:</span> {getAnalysisData().recommended_action_plan?.medium_term_development?.timeline || '3-6 months'}
                                </p>
                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                  <Clock className="w-4 h-4" />
                                  <span>Consistent practice and dedication required</span>
                                </div>
                              </div>

                              {/* Topics Grid */}
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {(getAnalysisData().recommended_action_plan?.medium_term_development?.specific_topics || []).map((topic: string, idx: number) => (
                                  <div
                                    key={idx}
                                    className="group relative bg-white border border-blue-100 rounded-xl p-5 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                                  >
                                    <div className="absolute top-3 right-3">
                                      <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-full flex items-center justify-center text-white text-xs font-bold">
                                        {idx + 1}
                                      </div>
                                    </div>
                                    <GitBranch className="w-8 h-8 text-blue-500 mb-3" />
                                    <h4 className="font-semibold text-gray-800 mb-2 pr-8">{topic}</h4>
                                    <div className="mt-3 pt-3 border-t border-gray-100">
                                      {/* <span className="text-xs text-gray-500">Click to explore resources →</span> */}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </>
                          )}

                          {/* Resources Section - works for both structures */}
                          {getAnalysisData().recommended_action_plan?.medium_term_development?.resources && (
                            <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl p-6">
                              <h4 className="font-bold text-lg text-gray-800 mb-4 flex items-center gap-2">
                                <BookOpen className="w-5 h-5 text-indigo-600" />
                                Learning Resources
                              </h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {getAnalysisData().recommended_action_plan?.medium_term_development?.resources.map((resource: string, rIdx: number) => {
                                  const resourceLink = formatResourceLink(resource)
                                  const Icon = getResourceIcon(resourceLink.type)
                                  
                                  return (
                                    <a
                                      key={rIdx}
                                      href={resourceLink.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-3 p-4 bg-white rounded-lg border border-indigo-200 hover:border-indigo-400 hover:shadow-md transition-all duration-200 group"
                                    >
                                      <Icon className="w-5 h-5 text-indigo-600 group-hover:scale-110 transition-transform" />
                                      <span className="text-sm text-gray-700 flex-1">{resource}</span>
                                      <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-indigo-600" />
                                    </a>
                                  )
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'strengths' && (
                    <div className="space-y-6 animate-fade-in">
                      {getAnalysisData().recommended_action_plan?.strength_utilization && (
                        <>
                          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6">
                            <div className="flex items-center gap-3 mb-4">
                              <Award className="w-6 h-6 text-green-600" />
                              <h3 className="text-xl font-bold text-gray-800">How to Leverage Your Strengths</h3>
                            </div>
                            <p className="text-gray-600 mb-4">
                              These recommendations will help you maximize your existing strengths to accelerate your learning journey.
                            </p>
                          </div>
                          
                          <div className="grid grid-cols-1 gap-4">
                            {(Array.isArray(getAnalysisData().recommended_action_plan?.strength_utilization) 
                              ? getAnalysisData().recommended_action_plan?.strength_utilization
                              : []).map((recommendation: string, idx: number) => (
                              <div
                                key={idx}
                                className="group relative overflow-hidden bg-white border border-green-200 rounded-xl p-6 hover:shadow-lg transition-all duration-300"
                              >
                                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-green-400 to-emerald-400"></div>
                                <div className="flex items-start gap-4 ml-2">
                                  <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-green-100 to-emerald-100 rounded-full flex-shrink-0">
                                    <span className="text-green-600 font-bold">{idx + 1}</span>
                                  </div>
                                  <div className="flex-1">
                                    <p className="text-gray-700 leading-relaxed">{recommendation}</p>
                                    <div className="mt-3 flex items-center gap-2">
                                      <CheckCircle className="w-4 h-4 text-green-500" />
                                      <span className="text-sm text-green-600 font-medium">Action Item</span>
                                    </div>
                                  </div>
                                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Rocket className="w-6 h-6 text-green-500 animate-bounce" />
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="container mx-auto px-4 pb-12">
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => router.push(`/feedback/${sessionId}`)}
                className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Back to Feedback
              </button>
              <button
                onClick={() => router.push('/')}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Start New Interview
              </button>
            </div>
          </div>

          {/* Custom Styles */}
          <style jsx>{`
            @keyframes fade-in {
              from {
                opacity: 0;
                transform: translateY(10px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }
            .animate-fade-in {
              animation: fade-in 0.5s ease-out;
            }
          `}</style>
        </div>
      )}
    </div>
  )
}