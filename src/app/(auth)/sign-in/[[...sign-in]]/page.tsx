"use client";

import { SignIn } from "@clerk/nextjs";
import { dark } from "@clerk/themes";

export default function SignInPage() {
  return (
    <div className="flex h-screen items-center justify-center bg-black">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-blue-400 mb-2">Vibe Check</h1>
          <p className="text-white">Sign in to continue</p>
        </div>
        
        <SignIn
          appearance={{
            baseTheme: dark,
            elements: {
              rootBox: "mx-auto",
              card: "bg-gray-900 shadow-2xl border border-blue-500/30",
              formButtonPrimary: "bg-blue-600 hover:bg-blue-700 text-white",
              formFieldInput: "bg-gray-800 border-blue-500/50 text-white",
              formFieldLabel: "text-blue-300",
              headerTitle: "text-white",
              headerSubtitle: "text-blue-200",
              socialButtonsBlockButton: "border-blue-500/30 bg-gray-800 hover:bg-gray-700",
              socialButtonsBlockButtonText: "text-white",
              dividerLine: "bg-blue-500/30",
              dividerText: "text-white",
              footerActionLink: "text-blue-300 hover:text-blue-200"
            }
          }}
        />
      </div>
    </div>
  );
} 