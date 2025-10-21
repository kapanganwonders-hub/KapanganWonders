'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { collection, addDoc, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { motion } from 'framer-motion';
import { QrCode, Camera, CheckCircle, XCircle, User, MapPin } from 'lucide-react';

export default function ScanQRPage() {
  const { privateSpotAdminData } = useAuth();
  const [scanning, setScanning] = useState(false);
  const [qrData, setQrData] = useState('');
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [selectedSpot, setSelectedSpot] = useState('');
  const [ownedSpots, setOwnedSpots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOwnedSpots = async () => {
      if (!privateSpotAdminData?.uid) return;

      try {
        const spotsQuery = query(
          collection(db, 'touristSpots'),
          where('ownerId', '==', privateSpotAdminData.uid),
          where('isPrivate', '==', true)
        );
        const spotsSnapshot = await getDocs(spotsQuery);
        const spots = spotsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setOwnedSpots(spots);
        
        if (spots.length > 0) {
          setSelectedSpot(spots[0].id);
        }
      } catch (error) {
        console.error('Error fetching owned spots:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOwnedSpots();
  }, [privateSpotAdminData]);

  const handleScanQR = async () => {
    if (!qrData.trim()) {
      setResult({ success: false, message: 'Please enter QR code data' });
      return;
    }

    if (!selectedSpot) {
      setResult({ success: false, message: 'Please select a tourist spot' });
      return;
    }

    try {
      setScanning(true);
      setResult(null);

      // Parse QR data (assuming format: userId or JSON with user info)
      let userId = qrData.trim();
      let userData: any = null;

      // Try to parse as JSON first
      try {
        const parsed = JSON.parse(qrData);
        userId = parsed.userId || parsed.uid || qrData;
      } catch {
        // Not JSON, use as-is
      }

      // Fetch user data
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        userData = userDoc.data();
      }

      // Get spot data
      const spotDoc = await getDoc(doc(db, 'touristSpots', selectedSpot));
      const spotData = spotDoc.exists() ? spotDoc.data() : null;

      // Record visit
      await addDoc(collection(db, 'visits'), {
        userId: userId,
        visitorName: userData?.displayName || 'Unknown Visitor',
        visitorEmail: userData?.email || '',
        spotId: selectedSpot,
        spotName: spotData?.name || 'Unknown Spot',
        visitDate: new Date().toISOString(),
        recordedBy: privateSpotAdminData?.uid,
        recordedByName: privateSpotAdminData?.displayName,
        checkInMethod: 'qr-scan',
        createdAt: new Date().toISOString(),
      });

      setResult({
        success: true,
        message: `Visit recorded successfully for ${userData?.displayName || 'visitor'}!`,
      });
      setQrData('');
    } catch (error) {
      console.error('Error recording visit:', error);
      setResult({
        success: false,
        message: 'Failed to record visit. Please try again.',
      });
    } finally {
      setScanning(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (ownedSpots.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <MapPin className="text-gray-400 mb-4" size={64} />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">No Tourist Spots</h2>
        <p className="text-gray-600 mb-4">You don't have any tourist spots yet.</p>
        <a
          href="/private-spot-admin/tourist-spots"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          Add Tourist Spot
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Scan QR Code</h1>
        <p className="text-gray-600 mt-1">Record visitor check-ins by scanning their QR codes</p>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Scanner Section */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-xl shadow-sm p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-blue-100 rounded-full">
              <QrCode className="text-blue-600" size={24} />
            </div>
            <h2 className="text-xl font-semibold text-gray-800">QR Scanner</h2>
          </div>

          {/* Select Spot */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Tourist Spot
            </label>
            <select
              value={selectedSpot}
              onChange={(e) => setSelectedSpot(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {ownedSpots.map((spot) => (
                <option key={spot.id} value={spot.id}>
                  {spot.name}
                </option>
              ))}
            </select>
          </div>

          {/* QR Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              QR Code Data
            </label>
            <textarea
              value={qrData}
              onChange={(e) => setQrData(e.target.value)}
              placeholder="Paste QR code data or user ID here..."
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-2">
              Paste the QR code data or enter the user ID manually
            </p>
          </div>

          {/* Scan Button */}
          <button
            onClick={handleScanQR}
            disabled={scanning || !qrData.trim() || !selectedSpot}
            className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Camera size={20} />
            {scanning ? 'Recording...' : 'Record Visit'}
          </button>

          {/* Result Message */}
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mt-4 p-4 rounded-lg flex items-start gap-3 ${
                result.success
                  ? 'bg-green-50 border border-green-200'
                  : 'bg-red-50 border border-red-200'
              }`}
            >
              {result.success ? (
                <CheckCircle className="text-green-600 flex-shrink-0" size={20} />
              ) : (
                <XCircle className="text-red-600 flex-shrink-0" size={20} />
              )}
              <p
                className={`text-sm ${
                  result.success ? 'text-green-800' : 'text-red-800'
                }`}
              >
                {result.message}
              </p>
            </motion.div>
          )}
        </motion.div>

        {/* Instructions */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-xl shadow-sm p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-purple-100 rounded-full">
              <User className="text-purple-600" size={24} />
            </div>
            <h2 className="text-xl font-semibold text-gray-800">How to Use</h2>
          </div>

          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold">
                1
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-1">Select Tourist Spot</h3>
                <p className="text-sm text-gray-600">
                  Choose which tourist spot the visitor is checking into
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold">
                2
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-1">Scan or Enter QR Data</h3>
                <p className="text-sm text-gray-600">
                  Ask the visitor to show their QR code and paste the data, or enter their user ID
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold">
                3
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-1">Record Visit</h3>
                <p className="text-sm text-gray-600">
                  Click the "Record Visit" button to log the visitor's check-in
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>Note:</strong> Make sure visitors have their QR codes ready before scanning.
              The system will automatically record the visit timestamp and visitor information.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
