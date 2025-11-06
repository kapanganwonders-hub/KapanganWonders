'use client';

import { useState } from 'react';
import { Scanner as QrScanner } from '@yudiel/react-qr-scanner';
import { doc, updateDoc, getDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function BarangayScanPage() {
  const [scannedData, setScannedData] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [successPopup, setSuccessPopup] = useState(false);

  const handleScan = async (data: string) => {
    if (!data || scanning) return;
    setScanning(true);
    setScannedData(data);

    try {
      const parsed = JSON.parse(data);
      const visitRef = doc(db, 'visits', parsed.visitId);
      const visitSnap = await getDoc(visitRef);

      if (!visitSnap.exists()) {
        alert('❌ Invalid QR code — visit not found.');
        setScanning(false);
        return;
      }

      const visitData = visitSnap.data();

      // ✅ Update the original visit status
      await updateDoc(visitRef, {
        status: 'Completed',
        completedAt: serverTimestamp(),
      });

      // ✅ Add complete visit info into visitLogs
      await addDoc(collection(db, 'visitLogs'), {
        visitId: parsed.visitId,
        userId: parsed.userId,
        name: visitData.fullName || '',
        email: visitData.email || '',
        originType: visitData.originType || 'domestic', // e.g., 'foreign' or 'domestic'
        barangays: visitData.barangays || [],
        spots: visitData.spots || [],
        date: visitData.date || '',
        numberOfVisitors: visitData.numberOfVisitors || 1,
        scannedBy: 'barangay-admin',
        scannedAt: serverTimestamp(),
        month: new Date().toLocaleString('default', { month: 'long' }),
        year: new Date().getFullYear(),
      });

      // ✅ Show popup and reset
      setSuccessPopup(true);
      setScannedData(null);
      setTimeout(() => setSuccessPopup(false), 3000);
    } catch (err) {
      console.error(err);
      alert('⚠️ Error processing QR code.');
    }

    setTimeout(() => setScanning(false), 3000);
  };

  return (
    <div className="flex flex-col items-center p-6 relative">
      <h1 className="text-2xl font-bold text-green-700 mb-4">Barangay QR Scanner</h1>

      <div className="w-full max-w-md border-4 border-green-600 rounded-2xl overflow-hidden">
        <QrScanner
          onScan={(results) => {
            if (results && results.length > 0) {
              handleScan(results[0].rawValue);
            }
          }}
          onError={(error) => console.error(error)}
        />
      </div>

      {/* ✅ Hide raw JSON after scan */}
      {scannedData && !successPopup && (
        <p className="mt-4 text-gray-600 text-sm break-all">
          Last scanned: <code>{scannedData}</code>
        </p>
      )}

      {successPopup && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 
                        bg-green-600 text-white px-6 py-4 rounded-xl shadow-lg text-lg font-semibold 
                        z-50 transition-opacity duration-500">
          ✅ Scanned Successfully!
        </div>
      )}
    </div>
  );
}
