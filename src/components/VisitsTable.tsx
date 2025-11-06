'use client';

import { useEffect, useState } from 'react';
import {
  collection,
  onSnapshot,
  updateDoc,
  deleteDoc,
  doc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Check, Trash } from 'lucide-react';

// Define the shape of a Visit
interface Visit {
  id: string;
  fullName?: string;
  barangays?: string[];
  spots?: string[];
  date?: string;
  status?: string;
}

interface VisitsTableProps {
  role: 'admin' | 'barangay' | 'private';
  filterFn?: (visit: Visit) => boolean; // optional filter based on user role
}

export default function VisitsTable({ role, filterFn }: VisitsTableProps) {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // ✅ Real-time listener for visits collection
    const unsub = onSnapshot(collection(db, 'visits'), (snap) => {
      let data: Visit[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<Visit, 'id'>),
      }));

      // ❌ Exclude "completed" visits
      data = data.filter((v) => v.status?.toLowerCase() !== 'completed');

      // ✅ Apply custom filter (barangay/private)
      if (filterFn) data = data.filter(filterFn);

      setVisits(data);
      setLoading(false);
    });

    // 🧹 Cleanup listener on unmount
    return () => unsub();
  }, [filterFn]);

  // ✅ Approve a visit
  const handleApprove = async (id: string) => {
    try {
      await updateDoc(doc(db, 'visits', id), { status: 'Approved' });
      alert('✅ Visit approved successfully.');
    } catch (error) {
      console.error('Error approving visit:', error);
      alert('Failed to approve visit.');
    }
  };

  // 🗑️ Delete a visit
  const handleDelete = async (id: string) => {
    const ok = confirm('Are you sure you want to delete this visit?');
    if (!ok) return;
    try {
      await deleteDoc(doc(db, 'visits', id));
      alert('🗑️ Visit deleted successfully.');
    } catch (error) {
      console.error('Error deleting visit:', error);
      alert('Failed to delete visit.');
    }
  };

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
                <td className="py-2 px-4 border-b">
                  {v.barangays?.join(', ') || 'N/A'}
                </td>
                <td className="py-2 px-4 border-b">
                  {v.spots?.join(', ') || 'N/A'}
                </td>
                <td className="py-2 px-4 border-b">{v.date}</td>
                <td className="py-2 px-4 border-b font-medium">
                  {v.status || 'Pending'}
                </td>
                <td className="py-2 px-4 border-b space-x-2 flex items-center">
                  {/* ✅ Approve button for admin/barangay/private */}
                  {v.status !== 'Approved' &&
                    (role === 'admin' ||
                      role === 'barangay' ||
                      role === 'private') && (
                      <button
                        onClick={() => handleApprove(v.id)}
                        className="text-green-700 hover:underline flex items-center gap-1"
                      >
                        <Check size={14} /> Approve
                      </button>
                    )}

                  {/* 🗑️ Delete option available for all roles */}
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
