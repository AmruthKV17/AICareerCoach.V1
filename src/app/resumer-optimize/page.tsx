"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { useDropzone } from "react-dropzone";
import {
  AlertCircle,
  ArrowRight,
  BarChart3,
  Building2,
  Eye,
  CheckCircle2,
  ClipboardList,
  FileText,
  Download,
  Link2,
  Loader2,
  Sparkles,
  UploadCloud,
  Wand2,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import {
  PolarAngleAxis,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
} from "recharts";
import { pdf } from "@react-pdf/renderer";

type RadialBarData = { name: string; value: number; fill: string };

import { RESUME_OPTIMIZE_ENDPOINT } from "@/lib/api";
import PDFViewer from "@/components/PDFViewer";
import ResumePdfTemplate, { GeneratedResume } from "@/components/ResumePdfTemplate";
import { uploadFile } from "../api/upload/route";

type SkillScore = {
  skill_name: string;
  required?: boolean;
  match_level?: number;
  years_experience?: number | null;
  context_score?: number | null;
};

type MatchScore = {
  overall_match?: number;
  technical_skills_match?: number;
  soft_skills_match?: number;
  experience_match?: number;
  education_match?: number;
  industry_match?: number;
  strengths?: string[];
  gaps?: string[];
  skill_details?: SkillScore[];
};

type JobAnalysis = {
  job_title?: string;
  department?: string | null;
  job_level?: string | null;
  job_url?: string;
  location_requirements?: Record<string, string>;
  work_schedule?: string | null;
  technical_skills?: string[];
  soft_skills?: string[];
  nice_to_have?: string[];
  key_responsibilities?: string[];
  match_score?: MatchScore;
};

type ResumeOptimization = {
  content_suggestions?: { before: string; after: string }[];
  skills_to_highlight?: string[];
  achievements_to_add?: string[];
  keywords_for_ats?: string[];
  formatting_suggestions?: string[];
};

type ResumeAnalysis = {
  uploaded_filename?: string | null;
  page_count?: number;
  resume_length_chars?: number;
  extracted_text_preview?: string | null;
  keyword_coverage?: {
    total_keywords?: number;
    present?: string[];
    coverage_percent?: number | null;
  } | null;
};

type CompanyResearch = {
  recent_developments?: string[];
  culture_and_values?: string[];
  market_position?: {
    position?: string[];
    competitors?: string[];
  };
  growth_trajectory?: string[];
  interview_questions?: string[];
};

type CrewResponse = {
  run_id: string;
  job_url: string;
  company_name: string;
  job_analysis?: JobAnalysis | null;
  resume_optimization?: ResumeOptimization | null;
  company_research?: CompanyResearch | null;
  resume_analysis?: ResumeAnalysis | null;
  optimized_resume?: string | null;
  final_report?: string | null;
  generated_resume?: GeneratedResume | null;
};

type ParsedResumeSummary = {
  rawText: string;
  wordCount: number;
  summary: {
    name: string | null;
    email: string | null;
    phone: string | null;
  };
  sections: Record<string, string>;
};

type ResumeUploadResponse = {
  resume?: ParsedResumeSummary;
  metadata?: {
    pages: number | null;
    info: Record<string, unknown> | null;
    fileName: string;
    fileSize: number;
  };
  error?: string;
};

type SectionCardProps = {
  title: string;
  subtitle?: string;
  accent?: string;
  children: React.ReactNode;
  className?: string;
};

const gradientPalette = [
  "from-cyan-500/20 via-transparent to-transparent",
  "from-emerald-400/20 via-transparent to-transparent",
  "from-fuchsia-500/20 via-transparent to-transparent",
  "from-amber-400/20 via-transparent to-transparent",
];

const SectionCard = ({
  title,
  subtitle,
  accent = gradientPalette[0],
  children,
  className,
}: SectionCardProps) => (
  <section
    className={clsx(
      "relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-xl backdrop-blur-sm",
      className,
    )}
  >
    <div
      className={clsx(
        "pointer-events-none absolute inset-0 opacity-30 blur-3xl",
        `bg-gradient-to-br ${accent}`,
      )}
    />
    <div className="relative flex flex-col gap-2">
      <div>
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-slate-500">
          {title}
        </p>
        {subtitle ? (
          <p className="text-base text-slate-600">{subtitle}</p>
        ) : null}
      </div>
      {children}
    </div>
  </section>
);

const MarkdownPanel = ({ title, content }: { title: string; content?: string | null }) => (
  <SectionCard title={title} subtitle="Rendered markdown output" accent={gradientPalette[3]}>
    {content ? (
      <div className="markdown-body">
        <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
          {content}
        </ReactMarkdown>
      </div>
    ) : (
      <p className="text-sm text-slate-500">Run the analysis to view this section.</p>
    )}
  </SectionCard>
);

const StatBadge = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-2xl border border-slate-100 bg-slate-50 px-5 py-4 text-sm shadow-sm">
    <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{label}</p>
    <p className="mt-2 text-lg font-bold text-slate-900">{value}</p>
  </div>
);

