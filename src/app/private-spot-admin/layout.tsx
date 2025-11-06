'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  QrCode, 
  MapPin, 
  Megaphone, 
  FileText, 
  BarChart3,
  LogOut,
  User,
  CalendarCheck // 🆕 Added icon for Visits
} from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export default function PrivateSpotAdminLayout({ children }: { children: React.ReactNode }) {
  const { currentUser, isPrivateSpotAdmin, privateSpotAdminData } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

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
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 to-blue-100">
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
                src={currentUser?.photoURL || '/default-profile.png'}
                alt="Profile"
                width={80}
                height={80}
                className="rounded-full border-2 border-blue-300 mb-3"
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
                    <Link href="/private-spot-admin/profile" className={linkClass('/private-spot-admin/profile')}>
                      <User size={18}/>
                      Profile
                    </Link>
                  </li>
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
