'use client';

import { SignIn } from "@clerk/nextjs";
import { motion } from "@/lib/motion";

export default function SignInPage() {
  return (
    <div className="flex h-screen items-center justify-center bg-gray-900">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Vibe Check</h1>
          <p className="text-gray-400">Sign in to create and join quizzes</p>
        </div>
        <SignIn appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "bg-gray-800 shadow-xl border border-gray-700",
            headerTitle: "text-white",
            headerSubtitle: "text-gray-400",
            formButtonPrimary: "bg-purple-600 hover:bg-purple-700 text-white",
            socialButtonsBlockButton: "border-gray-600 text-white hover:bg-gray-700",
            formFieldInput: "bg-gray-700 border-gray-600 text-white",
            formFieldLabel: "text-gray-300",
            footer: "text-gray-400",
            footerActionLink: "text-purple-400 hover:text-purple-300"
          }
        }} />
      </motion.div>
    </div>
  );
} 