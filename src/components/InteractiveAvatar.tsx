import {
  AvatarQuality,
  StreamingEvents,
  VoiceChatTransport,
  VoiceEmotion,
  StartAvatarRequest,
  STTProvider,
  ElevenLabsModel,
} from "@heygen/streaming-avatar";
import { useEffect, useRef, useState } from "react";
import { useMemoizedFn, useUnmount } from "ahooks";

import { Button } from "./Button";
import { AvatarConfig } from "./AvatarConfig";
import { AvatarVideo } from "./AvatarSession/AvatarVideo";
import { useStreamingAvatarSession } from "./logic/useStreamingAvatarSession";
import { AvatarControls } from "./AvatarSession/AvatarControls";
import { useVoiceChat } from "./logic/useVoiceChat";
import { StreamingAvatarProvider, StreamingAvatarSessionState } from "./logic";
import { LoadingIcon } from "./Icons";
import { MessageHistory } from "./AvatarSession/MessageHistory";

import { AVATARS } from "../lib/constants";
import { json } from "stream/consumers";
import { useInterviewQuestions } from "@/context/InterviewQuestionsContext";
import { SessionUtils } from "@/lib/sessionUtils";

const DEFAULT_CONFIG: StartAvatarRequest = {
  quality: AvatarQuality.High,
  avatarName: "Rika_Chair_Sitting_public",
  knowledgeId: "dac41d8b689a45d1aa5f29be957c5d78",
  voice: {
    rate: 1.5,
    emotion: VoiceEmotion.SOOTHING,
    model: ElevenLabsModel.eleven_flash_v2_5,
  },
  language: "en",
  voiceChatTransport: VoiceChatTransport.WEBSOCKET,
  sttSettings: {
    provider: STTProvider.DEEPGRAM,
  },
};