const BulletList = ({
  items,
  icon: Icon,
}: {
  items: string[];
  icon: typeof CheckCircle2;
}) => (
  <ul className="space-y-3">
    {items.map((item) => (
      <li key={item} className="flex items-start gap-3 text-sm leading-6 text-slate-700">
        <Icon className="mt-0.5 h-4 w-4 text-cyan-600" />
        <span>{item}</span>
      </li>
    ))}
  </ul>
);

const KeywordChips = ({ keywords }: { keywords: string[] }) => (
  <div className="flex flex-wrap gap-2">
    {keywords.map((keyword) => (
      <span
        key={keyword}
        className="rounded-full border border-cyan-200 bg-cyan-50 px-4 py-1 text-xs font-bold uppercase tracking-widest text-cyan-700 shadow-sm"
      >
        {keyword}
      </span>
    ))}
  </div>
);

const ContentTimeline = ({ suggestions }: { suggestions: { before: string; after: string }[] }) => (
  <div className="space-y-4">
    {suggestions.map((suggestion, index) => (
      <div key={`${suggestion.before}-${index}`} className="flex gap-4">
        <div className="flex flex-col items-center">
          <span className="rounded-full bg-emerald-100 p-2 text-emerald-600">
            <Wand2 className="h-4 w-4" />
          </span>
          {index < suggestions.length - 1 ? (
            <div className="h-full w-px bg-slate-200" />
          ) : null}
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Before</p>
          <p className="mb-3 mt-1 text-slate-600 line-through decoration-rose-400/50">{suggestion.before}</p>
          <p className="text-xs uppercase tracking-[0.3em] text-emerald-600">After</p>
          <p className="mt-1 font-medium text-slate-900">{suggestion.after}</p>
        </div>
      </div>
    ))}
  </div>
);

