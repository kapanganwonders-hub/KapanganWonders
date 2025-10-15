'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function BarangayReportsManagement() {
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
      <h1 className="text-2xl font-bold mb-4">Barangay Reports Management</h1>
      <p className="mb-6 text-gray-700">Review and manage reports submitted by barangay admins.</p>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white rounded shadow">
          <thead>
            <tr>
              <th className="py-2 px-4 border-b">Barangay</th>
              <th className="py-2 px-4 border-b">Report Title</th>
              <th className="py-2 px-4 border-b">Date Submitted</th>
              <th className="py-2 px-4 border-b">Status</th>
              <th className="py-2 px-4 border-b">Actions</th>
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
