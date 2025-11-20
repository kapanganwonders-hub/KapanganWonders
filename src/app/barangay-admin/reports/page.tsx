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
import { Calendar, MapPin, User, Users } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function ReportsPage() {
  const [visits, setVisits] = useState<any[]>([]);
  const [placeName, setPlaceName] = useState('');
  const [role, setRole] = useState<'barangay' | 'private' | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      if (!user) return setLoading(false);

      const barangayRef = doc(db, 'barangayAdmins', user.uid);
      const privateRef = doc(db, 'privateAdmins', user.uid);
      const barangaySnap = await getDoc(barangayRef);
      const privateSnap = await getDoc(privateRef);

      if (barangaySnap.exists()) {
        const barangay = barangaySnap.data().barangay;
        setPlaceName(barangay);
        setRole('barangay');

        const unsub = onSnapshot(query(collection(db, 'visits')), (snapshot) => {
          const data = snapshot.docs
            .map((d) => ({ id: d.id, ...d.data() }))
            .filter(
              (v: any) =>
                v.status === 'Completed' &&
                v.barangays?.some(
                  (b: string) => b.toLowerCase() === barangay.toLowerCase()
                )
            );
          setVisits(data);
          setLoading(false);
        });
        return () => unsub();
      } else if (privateSnap.exists()) {
        const spot = privateSnap.data().spotName;
        setPlaceName(spot);
        setRole('private');

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
      } else {
        setLoading(false);
      }
    });

    return () => unsubAuth();
  }, []);

  // 🔹 PDF EXPORT FUNCTION — UPDATED
  const handleDownloadPDF = () => {
    if (visits.length === 0) {
      alert('No completed visit reports available to download.');
      return;
    }

    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text(`${placeName} – Completed Visits Report`, 14, 15);

    const tableRows = visits.map((v) => {
      const completedAt = v.completedAt?.toDate ? v.completedAt.toDate() : null;
      return [
        v.fullName || 'N/A',
        v.email || 'N/A',
        v.spots?.join(', ') || '—',
        v.companions?.length || 0,
        completedAt
          ? completedAt.toLocaleDateString('en-PH')
          : '—',
        completedAt
          ? completedAt.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })
          : '—',
      ];
    });

    autoTable(doc, {
      startY: 25,
      head: [['Name', 'Email', 'Spots', 'Companions', 'Date', 'Time']],
      body: tableRows,
    });

    doc.save(`${placeName}_Completed_Visits.pdf`);
  };

  if (loading) {
    return <p className="text-center mt-10 text-gray-600">Loading visit reports...</p>;
  }

  return (
    <div className="p-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <h1 className="text-3xl font-bold text-green-700">
          {placeName} – Completed Visits
        </h1>
      </div>

      {/* 🔽 PDF BUTTON — UPDATED */}
      <button
        onClick={handleDownloadPDF}
        disabled={visits.length === 0} // 🔥 disable if empty
        className={`mb-4 px-4 py-2 rounded text-white ${
          visits.length === 0
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-green-600 hover:bg-green-700'
        }`}
      >
        📄 Download PDF
      </button>

      {visits.length === 0 ? (
        <p className="text-gray-500 text-center mt-10">
          No completed visits found for this {role === 'barangay' ? 'barangay' : 'spot'}.
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

                      {visit.companions?.length > 0 && (
                        <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                          <Users size={14} /> Companions: {visit.companions.join(', ')}
                        </p>
                      )}
                    </div>

                    <div className="mt-3 sm:mt-0 text-sm text-gray-500 flex flex-col items-end">
                      <span className="flex items-center gap-1">
                        <Calendar size={14} /> 
                        {completedAt
                          ? completedAt.toLocaleDateString('en-PH')
                          : '—'}
                      </span>
                      <span>
                        {completedAt
                          ? completedAt.toLocaleTimeString('en-PH', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : '—'}
                      </span>
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
