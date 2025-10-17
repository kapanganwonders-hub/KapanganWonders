'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

export default function AccommodationsManagement() {
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
    <div className="flex min-h-screen">
      {/* Sidebar (theme matches site) */}
      <div className="w-60 bg-primary-green text-egg-white min-h-screen">
        <div className="p-4 font-semibold text-lg">
          <Link href="/admin" className="flex items-center">
            {/* ...icon... */}
            Dashboard
          </Link>
        </div>
        <nav className="mt-4">
          <Link href="/admin" className="block py-3 px-4 bg-primary-green/90 border-l-4 border-egg-white">Dashboard</Link>
          <Link href="/admin/accommodations" className="block py-3 px-4 hover:bg-primary-green/80">Accommodations</Link>
          <Link href="/admin/tourist-spots" className="block py-3 px-4 hover:bg-primary-green/80">Tourist Spots</Link>
          <Link href="/admin/restaurants" className="block py-3 px-4 hover:bg-primary-green/80">Restaurants</Link>
          <Link href="/admin/users" className="block py-3 px-4 hover:bg-primary-green/80">User Management</Link>
          <Link href="/admin/reports" className="block py-3 px-4 hover:bg-primary-green/80">Reports & Analytics</Link>
          <Link href="/admin/barangay-reports" className="block py-3 px-4 hover:bg-primary-green/80">Barangay Reports</Link>
          <Link href="/signout" className="block py-3 px-4 hover:bg-primary-green/80">Logout</Link>
        </nav>
      </div>

      {/* Main Content (existing content moved here) */}
      <div className="flex-1 bg-egg-white p-8">
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
        <button className="mt-6 px-4 py-2 bg-primary-green text-egg-white rounded hover:bg-accent-green">Add Accommodation</button>
      </div>
    </div>
  );
}
