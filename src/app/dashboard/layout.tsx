'use client';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { logout } from '@/lib/auth';
import { onAuthStateChanged } from 'firebase/auth';
import { motion } from 'framer-motion';
import { User, Map, Calendar, Bell, LogOut, LayoutDashboard } from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [profileSrc, setProfileSrc] = useState('/assets/default-avatar.png');
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (user?.photoURL) {
        setProfileSrc(user.photoURL);
      } else {
        setProfileSrc('/assets/default-avatar.png');
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await logout();
    window.location.href = '/';
  };

  const handleImageError = () => {
    setProfileSrc('/assets/default-avatar.png');
  };

  const linkClass = (path: string) =>
    `flex items-center gap-2 p-2 rounded-md transition ${
      pathname === path
        ? 'bg-green-100 text-green-700 font-semibold'
        : 'text-gray-700 hover:text-green-600 hover:bg-green-50'
    }`;

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
            {/* Profile Section */}
            <div className="flex flex-col items-center mb-6">
              <div className="relative w-20 h-20 mb-3">
                <Image
                  src={profileSrc}
                  alt="Profile"
                  fill
                  className="rounded-full border-2 border-green-300 object-cover"
                  onError={handleImageError}
                />
              </div>
              <h2 className="font-semibold text-gray-800">
                {user?.displayName || 'Guest'}
              </h2>
              <p className="text-sm text-gray-500">Tourist</p>
            </div>

            {/* Navigation Sections */}
            <div className="space-y-6">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Account</p>
                <ul className="space-y-2">
                  <li>
                    <Link href="/dashboard" className={linkClass('/dashboard')}>
                      <LayoutDashboard size={18} />Overview
                    </Link>
                  </li>
                  <li>
                    <Link href="/dashboard/profile" className={linkClass('/dashboard/profile')}>
                      <User size={18} />Profile
                    </Link>
                  </li>
                </ul>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Travel</p>
                <ul className="space-y-2">
                  <li>
                    <Link href="/dashboard/my-travels" className={linkClass('/dashboard/my-travels')}>
                      <Map size={18} />My Travels
                    </Link>
                  </li>
                  <li>
                    <Link href="/dashboard/places-visited" className={linkClass('/dashboard/places-visited')}>
                      <Map size={18} />Places Visited
                    </Link>
                  </li>
                  <li>
                    <Link href="/dashboard/schedule-visit" className={linkClass('/dashboard/schedule-visit')}>
                      <Calendar size={18} />Schedule Visit
                    </Link>
                  </li>
                </ul>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Updates</p>
                <ul className="space-y-2">
                  <li>
                    <Link
                      href="#"
                      className="flex items-center gap-2 text-gray-700 hover:text-green-600"
                    >
                      <Bell size={18} />Announcements
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 mt-6 bg-red-500 text-white py-2 rounded-lg hover:bg-red-600 transition"
          >
            <LogOut size={18} />Logout
          </button>
        </motion.aside>

        {/* Main Dashboard */}
        <main className="flex-1 bg-white rounded-2xl shadow-md ml-6 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
