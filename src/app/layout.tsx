import './globals.css';
import { ClerkProvider } from '@clerk/nextjs';
import type { Metadata } from 'next';
import { dark } from '@clerk/themes';
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import Script from "next/script";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'Vibe Check - Create and Share Interactive Quizzes',
  description: 'Create, share, and take engaging quizzes with a modern platform. Perfect for educators, content creators, and anyone who loves interactive learning.',
  keywords: [
    'quiz maker',
    'online quiz',
    'interactive quiz',
    'quiz platform',
    'create quiz',
    'share quiz',
    'quiz generator',
    'AI quiz',
    'vibe check',
    'personality quiz',
    'educational quiz',
    'quiz sharing',
    'quiz creation',
    'quiz platform',
    'quiz app'
  ],
  authors: [{ name: 'Ajay P S K' }],
  creator: 'Ajay P S K',
  publisher: 'Vibe Check',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://vibe-check.vercel.app'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://vibe-check.vercel.app',
    title: 'Vibe Check - Create and Share Interactive Quizzes',
    description: 'Create, share, and take engaging quizzes with a modern platform. Perfect for educators, content creators, and anyone who loves interactive learning.',
    siteName: 'Vibe Check',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Vibe Check - Interactive Quiz Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Vibe Check - Create and Share Interactive Quizzes',
    description: 'Create, share, and take engaging quizzes with a modern platform. Perfect for educators, content creators, and anyone who loves interactive learning.',
    images: ['/og-image.png'],
    creator: '@vibecheck',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      {
        url: '/vibecheck-favicon.svg',
        type: 'image/svg+xml',
      }
    ],
    apple: [
      {
        url: '/apple-touch-icon.png',
        sizes: '180x180',
        type: 'image/png',
      }
    ],
  },
  manifest: '/site.webmanifest',
  verification: {
    google: 'FE1kfRFlJTV-wgIpJfq0foiW12zeaXDbYr9SXUwvgWY',
  },
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
      <html lang="en" className="dark h-full bg-black">
        <head>
          <link id="favicon" rel="icon" type="image/svg+xml" href="/vibecheck-favicon.svg" />
          <meta name="theme-color" content="#0c0c0c" />
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
          <meta name="google-site-verification" content="FE1kfRFlJTV-wgIpJfq0foiW12zeaXDbYr9SXUwvgWY" />
        </head>
        <body className={`${inter.className} h-full bg-black`}>
          <main className="min-h-screen bg-black text-white">
            {children}
          </main>
          <Toaster />
          <Script src="/vibecheck-animated-favicon.js" strategy="afterInteractive" />
        </body>
      </html>
    </ClerkProvider>
  );
}
