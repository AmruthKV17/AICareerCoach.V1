export class SessionUtils {
  private static readonly SESSION_KEY = 'currentInterviewSessionId';

  /**
   * Store session ID in localStorage
   */
  static setSessionId(sessionId: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.SESSION_KEY, sessionId);
    }
  }

  /**
   * Get session ID from localStorage
   */
  static getSessionId(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(this.SESSION_KEY);
    }
    return null;
  }

  /**
   * Clear session ID from localStorage
   */
  static clearSessionId(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.SESSION_KEY);
    }
  }

  /**
   * Get session ID from URL parameters
   */
  static getSessionIdFromURL(): string | null {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.get('sessionId');
    }
    return null;
  }

  /**
   * Generate a shareable URL with session ID
   */
  static getShareableURL(sessionId: string, baseURL?: string): string {
    const base = baseURL || (typeof window !== 'undefined' ? window.location.origin : '');
    return `${base}?sessionId=${sessionId}`;
  }

  /**
   * Validate session ID format (MongoDB ObjectId)
   */
  static isValidObjectId(sessionId: string): boolean {
    return /^[0-9a-fA-F]{24}$/.test(sessionId);
  }

  /**
   * Get session info from multiple sources
   */
  static getSessionInfo(): {
    sessionId: string | null;
    source: 'url' | 'localStorage' | 'none';
  } {
    // Try URL first
    const urlSessionId = this.getSessionIdFromURL();
    if (urlSessionId && this.isValidObjectId(urlSessionId)) {
      return { sessionId: urlSessionId, source: 'url' };
    }

    // Try localStorage
    const localSessionId = this.getSessionId();
    if (localSessionId && this.isValidObjectId(localSessionId)) {
      return { sessionId: localSessionId, source: 'localStorage' };
    }

    return { sessionId: null, source: 'none' };
  }
}
