'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { logout } from '@/lib/auth';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Map, Calendar, Bell, LogOut, LayoutDashboard, Megaphone, Menu, X, Compass, MapPin, CalendarCheck, QrCode } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useMediaQuery } from 'react-responsive';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { currentUser, isAdmin, isBarangayAdmin, barangayAdminData } = useAuth();
  const [profileSrc, setProfileSrc] = useState('/assets/default-avatar.png');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const isMobile = useMediaQuery({ maxWidth: 1024 });

  // Redirect barangay admins to their proper dashboard
  useEffect(() => {
    if (typeof isBarangayAdmin !== 'undefined' && isBarangayAdmin) {
      router.replace('/barangay-admin');
    }
  }, [isBarangayAdmin, router]);

  useEffect(() => {
    // update profileSrc whenever the currentUser changes
    if (currentUser?.photoURL) {
      setProfileSrc(currentUser.photoURL);
    } else {
      setProfileSrc('/assets/default-avatar.png');
    }
  }, [currentUser]);

  const handleLogout = async () => {
    await logout();
    window.location.href = '/';
  };

  const handleImageError = () => {
    setProfileSrc('/assets/default-avatar.png');
  };

  const linkClass = (path: string) =>
    `flex items-center gap-3 p-3 rounded-lg transition-all text-sm lg:text-base ${
      pathname === path
        ? 'bg-green-50 text-green-700 font-medium border-l-4 border-green-500 pl-3'
        : 'text-gray-600 hover:text-green-600 hover:bg-green-50 pl-4'
    }`;

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-green-50 to-green-100">
      {/* Mobile Header */}
      <header className="lg:hidden bg-white shadow-sm p-4 flex items-center justify-between sticky top-0 z-10">
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 rounded-md text-gray-700 hover:bg-gray-100"
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
        <h1 className="text-lg font-semibold text-gray-800">Kapangan Wonders</h1>
        <div className="w-8"></div> {/* Spacer for alignment */}
      </header>

      <div className="flex flex-1 p-2 sm:p-4 lg:p-6">
        {/* Mobile Menu Overlay */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
            />
          )}
        </AnimatePresence>

        {/* Sidebar */}
        <AnimatePresence>
          {(!isMobile || isMobileMenuOpen) && (
            <motion.aside
              initial={isMobile ? { x: -320 } : { x: 0 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
              transition={{ type: 'tween', ease: 'easeInOut' }}
              className={`fixed lg:sticky top-0 left-0 h-screen lg:h-auto z-30 w-72 lg:w-1/5 bg-white shadow-xl lg:shadow-md rounded-r-2xl lg:rounded-2xl p-4 lg:p-5 flex flex-col`}
            >
          <div>
            {/* Profile Section */}
            <div className="flex flex-col items-center mb-6">
              <div className="relative w-16 h-16 lg:w-20 lg:h-20 mb-4">
                <Image
                  src={profileSrc}
                  alt="Profile"
                  fill
                  className="rounded-full border-2 border-green-300 object-cover"
                  onError={handleImageError}
                  sizes="(max-width: 1024px) 4rem, 5rem"
                />
              </div>
              <h2 className="font-semibold text-gray-800 text-center text-sm lg:text-base">
                {currentUser?.displayName || 'Guest'}
              </h2>
              {isAdmin ? (
                <div className="flex items-center gap-2 mt-1">
                  <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                    Administrator
                  </span>
                  <span className="text-sm text-gray-500">Kapangan Wonders</span>
                </div>
              ) : isBarangayAdmin ? (
                <div className="flex flex-col items-center gap-1 mt-1">
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                    Barangay Admin
                  </span>
                  <span className="text-sm text-gray-600 font-medium">
                    {barangayAdminData?.barangayName ||
                      barangayAdminData?.displayName ||
                      'Barangay'}
                  </span>
                </div>
              ) : (
                <p className="text-sm text-gray-500">Tourist</p>
              )}
            </div>

            {/* Navigation Sections */}
              <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase mb-2 px-1">Account</p>
                <ul className="space-y-2">
                  <li>
                    <Link href="/dashboard" className={linkClass('/dashboard')}>
                      <LayoutDashboard size={18} />
                      Overview
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/dashboard/profile"
                      className={linkClass('/dashboard/profile')}
                    >
                      <User size={18} />
                      Profile
                    </Link>
                  </li>
                </ul>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase mb-2 px-1">Travel</p>
                <ul className="space-y-2">
                  <li>
                    <Link
                      href="/dashboard/my-travels"
                      className={linkClass('/dashboard/my-travels')}
                    >
                      <Compass size={18} className="flex-shrink-0" />
                      <span>My Travels</span>
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/dashboard/places-visited"
                      className={linkClass('/dashboard/places-visited')}
                    >
                      <MapPin size={18} className="flex-shrink-0" />
                      <span>Places Visited</span>
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/dashboard/schedule-visit"
                      className={linkClass('/dashboard/schedule-visit')}
                    >
                      <CalendarCheck size={18} className="flex-shrink-0" />
                      <span>Schedule Visit</span>
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/dashboard/announcements"
                      className={linkClass('/dashboard/announcements')}
                    >
                      <Megaphone size={18} />
                      Announcements
                    </Link>
                  </li>

                  {/* NEW: My QR Code Page */}
                  <li>
                    <Link
                      href="/dashboard/my-qr-code"
                      className={linkClass('/dashboard/my-qr-code')}
                    >
                      <QrCode size={18} className="flex-shrink-0" />
                      <span>My QR Code</span>
                    </Link>
                  </li>
                </ul>
              </div>

              {isAdmin && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase mb-2 px-1">Admin</p>
                  <ul className="space-y-2">
                    <li>
                      <Link
                        href="/dashboard/admin/users"
                        className={linkClass('/dashboard/admin/users')}
                      >
                        <User size={18} />
                        Manage Users
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/dashboard/admin/places"
                        className={linkClass('/dashboard/admin/places')}
                      >
                        <Map size={18} />
                        Manage Places
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/dashboard/admin/announcements"
                        className={linkClass(
                          '/dashboard/admin/announcements'
                        )}
                      >
                        <Bell size={18} />
                        Manage Announcements
                      </Link>
                    </li>
                  </ul>
                </div>
              )}
            </div>
          </div>

          <div className="mt-auto">
            {isAdmin && (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm font-medium text-yellow-800">Admin Mode</p>
                <p className="text-xs text-yellow-600">
                  You have administrator privileges
                </p>
              </div>
            )}
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 bg-red-500 text-white py-2 rounded-lg hover:bg-red-600 transition"
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className={`flex-1 ${!isMobileMenuOpen || !isMobile ? 'ml-0 lg:ml-6' : 'ml-0'} transition-all duration-300 bg-white rounded-2xl shadow-md p-4 sm:p-6 overflow-y-auto w-full`}>
        {children}
      </main>
    </div>
  </div>
  );
}
