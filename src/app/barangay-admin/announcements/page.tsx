'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/firebase/config';
import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  where,
  doc,
  getDoc,
  Timestamp,
} from 'firebase/firestore';
import { Megaphone, MapPin, Save, X } from 'lucide-react';

interface TouristSpot {
  id: string;
  name: string;
  barangay: string;
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  category: string;
  barangay: string;
  createdBy: string;
  createdAt: any;
  touristSpotId?: string;
  touristSpotName?: string;
  touristSpotImage?: string;
}

export default function AnnouncementsPage() {
  const { currentUser, barangayAdminData } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'Tourist Spot Updates',
    touristSpotId: '',
  });
  const [touristSpots, setTouristSpots] = useState<TouristSpot[]>([]);
  const [loadingSpots, setLoadingSpots] = useState(false);

  const categories = [
    'Tourist Spot Updates',
    'Now Open',
    'Closure - Maintenance',
    'Closure - Weather Conditions',
    'Closure - Road Access',
    'Lost and Found',
  ];

  const isClosureCategory = formData.category.includes('Closure');
  const barangayName =
    barangayAdminData?.barangayName || barangayAdminData?.barangay || '';

  // ✅ Fetch announcements
  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const q = query(collection(db, 'announcements'), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);

        const announcementsData: Announcement[] = [];

        for (const docSnap of querySnapshot.docs) {
          const data = docSnap.data() as Announcement;
          let touristSpotName = '';
          let touristSpotImage = '';

          if (data.touristSpotId) {
            try {
              const spotRef = doc(db, 'touristSpots', data.touristSpotId);
              const spotSnap = await getDoc(spotRef);
              if (spotSnap.exists()) {
                const spotData = spotSnap.data();
                touristSpotName = spotData.name || '';
                touristSpotImage = spotData.image || '';
              }
            } catch (err) {
              console.error('Error fetching tourist spot details:', err);
            }
          }

          announcementsData.push({
            
            ...data,
            touristSpotName,
            touristSpotImage,
          });
        }

        setAnnouncements(announcementsData);
      } catch (err) {
        console.error('Error fetching announcements:', err);
        setError('Failed to load announcements.');
      } finally {
        setLoading(false);
      }
    };

    fetchAnnouncements();
  }, []);

  // ✅ Fetch tourist spots (for closure categories)
  useEffect(() => {
    const fetchSpots = async () => {
      if (!isClosureCategory || !barangayName) {
        setTouristSpots([]);
        return;
      }

      try {
        setLoadingSpots(true);
        const q = query(
          collection(db, 'touristSpots'),
          where('barangay', '==', barangayName)
        );
        const querySnapshot = await getDocs(q);
        const spots = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          name: doc.data().name || 'Unnamed Spot',
          barangay: doc.data().barangay,
        }));
        setTouristSpots(spots);
      } catch (err) {
        console.error('Error fetching tourist spots:', err);
      } finally {
        setLoadingSpots(false);
      }
    };

    fetchSpots();
  }, [isClosureCategory, barangayName]);

  // ✅ Handle add announcement
  const handleAddAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentUser || !barangayName) {
      alert('Missing barangay or user data.');
      return;
    }

    if (isClosureCategory && !formData.touristSpotId) {
      alert('Please select a tourist spot for closure announcements.');
      return;
    }

    try {
      setSaving(true);

      const newAnnouncement: any = {
        title: formData.title.trim(),
        content: formData.content.trim(),
        category: formData.category,
        barangay: barangayName,
        createdBy: currentUser.email,
        createdAt: Timestamp.now(),
      };

      if (isClosureCategory && formData.touristSpotId) {
        const selectedSpot = touristSpots.find(
          (spot) => spot.id === formData.touristSpotId
        );
        if (selectedSpot) {
          newAnnouncement.touristSpotId = selectedSpot.id;
          newAnnouncement.touristSpotName = selectedSpot.name;
        }
      }

      const docRef = await addDoc(collection(db, 'announcements'), newAnnouncement);
      setAnnouncements((prev) => [{ id: docRef.id, ...newAnnouncement }, ...prev]);

      setFormData({
        title: '',
        content: '',
        category: 'Tourist Spot Updates',
        touristSpotId: '',
      });

      setShowForm(false);
      alert('✅ Announcement added successfully!');
    } catch (err) {
      console.error('Error adding announcement:', err);
      alert('❌ Failed to add announcement.');
    } finally {
      setSaving(false);
    }
  };

  // ✅ Loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading announcements...</p>
        </div>
      </div>
    );
  }

  // ✅ Page Layout
  return (
    <div className="p-6 min-h-screen bg-gray-50">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Megaphone className="w-6 h-6 text-green-600" />
          <h1 className="text-2xl font-bold text-gray-800">
            Announcements for {barangayName || 'Barangay'}
          </h1>
        </div>

        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
        >
          {showForm ? 'Cancel' : 'Add Announcement'}
        </button>
      </div>

      {/* Add Form */}
      {showForm && (
        <form
          onSubmit={handleAddAnnouncement}
          className="bg-white p-6 rounded-lg shadow-md mb-8"
        >
          <h2 className="text-lg font-semibold mb-4">New Announcement</h2>

          {/* Category */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <select
              value={formData.category}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  category: e.target.value,
                  touristSpotId: '',
                })
              }
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Tourist Spot Selector */}
          {isClosureCategory && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Tourist Spot
              </label>
              {loadingSpots ? (
                <p className="text-gray-500">Loading tourist spots...</p>
              ) : touristSpots.length > 0 ? (
                <select
                  value={formData.touristSpotId}
                  onChange={(e) =>
                    setFormData({ ...formData, touristSpotId: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  required
                >
                  <option value="">-- Select --</option>
                  {touristSpots.map((spot) => (
                    <option key={spot.id} value={spot.id}>
                      {spot.name}
                    </option>
                  ))}
                </select>
              ) : (
                <p className="text-gray-500">No tourist spots found.</p>
              )}
            </div>
          )}

          {/* Title */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          </div>

          {/* Content */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Content
            </label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              rows={4}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
            >
              <X className="w-4 h-4" /> Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Announcement'}
            </button>
          </div>
        </form>
      )}

      {/* Announcements List */}
      {announcements.length === 0 ? (
        <p className="text-gray-500 text-center">No announcements available.</p>
      ) : (
        <div className="grid gap-4">
          {announcements.map((a) => (
            <div
              key={a.id}
              className="bg-white p-5 rounded-lg shadow border border-gray-200"
            >
              <span className="text-green-600 font-semibold text-sm">
                {a.category}
              </span>
              <h2 className="text-lg font-bold mt-1">{a.title}</h2>
              <p className="text-gray-700 mt-2 whitespace-pre-line">{a.content}</p>

              {a.touristSpotName && (
                <div className="mt-3 flex items-center text-sm text-gray-600">
                  <MapPin className="w-4 h-4 mr-1 text-green-500" />
                  <span>{a.touristSpotName}</span>
                </div>
              )}

              {a.touristSpotImage && (
                <img
                  src={a.touristSpotImage}
                  alt={a.touristSpotName || 'Tourist Spot'}
                  className="mt-3 rounded-lg w-full max-h-60 object-cover"
                />
              )}

              <div className="mt-3 text-xs text-gray-500">
                Posted by {a.createdBy} in {a.barangay}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
