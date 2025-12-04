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

  // period state: weekly, monthly, quarterly, yearly, or all
  const [period, setPeriod] = useState<'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'all'>('monthly');

  // helper: compute start date for the chosen period
  const getRangeStart = (p: typeof period) => {
    const now = new Date();
    switch (p) {
      case 'weekly': {
        const d = new Date(now);
        d.setDate(now.getDate() - 7);
        return d;
      }
      case 'monthly': {
        const d = new Date(now);
        d.setMonth(now.getMonth() - 1);
        return d;
      }
      case 'quarterly': {
        const d = new Date(now);
        d.setMonth(now.getMonth() - 3);
        return d;
      }
      case 'yearly': {
        const d = new Date(now);
        d.setFullYear(now.getFullYear() - 1);
        return d;
      }
      case 'all':
      default:
        return new Date(0);
    }
  };

  // memoized filtered visits based on selected period
  const periodFiltered = (() => {
    const start = getRangeStart(period);
    return visits.filter((v) => {
      const d = v.completedAt?.toDate ? v.completedAt.toDate() : v.date ? new Date(v.date) : null;
      if (!d) return false;
      return d >= start;
    });
  })();

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
    if (periodFiltered.length === 0) {
      alert('No completed visit reports available for the selected period to download.');
      return;
    }

    const doc = new jsPDF();
    doc.setFontSize(18);
    const periodLabel = period === 'all' ? 'All' : period.charAt(0).toUpperCase() + period.slice(1);
    doc.text(`${placeName} – ${periodLabel} Completed Visits Report`, 14, 15);

    const tableRows = periodFiltered.map((v) => {
      const completedAt = v.completedAt?.toDate ? v.completedAt.toDate() : null;
      return [
        v.fullName || 'N/A',
        v.email || 'N/A',
        v.spots?.join(', ') || '—',
        v.companions?.length || 0,
        completedAt ? completedAt.toLocaleDateString('en-PH') : '—',
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

    doc.save(`${placeName}_${period}_Completed_Visits.pdf`);
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

      {/* Period selector + PDF button */}
      <div className="flex items-center gap-4 mb-4">
        <div className="inline-flex rounded-md shadow-sm" role="tablist" aria-label="Period">
          {(['weekly','monthly','quarterly','yearly','all'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md focus:outline-none ${
                period === p ? 'bg-green-600 text-white' : 'bg-white border text-gray-700'
              }`}
              role="tab"
              aria-selected={period === p}
            >
              {p === 'all' ? 'All' : p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>

        <button
          onClick={handleDownloadPDF}
          disabled={periodFiltered.length === 0}
          className={`ml-auto mb-4 px-4 py-2 rounded text-white ${
            periodFiltered.length === 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
          }`}
        >
          📄 Download PDF ({period === 'all' ? 'All' : period})
        </button>
      </div>

      {periodFiltered.length === 0 ? (
        <p className="text-gray-500 text-center mt-10">
          No completed visits found for this {role === 'barangay' ? 'barangay' : 'spot'} in the selected period ({period === 'all' ? 'All' : period}).
        </p>
      ) : (
        <ul className="divide-y divide-gray-200 bg-white rounded-xl shadow">
          {periodFiltered
            .sort(
              (a, b) =>
                new Date(b.completedAt?.toDate?.() || b.date).getTime() -
                new Date(a.completedAt?.toDate?.() || a.date).getTime()
            )
            .map((visit) => {
              const completedAt = visit.completedAt?.toDate ? visit.completedAt.toDate() : null;

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
                        {completedAt ? completedAt.toLocaleDateString('en-PH') : '—'}
                      </span>
                      <span>
                        {completedAt ? completedAt.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' }) : '—'}
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
