export default function Home() {
  // return (
  //   <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
  //     <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
  //      <InterviewQuestionsGenerator/>
  //     </main>
  //     <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center">
  //       <a
  //         className="flex items-center gap-2 hover:underline hover:underline-offset-4"
  //         href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
  //         target="_blank"
  //         rel="noopener noreferrer"
  //       >
  //         <Image
  //           aria-hidden
  //           src="/file.svg"
  //           alt="File icon"
  //           width={16}
  //           height={16}
  //         />
  //         Learn
  //       </a>
  //       <a
  //         className="flex items-center gap-2 hover:underline hover:underline-offset-4"
  //         href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
  //         target="_blank"
  //         rel="noopener noreferrer"
  //       >
  //         <Image
  //           aria-hidden
  //           src="/window.svg"
  //           alt="Window icon"
  //           width={16}
  //           height={16}
  //         />
  //         Examples
  //       </a>
  //       <a
  //         className="flex items-center gap-2 hover:underline hover:underline-offset-4"
  //         href="https://nextjs.org?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
  //         target="_blank"
  //         rel="noopener noreferrer"
  //       >
  //         <Image
  //           aria-hidden
  //           src="/globe.svg"
  //           alt="Globe icon"
  //           width={16}
  //           height={16}
  //         />
  //         Go to nextjs.org →
  //       </a>
  //     </footer>
  //   </div>
  // );
  return (
    <div id="webcrumbs">
        <div className="flex h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
            {/* Sidebar */}
            <div className="hidden md:flex flex-col w-64 bg-gradient-to-b from-gray-900/95 to-black/95 backdrop-blur-xl border-r border-purple-500/20 shadow-2xl">
                <div className="flex items-center justify-center h-20 border-b border-purple-500/30">
                    <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-lg flex items-center justify-center shadow-lg">
                            <span className="material-symbols-outlined text-white">psychology</span>
                        </div>
                        <h1 className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">InterviewAI</h1>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto py-4">
                    <nav className="px-2 space-y-1">
                        <a
                            href="/interview"
                            className="flex items-center px-4 py-3 text-white bg-gradient-to-r from-purple-600/80 to-cyan-600/80 rounded-lg group transition-all duration-300 hover:from-purple-500 hover:to-cyan-500 hover:shadow-lg hover:shadow-purple-500/25"
                        >
                            <span className="material-symbols-outlined mr-3 text-cyan-300">smart_toy</span>
                            <span className="font-medium">AI Mock Interview</span>
                        </a>

                        <a
                            href="#"
                            className="flex items-center px-4 py-3 text-gray-300 rounded-lg group transition-all duration-300 hover:bg-gradient-to-r hover:from-gray-800/50 hover:to-purple-800/30 hover:text-white"
                        >
                            <span className="material-symbols-outlined mr-3 text-gray-400 group-hover:text-purple-300">description</span>
                            <span className="font-medium">Resume Builder</span>
                        </a>

                        <a
                            href="#"
                            className="flex items-center px-4 py-3 text-gray-300 rounded-lg group transition-all duration-300 hover:bg-gradient-to-r hover:from-gray-800/50 hover:to-cyan-800/30 hover:text-white"
                        >
                            <span className="material-symbols-outlined mr-3 text-gray-400 group-hover:text-cyan-300">insights</span>
                            <span className="font-medium">Industry Insights</span>
                        </a>
                    </nav>

                    <div className="px-2 mt-8">
                        <h3 className="px-4 text-xs font-semibold text-purple-300 uppercase tracking-wider">
                            Resources
                        </h3>
                        <div className="mt-2 space-y-1">
                            <a
                                href="#"
                                className="flex items-center px-4 py-2 text-gray-400 rounded-lg transition-all duration-300 hover:bg-gradient-to-r hover:from-indigo-800/30 hover:to-purple-800/30 hover:text-white"
                            >
                                <span className="material-symbols-outlined mr-3 text-gray-500 text-sm hover:text-indigo-300">
                                    library_books
                                </span>
                                <span className="text-sm">Learning Center</span>
                            </a>
                            <a
                                href="#"
                                className="flex items-center px-4 py-2 text-gray-400 rounded-lg transition-all duration-300 hover:bg-gradient-to-r hover:from-teal-800/30 hover:to-cyan-800/30 hover:text-white"
                            >
                                <span className="material-symbols-outlined mr-3 text-gray-500 text-sm hover:text-teal-300">
                                    support
                                </span>
                                <span className="text-sm">Help & Support</span>
                            </a>
                        </div>
                    </div>
                </div>

                <div className="p-4 border-t border-purple-500/30">
                    <div className="flex items-center">
                        <img
                            className="w-10 h-10 rounded-full ring-2 ring-purple-400/50"
                            src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                            alt="User profile"
                        />
                        <div className="ml-3">
                            <p className="text-sm font-medium text-white">Sarah Johnson</p>
                            <p className="text-xs text-purple-300">Premium Plan</p>
                        </div>
                        <button className="ml-auto rounded-full p-1 text-gray-400 hover:text-purple-300 hover:bg-purple-800/30 transition-all duration-200">
                            <span className="material-symbols-outlined text-sm">more_vert</span>
                        </button>
                    </div>
                </div>
                {/* Next: "Add Settings navigation section" */}
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <header className="bg-gradient-to-r from-gray-900/95 to-black/95 backdrop-blur-xl border-b border-purple-500/20 shadow-2xl">
                    <div className="flex items-center justify-between px-6 py-4">
                        <div className="flex items-center md:hidden">
                            <button className="text-purple-300 hover:text-cyan-300 focus:outline-none">
                                <span className="material-symbols-outlined">menu</span>
                            </button>
                            <div className="ml-3 flex items-center">
                                <div className="w-8 h-8 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-lg flex items-center justify-center shadow-lg">
                                    <span className="material-symbols-outlined text-white text-sm">psychology</span>
                                </div>
                                <h1 className="ml-2 text-lg font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">InterviewAI</h1>
                            </div>
                        </div>

                        <div className="hidden md:flex items-center space-x-2">
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Search..."
                                    className="pl-10 pr-4 py-2 bg-gray-800/50 border border-purple-500/30 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 w-64 transition-all duration-200 text-white placeholder-gray-400"
                                />
                                <span className="material-symbols-outlined absolute left-3 top-2.5 text-purple-400">
                                    search
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center space-x-4">
                            <button className="relative p-1 text-purple-300 rounded-full hover:bg-purple-800/30 hover:text-cyan-300 transition-all duration-200">
                                <span className="material-symbols-outlined">notifications</span>
                                <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-gradient-to-r from-cyan-400 to-purple-500 animate-pulse"></span>
                            </button>

                            <button className="p-1 text-purple-300 rounded-full hover:bg-purple-800/30 hover:text-cyan-300 transition-all duration-200">
                                <span className="material-symbols-outlined">help</span>
                            </button>

                            <div className="md:hidden">
                                <img
                                    className="w-8 h-8 rounded-full ring-2 ring-purple-400/50"
                                    src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                                    alt="User profile"
                                />
                            </div>
                        </div>
                    </div>
                </header>

                {/* Main content area */}
                <main className="flex-1 overflow-y-auto bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
                    <div className="max-w-7xl mx-auto">
                        {/* Welcome hero section */}
                        <div className="bg-gradient-to-r from-gray-900/90 to-black/90 backdrop-blur-xl rounded-xl shadow-2xl shadow-purple-500/20 overflow-hidden mb-6 border border-purple-500/20">
                            <div className="md:flex">
                                <div className="p-8 md:w-3/5">
                                    <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent mb-2">Welcome back, Sarah!</h2>
                                    <p className="text-gray-300 mb-6">
                                        Your next interview is in 3 days. Let's continue your preparation.
                                    </p>

                                    <div className="flex flex-wrap gap-4">
                                        <button className="flex items-center bg-gradient-to-r from-purple-600 to-cyan-600 text-white px-5 py-3 rounded-lg hover:from-purple-500 hover:to-cyan-500 transition-all duration-300 shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/30">
                                            <span className="material-symbols-outlined mr-2">smart_toy</span>
                                            Start Mock Interview
                                        </button>
                                        <button className="flex items-center bg-gray-800/50 text-gray-200 border border-purple-500/30 px-5 py-3 rounded-lg hover:bg-gray-700/50 hover:border-cyan-400/50 transition-all duration-300">
                                            <span className="material-symbols-outlined mr-2">description</span>
                                            Review Resume
                                        </button>
                                    </div>
                                </div>
                                <div className="md:w-2/5 bg-gradient-to-br from-purple-600 via-indigo-600 to-cyan-600 flex items-center justify-center p-6">
                                    <img
                                        src="https://images.unsplash.com/photo-1511376979163-f804dff7ad7b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3MzkyNDZ8MHwxfHNlYXJjaHwxfHxpbnRlcnZpZXd8ZW58MHx8fHwxNzU4MzE0Mjc2fDA&ixlib=rb-4.1.0&q=80&w=1080"
                                        alt="Interview illustration"
                                        className="h-48 w-auto transform hover:scale-105 transition-transform duration-300"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Feature sections */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {/* AI Mock Interview Card */}
                            <div className="bg-gradient-to-br from-gray-900/90 to-black/90 backdrop-blur-xl rounded-xl shadow-2xl shadow-purple-500/20 p-6 hover:shadow-purple-500/30 transition-all duration-300 transform hover:-translate-y-2 border border-purple-500/20">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="w-12 h-12 bg-gradient-to-r from-purple-500/20 to-cyan-500/20 rounded-lg flex items-center justify-center">
                                        <span className="material-symbols-outlined text-purple-400">
                                            smart_toy
                                        </span>
                                    </div>
                                    <span className="text-sm font-medium text-purple-300 bg-purple-500/20 px-3 py-1 rounded-full">
                                        Featured
                                    </span>
                                </div>
                                <h3 className="text-lg font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent mb-2">AI Mock Interview</h3>
                                <p className="text-gray-300 mb-4">
                                    Practice with our AI interviewer using voice recognition technology.
                                </p>
                                <div className="flex items-center justify-between">
                                    <div className="flex -space-x-2">
                                        <img
                                            className="w-7 h-7 rounded-full border-2 border-white"
                                            src="https://images.unsplash.com/photo-1491528323818-fdd1faba62cc?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                                            alt="User"
                                        />
                                        <img
                                            className="w-7 h-7 rounded-full border-2 border-white"
                                            src="https://images.unsplash.com/photo-1550525811-e5869dd03032?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                                            alt="User"
                                        />
                                        <img
                                            className="w-7 h-7 rounded-full border-2 border-white"
                                            src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2.25&w=256&h=256&q=80"
                                            alt="User"
                                        />
                                    </div>
                                    <a href="/interview"><button className="text-cyan-400 hover:text-purple-300 font-medium transition-colors duration-300 cursor-pointer">
                                        Try now →
                                    </button></a>
                                </div>
                            </div>

                            {/* Resume Builder Card */}
                            <div className="bg-gradient-to-br from-gray-900/90 to-black/90 backdrop-blur-xl rounded-xl shadow-2xl shadow-indigo-500/20 p-6 hover:shadow-indigo-500/30 transition-all duration-300 transform hover:-translate-y-2 border border-indigo-500/20">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="w-12 h-12 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-lg flex items-center justify-center">
                                        <span className="material-symbols-outlined text-indigo-400">description</span>
                                    </div>
                                    <span className="text-sm font-medium text-indigo-300 bg-indigo-500/20 px-3 py-1 rounded-full">
                                        Popular
                                    </span>
                                </div>
                                <h3 className="text-lg font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent mb-2">Resume Builder</h3>
                                <p className="text-gray-300 mb-4">
                                    Create and analyze your resume with AI-powered suggestions.
                                </p>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        <span className="flex h-2.5 w-2.5 bg-green-400 rounded-full mr-2 animate-pulse"></span>
                                        <span className="text-sm text-gray-400">Last updated: Today</span>
                                    </div>
                                    <button className="text-indigo-400 hover:text-purple-300 font-medium transition-colors duration-300">
                                        Edit resume →
                                    </button>
                                </div>
                            </div>

                            {/* Industry Insights Card */}
                            <div className="bg-gradient-to-br from-gray-900/90 to-black/90 backdrop-blur-xl rounded-xl shadow-2xl shadow-cyan-500/20 p-6 hover:shadow-cyan-500/30 transition-all duration-300 transform hover:-translate-y-2 border border-cyan-500/20">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="w-12 h-12 bg-gradient-to-r from-cyan-500/20 to-teal-500/20 rounded-lg flex items-center justify-center">
                                        <span className="material-symbols-outlined text-cyan-400">insights</span>
                                    </div>
                                    <span className="text-sm font-medium text-cyan-300 bg-cyan-500/20 px-3 py-1 rounded-full">
                                        New
                                    </span>
                                </div>
                                <h3 className="text-lg font-bold bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent mb-2">Industry Insights</h3>
                                <p className="text-gray-300 mb-4">
                                    Explore industry trends and salary data for your target roles.
                                </p>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        <span className="material-symbols-outlined text-yellow-400 text-sm mr-1">
                                            star
                                        </span>
                                        <span className="text-sm text-gray-400">12 new insights</span>
                                    </div>
                                    <button className="text-cyan-400 hover:text-teal-300 font-medium transition-colors duration-300">
                                        Explore →
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Progress section */}
                        <div className="mt-6 bg-gradient-to-r from-gray-900/90 to-black/90 backdrop-blur-xl rounded-xl shadow-2xl shadow-purple-500/20 p-6 border border-purple-500/20">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">Your Interview Preparation</h3>
                                <button className="text-purple-300 hover:text-cyan-300 transition-colors duration-300">
                                    <span className="material-symbols-outlined">more_horiz</span>
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                                <div className="bg-gradient-to-br from-purple-800/30 to-indigo-800/30 rounded-lg p-4 border border-purple-500/20">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm text-gray-300">Total Sessions</span>
                                        <span className="material-symbols-outlined text-purple-400">schedule</span>
                                    </div>
                                    <p className="text-2xl font-bold text-white">12</p>
                                </div>

                                <div className="bg-gradient-to-br from-green-800/30 to-teal-800/30 rounded-lg p-4 border border-green-500/20">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm text-gray-300">Questions Practiced</span>
                                        <span className="material-symbols-outlined text-green-400">quiz</span>
                                    </div>
                                    <p className="text-2xl font-bold text-white">83</p>
                                </div>

                                <div className="bg-gradient-to-br from-yellow-800/30 to-orange-800/30 rounded-lg p-4 border border-yellow-500/20">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm text-gray-300">Avg. Confidence</span>
                                        <span className="material-symbols-outlined text-yellow-400">
                                            trending_up
                                        </span>
                                    </div>
                                    <p className="text-2xl font-bold text-white">76%</p>
                                </div>

                                <div className="bg-gradient-to-br from-blue-800/30 to-cyan-800/30 rounded-lg p-4 border border-blue-500/20">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm text-gray-300">Resume Score</span>
                                        <span className="material-symbols-outlined text-blue-400">grading</span>
                                    </div>
                                    <p className="text-2xl font-bold text-white">82/100</p>
                                </div>
                            </div>

                            <div className="bg-gradient-to-br from-gray-800/50 to-black/50 rounded-lg p-4 border border-gray-600/30">
                                <div className="flex items-center justify-between mb-4">
                                    <h4 className="font-medium text-white">Recent Progress</h4>
                                    <div className="flex space-x-2">
                                        <button className="px-3 py-1 text-sm bg-purple-500/30 text-purple-300 rounded-full hover:bg-purple-500/50 transition-colors duration-300">
                                            Weekly
                                        </button>
                                        <button className="px-3 py-1 text-sm bg-gray-700/50 text-gray-300 rounded-full hover:bg-gray-600/50 transition-colors duration-300">
                                            Monthly
                                        </button>
                                    </div>
                                </div>
                                <div className="h-48 w-full">
                                    {/* Chart would go here - using placeholder */}
                                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800/30 to-purple-800/20 rounded-lg border border-purple-500/20">
                                        <span className="text-purple-300">Performance Chart</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Recommended practice section */}
                        <div className="mt-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">Recommended for You</h3>
                                <button className="text-cyan-400 hover:text-purple-300 font-medium transition-colors duration-300">
                                    View All
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <div className="bg-gradient-to-br from-gray-900/90 to-black/90 backdrop-blur-xl rounded-xl shadow-2xl shadow-blue-500/20 overflow-hidden hover:shadow-blue-500/30 transition-all duration-300 transform hover:-translate-y-1 border border-blue-500/20">
                                    <div className="h-32 bg-gradient-to-r from-blue-600 to-indigo-600 p-4 flex items-end">
                                        <span className="material-symbols-outlined text-white text-4xl">
                                            architecture
                                        </span>
                                    </div>
                                    <div className="p-4">
                                        <div className="flex items-center text-sm text-gray-400 mb-2">
                                            <span className="material-symbols-outlined text-sm mr-1">work</span>
                                            Software Engineering
                                        </div>
                                        <h4 className="font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent mb-2">System Design Interview</h4>
                                        <p className="text-sm text-gray-300 mb-3">
                                            Practice explaining complex systems and architecture.
                                        </p>
                                        <button className="text-blue-400 hover:text-indigo-300 text-sm font-medium transition-colors duration-300">
                                            Start Practice →
                                        </button>
                                    </div>
                                </div>

                                <div className="bg-gradient-to-br from-gray-900/90 to-black/90 backdrop-blur-xl rounded-xl shadow-2xl shadow-green-500/20 overflow-hidden hover:shadow-green-500/30 transition-all duration-300 transform hover:-translate-y-1 border border-green-500/20">
                                    <div className="h-32 bg-gradient-to-r from-green-600 to-teal-600 p-4 flex items-end">
                                        <span className="material-symbols-outlined text-white text-4xl">
                                            psychology_alt
                                        </span>
                                    </div>
                                    <div className="p-4">
                                        <div className="flex items-center text-sm text-gray-400 mb-2">
                                            <span className="material-symbols-outlined text-sm mr-1">work</span>
                                            Product Management
                                        </div>
                                        <h4 className="font-bold bg-gradient-to-r from-green-400 to-teal-400 bg-clip-text text-transparent mb-2">Behavioral Questions</h4>
                                        <p className="text-sm text-gray-300 mb-3">
                                            Master the STAR method for behavioral questions.
                                        </p>
                                        <button className="text-green-400 hover:text-teal-300 text-sm font-medium transition-colors duration-300">
                                            Start Practice →
                                        </button>
                                    </div>
                                </div>

                                <div className="bg-gradient-to-br from-gray-900/90 to-black/90 backdrop-blur-xl rounded-xl shadow-2xl shadow-pink-500/20 overflow-hidden hover:shadow-pink-500/30 transition-all duration-300 transform hover:-translate-y-1 border border-pink-500/20">
                                    <div className="h-32 bg-gradient-to-r from-purple-600 to-pink-600 p-4 flex items-end">
                                        <span className="material-symbols-outlined text-white text-4xl">code</span>
                                    </div>
                                    <div className="p-4">
                                        <div className="flex items-center text-sm text-gray-400 mb-2">
                                            <span className="material-symbols-outlined text-sm mr-1">work</span>
                                            Data Science
                                        </div>
                                        <h4 className="font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">Technical Data Interview</h4>
                                        <p className="text-sm text-gray-300 mb-3">
                                            Practice SQL, statistics, and ML fundamentals.
                                        </p>
                                        <button className="text-purple-400 hover:text-pink-300 text-sm font-medium transition-colors duration-300">
                                            Start Practice →
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
                {/* Next: "Add footer with copyright information and links" */}
            </div>
            {/* Next: "Add mobile navigation drawer component" */}
        </div>
    </div>)
}
