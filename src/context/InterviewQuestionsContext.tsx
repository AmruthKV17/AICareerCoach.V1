"use client"
import { createContext, useContext, useState, ReactNode } from 'react';
import { InterviewQuestions } from '@/types/questions';

interface InterviewQuestionsContextType {
  questions: InterviewQuestions | null;
  setQuestions: (questions: InterviewQuestions) => void;
}

const InterviewQuestionsContext = createContext<InterviewQuestionsContextType | undefined>(undefined);

export function InterviewQuestionsProvider({ children }: { children: ReactNode }) {
  const [questions, setQuestions] = useState<InterviewQuestions | null>(null);

  return (
    <InterviewQuestionsContext.Provider value={{ questions, setQuestions }}>
      {children}
    </InterviewQuestionsContext.Provider>
  );
}

export function useInterviewQuestions() {
  const context = useContext(InterviewQuestionsContext);
  if (undefined === context) {
    throw new Error('useInterviewQuestions must be used within an InterviewQuestionsProvider');
  }
  return context;
}