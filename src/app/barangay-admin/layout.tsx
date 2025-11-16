'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { logout } from '@/lib/auth';
import { onAuthStateChanged } from 'firebase/auth';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, LogOut, LayoutDashboard, MapPin, FileText, QrCode, 
  Megaphone, BookOpen, CalendarCheck, Menu, X
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import Image from 'next/image';
import Link from 'next/link';

export default function BarangayAdminLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { currentUser, isBarangayAdmin, barangayAdminData } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => setUser(user));
    return () => unsubscribe();
  }, []);

  // ✅ Fixed redirect logic
  useEffect(() => {
    if (isBarangayAdmin === false) {
      router.replace('/');
    }
  }, [isBarangayAdmin, router]);

  const handleLogout = async () => {
    await logout();
    window.location.href = '/';
  };

  const linkClass = (path: string) =>
    `flex items-center gap-3 p-2.5 rounded-lg transition text-sm lg:text-base ${
      pathname === path
        ? 'bg-green-100 text-green-700 font-semibold'
        : 'text-gray-700 hover:text-green-600 hover:bg-green-50'
    }`;

  if (isBarangayAdmin === undefined || !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-green-100">
        <div className="animate-pulse">Checking permissions...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-green-50 to-green-100">
      {/* Mobile Header */}
      <header className="lg:hidden bg-white shadow-sm p-4 flex items-center justify-between">
        <div className="flex items-center">
          <Image
            src="/logo.png"
            alt="Logo"
            width={32}
            height={32}
            className="mr-2"
          />
          <h1 className="font-semibold text-gray-800">Barangay Admin</h1>
        </div>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 rounded-md text-gray-600 hover:bg-gray-100"
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </header>

      <div className="flex flex-1 p-2 sm:p-4 lg:p-6">
        {/* Sidebar */}
        <AnimatePresence>
          {(isMobileMenuOpen || (typeof window !== 'undefined' && window.innerWidth >= 1024)) && (
            <motion.aside
              key="sidebar"
              initial={{ x: -320, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -320, opacity: 0 }}
              transition={{ type: 'tween', ease: 'easeInOut' }}
              className="fixed lg:sticky top-0 left-0 z-40 h-screen lg:h-[calc(100vh-3rem)] w-72 lg:w-1/4 xl:w-1/5 bg-white lg:rounded-2xl shadow-lg lg:shadow-md p-4 lg:p-5 flex flex-col justify-between overflow-y-auto"
            >
              <div>
                <div className="flex justify-between items-center mb-6">
                  <div className="flex flex-col items-center w-full">
                    <Image
                      src={user?.photoURL || '/default-profile.png'}
                      alt="Profile"
                      width={80}
                      height={80}
                      className="rounded-full border-2 border-green-300 mb-3"
                    />
                    <h2 className="font-semibold text-gray-800">{user?.displayName || 'Barangay Admin'}</h2>
                    <div className="flex flex-col items-center gap-1 mt-1">
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                        Barangay Admin
                      </span>
                      <span className="text-sm text-gray-600 font-medium text-center">
                        {barangayAdminData?.barangay || barangayAdminData?.barangayName || 'Barangay'}
                      </span>
                    </div>
                  </div>
                  <button 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="lg:hidden absolute top-4 right-4 p-1 rounded-full hover:bg-gray-100"
                    aria-label="Close menu"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Main Section */}
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Main</p>
                    <ul className="space-y-2">
                      <li>
                        <Link href="/barangay-admin" className={linkClass('/barangay-admin')}>
                          <LayoutDashboard size={18}/>
                          Dashboard
                        </Link>
                      </li>
                      <li>
                        <Link href="/barangay-admin/scan" className={linkClass('/barangay-admin/scan')}>
                          <QrCode size={18}/>
                          Scan QR Code
                        </Link>
                      </li>
                    </ul>
                  </div>

                  {/* Management Section */}
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Management</p>
                    <ul className="space-y-2">
                      <li>
                        <Link href="/barangay-admin/tourist-spots" className={linkClass('/barangay-admin/tourist-spots')}>
                          <MapPin size={18}/>
                          Tourist Spots
                        </Link>
                      </li>
                      <li>
                        <Link href="/barangay-admin/announcements" className={linkClass('/barangay-admin/announcements')}>
                          <Megaphone size={18}/>
                          Announcements
                        </Link>
                      </li>
                      <li>
                        <Link href="/barangay-admin/blogs" className={linkClass('/barangay-admin/blogs')}>
                          <BookOpen size={18}/>
                          Blogs
                        </Link>
                      </li>
                      <li>
                        <Link href="/barangay-admin/visits" className={linkClass('/barangay-admin/visits')}>
                          <CalendarCheck size={18}/>
                          Visits
                        </Link>
                      </li>
                    </ul>
                  </div>

                  {/* Reports Section */}
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Reports</p>
                    <ul className="space-y-2">
                      <li>
                        <Link href="/barangay-admin/reports" className={linkClass('/barangay-admin/reports')}>
                          <FileText size={18}/>
                          Barangay Reports
                        </Link>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Logout Button */}
              <div className="mt-6">
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 bg-red-500 text-white py-2 rounded-lg hover:bg-red-600 transition"
                >
                  <LogOut size={18}/>
                  Logout
                </button>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Overlay for mobile */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 z-30 bg-black/50 lg:hidden"
              aria-hidden="true"
            />
          )}
        </AnimatePresence>

        {/* Main Content */}
        <motion.main
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex-1 w-full lg:ml-6 bg-white rounded-2xl shadow-md p-4 sm:p-6 overflow-auto"
        >
          {children}
        </motion.main>
      </div>
    </div>
  );
}
