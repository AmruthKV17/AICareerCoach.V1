"use client"
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      {/* Animated background elements */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-200/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-purple-200/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-0 left-1/3 w-72 h-72 bg-indigo-200/20 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold mb-6 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
            Master Your Next Interview
          </h2>
          <p className="text-xl text-gray-700 mb-8 max-w-3xl mx-auto leading-relaxed">
            Practice with our AI-powered interview coach and get personalized feedback to boost your confidence and land your dream job.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => router.push('/interview')}
              className="px-8 py-4 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white rounded-2xl font-bold text-lg shadow-2xl hover:shadow-blue-500/30 transition-all duration-300 hover:scale-105"
            >
              🚀 Start Mock Interview
            </button>
            <button className="px-8 py-4 bg-white/80 backdrop-blur-sm border border-gray-200 text-gray-700 rounded-2xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:bg-white">
              📋 View Features
            </button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {/* AI Mock Interview */}
          <div className="bg-white/80 backdrop-blur-xl border border-gray-200/50 rounded-3xl p-8 shadow-2xl hover:shadow-3xl transition-all duration-300 hover:-translate-y-2">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
              <span className="text-white text-2xl">🤖</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-4">AI Mock Interview</h3>
            <p className="text-gray-600 mb-6 leading-relaxed">
              Practice with our advanced AI interviewer that adapts to your responses and provides real-time feedback.
            </p>
            <button
              onClick={() => router.push('/interview')}
              className="text-blue-600 hover:text-purple-600 font-semibold transition-colors duration-300"
            >
              Try Now →
            </button>
          </div>

          {/* Personalized Feedback */}
          <div className="bg-white/80 backdrop-blur-xl border border-gray-200/50 rounded-3xl p-8 shadow-2xl hover:shadow-3xl transition-all duration-300 hover:-translate-y-2">
            <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-teal-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
              <span className="text-white text-2xl">📊</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-4">Smart Analytics</h3>
            <p className="text-gray-600 mb-6 leading-relaxed">
              Get detailed analysis of your performance with actionable insights to improve your interview skills.
            </p>
            <button className="text-green-600 hover:text-teal-600 font-semibold transition-colors duration-300">
              Learn More →
            </button>
          </div>

          {/* Industry-Specific */}
          <div className="bg-white/80 backdrop-blur-xl border border-gray-200/50 rounded-3xl p-8 shadow-2xl hover:shadow-3xl transition-all duration-300 hover:-translate-y-2">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
              <span className="text-white text-2xl">🎯</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-4">Industry Focus</h3>
            <p className="text-gray-600 mb-6 leading-relaxed">
              Tailored questions and scenarios for your specific industry and role requirements.
            </p>
            <button className="text-purple-600 hover:text-pink-600 font-semibold transition-colors duration-300">
              Explore →
            </button>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-white/80 backdrop-blur-xl border border-gray-200/50 rounded-3xl p-12 shadow-2xl text-center">
          <h3 className="text-3xl font-bold mb-4 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
            Ready to Ace Your Interview?
          </h3>
          <p className="text-gray-700 text-lg mb-8 max-w-2xl mx-auto">
            Join thousands of successful candidates who have improved their interview skills with our AI coach.
          </p>
          <button
            onClick={() => router.push('/interview')}
            className="px-12 py-4 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white rounded-2xl font-bold text-xl shadow-2xl hover:shadow-blue-500/30 transition-all duration-300 hover:scale-105"
          >
            Get Started Today ✨
          </button>
        </div>
      </main>
    </div>
  );
}
