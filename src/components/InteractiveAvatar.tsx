import {
  AvatarQuality,
  StreamingEvents,
  VoiceChatTransport,
  VoiceEmotion,
  StartAvatarRequest,
  STTProvider,
  ElevenLabsModel,
} from "@heygen/streaming-avatar";
import { useCallback, useEffect, useRef, useState } from "react";
import { useMemoizedFn, useUnmount } from "ahooks";

import { Button } from "./Button";
import { AvatarConfig } from "./AvatarConfig";
import { AvatarVideo } from "./AvatarSession/AvatarVideo";
import { useStreamingAvatarSession } from "./logic/useStreamingAvatarSession";
import { useVoiceChat } from "./logic/useVoiceChat";
import {
  StreamingAvatarProvider,
  StreamingAvatarSessionState,
  MessageSender,
  useMessageHistory,
} from "./logic";
import {
  CameraIcon,
  CameraOffIcon,
  LoadingIcon,
  MicIcon,
  MicOffIcon,
  PhoneOffIcon,
} from "./Icons";

import { AVATARS } from "../lib/constants";
import { json } from "stream/consumers";
import { useInterviewQuestions } from "@/context/InterviewQuestionsContext";
import { SessionUtils } from "@/lib/sessionUtils";

const DEFAULT_CONFIG: StartAvatarRequest = {
  quality: AvatarQuality.High,
  avatarName: "Rika_Chair_Sitting_public",
  knowledgeId: "06e3ca82cd9c476b837d1660fa810494",
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
  const {
    startVoiceChat,
    muteInputAudio,
    unmuteInputAudio,
    isMuted,
    isVoiceChatActive,
    isVoiceChatLoading,
  } = useVoiceChat();

  const [config, setConfig] = useState<StartAvatarRequest>(DEFAULT_CONFIG);

  const mediaStream = useRef<HTMLVideoElement>(null);
  const userVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const { questions, setQuestions } = useInterviewQuestions()
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(true)
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [cameraEnabled, setCameraEnabled] = useState(true)
  const [userMediaError, setUserMediaError] = useState<string | null>(null)
  const [isStartingInterview, setIsStartingInterview] = useState(false)
  const [isEndingInterview, setIsEndingInterview] = useState(false)
  const [qaSaveStatus, setQaSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle')
  const { messages } = useMessageHistory()

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

  const requestLocalStream = useCallback(async () => {
    if (typeof window === "undefined" || !navigator.mediaDevices) {
      setUserMediaError("Camera preview is not supported in this browser.");
      return null;
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        track.enabled = true;
      });
      setLocalStream(localStreamRef.current);
      setCameraEnabled(true);
      setUserMediaError(null);
      if (userVideoRef.current && userVideoRef.current.srcObject !== localStreamRef.current) {
        userVideoRef.current.srcObject = localStreamRef.current;
      }
      return localStreamRef.current;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
        audio: true,
      });

      stream.getVideoTracks().forEach((track) => (track.enabled = true));
      stream.getAudioTracks().forEach((track) => (track.enabled = true));

      localStreamRef.current = stream;
      setLocalStream(stream);
      setCameraEnabled(true);
      setUserMediaError(null);

      if (userVideoRef.current) {
        userVideoRef.current.srcObject = stream;
      }

      return stream;
    } catch (error) {
      console.error("Failed to access camera/microphone", error);
      setUserMediaError(
        "We couldn't access your camera & microphone. Please allow permissions and try again.",
      );
      return null;
    }
  }, []);

  useEffect(() => {
    requestLocalStream();

    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [requestLocalStream]);

  useEffect(() => {
    if (userVideoRef.current && localStream) {
      userVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  const handleCameraToggle = useCallback(async () => {
    const stream = localStreamRef.current ?? (await requestLocalStream());
    if (!stream) return;

    const isCurrentlyEnabled = stream
      .getVideoTracks()
      .some((track) => track.enabled);

    stream.getVideoTracks().forEach((track) => {
      track.enabled = !isCurrentlyEnabled;
    });

    setCameraEnabled(!isCurrentlyEnabled);
  }, [requestLocalStream]);

  const handleMicToggle = () => {
    if (isMuted) {
      unmuteInputAudio();
    } else {
      muteInputAudio();
    }
  };

  const convertMessagesToQaPairs = useCallback(
    (conversation: { sender: MessageSender; content: string }[]) => {
      const qaPairs: Array<{ question: string; answer: string }> = [];
      let currentQuestion: string | null = null;
      let currentAnswerParts: string[] = [];

      const normalize = (text: string) => text.replace(/\s+/g, " ").trim();

      conversation.forEach((message) => {
        const text = normalize(message.content ?? "");
        if (!text) return;

        if (message.sender === MessageSender.AVATAR) {
          if (currentQuestion && currentAnswerParts.length) {
            qaPairs.push({
              question: currentQuestion,
              answer: currentAnswerParts.join(" "),
            });
            currentAnswerParts = [];
          }
          currentQuestion = text;
        } else if (message.sender === MessageSender.CLIENT) {
          if (currentQuestion) {
            currentAnswerParts.push(text);
          }
        }
      });

      if (currentQuestion && currentAnswerParts.length) {
        qaPairs.push({ question: currentQuestion, answer: currentAnswerParts.join(" ") });
      }

      return qaPairs;
    },
    [],
  );

  const handleEndInterview = useCallback(async () => {
    if (isEndingInterview) return;

    const conversationSnapshot = [...messages];
    const qaPairsPayload = convertMessagesToQaPairs(conversationSnapshot);

    setIsEndingInterview(true);

    try {
      await stopAvatar();
    } catch (error) {
      console.error("Error stopping avatar session:", error);
    }

    if (sessionId && qaPairsPayload.length > 0) {
      try {
        setQaSaveStatus('saving');
        const response = await fetch(`/api/interview-sessions/${sessionId}/qa-pairs`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ qaPairs: qaPairsPayload }),
        });

        if (!response.ok) {
          throw new Error('Failed to save QA pairs');
        }

        setQaSaveStatus('success');
        console.log('✅ QA pairs saved successfully (video interview)');
      } catch (error) {
        console.error('❌ Error saving QA pairs from video interview:', error);
        setQaSaveStatus('error');
      }
    } else if (!sessionId) {
      console.warn('⚠️ No sessionId available - QA pairs will not be saved.');
    } else {
      console.warn('⚠️ No QA pairs captured from this interview session.');
    }

    setTimeout(() => {
      if (sessionId) {
        console.log('🔄 Navigating to feedback page for session:', sessionId);
        window.location.href = `/feedback/${sessionId}`;
      } else {
        alert('Interview ended, but no session ID available for feedback.');
      }
      setIsEndingInterview(false);
    }, 2000);
  }, [convertMessagesToQaPairs, isEndingInterview, messages, sessionId, stopAvatar]);

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
  }, [mediaStream, stream, questions, setQuestions]);

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

    setIsStartingInterview(true);

    try {
      const local = localStreamRef.current ?? (await requestLocalStream());
      if (!local) {
        throw new Error("Camera & microphone permissions are required");
      }

      local.getVideoTracks().forEach((track) => (track.enabled = true));
      local.getAudioTracks().forEach((track) => (track.enabled = true));
      setCameraEnabled(true);

      const questions = formattedQuestions;
      const fullprompt = `You are an AI voice assistant conducting interviews. Your job is to ask candidates provided interview questions, assess their responses. Begin the conversation with a friendly introduction, setting a relaxed yet professional tone. Example: Ask one question at a time and wait for the candidate's response before proceeding. Keep the questions clear and concise. Below Are the Questions:` + questions + ` If the candidate struggles, offer hints or rephrase the question without giving away the answer. Example: "Need a hint? Think about how React tracks component updates!" Provide brief, encouraging feedback after each answer. Example: "Nice! That's a solid answer." "Hmm, not quite! Want to try again?" Keep the conversational natural and engaging—use casual phrases like "Alright, next up..." or "Let's tackle a tricky one!" After 5-7 questions, wrap up the interview smoothly by summarizing their performance. Example: "That was great! You handled some tough questions well. Keep sharpening your skills!" End on a positive note:  "Thanks for chatting! Hope to see you crushing projects soon!" Key Guidelines: ✅ Be friendly, engaging, and witty 🎤 ✅ Keep responses short and natural, like a real conversation ✅ Adapt based on the candidate's confidence level`
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
      if (!userMediaError) {
        setUserMediaError(
          err instanceof Error ? err.message : 'Unable to start the interview. Please check your camera and microphone permissions.',
        );
      }
    } finally {
      setIsStartingInterview(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white py-10 px-4">
      <div className="max-w-screen flex flex-col gap-6">
        <div className="relative rounded-[32px] border border-white/10 bg-black/60 shadow-2xl overflow-hidden">
          <div className=" inset-0 bg-gradient-to-br from-slate-900/70 to-slate-800/30" />
          <div className="relative w-full aspect-video flex items-center justify-center">
            {sessionState !== StreamingAvatarSessionState.INACTIVE ? (
              <AvatarVideo ref={mediaStream} />
            ) : (
              <div className="flex flex-col items-center gap-3 text-center px-6">
                <p className="text-2xl font-semibold">Ready to go live</p>
                <p className="text-white/70 max-w-md">
                  Start the interview to connect with your AI interviewer. Your camera preview
                  appears in the corner just like Google Meet.
                </p>
              </div>
            )}
          </div>

          <div className="absolute top-4 left-4 bg-white/10 backdrop-blur px-4 py-2 rounded-full text-sm font-medium">
            {sessionState === StreamingAvatarSessionState.CONNECTED
              ? "Interview in progress"
              : sessionState === StreamingAvatarSessionState.CONNECTING
                ? "Connecting to interviewer"
                : "Waiting to start"}
          </div>

          <div className="absolute bottom-4 right-4 w-48 aspect-video rounded-2xl border border-white/20 bg-black/80 overflow-hidden shadow-2xl flex items-center justify-center">
            {localStream ? (
              <>
                <video
                  ref={userVideoRef}
                  autoPlay
                  muted
                  playsInline
                  className={`h-full w-full object-cover ${cameraEnabled ? "opacity-100" : "opacity-40 grayscale"} scale-x-[-1]`}
                />
                {!cameraEnabled && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/70 text-xs font-semibold tracking-wide uppercase">
                    Camera off
                  </div>
                )}
              </>
            ) : (
              <p className="text-xs text-white/70 px-4 text-center">Waiting for camera…</p>
            )}
          </div>

          {userMediaError && (
            <div className="absolute inset-x-0 bottom-0 bg-rose-600/70 backdrop-blur text-sm px-4 py-3 flex flex-col gap-2">
              <span>{userMediaError}</span>
              <div>
                <Button className="!bg-white/20 !text-white" onClick={requestLocalStream}>
                  Retry permissions
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white/5 border border-white/10 rounded-[32px] backdrop-blur-xl px-6 py-5 flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-lg font-semibold">Controls</p>
              <p className="text-sm text-white/70 max-w-xl">
                {sessionState === StreamingAvatarSessionState.INACTIVE
                  ? "Enable your mic and camera, then start the interview to meet the AI interviewer."
                  : sessionState === StreamingAvatarSessionState.CONNECTING
                    ? "Hang tight while we establish the call."
                    : "You’re live. Keep responding naturally and stay confident."}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={handleMicToggle}
                disabled={isVoiceChatLoading}
                className={`h-12 w-12 rounded-full flex items-center justify-center text-white transition-all ${isMuted ? "bg-rose-600 hover:bg-rose-500" : "bg-white/20 hover:bg-white/30"
                  } ${isVoiceChatLoading ? "opacity-50 cursor-not-allowed" : ""}`}
                aria-label={isMuted ? "Unmute microphone" : "Mute microphone"}
              >
                {isMuted ? <MicOffIcon size={22} /> : <MicIcon size={22} />}
              </button>

              <button
                onClick={handleCameraToggle}
                className={`h-12 w-12 rounded-full flex items-center justify-center text-white transition-all ${cameraEnabled ? "bg-white/20 hover:bg-white/30" : "bg-rose-600 hover:bg-rose-500"
                  }`}
                aria-label={cameraEnabled ? "Turn camera off" : "Turn camera on"}
              >
                {cameraEnabled ? <CameraIcon size={22} /> : <CameraOffIcon size={22} />}
              </button>

              {sessionState !== StreamingAvatarSessionState.INACTIVE && (
                <button
                  onClick={handleEndInterview}
                  disabled={isEndingInterview}
                  className={`h-12 w-12 rounded-full flex items-center justify-center transition-all ${isEndingInterview
                    ? "bg-rose-600/60 cursor-wait"
                    : "bg-rose-600 hover:bg-rose-500"
                    }`}
                  aria-label="Leave interview"
                >
                  {isEndingInterview ? <LoadingIcon size={18} /> : <PhoneOffIcon size={22} />}
                </button>
              )}

              <Button
                onClick={startClick}
                disabled={
                  sessionState !== StreamingAvatarSessionState.INACTIVE ||
                  isStartingInterview ||
                  isLoadingQuestions ||
                  isEndingInterview
                }
                className="px-8 py-3 text-base font-semibold shadow-xl hover:shadow-2xl"
              >
                {isStartingInterview || isVoiceChatLoading ? (
                  <span className="flex items-center gap-2">
                    <LoadingIcon size={18} />
                    Connecting…
                  </span>
                ) : (
                  "Start Interview"
                )}
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-white/60 flex-wrap gap-2">
            <span>
              {isVoiceChatActive
                ? "Mic is live. Interviewer can hear you."
                : "Mic will start automatically once the interview begins."}
            </span>
            {qaSaveStatus === 'saving' && (
              <span className="text-amber-200">Saving your responses…</span>
            )}
            {qaSaveStatus === 'success' && (
              <span className="text-emerald-200">Responses saved. Redirecting…</span>
            )}
            {qaSaveStatus === 'error' && (
              <span className="text-rose-300">Couldn’t save responses. Redirecting…</span>
            )}
            {sessionId && (
              <span className="font-mono text-white/70">
                Session ID: <span className="text-white">{sessionId}</span>
              </span>
            )}
          </div>
        </div>
      </div>
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
