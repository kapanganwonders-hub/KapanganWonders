'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function ReportsManagement() {
  const { currentUser, isAdmin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!currentUser || !isAdmin) {
      router.push('/');
    }
  }, [currentUser, isAdmin, router]);

  if (!currentUser || !isAdmin) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Reports & Analytics</h1>
      <p className="mb-6 text-gray-700">View analytics and generate reports on tourism activities.</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-2">Total Visits</h2>
          <p className="text-3xl font-bold text-gray-800">1,254</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-2">Unique Tourists</h2>
          <p className="text-3xl font-bold text-gray-800">842</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-2">Total Revenue</h2>
          <p className="text-3xl font-bold text-gray-800">₱100,134</p>
        </div>
      </div>
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Recent Reports</h2>
        <ul className="list-disc pl-6 text-gray-700">
          <li>Monthly tourist arrivals - June 2024</li>
          <li>Revenue breakdown by barangay</li>
          <li>Pending tourist spot approvals</li>
        </ul>
      </div>
    </div>
  );
}
