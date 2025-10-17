'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

export default function ReportsManagement() {
  const { currentUser, isAdmin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (typeof isAdmin === 'undefined') return;
    if (!isAdmin) router.push('/');
  }, [isAdmin, router]);

  if (typeof isAdmin === 'undefined') {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!currentUser || !isAdmin) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <div className="w-60 bg-green-700 text-white min-h-screen">
        <div className="p-4 font-semibold text-lg">
          <Link href="/admin" className="flex items-center">Dashboard</Link>
        </div>
        <nav className="mt-4">
          <Link href="/admin" className="block py-3 px-4 bg-green-800 border-l-4 border-white">Dashboard</Link>
          <Link href="/admin/accommodations" className="block py-3 px-4 hover:bg-green-800">Accommodations</Link>
          <Link href="/admin/tourist-spots" className="block py-3 px-4 hover:bg-green-800">Tourist Spots</Link>
          <Link href="/admin/restaurants" className="block py-3 px-4 hover:bg-green-800">Restaurants</Link>
          <Link href="/admin/users" className="block py-3 px-4 hover:bg-green-800">User Management</Link>
          <Link href="/admin/reports" className="block py-3 px-4 hover:bg-green-800">Reports & Analytics</Link>
          <Link href="/admin/barangay-reports" className="block py-3 px-4 hover:bg-green-800">Barangay Reports</Link>
          <Link href="/signout" className="block py-3 px-4 hover:bg-green-800">Logout</Link>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 bg-egg-white p-8">
        <h1 className="text-2xl font-bold mb-4">Reports & Analytics</h1>
        <p className="mb-6 text-gray-700">View aggregated reports, charts, and analytics about visits, revenue, and content performance.</p>

        {/* ...placeholder content, replace with real charts/tables when available... */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold mb-2">Visits Over Time</h3>
            <div className="h-48 bg-gray-100 rounded flex items-center justify-center text-gray-400">Chart placeholder</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold mb-2">Top Tourist Spots</h3>
            <div className="h-48 bg-gray-100 rounded flex items-center justify-center text-gray-400">Chart / list placeholder</div>
          </div>
        </div>
      </div>
    </div>
  );
}
