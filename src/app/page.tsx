'use client';

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { motion } from "@/lib/motion";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-black text-white">
      <header className="container mx-auto py-6 flex justify-between items-center">
        <motion.h1 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="text-2xl font-bold text-blue-400"
        >
          Vibe Check
        </motion.h1>
        <div className="flex gap-4">
          <Link href="/sign-in">
            <Button variant="ghost" className="text-gray-300 hover:text-white hover:bg-gray-900">
              Sign In
            </Button>
          </Link>
          <Link href="/sign-up">
            <Button className="bg-blue-600 hover:bg-blue-700">
              Get Started
            </Button>
          </Link>
        </div>
      </header>

      <main className="flex-1 container mx-auto flex flex-col items-center justify-center px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="max-w-3xl"
        >
          <h1 className="text-5xl sm:text-6xl font-bold mb-6">
            Create and Share Fun Quizzes
            <span className="block text-blue-400">With Your Friends</span>
          </h1>
          <p className="text-xl text-gray-400 mb-8">
            Generate quizzes with AI, challenge your friends, and see who tops the leaderboard.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/sign-up">
              <Button className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-6">
                Create Your First Quiz
              </Button>
            </Link>
            <Button variant="outline" className="border-gray-800 text-gray-300 hover:bg-gray-900 hover:text-white text-lg px-8 py-6">
              How It Works
            </Button>
          </div>
        </motion.div>
      </main>

      <footer className="container mx-auto py-8 text-center text-gray-500 border-t border-gray-800">
        <p>© {new Date().getFullYear()} Vibe Check. All rights reserved.</p>
      </footer>
    </div>
  );
}
