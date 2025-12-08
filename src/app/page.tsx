"use client";

import { motion } from "framer-motion";
import { ArrowRight, Bot, FileText, LineChart, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  const features = [
    {
      title: "Mock Interview with AI",
      description: "Practice with our advanced AI interviewer that adapts to your responses and provides real-time feedback.",
      icon: Bot,
      color: "from-blue-500 to-cyan-500",
      link: "/interview",
    },
    {
      title: "Resume Optimization",
      description: "Get your resume ranked higher with our AI-driven optimization tools and keyword analysis.",
      icon: FileText,
      color: "from-purple-500 to-pink-500",
      link: "/resumer-optimize",
    },
    {
      title: "Industry Insights",
      description: "Stay ahead of the curve with real-time market data, salary trends, and skill requirements.",
      icon: LineChart,
      color: "from-orange-500 to-red-500",
      link: "/industry-insight",
    },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 selection:bg-blue-100 selection:text-blue-900">

      {/* Aurora Background */}
      <div className="fixed inset-0 z-0 opacity-40 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-400/20 blur-[100px] animate-aurora" />
        <div className="absolute top-[20%] right-[-10%] w-[30%] h-[30%] rounded-full bg-purple-400/20 blur-[100px] animate-aurora delay-1000" />
        <div className="absolute bottom-[-10%] left-[20%] w-[50%] h-[50%] rounded-full bg-indigo-400/20 blur-[100px] animate-aurora delay-2000" />
      </div>

      <main className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 py-20 pb-32">

        {/* Hero Section */}
        <section className="text-center mb-32 pt-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/50 dark:bg-white/5 border border-white/20 backdrop-blur-md shadow-sm mb-8"
          >
            <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-medium bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              AI-Powered Career Acceleration
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-5xl md:text-7xl font-bold tracking-tight mb-8 bg-gradient-to-br from-gray-900 via-gray-700 to-gray-500 dark:from-white dark:via-gray-200 dark:to-gray-500 bg-clip-text text-transparent"
          >
            Master Your <br />
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Professional Journey
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-lg md:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-12 leading-relaxed"
          >
            Elevate your career with our all-in-one platform. From mastering interviews to optimizing your resume and gaining industry insights, we have got you covered.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <button
              onClick={() => router.push('/interview')}
              className="px-8 py-4 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold text-lg shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2"
            >
              Start Practice <ArrowRight className="w-5 h-5" />
            </button>
            <Link
              href="#features"
              className="px-8 py-4 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white font-semibold text-lg shadow-sm hover:bg-gray-50 dark:hover:bg-white/10 transition-all duration-300"
            >
              Explore Features
            </Link>
          </motion.div>
        </section>

        {/* Features Grid */}
        <section id="features" className="scroll-mt-24">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.2 }}
                className="group relative h-full"
              >
                <Link href={feature.link} className="block h-full">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-white/10 dark:from-white/10 dark:to-white/5 rounded-3xl blur-xl transition-all duration-500 group-hover:scale-110 group-hover:blur-2xl opacity-0 group-hover:opacity-100" />

                  <div className="relative h-full p-8 bg-white/70 dark:bg-gray-900/50 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden group-hover:-translate-y-2">

                    {/* Gradient Blob for Card */}
                    <div className={`absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br ${feature.color} opacity-10 group-hover:opacity-20 blur-3xl rounded-full transition-all duration-500`} />

                    <div className={`w-14 h-14 mb-6 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      <feature.icon className="w-7 h-7" />
                    </div>

                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                      {feature.title}
                    </h3>

                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-6">
                      {feature.description}
                    </p>

                    <div className="flex items-center text-sm font-semibold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 bg-clip-text text-transparent group-hover:translate-x-2 transition-transform duration-300">
                      Try now <ArrowRight className="w-4 h-4 ml-2 text-gray-900 dark:text-white" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </section>

      </main>
    </div>
  );
}
