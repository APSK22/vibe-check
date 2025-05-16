import './globals.css';
import { ClerkProvider } from '@clerk/nextjs';
import type { Metadata } from 'next';
import { dark } from '@clerk/themes';
import { Toaster } from 'sonner';

export const metadata: Metadata = {
  title: 'Vibe Check',
  description: 'Create and share fun quizzes with your friends',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider
      appearance={{
        baseTheme: dark,
      }}
    >
      <html lang="en">
        <body className="min-h-screen bg-black text-white">
          <main>{children}</main>
          <Toaster 
            position="top-right"
            theme="dark"
            toastOptions={{
              style: {
                background: '#1f2937',
                border: '1px solid #3b82f6',
                color: 'white',
              }
            }}
          />
        </body>
      </html>
    </ClerkProvider>
  );
}
