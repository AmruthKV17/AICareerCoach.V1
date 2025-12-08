"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
    motion,
    useSpring,
    useTransform,
    useScroll,
    useMotionValue,
    useMotionTemplate,
    AnimatePresence
} from "framer-motion";
import {
    RadialBarChart,
    RadialBar,
    ResponsiveContainer,
    BarChart,
    Bar,
    CartesianGrid,
    XAxis,
    Tooltip,
    Cell
} from "recharts";
import {
    Download,
    Copy,
    CheckCircle2,
    Sparkles,
    TrendingUp,
    ArrowRight,
    FileText,
    Settings,
    Loader2,
    Lightbulb,
    Search,
    Loader,
    LayoutTemplate,
    Type,
    ListChecks,
    Target,
    Award
} from "lucide-react";
import { pdf } from "@react-pdf/renderer";
import { CoverLetterPdf } from "@/components/CoverLetterPdf";

// --- Type Definitions ---
import { DetailedAnalysisPayload } from "@/lib/crew";

interface Strength {
    category: string;
    strength: string;
    relevance_to_role: string;
}

interface Gap {
    gap_type: string;
    description: string;
    impact: string; // "High" | "Medium" | "Low"
}

interface Suggestion {
    priority: string;
    category: string;
    current_issue: string;
    suggested_improvement: string;
    example: string;
}

interface KeywordRecommendation {
    keyword: string;
    where_to_add: string;
    justification: string;
}

interface AnalysisSummary {
    overall_score: string | number;
    score_rationale: string;
    resume_vs_job_alignment: string | number;
}

interface ResumeAnalysis {
    analysis_summary: AnalysisSummary;
    strengths: Strength[];
    gap_analysis: Gap[];
    improvement_suggestions?: Suggestion[]; // New field
    keyword_recommendations?: KeywordRecommendation[]; // New field
    next_steps: string[];
}

interface CoverLetter {
    content: string;
    word_count: string;
    structure: {
        paragraphs: string;
        key_highlights: string;
    };
}

// Extended Interface matching real payload structure
interface AnalysisData extends Omit<DetailedAnalysisPayload, 'resume_analysis' | 'cover_letter' | 'analysis_metadata'> {
    resume_analysis: ResumeAnalysis;
    cover_letter: CoverLetter;
    summary?: {
        processing_status: string;
        total_recommendations: number;
        priority_actions: string[];
    };
    analysis_metadata: {
        target_role?: string;
        analysis_date?: string;
        system_version?: string;
        [key: string]: any;
    };
}

interface ResumeAnalysis {
    analysis_summary: AnalysisSummary;
    strengths: Strength[];
    gap_analysis: Gap[];
    improvement_suggestions?: Suggestion[];
    keyword_recommendations?: KeywordRecommendation[];
    formatting_recommendations?: FormattingRecommendation[];
    next_steps: string[];
}

interface FormattingRecommendation {
    section: string;
    issue: string;
    recommendation: string;
}

// --- Data Parsing Utilities ---
const parseScore = (val: string | number) => {
    if (typeof val === 'number') return val;
    // Extract first number found
    const match = val.match(/\d+/);
    return match ? parseInt(match[0], 10) : 0;
}

const parseAlignmentScore = (val: string | number) => {
    if (typeof val === 'number') return val;
    // Handle "65%. The resume..." format
    const match = val.match(/^(\d+)%/); // Expects start with "65%"
    if (match) return parseInt(match[1], 10);
    // Fallback search
    const fallback = val.match(/\d+/);
    return fallback ? parseInt(fallback[0], 10) : 0;
}

// Mapper for Gap Analysis to Chart Format
const mapGapsToChart = (gaps: Gap[]) => {
    return gaps.map(g => {
        // Impact Parsing: High impact gap = bad score (e.g., 30/100)
        let score = 80; // Default good
        if (g.impact.toLowerCase().includes("high")) score = 30;
        else if (g.impact.toLowerCase().includes("medium")) score = 60;

        return {
            subject: g.gap_type || "Gap",
            A: score,
            fill: score < 50 ? "#ef4444" : "#f59e0b", // Red for high impact gaps
            impact: g.impact,
            description: g.description
        }
    });
}

