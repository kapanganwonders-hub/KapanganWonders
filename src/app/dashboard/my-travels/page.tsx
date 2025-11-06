'use client';

import { useEffect, useState } from 'react';
import {
  collection,
  query,
  where,
  updateDoc,
  doc,
  onSnapshot,
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '@/lib/firebase';
import { motion } from 'framer-motion';
import { deleteDoc } from 'firebase/firestore';
import { Calendar, MapPin, Users, XCircle, Clock } from 'lucide-react';

export default function MyTravelsPage() {
  const [user, setUser] = useState<any>(null);
  const [visits, setVisits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // 🔄 Listen for real-time user visits excluding completed
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (u) => {
      if (u) {
        setUser(u);
        const q = query(
          collection(db, 'visits'),
          where('userId', '==', u.uid),
          where('status', 'in', ['pending', 'accepted']) // ✅ exclude completed
        );

        const unsubscribeVisits = onSnapshot(q, (snapshot) => {
          const data = snapshot.docs.map((docSnap) => ({
            id: docSnap.id,
            ...docSnap.data(),
          }));
          setVisits(data);
          setLoading(false);
        });
        return () => unsubscribeVisits();
      } else {
        setUser(null);
        setVisits([]);
        setLoading(false);
      }
    });
    return () => unsubscribeAuth();
  }, []);

  // ❌ Cancel visit
 const handleCancel = async (id: string) => {
  const confirmCancel = confirm('Are you sure you want to cancel this scheduled visit?');
  if (!confirmCancel) return;

  try {
    await deleteDoc(doc(db, 'visits', id)); // ✅ remove from firestore
    alert('Your scheduled visit has been cancelled and removed.');
  } catch (error) {
    console.error('Error deleting visit:', error);
    alert('Failed to cancel visit. Please try again.');
  }
};

  if (loading)
    return (
      <div className="flex justify-center items-center min-h-screen text-gray-600">
        Loading your travels...
      </div>
    );

  return (
    <motion.div
      className="max-w-5xl mx-auto bg-white rounded-2xl shadow-md p-8"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <h1 className="text-3xl font-bold text-gray-800 mb-4">My Travels</h1>

      {visits.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-16 text-gray-600">
          <img
            src="/empty-travel.svg"
            alt="No travels yet"
            className="w-56 mb-6 opacity-80"
          />
          <h2 className="text-xl font-semibold mb-2">No scheduled travels yet</h2>
          <p className="text-gray-500 mb-4">
            Start exploring and schedule your visits now!
          </p>
          <a
            href="/dashboard/schedule-visit"
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
          >
            Schedule Your Visit
          </a>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {visits.map((visit) => (
            <motion.div
              key={visit.id}
              className="border border-gray-200 rounded-xl shadow-sm p-5 hover:shadow-md transition bg-gray-50"
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xl font-semibold text-green-700">{visit.fullName}</h2>
                {visit.status !== 'Cancelled' && (
                  <button
                    onClick={() => handleCancel(visit.id)}
                    className="text-red-500 hover:text-red-700 flex items-center gap-1 text-sm"
                  >
                    <XCircle size={16} />
                    Cancel
                  </button>
                )}
              </div>

              <div className="mb-3">
                <span
                  className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                    visit.status === 'Accepted'
                      ? 'bg-green-100 text-green-700'
                      : visit.status === 'Cancelled'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}
                >
                  <Clock size={14} />
                  {visit.status || 'Pending'}
                </span>
              </div>

              <div className="space-y-2 text-sm text-gray-700">
                <p className="flex items-center gap-2">
                  <MapPin className="text-green-500" size={16} />
                  <strong>Barangays:</strong> {visit.barangays?.join(', ') || 'N/A'}
                </p>
                <p className="flex items-center gap-2">
                  <MapPin className="text-blue-500" size={16} />
                  <strong>Spots:</strong> {visit.spots?.join(', ') || 'N/A'}
                </p>
                <p className="flex items-center gap-2">
                  <Users className="text-purple-500" size={16} />
                  <strong>Companions:</strong>{' '}
                  {visit.companions?.length > 0
                    ? visit.companions.join(', ')
                    : 'None'}
                </p>
                <p className="flex items-center gap-2">
                  <Calendar className="text-orange-500" size={16} />
                  <strong>Date:</strong> {visit.date}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
