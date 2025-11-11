'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/firebase/config';
import ConfirmationDialog from '@/components/ui/confirmation-dialog';
import { 
  collection, addDoc, getDocs, query, orderBy, where, doc, getDoc, deleteDoc, Timestamp, updateDoc
} from 'firebase/firestore';
import { Megaphone, MapPin, Trash2, Construction, CloudRain, Map, Search, Info, AlertCircle } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from "@/components/lightswind/alert";

interface TouristSpot {
  id: string;
  name: string;
  barangay: string;
  businessId?: string;
  businessName?: string;
  location?: string;
  status?: string;
  [key: string]: any; // Allow additional properties
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
  barangay?: string;
  businessName?: string;
  businessId?: string;
  privateSpotName?: string;
  createdBy: string;
  createdAt: Timestamp;
  touristSpotId?: string;
  touristSpotName?: string;
  touristSpotImage?: string;
  imageUrl?: string;
}

export default function AnnouncementsPage() {
  const { currentUser, privateSpotAdminData } = useAuth();
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
    category: 'Tourist Spot Updates',
    touristSpotId: '',
    imageFile: null as File | null,
    imagePreview: ''
  } as {
    title: string;
    content: string;
    category: string;
    touristSpotId: string;
    imageFile: File | null;
    imagePreview: string;
  });

  const [uploadingImage, setUploadingImage] = useState(false);

  const categories: Category[] = [
    { value: 'Tourist Spot Updates', label: 'Tourist Spot Updates', icon: <Map className="w-4 h-4 mr-2" />, emoji: 'ℹ️' },
    { value: 'Closure - Maintenance', label: 'Closure - Maintenance', icon: <Construction className="w-4 h-4 mr-2" />, emoji: '🚧' },
    { value: 'Closure - Weather Conditions', label: 'Closure - Weather', icon: <CloudRain className="w-4 h-4 mr-2" />, emoji: '⚠️' },
    { value: 'Closure - Road Access', label: 'Closure - Road Access', icon: <AlertCircle className="w-4 h-4 mr-2" />, emoji: '🛣️' },
    { value: 'Lost and Found', label: 'Lost and Found', icon: <Search className="w-4 h-4 mr-2" />, emoji: '🔍' },
    { value: 'New Tourist Spot Added', label: 'New Tourist Spot Added', icon: <Map className="w-4 h-4 mr-2" />, emoji: '🆕' }
  ];

  const getCategoryData = (categoryValue: string) => categories.find(cat => cat.value === categoryValue) || { value: categoryValue, label: categoryValue, icon: <Info className="w-4 h-4 mr-2" />, emoji: 'ℹ️' };

  const isLostAndFound = formData.category === 'Lost and Found';
  const isClosureCategory = formData.category.includes('Closure');
  const isSpotUpdate = formData.category === 'Tourist Spot Updates';
  const businessName = privateSpotAdminData?.privateSpotName || privateSpotAdminData?.businessName || privateSpotAdminData?.displayName || 'Your Business';

  // --- Auto-dismiss alert after 5 seconds ---
  useEffect(() => {
    if (!alert) return;
    const timer = setTimeout(() => setAlert(null), 5000);
    return () => clearTimeout(timer);
  }, [alert]);

  // Fetch announcements for the current admin only
  const fetchAnnouncements = async () => {
    if (!currentUser?.uid) return;
    
    setLoading(true);
    try {
      // Only fetch announcements created by the current admin
      const q = query(
        collection(db, 'announcements'), 
        where('createdBy', '==', currentUser.uid),
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

  // Fetch the private spot owner's tourist spot
  useEffect(() => {
    const fetchSpot = async () => {
      console.log('Fetching tourist spot for private spot owner:', privateSpotAdminData);
      
      // Always set some default spot data using business info
      const defaultSpot = {
        id: privateSpotAdminData?.touristSpotId || 'default',
        name: businessName,
        barangay: privateSpotAdminData?.barangay || '',
        businessId: privateSpotAdminData?.id || privateSpotAdminData?.uid || '',
        businessName: businessName,
        location: privateSpotAdminData?.location || '',
        status: 'active'
      };

      if (!privateSpotAdminData?.touristSpotId) {
        console.log('No touristSpotId found in privateSpotAdminData, using business info');
        setTouristSpots([defaultSpot]);
        setFormData(prev => ({
          ...prev,
          touristSpotId: 'default',
          title: generateTitle(prev.category, prev.content, businessName)
        }));
        return;
      }

      const category = formData.category;
      const isClosure = category.includes('Closure');
      const isUpdate = category === 'Tourist Spot Updates';
      
      if (!isClosure && !isUpdate) {
        setTouristSpots([]);
        return;
      }

      try {
        setLoadingSpots(true);
        // Fetch the specific tourist spot for this private spot owner
        const spotRef = doc(db, 'touristSpots', privateSpotAdminData.touristSpotId);
        const spotSnap = await getDoc(spotRef);
        
        if (spotSnap.exists()) {
          const spotData = spotSnap.data();
          const spot = {
            id: spotSnap.id,
            name: spotData.name || 'Unnamed Spot',
            barangay: spotData.barangay || '',
            businessId: spotData.businessId || '',
            businessName: spotData.businessName || '',
            location: spotData.location || '',
            status: spotData.status || 'active',
            ...spotData // Include all other spot data
          };
          
          setTouristSpots([spot]);
          
          // Auto-select the spot in the form
          setFormData(prev => ({
            ...prev,
            touristSpotId: spot.id,
            title: generateTitle(prev.category, prev.content, spot.name)
          }));
        } else {
          console.log('Tourist spot not found in database');
          setTouristSpots([{
            id: privateSpotAdminData.touristSpotId,
            name: businessName,
            barangay: privateSpotAdminData.barangay || '',
            businessId: privateSpotAdminData?.id || privateSpotAdminData?.uid || '',
            businessName: businessName,
            location: privateSpotAdminData?.location || '',
            status: 'active'
          }]);
          setFormData(prev => ({
            ...prev,
            touristSpotId: privateSpotAdminData.touristSpotId,
            title: generateTitle(prev.category, prev.content, businessName)
          }));
        }
      } catch (err) {
        console.error('Error fetching tourist spot:', err);
        setAlert({ type: 'destructive', message: `Error fetching tourist spot: ${err instanceof Error ? err.message : String(err)}` });
        setTouristSpots([]);
        setFormData(prev => ({ ...prev, touristSpotId: '' }));
      } finally { 
        setLoadingSpots(false); 
      }
    };

    fetchSpot();
  }, [formData.category, privateSpotAdminData?.touristSpotId]);

  // Expressive auto-generated title
  const generateTitle = (category: string, content: string, spotName?: string) => {
    const snippet = (content || '').split('.')[0].trim() || 'New announcement';
    const spotText = spotName ? `${spotName} ` : '';
    const cat = getCategoryData(category);
    switch(category) {
      case 'Tourist Spot Updates': return `📍 Update on ${spotText}: ${snippet}`;
      case 'Closure - Maintenance': return `🚧 Maintenance Alert: ${spotText}${snippet}`;
      case 'Closure - Weather Conditions': return `⚠️ Weather Alert at ${spotText}: ${snippet}`;
      case 'Closure - Road Access': return `🛣️ Road Access Notice: ${spotText}${snippet}`;
      case 'Lost and Found': return `🔍 Lost & Found: ${snippet}`;
      case 'New Tourist Spot Added': return `🆕 New Tourist Spot Added: ${snippet}`;
      default: return `${cat.emoji} ${snippet}`;
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    setFormData(prev => {
      const updatedData = { ...prev, [name]: value };

      // Only auto-generate title when changing category or tourist spot
      if (name === 'category' || name === 'touristSpotId') {
        const spot = touristSpots.find(s => s.id === (name === 'touristSpotId' ? value : prev.touristSpotId));
        updatedData.title = generateTitle(updatedData.category, updatedData.content, spot?.name);
      }

      return updatedData;
    });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setAlert({ type: 'destructive', message: 'Please upload an image file' });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setAlert({ type: 'destructive', message: 'Image size should be less than 5MB' });
      return;
    }
    setFormData(prev => ({
      ...prev,
      imageFile: file,
      imagePreview: URL.createObjectURL(file)
    }));
  };

  const uploadImage = async (file: File) => {
    setUploadingImage(true);
    try {
      const { uploadFile } = await import('@/lib/appwrite');
      const result = await uploadFile(file, 'lost-and-found');
      return result.url;
    } finally { setUploadingImage(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !privateSpotAdminData) return;
    setSaving(true);
    setAlert(null);
    try {
      let imageUrl = '';
      if (isLostAndFound && formData.imageFile) imageUrl = await uploadImage(formData.imageFile);

      // Get the business ID and name from the private spot admin data
      const businessId = privateSpotAdminData?.id || privateSpotAdminData?.uid || '';
      const businessNameToUse = businessName;

      const announcementData: any = {
        title: formData.title,
        content: formData.content,
        category: formData.category,
        businessName: businessNameToUse,
        businessId: businessId,
        privateSpotName: privateSpotAdminData?.privateSpotName,
        createdBy: currentUser.uid,
        createdAt: Timestamp.now(),
      };

      // For private spot admins, we'll always use their associated tourist spot
      const spot = touristSpots[0]; // Private spot admins only have one spot
      if (spot) {
        announcementData.touristSpotId = spot.id;
        announcementData.touristSpotName = spot.name;
        announcementData.barangay = spot.barangay;
      }

      if (isLostAndFound && imageUrl) announcementData.imageUrl = imageUrl;

      // Add the announcement
      const announcementRef = await addDoc(collection(db, 'announcements'), announcementData);
      
      console.log('Announcement saved successfully with ID:', announcementRef.id);
      
      // If this is a closure announcement, update the tourist spot status
      if (isClosureCategory && spot && spot.id !== 'default') {
        try {
          const spotRef = doc(db, 'touristSpots', spot.id);
          await updateDoc(spotRef, {
            status: 'inactive',
            closed: true,
            closedReason: formData.content,
            closedAt: Timestamp.now(),
            closedBy: currentUser.uid,
            closureAnnouncementId: announcementRef.id,
            businessId: businessId,
            businessName: businessNameToUse,
            lastUpdated: Timestamp.now()
          });
          
          console.log('Tourist spot marked as closed');
          setAlert({ 
            type: 'success', 
            message: isClosureCategory 
              ? 'Spot has been temporarily closed. An announcement has been created.'
              : 'Announcement has been created successfully.'
          });
        } catch (error) {
          console.error('Error updating tourist spot status:', error);
          // Don't fail the whole operation if the status update fails
          setAlert({ 
            type: 'warning', 
            message: 'Announcement created, but there was an error updating the spot status. Please try updating it manually.' 
          });
        }
      } else if (spot?.id === 'default') {
        // If we're using the default spot, just show a success message
        setAlert({ 
          type: 'success', 
          message: 'Announcement created. Note: Could not update spot status - no valid spot ID found.' 
        });
      }

      setFormData({ title: '', content: '', category: 'Tourist Spot Updates', touristSpotId: '', imageFile: null, imagePreview: '' });
      setShowForm(false);
      fetchAnnouncements();
      setAlert({ type: 'success', message: 'Announcement created successfully!' });
    } catch (error) {
      setAlert({ type: 'destructive', message: error instanceof Error ? error.message : 'Failed to create announcement' });
    } finally { setSaving(false); }
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

      // Auto-create "now open" announcement for closures and update spot status
      if (announcementData.category.includes('Closure') && announcementData.touristSpotId) {
        const spotName = announcementData.touristSpotName || '';
        const businessId = privateSpotAdminData?.id || privateSpotAdminData?.uid || '';
        const businessNameToUse = businessName;
        
        // Update the tourist spot status to open
        try {
          const spotRef = doc(db, 'touristSpots', announcementData.touristSpotId);
          await updateDoc(spotRef, {
            status: 'active',
            closed: false,
            closedReason: null,
            closedAt: null,
            closedBy: null,
            closureAnnouncementId: null,
            businessId: businessId,
            businessName: businessNameToUse,
            lastUpdated: Timestamp.now()
          });
          console.log('Tourist spot marked as open');
        } catch (error) {
          console.error('Error updating tourist spot status:', error);
          // Continue with creating the announcement even if spot update fails
        }

        // Create the "now open" announcement
        const nowOpenAnnouncement: Omit<Announcement, 'id'> = {
          title: `✅ ${spotName} is now open!`,
          content: `The previously closed tourist spot "${spotName}" is now open to visitors.`,
          category: 'Tourist Spot Updates',
          barangay: announcementData.barangay,
          businessName: businessNameToUse,
          businessId: businessId,
          privateSpotName: privateSpotAdminData?.privateSpotName,
          createdBy: currentUser?.uid || '',
          createdAt: Timestamp.now(),
          touristSpotId: announcementData.touristSpotId,
          touristSpotName: spotName
        };
        
        await addDoc(collection(db, 'announcements'), nowOpenAnnouncement);
        fetchAnnouncements();
        
        setAlert({ 
          type: 'success', 
          message: 'The spot has been marked as open and an announcement has been created.' 
        });
      }

      setAnnouncementToDelete(null);
      fetchAnnouncements(); // Refresh the announcements list
    } catch (error) {
      console.error('Error deleting announcement:', error);
      setAlert({ 
        type: 'destructive', 
        message: `Failed to delete announcement: ${error instanceof Error ? error.message : 'Unknown error'}` 
      });
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
          <h1 className="text-2xl font-bold">Announcements for {businessName}</h1>
          <button onClick={() => setShowForm(!showForm)} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg">
            {showForm ? 'Cancel' : 'Add Announcement'}
          </button>
        </div>

        {/* Add / Edit Form */}
        {showForm && (
          <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md space-y-4">
            <div>
              <label>Category</label>
              <select name="category" value={formData.category} onChange={handleInputChange} className="mt-1 block w-full border rounded-md p-2">
                {categories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>

            {(isClosureCategory || isSpotUpdate) && (
              <div>
                <label>Tourist Spot</label>
                {loadingSpots ? (
                  <div className="mt-1 p-2 bg-gray-100 rounded-md">Loading your tourist spot information...</div>
                ) : (
                  <div className="mt-1 p-4 bg-gray-50 border rounded-md space-y-2">
                    <div className="font-medium text-lg">{businessName}</div>
                    {touristSpots[0]?.name && (
                      <div className="text-sm font-medium">Tourist Spot: {touristSpots[0].name}</div>
                    )}
                    {touristSpots[0]?.barangay && (
                      <div className="text-sm text-gray-600">📍 {touristSpots[0].barangay}</div>
                    )}
                    <input type="hidden" name="touristSpotId" value={formData.touristSpotId} />
                  </div>
                )}
              </div>
            )}

            <div>
              <label>Title</label>
              <input type="text" name="title" value={formData.title} onChange={handleInputChange} placeholder="Enter title" className="mt-1 block w-full border rounded-md p-2" />
            </div>

            <div>
              <label>Content</label>
              <textarea name="content" value={formData.content} onChange={handleInputChange} rows={4} className="mt-1 block w-full border rounded-md p-2" />
            </div>

            {isLostAndFound && (
              <div>
                <label>Image (optional)</label>
                <input type="file" accept="image/*" onChange={handleImageChange} className="mt-1 block w-full border rounded-md p-2" />
                {formData.imagePreview && <img src={formData.imagePreview} alt="Preview" className="mt-2 w-32 h-32 object-cover rounded-lg border border-gray-200" />}
              </div>
            )}

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
                    <div className="flex justify-between items-start">
            <h2 className="font-bold text-xl">{a.title}</h2>
            {(a.businessName || a.privateSpotName || a.barangay) && (
              <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                {a.privateSpotName || a.businessName || a.barangay}
              </span>
            )}
          </div>
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