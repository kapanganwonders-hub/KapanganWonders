'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/firebase/config';
import ConfirmationDialog from '@/components/ui/confirmation-dialog';
import { 
  collection, addDoc, getDocs, query, orderBy, where, doc, getDoc, deleteDoc, Timestamp 
} from 'firebase/firestore';
import { Megaphone, MapPin, Trash2, Construction, CloudRain, Map, Search, Info, AlertCircle, Calendar } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from "@/components/lightswind/alert";

interface TouristSpot {
  id: string;
  name: string;
  barangay: string;
}

interface Category {
  value: string;
  label: string;
  icon: React.ReactNode;
  emoji: string;
}

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
  imageUrl?: string;
}

// Kapangan admin email constant
const KAPANGAN_ADMIN_EMAIL = 'kapanganwonders@gmail.com';

export default function AnnouncementsPage() {
  const { currentUser, barangayAdminData, isAdmin } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [touristSpots, setTouristSpots] = useState<TouristSpot[]>([]);
  const [loadingSpots, setLoadingSpots] = useState(false);
  const [alert, setAlert] = useState<{type: 'success' | 'destructive' | 'info' | 'warning', message: string} | null>(null);
  const [announcementToDelete, setAnnouncementToDelete] = useState<{id: string, title: string} | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'General Announcement',
    touristSpotId: '',
    imageFile: null as File | null,
    imagePreview: ''
  });

  const [uploadingImage, setUploadingImage] = useState(false);

  const categories: Category[] = [
    { value: 'General Announcement', label: 'General Announcement', icon: <Megaphone className="w-4 h-4 mr-2" />, emoji: '📢' },
    { value: 'Event Update', label: 'Event Update', icon: <Calendar className="w-4 h-4 mr-2" />, emoji: '📅' },
    { value: 'System Notice', label: 'System Notice', icon: <AlertCircle className="w-4 h-4 mr-2" />, emoji: 'ℹ️' },
    { value: 'Road Closure', label: 'Road Closure', icon: <AlertCircle className="w-4 h-4 mr-2" />, emoji: '🚧' },
    { value: 'Weather Update', label: 'Weather Update', icon: <CloudRain className="w-4 h-4 mr-2" />, emoji: '⛈️' }
  ];

  const getCategoryData = (categoryValue: string) => categories.find(cat => cat.value === categoryValue) || { value: categoryValue, label: categoryValue, icon: <Info className="w-4 h-4 mr-2" />, emoji: 'ℹ️' };

  const barangayName = 'Kapangan'; // Set to Kapangan for main admin

  // --- Auto-dismiss alert after 5 seconds ---
  useEffect(() => {
    if (!alert) return;
    const timer = setTimeout(() => setAlert(null), 5000);
    return () => clearTimeout(timer);
  }, [alert]);

  // Fetch announcements
  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, 'announcements'),
        where('createdBy', '==', KAPANGAN_ADMIN_EMAIL),
        orderBy('createdAt', 'desc')
      );
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
            setAlert({ type: 'destructive', message: `Error fetching tourist spot details: ${err instanceof Error ? err.message : String(err)}` });
          }
        }

        announcementsData.push({
          ...data,
          touristSpotName,
          touristSpotImage,
          id: docSnap.id
        });
      }

      setAnnouncements(announcementsData);
    } catch (err) {
      setAlert({ type: 'destructive', message: `Error fetching announcements: ${err instanceof Error ? err.message : String(err)}` });
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchAnnouncements(); }, []);

  // Removed tourist spot fetching logic

  // Simplified title generation
  const generateTitle = (category: string, currentTitle: string = '') => {
    // Don't auto-generate if the user has already modified the title
    if (currentTitle && currentTitle.trim() !== '') return currentTitle;
    
    const today = new Date();
    const dateStr = today.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    
    switch(category) {
      case 'General Announcement':
        return `Important Update - ${dateStr}`;
      case 'Event Update':
        return `Upcoming Event - ${dateStr}`;
      case 'System Notice':
        return `System Notice - ${dateStr}`;
      case 'Road Closure':
        return `Road Closure Notice - ${dateStr}`;
      case 'Weather Update':
        return `Weather Alert - ${today.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}`;
      default:
        return `Announcement - ${dateStr}`;
    }
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const category = e.target.value;
    // Always generate a new title when category changes, but preserve existing title if user modified it
    const currentTitle = formData.title;
    const defaultTitle = generateTitle(category, ''); // Force generate default title
    
    // Only update title if it matches one of our auto-generated patterns or is empty
    const isAutoGenerated = categories.some(cat => {
      const prefix = generateTitle(cat.value, '').split(' - ')[0];
      return currentTitle.startsWith(prefix) || currentTitle === '';
    });
    
    setFormData(prev => ({
      ...prev,
      category,
      title: isAutoGenerated ? defaultTitle : prev.title
    }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Added: send emails to tourists after creating an announcement
  const sendAnnouncementEmails = async (subject: string, message: string, barangayFilter?: string) => {
    try {
      // Fetch all users and collect emails, but only for tourists.
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const emailsSet = new Set<string>();

      usersSnapshot.forEach(u => {
        const data = u.data() as any;
        if (!data) return;

        // Determine role field (flexible to common variations)
        const role = (data.role || data.userType || data.accountType || '').toString().toLowerCase();

        // Only include tourists
        if (role !== 'tourist') return;

        // Optional barangay filter (if user has barangay field)
        if (barangayFilter && data.barangay && data.barangay !== barangayFilter) return;

        // Only include users with a valid email string
        const email = typeof data.email === 'string' ? data.email.trim() : '';
        if (!email) return;

        emailsSet.add(email);
      });

      const emails = Array.from(emailsSet);
      if (emails.length === 0) {
        setAlert({ type: 'info', message: 'No tourist recipient emails found to send announcement.' });
        return { success: false, message: 'No recipients' };
      }

      // Call server API to send email
      const res = await fetch('/api/send-announcement-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, message, emails })
      });

      const result = await res.json();
      if (!res.ok) {
        const msg = result?.error || 'Failed to send announcement emails';
        setAlert({ type: 'destructive', message: msg });
        return { success: false, message: msg };
      }

      setAlert({ type: 'success', message: 'Emails sent to tourists successfully.' });
      return { success: true };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setAlert({ type: 'destructive', message: `Email send failed: ${msg}` });
      return { success: false, message: msg };
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted');
    
    // Basic validation
    if (!formData.title.trim() || !formData.content.trim()) {
      setAlert({ type: 'destructive', message: 'Please fill in all required fields' });
      return;
    }

    // Check for either main admin or barangay admin
    if (!isAdmin && !barangayAdminData) {
      setAlert({ type: 'destructive', message: 'Not authorized' });
      return;
    }

    setSaving(true);
    setAlert(null);
    
    try {
      console.log('Creating announcement with data:', formData);
      
      const announcementData = {
        title: formData.title.trim(),
        content: formData.content.trim(),
        category: formData.category,
        barangay: barangayName,
        createdBy: KAPANGAN_ADMIN_EMAIL,
        createdAt: Timestamp.now(),
        // Include optional fields if they exist
        ...(formData.touristSpotId && { touristSpotId: formData.touristSpotId }),
      };

      console.log('Saving to Firestore...');
      const docRef = await addDoc(collection(db, 'announcements'), announcementData);
      console.log('Document written with ID: ', docRef.id);

      // Reset form
      setFormData({ 
        title: '', 
        content: '', 
        category: 'General Announcement', 
        touristSpotId: '', 
        imageFile: null, 
        imagePreview: '' 
      });
      
      setShowForm(false);
      await fetchAnnouncements(); // Wait for refresh to complete

      // Send emails to users (tourists)
      // Use announcement title as subject and content as message. You can adapt formatting as needed.
      await sendAnnouncementEmails(announcementData.title, announcementData.content, announcementData.barangay);

      setAlert({ type: 'success', message: 'Announcement created successfully!' });
    } catch (error) {
      console.error('Error submitting announcement:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create announcement';
      setAlert({ type: 'destructive', message: errorMessage });
    } finally { 
      setSaving(false); 
    }
  };

  // Delete announcement with auto "now open" generation for closures
  const handleDeleteAnnouncement = async () => {
    if (!announcementToDelete) return;

    try {
      const announcementDoc = await getDoc(doc(db, 'announcements', announcementToDelete.id));
      if (!announcementDoc.exists()) throw new Error('Announcement not found');
      const announcementData = announcementDoc.data() as Announcement;

      await deleteDoc(doc(db, 'announcements', announcementToDelete.id));
      setAnnouncements(prev => prev.filter(a => a.id !== announcementToDelete.id));
      setAlert({ type: 'success', message: 'Announcement deleted successfully!' });

      // Auto-create "now open" announcement for closures
      if (announcementData.category.includes('Closure') && announcementData.touristSpotId) {
        const spotName = announcementData.touristSpotName || '';
        const nowOpenAnnouncement = {
          title: `✅ ${spotName} is now open!`,
          content: `The previously closed tourist spot "${spotName}" is now open to visitors.`,
          category: 'Tourist Spot Updates',
          barangay: announcementData.barangay,
          createdBy: KAPANGAN_ADMIN_EMAIL,
          createdAt: Timestamp.now(),
          touristSpotId: announcementData.touristSpotId,
          touristSpotName: spotName
        };
        await addDoc(collection(db, 'announcements'), nowOpenAnnouncement);
        fetchAnnouncements();
      }

      setAnnouncementToDelete(null);
    } catch (err) {
      console.error('Error deleting announcement:', err);
      setAlert({ type: 'destructive', message: 'Failed to delete announcement' });
      setAnnouncementToDelete(null);
    }
  };

  if (loading) return <p className="text-center mt-10">Loading announcements...</p>;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      {/* Alert Notification */}
      {alert && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md w-full animate-slide-up">
          <div
            className={`bg-white rounded-lg border-l-4 ${
              alert.type === 'success' ? 'border-green-500' :
              alert.type === 'destructive' ? 'border-red-500' :
              alert.type === 'warning' ? 'border-yellow-500' : 'border-blue-500'
            } shadow-lg`}
          >
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

      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Announcements for {barangayName || 'Barangay'}</h1>
          <button onClick={() => setShowForm(!showForm)} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg">
            {showForm ? 'Cancel' : 'Add Announcement'}
          </button>
        </div>

        {/* Add / Edit Form */}
        {showForm && (
          <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md space-y-4">
            <div>
              <label>Category</label>
              <select 
                name="category" 
                value={formData.category} 
                onChange={handleCategoryChange} 
                className="mt-1 block w-full border rounded-md p-2"
              >
                {categories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>


            <div>
              <label>Title</label>
              <input type="text" name="title" value={formData.title} onChange={handleInputChange} placeholder="Enter title" className="mt-1 block w-full border rounded-md p-2" />
            </div>

            <div>
              <label>Content</label>
              <textarea name="content" value={formData.content} onChange={handleInputChange} rows={4} className="mt-1 block w-full border rounded-md p-2" />
            </div>


            <button type="submit" disabled={saving || uploadingImage} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg">
              {saving ? 'Saving...' : 'Submit Announcement'}
            </button>
          </form>
        )}

        {/* Announcements List */}
        <div className="mt-8 space-y-6">
          {announcements.length === 0 ? <p className="text-center text-gray-500">No announcements yet.</p> : announcements.map(a => (
            <div key={a.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex gap-6">
                {(a.touristSpotImage || a.imageUrl) && (
                  <img src={a.touristSpotImage || a.imageUrl} alt={a.title} className="w-32 h-32 object-cover rounded-lg" />
                )}
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <h2 className="font-bold text-xl">{a.title}</h2>
                    <button onClick={() => setAnnouncementToDelete({ id: a.id, title: a.title })} className="text-red-600 hover:text-red-800">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                  <p className="mt-2 text-gray-600">{a.content}</p>
                  {a.touristSpotName && <span className="text-sm text-gray-500 mt-1 flex items-center gap-1"><MapPin className="w-4 h-4" />{a.touristSpotName}</span>}
                  <span className="text-xs text-gray-400 mt-2 block">{a.createdAt ? new Date(a.createdAt.seconds * 1000).toLocaleString() : 'Recently'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

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