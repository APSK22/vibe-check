'use client';

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { motion } from "@/lib/motion";
import { Shield, Share2, CheckCircle2, Bot, Brain, Wand2 } from "lucide-react";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-black to-gray-900 text-white">
      {/* Header */}
      <header className="container mx-auto py-4 md:py-6 px-4 flex justify-between items-center">
        <motion.h1 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500"
        >
          Vibe Check
        </motion.h1>
        <div className="flex gap-3">
          <Link href="/sign-in">
            <Button variant="ghost" className="text-gray-300 hover:text-white hover:bg-gray-800/50">
              Sign In
            </Button>
          </Link>
          <Link href="/sign-up">
            <Button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600">
              Get Started
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 container mx-auto flex flex-col items-center px-4 py-8 md:py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="max-w-4xl text-center mb-16"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="inline-block px-4 py-1 mb-6 rounded-full bg-blue-900/30 border border-blue-500/30"
          >
            <span className="text-blue-400 text-sm font-medium">AI-powered quiz platform</span>
          </motion.div>
          
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 leading-tight">
            Create and Share Fun Quizzes
            <span className="block bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500 mt-2">With Your Friends</span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
            Generate AI-powered quizzes in seconds, challenge your friends, and discover your personality with our intelligent quiz analysis.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/sign-up">
              <Button className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-lg px-6 py-6 rounded-xl shadow-lg shadow-blue-500/20">
                Create Your First Quiz
              </Button>
            </Link>
            
          </div>
        </motion.div>

        {/* AI Highlight Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="w-full max-w-4xl mb-16"
        >
          <div className="bg-gradient-to-br from-blue-900/30 to-purple-900/30 border border-blue-500/20 rounded-xl p-6 md:p-8 backdrop-blur-sm">
            <div className="flex flex-col md:flex-row gap-8 items-center">
              <div className="flex-shrink-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full p-5">
                <Bot className="w-12 h-12 text-blue-400" />
              </div>
              <div className="text-center md:text-left">
                <h2 className="text-2xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
                  Powered by AI Technology
                </h2>
                <p className="text-gray-300 md:text-lg">
                  Create custom quizzes with just a few clicks using our advanced AI. Get your quiz generated in seconds and receive deep personality insights from our intelligent analysis.
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Features Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16"
        >
          {[
            {
              icon: <Wand2 className="h-6 w-6 text-yellow-400" />,
              title: "AI Quiz Generation",
              description: "Create complete quizzes on any topic in seconds with our AI-powered quiz generator."
            },
            {
              icon: <Brain className="h-6 w-6 text-purple-400" />,
              title: "Personality Analysis",
              description: "Get AI-powered insights about your personality based on your quiz answers."
            },
            {
              icon: <Shield className="h-6 w-6 text-blue-400" />,
              title: "Secure Authentication",
              description: "Enterprise-grade authentication powered by Clerk ensures your data stays private."
            },
            {
              icon: <Share2 className="h-6 w-6 text-green-400" />,
              title: "Easy Sharing",
              description: "Create and share quizzes with friends in seconds with our intuitive interface."
            }
          ].map((feature, index) => (
            <motion.div
              key={index}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 + index * 0.1 }}
              className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700 hover:border-blue-500/50 transition-all"
            >
              <div className="bg-blue-900/30 rounded-lg p-3 w-fit mb-4">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
              <p className="text-gray-300">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Secure Platform Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.5 }}
          className="w-full max-w-4xl bg-gradient-to-br from-blue-900/20 to-purple-900/20 border border-blue-500/20 rounded-2xl p-6 md:p-8 backdrop-blur-sm"
        >
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">Built on a <span className="text-blue-400">Secure Foundation</span></h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-start space-x-4">
              <CheckCircle2 className="h-5 w-5 text-blue-400 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-medium text-white">Enterprise Authentication</h3>
                <p className="text-gray-300 text-sm">Powered by Clerk&apos;s advanced security system</p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <CheckCircle2 className="h-5 w-5 text-blue-400 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-medium text-white">Data Encryption</h3>
                <p className="text-gray-300 text-sm">All user data is encrypted at rest and in transit</p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <CheckCircle2 className="h-5 w-5 text-blue-400 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-medium text-white">Supabase Backend</h3>
                <p className="text-gray-300 text-sm">Reliable database with row-level security</p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <CheckCircle2 className="h-5 w-5 text-blue-400 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-medium text-white">Privacy Controls</h3>
                <p className="text-gray-300 text-sm">Full control over your quiz visibility and sharing</p>
              </div>
            </div>
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="container mx-auto py-8 px-4 text-center text-gray-500 border-t border-gray-800">
        <p>© {new Date().getFullYear()} Vibe Check. All rights reserved.</p>
      </footer>
    </div>
  );
}
