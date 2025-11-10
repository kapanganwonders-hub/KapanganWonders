'use client';

import { useState, useEffect } from 'react';
import { Scanner as QrScanner } from '@yudiel/react-qr-scanner';
import {
  doc,
  updateDoc,
  getDoc,
  collection,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

export default function BarangayScanPage() {
  const [scannedData, setScannedData] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [successPopup, setSuccessPopup] = useState(false);
  const [barangayAdmin, setBarangayAdmin] = useState<any>(null);

  // ✅ Fetch logged-in barangay admin’s barangay info
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) return;

      const adminRef = doc(db, 'barangayAdmins', user.uid);
      const adminSnap = await getDoc(adminRef);

      if (adminSnap.exists()) {
        setBarangayAdmin(adminSnap.data());
      } else {
        console.warn('No barangay admin record found.');
      }
    });

    return () => unsubscribe();
  }, []);

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

      // ✅ Check if barangay matches the logged-in admin’s barangay
      // ✅ Normalize barangay data and handle arrays
      const adminBarangay = barangayAdmin?.barangay?.toLowerCase();
      const visitBarangays = Array.isArray(visitData.barangays)
        ? visitData.barangays.map((b: string) => b.toLowerCase())
        : [visitData.barangay?.toLowerCase()].filter(Boolean);

      if (!adminBarangay || !visitBarangays.includes(adminBarangay)) {
        alert(
          `⚠️ This QR code belongs to barangay "${visitBarangays.join(
            ', '
          )}", not "${barangayAdmin?.barangay}".`
        );
        setScanning(false);
        return;
      }


      // ✅ Update visit status
      await updateDoc(visitRef, {
        status: 'Completed',
        completedAt: serverTimestamp(),
      });

      // ✅ Add to visitLogs
      await addDoc(collection(db, 'visitLogs'), {
        visitId: parsed.visitId,
        userId: parsed.userId,
        name: visitData.name || visitData.fullName || `${visitData.firstName || ''} ${visitData.lastName || ''}`.trim(),
        email: visitData.email || '',
        // ✅ Support both visitorType (from schedule) and originType (for consistency)
        originType:
          visitData.originType ||
          visitData.visitorType ||
          'domestic',

        barangay: visitData.barangay || '',
        spots: visitData.spots || [],
        purpose: visitData.purpose || '',
        date: visitData.date || '',
        numberOfVisitors: visitData.numberOfVisitors || 1,
        scannedBy: barangayAdmin?.displayName || 'barangay-admin',
        scannedAt: serverTimestamp(),
        month: new Date().toLocaleString('default', { month: 'long' }),
        year: new Date().getFullYear(),
      });

      // ✅ Popup + reset
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
      <h1 className="text-2xl font-bold text-green-700 mb-4">
        Barangay QR Scanner
      </h1>

      {barangayAdmin ? (
        <p className="mb-2 text-sm text-gray-700">
          Logged in as: <strong>{barangayAdmin.displayName}</strong> (
          {barangayAdmin.barangay})
        </p>
      ) : (
        <p className="mb-2 text-sm text-gray-500">Loading barangay info...</p>
      )}

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

      {scannedData && !successPopup && (
        <p className="mt-4 text-gray-600 text-sm break-all">
          Last scanned: <code>{scannedData}</code>
        </p>
      )}

      {successPopup && (
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 
                        bg-green-600 text-white px-6 py-4 rounded-xl shadow-lg text-lg font-semibold 
                        z-50 transition-opacity duration-500"
        >
          ✅ Scanned Successfully!
        </div>
      )}
    </div>
  );
}
