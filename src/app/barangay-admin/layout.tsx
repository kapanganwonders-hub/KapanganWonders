'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { logout } from '@/lib/auth';
import { onAuthStateChanged } from 'firebase/auth';
import { motion } from 'framer-motion';
import { User, LogOut, LayoutDashboard, MapPin, FileText, QrCode, Megaphone, BookOpen } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import Image from 'next/image';
import Link from 'next/link';

export default function BarangayAdminLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const { currentUser, isBarangayAdmin, barangayAdminData } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => setUser(user));
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (typeof isBarangayAdmin === "undefined") return;
    if (!isBarangayAdmin) {
      router.push("/");
    }
  }, [isBarangayAdmin, router]);

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

  if (typeof isBarangayAdmin === "undefined" || !currentUser || !isBarangayAdmin) {
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
              <h2 className="font-semibold text-gray-800">{user?.displayName || 'Barangay Admin'}</h2>
              <div className="flex flex-col items-center gap-1 mt-1">
                <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                  Barangay Admin
                </span>
                <span className="text-sm text-gray-600 font-medium">
                  {barangayAdminData?.barangayName || 'Barangay'}
                </span>
              </div>
            </div>

            <div className="space-y-6">
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
                    <Link href="/barangay-admin/scan-qr" className={linkClass('/barangay-admin/scan-qr')}>
                      <QrCode size={18}/>
                      Scan QR Code
                    </Link>
                  </li>
                </ul>
              </div>

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
                </ul>
              </div>

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
          <div className="mt-auto">
            <button 
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 bg-red-500 text-white py-2 rounded-lg hover:bg-red-600 transition"
            >
              <LogOut size={18}/>
              Logout
            </button>
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
