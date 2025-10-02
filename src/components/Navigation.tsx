'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { logout } from '@/lib/auth';

export default function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { currentUser } = useAuth();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleLogout = async () => {
    try {
      await logout();
      // Redirect to home page after logout
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
      alert('Failed to logout. Please try again.');
    }
  };

  return (
    <nav className="bg-egg-white shadow-lg sticky top-0 z-50 border-b border-border-green">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left side - Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center group">
              <div className="text-2xl font-bold text-primary-green group-hover:text-accent-green transition-colors duration-300 group-hover:scale-105 transform">
                Kapangan Wonder
              </div>
            </Link>
          </div>

          {/* Center - Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              href="/"
              className="text-primary-green hover:text-accent-green hover:bg-light-green px-3 py-2 rounded-md text-sm font-medium transition-all duration-300 hover:scale-105 transform hover:shadow-md"
            >
              Home
            </Link>
            <Link
              href="/tourist-spots"
              className="text-primary-green hover:text-accent-green hover:bg-light-green px-3 py-2 rounded-md text-sm font-medium transition-all duration-300 hover:scale-105 transform hover:shadow-md"
            >
              Tourist Spots
            </Link>
            <Link
              href="/eat-and-stay"
              className="text-primary-green hover:text-accent-green hover:bg-light-green px-3 py-2 rounded-md text-sm font-medium transition-all duration-300 hover:scale-105 transform hover:shadow-md"
            >
              Eat and Stay
            </Link>
            <Link
              href="/blogs"
              className="text-primary-green hover:text-accent-green hover:bg-light-green px-3 py-2 rounded-md text-sm font-medium transition-all duration-300 hover:scale-105 transform hover:shadow-md"
            >
              Blogs
            </Link>
            <Link
              href="/contact"
              className="text-primary-green hover:text-accent-green hover:bg-light-green px-3 py-2 rounded-md text-sm font-medium transition-all duration-300 hover:scale-105 transform hover:shadow-md"
            >
              Contact Us
            </Link>
          </div>

          {/* Right side - Sign In and Sign Up buttons */}
          <div className="flex items-center space-x-4">
            {currentUser ? (
              <>
                <div className="flex items-center space-x-2">
                  {currentUser.photoURL && (
                    <img 
                      src={currentUser.photoURL} 
                      alt="Profile" 
                      className="w-8 h-8 rounded-full"
                    />
                  )}
                  <span className="text-primary-green text-sm font-medium">
                    {currentUser.displayName || currentUser.email}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="text-primary-green hover:text-accent-green hover:bg-light-green px-3 py-2 rounded-md text-sm font-medium transition-all duration-300 border border-border-green hover:border-accent-green hover:scale-105 transform hover:shadow-md"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/signin"
                  className="text-primary-green hover:text-accent-green hover:bg-light-green px-3 py-2 rounded-md text-sm font-medium transition-all duration-300 border border-border-green hover:border-accent-green hover:scale-105 transform hover:shadow-md"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="bg-primary-green hover:bg-accent-green text-egg-white px-4 py-2 rounded-md text-sm font-medium transition-all duration-300 hover:scale-105 transform hover:shadow-lg hover:shadow-primary-green/25"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={toggleMenu}
              className="text-primary-green hover:text-accent-green hover:bg-light-green focus:outline-none focus:text-accent-green p-2 rounded-md transition-all duration-300 hover:scale-110 transform"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-egg-white border-t border-border-green">
              <Link
                href="/"
                className="text-primary-green hover:text-accent-green hover:bg-light-green block px-3 py-2 rounded-md text-base font-medium transition-all duration-300 hover:scale-105 transform hover:shadow-md"
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </Link>
              <Link
                href="/tourist-spots"
                className="text-primary-green hover:text-accent-green hover:bg-light-green block px-3 py-2 rounded-md text-base font-medium transition-all duration-300 hover:scale-105 transform hover:shadow-md"
                onClick={() => setIsMenuOpen(false)}
              >
                Tourist Spots
              </Link>
              <Link
                href="/eat-and-stay"
                className="text-primary-green hover:text-accent-green hover:bg-light-green block px-3 py-2 rounded-md text-base font-medium transition-all duration-300 hover:scale-105 transform hover:shadow-md"
                onClick={() => setIsMenuOpen(false)}
              >
                Eat and Stay
              </Link>
              <Link
                href="/blogs"
                className="text-primary-green hover:text-accent-green hover:bg-light-green block px-3 py-2 rounded-md text-base font-medium transition-all duration-300 hover:scale-105 transform hover:shadow-md"
                onClick={() => setIsMenuOpen(false)}
              >
                Blogs
              </Link>
              <Link
                href="/contact"
                className="text-primary-green hover:text-accent-green hover:bg-light-green block px-3 py-2 rounded-md text-base font-medium transition-all duration-300 hover:scale-105 transform hover:shadow-md"
                onClick={() => setIsMenuOpen(false)}
              >
                Contact Us
              </Link>
              <div className="border-t border-border-green pt-2 mt-2">
                {currentUser ? (
                  <>
                    <div className="flex items-center space-x-2 px-3 py-2">
                      {currentUser.photoURL && (
                        <img 
                          src={currentUser.photoURL} 
                          alt="Profile" 
                          className="w-6 h-6 rounded-full"
                        />
                      )}
                      <span className="text-primary-green text-sm font-medium">
                        {currentUser.displayName || currentUser.email}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        handleLogout();
                        setIsMenuOpen(false);
                      }}
                      className="w-full text-left text-primary-green hover:text-accent-green hover:bg-light-green block px-3 py-2 rounded-md text-base font-medium border border-border-green hover:border-accent-green transition-all duration-300 hover:scale-105 transform hover:shadow-md"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/signin"
                      className="text-primary-green hover:text-accent-green hover:bg-light-green block px-3 py-2 rounded-md text-base font-medium border border-border-green hover:border-accent-green transition-all duration-300 hover:scale-105 transform hover:shadow-md"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Sign In
                    </Link>
                    <Link
                      href="/signup"
                      className="bg-primary-green hover:bg-accent-green text-egg-white block px-3 py-2 rounded-md text-base font-medium mt-2 transition-all duration-300 hover:scale-105 transform hover:shadow-lg hover:shadow-primary-green/25"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Sign Up
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
