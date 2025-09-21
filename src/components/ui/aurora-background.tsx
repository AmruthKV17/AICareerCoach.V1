"use client";
import { cn } from "@/lib/utils";
import React, { ReactNode } from "react";

interface AuroraBackgroundProps extends React.HTMLProps<HTMLDivElement> {
  children: ReactNode;
  showRadialGradient?: boolean;
}

export const AuroraBackground = ({
  className,
  children,
  showRadialGradient = true,
  ...props
}: AuroraBackgroundProps) => {
  return (
    <main>
      <div
        className={cn(
          "relative flex flex-col h-[100vh] items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-zinc-900 dark:via-blue-900/20 dark:to-purple-900/20 text-slate-950 dark:text-white transition-all duration-300",
          className
        )}
        {...props}
      >
        <div className="absolute inset-0 overflow-hidden">
          <div
            className="absolute inset-0 opacity-30 animate-aurora"
            style={{
              background: `
                repeating-linear-gradient(
                  100deg,
                  transparent 0%,
                  transparent 7%,
                  rgba(59, 130, 246, 0.3) 10%,
                  rgba(165, 180, 252, 0.3) 15%,
                  rgba(147, 197, 253, 0.3) 20%,
                  rgba(221, 214, 254, 0.3) 25%,
                  rgba(96, 165, 250, 0.3) 30%,
                  transparent 35%
                ),
                linear-gradient(
                  90deg,
                  rgba(59, 130, 246, 0.1) 0%,
                  rgba(165, 180, 252, 0.2) 25%,
                  rgba(147, 197, 253, 0.3) 50%,
                  rgba(221, 214, 254, 0.2) 75%,
                  rgba(96, 165, 250, 0.1) 100%
                )
              `,
              backgroundSize: '300% 200%',
              filter: 'blur(8px)',
            }}
          ></div>
          <div
            className="absolute inset-0 opacity-20 animate-aurora"
            style={{
              background: `
                radial-gradient(
                  ellipse at center,
                  rgba(59, 130, 246, 0.4) 0%,
                  rgba(165, 180, 252, 0.3) 25%,
                  rgba(147, 197, 253, 0.2) 50%,
                  transparent 70%
                )
              `,
              backgroundSize: '200% 100%',
              animationDelay: '10s',
            }}
          ></div>
        </div>
        {children}
      </div>
    </main>
  );
};
