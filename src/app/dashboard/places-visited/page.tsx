'use client';

import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '@/lib/firebase';
import { motion } from 'framer-motion';
import { Trash2 } from 'lucide-react';

export default function PlacesVisitedPage() {
  const [user, setUser] = useState<any>(null);
  const [completedVisits, setCompletedVisits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (u) => {
      if (u) {
        setUser(u);
        const q = query(
          collection(db, 'visits'),
          where('userId', '==', u.uid),
          where('status', '==', 'Completed')
        );

        const unsubscribeVisits = onSnapshot(q, (snapshot) => {
          const data = snapshot.docs.map((docSnap) => ({
            id: docSnap.id,
            ...docSnap.data(),
          }));
          setCompletedVisits(data);
          setLoading(false);
        });

        return () => unsubscribeVisits();
      } else {
        setUser(null);
        setCompletedVisits([]);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  const handleDelete = (id: string) => {
    setCompletedVisits((prev) => prev.filter((visit) => visit.id !== id));
  };

  if (loading)
    return (
      <div className="flex justify-center items-center min-h-screen text-gray-600">
        Loading visited places...
      </div>
    );

  return (
    <motion.div
      className="max-w-6xl mx-auto bg-white rounded-2xl shadow-md p-8 mt-6"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <h1 className="text-3xl font-bold text-green-700 mb-6 text-center">
        Places Visited
      </h1>

      {completedVisits.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-16 text-gray-600">
          <img
            src="/empty-visited.svg"
            alt="No places visited yet"
            className="w-56 mb-6 opacity-80"
          />
          <h2 className="text-xl font-semibold mb-2">No completed visits yet</h2>
          <p className="text-gray-500 mb-4">
            Once you complete your scheduled visits, they will appear here.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-200 rounded-lg overflow-hidden">
            <thead className="bg-green-600 text-white text-sm uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3 text-left">Name</th>
                <th className="px-6 py-3 text-left">Barangays</th>
                <th className="px-6 py-3 text-left">Spots</th>
                <th className="px-6 py-3 text-left">Date</th>
                <th className="px-6 py-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="text-gray-700 divide-y divide-gray-100">
              {completedVisits.map((visit, index) => (
                <motion.tr
                  key={visit.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="hover:bg-green-50 transition"
                >
                  <td className="px-6 py-4 font-medium">{visit.fullName}</td>
                  <td className="px-6 py-4">{visit.barangays?.join(', ') || 'N/A'}</td>
                  <td className="px-6 py-4">{visit.spots?.join(', ') || 'N/A'}</td>
                  <td className="px-6 py-4">{visit.date}</td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => handleDelete(visit.id)}
                      className="text-red-500 hover:text-red-700 transition"
                      title="Remove from list"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </motion.div>
  );
}
