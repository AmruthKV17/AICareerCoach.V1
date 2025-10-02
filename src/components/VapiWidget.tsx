"use client"
import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Mic, Phone, MessageSquare, Brain, User, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

import { cn } from "@/lib/utils";
import Vapi from '@vapi-ai/web';

import { QAExporter, QAPair } from '@/lib/exportUtils';
import { AnimatedGridPattern } from '@/components/ui/animated-grid-pattern';

interface VapiWidgetProps {
  apiKey: string;
  assistantId?: string;
  assistantOptions?: any;
  config?: Record<string, unknown>;
  autoExport?: boolean;
  exportFormat?: 'json' | 'txt' | 'csv';
  onExport?: (qaPairs: QAPair[]) => void;
  sessionId?: string;
}

enum CallStatus {
  INACTIVE = "INACTIVE",
  CONNECTING = "CONNECTING",
  ACTIVE = "ACTIVE",
  FINISHED = "FINISHED",
}

const VapiWidget: React.FC<VapiWidgetProps> = ({ 
  apiKey, 
  assistantId, 
  assistantOptions,
  config = {},
  autoExport = false,
  exportFormat = 'json',
  onExport,
  sessionId
}) => {
  const [vapi, setVapi] = useState<Vapi | null>(null);
  const [callStatus, setCallStatus] = useState<CallStatus>(CallStatus.INACTIVE);
  const [isConnected, setIsConnected] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  const [transcript, setTranscript] = useState<Array<{role: string, text: string}>>([]);
  const [currentMessage, setCurrentMessage] = useState<{role: string, text: string} | null>(null);
  const [isMicOn, setIsMicOn] = useState(true);
  const [qaPairs, setQaPairs] = useState<Array<{ question: string, answer: string }>>([]);
  const [pendingQuestion, setPendingQuestion] = useState<string | null>(null);
  const [showJson, setShowJson] = useState(false);
  const [isWaitingForCompleteQuestion, setIsWaitingForCompleteQuestion] = useState(false);
  const [isSavingToDatabase, setIsSavingToDatabase] = useState(false);
  const [databaseSaveStatus, setDatabaseSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const pendingQuestionRef = useRef<string | null>(null);
  const userResponseTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const currentUserResponseRef = useRef<string>('');
  const assistantQuestionBufferRef = useRef<string>('');
  const questionCompleteTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastCompleteQuestionRef = useRef<string>('');
  const userAnswerBufferRef = useRef<string>('');

  // Function to verify QA pairs were saved to database
  const verifyQAPairsSaved = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/interview-sessions/${sessionId}/qa-pairs`);
      const data = await response.json();
      
      if (data.success && data.data.length === qaPairs.length) {
        console.log('✅ QA pairs verified in database:', data.data.length, 'pairs saved');
        return true;
      } else {
        console.warn('⚠️ QA pairs count mismatch in database');
        return false;
      }
    } catch (error) {
      console.error('❌ Error verifying QA pairs:', error);
      return false;
    }
  };

  // Helper function to detect if text looks like a complete question
  const isCompleteQuestion = (text: string): boolean => {
    const trimmed = text.trim();
    if (trimmed.length < 30) return false; // Must be substantial
    
    // Check for strong question indicators
    const strongQuestionPatterns = [
      /\?$/, // Ends with question mark
      /^(can you|could you|what|how|why|when|where|which|who|do you|have you|are you|is there|would you|tell me|explain|describe|provide|give me|show me)/i, // Starts with question words
      /(tell me about|explain how|describe your|what is your|how do you|can you tell me|could you explain)/i, // Strong question patterns
    ];
    
    // Check for weak patterns that might be questions
    const weakQuestionPatterns = [
      /(experience with|familiarity with|approach to|process for|strategy for)/i,
    ];
    
    // Must have strong patterns OR (weak patterns AND be long enough)
    const hasStrongPattern = strongQuestionPatterns.some(pattern => pattern.test(trimmed));
    const hasWeakPattern = weakQuestionPatterns.some(pattern => pattern.test(trimmed));
    const isLongEnough = trimmed.length > 50;
    
    return hasStrongPattern || (hasWeakPattern && isLongEnough);
  };

  // Helper function to detect if text is just acknowledgment/filler
  const isAcknowledgment = (text: string): boolean => {
    const trimmed = text.trim().toLowerCase();
    const acknowledgments = [
      'got it', 'nice', 'great job', 'alright', 'okay', 'ok', 'yeah', 'yes', 
      'continue', 'go ahead', 'sure', 'right', 'exactly', 'perfect', 'good',
      'take your time', 'no problem', 'sounds good', 'that\'s right',
      'let\'s get started', 'next up', 'moving on', 'now', 'so', 'i see',
      'i see where you\'re going', 'good start', 'that\'s good', 'excellent',
      'wonderful', 'great', 'awesome', 'nice work', 'well done'
    ];
    
    return acknowledgments.includes(trimmed) || trimmed.length < 25;
  };

  // Helper function to detect if text is a question fragment (part of a larger question)
  const isQuestionFragment = (text: string): boolean => {
    const trimmed = text.trim().toLowerCase();
    
    // Common question fragments that should be accumulated
    const fragmentPatterns = [
      /^(in|with|for|about|regarding|concerning|specifically|particularly|especially)/i,
      /^(like|such as|for example|including|such as)/i,
      /^(and|or|but|so|then|next|also|additionally)/i,
    ];
    
    return fragmentPatterns.some(pattern => pattern.test(trimmed)) || trimmed.length < 20;
  };

  useEffect(() => {
    console.log('🔧 Initializing Vapi with API key:', process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY ? 'Present' : 'Missing');
    
    if (!process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY) {
      console.error('❌ NEXT_PUBLIC_VAPI_PUBLIC_KEY is not defined')
      alert('Vapi API key is missing. Please check your environment configuration.');
      return
    }
    
    let vapiInstance: Vapi;
    try {
      vapiInstance = new Vapi(process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY);
      setVapi(vapiInstance);
      console.log('✅ Vapi instance created successfully');
    } catch (error) {
      console.error('❌ Error creating Vapi instance:', error);
      alert('Failed to initialize Vapi. Please check your API key and try again.');
      return;
    }

    // Event listeners
    vapiInstance.on('call-start', () => {
      console.log('Call started');
      setCallStatus(CallStatus.ACTIVE);
      setIsConnected(true);
      // reset QA state for new call
      setQaPairs([]);
      setPendingQuestion(null);
      pendingQuestionRef.current = null;
      setShowJson(false);
    });

    vapiInstance.on('call-end', () => {
      console.log('Call ended');
      setCallStatus(CallStatus.FINISHED);
      setIsConnected(false);
      setIsSpeaking(false);
      setIsUserSpeaking(false);
      setTranscript([]);
      setCurrentMessage(null);
      
      // Clear any pending timeouts
      if (userResponseTimeoutRef.current) {
        clearTimeout(userResponseTimeoutRef.current);
        userResponseTimeoutRef.current = null;
      }
      if (questionCompleteTimeoutRef.current) {
        clearTimeout(questionCompleteTimeoutRef.current);
        questionCompleteTimeoutRef.current = null;
      }
      
      // Process any final pending user response
      if (userAnswerBufferRef.current.trim() && lastCompleteQuestionRef.current) {
        const pair = { 
          question: lastCompleteQuestionRef.current, 
          answer: userAnswerBufferRef.current.trim() 
        };
        console.log('Final QA pair saved (call end):', pair);
        setQaPairs(prev => [...prev, pair]);
        userAnswerBufferRef.current = '';
        currentUserResponseRef.current = '';
        setPendingQuestion(null);
        pendingQuestionRef.current = null;
      }
      
      // reveal collected answers for confirmation
      setShowJson(true);
      
      // Auto-export if enabled
      if (autoExport && qaPairs.length > 0) {
        try {
          QAExporter.export(qaPairs, { format: exportFormat });
          console.log(`Auto-exported QA pairs in ${exportFormat} format`);
        } catch (error) {
          console.error('Auto-export failed:', error);
        }
      }
      
      // Call onExport callback if provided
      if (onExport && qaPairs.length > 0) {
        onExport(qaPairs);
      }

      // Save QA pairs to database if sessionId is provided
      console.log('🔍 Call end - Checking conditions:', { 
        hasSessionId: !!sessionId, 
        qaPairsLength: qaPairs.length,
        sessionId: sessionId 
      });
      
      if (sessionId && qaPairs.length > 0) {
        console.log(`💾 Saving ${qaPairs.length} QA pairs to database for session: ${sessionId}`);
        console.log('📝 QA Pairs to save:', qaPairs);
        setIsSavingToDatabase(true);
        setDatabaseSaveStatus('saving');
        
        fetch(`/api/interview-sessions/${sessionId}/qa-pairs`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ qaPairs })
        })
        .then(async response => {
          if (response.ok) {
            console.log('QA pairs saved to database successfully');
            setDatabaseSaveStatus('success');
            
            // Verify the save was successful
            const verified = await verifyQAPairsSaved(sessionId);
            if (verified) {
              console.log('✅ Database save verified successfully');
            } else {
              console.warn('⚠️ Database save verification failed');
            }
            
            // Auto-hide success message after 3 seconds
            setTimeout(() => setDatabaseSaveStatus('idle'), 3000);
          } else {
            console.error('Failed to save QA pairs to database');
            setDatabaseSaveStatus('error');
            // Auto-hide error message after 5 seconds
            setTimeout(() => setDatabaseSaveStatus('idle'), 5000);
          }
        })
        .catch(error => {
          console.error('Error saving QA pairs:', error);
          setDatabaseSaveStatus('error');
          // Auto-hide error message after 5 seconds
          setTimeout(() => setDatabaseSaveStatus('idle'), 5000);
        })
        .finally(() => {
          setIsSavingToDatabase(false);
        });
      } else if (!sessionId && qaPairs.length > 0) {
        console.warn('⚠️ No sessionId provided - QA pairs will not be saved to database');
        console.log('📝 QA Pairs that would have been saved:', qaPairs);
      } else if (sessionId && qaPairs.length === 0) {
        console.warn('⚠️ SessionId provided but no QA pairs to save');
      }
    });

    vapiInstance.on('speech-start', () => {
      console.log(`Assistant started speaking:${isSpeaking}`);
      setIsSpeaking(true);
    });

    vapiInstance.on('speech-end', () => {
      console.log('Assistant stopped speaking:',isSpeaking);
      setIsSpeaking(false);
      // When assistant stops speaking, finalize the current message
      if (currentMessage && currentMessage.role === 'assistant') {
        setTranscript(prev => [...prev, currentMessage]);
        setCurrentMessage(null);
      }
    });

    vapiInstance.on('message', (message: any) => {
      if (message.type === 'transcript' && message.transcriptType === 'final') {
        const newText = message.transcript;
        const normalizedRole = (message.role || '').toLowerCase();
        console.log('Transcript final:', { role: normalizedRole, text: newText });
        
        if (currentMessage && currentMessage.role === normalizedRole) {
          // Continue building the current message - replace instead of append
          setCurrentMessage(prev => ({
            ...prev!,
            text: newText // Use the latest complete transcript
          }));
        } else {
          // Start a new message
          if (currentMessage) {
            // Save the previous message before starting new one
            setTranscript(prev => [...prev, currentMessage]);
          }
          setCurrentMessage({
            role: normalizedRole,
            text: newText
          });
        }
        
        // Handle user responses
        if (normalizedRole === 'user') {
          console.log('User speaking detected:', newText);
          setIsUserSpeaking(true);

          // Clear any existing timeout
          if (userResponseTimeoutRef.current) {
            clearTimeout(userResponseTimeoutRef.current);
          }
          
          // Accumulate user response in buffer
          if (userAnswerBufferRef.current) {
            userAnswerBufferRef.current += ' ' + newText;
          } else {
            userAnswerBufferRef.current = newText;
          }
          currentUserResponseRef.current = userAnswerBufferRef.current;
          
          console.log('User answer buffer:', userAnswerBufferRef.current);
          
          // Set a timeout to capture complete user response
          userResponseTimeoutRef.current = setTimeout(() => {
            console.log('User response timeout - finalizing answer:', userAnswerBufferRef.current);
            setIsUserSpeaking(false);
            // Don't process here - wait for assistant to start speaking
          }, 3000);
          
          // If assistant was speaking and user starts, finalize assistant's message
          if (currentMessage && currentMessage.role === 'assistant') {
            setTranscript(prev => [...prev, currentMessage]);
            setCurrentMessage(null);
          }
          
        } else if (normalizedRole === 'assistant') {
          console.log('Assistant speaking detected:', newText);
          
          // CRITICAL: When assistant starts speaking, save the user's complete answer
          if (userAnswerBufferRef.current.trim() && lastCompleteQuestionRef.current) {
            const pair = { 
              question: lastCompleteQuestionRef.current, 
              answer: userAnswerBufferRef.current.trim() 
            };
            console.log('QA pair saved (assistant started speaking):', pair);
            setQaPairs(prev => [...prev, pair]);
            userAnswerBufferRef.current = '';
            currentUserResponseRef.current = '';
          }
          
          // Clear any pending user response timeout when assistant speaks
          if (userResponseTimeoutRef.current) {
            clearTimeout(userResponseTimeoutRef.current);
            userResponseTimeoutRef.current = null;
          }
          
          // Accumulate assistant text in buffer
          const assistantText = newText?.trim();
          if (assistantText && assistantText.length > 0) {
            // If we already have text in buffer, append with space
            if (assistantQuestionBufferRef.current) {
              assistantQuestionBufferRef.current += ' ' + assistantText;
            } else {
              assistantQuestionBufferRef.current = assistantText;
            }
            
            console.log('Assistant text accumulated:', assistantQuestionBufferRef.current);
            
            // Clear any existing question timeout
            if (questionCompleteTimeoutRef.current) {
              clearTimeout(questionCompleteTimeoutRef.current);
            }
            
            // Check if this looks like a complete question immediately
            const currentBuffer = assistantQuestionBufferRef.current.trim();
            if (isCompleteQuestion(currentBuffer) && !isAcknowledgment(currentBuffer)) {
              // It's a complete question, store it as the last complete question
              lastCompleteQuestionRef.current = currentBuffer;
              setPendingQuestion(currentBuffer);
              pendingQuestionRef.current = currentBuffer;
              setIsWaitingForCompleteQuestion(false);
              console.log('Complete question detected and stored:', currentBuffer);
              assistantQuestionBufferRef.current = '';
            } else if (isAcknowledgment(currentBuffer)) {
              // It's just an acknowledgment, ignore it
              console.log('Acknowledgment detected, ignoring:', currentBuffer);
              assistantQuestionBufferRef.current = '';
            } else {
              // Set waiting state and timeout to check if this becomes a complete question
              setIsWaitingForCompleteQuestion(true);
              questionCompleteTimeoutRef.current = setTimeout(() => {
                const completeText = assistantQuestionBufferRef.current.trim();
                console.log('Checking if accumulated text is complete question:', completeText);
                
                // Only set as pending question if it looks like a real question
                if (isCompleteQuestion(completeText) && !isAcknowledgment(completeText)) {
                  lastCompleteQuestionRef.current = completeText;
                  setPendingQuestion(completeText);
                  pendingQuestionRef.current = completeText;
                  setIsWaitingForCompleteQuestion(false);
                  console.log('Complete question set after timeout:', completeText);
                } else {
                  console.log('Not a complete question after timeout, ignoring:', completeText);
                  setIsWaitingForCompleteQuestion(false);
                }
                
                // Clear the buffer
                assistantQuestionBufferRef.current = '';
              }, 3000); // Wait 3 seconds after assistant stops speaking
            }
          }
        }
      }
    });

    vapiInstance.on('error', (error: any) => {
      console.error('Vapi error:', error);
    });

    return () => {
      // Clear any pending timeouts
      if (userResponseTimeoutRef.current) {
        clearTimeout(userResponseTimeoutRef.current);
        userResponseTimeoutRef.current = null;
      }
      if (questionCompleteTimeoutRef.current) {
        clearTimeout(questionCompleteTimeoutRef.current);
        questionCompleteTimeoutRef.current = null;
      }
      vapiInstance?.stop();
    };
  }, [apiKey]);

  const startCall = async () => {
    try {
      console.log('🚀 Starting Vapi call...');
      setCallStatus(CallStatus.CONNECTING);
      
      if (!vapi) {
        console.error('❌ Vapi instance not initialized');
        alert('Vapi not initialized. Please refresh the page.');
        return;
      }

      // Validate assistant configuration
      if (assistantOptions) {
        console.log('📋 Using assistant options:', assistantOptions);
        
        // Validate required fields
        if (!assistantOptions.model || !assistantOptions.voice || !assistantOptions.transcriber) {
          console.error('❌ Invalid assistant options - missing required fields');
          alert('Invalid assistant configuration. Please check the setup.');
          return;
        }
        
        await vapi.start(assistantOptions);
      } else if (assistantId) {
        console.log('📋 Using assistant ID:', assistantId);
        await vapi.start(assistantId);
      } else {
        console.error('❌ No assistant options or ID provided');
        alert('No assistant configuration provided. Please check the setup.');
        return;
      }
      
      console.log('✅ Vapi call started successfully');
    } catch (error) {
      console.error('❌ Error starting Vapi call:', error);
      setCallStatus(CallStatus.INACTIVE);
      
      // Log detailed error information for debugging
      if (error && typeof error === 'object') {
        console.error('Error details:', {
          message: (error as any).message,
          status: (error as any).status,
          response: (error as any).response,
          stack: (error as any).stack
        });
      }
      
      // Provide user-friendly error messages
      if (error instanceof Error) {
        if (error.message.includes('microphone')) {
          alert('Microphone access denied. Please allow microphone access and try again.');
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          alert('Network error. Please check your internet connection and try again.');
        } else if (error.message.includes('api key') || error.message.includes('unauthorized')) {
          alert('Authentication error. Please check your API key configuration.');
        } else if (error.message.includes('400') || error.message.includes('Bad Request')) {
          alert('Invalid assistant configuration. Please check the voice, model, and transcriber settings.');
        } else {
          alert(`Failed to start interview: ${error.message}`);
        }
      } else {
        alert('Failed to start interview. Please try again or refresh the page.');
      }
    }
  };

  const endCall = async () => {
    if (vapi) {
      vapi.stop();
    }
    
    // Save QA pairs to database first
    if (sessionId && qaPairs.length > 0) {
      try {
        const response = await fetch(`/api/interview-sessions/${sessionId}/qa-pairs`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ qaPairs })
        });
        
        if (response.ok) {
          setDatabaseSaveStatus('success');
          console.log('✅ QA pairs saved successfully');
        } else {
          setDatabaseSaveStatus('error');
          console.error('❌ Failed to save QA pairs');
        }
      } catch (error) {
        console.error('❌ Error saving QA pairs:', error);
        setDatabaseSaveStatus('error');
      }
    }
    
    // Navigate to feedback page after a short delay
    setTimeout(() => {
      if (sessionId) {
        console.log('🔄 Navigating to feedback page for session:', sessionId);
        // Show loading state
        setDatabaseSaveStatus('saving');
        window.location.href = `/feedback/${sessionId}`;
      } else {
        console.warn('⚠️ No sessionId available for feedback page');
        alert('Interview ended, but no session ID available for feedback.');
      }
    }, 2000); // 2 second delay to show save status
  };

  const toggleMic = () => {
    if (vapi && isConnected) {
      if (isMicOn) {
        vapi.setMuted(true);
        console.log('Microphone muted');
      } else {
        vapi.setMuted(false);
        console.log('Microphone unmuted');
      }
      setIsMicOn(!isMicOn);
    }
  };

  // return (
  //   <div className="fixed bottom-6 right-6 z-[1000] font-sans">
  //     {!isConnected ? (
  //       <button
  //         onClick={startCall}
  //         className="bg-teal-600 text-white border-none rounded-full px-6 py-4 text-base font-bold cursor-pointer shadow-lg shadow-teal-600/30 transition-all duration-300 ease-in-out hover:-translate-y-0.5 hover:shadow-xl hover:shadow-teal-600/40"
  //       >
  //         🎤 Talk to Assistant
  //       </button>
  //     ) : (
  //       <div className="bg-white rounded-xl p-5 w-80 shadow-2xl shadow-black/12 border border-gray-200">
  //         <div className="flex items-center justify-between mb-4">
  //           <div className="flex items-center gap-2">
  //             <div 
  //               className={`w-3 h-3 rounded-full ${
  //                 isSpeaking ? 'bg-red-500 animate-pulse' : 
  //                 isUserSpeaking ? 'bg-blue-500 animate-pulse' : 'bg-teal-600'
  //               }`}
  //             ></div>
  //             <span className="font-bold text-gray-800">
  //               {isSpeaking ? 'Assistant Speaking...' : 
  //                isUserSpeaking ? 'User Speaking...' : 'Listening...'}
  //             </span>
  //           </div>
  //           <button
  //             onClick={endCall}
  //             className="bg-red-500 text-white border-none rounded-md px-3 py-1.5 text-xs cursor-pointer hover:bg-red-600 transition-colors"
  //           >
  //             End Call
  //           </button>
  //         </div>
          
  //         <div className="max-h-48 overflow-y-auto mb-3 p-2 bg-gray-50 rounded-lg">
  //           {transcript.length === 0 ? (
  //             <p className="text-gray-600 text-sm m-0">
  //               Conversation will appear here...
  //             </p>
  //           ) : (
  //             transcript.map((msg, i) => (
  //               <div
  //                 key={i}
  //                 className={`mb-2 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}
  //               >
  //                 <span className={`inline-block px-3 py-2 rounded-xl text-sm max-w-[80%] text-white ${
  //                   msg.role === 'user' ? 'bg-teal-600' : 'bg-gray-800'
  //                 }`}>
  //                   {msg.text}
  //                 </span>
  //               </div>
  //             ))
  //           )}
  //         </div>
  //       </div>
  //     )}
  //   </div>
  // );
  return (
    <div className="relative min-h-screen flex flex-col items-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-neutral-950 dark:via-blue-950/20 dark:to-indigo-950/20 overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 z-0">
        <AnimatedGridPattern
          numSquares={20}
          maxOpacity={0.08}
          duration={5}
          repeatDelay={2}
          className={cn(
            "[mask-image:radial-gradient(1000px_circle_at_center,white,transparent)]",
            "fill-blue-500/10 stroke-blue-500/10 dark:fill-blue-400/10 dark:stroke-blue-400/10",
          )}
        />
      </div>
      
      <div className="relative z-10 w-full flex flex-col items-center">
        {/* Enhanced Header */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mt-10 mb-12"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"
            >
              <Brain className="w-8 h-8 text-white" />
            </motion.div>
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
              AI Interview Session
            </h1>
          </div>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Experience the future of interviews with our AI-powered conversation system
          </p>
        </motion.div>

        {/* Enhanced Main Content Grid */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8 mb-12 px-6"
        >
          {/* AI Recruiter Box */}
          <motion.div
            whileHover={{ scale: 1.02, y: -5 }}
            className="relative group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 rounded-3xl blur opacity-20 group-hover:opacity-30 transition-opacity"></div>
            <div className="relative flex flex-col items-center justify-center rounded-3xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-xl border border-white/20 py-12 px-8">
              <div className="relative mb-6">
                {isSpeaking && (
                  <>
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 opacity-30"
                    />
                    <motion.div
                      animate={{ scale: [1, 1.4, 1] }}
                      transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                      className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 opacity-20"
                    />
                  </>
                )}
                <div className="relative z-10 p-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full">
                  <Image
                    src="/ai-profile.jpeg"
                    alt="AI Recruiter"
                    width={120}
                    height={120}
                    className="rounded-full object-cover"
                  />
                </div>
              </div>
              <div className="text-center">
                <h3 className="font-bold text-xl text-gray-800 dark:text-white mb-2">AI Recruiter</h3>
                <div className="flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                  <Brain className="w-4 h-4" />
                  <span>{isSpeaking ? 'Speaking...' : 'Listening'}</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* User Box */}
          <motion.div
            whileHover={{ scale: 1.02, y: -5 }}
            className="relative group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-blue-500 rounded-3xl blur opacity-20 group-hover:opacity-30 transition-opacity"></div>
            <div className="relative flex flex-col items-center justify-center rounded-3xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-xl border border-white/20 py-12 px-8">
              <div className="relative mb-6">
                {isUserSpeaking && (
                  <>
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="absolute inset-0 rounded-full bg-gradient-to-r from-green-400 to-blue-500 opacity-40"
                    />
                    <motion.div
                      animate={{ scale: [1, 1.4, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
                      className="absolute inset-0 rounded-full bg-gradient-to-r from-green-400 to-blue-500 opacity-25"
                    />
                  </>
                )}
                <div className="relative z-10 p-1 bg-gradient-to-r from-green-500 to-blue-600 rounded-full">
                  <Image
                    src="/user-profile.jpeg"
                    alt="profile-image"
                    width={120}
                    height={120}
                    className="rounded-full object-cover"
                  />
                </div>
              </div>
              <div className="text-center">
                <h3 className="font-bold text-xl text-gray-800 dark:text-white mb-2">You</h3>
                <div className="flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                  <User className="w-4 h-4" />
                  <span>{isUserSpeaking ? 'Speaking...' : 'Ready'}</span>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Enhanced Transcript Display */}
        { transcript.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-4xl mb-8 px-6"
          >
            <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8">
              <div className="flex items-center gap-3 mb-6">
                <MessageSquare className="w-6 h-6 text-blue-600" />
                <h3 className="text-xl font-bold text-gray-800 dark:text-white">Live Conversation</h3>
              </div>
            {/* <p
              key={transcript[transcript.length - 1].text}
              className="transition-opacity duration-500 opacity-0 animate-fadeIn opacity-100 text-gray-700"
            >
              {transcript[transcript.length - 1].text}
            </p> */}
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {transcript.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[80%] ${msg.role === 'user' ? 'order-2' : 'order-1'}`}>
                      <div className={`inline-block px-4 py-3 rounded-2xl shadow-lg ${
                        msg.role === 'user' 
                          ? 'bg-gradient-to-r from-green-500 to-blue-600 text-white' 
                          : 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                      }`}>
                        <p className="text-sm leading-relaxed">{msg.text}</p>
                      </div>
                      <div className={`text-xs text-gray-500 dark:text-gray-400 mt-1 ${
                        msg.role === 'user' ? 'text-right' : 'text-left'
                      }`}>
                        {msg.role === 'user' ? 'You' : 'AI Recruiter'}
                      </div>
                    </div>
                  </motion.div>
                ))}
                {currentMessage && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`flex ${currentMessage.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[80%] ${currentMessage.role === 'user' ? 'order-2' : 'order-1'}`}>
                      <div className={`inline-block px-4 py-3 rounded-2xl shadow-lg opacity-70 ${
                        currentMessage.role === 'user' 
                          ? 'bg-gradient-to-r from-green-500 to-blue-600 text-white' 
                          : 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                      }`}>
                        <p className="text-sm leading-relaxed">{currentMessage.text}</p>
                      </div>
                      <div className={`text-xs text-gray-400 mt-1 ${
                        currentMessage.role === 'user' ? 'text-right' : 'text-left'
                      }`}>
                        {currentMessage.role === 'user' ? 'You (typing...)' : 'AI Recruiter (typing...)'}
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
      )}

        {/* Enhanced Live QA Pairs Viewer */}
        {(pendingQuestion || qaPairs.length > 0 || userAnswerBufferRef.current || assistantQuestionBufferRef.current || isWaitingForCompleteQuestion) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-4xl mb-8 px-6"
          >
            <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8">
              <div className="flex items-center gap-3 mb-6">
                <Zap className="w-6 h-6 text-purple-600" />
                <h4 className="text-xl font-bold text-gray-800 dark:text-white">Live Q&A Analysis</h4>
              </div>
              <div className="space-y-4">
                {pendingQuestion && (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-200 dark:border-blue-800"
                  >
                    <p className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-1">Current Question:</p>
                    <p className="text-gray-700 dark:text-gray-300">{pendingQuestion}</p>
                  </motion.div>
                )}
                
                {isWaitingForCompleteQuestion && !pendingQuestion && (
                  <motion.div
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-2xl border border-yellow-200 dark:border-yellow-800"
                  >
                    <p className="text-sm text-yellow-700 dark:text-yellow-300">⏳ Processing question...</p>
                  </motion.div>
                )}
                
                {assistantQuestionBufferRef.current && !pendingQuestion && !isWaitingForCompleteQuestion && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-2xl border border-orange-200 dark:border-orange-800"
                  >
                    <p className="text-sm font-medium text-orange-800 dark:text-orange-300 mb-1">Building Question:</p>
                    <p className="text-gray-700 dark:text-gray-300">{assistantQuestionBufferRef.current}</p>
                  </motion.div>
                )}
                
                {userAnswerBufferRef.current && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="p-4 bg-green-50 dark:bg-green-900/20 rounded-2xl border border-green-200 dark:border-green-800"
                  >
                    <p className="text-sm font-medium text-green-800 dark:text-green-300 mb-1">Your Response:</p>
                    <p className="text-gray-700 dark:text-gray-300">{userAnswerBufferRef.current}</p>
                  </motion.div>
                )}
                
                {qaPairs.length === 0 ? (
                  <div className="text-center py-8">
                    <Brain className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500 dark:text-gray-400">No Q&A pairs recorded yet. Start the conversation!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <h5 className="font-semibold text-gray-800 dark:text-white">Recorded Q&A Pairs ({qaPairs.length})</h5>
                    <div className="space-y-3 max-h-60 overflow-y-auto">
                      {qaPairs.map((qa, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.1 }}
                          className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700"
                        >
                          <div className="mb-2">
                            <span className="inline-block px-2 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 text-xs font-medium rounded-full mb-1">
                              Q{idx + 1}
                            </span>
                            <p className="text-sm text-gray-700 dark:text-gray-300">{qa.question}</p>
                          </div>
                          <div>
                            <span className="inline-block px-2 py-1 bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300 text-xs font-medium rounded-full mb-1">
                              A{idx + 1}
                            </span>
                            <p className="text-sm text-gray-700 dark:text-gray-300">{qa.answer}</p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
      )}

        {/* Enhanced Control Bar */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="flex items-center justify-center gap-8 mb-8"
        >
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleMic}
            disabled={!isConnected}
            className={`relative flex items-center justify-center w-16 h-16 rounded-full shadow-xl transition-all duration-300 ${
              isMicOn 
                ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700' 
                : 'bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700'
            } ${!isConnected ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            {isMicOn && isConnected && (
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 rounded-full bg-green-400 opacity-30"
              />
            )}
            <Mic className="text-white relative z-10" size={24} />
          </motion.button>

          {callStatus !== "ACTIVE" ? (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="relative flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-2xl transition-all duration-300"
              onClick={startCall}
            >
              {callStatus === "CONNECTING" && (
                <motion.div
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="absolute inset-0 rounded-full bg-blue-400 opacity-40"
                />
              )}
              <Phone className="text-white relative z-10" size={28} />
              <span className="absolute -bottom-8 text-sm font-medium text-gray-600 dark:text-gray-300">
                {callStatus === "CONNECTING" ? "Connecting..." : "Start Call"}
              </span>
            </motion.button>
          ) : (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="relative flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 shadow-2xl transition-all duration-300"
              onClick={() => endCall()}
            >
              <Phone className="text-white relative z-10" size={28} />
              <span className="absolute -bottom-8 text-sm font-medium text-gray-600 dark:text-gray-300">
                End Call
              </span>
            </motion.button>
          )}
        </motion.div>

        {/* Enhanced Status Display */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center mb-6"
        >
          <div className="flex items-center justify-center gap-3 mb-2">
            <motion.div
              animate={{ 
                scale: callStatus === "ACTIVE" ? [1, 1.2, 1] : 1,
                rotate: callStatus === "CONNECTING" ? 360 : 0
              }}
              transition={{ 
                scale: { duration: 2, repeat: Infinity },
                rotate: { duration: 2, repeat: Infinity, ease: "linear" }
              }}
              className={`w-3 h-3 rounded-full ${
                callStatus === "ACTIVE" ? 'bg-green-500' :
                callStatus === "CONNECTING" ? 'bg-yellow-500' :
                'bg-gray-400'
              }`}
            />
            <p className="text-lg font-medium text-gray-700 dark:text-gray-300">
              {callStatus === "INACTIVE" || callStatus === "FINISHED" 
                ? "Ready to start interview" 
                : callStatus === "CONNECTING" 
                ? "Connecting to AI Recruiter..." 
                : "Interview in Progress"}
            </p>
          </div>
          {callStatus === "ACTIVE" && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm text-gray-500 dark:text-gray-400"
            >
              Speak naturally - the AI is listening and will respond
            </motion.p>
          )}
        </motion.div>

        {/* Enhanced Database Save Status */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="text-center mb-8"
        >
          {!sessionId && (
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-full"
            >
              <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
              <p className="text-yellow-700 dark:text-yellow-300 text-sm font-medium">
                No session ID - Data will not be saved
              </p>
            </motion.div>
          )}
          
          {sessionId && (
            <div className="space-y-3">
              <motion.div
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-full"
              >
                <div className="w-2 h-2 bg-blue-500 rounded-full" />
                <p className="text-blue-700 dark:text-blue-300 text-sm font-medium">
                  Session ID: {sessionId}
                </p>
              </motion.div>
              
              {databaseSaveStatus === 'saving' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-full"
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full"
                  />
                  <p className="text-blue-700 dark:text-blue-300 text-sm font-medium">
                    Saving interview data...
                  </p>
                </motion.div>
              )}
              
              {databaseSaveStatus === 'success' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-full"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center"
                  >
                    <div className="w-2 h-2 bg-white rounded-full" />
                  </motion.div>
                  <p className="text-green-700 dark:text-green-300 text-sm font-medium">
                    Data saved! ({qaPairs.length} QA pairs) - Redirecting...
                  </p>
                </motion.div>
              )}
              
              {databaseSaveStatus === 'error' && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-full"
                >
                  <div className="w-2 h-2 bg-red-500 rounded-full" />
                  <p className="text-red-700 dark:text-red-300 text-sm font-medium">
                    Failed to save interview data
                  </p>
                </motion.div>
              )}
            </div>
          )}
        </motion.div>

      {/* Answers JSON Confirmation */}
      {showJson && qaPairs.length > 0 && (
        <div className="w-full max-w-3xl mb-10">
          <div className="bg-white rounded-2xl shadow-md p-6">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-lg">Collected Answers (JSON)</h4>
              <div className="flex gap-2">
                {sessionId && (
                  <button
                    onClick={async () => {
                      if (qaPairs.length === 0) {
                        alert('No QA pairs to save');
                        return;
                      }
                      
                      setIsSavingToDatabase(true);
                      setDatabaseSaveStatus('saving');
                      
                      try {
                        const response = await fetch(`/api/interview-sessions/${sessionId}/qa-pairs`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ qaPairs })
                        });
                        
                        if (response.ok) {
                          setDatabaseSaveStatus('success');
                          setTimeout(() => setDatabaseSaveStatus('idle'), 3000);
                        } else {
                          setDatabaseSaveStatus('error');
                          setTimeout(() => setDatabaseSaveStatus('idle'), 5000);
                        }
                      } catch (error) {
                        console.error('Error saving QA pairs:', error);
                        setDatabaseSaveStatus('error');
                        setTimeout(() => setDatabaseSaveStatus('idle'), 5000);
                      } finally {
                        setIsSavingToDatabase(false);
                      }
                    }}
                    disabled={isSavingToDatabase || qaPairs.length === 0}
                    className={`text-sm px-3 py-1.5 rounded-md ${
                      isSavingToDatabase 
                        ? 'bg-gray-400 cursor-not-allowed' 
                        : 'bg-indigo-600 hover:bg-indigo-700'
                    } text-white`}
                  >
                    {isSavingToDatabase ? 'Saving...' : 'Save to Database'}
                  </button>
                )}
              <button
                onClick={async () => {
                  try {
                      await QAExporter.copyToClipboard(qaPairs, 'json');
                      alert('JSON copied to clipboard');
                  } catch (e) {
                    console.error(e);
                      alert('Failed to copy to clipboard');
                  }
                }}
                className="text-sm px-3 py-1.5 rounded-md bg-gray-800 text-white hover:bg-gray-700"
              >
                  Copy JSON
                </button>
                <button
                  onClick={() => QAExporter.export(qaPairs, { format: 'json' })}
                  className="text-sm px-3 py-1.5 rounded-md bg-blue-600 text-white hover:bg-blue-700"
                >
                  Download JSON
                </button>
                <button
                  onClick={() => QAExporter.export(qaPairs, { format: 'txt' })}
                  className="text-sm px-3 py-1.5 rounded-md bg-green-600 text-white hover:bg-green-700"
                >
                  Download TXT
                </button>
                <button
                  onClick={() => QAExporter.export(qaPairs, { format: 'csv' })}
                  className="text-sm px-3 py-1.5 rounded-md bg-purple-600 text-white hover:bg-purple-700"
                >
                  Download CSV
              </button>
              </div>
            </div>
            <pre className="text-sm bg-gray-50 rounded-md p-3 overflow-x-auto whitespace-pre-wrap">
{JSON.stringify(qaPairs, null, 2)}
            </pre>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default VapiWidget;

// Usage in your app:
// <VapiWidget 
//   apiKey="your_public_api_key" 
//   assistantId="your_assistant_id" 
// />
