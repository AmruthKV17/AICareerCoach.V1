import React from "react";

import { useVoiceChat } from "../logic/useVoiceChat";
import { useStreamingAvatarSession } from "../logic/useStreamingAvatarSession";
import { Button } from "../Button";
import { LoadingIcon, MicIcon, MicOffIcon, PhoneOffIcon } from "../Icons";
import { useConversationState } from "../logic/useConversationState";

export const AudioInput: React.FC = () => {
  const { muteInputAudio, unmuteInputAudio, isMuted, isVoiceChatLoading } =
    useVoiceChat();
  const { stopAvatar } = useStreamingAvatarSession();
  const { isUserTalking } = useConversationState();

  const handleMuteClick = () => {
    if (isMuted) {
      unmuteInputAudio();
    } else {
      muteInputAudio();
    }
  };

  const handleEndCall = () => {
    stopAvatar();
  };

  return (
    <div className="flex gap-3 items-center">
      <Button
        className={`!p-2 relative`}
        disabled={isVoiceChatLoading}
        onClick={handleMuteClick}
      >
        <div
          className={`absolute left-0 top-0 rounded-lg border-2 border-[#7559FF] w-full h-full ${isUserTalking ? "animate-ping" : ""}`}
        />
        {isVoiceChatLoading ? (
          <LoadingIcon className="animate-spin" size={20} />
        ) : isMuted ? (
          <MicOffIcon size={20} />
        ) : (
          <MicIcon size={20} />
        )}
      </Button>
      <Button
        className="!p-2 !bg-red-600 hover:!bg-red-700"
        onClick={handleEndCall}
      >
        <PhoneOffIcon size={20} />
      </Button>
    </div>
  );
};
