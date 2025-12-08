'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface SkillData {
    name: string;
    demand: number;
    growth: string;
    description: string;
}

interface SkillsChartProps {
    data: SkillData[];
}

export function SkillsChart({ data }: SkillsChartProps) {
    // Parse growth string "20%" to number 20 for visualization if needed, 
    // or just use demand. Let's visualize Demand.

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            const skill = payload[0].payload;
            return (
                <div className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl shadow-xl max-w-xs">
                    <p className="font-bold text-zinc-900 dark:text-white mb-1">{label}</p>
                    <p className="text-sm text-blue-600 dark:text-blue-400 font-medium mb-2">
                        Demand: {skill.demand} | Growth: {skill.growth}
                    </p>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                        {skill.description}
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="w-full h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart
                    data={data}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
                    <XAxis type="number" domain={[0, 100]} hide />
                    <YAxis
                        dataKey="name"
                        type="category"
                        width={150}
                        tick={{ fill: '#52525b', fontSize: 11, fontWeight: 500 }}
                        axisLine={false}
                        tickLine={false}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(59, 130, 246, 0.05)' }} />
                    <Bar dataKey="demand" radius={[0, 6, 6, 0]} barSize={24}>
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#3b82f6' : '#8b5cf6'} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
