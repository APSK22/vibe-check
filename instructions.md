Instructions for Building the "Vibe Check" Quiz App

This document provides step-by-step instructions for Cursor to build a "Vibe Check" quiz web application using Next.js, Clerk for authentication, Supabase for backend storage, and Google Gemini 2.0 API for AI-generated quizzes. The app will feature a modern, dark-themed UI with smooth animations, a leaderboard, and shareable quiz links. The app must be deployed live and prioritize shipping speed, technical skill, creativity, originality, playfulness, and shareability.

Project Overview





App Name: Vibe Check



Purpose: A playful quiz app where users can create quizzes (manually or via Google Gemini 2.0 API), join quizzes using a quiz ID, or access public quizzes. Results are displayed in real-time, with a leaderboard for top performers.



Tech Stack:





Frontend/Backend Framework: Next.js (App Router)



Authentication: Clerk



Database: Supabase (PostgreSQL)



AI Quiz Generation: Google Gemini 2.0 API



Styling: Tailwind CSS shadcn for dark-themed UI



Animations: Framer Motion for smooth, playful transitions



Deployment: Vercel



Key Features:





User authentication (sign-up, login, logout) via Clerk.
make sure that you add clerksupabse integeration 


Create quizzes manually or using Google Gemini 2.0 API.



Join quizzes via unique quiz ID or browse public quizzes.



Real-time quiz results with a leaderboard.



Shareable quiz links for easy distribution.



Modern, dark-themed UI with engaging animations.

Instructions for Cursor

Follow these steps sequentially to build the app. For each step, implement the functionality, test it, and notify me if any configuration (e.g., Supabase tables, Clerk setup, or API keys) is required before proceeding. Do not skip any steps, and ensure the code is clean, modular, and adheres to best practices. Use modern JavaScript (ES6+) and prioritize a playful, user-friendly experience.

Notes for Cursor





Prompt Before Actions: Always notify me before creating Supabase tables, modifying database schemas, or requiring API keys/environment variables.



Code Quality: Use TypeScript for type safety, modular components, and clean code practices.



Error Handling: Implement error boundaries and user-friendly error messages.



Performance: Optimize for fast loading (e.g., lazy-load images, use Next.js Image component).



Playfulness: Incorporate creative, fun elements in the UI (e.g., vibrant button animations, playful typography).



Shareability: Ensure quiz links are easy to share and accessible without authentication for public quizzes.

