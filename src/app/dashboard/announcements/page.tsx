'use client';

import { useState, useEffect } from 'react';
import { db } from '@/firebase/config';
import {
  collection,
  query,
  getDocs,
  orderBy,
  doc,
  getDoc,
  Timestamp,
} from 'firebase/firestore';
import { Megaphone, MapPin } from 'lucide-react';

interface Announcement {
  id: string;
  title: string;
  content: string;
  category: string;
  barangay: string;
  createdBy: string;
  createdAt: Timestamp;
  touristSpotId?: string;
  touristSpotName?: string;
  touristSpotImage?: string;
}

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        setLoading(true);
        setError(null);

        // 🔥 Fetch all announcements from Firestore
        const announcementsQuery = query(
          collection(db, 'announcements'),
          orderBy('createdAt', 'desc')
        );

        const querySnapshot = await getDocs(announcementsQuery);

        // Fetch and map linked tourist spot details
        const announcementsData: Announcement[] = await Promise.all(
          querySnapshot.docs.map(async (docSnap) => {
            const data = docSnap.data() as Omit<Announcement, 'id'>;

            let touristSpotName = data.touristSpotName || '';
            let touristSpotImage = '';

            if (data.touristSpotId) {
              const spotRef = doc(db, 'touristSpots', data.touristSpotId);
              const spotSnap = await getDoc(spotRef);
              if (spotSnap.exists()) {
                const spotData = spotSnap.data();
                touristSpotName = spotData.name || touristSpotName;
                touristSpotImage = spotData.imageUrl || '';
              }
            }

            return {
              id: docSnap.id,
              ...data,
              touristSpotName,
              touristSpotImage,
            } as Announcement;
          })
        );

        setAnnouncements(announcementsData);
      } catch (err) {
        console.error('Error fetching announcements:', err);
        setError(
          err instanceof Error
            ? err.message
            : 'Failed to load announcements. Please try again.'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchAnnouncements();
  }, []);

  // --- UI States ---
  if (loading)
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading announcements...</p>
        </div>
      </div>
    );

  if (error)
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      </div>
    );

  return (
    <div className="p-6 min-h-screen bg-gray-50">
      <div className="flex items-center gap-3 mb-6">
        <Megaphone className="w-6 h-6 text-green-600" />
        <h1 className="text-2xl font-bold text-gray-800">
          Latest Announcements
        </h1>
      </div>

      {announcements.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <p className="text-gray-500">No announcements available at the moment.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map((a) => (
            <div key={a.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1">
                  <p className="text-sm text-green-700 font-semibold mb-1">
                    {a.category || 'General'}
                  </p>
                  <h3 className="text-lg font-bold">{a.title}</h3>
                  <p className="text-gray-700 mt-2 whitespace-pre-line">{a.content}</p>

                  {a.touristSpotName && (
                    <div className="flex items-center gap-2 mt-3 text-sm text-gray-600">
                      <MapPin className="w-4 h-4 text-green-600" />
                      <span>{a.touristSpotName}</span>
                    </div>
                  )}

                  {a.touristSpotImage && (
                    <img
                      src={a.touristSpotImage}
                      alt={a.touristSpotName || 'Tourist Spot'}
                      className="mt-3 rounded-lg w-full max-h-64 object-cover"
                    />
                  )}
                </div>
              </div>

              <div className="mt-4 text-sm text-gray-500">
                Posted by {a.createdBy || 'Unknown'} •{' '}
                {a.createdAt?.toDate
                  ? a.createdAt.toDate().toLocaleString()
                  : 'No date'}
                <br />
                <span className="text-gray-400">Barangay: {a.barangay}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
