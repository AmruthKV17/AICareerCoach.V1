'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Mic, Phone } from 'lucide-react';

import { cn } from "@/lib/utils";
import Vapi from '@vapi-ai/web';

enum CallStatus {
  INACTIVE = "INACTIVE",
  CONNECTING = "CONNECTING",
  ACTIVE = "ACTIVE",
  FINISHED = "FINISHED",
}

interface SavedMessage {
  role: "user" | "system" | "assistant";
  content: string;
}

interface AgentProps {
  userName?: string;
  userId?: string;
  interviewId?: string;
  feedbackId?: string;
  type?: string;
  questions?: string[];
}

const Agent = ({
  userName,
  userId,
  interviewId,
  feedbackId,
  type,
  questions,
}: AgentProps) => {
  const router = useRouter();
  const [callStatus, setCallStatus] = useState<CallStatus>(CallStatus.INACTIVE);
  const [messages, setMessages] = useState<SavedMessage[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [lastMessage, setLastMessage] = useState<string>("");
  const [vapi, setVapi] = useState<Vapi | null>(null);

  const assistantOptions = {
    name: "AI Recruiter",
    firstMessage: "Hi there! Welcome to your React Developer interview. Let's get started with a few questions!",
    transcriber: {
      provider: "deepgram" as const,
      model: "nova-2",
      language: "en-US" as const,
    },
    voice: {
      provider: "playht" as const,
      voiceId: "jennifer",
    },
    model: {
      provider: "openai" as const,
      model: "gpt-4" as const,
      messages: [
        {
          role: "system" as const,
          content: `
You are an AI voice assistant conducting interviews.
Your job is to ask candidates provided interview questions, assess their responses.
Begin the conversation with a friendly introduction, setting a relaxed yet professional tone.
Ask one question at a time and wait for the candidate's response before proceeding. Keep the questions clear and concise. 

Below are the Questions to ask:
${questions?.map((q, i) => `${i + 1}. ${q}`).join('\n')}

If the candidate struggles, offer hints or rephrase the question without giving away the answer. Example:
"Need a hint? Think about how React tracks component updates!"
Provide brief, encouraging feedback after each answer. Example:
"Nice! That's a solid answer."
"Hmm, not quite! Want to try again?"
Keep the conversational natural and engaging—use casual phrases like "Alright, next up..." or "Let's tackle a tricky one!"
After 5-7 questions, wrap up the interview smoothly by summarizing their performance. Example:
"That was great! You handled some tough questions well. Keep sharpening your skills!"
End on a positive note: 
"Thanks for chatting! Hope to see you crushing projects soon!"
Key Guidelines:
✅ Be friendly, engaging, and witty 🎤
✅ Keep responses short and natural, like a real conversation
✅ Adapt based on the candidate's confidence level
✅ Ensure the interview remains focused on React
`.trim(),
        },
      ],
    },
  }

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY) {
        console.error('NEXT_PUBLIC_VAPI_PUBLIC_KEY is not defined')
        return
      }
      const vapiInstance = new Vapi(process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY);
      setVapi(vapiInstance);
    const onCallStart = () => {
      setCallStatus(CallStatus.ACTIVE);
    };

    const onCallEnd = () => {
      setCallStatus(CallStatus.FINISHED);
    };

    interface VapiMessage {
      type: string;
      transcriptType?: string;
      role: "user" | "system" | "assistant";
      transcript?: string;
      [key: string]: any;
    };

    const onMessage = (message: VapiMessage) => {
      if (message.type === "transcript" && message.transcriptType === "final" && message.transcript !== undefined) {
        const newMessage = { role: message.role, content: message.transcript };
        setMessages((prev) => [...prev, newMessage]);
      }
    };


    const onSpeechStart = () => {
      console.log("speech start");
      setIsSpeaking(true);
    };

    const onSpeechEnd = () => {
      console.log("speech end");
      setIsSpeaking(false);
    };

    const onError = (error: Error) => {
      console.log("Error:", error);
    };

    vapiInstance.on("call-start", onCallStart);
    vapiInstance.on("call-end", onCallEnd);
    vapiInstance.on("message", onMessage);
    vapiInstance.on("speech-start", onSpeechStart);
    vapiInstance.on("speech-end", onSpeechEnd);
    vapiInstance.on("error", onError);

    return () => {
      vapiInstance.off("call-start", onCallStart);
      vapiInstance.off("call-end", onCallEnd);
      vapiInstance.off("message", onMessage);
      vapiInstance.off("speech-start", onSpeechStart);
      vapiInstance.off("speech-end", onSpeechEnd);
      vapiInstance.off("error", onError);
    };
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      setLastMessage(messages[messages.length - 1].content);
    }

    // const handleGenerateFeedback = async (messages: SavedMessage[]) => {
    //   console.log("handleGenerateFeedback");

    // //   const { success, feedbackId: id } = await createFeedback({
    // //     interviewId: interviewId!,
    // //     userId: userId!,
    // //     transcript: messages,
    // //     feedbackId,
    // //   });

    //   if (success && id) {
    //     router.push(`/interview/${interviewId}/feedback`);
    //   } else {
    //     console.log("Error saving feedback");
    //     router.push("/");
    //   }
    // };

    if (callStatus === CallStatus.FINISHED) {
      if (type === "generate") {
        router.push("/");
      } else {
        // handleGenerateFeedback(messages);
      // You can add any additional logic here that should run after the call finishes
      // For example, you might want to show a notification or log something:
      console.log("Call finished. Ready to generate feedback or perform next steps.");
      }
    }
  }, [messages, callStatus, feedbackId, interviewId, router, type, userId]);

  const handleCall = async () => {
    setCallStatus(CallStatus.CONNECTING);

    if (type === "generate") {
      await vapi?.start(process.env.NEXT_PUBLIC_VAPI_WORKFLOW_ID!, {
        variableValues: {
          username: userName,
          userid: userId,
        },
      });
    } else {
      let formattedQuestions = "";
      if (questions) {
        formattedQuestions = questions
          .map((question) => `- ${question}`)
          .join("\n");
      }
      const assistantId = '32e2436f-7740-48e1-a5b2-422034835f7c';
      if (vapi) {
        if (assistantOptions) {
          await vapi.start(assistantOptions);
        } else if (assistantId) {
          await vapi.start(assistantId);
        }
      }
}
  }
  const handleDisconnect = () => {
    setCallStatus(CallStatus.FINISHED);
    vapi?.stop();
  };

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
            <Image
              src="/ai-profile.jpeg"
              alt="AI Recruiter"
              width={80}
              height={80}
              className="rounded-full mb-4"
            />
            {isSpeaking && <span className="absolute inset-0 rounded-full bg-green-400 animate-ping opacity-75" />}
          </div>
          <h3 className="font-medium text-lg">AI Recruiter</h3>
        </div>

        {/* User Box */}
        <div className="flex flex-col items-center justify-center rounded-2xl bg-white shadow-md py-10">
          <Image
            src="/user-profile.jpeg"
            alt="profile-image"
            width={80}
            height={80}
            className="rounded-full mb-4 object-cover"
          />
          <h3 className="font-medium text-lg">{userName || 'You'}</h3>
        </div>
      </div>

      {/* Transcript Display */}
      {messages.length > 0 && (
        <div className="w-full max-w-3xl mb-6">
          <div className="bg-white rounded-2xl shadow-md p-6">
            <p
              key={lastMessage}
              className={cn(
                "transition-opacity duration-500 opacity-0",
                "animate-fadeIn opacity-100 text-gray-700"
              )}
            >
              {lastMessage}
            </p>
          </div>
        </div>
      )}

      {/* Control Bar */}
      <div className="flex items-center gap-6 mb-6">
        <button className="flex items-center justify-center w-12 h-12 rounded-full bg-gray-200 hover:bg-gray-300 transition">
          <Mic className="text-gray-700" size={22} />
        </button>
        {callStatus !== "ACTIVE" ? (
          <button 
            className="flex items-center justify-center w-12 h-12 rounded-full bg-green-500 hover:bg-green-600 transition relative" 
            onClick={() => handleCall()}
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
            onClick={() => handleDisconnect()}
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
    </div>
  );
};

export default Agent;