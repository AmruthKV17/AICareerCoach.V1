# AI Career Coach Platform

An AI-powered career coaching platform that simulates real interview experiences and optimizes resumes using a multi‑agent architecture built on **Next.js**, **TypeScript**, **CrewAI**, **VAPI**, **HeyGen**, and **Clerk Auth**.

## Features

- **Dual‑Modality Interview Simulation**  
  Run realistic mock interviews with synchronized **voice + video** using VAPI for conversational voice agents and HeyGen for streaming video avatars.

- **Multi‑Agent Orchestration**  
  Orchestrates **10+ specialized AI agents** (interviewer, evaluator, coach, research, summarizer, etc.) via CrewAI to manage question flow, evaluation, and feedback loops.

- **Resume Intelligence Engine**  
  A dedicated **5‑agent resume crew** scores JD alignment, detects skill gaps, and generates tailored cover letters as structured JSON ready for downstream products.

- **Secure User Accounts**  
  Uses **Clerk** for authentication, role‑based access, and session management so users can save interviews, resumes, and improvement history.

- **Modern Frontend Experience**  
  Built with **Next.js + TypeScript** for a performant, type‑safe UI, server actions, and API routes that connect to CrewAI workflows and external LLM providers.

## Tech Stack

- **Frontend**: Next.js, React, TypeScript  
- **AI Orchestration**: CrewAI (multi‑agent workflows)  
- **Voice & Video**: VAPI Voice AI, HeyGen Streaming Avatars
- **Auth**: Clerk  
- **Data & Integrations**: REST/JSON APIs for resume analysis, job‑description ingestion, and analytics dashboards.

## How It Works

1. **User signs in** with Clerk and selects a target role/JD.   
2. **Multi‑agent interview crew** spins up: one agent asks questions, another evaluates responses, a coach agent summarizes feedback, and others log insights.  
3. **Voice + video layer** streams a realistic interviewer avatar using VAPI + HeyGen while capturing user audio/video.   
4. **Resume crew** parses the user’s resume, scores alignment to the JD, flags missing skills, and returns a JSON object with scores, gap analysis, and a generated cover letter.  
5. **Next.js UI** renders interview history, feedback timelines, and resume recommendations in a clean dashboard.

## Getting Started

> Note: Replace placeholder keys with your own credentials.

