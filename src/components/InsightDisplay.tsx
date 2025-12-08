'use client';

import { motion } from 'framer-motion';
import { TrendingUp, Award, Lightbulb, BookOpen, Briefcase, DollarSign } from 'lucide-react';
import { InsightCard } from './InsightCard';
import { SkillsChart } from './SkillsChart';
import { TrendsChart } from './TrendsChart';
import { IndustryInsightResponse } from '@/app/api/industry-insight/route';

interface InsightDisplayProps {
    data: IndustryInsightResponse;
}

export function InsightDisplay({ data }: InsightDisplayProps) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 md:grid-cols-6 gap-6"
        >
            {/* Top Skills - Chart */}
            <InsightCard title="Skills Demand" icon={Award} delay={0.1} className="md:col-span-3 min-h-[400px]">
                <SkillsChart data={data.topSkills || []} />
            </InsightCard>

            {/* Trends - Chart */}
            <InsightCard title="Trend Impact Radar" icon={TrendingUp} delay={0.2} className="md:col-span-3 min-h-[400px]">
                <TrendsChart data={data.trends || []} />
            </InsightCard>

            {/* Market Context */}
            <InsightCard title="Market Context" icon={TrendingUp} delay={0.3} className="md:col-span-2">
                <div className="space-y-4">
                    <div>
                        <div className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Target Role</div>
                        <div className="text-xl font-bold text-gradient">{data.industry}</div>
                    </div>
                    <div>
                        <div className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Snapshot Date</div>
                        <div className="text-lg font-medium text-zinc-800">{data.date}</div>
                    </div>
                </div>
            </InsightCard>

            {/* Job Growth */}
            <InsightCard title="Job Outlook" icon={Briefcase} delay={0.35} className="md:col-span-2">
                <div className="flex flex-col items-center justify-center h-full py-2">
                    <div className="text-4xl font-bold text-green-600 mb-1">+{data.jobGrowth?.rate}</div>
                    <div className="text-sm font-medium text-zinc-600 uppercase tracking-wide">{data.jobGrowth?.outlook} Growth</div>
                </div>
            </InsightCard>

            {/* Salary Range */}
            <InsightCard title="Salary Potential" icon={DollarSign} delay={0.4} className="md:col-span-2">
                <div className="space-y-3">
                    <div className="flex justify-between text-xs text-zinc-500">
                        <span>Entry</span>
                        <span>{data.salaryRange?.experience} Level</span>
                    </div>
                    <div className="h-3 bg-zinc-100 rounded-full overflow-hidden relative border border-zinc-200">
                        <div className="absolute inset-y-0 left-[10%] right-[10%] bg-gradient-to-r from-blue-500 to-green-500 rounded-full opacity-80"></div>
                    </div>
                    <div className="flex justify-between font-bold text-base text-zinc-800">
                        <span>${data.salaryRange?.min.toLocaleString()}</span>
                        <span>${data.salaryRange?.max.toLocaleString()}</span>
                    </div>
                </div>
            </InsightCard>

            {/* Certifications */}
            <InsightCard title="High-Value Certifications" icon={Award} delay={0.5} className="md:col-span-3">
                <div className="space-y-4">
                    {(data.certifications || []).map((cert, i) => (
                        <div key={i} className="group p-3 rounded-xl bg-white/50 border border-zinc-100 hover:border-blue-200 hover:shadow-md transition-all">
                            <div className="flex justify-between items-start mb-2">
                                <span className="font-semibold text-zinc-800 text-sm">{cert.name}</span>
                                <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">+{cert.avgSalaryBoost} Salary</span>
                            </div>
                            <div className="w-full bg-zinc-100 rounded-full h-1.5">
                                <div
                                    className="bg-blue-500 h-1.5 rounded-full"
                                    style={{ width: `${cert.value}%` }}
                                ></div>
                            </div>
                        </div>
                    ))}
                </div>
            </InsightCard>

            {/* Advice */}
            <InsightCard title="Strategic Advice" icon={Lightbulb} delay={0.6} className="md:col-span-3 bg-gradient-to-br from-blue-50 to-purple-50">
                <div className="relative pl-6 border-l-4 border-blue-500 h-full flex items-center">
                    <p className="text-lg leading-relaxed italic text-zinc-700">
                        "{data.advice}"
                    </p>
                </div>
            </InsightCard>

            {/* Sources */}
            <div className="md:col-span-6 flex justify-center gap-6 pt-4 opacity-50 flex-wrap">
                {(data.sources || []).map((source, i) => (
                    <span key={i} className="text-[10px] text-zinc-500 flex items-center gap-1 uppercase tracking-widest border border-zinc-200 px-2 py-1 rounded-full">
                        <BookOpen className="w-3 h-3" /> {source}
                    </span>
                ))}
            </div>
        </motion.div>
    );
}
