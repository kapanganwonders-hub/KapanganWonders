'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  QrCode, 
  MapPin, 
  Megaphone, 
  FileText, 
  BarChart3,
  LogOut,
  User,
  CalendarCheck,
  Menu,
  X
} from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export default function PrivateSpotAdminLayout({ children }: { children: React.ReactNode }) {
  const { currentUser, isPrivateSpotAdmin, privateSpotAdminData } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    if (typeof isPrivateSpotAdmin === 'undefined') return;
    if (!isPrivateSpotAdmin) {
      router.push('/signin');
    }
  }, [isPrivateSpotAdmin, router]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const linkClass = (path: string) => {
    const isActive = pathname === path;
    return `flex items-center gap-2 p-2 rounded-md transition ${
      isActive
        ? 'bg-blue-100 text-blue-700 font-semibold'
        : 'text-gray-700 hover:bg-gray-100'
    }`;
  };

  if (typeof isPrivateSpotAdmin === 'undefined' || !currentUser || !isPrivateSpotAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 to-blue-100">
      {/* Mobile Header */}
      <header className="lg:hidden bg-white shadow-sm p-4 flex items-center justify-between">
        <button 
          onClick={() => setIsSidebarOpen(true)}
          className="p-2 rounded-md text-gray-700 hover:bg-gray-100"
          aria-label="Open menu"
        >
          <Menu size={24} />
        </button>
        <h1 className="text-lg font-semibold text-gray-800">
          {privateSpotAdminData?.businessName || 'Admin Panel'}
        </h1>
        <div className="w-8"></div> {/* Spacer for balance */}
      </header>

      <div className="flex flex-1 p-2 sm:p-4 lg:p-6">
        {/* Mobile Sidebar Overlay */}
        <AnimatePresence>
          {isSidebarOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsSidebarOpen(false)}
                className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
              />
              <motion.aside
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'tween' }}
                className="fixed inset-y-0 left-0 w-64 bg-white shadow-xl z-30 overflow-y-auto lg:hidden"
              >
          <div className="relative h-full">
            <button 
              onClick={() => setIsSidebarOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-100 lg:hidden"
              aria-label="Close menu"
            >
              <X size={20} />
            </button>
            <div className="flex flex-col items-center mb-6 pt-6 px-4">
              <Image
                src={currentUser?.photoURL || '/default-profile.png'}
                alt="Profile"
                width={80}
                height={80}
                className="rounded-full border-2 border-blue-300 mb-3"
                priority
              />
              <h2 className="font-semibold text-gray-800 text-center text-sm sm:text-base">
                {privateSpotAdminData?.displayName || currentUser?.displayName || 'Private Spot Admin'}
              </h2>
              <div className="flex flex-col items-center gap-1 mt-1">
                <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                  Private Spot Owner
                </span>
                {privateSpotAdminData?.businessName && (
                  <span className="text-xs text-gray-500 text-center">
                    {privateSpotAdminData.businessName}
                  </span>
                )}
                {privateSpotAdminData?.barangay && (
                  <span className="text-xs text-gray-500 text-center">
                    📍 {privateSpotAdminData.barangay}
                  </span>
                )}
                {privateSpotAdminData?.privateSpotName && (
                  <span className="text-xs text-gray-500 text-center">
                    🏢 {privateSpotAdminData.privateSpotName}
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-6">
              {/* Management Section */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Management</p>
                <ul className="space-y-2">
                  <li>
                    <Link href="/private-spot-admin" className={linkClass('/private-spot-admin')}>
                      <LayoutDashboard size={18}/>
                      Dashboard
                    </Link>
                  </li>
                  <li>
                    <Link href="/private-spot-admin/scan" className={linkClass('/private-spot-admin/scan-qr')}>
                      <QrCode size={18}/>
                      Scan QR Code
                    </Link>
                  </li>
                  <li>
                    <Link href="/private-spot-admin/tourist-spots" className={linkClass('/private-spot-admin/tourist-spots')}>
                      <MapPin size={18}/>
                      Tourist Spot
                    </Link>
                  </li>
                  <li>
                    <Link href="/private-spot-admin/announcements" className={linkClass('/private-spot-admin/announcements')}>
                      <Megaphone size={18}/>
                      Announcements
                    </Link>
                  </li>
                  <li>
                    <Link href="/private-spot-admin/blogs" className={linkClass('/private-spot-admin/blogs')}>
                      <FileText size={18}/>
                      Blogs
                    </Link>
                  </li>

                  {/* 🆕 Added Visits Link */}
                  <li>
                    <Link href="/private-spot-admin/visits" className={linkClass('/private-spot-admin/visits')}>
                      <CalendarCheck size={18}/>
                      Visits
                    </Link>
                  </li>

                  <li>
                    <Link href="/private-spot-admin/reports" className={linkClass('/private-spot-admin/reports')}>
                      <BarChart3 size={18}/>
                      Reports
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Account Section */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Account</p>
                <ul className="space-y-2">
                  <li>
                    <button 
                      onClick={handleLogout}
                      className="flex items-center gap-2 p-2 w-full text-left text-gray-700 hover:text-red-600 hover:bg-red-50 rounded-md transition"
                    >
                      <LogOut size={18} className="text-red-500"/>
                      <span>Logout</span>
                    </button>
                  </li>
                </ul>
              </div>
            </div>
          </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* Desktop Sidebar */}
        <motion.aside
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="hidden lg:block w-64 bg-white rounded-2xl shadow-md p-5 flex-shrink-0 h-[calc(100vh-3rem)] sticky top-6 overflow-y-auto"
        >
          <div className="flex flex-col items-center mb-6">
            <Image
              src={currentUser?.photoURL || '/default-profile.png'}
              alt="Profile"
              width={80}
              height={80}
              className="rounded-full border-2 border-blue-300 mb-3"
              priority
            />
            <h2 className="font-semibold text-gray-800 text-center">
              {privateSpotAdminData?.displayName || currentUser?.displayName || 'Private Spot Admin'}
            </h2>
            <div className="flex flex-col items-center gap-1 mt-1">
              <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                Private Spot Owner
              </span>
              {privateSpotAdminData?.businessName && (
                <span className="text-xs text-gray-500 text-center">
                  {privateSpotAdminData.businessName}
                </span>
              )}
              {privateSpotAdminData?.barangay && (
                <span className="text-xs text-gray-500 text-center">
                  📍 {privateSpotAdminData.barangay}
                </span>
              )}
              {privateSpotAdminData?.privateSpotName && (
                <span className="text-xs text-gray-500 text-center">
                  🏢 {privateSpotAdminData.privateSpotName}
                </span>
              )}
            </div>
          </div>

          <div className="space-y-6">
            {/* Management Section */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Management</p>
              <ul className="space-y-2">
                <li>
                  <Link href="/private-spot-admin" className={linkClass('/private-spot-admin')}>
                    <LayoutDashboard size={18}/>
                    Dashboard
                  </Link>
                </li>
                <li>
                  <Link href="/private-spot-admin/scan" className={linkClass('/private-spot-admin/scan-qr')}>
                    <QrCode size={18}/>
                    Scan QR Code
                  </Link>
                </li>
                <li>
                  <Link href="/private-spot-admin/tourist-spots" className={linkClass('/private-spot-admin/tourist-spots')}>
                    <MapPin size={18}/>
                    Tourist Spots
                  </Link>
                </li>
                <li>
                  <Link href="/private-spot-admin/announcements" className={linkClass('/private-spot-admin/announcements')}>
                    <Megaphone size={18}/>
                    Announcements
                  </Link>
                </li>
                <li>
                  <Link href="/private-spot-admin/blogs" className={linkClass('/private-spot-admin/blogs')}>
                    <FileText size={18}/>
                    Blogs
                  </Link>
                </li>
                <li>
                  <Link href="/private-spot-admin/visits" className={linkClass('/private-spot-admin/visits')}>
                    <CalendarCheck size={18}/>
                    Visits
                  </Link>
                </li>
                <li>
                  <Link href="/private-spot-admin/reports" className={linkClass('/private-spot-admin/reports')}>
                    <BarChart3 size={18}/>
                    Reports
                  </Link>
                </li>
              </ul>
            </div>

            {/* Account Section */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Account</p>
              <ul className="space-y-2">
                <li>
                  <button 
                    onClick={handleLogout}
                    className="flex items-center gap-2 p-2 w-full text-left text-gray-700 hover:text-red-600 hover:bg-red-50 rounded-md transition"
                  >
                    <LogOut size={18} className="text-red-500"/>
                    <span>Logout</span>
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </motion.aside>

        {/* Main Content */}
        <motion.main
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex-1 lg:ml-6 bg-white rounded-2xl shadow-md p-4 sm:p-6 overflow-auto w-full min-h-[calc(100vh-2rem)] lg:min-h-[calc(100vh-3rem)]"
        >
          {children}
        </motion.main>
      </div>
    </div>
  );
}
