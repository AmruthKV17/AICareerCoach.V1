import { InterviewService } from './interviewService'
import { InterviewMetadata } from '@/types/interview'

export class MetadataUtils {
  /**
   * Get interview metadata by session ID
   */
  static async getMetadata(sessionId: string): Promise<InterviewMetadata | null> {
    return await InterviewService.getInterviewMetadata(sessionId)
  }

  /**
   * Get metadata via API call
   */
  static async getMetadataFromAPI(sessionId: string): Promise<InterviewMetadata | null> {
    try {
      const response = await fetch(`/api/interview-sessions/${sessionId}/metadata`)
      const data = await response.json()
      
      if (data.success) {
        return data.data.metadata
      }
      return null
    } catch (error) {
      console.error('Error fetching metadata from API:', error)
      return null
    }
  }

  /**
   * Check if candidate's answer contains expected keywords
   */
  static checkKeywordMatch(answer: string, expectedKeywords: string[]): {
    matchedKeywords: string[]
    matchPercentage: number
    missingKeywords: string[]
  } {
    const answerLower = answer.toLowerCase()
    const matchedKeywords: string[] = []
    const missingKeywords: string[] = []

    expectedKeywords.forEach(keyword => {
      const keywordLower = keyword.toLowerCase()
      if (answerLower.includes(keywordLower)) {
        matchedKeywords.push(keyword)
      } else {
        missingKeywords.push(keyword)
      }
    })

    const matchPercentage = (matchedKeywords.length / expectedKeywords.length) * 100

    return {
      matchedKeywords,
      matchPercentage,
      missingKeywords
    }
  }

  /**
   * Evaluate answer quality based on metadata
   */
  static evaluateAnswer(answer: string, metadata: InterviewMetadata): {
    keywordScore: number
    difficultyLevel: string
    topicRelevance: number
    overallScore: number
    feedback: string[]
  } {
    const keywordAnalysis = this.checkKeywordMatch(answer, metadata.expected_keywords)
    const feedback: string[] = []

    // Keyword score (0-100)
    const keywordScore = keywordAnalysis.matchPercentage

    // Difficulty level
    const difficultyLevel = metadata.difficulty

    // Topic relevance (basic check if answer mentions the topic)
    const topicRelevance = answer.toLowerCase().includes(metadata.topic.toLowerCase()) ? 100 : 50

    // Overall score (weighted average)
    const overallScore = (keywordScore * 0.6) + (topicRelevance * 0.4)

    // Generate feedback
    if (keywordScore >= 80) {
      feedback.push("Excellent! You mentioned most of the expected technical terms.")
    } else if (keywordScore >= 60) {
      feedback.push("Good coverage of technical terms, but could mention more specific technologies.")
    } else {
      feedback.push("Consider mentioning more specific technologies and technical terms.")
    }

    if (keywordAnalysis.missingKeywords.length > 0) {
      feedback.push(`Missing keywords: ${keywordAnalysis.missingKeywords.slice(0, 3).join(', ')}`)
    }

    if (topicRelevance < 80) {
      feedback.push(`Try to relate your answer more directly to ${metadata.topic}.`)
    }

    return {
      keywordScore,
      difficultyLevel,
      topicRelevance,
      overallScore: Math.round(overallScore),
      feedback
    }
  }

  /**
   * Get metadata summary for display
   */
  static getMetadataSummary(metadata: InterviewMetadata): string {
    return `Topic: ${metadata.topic} | Difficulty: ${metadata.difficulty} | Keywords: ${metadata.expected_keywords.length} expected`
  }
}
