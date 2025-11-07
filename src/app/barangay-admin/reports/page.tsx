'use client';

import { useEffect, useState } from 'react';
import { collection, query, onSnapshot, getDoc, doc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';

interface VisitLog {
  id: string;
  name: string;
  email: string;
  date: string;
  barangays: string[];
  spots: string[];
  scannedBy: string;
  month: string;
  year: number;
  numberOfVisitors: number;
}

export default function BarangayReportsListPage() {
  const [logs, setLogs] = useState<VisitLog[]>([]);
  const [barangay, setBarangay] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setLoading(false);
        return;
      }

      const barangayRef = doc(db, 'barangayAdmins', user.uid);
      const barangaySnap = await getDoc(barangayRef);

      if (!barangaySnap.exists()) {
        setLoading(false);
        return;
      }

      const barangayName = barangaySnap.data().barangay;
      setBarangay(barangayName);

      const q = query(collection(db, 'visitLogs'));
      const unsubLogs = onSnapshot(q, (snapshot) => {
        const allLogs = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as VisitLog[];

        const filtered = allLogs.filter((log) =>
          log.barangays?.map((b) => b.toLowerCase()).includes(barangayName.toLowerCase())
        );

        setLogs(filtered);
        setLoading(false);
      });

      return () => unsubLogs();
    });

    return () => unsubAuth();
  }, []);

  if (loading) {
    return <p className="text-center mt-10 text-gray-600">Loading report details...</p>;
  }

  if (logs.length === 0) {
    return (
      <p className="text-center mt-10 text-gray-600">
        No visit records found for Barangay <strong>{barangay}</strong>.
      </p>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-green-700 mb-6">
        Barangay {barangay} — Detailed Visit Reports
      </h1>

      <Card className="p-4">
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
              <thead className="bg-green-600 text-white">
                <tr>
                  <th className="px-4 py-2 text-left">Name</th>
                  <th className="px-4 py-2 text-left">Email</th>
                  <th className="px-4 py-2 text-left">Date</th>
                  <th className="px-4 py-2 text-left">Spots</th>
                  <th className="px-4 py-2 text-left">Visitors</th>
                  <th className="px-4 py-2 text-left">Scanned By</th>
                  <th className="px-4 py-2 text-left">Month</th>
                  <th className="px-4 py-2 text-left">Year</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <motion.tr
                    key={log.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border-b border-gray-100 hover:bg-green-50 transition"
                  >
                    <td className="px-4 py-2">{log.name}</td>
                    <td className="px-4 py-2 text-gray-600">{log.email}</td>
                    <td className="px-4 py-2">{log.date}</td>
                    <td className="px-4 py-2">{log.spots?.join(', ') || '—'}</td>
                    <td className="px-4 py-2 text-center">{log.numberOfVisitors}</td>
                    <td className="px-4 py-2">{log.scannedBy}</td>
                    <td className="px-4 py-2">{log.month}</td>
                    <td className="px-4 py-2">{log.year}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
