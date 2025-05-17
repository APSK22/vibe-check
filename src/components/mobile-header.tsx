"use client";

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserButton } from "@clerk/nextjs";
import { Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from "@/lib/motion";

export default function MobileHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();
  
  // Only show on dashboard and quiz pages
  if (!pathname.includes('/dashboard') && !pathname.includes('/quiz')) return null;
  
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };
  
  return (
    <header className="relative z-40">
      {/* Mobile Header */}
      <div className="md:hidden flex justify-between items-center p-4 border-b border-blue-500/30 bg-black">
        <Link href="/dashboard" className="text-xl font-bold text-blue-400">
          Vibe Check
        </Link>
        
        <div className="flex items-center gap-4">
          <UserButton 
            appearance={{
              elements: {
                userButtonAvatarBox: "w-9 h-9",
                userButtonTrigger: "focus:shadow-none focus:outline-blue-500",
                userButtonPopoverCard: "bg-gray-900 border border-blue-500/30 text-white",
                userButtonPopoverActionButton: "text-white hover:bg-gray-800",
                userButtonPopoverActionButtonText: "text-white",
                userButtonPopoverFooter: "border-t border-blue-500/30"
              }
            }}
            afterSignOutUrl="/"
          />
          
          <button 
            onClick={toggleMenu} 
            className="p-1.5 rounded-md text-white hover:bg-gray-800"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>
      
      {/* Mobile Menu Dropdown */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div 
            className="md:hidden fixed inset-0 z-30 bg-black bg-opacity-95 pt-16"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            <nav className="flex flex-col p-6 space-y-6">
              <Link 
                href="/dashboard" 
                className="text-lg text-white hover:text-blue-300 transition-colors"
                onClick={toggleMenu}
              >
                Dashboard
              </Link>
              <Link 
                href="/dashboard/create" 
                className="text-lg text-white hover:text-blue-300 transition-colors"
                onClick={toggleMenu}
              >
                Create Quiz
              </Link>
              <Link 
                href="/dashboard/join" 
                className="text-lg text-white hover:text-blue-300 transition-colors"
                onClick={toggleMenu}
              >
                Join Quiz
              </Link>
              <Link 
                href="/dashboard/attempts" 
                className="text-lg text-white hover:text-blue-300 transition-colors"
                onClick={toggleMenu}
              >
                My Attempts
              </Link>
              
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
} 