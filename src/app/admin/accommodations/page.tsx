'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

export default function AccommodationsManagement() {
  const { currentUser, isAdmin } = useAuth();
  const router = useRouter();
  const [accommodations, setAccommodations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Redirect non-admins and fetch data
  useEffect(() => {
    if (typeof isAdmin === 'undefined') return;
    if (!isAdmin) {
      router.push('/');
      return;
    }
    fetchAccommodations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  const fetchAccommodations = async () => {
    try {
      const snap = await getDocs(collection(db, 'accommodations'));
      setAccommodations(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (error) {
      console.error('Error fetching accommodations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const ok = confirm('Delete this accommodation?');
    if (!ok) return;
    try {
      await deleteDoc(doc(db, 'accommodations', id));
      setAccommodations((prev) => prev.filter((a) => a.id !== id));
      alert('Accommodation deleted.');
    } catch (error) {
      console.error('Error deleting accommodation:', error);
      alert('Failed to delete.');
    }
  };

  if (!currentUser || !isAdmin) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen text-gray-600">
        Loading accommodations...
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4 text-green-700">Accommodations Management</h1>
      <p className="mb-6 text-gray-700">Manage accommodations listings (edit, approve, delete).</p>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white rounded shadow-md">
          <thead>
            <tr className="bg-green-100 text-left">
              <th className="py-2 px-4 border-b">Name</th>
              <th className="py-2 px-4 border-b">Type</th>
              <th className="py-2 px-4 border-b">Barangay</th>
              <th className="py-2 px-4 border-b">Status</th>
              <th className="py-2 px-4 border-b">Actions</th>
            </tr>
          </thead>
          <tbody>
            {accommodations.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-6 text-gray-500">
                  No accommodations found.
                </td>
              </tr>
            ) : (
              accommodations.map((acc) => (
                <tr key={acc.id} className="hover:bg-gray-50">
                  <td className="py-2 px-4 border-b">{acc.name || '—'}</td>
                  <td className="py-2 px-4 border-b">{acc.type || '—'}</td>
                  <td className="py-2 px-4 border-b">{acc.barangay || '—'}</td>
                  <td className="py-2 px-4 border-b">{acc.status || 'Pending'}</td>
                  <td className="py-2 px-4 border-b space-x-2">
                    <Link
                      href={`/admin/accommodations/${acc.id}/edit`}
                      className="text-blue-600 hover:underline mr-2"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(acc.id)}
                      className="text-red-600 hover:underline"
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

      <div className="mt-6">
        <Link
          href="/admin/accommodations/new"
          className="px-4 py-2 bg-primary-green text-egg-white rounded hover:bg-accent-green"
        >
          Add Accommodation
        </Link>
      </div>
    </div>
  );
}