function InteractiveAvatar() {
  const { initAvatar, startAvatar, stopAvatar, sessionState, stream } =
    useStreamingAvatarSession();
  const { startVoiceChat } = useVoiceChat();

  const [config, setConfig] = useState<StartAvatarRequest>(DEFAULT_CONFIG);

  const mediaStream = useRef<HTMLVideoElement>(null);
  const { questions, setQuestions } = useInterviewQuestions()
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(true)

  async function fetchAccessToken() {
    try {
      const response = await fetch("/api/get-access-token", {
        method: "POST",
      });
      const token = await response.text();

      console.log("Access Token:", token); // Log the token to verify

      return token;
    } catch (error) {
      console.error("Error fetching access token:", error);
      throw error;
    }
  }

  const startSessionV2 = useMemoizedFn(async (isVoiceChat: boolean) => {
    try {
      const newToken = await fetchAccessToken();
      const avatar = initAvatar(newToken);

      avatar.on(StreamingEvents.AVATAR_START_TALKING, (e) => {
        console.log("Avatar started talking", e);
      });
      avatar.on(StreamingEvents.AVATAR_STOP_TALKING, (e) => {
        console.log("Avatar stopped talking", e);
      });
      avatar.on(StreamingEvents.STREAM_DISCONNECTED, () => {
        console.log("Stream disconnected");
      });
      avatar.on(StreamingEvents.STREAM_READY, (event) => {
        console.log(">>>>> Stream ready:", event.detail);
      });
      avatar.on(StreamingEvents.USER_START, (event) => {
        console.log(">>>>> User started talking:", event);
      });
      avatar.on(StreamingEvents.USER_STOP, (event) => {
        console.log(">>>>> User stopped talking:", event);
      });
      avatar.on(StreamingEvents.USER_END_MESSAGE, (event) => {
        console.log(">>>>> User end message:", event);
      });
      avatar.on(StreamingEvents.USER_TALKING_MESSAGE, (event) => {
        console.log(">>>>> User talking message:", event);
      });
      avatar.on(StreamingEvents.AVATAR_TALKING_MESSAGE, (event) => {
        console.log(">>>>> Avatar talking message:", event);
      });
      avatar.on(StreamingEvents.AVATAR_END_MESSAGE, (event) => {
        console.log(">>>>> Avatar end message:", event);
      });

      await startAvatar(config);

      if (isVoiceChat) {
        await startVoiceChat();
      }
    } catch (error) {
      console.error("Error starting avatar session:", error);
    }
  });

  useUnmount(() => {
    stopAvatar();
  });

  useEffect(() => {
    if (stream && mediaStream.current) {
      mediaStream.current.srcObject = stream;
      mediaStream.current.onloadedmetadata = () => {
        mediaStream.current!.play();
      };
    }
    const fetchSessionQuestions = async () => {
          const sessionInfo = SessionUtils.getSessionInfo()
          if (sessionInfo.sessionId) {
            setSessionId(sessionInfo.sessionId)
            console.log('📋 Session ID found:', sessionInfo.sessionId, 'from', sessionInfo.source)
            
            // If questions are not already in context, fetch from session
            if (!questions) {
              try {
                console.log('🔍 Fetching questions from session...')
                const response = await fetch(`/api/interview-sessions/${sessionInfo.sessionId}/questions`);
                const data = await response.json();
                console.log(data);
                
                if (data.success) {
                  if (data.data.items) {
                    console.log('✅ Questions loaded from session:', data.data.items)
                    setQuestions(data.data.items)
                  } else {
                    console.log('ℹ️ No questions found in session')
                  }
                } else {
                  console.warn('⚠️ Failed to fetch questions from session:', response.status)
                }
              } catch (error) {
                console.error('❌ Error fetching session questions:', error)
              }
            } else {
              console.log('✅ Questions already available in context')
            }
          } else {
            console.warn('⚠️ No session ID found. QA pairs will not be saved to database.')
          }
          setIsLoadingQuestions(false)
        }
    
        fetchSessionQuestions()
  }, [mediaStream, stream,questions, setQuestions]);

    // Show loading state while fetching questions
  if (isLoadingQuestions) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading interview session</p>
        </div>
      </div>
    )
  }

  // Show error if no questions available after loading
  if (!questions) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">No Questions Available</h1>
          <p className="text-gray-600">Please generate interview questions first.</p>
        </div>
      </div>
    )
  }

  // Format questions for display and assistant
  const allQuestions: string[] = []
  if (questions.items) {
    Object.values(questions.items).forEach(category => {
      allQuestions.push(...category)
    })
  }

  // Format questions for the assistant
  const formattedQuestions = allQuestions.map((q, index) => `${index + 1}. ${q}`).join('\n')

  const startClick = async () => {
    console.log("Start clicked");

    try {
      const token = await fetchAccessToken();
      const questions = formattedQuestions;
      const fullprompt = `You are an AI voice assistant conducting interviews. Your job is to ask candidates provided interview questions, assess their responses. Begin the conversation with a friendly introduction, setting a relaxed yet professional tone. Example: Ask one question at a time and wait for the candidate's response before proceeding. Keep the questions clear and concise. Below Are the Questions:`+questions+` If the candidate struggles, offer hints or rephrase the question without giving away the answer. Example: "Need a hint? Think about how React tracks component updates!" Provide brief, encouraging feedback after each answer. Example: "Nice! That's a solid answer." "Hmm, not quite! Want to try again?" Keep the conversational natural and engaging—use casual phrases like "Alright, next up..." or "Let's tackle a tricky one!" After 5-7 questions, wrap up the interview smoothly by summarizing their performance. Example: "That was great! You handled some tough questions well. Keep sharpening your skills!" End on a positive note:  "Thanks for chatting! Hope to see you crushing projects soon!" Key Guidelines: ✅ Be friendly, engaging, and witty 🎤 ✅ Keep responses short and natural, like a real conversation ✅ Adapt based on the candidate's confidence level`
      const url = `https://api.heygen.com/v1/streaming/knowledge_base/${DEFAULT_CONFIG.knowledgeId}`;
      const options = {
        method: 'POST',
        headers: {
          accept: 'application/json',
          'content-type': 'application/json',
          'x-api-key': process.env.NEXT_PUBLIC_HEYGEN_API_KEY || '',
        },
        body: JSON.stringify({
          prompt: fullprompt,
          name: 'mock-interview',
          opening: "Hey there! I'm excited to interview you  and get to know your skills a little better—let's dive into some questions and see where this takes us!"
        })
      };
      
      const response = await fetch(url, options);
      
      const data = await response.json();
      console.log(data);
      
      
      startSessionV2(true);
    } catch (err) {
      console.error('Error:', err);
    }
  };

  return (
    <div className="w-full flex flex-col gap-4">
      <div className="flex flex-col rounded-xl bg-zinc-900 overflow-hidden">
        <div className="relative w-full aspect-video overflow-hidden flex flex-col items-center justify-center">
          {sessionState !== StreamingAvatarSessionState.INACTIVE && (
            <AvatarVideo ref={mediaStream} />
          )
          }
        </div>
        <div className="flex flex-col gap-3 items-center justify-center p-4 border-t border-zinc-700 w-full">
          {sessionState === StreamingAvatarSessionState.CONNECTED ? (
            <AvatarControls />
          ) : sessionState === StreamingAvatarSessionState.INACTIVE ? (
            <div className="flex flex-row gap-4">
              <Button onClick={startClick}>
                Start Voice Chat
              </Button>
              {/* <Button onClick={() => startSessionV2(false)}>
                Start Text Chat
              </Button> */}
            </div>
          ) : (
            <LoadingIcon />
          )}
        </div>
      </div>
      {sessionState === StreamingAvatarSessionState.CONNECTED && (
        <MessageHistory />
      )}
    </div>
  );
}

export default function InteractiveAvatarWrapper() {
  return (
    <StreamingAvatarProvider basePath={process.env.NEXT_PUBLIC_BASE_API_URL}>
      <InteractiveAvatar />
    </StreamingAvatarProvider>
  );
}