// Mapper for Strengths to Chart Format
const mapStrengthsToChart = (strengths: Strength[]) => {
    const colors = ['#aaf955ff', '#f3d280ff', '#3b82f6', '#8b5cf6', '#10b981'];
    return strengths.slice(0, 5).map((s, i) => {
        return {
            name: s.strength || "Skill",
            // Mock confidence score for visuals since API doesn't return one yet
            // We use length of description as a pseudo-metric or random high number
            value: 85 + (i * 2) % 15,
            fill: colors[i % colors.length]
        };
    });
}

// --- Hooks ---
const useCountUp = (end: number, duration: number = 2) => {
    const [count, setCount] = useState(0);

    useEffect(() => {
        let startTime: number;
        let animationFrame: number;

        const animate = (timestamp: number) => {
            if (!startTime) startTime = timestamp;
            const progress = timestamp - startTime;
            const percentage = Math.min(progress / (duration * 1000), 1);

            const ease = 1 - Math.pow(1 - percentage, 2);

            setCount(Math.min(end, Math.round(end * ease)));

            if (percentage < 1) {
                animationFrame = requestAnimationFrame(animate);
            }
        };

        animationFrame = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(animationFrame);
    }, [end, duration]);

    return count;
};


// --- UI Components ---

const MagneticButton = ({ children, className = "", onClick }: { children: React.ReactNode, className?: string, onClick?: () => void }) => {
    const ref = React.useRef<HTMLButtonElement>(null);
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const springConfig = { damping: 15, stiffness: 150, mass: 0.1 };
    const springX = useSpring(x, springConfig);
    const springY = useSpring(y, springConfig);

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!ref.current) return;
        const { clientX, clientY } = e;
        const { left, top, width, height } = ref.current.getBoundingClientRect();
        const centerX = left + width / 2;
        const centerY = top + height / 2;

        x.set((clientX - centerX) * 0.2); // Magnetic pull strength
        y.set((clientY - centerY) * 0.2);
    };

    const handleMouseLeave = () => {
        x.set(0);
        y.set(0);
    };

    return (
        <motion.button
            ref={ref}
            onClick={onClick}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{ x: springX, y: springY }}
            className={className}
        >
            {children}
        </motion.button>
    );
};

