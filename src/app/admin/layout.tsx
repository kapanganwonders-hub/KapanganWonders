'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { logout } from '@/lib/auth';
import { onAuthStateChanged } from 'firebase/auth';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Map, Calendar, Bell, LogOut, LayoutDashboard, Users, Menu, X, FileText } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import Image from 'next/image';
import Link from 'next/link';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { currentUser, isAdmin } = useAuth();
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

  useEffect(() => {
    if (typeof isAdmin === "undefined") return;
    if (!isAdmin) {
      router.push("/");
    }
  }, [isAdmin, router]);

  const handleLogout = async () => {
    await logout();
    window.location.href = '/';
  };

  const linkClass = (path: string) =>
    `flex items-center gap-2 p-2 rounded-md transition ${
      pathname === path
        ? 'bg-green-100 text-green-700 font-semibold'
        : 'text-gray-700 hover:text-green-600 hover:bg-green-50'
    }`;

  if (typeof isAdmin === "undefined") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!currentUser || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white p-6 rounded-lg shadow-md max-w-md w-full text-center">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Access Denied</h2>
          <p className="text-gray-600 mb-6">You don't have permission to access this page.</p>
          <button
            onClick={() => router.push('/')}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-green-50 to-green-100">
      {/* Mobile Header */}
      <header className="lg:hidden bg-white shadow-sm p-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-md text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          <h1 className="ml-2 text-xl font-semibold text-gray-800">Admin Panel</h1>
        </div>
        <div className="flex items-center
        ">
          {user?.photoURL && (
            <Image
              src={user.photoURL}
              alt="Profile"
              width={32}
              height={32}
              className="rounded-full border-2 border-green-300"
            />
          )}
        </div>
      </header>

      <div className="flex flex-1 p-2 sm:p-4 lg:p-6">
        {/* Mobile Sidebar Overlay */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
                onClick={() => setIsMobileMenuOpen(false)}
              />
            </>
          )}
        </AnimatePresence>

        {/* Sidebar */}
        <AnimatePresence>
          {(isMobileMenuOpen || window.innerWidth >= 1024) && (
            <motion.aside
              initial={{ x: -300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -300, opacity: 0 }}
              transition={{ type: 'tween', duration: 0.3 }}
              className={`fixed lg:sticky top-0 left-0 h-screen lg:h-auto w-64 lg:w-1/5 bg-white shadow-lg lg:rounded-2xl p-5 flex flex-col justify-between z-30 lg:z-0`}
            >
          <div>
            <div className="flex flex-col items-center mb-6">
              <Image
                src={user?.photoURL || '/default-profile.png'}
                alt="Profile"
                width={80}
                height={80}
                className="rounded-full border-2 border-green-300 mb-3"
              />
              <h2 className="font-semibold text-gray-800">{user?.displayName || 'Admin'}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                  Administrator
                </span>
                <span className="text-sm text-gray-500">Kapangan Wonders</span>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Management</p>
                <ul className="space-y-2">
                  <li><Link href="/admin" className={linkClass('/admin')}><LayoutDashboard size={18}/>Dashboard</Link></li>
                  <li><Link href="/admin/users" className={linkClass('/admin/users')}><Users size={18}/>Manage Users</Link></li>
                  <li><Link href="/admin/visits" className={linkClass('/admin/visits')}><Map size={18}/>Visits</Link></li>
                  <li><Link href="/admin/announcements" className={linkClass('/admin/announcements')}><Bell size={18}/>Announcements</Link></li>
                </ul>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Reports</p>
                <ul className="space-y-2">
                  <li><Link href="/admin/reports" className={linkClass('/admin/reports')}><FileText size={18}/>General Reports</Link></li>
                </ul>
              </div>

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
          )}
        </AnimatePresence>

        {/* Main Content */}
        <motion.main
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={`flex-1 lg:ml-6 bg-white rounded-2xl shadow-md p-4 sm:p-6 overflow-auto w-full ${
            isMobileMenuOpen ? 'opacity-50 lg:opacity-100' : ''
          }`}
        >
          {children}
        </motion.main>
      </div>
    </div>
  );
}
