'use client';

import { useEffect, useMemo, useState } from 'react';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Trash, Calendar, MapPin, User, Download } from 'lucide-react';
import { motion } from 'framer-motion';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Visit {
  id: string;
  fullName?: string;
  email?: string;
  status?: string;
  completedAt?: any;
  visitorType?: string;
  barangays?: string[];
  spots?: string[];
}

export default function ReportsPage() {
  const [completedVisits, setCompletedVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);

  // period state: weekly, monthly, quarterly, yearly, or all
  const [period, setPeriod] = useState<'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'all'>('monthly');

  // barangay filter (deduped, title-cased)
  const [selectedBarangay, setSelectedBarangay] = useState<string>('all');

  // pagination state: 5 per page
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 5;

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
              new Date(b.completedAt?.toDate?.() || b.completedAt || 0).getTime() -
              new Date(a.completedAt?.toDate?.() || a.completedAt || 0).getTime()
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

  // helper to produce Title Case from raw barangay strings
  const toTitle = (s: string) =>
    s
      .trim()
      .toLowerCase()
      .split(/\s+/)
      .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : ''))
      .join(' ');

  // derive unique barangay options (case-insensitive dedupe; display Title Case)
  const barangayOptions = useMemo(() => {
    const map = new Map<string, string>();
    completedVisits.forEach((v) =>
      v.barangays?.forEach((b) => {
        const key = b.trim().toLowerCase();
        if (!map.has(key)) map.set(key, toTitle(b));
      })
    );
    return ['all', ...Array.from(map.values()).sort((a, b) => a.localeCompare(b))];
  }, [completedVisits]);

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

  // period + barangay filtered visits
  const periodFiltered = useMemo(() => {
    const start = getRangeStart(period);
    const barangayKey = selectedBarangay === 'all' ? null : selectedBarangay.toLowerCase();
    return completedVisits.filter((v) => {
      const raw = v.completedAt?.toDate?.() || v.completedAt || null;
      const d = raw ? new Date(raw) : null;
      if (!d) return false;
      if (d < start) return false;
      if (barangayKey) {
        return (v.barangays || []).some((b) => b.trim().toLowerCase() === barangayKey);
      }
      return true;
    });
  }, [completedVisits, period, selectedBarangay]);

  // reset page when period or barangay filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [period, selectedBarangay]);

  // pagination calculations
  const totalPages = Math.max(1, Math.ceil(periodFiltered.length / itemsPerPage));
  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const paginated = useMemo(() => {
    const startIdx = (currentPage - 1) * itemsPerPage;
    return periodFiltered.slice(startIdx, startIdx + itemsPerPage);
  }, [periodFiltered, currentPage]);

  const formatDate = (d: any) =>
    d ? new Date(d?.toDate?.() || d).toLocaleDateString('en-PH') : '—';
  const formatTime = (d: any) =>
    d ? new Date(d?.toDate?.() || d).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' }) : '—';

  // PDF export — companions removed
  const handleDownloadPDF = () => {
    if (periodFiltered.length === 0) {
      alert('No completed visit reports available for the selected period to download.');
      return;
    }

    const doc = new jsPDF();
    doc.setFontSize(18);
    const periodLabel = period === 'all' ? 'All' : period.charAt(0).toUpperCase() + period.slice(1);
    const barangayLabel = selectedBarangay === 'all' ? 'All Barangays' : toTitle(selectedBarangay);
    doc.text(`${barangayLabel} – ${periodLabel} Completed Visits Report`, 14, 15);

    const tableRows = periodFiltered.map((v) => {
      const completedAt = v.completedAt?.toDate ? v.completedAt.toDate() : null;
      return [
        v.fullName || 'N/A',
        v.email || 'N/A',
        v.spots?.join(', ') || '—',
        completedAt ? completedAt.toLocaleDateString('en-PH') : '—',
        completedAt ? completedAt.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' }) : '—',
      ];
    });

    autoTable(doc, {
      startY: 25,
      head: [['Name', 'Email', 'Spots', 'Date', 'Time']],
      body: tableRows,
    });

    doc.save(`${barangayLabel}_${period}_Completed_Visits.pdf`);
  };

  // CSV export — companions removed
  const handleExportCSV = () => {
    if (periodFiltered.length === 0) {
      alert('No records to export.');
      return;
    }

    const barangayLabel = selectedBarangay === 'all' ? 'All_Barangays' : toTitle(selectedBarangay).replace(/\s+/g, '_');
    const headers = ['Name', 'Email', 'Spots', 'Date', 'Time'];
    const rows = periodFiltered.map((v) => {
      const completedAt = v.completedAt?.toDate ? v.completedAt.toDate() : null;
      return [
        `"${(v.fullName || '').replace(/"/g, '""')}"`,
        `"${(v.email || '').replace(/"/g, '""')}"`,
        `"${(v.spots || []).join(', ')}"`,
        `"${completedAt ? completedAt.toLocaleDateString('en-PH') : ''}"`,
        `"${completedAt ? completedAt.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' }) : ''}"`,
      ].join(',');
    });
    const csv = [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${barangayLabel}_${period}_Completed_Visits.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this completed visit?')) return;
    await deleteDoc(doc(db, 'visits', id));
    setCompletedVisits((prev) => prev.filter((v) => v.id !== id));
  };

  if (loading) return <p className="text-center mt-10 text-gray-600">Loading visit reports...</p>;

  return (
    <div className="p-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <h1 className="text-3xl font-bold text-green-700">
          Completed Visits
        </h1>
      </div>

      {/* Controls: period selector, barangay selector, exports */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-4">
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

        <select
          value={selectedBarangay}
          onChange={(e) => setSelectedBarangay(e.target.value)}
          className="px-3 py-2 border rounded ml-2"
        >
          {barangayOptions.map((b) => (
            <option key={b} value={b === 'all' ? 'all' : b.toLowerCase()}>
              {b === 'all' ? 'All Barangays' : b}
            </option>
          ))}
        </select>

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={handleDownloadPDF}
            disabled={periodFiltered.length === 0}
            className={`px-4 py-2 rounded text-white ${
              periodFiltered.length === 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            <Download size={16} className="inline-block mr-2" /> PDF ({period === 'all' ? 'All' : period})
          </button>

          <button
            onClick={handleExportCSV}
            disabled={periodFiltered.length === 0}
            className={`px-4 py-2 rounded text-white ${
              periodFiltered.length === 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            <Download size={16} className="inline-block mr-2" /> CSV ({period === 'all' ? 'All' : period})
          </button>
        </div>
      </div>

      {periodFiltered.length === 0 ? (
        <p className="text-gray-500 text-center mt-10">
          No completed visits found for the selected period.
        </p>
      ) : (
        <ul className="divide-y divide-gray-200 bg-white rounded-xl shadow">
          {paginated
            .slice()
            .sort(
              (a, b) =>
                new Date(b.completedAt?.toDate?.() || b.completedAt || 0).getTime() -
                new Date(a.completedAt?.toDate?.() || a.completedAt || 0).getTime()
            )
            .map((visit) => {
              const completedAt = visit.completedAt?.toDate ? visit.completedAt.toDate() : visit.completedAt ? new Date(visit.completedAt) : null;

              return (
                <motion.li
                  key={visit.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-5 hover:bg-gray-50 transition flex justify-between items-start"
                >
                  <div>
                    <h2 className="font-semibold text-green-700 text-lg">{visit.fullName || 'N/A'}</h2>

                    <p className="text-sm text-gray-600 flex items-center gap-2 mt-1">
                      <User size={14} /> {visit.email || 'N/A'}
                    </p>

                    <p className="text-sm text-gray-600 flex items-center gap-2 mt-1">
                      <MapPin size={14} /> Spots: {visit.spots?.join(', ') || '—'}
                    </p>

                    <p className="text-sm text-gray-600 flex items-center gap-2 mt-1">
                      {/* display barangays if present */}
                      <span className="font-medium">Barangay:</span>{' '}
                      {visit.barangays?.map((b) => toTitle(b)).join(', ') || '—'}
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <div className="text-sm text-gray-500 flex flex-col items-end">
                      <span className="flex items-center gap-1">
                        <Calendar size={14} />
                        {completedAt ? completedAt.toLocaleDateString('en-PH') : '—'}
                      </span>
                      <span>{completedAt ? completedAt.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' }) : '—'}</span>
                    </div>

                    <button
                      onClick={() => handleDelete(visit.id)}
                      className="text-red-500 hover:text-red-700"
                      title="Delete record"
                    >
                      <Trash size={18} />
                    </button>
                  </div>
                </motion.li>
              );
            })}
        </ul>
      )}

      {/* Pagination controls (5 per page) */}
      {periodFiltered.length > itemsPerPage && (
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-gray-600">
            Showing {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, periodFiltered.length)} of {periodFiltered.length} results
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className={`px-2 py-1 border rounded ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              « First
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className={`px-2 py-1 border rounded ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              ‹ Prev
            </button>
            <span className="px-3">{currentPage} / {totalPages}</span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className={`px-2 py-1 border rounded ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              Next ›
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className={`px-2 py-1 border rounded ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              Last »
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
