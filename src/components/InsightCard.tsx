'use client';

import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface InsightCardProps {
    title: string;
    icon: LucideIcon;
    children: React.ReactNode;
    delay?: number;
    className?: string;
}

export function InsightCard({ title, icon: Icon, children, delay = 0, className = '' }: InsightCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay }}
            whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
            className={`glass-panel rounded-2xl p-6 transition-all duration-300 hover:shadow-2xl hover:bg-white/80 ${className}`}
        >
            <div className="flex items-center gap-3 mb-5">
                <div className="p-2.5 bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl border border-blue-200">
                    <Icon className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="text-lg font-bold text-zinc-800 tracking-tight">
                    {title}
                </h3>
            </div>
            <div className="text-zinc-600 leading-relaxed">
                {children}
            </div>
        </motion.div>
    );
}