const AuroraCard = ({ children, className = "", title, subtitle, action }: { children: React.ReactNode, className?: string, title?: string, subtitle?: string, action?: React.ReactNode }) => {
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    const handleMouseMove = ({ currentTarget, clientX, clientY }: React.MouseEvent) => {
        const { left, top } = currentTarget.getBoundingClientRect();
        mouseX.set(clientX - left);
        mouseY.set(clientY - top);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            onMouseMove={handleMouseMove}
            className={`group relative bg-white rounded-3xl p-6 shadow-[0_2px_20px_rgba(0,0,0,0.02)] border border-slate-[0.05] overflow-hidden ${className}`}
        >
            {/* Aurora Effect */}
            <motion.div
                className="pointer-events-none absolute -inset-px rounded-3xl opacity-0 transition duration-300 group-hover:opacity-100"
                style={{
                    background: useMotionTemplate`
                        radial-gradient(
                            600px circle at ${mouseX}px ${mouseY}px,
                            rgba(255, 255, 255, 0.6),
                            transparent 40%
                        )
                    `,
                }}
            />

            {/* Content Buffer to sit above Aurora */}
            <div className="relative z-10 h-full flex flex-col">
                {(title || action) && (
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            {title && <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">{title}</h3>}
                            {subtitle && <p className="text-2xl font-bold text-slate-800 mt-1">{subtitle}</p>}
                        </div>
                        {action}
                    </div>
                )}
                {children}
            </div>
        </motion.div>
    );
}

const LoadingOverlay = () => (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-6">
        <div className="relative">
            <div className="absolute inset-0 bg-indigo-500 blur-xl opacity-20 animate-pulse rounded-full" />
            <Loader2 size={48} className="text-indigo-600 animate-spin relative z-10" />
        </div>
        <div>
            <h2 className="text-2xl font-bold text-slate-800">Analyzing Resume</h2>
            <p className="text-slate-500 mt-2">Our AI crew is dissecting the details...</p>
        </div>
    </div>
)


// --- Data Components (Props Enabled) ---

const AlignmentChart = ({ data }: { data: AnalysisData }) => {
    // Safety check in case deep nested data is missing
    const rawScore = data?.resume_analysis?.analysis_summary?.resume_vs_job_alignment || "0";
    const score = parseAlignmentScore(rawScore);
    const count = useCountUp(score);
    const chartData = [
        { name: 'Match', value: count, fill: '#6366f1' },
    ];

    return (
        <AuroraCard title="Overall Alignment" className="col-span-12 lg:col-span-4 min-h-[300px]">
            <div className="flex items-center gap-2 mb-2">
                <span className="text-4xl font-bold text-indigo-600 min-w-[3ch]">{count}%</span>
                {/* <span className="flex items-center text-xs font-semibold text-emerald-500 bg-emerald-50 px-2 py-1 rounded-full">
                    <TrendingUp size={12} className="mr-1" /> +12%
                </span> */}
            </div>
            <p className="text-sm text-slate-400 mb-6 line-clamp-2" title={typeof rawScore === 'string' ? rawScore : ''}>
                {typeof rawScore === 'string' ? rawScore.replace(/^(\d+)%.?/, '').trim() : "Compared to job requirements"}
            </p>

            <div className="h-40 relative">
                <ResponsiveContainer width="100%" height="100%">
                    <RadialBarChart innerRadius="80%" outerRadius="100%" barSize={20} data={chartData} startAngle={180} endAngle={0} cy="80%">
                        <RadialBar
                            background={{ fill: '#f1f5f9' }}
                            dataKey="value"
                            cornerRadius={50}
                            isAnimationActive={true}
                            animationDuration={2000}
                            animationEasing="ease-out"
                        />
                    </RadialBarChart>
                </ResponsiveContainer>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[20%] text-center">
                    <motion.div
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-2"
                    >
                        <Sparkles size={20} />
                    </motion.div>
                </div>
            </div>

            <div className="space-y-4 mt-4">
                <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Resume Structure</span>
                    <span className="font-semibold text-slate-700">80%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: "80%" }} transition={{ duration: 1.5, delay: 0.2 }} className="h-full bg-indigo-500 rounded-full" />
                </div>

                <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Keywords</span>
                    <span className="font-semibold text-slate-700">60%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: "60%" }} transition={{ duration: 1.5, delay: 0.4 }} className="h-full bg-amber-400 rounded-full" />
                </div>
            </div>
        </AuroraCard>
    )
}

const GapAnalysisChart = ({ data }: { data: AnalysisData }) => {
    const gaps = data?.resume_analysis?.gap_analysis || [];
    const chartData = mapGapsToChart(gaps);

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="bg-white p-4 rounded-xl shadow-xl border border-slate-100 max-w-xs">
                    <p className="font-bold text-slate-800 text-sm mb-1">{data.subject}</p>
                    <p className="text-xs text-slate-500 mb-2">{data.description}</p>
                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${data.impact.includes("High") ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-600"}`}>
                        {data.impact} Impact
                    </span>
                </div>
            );
        }
        return null;
    };

    return (
        <AuroraCard title="Gap Analysis" className="col-span-12 lg:col-span-6 min-h-[300px]">
            {gaps.length === 0 ? (
                <div className="flex items-center justify-center h-full text-slate-400 text-sm">No significant gaps found! 🎉</div>
            ) : (
                <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} barGap={0} barSize={30}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis dataKey="subject" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} dy={10} angle={-10} textAnchor="end" height={60} />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                            <Bar dataKey="A" radius={[6, 6, 0, 0]} animationDuration={1500}>
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}
        </AuroraCard>
    )
}

