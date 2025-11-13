'use client';

import { useEffect, useState } from 'react';
import { db, auth } from '@/lib/firebase';
import {
  collection,
  getDoc,
  onSnapshot,
  query,
  doc,
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { motion } from 'framer-motion';
import { MapPin, Calendar, User, Users } from 'lucide-react';

export default function PrivateReportsPage() {
  const [visits, setVisits] = useState<any[]>([]);
  const [spotName, setSpotName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      if (!user) return setLoading(false);

      const privateRef = doc(db, 'privateAdmins', user.uid);
      const privateSnap = await getDoc(privateRef);

      if (!privateSnap.exists()) {
        setLoading(false);
        return;
      }

      const spot = privateSnap.data().spotName;
      setSpotName(spot);

      // Fetch only completed visits for this private spot
      const unsub = onSnapshot(query(collection(db, 'visits')), (snapshot) => {
        const data = snapshot.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter(
            (v: any) =>
              v.status === 'Completed' &&
              v.spots?.some(
                (s: string) => s.toLowerCase() === spot.toLowerCase()
              )
          );
        setVisits(data);
        setLoading(false);
      });

      return () => unsub();
    });

    return () => unsubAuth();
  }, []);

  if (loading) {
    return <p className="text-center mt-10 text-gray-600">Loading visit reports...</p>;
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <h1 className="text-3xl font-bold text-green-700">
          {spotName} – Completed Visits
        </h1>
      </div>

      {visits.length === 0 ? (
        <p className="text-gray-500 text-center mt-10">
          No completed visits found for this private spot.
        </p>
      ) : (
        <ul className="divide-y divide-gray-200 bg-white rounded-xl shadow">
          {visits
            .sort(
              (a, b) =>
                new Date(b.completedAt?.toDate?.() || b.date).getTime() -
                new Date(a.completedAt?.toDate?.() || a.date).getTime()
            )
            .map((visit) => {
              const completedAt = visit.completedAt?.toDate
                ? visit.completedAt.toDate()
                : null;

              const formattedDate = completedAt
                ? completedAt.toLocaleDateString('en-PH', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })
                : visit.date;

              const formattedTime = completedAt
                ? completedAt.toLocaleTimeString('en-PH', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : '—';

              return (
                <motion.li
                  key={visit.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-5 hover:bg-gray-50 transition"
                >
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
                    <div>
                      <h2 className="font-semibold text-green-700 text-lg">
                        {visit.fullName}
                      </h2>
                      <p className="text-sm text-gray-600 flex items-center gap-1">
                        <User size={14} /> {visit.email}
                      </p>

                      <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                        <MapPin size={14} /> Spots: {visit.spots?.join(', ') || '—'}
                      </p>

                      {visit.companions && visit.companions.length > 0 && (
                        <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                          <Users size={14} /> Companions: {visit.companions.join(', ')}
                        </p>
                      )}
                    </div>

                    <div className="mt-3 sm:mt-0 text-sm text-gray-500 flex flex-col items-end">
                      <span className="flex items-center gap-1">
                        <Calendar size={14} /> {formattedDate}
                      </span>
                      <span>{formattedTime}</span>
                    </div>
                  </div>
                </motion.li>
              );
            })}
        </ul>
      )}
    </div>
  );
}
