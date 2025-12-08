import { Metadata } from 'next';
import { Dashboard } from '@/components/Dashboard';

export const metadata: Metadata = {
    title: 'Industry Insights | Career Intelligence',
    description: 'Get real-time industry trends, skills, and advice for your target role.',
};

export default function IndustryInsightPage() {
    return (
        <main className="min-h-screen overflow-hidden relative selection:bg-blue-500/30">
            {/* Animated Background Elements */}
            <div className="fixed inset-0 z-0">
                <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
                <div className="absolute top-0 -right-4 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
                <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000"></div>
                <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-50 [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]"></div>
            </div>

            <Dashboard />
        </main>
    );
}