const OverallScoreChart = ({ data }: { data: AnalysisData }) => {
    const rawScore = data?.resume_analysis?.analysis_summary?.overall_score || "0/10";
    const scoreVal = parseScore(rawScore); // e.g. 3
    const score = (scoreVal / 10) * 100; // Convert to percentage for animation if needed, but we display raw
    const count = useCountUp(scoreVal, 2);

    // Determine color based on score
    const getColor = (s: number) => {
        if (s >= 8) return "#10b981"; // Emerald
        if (s >= 5) return "#f59e0b"; // Amber
        return "#ef4444"; // Red
    };

    const color = getColor(scoreVal);

    const chartData = [
        { name: 'Score', value: count, fill: color },
    ];

    return (
        <AuroraCard title="Resume Score" className="col-span-12 lg:col-span-4 min-h-[300px]">
            <div className="flex items-center gap-2 mb-2">
                <span className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-600 min-w-[1ch]">{count}</span>
                <span className="text-xl text-slate-400 font-medium">/ 10</span>
            </div>

            <p className="text-sm text-slate-500 mb-6 line-clamp-3">
                {data?.resume_analysis?.analysis_summary?.score_rationale}
            </p>

            <div className="h-32 relative">
                <ResponsiveContainer width="100%" height="100%">
                    <RadialBarChart innerRadius="80%" outerRadius="100%" barSize={15} data={[{ value: 10, fill: '#f1f5f9' }]} startAngle={180} endAngle={0} cy="80%">
                        <RadialBar
                            dataKey="value"
                            cornerRadius={50}
                        />
                    </RadialBarChart>
                </ResponsiveContainer>
                <div className="absolute inset-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <RadialBarChart innerRadius="80%" outerRadius="100%" barSize={15} data={[{ value: count, fill: color }]} startAngle={180} endAngle={0} cy="80%">
                            <RadialBar
                                dataKey="value"
                                cornerRadius={50}
                                isAnimationActive={true}
                                animationDuration={2000}

                            />
                        </RadialBarChart>
                    </ResponsiveContainer>
                </div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[10%] text-center">
                    <div className="text-xs font-bold uppercase tracking-widest" style={{ color }}>
                        {scoreVal < 5 ? "Needs Work" : scoreVal < 8 ? "Good" : "Excellent"}
                    </div>
                </div>
            </div>
        </AuroraCard>
    );
}

const FormattingAdvisor = ({ data }: { data: AnalysisData }) => {
    const recs = data?.resume_analysis?.formatting_recommendations || [];
    if (!recs.length) return null;

    return (
        <AuroraCard title="Formatting & Impact" className="col-span-12 lg:col-span-6 min-h-[300px]" action={<LayoutTemplate className="text-slate-400" size={20} />}>
            <div className="space-y-4 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                {recs.map((rec, i) => (
                    <div key={i} className="flex gap-4 p-3 rounded-2xl hover:bg-slate-50 transition-colors">
                        <div className="shrink-0 w-8 h-8 rounded-full bg-indigo-50 text-indigo-500 flex items-center justify-center mt-1">
                            {i % 2 === 0 ? <Type size={14} /> : <ListChecks size={14} />}
                        </div>
                        <div>
                            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">{rec.section}</h4>
                            <p className="text-xs text-slate-500 mb-2 font-medium">{rec.issue}</p>
                            <div className="text-xs text-slate-600 bg-white border border-slate-100 p-2 rounded-lg relative">
                                <div className="absolute left-0 top-2 w-[2px] h-4 bg-indigo-400 rounded-r-full" />
                                <span className="ml-1">{rec.recommendation}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </AuroraCard>
    );
}
const StrengthsChart = ({ data }: { data: AnalysisData }) => {
    const strengths = data?.resume_analysis?.strengths || [];
    const chartData = mapStrengthsToChart(strengths);

    return (
        <AuroraCard title="Skill Distribution" className="col-span-12 lg:col-span-3 min-h-[300px] flex flex-col">
            <div className="h-48 relative shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                    <RadialBarChart innerRadius="30%" outerRadius="100%" barSize={10} data={chartData} startAngle={90} endAngle={-270}>
                        <RadialBar background={{ fill: '#f1f5f9' }} dataKey="value" cornerRadius={10} animationDuration={2000} />
                    </RadialBarChart>
                </ResponsiveContainer>
                {/* Center Text */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <span className="text-xs text-slate-400 font-medium">Top Skills</span>
                </div>
            </div>

            <div className="space-y-3 mt-4 overflow-y-auto custom-scrollbar flex-1 pr-2">
                {chartData.map((item, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 overflow-hidden">
                            <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.fill }} />
                            <span className="text-slate-600 truncate text-xs" title={item.name}>{item.name}</span>
                        </div>
                    </div>
                ))}
            </div>
        </AuroraCard>
    )
}

