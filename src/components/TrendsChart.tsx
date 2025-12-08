'use client';

import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';

interface TrendData {
    name: string;
    impact: number;
    probability: number;
    description: string;
}

interface TrendsChartProps {
    data: TrendData[];
}

export function TrendsChart({ data }: TrendsChartProps) {
    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            // Find the trend object to get the description
            // Payload in Radar chart can be tricky, usually payload[0].payload is the full data object for that angle? 
            // Actually for Radar, the tooltip usually shows all metrics for a specific "angle" (category).
            // But Recharts Radar tooltip behavior varies. Let's try to find the data point.

            // In a RadarChart, the payload usually contains the values for each Radar at that angle.
            // We might need to look up the description from the `data` prop using the label (name).
            const trend = data.find(d => d.name === label);

            return (
                <div className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl shadow-xl max-w-xs">
                    <p className="font-bold text-zinc-900 dark:text-white mb-1">{label}</p>
                    <div className="flex gap-4 text-sm mb-2">
                        <span className="text-purple-600 font-medium">Impact: {trend?.impact}</span>
                        <span className="text-blue-600 font-medium">Prob: {trend?.probability}%</span>
                    </div>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                        {trend?.description}
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="w-full h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
                    <PolarGrid stroke="#e5e7eb" />
                    <PolarAngleAxis dataKey="name" tick={{ fill: '#52525b', fontSize: 11, fontWeight: 500 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar
                        name="Impact"
                        dataKey="impact"
                        stroke="#8b5cf6"
                        strokeWidth={2}
                        fill="#8b5cf6"
                        fillOpacity={0.3}
                    />
                    <Radar
                        name="Probability"
                        dataKey="probability"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        fill="#3b82f6"
                        fillOpacity={0.3}
                    />
                    <Tooltip content={<CustomTooltip />} />
                </RadarChart>
            </ResponsiveContainer>
        </div>
    );
}
