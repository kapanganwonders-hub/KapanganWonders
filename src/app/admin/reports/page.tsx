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
    <div className="bg-egg-white p-8">
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
  );
}