const ImprovementTips = ({ data }: { data: AnalysisData }) => {
    const suggestions = data.resume_analysis?.improvement_suggestions || [];
    if (!suggestions.length) return null;

    return (
        <AuroraCard title="Smart Improvements" className="col-span-12 lg:col-span-6 min-h-[300px]" action={<Lightbulb className="text-amber-400" size={20} />}>
            <div className="space-y-4 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                {suggestions.map((s, i) => (
                    <div key={i} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-indigo-100 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                            <h4 className="font-bold text-slate-700 text-sm">{s.category}</h4>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${s.priority === 'High' ? 'bg-rose-100 text-rose-600' : 'bg-blue-100 text-blue-600'}`}>
                                {s.priority} Priority
                            </span>
                        </div>
                        <p className="text-xs text-slate-500 mb-2">{s.current_issue}</p>
                        <div className="text-xs bg-white p-3 rounded-lg border border-slate-200 text-slate-600 italic">
                            <span className="not-italic font-semibold text-indigo-600">Tip: </span>
                            {s.suggested_improvement}
                        </div>
                    </div>
                ))}
            </div>
        </AuroraCard>
    )
}

const KeywordCloud = ({ data }: { data: AnalysisData }) => {
    const keywords = data.resume_analysis?.keyword_recommendations || [];
    if (!keywords.length) return null;

    return (
        <AuroraCard title="Missing Keywords" className="col-span-12 lg:col-span-6 min-h-[300px]" action={<Search className="text-indigo-400" size={20} />}>
            <div className="flex flex-wrap gap-2 content-start h-full">
                {keywords.map((k, i) => (
                    <div key={i} className="group relative bg-white border border-slate-200 hover:border-indigo-500 px-3 py-1.5 rounded-lg transition-all cursor-default">
                        <span className="text-sm font-semibold text-slate-700 group-hover:text-indigo-600">{k.keyword}</span>
                        {/* Tooltip for justification */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-slate-800 text-white text-[10px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 text-center shadow-xl">
                            {k.justification}
                            <div className="mt-1 text-slate-400 font-bold uppercase tracking-wider text-[8px]">Target: {k.where_to_add}</div>
                        </div>
                    </div>
                ))}
            </div>
        </AuroraCard>
    )
}

const LivingEditor = ({ data }: { data: AnalysisData }) => {
    const [content, setContent] = useState(data.cover_letter?.content || "");
    const [isCopied, setIsCopied] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);

    // Safely extract the first strength name from object
    const topStrength = data.resume_analysis?.strengths?.[0];
    const strengthName = topStrength ? topStrength.strength : "Core Skills";

    const handleCopy = () => {
        navigator.clipboard.writeText(content);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    const handleDownloadPdf = async () => {
        setIsDownloading(true);
        try {
            const blob = await pdf(<CoverLetterPdf content={content} />).toBlob();
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'cover-letter.pdf';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Failed to generate PDF:", error);
        } finally {
            setIsDownloading(false);
        }
    };

    return (
        <AuroraCard className="col-span-12 lg:col-span-8 min-h-[600px] flex flex-col p-0 overflow-hidden border-0">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-white/80 backdrop-blur-sm z-20 relative">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
                        <FileText size={20} />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Smart Editor</h3>
                        <p className="text-lg font-bold text-slate-800">Cover Letter</p>
                    </div>
                </div>

                <div className="flex gap-2">
                    <MagneticButton
                        onClick={handleCopy}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-50 text-slate-600 text-xs font-bold hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                    >
                        {isCopied ? <CheckCircle2 size={14} className="text-emerald-500" /> : <Copy size={14} />}
                        {isCopied ? "COPIED" : "COPY"}
                    </MagneticButton>
                    <MagneticButton
                        onClick={handleDownloadPdf}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-700 transition-colors shadow-lg shadow-slate-200"
                    >
                        {isDownloading ? <Loader size={14} className="animate-spin" /> : <Download size={14} />}
                        {isDownloading ? "GENERATING..." : "PDF"}
                    </MagneticButton>
                </div>
            </div>

            <div className="flex-1 flex flex-col md:flex-row bg-[#F8FAFC]">
                {/* Main Editor - Levitating Paper */}
                <div className="flex-1 p-8 relative flex items-start justify-center overflow-y-auto custom-scrollbar">
                    <motion.div
                        className="w-full max-w-3xl min-h-[500px] bg-white shadow-sm border border-slate-100 p-8 rounded-none relative"
                        animate={{ y: [-2, 2, -2] }}
                        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                    >
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            className="w-full h-full min-h-[400px] resize-none outline-none border-none text-slate-600 font-serif text-lg leading-loose bg-transparent selection:bg-indigo-100 placeholder:text-slate-300 relative z-10"
                            spellCheck={false}
                        />
                        {/* Subtle lines background for 'paper' feel */}
                        <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(transparent_31px,#e2e8f0_32px)] bg-[size:100%_32px] opacity-40 mt-9" />
                    </motion.div>
                </div>

                {/* Side Metadata Panel - Restore for JSON data */}
                {/* <div className="hidden md:flex w-full md:w-64 bg-white border-l border-slate-100 p-6 flex-col gap-6 z-10 relative">
                    <div>
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Structure</h4>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-slate-500">Words</span>
                                <span className="font-mono font-semibold text-slate-700">{data.cover_letter?.word_count || 0}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-slate-500">Paragraphs</span>
                                <span className="font-mono font-semibold text-slate-700">{data.cover_letter?.structure?.paragraphs || 0}</span>
                            </div>
                        </div>
                    </div>

                    <div>
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">AI Highlights</h4>
                        <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-100/50">
                            <div className="flex items-start gap-2">
                                <Sparkles size={14} className="text-indigo-500 mt-0.5 shrink-0" />
                                <p className="text-xs text-indigo-700 leading-relaxed font-medium">
                                    {data.cover_letter?.structure?.key_highlights || `This draft highlights your ${strengthName} well.`}
                                </p>
                            </div>
                        </div>
                    </div>
                </div> */}
            </div>
        </AuroraCard>
    );
};

const ActionList = ({ data }: { data: AnalysisData }) => (
    <AuroraCard className="col-span-12 lg:col-span-4 max-h-[600px] overflow-hidden flex flex-col" title="Action Items" action={
        <div className="flex gap-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-3 py-1">Sort By</span>
            <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full cursor-pointer">Priority</span>
        </div>
    }>
        <div className="overflow-y-auto pr-2 -mr-2 space-y-3 custom-scrollbar h-full">
            {(data.resume_analysis?.next_steps || []).map((step, i) => (
                <div key={i} className="group p-3 rounded-2xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all cursor-pointer">
                    <div className="flex items-center justify-between mb-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${i % 2 === 0 ? "bg-rose-50 text-rose-500" : "bg-amber-50 text-amber-500"}`}>
                            {i < 2 ? "High Priority" : "Medium"}
                        </span>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="p-1 rounded-md hover:bg-white text-slate-400 hover:text-indigo-500"><ArrowRight size={14} /></div>
                        </div>
                    </div>

                    <p className="text-sm font-semibold text-slate-700 leading-snug mb-2">{step.replace(/^(Priority \d+:|\d+\.)\s*/i, '')}</p>

                    <div className="flex items-center gap-2">
                        <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-slate-300 group-hover:bg-indigo-500 transition-colors" style={{ width: `${60 - (i * 10)}%` }} />
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">{60 - (i * 10)}%</span>
                    </div>
                </div>
            ))}
        </div>
    </AuroraCard >
)

