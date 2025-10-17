'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function AccommodationsManagement() {
  const { currentUser, isAdmin } = useAuth();
  const router = useRouter();
  const [visits, setVisits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Redirect non-admins
  useEffect(() => {
    if (!currentUser || !isAdmin) {
      router.push('/');
      return;
    }
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
      </div>
    </div>
  );
}
