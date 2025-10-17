'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

export default function RestaurantsManagement() {
  const { currentUser, isAdmin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (typeof isAdmin === 'undefined') return;
    if (!isAdmin) {
      router.push('/');
    }
  }, [isAdmin, router]);

  if (typeof isAdmin === 'undefined') {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!currentUser || !isAdmin) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="bg-egg-white p-8">
      <h1 className="text-2xl font-bold mb-4">Restaurants Management</h1>
      <p className="mb-6 text-gray-700">Manage restaurants, approve new listings, and update restaurant details.</p>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white rounded shadow">
          <thead>
            <tr>
              <th className="py-2 px-4 border-b">Name</th>
              <th className="py-2 px-4 border-b">Type</th>
              <th className="py-2 px-4 border-b">Barangay</th>
              <th className="py-2 px-4 border-b">Status</th>
              <th className="py-2 px-4 border-b">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="py-2 px-4 border-b">Kapangan Eatery</td>
              <td className="py-2 px-4 border-b">Cafe</td>
              <td className="py-2 px-4 border-b">Central</td>
              <td className="py-2 px-4 border-b">Active</td>
              <td className="py-2 px-4 border-b">
                <button className="text-blue-600 hover:underline mr-2">Edit</button>
                <button className="text-red-600 hover:underline">Delete</button>
              </td>
            </tr>
            <tr>
              <td className="py-2 px-4 border-b">Mountain Diner</td>
              <td className="py-2 px-4 border-b">Diner</td>
              <td className="py-2 px-4 border-b">Tawang</td>
              <td className="py-2 px-4 border-b">Pending</td>
              <td className="py-2 px-4 border-b">
                <button className="text-blue-600 hover:underline mr-2">Edit</button>
                <button className="text-red-600 hover:underline">Delete</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <button className="mt-6 px-4 py-2 bg-primary-green text-egg-white rounded hover:bg-accent-green">Add Restaurant</button>
    </div>
  );
}
