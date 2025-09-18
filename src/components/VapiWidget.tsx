"use client"
import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Mic, Phone } from 'lucide-react';

import { cn } from "@/lib/utils";
import Vapi from '@vapi-ai/web';

interface VapiWidgetProps {
  apiKey: string;
  assistantId?: string;
  assistantOptions?: any;
  config?: Record<string, unknown>;
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
  config = {} 
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
  const pendingQuestionRef = useRef<string | null>(null);

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
      // reveal collected answers for confirmation
      setShowJson(true);
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
        
        // Track user speaking based on transcript updates
        if (normalizedRole === 'user') {
          console.log('User speaking detected');
          setIsUserSpeaking(true);

          // If there is a pending assistant question, pair it with user's final answer
          if (pendingQuestionRef.current && newText && newText.trim().length > 0) {
            const pair = { question: pendingQuestionRef.current, answer: newText.trim() };
            console.log('QA pair saved:', pair);
            setQaPairs(prev => [...prev, pair]);
            setPendingQuestion(null);
            pendingQuestionRef.current = null;
          } else if (!pendingQuestion) {
            // Fallback: try to find last assistant message from transcript/currentMessage
            const lastAssistant = (currentMessage && currentMessage.role === 'assistant')
              ? currentMessage.text
              : [...transcript].reverse().find(m => m.role === 'assistant')?.text;
            if (lastAssistant && newText && newText.trim()) {
              const pair = { question: lastAssistant, answer: newText.trim() };
              console.log('QA pair saved (fallback):', pair);
              setQaPairs(prev => [...prev, pair]);
            }
          }
          
          // If assistant was speaking and user starts, finalize assistant's message
          if (currentMessage && currentMessage.role === 'assistant') {
            setTranscript(prev => [...prev, currentMessage]);
            setCurrentMessage(null);
          }
          
          // Reset after a short delay
          setTimeout(() => setIsUserSpeaking(false), 1000);
        } else if (normalizedRole === 'assistant') {
          // Treat every assistant final utterance as the next pending question
          const maybeQuestion = newText?.trim();
          if (maybeQuestion && maybeQuestion.length > 0) {
            setPendingQuestion(maybeQuestion);
            pendingQuestionRef.current = maybeQuestion;
          }
        }
      }
    });

    vapiInstance.on('error', (error) => {
      console.error('Vapi error:', error);
    });

    return () => {
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

  const endCall = () => {
    if (vapi) {
      vapi.stop();
    }
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
      {(pendingQuestion || qaPairs.length > 0) && (
        <div className="w-full max-w-3xl mb-6">
          <div className="bg-white rounded-2xl shadow-md p-6">
            <h4 className="font-semibold text-lg mb-2">QA Pairs (Live)</h4>
            {pendingQuestion && (
              <p className="text-sm text-gray-600 mb-2">Pending question: <span className="text-gray-900">{pendingQuestion}</span></p>
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

      {/* Answers JSON Confirmation */}
      {showJson && qaPairs.length > 0 && (
        <div className="w-full max-w-3xl mb-10">
          <div className="bg-white rounded-2xl shadow-md p-6">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-lg">Collected Answers (JSON)</h4>
              <button
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(JSON.stringify(qaPairs, null, 2));
                    alert('Copied to clipboard');
                  } catch (e) {
                    console.error(e);
                  }
                }}
                className="text-sm px-3 py-1.5 rounded-md bg-gray-800 text-white hover:bg-gray-700"
              >
                Copy
              </button>
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
