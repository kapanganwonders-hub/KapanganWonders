'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Trash } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Visit {
  id: string;
  fullName?: string;
  email?: string;
  companions?: string[];
  status?: string;
  completedAt?: any;
  visitorType?: string;
  barangays?: string[];
  spots?: string[];
}

export default function ReportsPage() {
  const [completedVisits, setCompletedVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);

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

  // ⬇ UPDATED: Includes Barangay & Spot
  const handleDownloadPDF = () => {
    if (completedVisits.length === 0) {
      alert('No completed visit reports available to download.');
      return;
    }

    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('Kapangan Wonders - Completed Visits Report', 14, 15);

    const tableRows = completedVisits.map((v) => [
      v.fullName || 'N/A',
      v.email || 'N/A',
      v.visitorType || 'Unknown',
      v.barangays?.join(', ') || 'N/A',
      v.spots?.join(', ') || 'N/A',
      v.companions?.length || 0,
      v.completedAt
        ? new Date(v.completedAt?.toDate?.() || v.completedAt).toLocaleString()
        : 'N/A',
    ]);

    autoTable(doc, {
      startY: 25,
      head: [
        [
          'Name',
          'Email',
          'Visitor Type',
          'Barangay',
          'Spot',
          'Companions',
          'Completed At',
        ],
      ],
      body: tableRows,
    });

    doc.save('Completed_Visits_Report.pdf');
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this completed visit?')) return;
    await deleteDoc(doc(db, 'visits', id));
    setCompletedVisits((prev) => prev.filter((v) => v.id !== id));
  };

  if (loading)
    return <p className="text-center mt-10">Loading completed visits...</p>;

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-green-700 mb-6">
        ✅ Completed Visits
      </h1>

      <button
        onClick={handleDownloadPDF}
        disabled={completedVisits.length === 0}
        className={`mb-4 px-4 py-2 rounded text-white ${
          completedVisits.length === 0
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-green-600 hover:bg-green-700'
        }`}
      >
        📄 Download PDF
      </button>

      <div className="overflow-x-auto rounded-lg shadow">
        <table className="min-w-full bg-white border border-gray-200">
          <thead className="bg-green-600 text-white">
            <tr>
              <th className="p-3 text-left">Name</th>
              <th className="p-3 text-left">Email</th>
              <th className="p-3 text-left">Visitor Type</th>
              <th className="p-3 text-left">Barangay</th>
              <th className="p-3 text-left">Spot</th>
              <th className="p-3 text-left">Companions</th>
              <th className="p-3 text-left">Date & Time Completed</th>
              <th className="p-3 text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {completedVisits.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-6 text-gray-500">
                  No completed visits found.
                </td>
              </tr>
            ) : (
              completedVisits.map((visit) => (
                <tr key={visit.id} className="border-b hover:bg-gray-50">
                  <td className="p-3">{visit.fullName || 'N/A'}</td>
                  <td className="p-3">{visit.email || 'N/A'}</td>
                  <td className="p-3 capitalize">
                    {visit.visitorType || 'Unknown'}
                  </td>
                  <td className="p-3">
                    {visit.barangays?.join(', ') || (
                      <span className="text-gray-500 italic">N/A</span>
                    )}
                  </td>
                  <td className="p-3">
                    {visit.spots?.join(', ') || (
                      <span className="text-gray-500 italic">N/A</span>
                    )}
                  </td>
                  <td className="p-3">
                    {visit.companions?.length
                      ? `${visit.companions.length} companion(s)`
                      : 'No companions'}
                  </td>
                  <td className="p-3">
                    {visit.completedAt
                      ? new Date(
                          visit.completedAt?.toDate?.() || visit.completedAt
                        ).toLocaleString()
                      : 'N/A'}
                  </td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => handleDelete(visit.id)}
                      className="text-red-500 hover:text-red-700"
                      title="Delete record"
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
