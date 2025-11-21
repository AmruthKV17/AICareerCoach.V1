import React, { useEffect, useRef } from "react";

import { useMessageHistory, MessageSender } from "../logic";

export const MessageHistory: React.FC = () => {
  const { messages } = useMessageHistory();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;

    if (!container || messages.length === 0) return;

    container.scrollTop = container.scrollHeight;
  }, [messages]);

  return (
    <div
      ref={containerRef}
      className="w-full max-h-72 overflow-y-auto flex flex-col gap-3 px-4 py-4 text-white/90"
    >
      {messages.map((message) => (
        <div
          key={message.id}
          className={`flex flex-col gap-1 max-w-[80%] ${
            message.sender === MessageSender.CLIENT
              ? "self-end items-end"
              : "self-start items-start"
          }`}
        >
          <p className="text-[10px] uppercase tracking-[0.2em] text-white/50">
            {message.sender === MessageSender.AVATAR ? "Interviewer" : "You"}
          </p>
          <p
            className={`rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-lg ${
              message.sender === MessageSender.CLIENT
                ? "bg-emerald-500/15 text-emerald-100"
                : "bg-white/10 text-white"
            }`}
          >
            {message.content}
          </p>
        </div>
      ))}
      {messages.length === 0 && (
        <div className="text-center text-sm text-white/50">
          Conversation will appear here once the interview begins.
        </div>
      )}
    </div>
  );
};
