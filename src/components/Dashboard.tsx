'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Search, ArrowRight, Loader2, Sparkles } from 'lucide-react';

export function Dashboard() {
    const [targetRole, setTargetRole] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!targetRole.trim()) {
            setError('Please enter a target role.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            // Generate a random kickoff ID (simulating a unique session)
            const kickoffId = Math.random().toString(36).substring(2, 15);

            // Navigate to the result page
            router.push(`/industry-insight/${kickoffId}?role=${encodeURIComponent(targetRole)}`);

        } catch (err) {
            setError('Failed to start analysis. Please try again.');
            setLoading(false);
        }
    };

    return (
        <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12 z-10">

            {/* Hero Section */}
            <div className="text-center space-y-8 py-16 relative">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/40 border border-white/60 backdrop-blur-md text-sm font-medium text-zinc-600 mb-4 shadow-sm"
                >
                    <Sparkles className="w-4 h-4 text-purple-600" />
                    <span>AI-Powered Career Intelligence</span>
                </motion.div>

                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-5xl md:text-7xl font-extrabold tracking-tight"
                >
                    <span className="text-gradient">Industry Insights</span>
                    <br />
                    <span className="text-zinc-800 text-4xl md:text-6xl">for your next move.</span>
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-xl text-zinc-600 max-w-2xl mx-auto leading-relaxed"
                >
                    Unlock real-time market trends, skill demands, and strategic advice tailored to your target role.
                </motion.p>

                <motion.form
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    onSubmit={handleSubmit}
                    className="relative max-w-2xl mx-auto group"
                >
                    <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
                    <div className="relative flex items-center bg-white rounded-2xl p-2 ring-1 ring-zinc-200 shadow-xl">
                        <Search className="ml-4 text-zinc-400 w-6 h-6" />
                        <input
                            type="text"
                            placeholder="Enter job title (e.g. Cloud Engineer)"
                            value={targetRole}
                            onChange={(e) => setTargetRole(e.target.value)}
                            className="w-full px-4 py-3 bg-transparent text-lg outline-none text-zinc-900 placeholder:text-zinc-400"
                        />
                        <button
                            type="submit"
                            disabled={loading || !targetRole}
                            className="px-8 py-3 bg-zinc-900 text-white rounded-xl font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
                        </button>
                    </div>
                </motion.form>
            </div>

            {/* Error Message */}
            {error && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl text-center backdrop-blur-sm"
                >
                    {error}
                </motion.div>
            )}
        </div>
    );
}
