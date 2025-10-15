'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function UsersManagement() {
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
      <h1 className="text-2xl font-bold mb-4">User Management</h1>
      <p className="mb-6 text-gray-700">View, edit, or remove users and assign roles.</p>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white rounded shadow">
          <thead>
            <tr>
              <th className="py-2 px-4 border-b">Name</th>
              <th className="py-2 px-4 border-b">Email</th>
              <th className="py-2 px-4 border-b">Role</th>
              <th className="py-2 px-4 border-b">Status</th>
              <th className="py-2 px-4 border-b">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="py-2 px-4 border-b">John Doe</td>
              <td className="py-2 px-4 border-b">john@example.com</td>
              <td className="py-2 px-4 border-b">Admin</td>
              <td className="py-2 px-4 border-b">Active</td>
              <td className="py-2 px-4 border-b">
                <button className="text-blue-600 hover:underline mr-2">Edit</button>
                <button className="text-red-600 hover:underline">Delete</button>
              </td>
            </tr>
            <tr>
              <td className="py-2 px-4 border-b">Jane Smith</td>
              <td className="py-2 px-4 border-b">jane@example.com</td>
              <td className="py-2 px-4 border-b">User</td>
              <td className="py-2 px-4 border-b">Inactive</td>
              <td className="py-2 px-4 border-b">
                <button className="text-blue-600 hover:underline mr-2">Edit</button>
                <button className="text-red-600 hover:underline">Delete</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <button className="mt-6 px-4 py-2 bg-green-700 text-white rounded hover:bg-green-800">Add User</button>
    </div>
  );
}
