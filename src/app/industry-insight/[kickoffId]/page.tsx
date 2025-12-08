'use client';

import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { InsightDisplay } from '@/components/InsightDisplay';
import { IndustryInsightResponse } from '@/app/api/industry-insight/route';
import { Loader2, AlertCircle, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function InsightPage() {
    const searchParams = useSearchParams();
    const role = searchParams.get('role');

    const [data, setData] = useState<IndustryInsightResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [loadingStep, setLoadingStep] = useState(0);

    // Use a ref to ensure we only call the API once
    const hasStarted = useRef(false);

    const loadingSteps = [
        "Analyzing Industry Trends...",
        "Identifying Top Skills...",
        "Calculated Market Demand...",
        "Synthesizing Strategic Advice...",
        "Finalizing Insights..."
    ];

    // Cycle through loading messages
    useEffect(() => {
        if (!loading) return;
        const stepInterval = setInterval(() => {
            setLoadingStep((prev) => (prev < loadingSteps.length - 1 ? prev + 1 : prev));
        }, 3000);
        return () => clearInterval(stepInterval);
    }, [loading]);

    useEffect(() => {
        if (!role || hasStarted.current) {
            if (!role) {
                setError('No job role provided.');
                setLoading(false);
            }
            return;
        }

        hasStarted.current = true;

        const startJob = async () => {
            try {
                const response = await fetch('/api/industry-insight', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ targetRole: role }),
                });

                if (!response.ok) {
                    throw new Error('Failed to start analysis');
                }

                const result = await response.json();

                // Process the result immediately
                let finalJson = result.result_json || result;

                // Handle nested result structure like { result: "..." } or { result: { ... } }
                if (result.result) {
                    if (typeof result.result === 'object') {
                        finalJson = result.result;
                    } else if (typeof result.result === 'string') {
                        const rawResult = result.result;
                        console.log("Raw result to parse:", rawResult);

                        // Strategy 1: Strict Parse
                        try {
                            finalJson = JSON.parse(rawResult);
                        } catch (e) {
                            // Strategy 2: Extract from Markdown
                            const jsonMatch = rawResult.match(/```json\n([\s\S]*?)\n```/) || rawResult.match(/```([\s\S]*?)```/);
                            if (jsonMatch) {
                                try {
                                    finalJson = JSON.parse(jsonMatch[1]);
                                } catch (e2) {
                                    console.warn("Failed to parse extracted JSON from markdown", e2);
                                }
                            }

                            // Strategy 3: Find first { and last }
                            if (!finalJson) {
                                const firstOpen = rawResult.indexOf('{');
                                const lastClose = rawResult.lastIndexOf('}');
                                if (firstOpen !== -1 && lastClose !== -1 && lastClose > firstOpen) {
                                    try {
                                        const extracted = rawResult.substring(firstOpen, lastClose + 1);
                                        finalJson = JSON.parse(extracted);
                                    } catch (e3) {
                                        console.warn("Failed to parse extracted JSON from substring", e3);
                                    }
                                }
                            }
                        }
                    }
                }

                // Map CrewAI (snake_case) to Frontend (camelCase) format if needed
                let mappedData: IndustryInsightResponse | null = null;

                if (finalJson) {
                    // Check if it matches the CrewAI format seen in logs
                    if (finalJson.top_skills || finalJson.industry_trends) {
                        mappedData = {
                            industry: finalJson.industry || role || "Unknown",
                            date: finalJson.date || new Date().toLocaleDateString(),
                            // Map top_skills -> topSkills
                            topSkills: (finalJson.top_skills || []).map((s: any) => ({
                                name: s.skill,
                                demand: 85, // Default as not provided
                                growth: "High", // Default
                                description: s.description
                            })),
                            // Map industry_trends -> trends
                            trends: (finalJson.industry_trends || []).map((t: any) => ({
                                name: t.trend,
                                impact: 80, // Default
                                probability: 75, // Default
                                description: t.description
                            })),
                            // Map certifications -> certifications (structure differs)
                            certifications: (finalJson.certifications || []).map((c: any) => ({
                                name: c.certification,
                                value: 90, // Default
                                avgSalaryBoost: "15%" // Default
                            })),
                            // Map application_advice -> advice (string)
                            advice: finalJson.application_advice
                                ? finalJson.application_advice.map((a: any) => `• ${a.tip}: ${a.description}`).join('\n\n')
                                : "No specific advice provided.",
                            sources: finalJson.sources || [],
                            salaryRange: finalJson.salary_range || { min: 60000, max: 120000, currency: 'USD', experience: 'Mid' },
                            jobGrowth: { rate: "Stable", outlook: "Positive" }
                        };
                    } else if (finalJson.topSkills) {
                        // Already in correct format (e.g. mock data)
                        mappedData = finalJson;
                    }
                }

                if (mappedData && mappedData.topSkills && mappedData.topSkills.length > 0) {
                    setData(mappedData);
                } else {
                    console.error("Result is not valid JSON or mapping failed", finalJson);
                    // Fallback for raw text
                    if (!mappedData && result.result) {
                        setData({
                            industry: role || "Unknown",
                            date: new Date().toLocaleDateString(),
                            topSkills: [],
                            certifications: [],
                            trends: [],
                            advice: typeof result.result === 'string' ? result.result : JSON.stringify(result.result),
                            sources: [],
                            salaryRange: { min: 0, max: 0, currency: 'USD', experience: 'N/A' },
                            jobGrowth: { rate: '0%', outlook: 'Neutral' }
                        });
                    } else {
                        setError('Received invalid data format from AI agent.');
                    }
                }

                setLoading(false);

            } catch (err) {
                console.error(err);
                setError('Failed to generate insights. Please try again.');
                setLoading(false);
            }
        };

        startJob();

    }, [role]);

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="text-center space-y-4 max-w-md">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
                        <AlertCircle className="w-8 h-8 text-red-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-zinc-800">Oops! Something went wrong</h2>
                    <p className="text-zinc-600">{error}</p>
                    <Link href="/" className="inline-block px-6 py-3 bg-zinc-900 text-white rounded-xl font-medium hover:bg-zinc-800 transition-colors">
                        Try Again
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-zinc-50/50 relative">

            {/* Loading State */}
            <AnimatePresence mode="wait">
                {loading && (
                    <motion.div
                        key="loader"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/80 backdrop-blur-md"
                    >
                        <div className="relative">
                            {/* Animated Rings */}
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                                className="w-32 h-32 rounded-full border-4 border-t-blue-500 border-r-purple-500 border-b-transparent border-l-transparent"
                            />
                            <motion.div
                                animate={{ rotate: -360 }}
                                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                className="absolute inset-2 w-28 h-28 rounded-full border-4 border-t-transparent border-r-transparent border-b-indigo-400 border-l-cyan-400"
                            />

                            {/* Center Icon */}
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Sparkles className="w-8 h-8 text-indigo-600 animate-pulse" />
                            </div>
                        </div>

                        {/* Loading Text */}
                        <motion.div
                            key={loadingStep}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="mt-8 text-center space-y-2"
                        >
                            <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
                                {loadingSteps[loadingStep]}
                            </h3>
                            <p className="text-sm text-zinc-500 font-medium">
                                Generating AI-powered career intelligence for <span className="text-zinc-800">{role}</span>
                            </p>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Content State */}
            {!loading && data && (
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="mb-8 flex items-center justify-between">
                        <Link href="/industry-insight" className="text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors flex items-center gap-2">
                            ← Back to Search
                        </Link>
                    </div>
                    <InsightDisplay data={data} />
                </div>
            )}
        </div>
    );
}
