'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function AccommodationsManagement() {
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
      <h1 className="text-2xl font-bold mb-4">Accommodations Management</h1>
      <p className="mb-6 text-gray-700">View, add, edit, or remove accommodations available for tourists.</p>
      {/* Example Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white rounded shadow">
          <thead>
            <tr>
              <th className="py-2 px-4 border-b">Name</th>
              <th className="py-2 px-4 border-b">Type</th>
              <th className="py-2 px-4 border-b">Location</th>
              <th className="py-2 px-4 border-b">Status</th>
              <th className="py-2 px-4 border-b">Actions</th>
            </tr>
          </thead>
          <tbody>
            {/* Placeholder rows */}
            <tr>
              <td className="py-2 px-4 border-b">Mountain View Inn</td>
              <td className="py-2 px-4 border-b">Hotel</td>
              <td className="py-2 px-4 border-b">Central Kapangan</td>
              <td className="py-2 px-4 border-b">Active</td>
              <td className="py-2 px-4 border-b">
                <button className="text-blue-600 hover:underline mr-2">Edit</button>
                <button className="text-red-600 hover:underline">Delete</button>
              </td>
            </tr>
            <tr>
              <td className="py-2 px-4 border-b">Riverfront Lodge</td>
              <td className="py-2 px-4 border-b">Lodge</td>
              <td className="py-2 px-4 border-b">Barangay Ambongdolan</td>
              <td className="py-2 px-4 border-b">Pending</td>
              <td className="py-2 px-4 border-b">
                <button className="text-blue-600 hover:underline mr-2">Edit</button>
                <button className="text-red-600 hover:underline">Delete</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <button className="mt-6 px-4 py-2 bg-green-700 text-white rounded hover:bg-green-800">Add Accommodation</button>
    </div>
  );
}
