'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/firebase/config';
import { collection, query, where, getDocs, addDoc, Timestamp } from 'firebase/firestore';
import { QrCode, CheckCircle, XCircle, Camera } from 'lucide-react';

export default function ScanQRPage() {
  const { currentUser, barangayAdminData } = useAuth();
  const [scanning, setScanning] = useState(false);
  const [scannedData, setScannedData] = useState<any>(null);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setScanning(true);
      setMessage('');
    } catch (error) {
      console.error('Error accessing camera:', error);
      setMessage('Failed to access camera. Please check permissions.');
      setMessageType('error');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setScanning(false);
  };

  const handleManualInput = async (qrCode: string) => {
    if (!qrCode.trim()) {
      setMessage('Please enter a QR code');
      setMessageType('error');
      return;
    }

    try {
      // Parse QR code data (assuming format: visitId:userId:spotId)
      const [visitId, userId, spotId] = qrCode.split(':');

      if (!visitId || !userId || !spotId) {
        setMessage('Invalid QR code format');
        setMessageType('error');
        return;
      }

      // Fetch visit details
      const visitsRef = collection(db, 'visits');
      const visitQuery = query(visitsRef, where('__name__', '==', visitId));
      const visitSnapshot = await getDocs(visitQuery);

      if (visitSnapshot.empty) {
        setMessage('Visit not found');
        setMessageType('error');
        return;
      }

      const visitData = visitSnapshot.docs[0].data();

      // Verify the visit belongs to this barangay
      if (visitData.barangay !== barangayAdminData?.barangayName) {
        setMessage('This visit is not for your barangay');
        setMessageType('error');
        return;
      }

      // Check if already checked in
      if (visitData.checkedIn) {
        setMessage('This visit has already been checked in');
        setMessageType('error');
        setScannedData(visitData);
        return;
      }

      // Record the check-in
      await addDoc(collection(db, 'checkIns'), {
        visitId,
        userId,
        spotId,
        barangay: barangayAdminData?.barangayName,
        checkedInBy: currentUser?.uid,
        checkedInAt: Timestamp.now(),
        adminName: currentUser?.displayName || 'Barangay Admin'
      });

      setScannedData({
        ...visitData,
        checkedIn: true
      });
      setMessage('Check-in successful!');
      setMessageType('success');

    } catch (error) {
      console.error('Error processing QR code:', error);
      setMessage('Error processing QR code');
      setMessageType('error');
    }
  };

  return (
    <div className="min-h-screen">
      <div className="p-6 bg-white border-b">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <QrCode size={28} />
          Scan QR Code
        </h1>
        <p className="text-gray-600 mt-1">
          Scan tourist visit QR codes to check them in
        </p>
      </div>

      <div className="p-6">
        <div className="max-w-2xl mx-auto">
          {/* Camera Scanner */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">Camera Scanner</h2>
            
            {!scanning ? (
              <button
                onClick={startCamera}
                className="w-full bg-green-500 text-white py-3 rounded-lg hover:bg-green-600 transition flex items-center justify-center gap-2"
              >
                <Camera size={20} />
                Start Camera
              </button>
            ) : (
              <div>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full rounded-lg mb-4"
                />
                <button
                  onClick={stopCamera}
                  className="w-full bg-red-500 text-white py-3 rounded-lg hover:bg-red-600 transition"
                >
                  Stop Camera
                </button>
                <p className="text-sm text-gray-500 mt-2 text-center">
                  Note: QR code scanning requires a QR code scanner library. 
                  Use manual input below for now.
                </p>
              </div>
            )}
          </div>

          {/* Manual Input */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">Manual Input</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                handleManualInput(formData.get('qrCode') as string);
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enter QR Code
                </label>
                <input
                  type="text"
                  name="qrCode"
                  placeholder="visitId:userId:spotId"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 transition"
              >
                Process QR Code
              </button>
            </form>
          </div>

          {/* Message Display */}
          {message && (
            <div
              className={`rounded-lg p-4 mb-6 flex items-center gap-2 ${
                messageType === 'success'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}
            >
              {messageType === 'success' ? (
                <CheckCircle size={20} />
              ) : (
                <XCircle size={20} />
              )}
              {message}
            </div>
          )}

          {/* Scanned Data Display */}
          {scannedData && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold mb-4">Visit Details</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Tourist:</span>
                  <span className="font-medium">{scannedData.userName || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Spot:</span>
                  <span className="font-medium">{scannedData.spotName || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Visit Date:</span>
                  <span className="font-medium">
                    {scannedData.visitDate || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Companions:</span>
                  <span className="font-medium">
                    {scannedData.companions?.length || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span
                    className={`font-medium ${
                      scannedData.checkedIn ? 'text-green-600' : 'text-yellow-600'
                    }`}
                  >
                    {scannedData.checkedIn ? 'Checked In' : 'Pending'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
