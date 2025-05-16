import { UserButton } from "@clerk/nextjs";
import Link from "next/link";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-black text-white">
      <nav className="border-b border-blue-500/30">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-8">
            <Link href="/dashboard" className="text-xl font-bold text-blue-400">
              Vibe Check
            </Link>
            <div className="hidden md:flex gap-6">
              <Link href="/dashboard" className="text-white hover:text-blue-300 transition-colors">
                Dashboard
              </Link>
              <Link href="/dashboard/create" className="text-white hover:text-blue-300 transition-colors">
                Create Quiz
              </Link>
              <Link href="/dashboard/join" className="text-white hover:text-blue-300 transition-colors">
                Join Quiz
              </Link>
              <Link href="/dashboard/leaderboard" className="text-white hover:text-blue-300 transition-colors">
                Leaderboard
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <UserButton 
              appearance={{
                elements: {
                  userButtonAvatarBox: "w-10 h-10",
                  userButtonTrigger: "focus:shadow-none focus:outline-blue-500",
                  userButtonPopoverCard: "bg-gray-900 border border-blue-500/30 text-white",
                  userButtonPopoverActionButton: "text-white hover:bg-gray-800",
                  userButtonPopoverActionButtonText: "text-white",
                  userButtonPopoverFooter: "border-t border-blue-500/30"
                }
              }}
              afterSignOutUrl="/"
            />
          </div>
        </div>
      </nav>
      <main className="container mx-auto p-4 md:p-8">
        {children}
      </main>
    </div>
  );
} 