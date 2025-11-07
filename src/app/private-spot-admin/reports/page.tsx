'use client';

import { useEffect, useState } from 'react';
import { db, auth } from '@/lib/firebase';
import { collection, getDoc, onSnapshot, query, doc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { Card, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { MapPin, Calendar, Users, User } from 'lucide-react';

export default function PrivateReportsPage() {
  const [visits, setVisits] = useState<any[]>([]);
  const [spotName, setSpotName] = useState('');
  const [loading, setLoading] = useState(true);

  // Fetch private owner's spot and visit logs
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

      const q = query(collection(db, 'visitLogs'));
      const unsub = onSnapshot(q, (snapshot) => {
        const data = snapshot.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((log: any) =>
            log.spots?.map((s: string) => s.toLowerCase()).includes(spot.toLowerCase())
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
        <h1 className="text-3xl font-bold text-green-700">
          {spotName} – Visit Reports
        </h1>
      </div>

      {visits.length === 0 ? (
        <p className="text-gray-500 text-center mt-10">No visit records found.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visits
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .map((visit) => (
              <motion.div
                key={visit.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl shadow-md border border-green-100 hover:shadow-lg transition"
              >
                <Card>
                  <CardContent className="p-5">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h2 className="font-semibold text-green-700 text-lg">{visit.name}</h2>
                        <p className="text-sm text-gray-600 flex items-center gap-1">
                          <User size={14} /> {visit.email}
                        </p>
                      </div>
                      <div className="text-xs text-gray-500 flex items-center gap-1">
                        <Calendar size={12} /> {visit.date}
                      </div>
                    </div>

                    <p className="text-sm text-gray-700 flex items-center gap-1">
                      <MapPin size={14} /> Spots: {visit.spots?.join(', ') || '—'}
                    </p>

                    <div className="mt-3 flex justify-between items-center">
                      <p className="text-sm text-gray-500 flex items-center gap-1">
                        <Users size={14} /> Visitors: {visit.numberOfVisitors || 0}
                      </p>
                      <span className="bg-green-100 text-green-700 text-xs px-3 py-1 rounded-full">
                        {visit.purpose || 'No purpose given'}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
        </div>
      )}
    </div>
  );
}
