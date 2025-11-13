'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { logout } from '@/lib/auth';
import { onAuthStateChanged } from 'firebase/auth';
import { motion } from 'framer-motion';
import { User, Map, Calendar, Bell, LogOut, LayoutDashboard, Users, MapPin, FileText } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import Image from 'next/image';
import Link from 'next/link';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const { currentUser, isAdmin } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

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

  if (typeof isAdmin === "undefined" || !currentUser || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-green-50 to-green-100">
      <div className="flex flex-1 p-6">
        {/* Sidebar */}
        <motion.aside
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="w-1/5 bg-white rounded-2xl shadow-md p-5 flex flex-col justify-between"
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

        {/* Main Content */}
        <motion.main
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex-1 ml-6 bg-white rounded-2xl shadow-md p-6 overflow-auto"
        >
          {children}
        </motion.main>
      </div>
    </div>
  );
}
