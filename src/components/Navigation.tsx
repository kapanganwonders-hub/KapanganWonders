'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { logout } from '@/lib/auth';
import { useRouter, usePathname } from 'next/navigation';

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
    <nav className="bg-white/90 backdrop-blur-md shadow-lg sticky top-0 z-50 border-b border-gray-200/50 hover:border-green-200/50 transition-all duration-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left - Dual Logos and Brand Name */}
          <div className="flex items-center space-x-3 group">
       
            <div className="flex items-center space-x-[-12px] group"> {/* Negative spacing for overlap */}
              {/* First Logo */}
              <div className="relative z-10">
                <img
                  src="/assets/logo-1.png"
                  onError={(e) => (e.currentTarget.src = '/assets/default-logo.png')}
                  alt="Kapangan Logo 1"
                  className="w-12 h-12 rounded-full border-2 border-white shadow-lg object-cover transition-all duration-500 group-hover:scale-110 group-hover:border-green-200 group-hover:shadow-xl"
                />
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-green-400/20 to-blue-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10"></div>
              </div>
              
              {/* Second Logo */}
              <div className="relative z-0">
                <img
                  src="/assets/logo-3.png"
                  onError={(e) => (e.currentTarget.src = '/assets/default-logo.png')}
                  alt="Kapangan Logo 2"
                  className="w-10 h-10 rounded-full border-2 border-white shadow-lg object-cover transition-all duration-500 group-hover:scale-110 group-hover:border-green-200 group-hover:shadow-xl delay-75"
                />
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400/20 to-green-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-75 -z-10"></div>
              </div>
            </div>

            {/* Brand Name */}
            <Link
              href="/"
              className="text-2xl font-bold text-gray-800 hover:text-green-600 transition-all duration-500 ml-2 relative group"
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
              <>
                <Link href="/signin" className={authLink.border}>
                  <span className="relative z-10">Sign In</span>
                  <div className="auth-link-hover-border"></div>
                </Link>
                <Link href="/signup" className={authLink.bg}>
                  <span className="relative z-10">Sign Up</span>
                  <div className="auth-link-hover-bg"></div>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
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
        {isMenuOpen && (
          <div className="md:hidden bg-white/95 backdrop-blur-md border-t border-gray-200/50 mt-2 rounded-2xl shadow-2xl">
            <div className="px-4 py-3 space-y-1">
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

              <div className="border-t border-gray-200/50 pt-3">
                {currentUser ? (
                  <>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2 px-2 py-1 rounded-xl bg-gray-50/50">
                        <img
                          src={currentUser.photoURL || '/assets/default-avatar.png'}
                          onError={(e) => (e.currentTarget.src = '/assets/default-avatar.png')}
                          alt="Profile"
                          className="w-6 h-6 rounded-full border border-gray-300"
                        />
                        <p className="text-sm text-gray-700">
                          {currentUser.email}
                        </p>
                      </div>

                      <div className="space-y-1">
                        {isAdmin ? (
                          <>
                            <Link
                              href="/admin"
                              className={mobileLink}
                              onClick={() => setIsMenuOpen(false)}
                            >
                              <span>Admin Dashboard</span>
                              <div className="mobile-link-hover"></div>
                            </Link>
                            <Link
                              href="/profile"
                              className={mobileLink}
                              onClick={() => setIsMenuOpen(false)}
                            >
                              <span>Profile</span>
                              <div className="mobile-link-hover"></div>
                            </Link>
                          </>
                        ) : (
                          <>
                            <Link
                              href="/dashboard"
                              className={mobileLink}
                              onClick={() => setIsMenuOpen(false)}
                            >
                              <span>Dashboard</span>
                              <div className="mobile-link-hover"></div>
                            </Link>
                            <Link
                              href="/profile"
                              className={mobileLink}
                              onClick={() => setIsMenuOpen(false)}
                            >
                              <span>Profile</span>
                              <div className="mobile-link-hover"></div>
                            </Link>
                          </>
                        )}
                        <button
                          onClick={() => {
                            handleLogout();
                            setIsMenuOpen(false);
                          }}
                          className="w-full text-left px-3 py-2 text-base font-medium text-red-600 hover:bg-red-50/50 rounded-xl transition-all duration-300 group relative"
                        >
                          <span className="relative z-10">Logout</span>
                          <div className="absolute inset-0 bg-red-500/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <Link href="/signin" className={mobileLink} onClick={() => setIsMenuOpen(false)}>
                      <span>Sign In</span>
                      <div className="mobile-link-hover"></div>
                    </Link>
                    <Link href="/signup" className={`${mobileLink} bg`} onClick={() => setIsMenuOpen(false)}>
                      <span>Sign Up</span>
                      <div className="mobile-link-hover-bg"></div>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
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

/* --- Tailwind helper classes --- */
const navLink =
  'relative text-gray-700 hover:text-green-600 px-4 py-2 rounded-md text-sm font-medium transition-all duration-500 hover:scale-105 transform group';
const authLink = {
  border: 'relative text-green-600 border border-green-300 hover:border-green-400 px-4 py-2 rounded-md text-sm font-medium transition-all duration-500 hover:scale-105 transform hover:text-green-700 group auth-link-border',
  bg: 'relative bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-all duration-500 hover:scale-105 transform hover:shadow-lg group auth-link-bg',
};
const mobileLink =
  'block relative text-gray-700 hover:text-green-600 px-3 py-2 rounded-md text-base font-medium transition-all duration-300 group';