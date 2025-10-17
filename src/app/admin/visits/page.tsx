'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Check, Trash } from 'lucide-react';

export default function AdminVisitsPage() {
  const { currentUser, isAdmin } = useAuth();
  const router = useRouter();
  const [visits, setVisits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof isAdmin === 'undefined') return;
    if (!isAdmin) {
      router.push('/');
      return;
    }
    fetchVisits();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  const fetchVisits = async () => {
    try {
      const snap = await getDocs(collection(db, 'visits'));
      setVisits(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (error) {
      console.error('Error fetching visits:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await updateDoc(doc(db, 'visits', id), { status: 'Approved' });
      setVisits((prev) => prev.map((v) => (v.id === id ? { ...v, status: 'Approved' } : v)));
      alert('Visit approved.');
    } catch (error) {
      console.error('Error approving visit:', error);
      alert('Failed to approve.');
    }
  };

  const handleDelete = async (id: string) => {
    const ok = confirm('Delete this visit?');
    if (!ok) return;
    try {
      await deleteDoc(doc(db, 'visits', id));
      setVisits((prev) => prev.filter((v) => v.id !== id));
      alert('Visit deleted.');
    } catch (error) {
      console.error('Error deleting visit:', error);
      alert('Failed to delete.');
    }
  };

  if (typeof isAdmin === 'undefined' || !currentUser || !isAdmin) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen text-gray-600">Loading visits...</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4 text-green-700">Visits Management</h1>
      <p className="mb-6 text-gray-700">Approve or delete scheduled visits submitted by tourists.</p>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white rounded shadow-md">
          <thead>
            <tr className="bg-green-100 text-left">
              <th className="py-2 px-4 border-b">Tourist</th>
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
                <td colSpan={6} className="text-center py-6 text-gray-500">No scheduled visits yet.</td>
              </tr>
            ) : (
              visits.map((v) => (
                <tr key={v.id} className="hover:bg-gray-50">
                  <td className="py-2 px-4 border-b">{v.fullName}</td>
                  <td className="py-2 px-4 border-b">{v.barangays?.join(', ') || 'N/A'}</td>
                  <td className="py-2 px-4 border-b">{v.spots?.join(', ') || 'N/A'}</td>
                  <td className="py-2 px-4 border-b">{v.date}</td>
                  <td className="py-2 px-4 border-b font-medium">
                    {v.status || 'Pending'}
                  </td>
                  <td className="py-2 px-4 border-b space-x-2">
                    {v.status !== 'Approved' && (
                      <button onClick={() => handleApprove(v.id)} className="text-green-700 hover:underline flex items-center gap-1">
                        <Check size={14}/> Approve
                      </button>
                    )}
                    <button onClick={() => handleDelete(v.id)} className="text-red-600 hover:underline flex items-center gap-1">
                      <Trash size={14}/> Delete
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
