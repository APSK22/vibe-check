import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import MobileNav from "@/components/mobile-nav";
import MobileHeader from "@/components/mobile-header";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-black text-white pb-16 md:pb-0">
      {/* Mobile Header */}
      <MobileHeader />
      
      {/* Desktop Navigation */}
      <nav className="hidden md:block border-b border-blue-500/30">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-8">
            <Link href="/dashboard" className="text-xl font-bold text-blue-400">
              Vibe Check
            </Link>
            <div className="flex gap-6">
              <Link href="/dashboard" className="text-white hover:text-blue-300 transition-colors">
                Dashboard
              </Link>
              <Link href="/dashboard/create" className="text-white hover:text-blue-300 transition-colors">
                Create Quiz
              </Link>
              <Link href="/dashboard/join" className="text-white hover:text-blue-300 transition-colors">
                Join Quiz
              </Link>
              <Link href="/dashboard/attempts" className="text-white hover:text-blue-300 transition-colors">
                My Attempts
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
      
      {/* Main Content */}
      <main className="container mx-auto p-4 md:p-8">
        {children}
      </main>
      
      {/* Mobile Bottom Navigation */}
      <MobileNav />
    </div>
  );
} 