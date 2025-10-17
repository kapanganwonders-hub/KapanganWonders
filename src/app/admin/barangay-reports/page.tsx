'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

export default function BarangayReportsManagement() {
  const { currentUser, isAdmin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // wait until isAdmin is resolved
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
      <h1 className="text-2xl font-bold mb-4">Barangay Reports Management</h1>
      <p className="mb-6 text-gray-700">Review and manage reports submitted by barangay admins.</p>

      <div className="overflow-x-auto bg-white rounded shadow p-4">
        <table className="min-w-full">
          <thead>
            <tr>
              <th className="py-2 px-4 border-b text-left">Barangay</th>
              <th className="py-2 px-4 border-b text-left">Report Title</th>
              <th className="py-2 px-4 border-b text-left">Date Submitted</th>
              <th className="py-2 px-4 border-b text-left">Status</th>
              <th className="py-2 px-4 border-b text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="py-2 px-4 border-b">Ambongdolan</td>
              <td className="py-2 px-4 border-b">Tourist Spot Maintenance</td>
              <td className="py-2 px-4 border-b">2024-06-10</td>
              <td className="py-2 px-4 border-b">Pending</td>
              <td className="py-2 px-4 border-b">
                <button className="text-blue-600 hover:underline mr-2">View</button>
                <button className="text-green-600 hover:underline mr-2">Approve</button>
                <button className="text-red-600 hover:underline">Reject</button>
              </td>
            </tr>
            <tr>
              <td className="py-2 px-4 border-b">Tawang</td>
              <td className="py-2 px-4 border-b">Event Request</td>
              <td className="py-2 px-4 border-b">2024-06-09</td>
              <td className="py-2 px-4 border-b">Approved</td>
              <td className="py-2 px-4 border-b">
                <button className="text-blue-600 hover:underline mr-2">View</button>
                <button className="text-red-600 hover:underline">Reject</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
