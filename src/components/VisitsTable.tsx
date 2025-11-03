'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Check, Trash } from 'lucide-react';

interface VisitsTableProps {
  role: 'admin' | 'barangay' | 'private';
  filterFn?: (visit: any) => boolean; // optional filter based on role
}

export default function VisitsTable({ role, filterFn }: VisitsTableProps) {
  const [visits, setVisits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchVisits = async () => {
    try {
      const snap = await getDocs(collection(db, 'visits'));
      let data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

      // ✅ Apply filtering based on role (barangay/private)
      if (filterFn) data = data.filter(filterFn);

      setVisits(data);
    } catch (error) {
      console.error('Error fetching visits:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await updateDoc(doc(db, 'visits', id), { status: 'Approved' });
      setVisits((prev) =>
        prev.map((v) => (v.id === id ? { ...v, status: 'Approved' } : v))
      );
      alert('✅ Visit approved successfully.');
    } catch (error) {
      console.error('Error approving visit:', error);
    }
  };

  const handleDelete = async (id: string) => {
    const ok = confirm('Are you sure you want to delete this visit?');
    if (!ok) return;
    try {
      await deleteDoc(doc(db, 'visits', id));
      setVisits((prev) => prev.filter((v) => v.id !== id));
      alert('🗑️ Visit deleted successfully.');
    } catch (error) {
      console.error('Error deleting visit:', error);
    }
  };

  // ✅ Re-fetch whenever filterFn changes (e.g., user switches or loads)
  useEffect(() => {
    fetchVisits();
  }, [filterFn]);

  if (loading) return <div>Loading visits...</div>;

  return (
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
              <td colSpan={6} className="text-center py-6 text-gray-500">
                No scheduled visits yet.
              </td>
            </tr>
          ) : (
            visits.map((v) => (
              <tr key={v.id} className="hover:bg-gray-50">
                <td className="py-2 px-4 border-b">{v.fullName}</td>
                <td className="py-2 px-4 border-b">{v.barangays?.join(', ') || 'N/A'}</td>
                <td className="py-2 px-4 border-b">{v.spots?.join(', ') || 'N/A'}</td>
                <td className="py-2 px-4 border-b">{v.date}</td>
                <td className="py-2 px-4 border-b font-medium">{v.status || 'Pending'}</td>
                <td className="py-2 px-4 border-b space-x-2">
                  {/* ✅ Only admin and barangay/private admins can approve */}
                  {v.status !== 'Approved' && role === 'admin' && (
                    <button
                      onClick={() => handleApprove(v.id)}
                      className="text-green-700 hover:underline flex items-center gap-1"
                    >
                      <Check size={14} /> Approve
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(v.id)}
                    className="text-red-600 hover:underline flex items-center gap-1"
                  >
                    <Trash size={14} /> Delete
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
