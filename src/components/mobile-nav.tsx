"use client";

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Home, PlusCircle, Users, History } from 'lucide-react';

export default function MobileNav() {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  
  // Handle scroll to hide/show the navigation on scroll
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Hide nav when scrolling down, show when scrolling up
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
      
      setLastScrollY(currentScrollY);
    };
    
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);
  
  // Show mobile nav on dashboard routes and quiz pages
  if (!pathname.includes('/dashboard') && !pathname.includes('/quiz')) return null;
  
  return (
    <nav className={`md:hidden fixed bottom-0 left-0 right-0 z-50 bg-gray-900 border-t border-blue-500/30 transition-transform duration-300 ${isVisible ? 'translate-y-0' : 'translate-y-full'}`}>
      <div className="flex justify-around items-center h-16">
        <Link 
          href="/dashboard"
          className={`flex flex-col items-center justify-center w-full h-full ${
            pathname === '/dashboard' ? 'text-blue-400' : 'text-white'
          }`}
        >
          <Home size={18} />
          <span className="text-xs mt-1">Home</span>
        </Link>
        
        <Link 
          href="/dashboard/create"
          className={`flex flex-col items-center justify-center w-full h-full ${
            pathname.includes('/create') ? 'text-blue-400' : 'text-white'
          }`}
        >
          <PlusCircle size={18} />
          <span className="text-xs mt-1">Create</span>
        </Link>
        
        <Link 
          href="/dashboard/join"
          className={`flex flex-col items-center justify-center w-full h-full ${
            pathname.includes('/join') ? 'text-blue-400' : 'text-white'
          }`}
        >
          <Users size={18} />
          <span className="text-xs mt-1">Join</span>
        </Link>
        
        <Link 
          href="/dashboard/attempts"
          className={`flex flex-col items-center justify-center w-full h-full ${
            pathname.includes('/attempts') ? 'text-blue-400' : 'text-white'
          }`}
        >
          <History size={18} />
          <span className="text-xs mt-1">History</span>
        </Link>
        
        
      </div>
    </nav>
  );
} 