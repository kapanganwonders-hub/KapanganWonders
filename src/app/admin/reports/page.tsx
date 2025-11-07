'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Trash } from 'lucide-react';

export default function ReportsPage() {
  const [visitLogs, setVisitLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      const snapshot = await getDocs(collection(db, 'visitLogs'));
      const logs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setVisitLogs(logs);
      setLoading(false);
    };
    fetchLogs();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this visit log?')) return;
    await deleteDoc(doc(db, 'visitLogs', id));
    setVisitLogs(prev => prev.filter(log => log.id !== id));
  };

  if (loading) return <p className="text-center mt-10">Loading visit logs...</p>;

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-green-700 mb-6">🧾 Visit Logs</h1>

      <div className="overflow-x-auto rounded-lg shadow">
        <table className="min-w-full bg-white border border-gray-200">
          <thead className="bg-green-600 text-white">
            <tr>
              <th className="p-3 text-left">Name</th>
              <th className="p-3 text-left">Email</th>
              <th className="p-3 text-left">Barangay</th>
              <th className="p-3 text-left">Tourist Spot</th>
              <th className="p-3 text-left">Origin</th>
              <th className="p-3 text-left">Visitors</th>
              <th className="p-3 text-left">Date</th>
              <th className="p-3 text-left">Scanned By</th>
              <th className="p-3 text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {visitLogs.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center py-6 text-gray-500">
                  No visit logs found.
                </td>
              </tr>
            ) : (
              visitLogs.map((log) => (
                <tr key={log.id} className="border-b hover:bg-gray-50">
                  <td className="p-3">{log.name || 'N/A'}</td>
                  <td className="p-3">{log.email || 'N/A'}</td>
                  <td className="p-3">{log.barangays?.[0] || 'N/A'}</td>
                  <td className="p-3">{log.spots?.[0] || 'N/A'}</td>
                  <td className="p-3 capitalize">{log.originType}</td>
                  <td className="p-3 text-center">{log.numberOfVisitors || 1}</td>
                  <td className="p-3">{log.date}</td>
                  <td className="p-3 capitalize">{log.scannedBy}</td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => handleDelete(log.id)}
                      className="text-red-500 hover:text-red-700"
                      title="Delete log"
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
