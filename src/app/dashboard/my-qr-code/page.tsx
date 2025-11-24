'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';
import { Download } from 'lucide-react';

interface Visit {
  id: string;
  fullName?: string;
  barangays?: string[];
  spots?: string[];
  spotNames?: string[];
  date?: string;
  status?: string;
  qrUrl?: string;
}

export default function MyQrCodePage() {
  const { currentUser } = useAuth();
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchApprovedVisits = async () => {
      if (!currentUser) return;

      try {
        const q = query(
          collection(db, 'visits'),
          where('userId', '==', currentUser.uid),
          where('status', '==', 'Approved'),
          orderBy('date', 'desc')
        );

        const snap = await getDocs(q);

        if (!snap.empty) {
          const visitList: Visit[] = [];

          for (const doc of snap.docs) {
            const data = { id: doc.id, ...doc.data() } as Visit;

            // 🟩 Include barangay name in encoded data
            const qrData = JSON.stringify({
              visitId: data.id,
              userId: currentUser.uid,
              name: data.fullName,
              barangays: data.barangays || [],
              spots: data.spots || [],
              spotNames: data.spotNames || data.spots || [],
              date: data.date,
            });

            const qrUrl = await QRCode.toDataURL(qrData, { width: 250 });
            visitList.push({ ...data, qrUrl });
          }

          setVisits(visitList);
        }
      } catch (err) {
        console.error('Error fetching visits:', err);
      }

      setLoading(false);
    };

    fetchApprovedVisits();
  }, [currentUser]);

  // 🧾 Combine QR + info + title for download
  const handleDownload = async (visit: Visit) => {
    if (!visit.qrUrl) return;

    const image = new Image();
    image.src = visit.qrUrl;
    image.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const width = 320;
      const qrSize = 250;
      const textHeight = 100;
      const headerHeight = 40;

      canvas.width = width;
      canvas.height = qrSize + textHeight + headerHeight;

      // White background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 🟩 Header text: “Kapangan Wonders”
      ctx.fillStyle = '#2563eb'; // blue
      ctx.font = 'bold 20px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Kapangan Wonders', width / 2, 30);

      // Draw QR below header
      const x = (canvas.width - qrSize) / 2;
      ctx.drawImage(image, x, headerHeight, qrSize, qrSize);

      // 🟩 Text details under QR
      ctx.fillStyle = '#000000';
      ctx.font = '16px Arial';
      ctx.textAlign = 'center';

      const yStart = headerHeight + qrSize + 25;
      ctx.fillText(visit.fullName || 'Tourist', width / 2, yStart);
      ctx.fillText(`Date: ${visit.date || 'N/A'}`, width / 2, yStart + 22);

      if (visit.barangays?.length) {
        ctx.font = '14px Arial';
        ctx.fillStyle = '#444';
        ctx.fillText(`Barangay: ${visit.barangays.join(', ')}`, width / 2, yStart + 45);
      }

      // 💾 Download
      const link = document.createElement('a');
      link.download = `${visit.fullName || 'visit'}_${visit.date || 'qr'}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    };
  };

  if (loading)
    return <div className="p-6 text-center text-gray-600">Loading your QR codes...</div>;

  return (
    <div className="p-8 flex flex-col items-center">
      <h1 className="text-2xl font-bold mb-6 text-green-700">My QR Codes</h1>

      {visits.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {visits.map((visit) => (
            <div
              key={visit.id}
              className="p-5 bg-white rounded-lg shadow-md text-center border hover:shadow-lg transition"
            >
              <img
                src={visit.qrUrl}
                alt="QR Code"
                className="mx-auto mb-3 rounded-lg border border-gray-200"
              />

              <p className="font-semibold text-gray-800">{visit.fullName}</p>
              <p className="text-sm text-gray-700">
                <span className="font-medium">Barangay:</span>{' '}
                {visit.barangays?.join(', ') || 'N/A'}
              </p>
              <p className="text-sm text-gray-600">{visit.spotNames?.join(', ') || visit.spots?.join(', ')}</p>
              <p className="text-xs text-gray-500 mt-1">Visit Date: {visit.date}</p>

              <button
                onClick={() => handleDownload(visit)}
                className="mt-3 flex items-center justify-center gap-2 bg-green-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-green-700 transition"
              >
                <Download size={16} />
                Download QR
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500">No approved visits found.</p>
      )}
    </div>
  );
}
