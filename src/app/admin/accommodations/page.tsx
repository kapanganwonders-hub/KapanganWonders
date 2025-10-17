'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

export default function AccommodationsManagement() {
  const { currentUser, isAdmin } = useAuth();
  const router = useRouter();
  const [visits, setVisits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Redirect non-admins
  useEffect(() => {
    if (typeof isAdmin === 'undefined') return;
    if (!isAdmin) {
      router.push('/');
      return;
    }
<<<<<<< HEAD
    fetchVisits();
  }, [currentUser, isAdmin]);

  // Fetch all visits
  const fetchVisits = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'visits'));
      const data = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));
      setVisits(data);
    } catch (error) {
      console.error('Error fetching visits:', error);
    } finally {
      setLoading(false);
    }
  };

  // Approve a visit
  const handleApprove = async (id: string) => {
    try {
      await updateDoc(doc(db, 'visits', id), { status: 'Approved' });
      setVisits((prev) =>
        prev.map((visit) =>
          visit.id === id ? { ...visit, status: 'Approved' } : visit
        )
      );
      alert('Visit approved!');
    } catch (error) {
      console.error('Error approving visit:', error);
    }
  };

  // Delete a visit
  const handleReject = async (id: string) => {
    const confirmDelete = confirm('Are you sure you want to delete this visit?');
    if (!confirmDelete) return;

    try {
      await deleteDoc(doc(db, 'visits', id));
      setVisits((prev) => prev.filter((visit) => visit.id !== id));
      alert('Visit deleted successfully.');
    } catch (error) {
      console.error('Error deleting visit:', error);
    }
  };
=======
  }, [isAdmin, router]);

  if (typeof isAdmin === 'undefined') {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }
>>>>>>> 7834527e0fc9202c4264cd84694d0d0c48ba8922

  if (!currentUser || !isAdmin) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen text-gray-600">
        Loading scheduled visits...
      </div>
    );
  }

  return (
<<<<<<< HEAD
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4 text-green-700">
        Accommodations & Visit Management
      </h1>
      <p className="mb-6 text-gray-700">
        Manage tourist visits and approve or remove schedules.
      </p>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white rounded shadow-md">
          <thead>
            <tr className="bg-green-100 text-left">
              <th className="py-2 px-4 border-b">Tourist Name</th>
              <th className="py-2 px-4 border-b">Barangays</th>
              <th className="py-2 px-4 border-b">Spots</th>
              <th className="py-2 px-4 border-b">Date</th>
              <th className="py-2 px-4 border-b">Status</th>
              <th className="py-2 px-4 border-b">Actions</th>
            </tr>
          </thead>
          <tbody>
            {visits.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-6 text-gray-500">
                  No scheduled visits yet.
                </td>
              </tr>
            ) : (
              visits.map((visit) => (
                <tr key={visit.id} className="hover:bg-gray-50">
                  <td className="py-2 px-4 border-b">{visit.fullName}</td>
                  <td className="py-2 px-4 border-b">
                    {visit.barangays?.join(', ') || 'N/A'}
                  </td>
                  <td className="py-2 px-4 border-b">
                    {visit.spots?.join(', ') || 'N/A'}
                  </td>
                  <td className="py-2 px-4 border-b">{visit.date}</td>
                  <td
                    className={`py-2 px-4 border-b font-medium ${
                      visit.status === 'Approved'
                        ? 'text-green-600'
                        : visit.status === 'Pending'
                        ? 'text-yellow-600'
                        : 'text-gray-500'
                    }`}
                  >
                    {visit.status || 'Pending'}
                  </td>
                  <td className="py-2 px-4 border-b space-x-2">
                    {visit.status !== 'Approved' && (
                      <button
                        onClick={() => handleApprove(visit.id)}
                        className="text-green-700 hover:underline font-medium"
                      >
                        Approve
                      </button>
                    )}
                    <button
                      onClick={() => handleReject(visit.id)}
                      className="text-red-600 hover:underline font-medium"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
=======
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
>>>>>>> 7834527e0fc9202c4264cd84694d0d0c48ba8922
      </div>
    </div>
  );
}
