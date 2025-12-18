# AI Career Coach Platform
<img width="1647" height="897" alt="Screenshot 2025-12-06 013726" src="https://github.com/user-attachments/assets/e0296792-bef6-44f0-9dcd-3293cdac7723" />


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

**1. Install dependencies**

npm install


**2. Configure environment**

cp .env.example .env.local


Fill in:

NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=

CLERK_SECRET_KEY=

VAPI_API_KEY=

HEYGEN_API_KEY=

OPENAI_API_KEY= (or other LLM provider)

CREWAI_CONFIG_PATH=./config/crews


**3. Run the dev server**

npm run dev

Then open `http://localhost:3000` and start a mock interview or upload a resume to see the agents in action. 

**Screenshots**

1. Home page

<img width="668" height="502" alt="Screenshot 2025-12-06 015133" src="https://github.com/user-attachments/assets/3fa97227-ed09-4d3b-b938-f39f033216af" />

2. Interview with AI

<img width="1647" height="897" alt="Screenshot 2025-12-06 013726" src="https://github.com/user-attachments/assets/919ec546-a81d-47ee-af83-1eacf723614f" />

3. Evaluation results

<img width="811" height="778" alt="Screenshot 2025-12-06 015108" src="https://github.com/user-attachments/assets/e8bde408-7273-4d3d-b713-932d9d9c6879" />

4. Resume Optimization

<img width="726" height="764" alt="Screenshot 2025-12-06 000313" src="https://github.com/user-attachments/assets/81930559-c9ca-48d9-939f-512a1daeb21a" />

5. Industry Insights

<img width="791" height="717" alt="Screenshot 2025-12-06 014658" src="https://github.com/user-attachments/assets/dfbc3efa-726e-4546-8c13-f941f3808dd6" />