export default function AnalysisPage() {
    const { scrollY } = useScroll();

    const searchParams = useSearchParams();
    const kickoffId = searchParams.get('id') || "";

    // --- State for Polling and Data ---
    const [data, setData] = useState<AnalysisData | null>(null);
    const [status, setStatus] = useState<'LOADING' | 'SUCCESS' | 'FAILED'>('LOADING');

    const skewY = useTransform(scrollY, [0, 1000], [0, 5]);
    const springSkew = useSpring(skewY, { stiffness: 400, damping: 90 });

    useEffect(() => {
        let isMounted = true;
        let pollTimer: NodeJS.Timeout;

        const fetchData = async () => {
            if (!kickoffId) return;

            try {
                const res = await fetch(`/api/resume-crew/${kickoffId}`);
                if (!res.ok) throw new Error("Failed to fetch status");

                const result = await res.json();
                console.log("Polling Status:", result.status);

                if (result.status === 'SUCCESS') {
                    // Handle both flat and nested payload structures
                    // API might return { ...data } or { analysis: { ...data } }
                    const payload = result.resume_analysis ? result : result.analysis;

                    if (payload && payload.resume_analysis) {
                        if (isMounted) {
                            setData(payload as AnalysisData);
                            setStatus('SUCCESS');
                        }
                    } else {
                        console.error("Analysis success but missing resume_analysis:", result);
                        if (isMounted) setStatus('FAILED');
                    }
                    return; // Stop polling in either case
                } else if (result.status === 'FAILED') {
                    if (isMounted) setStatus('FAILED');
                    return; // Stop polling
                } else {
                    // Continue polling if STARTED or RUNNING
                    pollTimer = setTimeout(fetchData, 3000); // Poll every 3 seconds
                }
            } catch (err) {
                console.error("Polling Error:", err);
                // Retry on error? Or fail? let's retry a few times in real app, but for now just retry
                pollTimer = setTimeout(fetchData, 5000);
            }
        };

        fetchData();

        return () => {
            isMounted = false;
            clearTimeout(pollTimer);
        };
    }, [kickoffId]);

    // --- Loading State ---
    if (status === 'LOADING' || !data) {
        return (
            <div className="min-h-screen bg-[#edeef5] flex items-center justify-center p-8">
                <LoadingOverlay />
            </div>
        )
    }

    if (status === 'FAILED') {
        return (
            <div className="min-h-screen bg-[#edeef5] flex items-center justify-center p-8">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-rose-500">Analysis Failed</h2>
                    <p className="text-slate-500">Something went wrong. Please try again.</p>
                </div>
            </div>
        )
    }

    return (
        // Clean layout, no sidebar, fixed bg
        <div className="fixed inset-0 z-50 flex flex-col bg-[#edeef5] font-sans antialiased text-[#1E293B] overflow-hidden">

            <motion.main
                className="flex-1 overflow-y-auto p-4 md:p-8 perspective-1000"
                style={{ skewY: springSkew }}
            >
                <div className="max-w-7xl mx-auto space-y-8">

                    {/* Simplified Header / Title Area */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <p className="text-4xl font-bold text-slate-400 uppercase tracking-widest mb-1">Resume Optimization</p>
                            <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-600">
                                {data.analysis_metadata?.target_role || "Job Role"}
                            </h2>
                        </div>

                        {/* <div className="flex gap-3">
                            <MagneticButton className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl shadow-sm border border-slate-100 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
                                <Download size={16} /> Export
                            </MagneticButton>
                            <MagneticButton className="flex items-center gap-2 px-4 py-2 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-200 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors">
                                <Settings size={16} /> Manage
                            </MagneticButton>
                        </div> */}
                    </div>

                    {/* Bento Grid */}
                    <div className="grid grid-cols-12 gap-6 pb-12">
                        {/* Top Row: Scores & Stats */}
                        <OverallScoreChart data={data} />
                        <AlignmentChart data={data} />
                        <StrengthsChart data={data} />

                        {/* Mid Row: Deep Dive */}
                        <GapAnalysisChart data={data} />
                        <ImprovementTips data={data} />

                        {/* Formatting & Keywords */}
                        <FormattingAdvisor data={data} />
                        <KeywordCloud data={data} />

                        {/* Bottom Row: Editor & Actions */}
                        <LivingEditor data={data} />
                        <ActionList data={data} />
                    </div>

                </div>
            </motion.main>

            {/* Soft Background Gradients to simulate the nice light */}
            <div className="pointer-events-none fixed top-0 right-0 w-[500px] h-[500px] bg-indigo-200/20 blur-[100px] rounded-full mix-blend-multiply" />
            <div className="pointer-events-none fixed bottom-0 left-20 w-[600px] h-[600px] bg-blue-200/20 blur-[120px] rounded-full mix-blend-multiply" />

            {/* Footer metadata */}
            <div className="fixed bottom-2 right-4 text-[10px] text-slate-400 font-mono z-50 opacity-60 hover:opacity-100 transition-opacity">
                {data.analysis_metadata?.system_version} • {data.analysis_metadata?.analysis_date}
            </div>
        </div>
    );
}