export default function ResumeOptimizePage() {
  const router = useRouter();
  const [jobUrl, setJobUrl] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CrewResponse | null>(null);
  const [parsedResume, setParsedResume] = useState<ParsedResumeSummary | null>(null);
  const [optimizedResume, setOptimizedResume] = useState<GeneratedResume | null>(null);
  const [optimizedResumeBlob, setOptimizedResumeBlob] = useState<Blob | null>(null);
  const [optimizedResumeUrl, setOptimizedResumeUrl] = useState<string | null>(null);
  const [isBuildingPdf, setIsBuildingPdf] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      setError("Please upload your resume as a PDF file.");
      return;
    }
    setError(null);
    setResumeFile(file);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    maxFiles: 1,
    accept: { "application/pdf": [".pdf"] },
  });

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!jobUrl.trim()) {
      setError("Please paste a job posting URL.");
      return;
    }
    if (!resumeFile) {
      setError("Please upload your resume (PDF).");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const uploadFormData = new FormData();
    uploadFormData.append('resume', resumeFile);

    const optimizeFormData = new FormData();
    optimizeFormData.append('job_url', jobUrl.trim());
    if (companyName.trim()) {
      optimizeFormData.append('company_name', companyName.trim());
    }
    optimizeFormData.append('resume', resumeFile);

    try {
      //       const result = await uploadFile(uploadFormData);

      // if (result.success) {
      //   alert(result.message);
      // } else {
      //   alert(result.message);
      // }
      const response = await fetch('/api/uploadResume', { method: 'POST', body: uploadFormData })
      // console.log(response);

      const data = await response.json();
      console.log(data);
      console.log('Calling crew AI for analysis')

      const final_response = await fetch("/api/resume-crew", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resume_text: data.text,
          target_role: companyName.trim(),
          job_posting_url: jobUrl.trim(),
        }),
      })

      if (!final_response.ok) {
        const errorText = await final_response.text()
        console.error('API Error Response:', errorText)
        throw new Error(`HTTP error! status: ${final_response.status} - ${errorText}`)
      }

      const result = await final_response.json()
      // console.log(result);

      console.log('✅ Analysis API Response:', result)

      // Async Kickoff Handling: Redirect if ID is present
      if (result.success && result.kickoff_id) {
        router.push(`/analysis?id=${result.kickoff_id}`);
        return;
      }

    } catch (submitError) {
      setResult(null)
      // await buildOptimizedResumePdf(null)
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'Unable to reach the optimization service.'
      )
    } finally {
      // Keep loading true if redirecting
      // setIsSubmitting(false) 
    }
  };

  const matchScore = result?.job_analysis?.match_score;
  const overallScore = Math.min(100, Math.max(0, matchScore?.overall_match ?? 0));

  const scoreChartData = useMemo<RadialBarData[]>(() => {
    if (!matchScore) return [];
    return [
      { name: "Tech", value: matchScore.technical_skills_match ?? 0, fill: "#06b6d4" },
      { name: "Soft", value: matchScore.soft_skills_match ?? 0, fill: "#f472b6" },
      { name: "Experience", value: matchScore.experience_match ?? 0, fill: "#22c55e" },
      { name: "Education", value: matchScore.education_match ?? 0, fill: "#eab308" },
      { name: "Industry", value: matchScore.industry_match ?? 0, fill: "#a855f7" },
    ].filter((item) => item.value > 0);
  }, [matchScore]);

  const skillDetails = matchScore?.skill_details ?? [];
  const optimization = result?.resume_optimization;
  const research = result?.company_research;
  const resumeAnalysis = result?.resume_analysis;
  const keywordCoverage = resumeAnalysis?.keyword_coverage;

  const buildOptimizedResumePdf = useCallback(async (resumeData: GeneratedResume | null) => {
    setOptimizedResume(resumeData);
    setOptimizedResumeBlob(null);
    if (!resumeData) {
      return;
    }
    setIsBuildingPdf(true);
    try {
      const blob = await pdf(<ResumePdfTemplate data={resumeData} />).toBlob();
      setOptimizedResumeBlob(blob);
    } catch (pdfError) {
      console.error("Failed to build resume PDF", pdfError);
    } finally {
      setIsBuildingPdf(false);
    }
  }, []);

  useEffect(() => {
    if (!optimizedResumeBlob) {
      setOptimizedResumeUrl(null);
      return;
    }
    const objectUrl = URL.createObjectURL(optimizedResumeBlob);
    setOptimizedResumeUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [optimizedResumeBlob]);

  return (
    <div className="px-6 py-12 lg:px-12">
      <div className="mx-auto flex max-w-6xl flex-col gap-10">
        <section className="rounded-3xl border border-blue-100 bg-white p-8 shadow-xl">
          <div className="flex items-center justify-between">
            <p className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-1 text-xs font-bold uppercase tracking-[0.3em] text-blue-700">
              <Sparkles className="h-4 w-4 text-blue-500" /> Beta Studio
            </p>
            <a
              href="/analysis"
              className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-4 py-1 text-xs font-bold uppercase tracking-[0.2em] text-cyan-700 hover:bg-cyan-100 transition-all hover:scale-105"
            >
              <BarChart3 className="h-4 w-4 text-cyan-600" /> View Analysis Dashboard
            </a>
          </div>
          <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-4xl font-bold text-slate-900 lg:text-5xl">
                Resume Optimization Studio
              </h1>
              <p className="mt-4 max-w-3xl text-lg text-slate-600">
                Upload your resume PDF, provide the job posting link, and get an interactive report
                highlighting content gaps, ATS keywords, and company insights generated by your CrewAI pipeline.
              </p>
            </div>
            {result ? (
              <div className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm text-slate-600 shadow-sm">
                <span className="text-xs uppercase tracking-[0.3em] text-slate-400">Run ID</span>
                <span className="font-mono text-base text-slate-900">{result.run_id}</span>
                <span className="text-xs text-slate-400">Company: {result.company_name}</span>
              </div>
            ) : null}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <form
            onSubmit={handleSubmit}
            className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl backdrop-blur-sm"
          >
            <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.3em] text-slate-500">
              <ClipboardList className="h-4 w-4" /> Submission
            </div>
            <div className="mt-6 grid gap-4">
              <label className="text-sm font-medium text-slate-700">
                Job posting URL
                <div className="mt-2 flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 focus-within:border-cyan-500 focus-within:ring-2 focus-within:ring-cyan-500/20 transition-all">
                  <Link2 className="h-4 w-4 text-cyan-600" />
                  <input
                    type="url"
                    placeholder="https://company.com/careers/..."
                    value={jobUrl}
                    onChange={(event) => setJobUrl(event.target.value)}
                    className="flex-1 bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
                  />
                </div>
              </label>

              <label className="text-sm font-medium text-slate-700">
                Company name (optional override)
                <div className="mt-2 flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 focus-within:border-cyan-500 focus-within:ring-2 focus-within:ring-cyan-500/20 transition-all">
                  <Building2 className="h-4 w-4 text-emerald-600" />
                  <input
                    type="text"
                    placeholder="Acme Corp"
                    value={companyName}
                    onChange={(event) => setCompanyName(event.target.value)}
                    className="flex-1 bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
                  />
                </div>
              </label>

              <div className="text-sm font-medium text-slate-700">
                Resume PDF
                <div
                  {...getRootProps()}
                  className={clsx(
                    "mt-2 flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-10 transition",
                    isDragActive ? "border-cyan-500 bg-cyan-50" : "border-slate-200 bg-slate-50 hover:border-cyan-400 hover:bg-slate-100",
                  )}
                >
                  <input {...getInputProps()} />
                  <UploadCloud className="h-10 w-10 text-cyan-500" />
                  <p className="text-base text-slate-900">
                    {resumeFile ? resumeFile.name : "Drop your PDF here or click to browse"}
                  </p>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Max 25 MB • PDF only</p>
                </div>
              </div>
            </div>

            {error ? (
              <div className="mt-4 flex items-center gap-2 rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-linear-to-r from-cyan-400 via-sky-500 to-indigo-500 px-6 py-3 text-base font-semibold text-white shadow-lg shadow-cyan-500/30 transition hover:scale-[1.01]"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" /> Optimizing...
                </>
              ) : (
                <>
                  Launch Crew <ArrowRight className="h-5 w-5" />
                </>
              )}
            </button>
          </form>

          <SectionCard
            title="How it works"
            subtitle="CrewAI orchestrates agents for analysis, optimization, and insights"
            accent={gradientPalette[1]}
            className="h-full"
          >
            <ul className="mt-4 space-y-4 text-sm text-slate-700">
              <li className="flex items-start gap-3">
                <Sparkles className="mt-0.5 h-4 w-4 text-cyan-600" />
                Job analyzer extracts skill matrices & scoring factors.
              </li>
              <li className="flex items-start gap-3">
                <FileText className="mt-0.5 h-4 w-4 text-emerald-600" />
                Resume optimizer delivers content rewrites, ATS keywords, and achievements to emphasize.
              </li>
              <li className="flex items-start gap-3">
                <BarChart3 className="mt-0.5 h-4 w-4 text-amber-600" />
                Company researcher enriches the report with up-to-date insights and interview prompts.
              </li>
            </ul>
          </SectionCard>
        </section>

        {result ? (
          <div className="space-y-6">
            <SectionCard
              title="Match overview"
              subtitle="Key scores from the job analysis agent"
              accent={gradientPalette[0]}
            >
              <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
                <div className="mx-auto flex flex-col items-center gap-4">
                  <div
                    className="relative flex h-48 w-48 items-center justify-center rounded-full border border-white/10 bg-slate-900/40"
                    style={{
                      background: `conic-gradient(#22d3ee ${overallScore * 3.6}deg, rgba(15,23,42,0.6) ${overallScore * 3.6}deg)`,
                    }}
                  >
                    <div className="flex h-36 w-36 flex-col items-center justify-center rounded-full bg-slate-950/80 text-center">
                      <span className="text-xs uppercase tracking-[0.3em] text-slate-400">Overall</span>
                      <span className="text-4xl font-semibold text-white">{overallScore.toFixed(0)}%</span>
                      <span className="text-xs text-slate-400">match score</span>
                    </div>
                  </div>
                  <div className="text-center text-sm text-slate-300">
                    {result.job_analysis?.job_title ?? "Target role"}
                  </div>
                </div>
                <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Score breakdown</p>
                    <div className="mt-3 h-52 w-full">
                      <ResponsiveContainer>
                        <RadialBarChart
                          data={scoreChartData}
                          innerRadius="20%"
                          outerRadius="100%"
                          startAngle={90}
                          endAngle={-270}
                        >
                          <PolarAngleAxis type="number" tick={false} domain={[0, 100]} />
                          <RadialBar dataKey="value" background cornerRadius={8} />
                        </RadialBarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-500">
                      {scoreChartData.map((item) => (
                        <span
                          key={item.name}
                          className="rounded-full border border-slate-200 px-3 py-1 font-semibold"
                          style={{ color: item.fill }}
                        >
                          {item.name}: {item.value.toFixed(0)}%
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-3">
                    <StatBadge
                      label="Location"
                      value={
                        result.job_analysis?.location_requirements?.location ?? "Remote / Hybrid"
                      }
                    />
                    <StatBadge
                      label="Schedule"
                      value={
                        result.job_analysis?.work_schedule ??
                        result.job_analysis?.location_requirements?.work_schedule ??
                        "Flexible"
                      }
                    />
                    <a
                      href={result.job_url}
                      target="_blank"
                      rel="noreferrer"
                      className="block"
                    >
                      <StatBadge label="Job URL" value="Open posting" />
                    </a>
                  </div>
                </div>
              </div>
            </SectionCard>

            {matchScore?.strengths?.length || matchScore?.gaps?.length ? (
              <SectionCard
                title="Fit narrative"
                subtitle="What stands out and what to reinforce"
                accent={gradientPalette[2]}
              >
                <div className="grid gap-6 lg:grid-cols-2">
                  {matchScore?.strengths?.length ? (
                    <div>
                      <p className="text-sm font-semibold text-emerald-600">Strengths</p>
                      <BulletList items={matchScore.strengths} icon={CheckCircle2} />
                    </div>
                  ) : null}
                  {matchScore?.gaps?.length ? (
                    <div>
                      <p className="text-sm font-semibold text-rose-600">Gaps</p>
                      <BulletList items={matchScore.gaps} icon={AlertCircle} />
                    </div>
                  ) : null}
                </div>
              </SectionCard>
            ) : null}

            {skillDetails.length ? (
              <SectionCard
                title="Skill-by-skill radar"
                subtitle="Match level, requirement, and context"
                accent={gradientPalette[1]}
              >
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm text-slate-700">
                    <thead>
                      <tr className="text-left text-xs uppercase tracking-[0.3em] text-slate-500">
                        <th className="pb-3">Skill</th>
                        <th className="pb-3">Required?</th>
                        <th className="pb-3">Match</th>
                        <th className="pb-3">Years</th>
                        <th className="pb-3">Context</th>
                      </tr>
                    </thead>
                    <tbody>
                      {skillDetails.map((skill) => (
                        <tr key={skill.skill_name} className="border-t border-slate-200">
                          <td className="py-3 font-medium text-slate-900">{skill.skill_name}</td>
                          <td className="py-3">
                            <span
                              className={clsx(
                                "rounded-full px-3 py-1 text-xs font-semibold",
                                skill.required
                                  ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                                  : "border border-slate-200 bg-slate-50 text-slate-600",
                              )}
                            >
                              {skill.required ? "Required" : "Nice"}
                            </span>
                          </td>
                          <td className="py-3">{(skill.match_level ?? 0) * 100}%</td>
                          <td className="py-3">{skill.years_experience ?? "-"}</td>
                          <td className="py-3">{((skill.context_score ?? 0) * 100).toFixed(0)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </SectionCard>
            ) : null}

            {optimization ? (
              <SectionCard
                title="Optimization blueprint"
                subtitle="Concrete upgrades suggested by the resume agent"
                accent={gradientPalette[3]}
              >
                <div className="grid gap-6 lg:grid-cols-2">
                  {optimization.keywords_for_ats?.length ? (
                    <div>
                      <p className="text-sm font-semibold text-cyan-600">ATS Keywords</p>
                      <KeywordChips keywords={optimization.keywords_for_ats} />
                    </div>
                  ) : null}
                  {optimization.skills_to_highlight?.length ? (
                    <div>
                      <p className="text-sm font-semibold text-emerald-600">Skills to spotlight</p>
                      <KeywordChips keywords={optimization.skills_to_highlight} />
                    </div>
                  ) : null}
                </div>

                {optimization.content_suggestions?.length ? (
                  <div className="mt-6">
                    <p className="text-sm font-semibold text-slate-900">Content rewrites</p>
                    <ContentTimeline suggestions={optimization.content_suggestions} />
                  </div>
                ) : null}

                <div className="mt-6 grid gap-6 lg:grid-cols-2">
                  {optimization.achievements_to_add?.length ? (
                    <div>
                      <p className="text-sm font-semibold text-amber-600">Wins to include</p>
                      <BulletList items={optimization.achievements_to_add} icon={CheckCircle2} />
                    </div>
                  ) : null}
                  {optimization.formatting_suggestions?.length ? (
                    <div>
                      <p className="text-sm font-semibold text-fuchsia-600">Formatting polish</p>
                      <BulletList items={optimization.formatting_suggestions} icon={Sparkles} />
                    </div>
                  ) : null}
                </div>
              </SectionCard>
            ) : null}

            {resumeAnalysis ? (
              <SectionCard
                title="Resume evidence"
                subtitle="What the system actually read from your uploaded PDF"
                accent={gradientPalette[0]}
              >
                <div className="grid gap-4 md:grid-cols-4">
                  <StatBadge
                    label="File"
                    value={resumeAnalysis.uploaded_filename ?? "Resume.pdf"}
                  />
                  <StatBadge
                    label="Pages"
                    value={`${resumeAnalysis.page_count ?? 0}`}
                  />
                  <StatBadge
                    label="Characters"
                    value={`${resumeAnalysis.resume_length_chars ?? 0}`}
                  />
                  <StatBadge
                    label="Keyword match"
                    value={`${keywordCoverage?.coverage_percent ?? 0}%`}
                  />
                </div>

                <div className="mt-6">
                  <p className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-slate-500">
                    <Eye className="h-4 w-4 text-cyan-600" /> Optimized resume preview
                  </p>
                  <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-4 text-slate-900 shadow-sm">
                    {optimizedResumeUrl ? (
                      <>
                        <div className="mb-4 flex flex-wrap items-center gap-3 text-sm text-slate-600">
                          <span>
                            Latest build: {optimizedResume?.personal_info?.name ?? "Candidate"}
                          </span>
                          <button
                            type="button"
                            className="inline-flex items-center gap-2 rounded-xl border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-700 transition hover:border-cyan-300 hover:bg-cyan-100 mobile-hover:scale-105"
                            onClick={() => {
                              if (!optimizedResumeBlob) return;
                              const tempLink = document.createElement("a");
                              tempLink.href = optimizedResumeUrl;
                              tempLink.download = `${optimizedResume?.personal_info?.name?.replace(/\s+/g, "-") || "optimized"}-resume.pdf`;
                              tempLink.click();
                            }}
                          >
                            <Download className="h-4 w-4" /> Download PDF
                          </button>
                        </div>
                        <div className="overflow-hidden rounded-xl bg-slate-50 border border-slate-200">
                          <PDFViewer pathfile={optimizedResumeUrl} />
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center gap-3 text-sm text-slate-500">
                        {isBuildingPdf ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin text-cyan-600" /> Generating optimized resume PDF…
                          </>
                        ) : (
                          <span>Run the optimization to preview the tailored PDF resume.</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {keywordCoverage?.total_keywords ? (
                  <div className="mt-6 grid gap-6 lg:grid-cols-2">
                    {keywordCoverage.present?.length ? (
                      <div>
                        <p className="text-sm font-semibold text-emerald-600">Covered keywords</p>
                        <BulletList items={keywordCoverage.present} icon={CheckCircle2} />
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </SectionCard>
            ) : null}

            {research ? (
              <SectionCard
                title="Company intelligence"
                subtitle="Fresh signals and interview prep"
                accent={gradientPalette[0]}
              >
                <div className="grid gap-6 lg:grid-cols-3">
                  {research.recent_developments?.length ? (
                    <div>
                      <p className="text-sm font-semibold text-cyan-600">Recent developments</p>
                      <BulletList items={research.recent_developments} icon={CheckCircle2} />
                    </div>
                  ) : null}
                  {research.culture_and_values?.length ? (
                    <div>
                      <p className="text-sm font-semibold text-emerald-600">Culture & values</p>
                      <BulletList items={research.culture_and_values} icon={Building2} />
                    </div>
                  ) : null}
                  {research.interview_questions?.length ? (
                    <div>
                      <p className="text-sm font-semibold text-amber-600">Interview prompts</p>
                      <BulletList items={research.interview_questions} icon={FileText} />
                    </div>
                  ) : null}
                </div>
              </SectionCard>
            ) : null}

            <div className="grid gap-6 lg:grid-cols-2">
              <MarkdownPanel title="Optimized resume" content={result.optimized_resume} />
              <MarkdownPanel title="Executive report" content={result.final_report} />
            </div>
          </div>
        ) : (
          <SectionCard
            title="Awaiting submission"
            subtitle="Insights will materialize here once the crew finishes its run"
            accent={gradientPalette[2]}
          >
            <p className="text-base text-slate-600">
              Fill out the form above and launch the crew to generate a tailored optimization report. The dashboard will
              populate with match visuals, ATS keywords, rewritten bullets, and company intel as soon as the backend run completes.
            </p>
          </SectionCard>
        )}
      </div>
    </div>
  );
}
