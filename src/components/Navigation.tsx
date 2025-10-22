'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { logout } from '@/lib/auth';
import { useRouter, usePathname } from 'next/navigation';

export default function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { currentUser, isAdmin } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const toggleDropdown = () => setIsDropdownOpen(!isDropdownOpen);

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
    <nav className="bg-primary-green shadow-lg sticky top-0 z-50 border-b border-border-green">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left - Logo */}
          <Link
            href="/" // Changed: always link to homepage so admin can visit it
            className="text-2xl font-bold text-egg-white hover:text-light-green transition"
          >
            Kapangan Wonder
          </Link>

          {/* Center - Nav Links */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/" className={navLink}>Home</Link>
            <Link href="/tourist-spots" className={navLink}>Tourist Spots</Link>
            <Link href="/eat-and-stay" className={navLink}>Eat & Stay</Link>
            <Link href="/blogs" className={navLink}>Blogs</Link>
            <Link href="/contact" className={navLink}>Contact Us</Link>
          </div>

          {/* Right - Auth or Profile */}
          <div className="flex items-center space-x-4 relative">
            {currentUser ? (
              <div className="relative">
                <button
                  onClick={toggleDropdown}
                  className="focus:outline-none flex items-center"
                >
                  <img
                    src={currentUser.photoURL || '/assets/default-avatar.png'}
                    onError={(e) => (e.currentTarget.src = '/assets/default-avatar.png')}
                    alt="Profile"
                    className="w-9 h-9 rounded-full border-2 border-border-green hover:scale-105 transition"
                  />
                </button>

                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-44 bg-egg-white border border-border-green rounded-lg shadow-lg">
                    {isAdmin ? (
                      <>
                        <Link
                          href="/admin"
                          className="block px-4 py-2 text-sm text-primary-green hover:bg-light-green/30 transition"
                          onClick={() => setIsDropdownOpen(false)}
                        >
                          Admin Dashboard
                        </Link>
                        <Link
                          href="/profile"
                          className="block px-4 py-2 text-sm text-primary-green hover:bg-light-green/30 transition"
                          onClick={() => setIsDropdownOpen(false)}
                        >
                          Profile
                        </Link>
                      </>
                    ) : (
                      <>
                        <Link
                          href="/dashboard"
                          className="block px-4 py-2 text-sm text-primary-green hover:bg-light-green/30 transition"
                          onClick={() => setIsDropdownOpen(false)}
                        >
                          Dashboard
                        </Link>
                        <Link
                          href="/profile"
                          className="block px-4 py-2 text-sm text-primary-green hover:bg-light-green/30 transition"
                          onClick={() => setIsDropdownOpen(false)}
                        >
                          Profile
                        </Link>
                      </>
                    )}
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-primary-green hover:bg-light-green/30 transition"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link href="/signin" className={authLink.border}>Sign In</Link>
                <Link href="/signup" className={authLink.bg}>Sign Up</Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={toggleMenu}
              className="text-primary-green hover:text-accent-green p-2 rounded-md transition"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-egg-white border-t border-border-green mt-2 rounded-lg">
            <div className="px-4 py-3 space-y-2">
              <Link href="/" className={mobileLink} onClick={() => setIsMenuOpen(false)}>Home</Link>
              <Link href="/tourist-spots" className={mobileLink} onClick={() => setIsMenuOpen(false)}>Tourist Spots</Link>
              <Link href="/eat-and-stay" className={mobileLink} onClick={() => setIsMenuOpen(false)}>Eat & Stay</Link>
              <Link href="/blogs" className={mobileLink} onClick={() => setIsMenuOpen(false)}>Blogs</Link>
              <Link href="/contact" className={mobileLink} onClick={() => setIsMenuOpen(false)}>Contact Us</Link>

              <div className="border-t border-border-green pt-3">
                {currentUser ? (
                  <>
                    <div className="flex items-center space-x-2 px-2">
                      <img
                        src={currentUser.photoURL || '/assets/default-avatar.png'}
                        onError={(e) => (e.currentTarget.src = '/assets/default-avatar.png')}
                        alt="Profile"
                        className="w-6 h-6 rounded-full"
                      />
                      <span className="text-sm text-primary-green">
                        {currentUser.displayName || currentUser.email}
                      </span>
                    </div>

                    {isAdmin ? (
                      <>
                        <Link
                          href="/admin"
                          className={mobileLink}
                          onClick={() => setIsMenuOpen(false)}
                        >
                          Admin Dashboard
                        </Link>
                        <Link
                          href="/profile"
                          className={mobileLink}
                          onClick={() => setIsMenuOpen(false)}
                        >
                          Profile
                        </Link>
                      </>
                    ) : (
                      <>
                        <Link
                          href="/dashboard"
                          className={mobileLink}
                          onClick={() => setIsMenuOpen(false)}
                        >
                          Dashboard
                        </Link>
                        <Link
                          href="/profile"
                          className={mobileLink}
                          onClick={() => setIsMenuOpen(false)}
                        >
                          Profile
                        </Link>
                      </>
                    )}

                    <button
                      onClick={handleLogout}
                      className="w-full text-left mobile-link"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <Link href="/signin" className={mobileLink} onClick={() => setIsMenuOpen(false)}>Sign In</Link>
                    <Link href="/signup" className={`${mobileLink} bg`} onClick={() => setIsMenuOpen(false)}>Sign Up</Link>
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

/* --- Tailwind helper classes --- */
const navLink =
  'text-egg-white hover:text-light-green hover:bg-primary-green/90 px-3 py-2 rounded-md text-sm font-medium transition-all duration-300 hover:scale-105 transform hover:shadow-md';
const authLink = {
  border: 'text-primary-green border border-border-green hover:text-accent-green hover:border-accent-green px-3 py-2 rounded-md text-sm font-medium transition-all duration-300 hover:scale-105 transform hover:shadow-md',
  bg: 'bg-primary-green hover:bg-accent-green text-egg-white px-4 py-2 rounded-md text-sm font-medium transition-all duration-300 hover:scale-105 transform hover:shadow-lg hover:shadow-primary-green/25',
};
const mobileLink =
  'block text-primary-green hover:text-accent-green hover:bg-light-green px-3 py-2 rounded-md text-base font-medium transition-all duration-300 hover:scale-105 transform hover:shadow-md';
