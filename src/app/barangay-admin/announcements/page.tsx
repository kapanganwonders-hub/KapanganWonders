'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/firebase/config';
import ConfirmationDialog from '@/components/ui/confirmation-dialog';
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  orderBy, 
  where, 
  doc, 
  getDoc, 
  deleteDoc, 
  Timestamp 
} from 'firebase/firestore';
import { Megaphone, MapPin, Save, X, Trash2 } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from "@/components/lightswind/alert"

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
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [touristSpots, setTouristSpots] = useState<TouristSpot[]>([]);
  const [loadingSpots, setLoadingSpots] = useState(false);
  const [announcementToDelete, setAnnouncementToDelete] = useState<{id: string, title: string} | null>(null);
  const [alert, setAlert] = useState<{type: 'success' | 'destructive' | 'info' | 'warning', message: string} | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'Tourist Spot Updates',
    touristSpotId: '',
  });

  const categories = [
    'Tourist Spot Updates',
    'Closure - Maintenance',
    'Closure - Weather Conditions',
    'Closure - Road Access',
    'Lost and Found',
  ];

  const isClosureCategory = formData.category.includes('Closure');
  const barangayName =
    barangayAdminData?.barangayName || barangayAdminData?.barangay || '';

  // ✅ Fetch announcements
  const fetchAnnouncements = async () => {
    setLoading(true);
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
            setAlert({
            type: 'destructive',
            message: `Error fetching tourist spot details: ${err instanceof Error ? err.message : String(err)}`
          });
          }
        }

        announcementsData.push({
          ...data,
          touristSpotName,
          touristSpotImage,
          id: docSnap.id, // ✅ move last to avoid overwrite warning
        });
      }

      setAnnouncements(announcementsData);
    } catch (err) {
      setAlert({
        type: 'destructive',
        message: `Error fetching announcements: ${err instanceof Error ? err.message : String(err)}`
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  // ✅ Fetch tourist spots for closure categories
  useEffect(() => {
    const fetchSpots = async () => {
      if (!isClosureCategory || !barangayName) {
        setTouristSpots([]);
        return;
      }

      try {
        setLoadingSpots(true);
        const q = query(collection(db, 'touristSpots'), where('barangay', '==', barangayName));
        const querySnapshot = await getDocs(q);
        const spots = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          name: doc.data().name || 'Unnamed Spot',
          barangay: doc.data().barangay,
        }));
        setTouristSpots(spots);
      } catch (err) {
        setAlert({
          type: 'destructive',
          message: `Error fetching tourist spots: ${err instanceof Error ? err.message : String(err)}`
        });
      } finally {
        setLoadingSpots(false);
      }
    };

    fetchSpots();
  }, [isClosureCategory, barangayName]);

  // ✅ Delete announcement
  const handleDeleteAnnouncement = async () => {
    if (!currentUser || !announcementToDelete) return;

    try {
      await deleteDoc(doc(db, 'announcements', announcementToDelete.id));
      setAnnouncements(announcements.filter(a => a.id !== announcementToDelete.id));
      setAlert({ type: 'success', message: 'Announcement deleted successfully' });
      setAnnouncementToDelete(null);
    } catch (error) {
      console.error('Error deleting announcement:', error);
      setAlert({ type: 'destructive', message: 'Failed to delete announcement' });
      setAnnouncementToDelete(null);
    }
  };

  // ✅ Add announcement
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      if (!currentUser || !barangayName) {
        setAlert({
          type: 'destructive',
          message: 'Missing barangay or user data.'
        });
        return;
      }

      if (isClosureCategory && !formData.touristSpotId) {
        setAlert({
          type: 'destructive',
          message: 'Please select a tourist spot for closure announcements.'
        });
        return;
      }

      const newAnnouncement: any = {
        title: formData.title.trim(),
        content: formData.content.trim(),
        category: formData.category,
        barangay: barangayName,
        createdBy: currentUser.email,
        createdAt: Timestamp.now(), // ✅ Correct timestamp type
      };

      if (isClosureCategory && formData.touristSpotId) {
        const selectedSpot = touristSpots.find((spot) => spot.id === formData.touristSpotId);
        if (selectedSpot) {
          newAnnouncement.touristSpotId = selectedSpot.id;
          newAnnouncement.touristSpotName = selectedSpot.name;
        }
      }

      await addDoc(collection(db, 'announcements'), newAnnouncement);
      setFormData({ title: '', content: '', category: 'general', touristSpotId: '' });
      setShowForm(false);
      setAlert({
        type: 'success',
        message: 'Announcement created successfully!'
      });
      fetchAnnouncements();
    } catch (err) {
      setAlert({
        type: 'destructive',
        message: `Error creating announcement: ${err instanceof Error ? err.message : String(err)}`
      });
      setAlert({
        type: 'destructive',
        message: 'Failed to create announcement. Please try again.'
      });
    } finally {
      setSaving(false);
    }
  };

  // Auto-dismiss alert after 5 seconds
  useEffect(() => {
    if (alert) {
      const timer = setTimeout(() => {
        setAlert(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [alert]);

  // ✅ Loading State
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
      {alert && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md w-full">
          <div className={`bg-white rounded-lg border-l-4 ${
            alert.type === 'success' ? 'border-green-500' : 
            alert.type === 'destructive' ? 'border-red-500' :
            alert.type === 'warning' ? 'border-yellow-500' : 'border-blue-500'
          } shadow-lg`}>
            <Alert variant={alert.type} withIcon className="bg-white">
              <AlertTitle className="font-medium">
                {alert.type === 'success' ? 'Success!' : 
                 alert.type === 'destructive' ? 'Error' : 
                 alert.type.charAt(0).toUpperCase() + alert.type.slice(1)}
              </AlertTitle>
              <AlertDescription>{alert.message}</AlertDescription>
            </Alert>
          </div>
        </div>
      )}
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
          onSubmit={handleSubmit}
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
                setFormData({ ...formData, category: e.target.value, touristSpotId: '' })
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
      <div className="space-y-6">
        {announcements.length === 0 ? (
          <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 text-center">
            <Megaphone className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-600">No announcements yet</h3>
            <p className="text-gray-500 mt-1">Click 'Add Announcement' to create your first announcement</p>
          </div>
        ) : (
          <div className="grid gap-5">
            {announcements.map((a) => (
              <div
                key={`${a.id}-${a.createdAt?.seconds || ''}`}
                className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-200"
              >
                <div className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700">
                        {a.category}
                      </span>
                      <h2 className="text-xl font-bold mt-2 text-gray-800">{a.title}</h2>
                    </div>
                    <button
                      type="button"
                      className="text-red-600 hover:text-red-800"
                      onClick={() => setAnnouncementToDelete({ id: a.id, title: a.title })}
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>

                  <p className="mt-3 text-gray-600 leading-relaxed">{a.content}</p>

                  {a.touristSpotName && (
                    <div className="mt-4 flex items-center text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg inline-flex">
                      <MapPin className="w-4 h-4 mr-2 text-green-500 flex-shrink-0" />
                      <span className="font-medium">{a.touristSpotName}</span>
                    </div>
                  )}

                  <div className="mt-5 pt-4 border-t border-gray-100 flex justify-between items-center text-sm">
                    <span className="text-gray-500">
                      Barangay {a.barangay}
                    </span>
                    <span className="text-gray-400 text-xs">
                      {a.createdAt?.toDate ? new Date(a.createdAt.toDate()).toLocaleString() : 'Recently'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <ConfirmationDialog
          isOpen={!!announcementToDelete}
          onClose={() => setAnnouncementToDelete(null)}
          onConfirm={handleDeleteAnnouncement}
          title="Delete Announcement"
          message={`Are you sure you want to delete the announcement "${announcementToDelete?.title}"? This action cannot be undone.`}
          confirmText="Delete Announcement"
          cancelText="Cancel"
        />
      </div>
  </div>
);
}
