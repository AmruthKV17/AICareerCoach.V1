import { SignUp } from '@clerk/nextjs'

export default function Page() {
  return (
    <div className='relative min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 overflow-hidden'>
      {/* Animated background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-200/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-purple-200/30 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-0 left-1/3 w-72 h-72 bg-indigo-200/30 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      {/* Backdrop blur overlay */}
      <div className="absolute inset-0 backdrop-blur-sm bg-white/30"></div>

      {/* Sign-up form container */}
      <div className='relative z-10 flex items-center justify-center min-h-screen p-4'>
        <div className="w-full max-w-2xl">
          <SignUp 
            routing="hash"
            signInUrl="/sign-in"
            appearance={{
              elements: {
                rootBox: "mx-auto",
                card: "shadow-2xl backdrop-blur-xl bg-white/95 border border-gray-200/50 rounded-3xl p-8 scale-110",
                headerTitle: "text-3xl font-bold",
                headerSubtitle: "text-lg",
                formButtonPrimary: "bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 hover:opacity-90 text-lg py-3",
                formFieldInput: "text-lg py-3",
                footerActionLink: "text-blue-600 hover:text-purple-600 font-semibold",
              }
            }}
          />
        </div>
      </div>
    </div>
  )
}
