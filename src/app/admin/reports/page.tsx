'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Trash } from 'lucide-react';

// ✅ Define the Visit type (matches Firestore data)
interface Visit {
  id: string;
  fullName?: string;
  email?: string;
  companions?: string[];
  status?: string;
  completedAt?: any; // Firestore Timestamp or Date
  visitorType?: string; // "domestic" or "foreign"
}

export default function ReportsPage() {
  const [completedVisits, setCompletedVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCompletedVisits = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'visits'));
        const allVisits: Visit[] = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as Visit[];

        const completed = allVisits
          .filter((v) => v.status?.toLowerCase() === 'completed')
          .sort(
            (a, b) =>
              new Date(
                b.completedAt?.toDate?.() || b.completedAt || 0
              ).getTime() -
              new Date(
                a.completedAt?.toDate?.() || a.completedAt || 0
              ).getTime()
          );

        setCompletedVisits(completed);
      } catch (error) {
        console.error('Error fetching visits:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCompletedVisits();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this completed visit?')) return;
    await deleteDoc(doc(db, 'visits', id));
    setCompletedVisits((prev) => prev.filter((v) => v.id !== id));
  };

  if (loading)
    return <p className="text-center mt-10">Loading completed visits...</p>;

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-green-700 mb-6">
        ✅ Completed Visits
      </h1>

      <div className="overflow-x-auto rounded-lg shadow">
        <table className="min-w-full bg-white border border-gray-200">
          <thead className="bg-green-600 text-white">
            <tr>
              <th className="p-3 text-left">Name</th>
              <th className="p-3 text-left">Email</th>
              <th className="p-3 text-left">Visitor Type</th>
              <th className="p-3 text-left">Companions</th>
              <th className="p-3 text-left">Date & Time Completed</th>
              <th className="p-3 text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {completedVisits.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-6 text-gray-500">
                  No completed visits found.
                </td>
              </tr>
            ) : (
              completedVisits.map((visit) => (
                <tr key={visit.id} className="border-b hover:bg-gray-50">
                  <td className="p-3">{visit.fullName || 'N/A'}</td>
                  <td className="p-3">{visit.email || 'N/A'}</td>
                  <td className="p-3 capitalize">
                    {visit.visitorType || 'Unknown'}
                  </td>
                  <td className="p-3">
                    {visit.companions && visit.companions.length > 0 ? (
                      <ul className="list-disc list-inside text-sm text-gray-700">
                        {visit.companions.map((companion, idx) => (
                          <li key={idx}>{companion}</li>
                        ))}
                      </ul>
                    ) : (
                      <span className="text-gray-500 italic">No companions</span>
                    )}
                  </td>
                  <td className="p-3">
                    {visit.completedAt
                      ? new Date(
                          visit.completedAt?.toDate?.() || visit.completedAt
                        ).toLocaleString()
                      : 'N/A'}
                  </td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => handleDelete(visit.id)}
                      className="text-red-500 hover:text-red-700"
                      title="Delete record"
                    >
                      <Trash size={18} />
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
