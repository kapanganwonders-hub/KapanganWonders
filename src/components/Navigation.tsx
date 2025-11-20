'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { logout } from '@/lib/auth';
import { useRouter, usePathname } from 'next/navigation';

/* --- Tailwind helper classes --- */
const navLink =
  'relative text-gray-700 hover:text-green-600 px-4 py-2 rounded-md text-sm font-medium transition-all duration-500 hover:scale-105 transform group';

const authLink = {
  border: 'relative px-4 py-1.5 text-sm font-medium text-green-700 hover:text-green-800 rounded-lg border-2 border-green-200 hover:border-green-300 transition-all duration-500 hover:scale-105',
  bg: 'relative px-4 py-1.5 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-all duration-500 hover:scale-105 transform hover:shadow-md'
};

const mobileLink =
  'block relative text-gray-700 hover:text-green-600 px-4 py-3 rounded-xl text-base font-medium transition-all duration-300 group active:bg-gray-100 -mx-2';

export default function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { currentUser, isAdmin } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  
  
  const navigateToDashboard = () => {
    router.push(isAdmin ? '/admin' : '/dashboard');
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
      alert('Failed to logout. Please try again.');
    }
  };

  // Changed: Only redirect admins when they're on /dashboard (or sub-paths).
  // Do NOT auto-redirect when on the homepage ('/').
  useEffect(() => {
    if (currentUser && isAdmin) {
      if (pathname && pathname.startsWith('/dashboard')) {
        router.push('/admin');
      }
    }
  }, [currentUser, isAdmin, pathname, router]);

  return (
    <nav className="bg-gradient-to-b from-green-100 to-green-200 text-black shadow-lg sticky top-0 z-50 border-b border-gray-200/50 hover:border-green-200/50 transition-all duration-500">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left - Dual Logos and Brand Name */}
          <div className="flex items-center space-x-2 sm:space-x-3 group">
            <div className="flex items-center space-x-[-10px] sm:space-x-[-12px] group">
              {/* First Logo */}
              <div className="relative z-10">
                <img
                  src="/assets/logo-1.png"
                  onError={(e) => (e.currentTarget.src = '/assets/default-logo.png')}
                  alt="Kapangan Logo 1"
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-white shadow-lg object-cover transition-all duration-500 group-hover:scale-110 group-hover:border-green-200 group-hover:shadow-xl"
                  width={48}
                  height={48}
                />
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-green-400/20 to-blue-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10"></div>
              </div>
              
              {/* Second Logo */}
              <div className="relative z-0">
                <img
                  src="/assets/logo-3.png"
                  onError={(e) => (e.currentTarget.src = '/assets/default-logo.png')}
                  alt="Kapangan Logo 2"
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-white shadow-lg object-cover transition-all duration-500 group-hover:scale-110 group-hover:border-green-200 group-hover:shadow-xl delay-75"
                  width={40}
                  height={40}
                />
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400/20 to-green-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-75 -z-10"></div>
              </div>
            </div>

            {/* Brand Name */}
            <Link
              href="/"
              className="text-xl sm:text-2xl font-bold text-gray-800 hover:text-green-600 transition-all duration-500 ml-1 sm:ml-2 relative group"
            >
              <span className="relative z-10">Kapangan Wonders</span>
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-green-500 to-blue-500 group-hover:w-full transition-all duration-500"></span>
            </Link>
          </div>

          {/* Center - Nav Links */}
          <div className="hidden md:flex items-center space-x-2">
            <Link href="/" className={navLink}>
              <span className="relative z-10">Home</span>
              <div className="nav-link-hover"></div>
            </Link>
            <Link href="/tourist-spots" className={navLink}>
              <span className="relative z-10">Tourist Spots</span>
              <div className="nav-link-hover"></div>
            </Link>
            <Link href="/blogs" className={navLink}>
              <span className="relative z-10">Blogs</span>
              <div className="nav-link-hover"></div>
            </Link>
            <Link href="/contact" className={navLink}>
              <span className="relative z-10">Contact Us</span>
              <div className="nav-link-hover"></div>
            </Link>
          </div>

          {/* Right - Auth or Profile */}
          <div className="flex items-center space-x-3">
            {currentUser ? (
              <button
                onClick={navigateToDashboard}
                className="focus:outline-none group relative"
              >
                <div className="absolute -inset-1 bg-gradient-to-r from-green-400 to-blue-400 rounded-full opacity-0 group-hover:opacity-20 transition-opacity duration-500 blur-sm"></div>
                <img
                  src={currentUser.photoURL || '/assets/default-avatar.png'}
                  onError={(e) => (e.currentTarget.src = '/assets/default-avatar.png')}
                  alt="Profile"
                  className="w-9 h-9 rounded-full border-2 border-gray-300 group-hover:border-green-400 transition-all duration-500 relative z-10 group-hover:scale-110 group-hover:shadow-lg"
                />
                <div className="absolute -inset-1 bg-gradient-to-r from-green-400/30 to-blue-400/30 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10"></div>
              </button>
            ) : (
              <div className="hidden md:flex items-center space-x-3">
                <Link href="/signin" className={authLink.border}>
                  <span className="relative z-10">Sign In</span>
                </Link>
                <Link href="/signup" className={authLink.bg}>
                  <span className="relative z-10">Sign Up</span>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={toggleMenu}
              className="w-10 h-10 text-gray-700 hover:text-green-600 p-2 rounded-xl transition-all duration-500 hover:bg-green-50 group relative"
            >
              <svg className="h-6 w-6 transition-transform duration-500 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-green-400/10 to-blue-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        <div className={`md:hidden fixed inset-0 z-40 transition-all duration-300 ease-in-out ${isMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>
          {/* Backdrop */}
          <div 
            className={`absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity duration-300 ${isMenuOpen ? 'opacity-100' : 'opacity-0'}`}
            onClick={() => setIsMenuOpen(false)}
          ></div>
          
          {/* Menu Panel */}
          <div 
            className={`absolute right-0 top-0 h-full w-4/5 max-w-sm bg-white/95 backdrop-blur-md shadow-2xl transform transition-transform duration-300 ease-in-out ${
              isMenuOpen ? 'translate-x-0' : 'translate-x-full'
            }`}
          >
            <div className="h-full flex flex-col overflow-y-auto">
              {/* Header with close button */}
              <div className="px-5 py-4 border-b border-gray-200/50 flex items-center justify-between">
                <Link
                  href="/"
                  className="text-xl font-bold text-gray-800 hover:text-green-600 transition-colors duration-300"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Kapangan Wonders
                </Link>
                <button 
                  onClick={() => setIsMenuOpen(false)}
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                  aria-label="Close menu"
                >
                  <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {/* Menu Items */}
              <nav className="flex-1 px-3 py-4 space-y-1">
                {currentUser && (
                  <div className="mb-4 pb-4 border-b border-gray-200/50">
                    <div className="flex items-center space-x-3 px-2 py-2 rounded-xl bg-gray-50/50">
                      <img
                        src={currentUser.photoURL || '/assets/default-avatar.png'}
                        onError={(e) => (e.currentTarget.src = '/assets/default-avatar.png')}
                        alt="Profile"
                        className="w-10 h-10 rounded-full border-2 border-green-200"
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {currentUser.displayName || currentUser.email}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {currentUser.email}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                <Link href="/" className={mobileLink} onClick={() => setIsMenuOpen(false)}>
                  <span>Home</span>
                  <div className="mobile-link-hover"></div>
                </Link>
                <Link href="/tourist-spots" className={mobileLink} onClick={() => setIsMenuOpen(false)}>
                  <span>Tourist Spots</span>
                  <div className="mobile-link-hover"></div>
                </Link>
                <Link href="/blogs" className={mobileLink} onClick={() => setIsMenuOpen(false)}>
                  <span>Blogs</span>
                  <div className="mobile-link-hover"></div>
                </Link>
                <Link href="/contact" className={mobileLink} onClick={() => setIsMenuOpen(false)}>
                  <span>Contact Us</span>
                  <div className="mobile-link-hover"></div>
                </Link>
                
                {currentUser && (
                  <>
                    {isAdmin ? (
                      <Link
                        href="/admin"
                        className={mobileLink}
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <span>Admin Dashboard</span>
                        <div className="mobile-link-hover"></div>
                      </Link>
                    ) : (
                      <Link
                        href="/dashboard"
                        className={mobileLink}
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <span>Dashboard</span>
                        <div className="mobile-link-hover"></div>
                      </Link>
                    )}
                    <button
                      onClick={() => {
                        handleLogout();
                        setIsMenuOpen(false);
                      }}
                      className="w-full text-left px-4 py-3 text-base font-medium text-red-600 hover:bg-red-50/50 rounded-xl transition-all duration-300 group relative -mx-2"
                    >
                      <span className="relative z-10">Logout</span>
                      <div className="absolute inset-0 bg-red-500/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </button>
                  </>
                )}
                
              </nav>

              {/* Sign In / Sign Up buttons for mobile - only show when not logged in */}
              <div className="border-t border-gray-200/50 pt-3 mt-auto">
                {!currentUser && (
                  <div className="px-2 space-y-2">
                    <Link 
                      href="/signin" 
                      className="block w-full text-center px-4 py-3 text-base font-medium text-green-700 bg-white border-2 border-green-300 rounded-xl hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-green-200 transition-colors duration-300 active:scale-95"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Sign In
                    </Link>
                    <Link 
                      href="/signup" 
                      className="block w-full text-center px-4 py-3 text-base font-medium text-white bg-gradient-to-r from-green-500 to-green-600 rounded-xl hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-green-200 transition-all duration-300 active:scale-95"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Sign Up
                    </Link>
                  </div>
                )}
              </div>
              
              {/* Footer */}
              <div className="px-5 py-4 border-t border-gray-200/50 text-center text-sm text-gray-500">
                © {new Date().getFullYear()} Kapangan Wonders. All rights reserved.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Styles */}
      <style jsx>{`
        .nav-link-hover {
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%);
          border-radius: 0.5rem;
          opacity: 0;
          transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
          transform: scale(0.95);
          z-index: 0;
        }
        
        .nav-link:hover .nav-link-hover {
          opacity: 1;
          transform: scale(1);
        }
        
        .auth-link-hover-border {
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%);
          border-radius: 0.375rem;
          opacity: 0;
          transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
          transform: scale(0.95);
          z-index: 0;
        }
        
        .auth-link-border:hover .auth-link-hover-border {
          opacity: 1;
          transform: scale(1);
        }
        
        .auth-link-hover-bg {
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(34, 197, 94, 0.2) 0%, rgba(34, 197, 94, 0.3) 100%);
          border-radius: 0.375rem;
          opacity: 0;
          transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
          transform: scale(0.95);
          z-index: 0;
        }
        
        .auth-link-bg:hover .auth-link-hover-bg {
          opacity: 1;
          transform: scale(1);
        }
        
        .mobile-link-hover {
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%);
          border-radius: 0.5rem;
          opacity: 0;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          transform: scale(0.95);
          z-index: 0;
        }
        
        .mobile-link:hover .mobile-link-hover {
          opacity: 1;
          transform: scale(1);
        }
        
        .mobile-link-hover-bg {
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(34, 197, 94, 0.2) 0%, rgba(34, 197, 94, 0.3) 100%);
          border-radius: 0.5rem;
          opacity: 0;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          transform: scale(0.95);
          z-index: 0;
        }
        
        .mobile-link.bg:hover .mobile-link-hover-bg {
          opacity: 1;
          transform: scale(1);
        }
      `}</style>
    </nav>
  );
}