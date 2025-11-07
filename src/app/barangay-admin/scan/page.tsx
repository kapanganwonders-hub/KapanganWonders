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
import { db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export default function BarangayScanPage() {
  const [scannedData, setScannedData] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [successPopup, setSuccessPopup] = useState(false);
  const [barangayName, setBarangayName] = useState<string | null>(null);

  // 🟢 Get barangay info of the logged-in admin
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) return;

      // Assuming barangay admin info is stored in `/users/{uid}`
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        setBarangayName(userSnap.data().barangay || null);
      }
    });

    return () => unsub();
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

      // 🚫 Check barangay restriction
      const visitBarangays = visitData.barangays || [];
      if (!barangayName || !visitBarangays.includes(barangayName)) {
        alert(`🚫 You are not allowed to scan visits for other barangays.`);
        setScanning(false);
        return;
      }

      // ✅ Update visit status
      await updateDoc(visitRef, {
        status: 'Completed',
        completedAt: serverTimestamp(),
      });

      // ✅ Add visit log
      await addDoc(collection(db, 'visitLogs'), {
        visitId: parsed.visitId,
        userId: parsed.userId,
        name: visitData.fullName || '',
        email: visitData.email || '',
        originType: visitData.originType || 'domestic',
        barangays: visitData.barangays || [],
        spots: visitData.spots || [],
        date: visitData.date || '',
        numberOfVisitors: visitData.numberOfVisitors || 1,
        scannedBy: barangayName,
        scannedAt: serverTimestamp(),
        month: new Date().toLocaleString('default', { month: 'long' }),
        year: new Date().getFullYear(),
      });

      // ✅ Popup and reset
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
      <h1 className="text-2xl font-bold text-green-700 mb-2">
        Barangay QR Scanner
      </h1>
      {barangayName && (
        <p className="text-gray-600 mb-4 text-sm">
          Logged in as: <strong>{barangayName}</strong> Admin
        </p>
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
