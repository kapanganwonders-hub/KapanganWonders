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

export default function PrivateSpotScanPage() {
  const [scannedData, setScannedData] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [successPopup, setSuccessPopup] = useState(false);
  const [privateOwner, setPrivateOwner] = useState<any>(null);

  // Fetch logged-in private spot owner info
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) return;

      const ownerRef = doc(db, 'privateSpotOwners', user.uid);
      const ownerSnap = await getDoc(ownerRef);

      if (ownerSnap.exists()) {
        setPrivateOwner(ownerSnap.data());
      } else {
        console.warn('No private spot owner record found.');
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

      // Update visit status
      await updateDoc(visitRef, {
        status: 'Completed',
        completedAt: serverTimestamp(),
      });

      // Add to visitLogs
      await addDoc(collection(db, 'visitLogs'), {
        visitId: parsed.visitId,
        userId: parsed.userId,
        name: visitData.name || '',
        email: visitData.email || '',
        contactNumber: visitData.contactNumber || '',
        address: visitData.address || '',
        originType: visitData.originType || visitData.visitorType || 'domestic',
        spots: visitData.spots || [],
        purpose: visitData.purpose || '',
        date: visitData.date || '',
        numberOfVisitors: visitData.numberOfVisitors || 1,
        scannedBy: privateOwner?.displayName || 'private-spot-owner',
        scannedAt: serverTimestamp(),
        month: new Date().toLocaleString('default', { month: 'long' }),
        year: new Date().getFullYear(),
      });

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
      <h1 className="text-2xl font-bold text-blue-700 mb-4">
        Private Spot QR Scanner
      </h1>

      {privateOwner ? (
        <p className="mb-2 text-sm text-gray-700">
          Logged in as: <strong>{privateOwner.displayName}</strong>
        </p>
      ) : (
        <p className="mb-2 text-sm text-gray-500">Loading owner info...</p>
      )}

      <div className="w-full max-w-md border-4 border-blue-600 rounded-2xl overflow-hidden">
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
                     bg-blue-600 text-white px-6 py-4 rounded-xl shadow-lg text-lg font-semibold 
                     z-50 transition-opacity duration-500"
        >
          ✅ Scanned Successfully!
        </div>
      )}
    </div>
  );
}
