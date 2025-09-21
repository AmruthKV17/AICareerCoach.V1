"use client"
import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Mic, Phone } from 'lucide-react';

import { cn } from "@/lib/utils";
import Vapi from '@vapi-ai/web';
import { QAExporter, QAPair } from '@/lib/exportUtils';

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
    if (!process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY) {
      console.error('NEXT_PUBLIC_VAPI_PUBLIC_KEY is not defined')
      return
    }
    const vapiInstance = new Vapi(process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY);
    setVapi(vapiInstance);

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

    vapiInstance.on('message', (message) => {
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

    vapiInstance.on('error', (error) => {
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
    startCall();
  }, [apiKey]);

  const startCall = async () => {
    setCallStatus(CallStatus.CONNECTING);
    if (vapi) {
      if (assistantOptions) {
        await vapi.start(assistantOptions);
      } else if (assistantId) {
        await vapi.start(assistantId);
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
    <div className="min-h-screen flex flex-col items-center bg-gray-100">
      {/* Header */}
      <h2 className="font-bold text-2xl mt-10 mb-8 text-center">
        AI Interview Session
      </h2>

      {/* Main Content Grid */}
      <div className="w-full max-w-3xl grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
         {/* AI Recruiter Box */}
         <div className="flex flex-col items-center justify-center rounded-2xl bg-white shadow-md py-10">
           <div className="relative">
             {isSpeaking && <span className="absolute inset-0 rounded-full bg-blue-400 animate-ping opacity-50" style={{zIndex: 1}} />}
             <Image
               src="/ai-profile.jpeg"
               alt="AI Recruiter"
               width={100}
               height={100}
               className="rounded-full mb-4 relative"
               style={{zIndex: 2}}
             />
           </div>
           <h3 className="font-medium text-lg mt-10">AI Recruiter</h3>
         </div>

         {/* User Box */}
         <div className="flex flex-col items-center justify-center rounded-2xl bg-white shadow-md py-10">
           <div className="relative">
             {isUserSpeaking && <span className="absolute inset-0 rounded-full bg-blue-400 animate-ping opacity-75" style={{zIndex: 1}} />}
             <Image
               src="/user-profile.jpeg"
               alt="profile-image"
               width={100}
               height={100}
               className="rounded-full mb-4 object-cover relative"
               style={{zIndex: 2}}
             />
           </div>
           <h3 className="font-medium text-lg mt-10">You</h3>
         </div>
      </div>

      {/* Transcript Display */}
      { transcript.length > 0 && (
        <div className="w-full max-w-3xl mb-6">
          <div className="bg-white rounded-2xl shadow-md p-6">
            {/* <p
              key={transcript[transcript.length - 1].text}
              className="transition-opacity duration-500 opacity-0 animate-fadeIn opacity-100 text-gray-700"
            >
              {transcript[transcript.length - 1].text}
            </p> */}
             {transcript.map((msg, i) => (
                  <div
                    key={i}
                    className={`mb-2 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}
                  >
                    <span className={`inline-block px-3 py-2 rounded-xl text-sm max-w-[80%] text-white ${
                      msg.role === 'user' ? 'bg-teal-600' : 'bg-gray-800'
                    }`}>
                      {msg.text}
                    </span>
                  </div> 
                ))}
                {currentMessage && (
                  <div
                    className={`mb-2 ${currentMessage.role === 'user' ? 'text-right' : 'text-left'}`}
                  >
                    <span className={`inline-block px-3 py-2 rounded-xl text-sm max-w-[80%] text-white ${
                      currentMessage.role === 'user' ? 'bg-teal-600' : 'bg-gray-800'
                    }`}>
                      {currentMessage.text}
                    </span>
                  </div>
                )}
          </div>
        </div>
      )}

      {/* Live QA Pairs Viewer */}
      {(pendingQuestion || qaPairs.length > 0 || userAnswerBufferRef.current || assistantQuestionBufferRef.current || isWaitingForCompleteQuestion) && (
        <div className="w-full max-w-3xl mb-6">
          <div className="bg-white rounded-2xl shadow-md p-6">
            <h4 className="font-semibold text-lg mb-2">QA Pairs (Live)</h4>
            {pendingQuestion && (
              <p className="text-sm text-gray-600 mb-2">
                Pending question: <span className="text-gray-900">{pendingQuestion}</span>
              </p>
            )}
            {isWaitingForCompleteQuestion && !pendingQuestion && (
              <p className="text-sm text-yellow-600 mb-2">
                Waiting for complete question...
              </p>
            )}
            {assistantQuestionBufferRef.current && !pendingQuestion && !isWaitingForCompleteQuestion && (
              <p className="text-sm text-orange-600 mb-2">
                Building question: <span className="text-gray-900">{assistantQuestionBufferRef.current}</span>
              </p>
            )}
            {userAnswerBufferRef.current && (
              <p className="text-sm text-blue-600 mb-2">
                User answer buffer: <span className="text-gray-900">{userAnswerBufferRef.current}</span>
              </p>
            )}
            {qaPairs.length === 0 ? (
              <p className="text-sm text-gray-600">No pairs recorded yet.</p>
            ) : (
              <ul className="list-disc pl-5 space-y-1">
                {qaPairs.map((qa, idx) => (
                  <li key={idx} className="text-sm">
                    <span className="font-medium">Q{idx + 1}:</span> {qa.question}
                    <br />
                    <span className="font-medium">A{idx + 1}:</span> {qa.answer}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

       {/* Control Bar */}
       <div className="flex items-center gap-6 mb-6">
         <button 
           onClick={toggleMic}
           disabled={!isConnected}
           className={`flex items-center justify-center w-12 h-12 rounded-full transition ${
             isMicOn 
               ? 'bg-green-500 hover:bg-green-600' 
               : 'bg-red-500 hover:bg-red-600'
           } ${!isConnected ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
         >
           <Mic className="text-white" size={22} />
         </button>
        {callStatus !== "ACTIVE" ? (
          <button 
            className="flex items-center justify-center w-12 h-12 rounded-full bg-green-500 hover:bg-green-600 transition relative" 
            onClick={startCall}
          >
            <span
              className={cn(
                "absolute animate-ping rounded-full opacity-75",
                callStatus !== "CONNECTING" && "hidden"
              )}
            />
            <Phone className="text-white" size={22} />
          </button>
        ) : (
          <button 
            className="flex items-center justify-center w-12 h-12 rounded-full bg-red-500 hover:bg-red-600 transition"
            onClick={() => endCall()}
          >
            <Phone className="text-white" size={22} />
          </button>
        )}
      </div>

      {/* Status Text */}
      <p className="text-gray-500 text-center mb-3">
        {callStatus === "INACTIVE" || callStatus === "FINISHED" 
          ? "Ready to start interview" 
          : callStatus === "CONNECTING" 
          ? "Connecting..." 
          : "Interview in Progress..."}
      </p>

      {/* Database Save Status */}
      <div className="text-center mb-3">
        {!sessionId && (
          <p className="text-yellow-600 text-sm">
            ⚠️ No session ID - Interview data will not be saved to database
          </p>
        )}
        {sessionId && (
          <p className="text-gray-500 text-xs">
            📋 Session ID: {sessionId}
          </p>
        )}
        {sessionId && databaseSaveStatus === 'saving' && (
          <p className="text-blue-600 text-sm">
            💾 Saving interview data to database...
          </p>
        )}
        {sessionId && databaseSaveStatus === 'success' && (
          <p className="text-green-600 text-sm">
            ✅ Interview data saved successfully! ({qaPairs.length} QA pairs) - Redirecting to feedback page...
          </p>
        )}
        {sessionId && databaseSaveStatus === 'error' && (
          <p className="text-red-600 text-sm">
            ❌ Failed to save interview data
          </p>
        )}
      </div>

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
  );
};

export default VapiWidget;

// Usage in your app:
// <VapiWidget 
//   apiKey="your_public_api_key" 
//   assistantId="your_assistant_id" 
// />
