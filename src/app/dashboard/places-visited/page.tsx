'use client';

import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '@/lib/firebase';
import { motion } from 'framer-motion';
import { MapPin, Calendar, Star } from 'lucide-react';

export default function PlacesVisitedPage() {
  const [user, setUser] = useState<any>(null);
  const [completedVisits, setCompletedVisits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // 🔄 Listen for real-time completed visits
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

  if (loading)
    return (
      <div className="flex justify-center items-center min-h-screen text-gray-600">
        Loading visited places...
      </div>
    );

  return (
    <motion.div
      className="max-w-5xl mx-auto bg-white rounded-2xl shadow-md p-8"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <h1 className="text-3xl font-bold text-gray-800 mb-4">Places Visited</h1>

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
        <div className="grid md:grid-cols-2 gap-6">
          {completedVisits.map((visit) => (
            <motion.div
              key={visit.id}
              className="border border-gray-200 rounded-xl shadow-sm p-5 hover:shadow-md transition bg-green-50"
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xl font-semibold text-green-800">
                  {visit.fullName}
                </h2>
                <span className="bg-green-200 text-green-800 text-sm px-3 py-1 rounded-full font-medium">
                  Completed
                </span>
              </div>

              <div className="space-y-2 text-sm text-gray-700">
                <p className="flex items-center gap-2">
                  <MapPin className="text-green-600" size={16} />
                  <strong>Barangays:</strong> {visit.barangays?.join(', ') || 'N/A'}
                </p>
                <p className="flex items-center gap-2">
                  <MapPin className="text-blue-600" size={16} />
                  <strong>Spots:</strong> {visit.spots?.join(', ') || 'N/A'}
                </p>
                <p className="flex items-center gap-2">
                  <Calendar className="text-orange-500" size={16} />
                  <strong>Date:</strong> {visit.date}
                </p>
              </div>

              <div className="mt-4 flex items-center gap-2 text-yellow-500">
                <Star size={18} />
                <Star size={18} />
                <Star size={18} />
                <Star size={18} />
                <Star size={18} />
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
