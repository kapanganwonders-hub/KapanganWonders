'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { storage, uploadFile, deleteFile } from '@/lib/appwrite';
import { db } from '@/firebase/config';
import { collection, query, where, getDocs, getDoc, addDoc, updateDoc, deleteDoc, doc, setDoc, DocumentReference } from 'firebase/firestore';
import { MapPin, Plus, Edit, Trash2, X } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from "@/components/lightswind/alert";
import ConfirmationDialog from '@/components/ui/confirmation-dialog';

interface Coordinates {
  lat: number;
  lng: number;
}
interface TouristSpot {
  id: string;
  name: string;
  detailedDescription: string;
  category: string;
  barangay: string;
  address: string;
  location: string;
  image: string;
  imageId?: string;
  images: string[];
  contact: string;
  entranceFee: string;
  entranceFees?: {
    adults: { amount: number };
    children: { amount: number };
    environmental: { amount: number };
    kids: { amount: number };
    pwd: { amount: number };
    seniors: { amount: number };
    tourGuide: { amount: number };
  };
  googleMapsLink: string;
  status: 'active' | 'inactive' | 'pending';
  coordinates?: Coordinates;
  lat?: number;
  lng?: number;
  submittedBy?: string;
  submittedByEmail?: string;
  submittedAt?: Date;
  reviewed?: boolean;
  createdAt: any;
  updatedAt: any;
}

export default function TouristSpotsPage() {
  const { currentUser, barangayAdminData } = useAuth();
  const [spots, setSpots] = useState<TouristSpot[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingSpot, setEditingSpot] = useState<string | null>(null);
  const [selectedSpot, setSelectedSpot] = useState<TouristSpot | null>(null);
  const [alertState, setAlertState] = useState<{ variant: 'success' | 'destructive' | 'warning' | 'info' | 'default'; message: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'active' | 'pending'>('active');
  const [viewingSpot, setViewingSpot] = useState<TouristSpot | null>(null);

  interface FormData {
    name: string;
    detailedDescription: string;
    category: string;
    barangay: string;
    address: string;
    location: string;
    contact: string;
    entranceFee: string;
    googleMapsLink: string;
    entranceFees: {
      adults: { amount: number };
      children: { amount: number };
      environmental: { amount: number };
      kids: { amount: number };
      pwd: { amount: number };
      seniors: { amount: number };
      tourGuide: { amount: number };
    };
  }

  const [formData, setFormData] = useState<FormData>({
    name: '',
    detailedDescription: '',
    category: 'Natural',
    barangay: '',
    address: '',
    location: '',
    contact: '',
    entranceFee: '',
    googleMapsLink: '',
    entranceFees: {
      adults: { amount: 55 },
      children: { amount: 0 },
      environmental: { amount: 120 },
      kids: { amount: 35 },
      pwd: { amount: 45 },
      seniors: { amount: 45 },
      tourGuide: { amount: 400 }
    }
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    fetchSpots();
  }, [barangayAdminData, activeTab]);

  const fetchSpots = async () => {
    if (!barangayAdminData?.barangay) return;
    
    try {
      setLoading(true);
      let q;
      
      if (activeTab === 'pending') {
        // For pending tab, fetch from pendingSpots collection
        q = query(
          collection(db, 'pendingSpots'),
          where('barangay', '==', barangayAdminData.barangay)
        );
      } else {
        // For active tab, show all approved spots from touristSpots
        q = query(
          collection(db, 'touristSpots'),
          where('barangay', '==', barangayAdminData.barangay)
        );
      }
      
      const querySnapshot = await getDocs(q);
      let spotsData = querySnapshot.docs.map(doc => {
        const data = doc.data();
        // Safely handle Firestore timestamps
        const safeToDate = (timestamp: any): Date | undefined => {
          if (!timestamp) return undefined;
          return typeof timestamp.toDate === 'function' ? timestamp.toDate() : new Date(timestamp);
        };
        
        return {
          id: doc.id,
          ...data,
          // Safely convert timestamps
          createdAt: safeToDate(data.createdAt) || new Date(),
          updatedAt: safeToDate(data.updatedAt) || new Date(),
          submittedAt: safeToDate(data.submittedAt)
        } as TouristSpot;
      });
      
      // No need to filter for pending spots since we're querying different collections
      
      setSpots(spotsData);
    } catch (error) {
      console.error('Error fetching spots:', error);
      setAlertState({ variant: 'destructive', message: 'Failed to load tourist spots. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  // Helper function to update spot status
  const updateSpotStatus = async (spotId: string, status: 'active' | 'inactive' | 'pending') => {
    const spotRef = doc(db, 'touristSpots', spotId);
    const spotDoc = await getDoc(spotRef);
    
    if (spotDoc.exists()) {
      // Update the spot status if it exists in touristSpots
      await updateDoc(spotRef, {
        status,
        updatedAt: new Date()
      });
    } else {
      // If spot doesn't exist in touristSpots, check pendingSpots
      const pendingSpotRef = doc(db, 'pendingSpots', spotId);
      const pendingSpotDoc = await getDoc(pendingSpotRef);
      
      if (pendingSpotDoc.exists()) {
        // Move from pendingSpots to touristSpots
        await setDoc(doc(db, 'touristSpots', spotId), {
          ...pendingSpotDoc.data(),
          status,
          updatedAt: new Date()
        });
        // Remove from pendingSpots
        await deleteDoc(pendingSpotRef);
      }
    }
    
    // Refresh the spots list
    await fetchSpots();
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Check file type
    if (!file.type.startsWith('image/')) {
      setAlertState({
        variant: 'destructive',
        message: 'Please upload an image file (JPEG, PNG, etc.)'
      });
      return;
    }

    // Check file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      setAlertState({
        variant: 'destructive',
        message: 'Image size should be less than 5MB'
      });
      return;
    }

    setImageFile(file);
    
    // Create preview URL
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.onerror = () => {
      setAlertState({
        variant: 'destructive',
        message: 'Failed to read the image file'
      });
    };
    reader.readAsDataURL(file);
  };

  const handleAddSpot = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!barangayAdminData) {
        throw new Error('No barangay admin data available. Please make sure you are logged in as a barangay admin.');
      }
      
      if (!imageFile) {
        setAlertState({
          variant: 'destructive',
          message: 'Please select an image for the tourist spot'
        });
        return;
      }
      
      if (!currentUser?.uid) {
        throw new Error('You must be logged in to submit a tourist spot.');
      }

      const barangayName =
        barangayAdminData.barangay ||
        barangayAdminData.barangayName ||
        barangayAdminData.displayName;

      if (!barangayName) throw new Error('Barangay name missing');

      // Upload image to Appwrite Storage
      const uploadedFile = await uploadFile(imageFile);
      const imageUrl = `https://cloud.appwrite.io/v1/storage/buckets/69062d080010accbfb9e/files/${uploadedFile.$id}/view?project=6905f83f00038caa24fb`;

      // Prepare spot data for pending approval
      const pendingSpotData: Omit<TouristSpot, 'id'> = {
        name: formData.name.trim(),
        detailedDescription: formData.detailedDescription,
        category: formData.category,
        barangay: barangayName,
        address: formData.address.trim(),
        location: formData.location || formData.address.trim(),
        contact: formData.contact,
        entranceFee: formData.entranceFee,
        googleMapsLink: formData.googleMapsLink,
        image: imageUrl,
        images: [imageUrl],
        imageId: uploadedFile.$id,
        status: 'pending',
        submittedBy: currentUser.uid,
        submittedByEmail: currentUser.email || '',
        submittedAt: new Date(),
        reviewed: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        entranceFees: formData.entranceFees
      };

      // Save to pendingSpots collection
      await addDoc(collection(db, 'pendingSpots'), pendingSpotData);
      
      // Reset form and show success message
      setShowAddForm(false);
      setImageFile(null);
      setImagePreview(null);
      
      setAlertState({
        variant: 'success',
        message: 'Tourist spot submitted for admin approval. It will be visible once approved.'
      });
      
      // Reset form data
      setFormData({
        name: '',
        detailedDescription: '',
        category: 'Natural',
        barangay: barangayName, // Keep the same barangay
        address: '',
        location: '',
        contact: '',
        entranceFee: '',
        googleMapsLink: '',
        entranceFees: {
          adults: { amount: 55 },
          children: { amount: 0 },
          environmental: { amount: 120 },
          kids: { amount: 35 },
          pwd: { amount: 45 },
          seniors: { amount: 45 },
          tourGuide: { amount: 400 }
        }
      });
      
      // Refresh the spots list
      await fetchSpots();
      
    } catch (error) {
      console.error('Error adding tourist spot:', error);
      setAlertState({
        variant: 'destructive',
        message: error instanceof Error ? error.message : 'Failed to add tourist spot. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSpot = async (spotId: string) => {
    if (!spotId) return;
    
    try {
      setLoading(true);
      
      // Get the current spot data to preserve existing fields
      const spotDoc = await getDoc(doc(db, 'touristSpots', spotId));
      if (!spotDoc.exists()) {
        throw new Error('Tourist spot not found');
      }
      const currentData = spotDoc.data() as TouristSpot;

      // Prepare update data
      const updateData: Partial<TouristSpot> = {
        name: formData.name,
        category: formData.category,
        address: formData.address,
        contact: formData.contact,
        entranceFee: formData.entranceFee,
        googleMapsLink: formData.googleMapsLink,
        detailedDescription: formData.detailedDescription,
        status: 'active',
        updatedAt: new Date()
      };

      // Handle image update if a new image was selected
      if (imageFile) {
        try {
          // Delete old image if it exists
          if (currentData.imageId) {
            try {
              await deleteFile(currentData.imageId);
            } catch (error) {
              console.warn('Failed to delete old image:', error);
              // Continue even if deletion fails
            }
          }

          // Upload new image
          const uploadedFile = await uploadFile(imageFile);
          const imageUrl = `https://cloud.appwrite.io/v1/storage/buckets/69062d080010accbfb9e/files/${uploadedFile.$id}/view?project=6905f83f00038caa24fb`;
          
          updateData.image = imageUrl;
          updateData.images = [imageUrl];
          updateData.imageId = uploadedFile.$id;
        } catch (error) {
          console.error('Error handling image upload:', error);
          throw new Error('Failed to upload image');
        }
      }
      
      await updateDoc(doc(db, 'touristSpots', spotId), updateData);
      
      // Reset form and fetch updated data
      setEditingSpot(null);
      setImageFile(null);
      setImagePreview(null);
      setShowAddForm(false);
     setFormData({
       name: '',
       detailedDescription: '',
       category: 'Natural',
       barangay: formData.barangay, // Preserve the current barangay
       address: '',
       location: formData.location || '', // Preserve location if exists
       contact: '',
       entranceFee: '',
       googleMapsLink: '',
       entranceFees: formData.entranceFees // Preserve the entrance fees structure
     });
      setAlertState({ 
        variant: 'success', 
        message: 'Tourist spot updated successfully' 
      });
      
      await fetchSpots();
    } catch (err) {
      console.error('Error updating tourist spot:', err);
      setAlertState({ 
        variant: 'destructive', 
        message: err instanceof Error ? err.message : 'Failed to update tourist spot' 
      });
    } finally {
      setLoading(false);
    }
  };


  // All hooks must be called at the top level, before any conditional returns
  const router = useRouter();

  // Auto-hide alert after 5 seconds
  useEffect(() => {
    if (alertState) {
      const timer = setTimeout(() => {
        setAlertState(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [alertState]);

  const handleViewDetails = (spot: TouristSpot) => {
    window.location.href = `/tourist-spots?id=${spot.id}`;
  };

  const handleEditNavigation = (spot: TouristSpot) => {
    // Use Next.js router for client-side navigation
    router.push(`/tourist-spots?spotId=${spot.id}&edit=true`);
  };

  const handleCloseDetails = () => setSelectedSpot(null);
  
  const handleViewSpot = (spot: TouristSpot) => {
    // Navigate to announcements page instead of showing spot details
    router.push('/barangay-admin/announcements');
  };
  
  const closeViewModal = () => {
    setViewingSpot(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Alert - Moved to bottom right */}
      {alertState && (
        <div className="fixed bottom-6 right-6 z-50 w-96 animate-fade-in-up">
          <Alert 
            variant={alertState.variant} 
            className="flex items-start gap-3 shadow-lg"
            withIcon
          >
            <div>
              <p className="font-medium">
                {alertState.variant === 'success' ? 'Success' : 
                 alertState.variant === 'destructive' ? 'Error' : 
                 alertState.variant === 'warning' ? 'Warning' : 'Info'}
              </p>
              <p className="text-sm">{alertState.message}</p>
            </div>
          </Alert>
        </div>
      )}
      
      {/* Add animation keyframes to your global CSS */}
      <style jsx global>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.3s ease-out forwards;
        }
      `}</style>

      {/* Header */}
      <div className="p-6 bg-white border-b flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Tourist Spots</h1>
          <p className="text-gray-600">
            Manage tourist spots in{' '}
            {barangayAdminData?.barangay ||
              barangayAdminData?.barangayName ||
              ''}
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
        >
          <Plus size={20} />
          Add Spot
        </button>
      </div>

      {/* Add Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 relative shadow-2xl border border-gray-200">
            <button
              onClick={() => setShowAddForm(false)}
              className="absolute top-4 right-4 bg-white rounded-full p-2 shadow hover:bg-gray-100"
            >
              <X size={20} />
            </button>
            <h2 className="text-xl font-bold mb-4">Add New Tourist Spot</h2>
            <form onSubmit={handleAddSpot} className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium mb-1">Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Category *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  className="w-full border rounded-lg px-3 py-2"
                >
                 <option value="Agricultural Heritage">Agricultural Heritage</option>
                        <option value="Natural Attractions">Natural Attractions</option>
                        <option value="Waterfalls">Waterfalls</option>
                        <option value="Caves">Caves</option>
                        <option value="Mountains & Hiking">Mountains & Hiking</option>
                        <option value="Cultural Heritage">Cultural Heritage</option>
                        <option value="Viewing Areas">Viewing Areas</option>
                        <option value="Gardens & Farms">Gardens & Farms</option>
                        <option value="Adventure & Recreation">Adventure & Recreation</option>
                        <option value="Infrastructure">Infrastructure</option>
                        <option value="Infrastructure">Camping</option>
                </select>
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Address *
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  required
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>

              {/* Contact */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Contact
                </label>
                <input
                  type="text"
                  value={formData.contact}
                  onChange={(e) =>
                    setFormData({ ...formData, contact: e.target.value })
                  }
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>

              {/* Entrance Fees */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Entrance Fees</h3>
                {Object.entries(formData.entranceFees).map(([feeType, fee]) => (
                  <div key={feeType} className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {feeType.charAt(0).toUpperCase() + feeType.slice(1)} (₱)
                      </label>
                      <input
                        type="number"
                        value={fee.amount === 0 ? '' : fee.amount}
                        onChange={(e) => {
                          const value = e.target.value;
                          // Convert to number, but keep as integer if no decimal
                          const numValue = value === '' ? 0 : (value.includes('.') ? parseFloat(value) : parseInt(value) || 0);
                          setFormData({
                            ...formData,
                            entranceFees: {
                              ...formData.entranceFees,
                              [feeType]: {
                                ...fee,
                                amount: numValue
                              }
                            }
                          });
                        }}
                        min="0"
                        step="1"
                        className="w-full border rounded-lg px-3 py-2"
                        placeholder="0"
                      />
                    </div>
                  </div>
                ))}
              </div>
              {/* Google Maps Link */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Google Maps Link
                </label>
                <input
                  type="url"
                  value={formData.googleMapsLink}
                  onChange={(e) =>
                    setFormData({ ...formData, googleMapsLink: e.target.value })
                  }
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="https://maps.google.com/..."
                />
              </div>

              {/* Detailed Description */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Detailed Description
                </label>
                <textarea
                  value={formData.detailedDescription}
                  onChange={(e) =>
                    setFormData({ ...formData, detailedDescription: e.target.value })
                  }
                  rows={4}
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="Provide more detailed information about this spot..."
                />
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Spot Image *
                </label>
                <div className="mt-1 flex items-center">
                  <label
                    htmlFor="image-upload"
                    className="cursor-pointer bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Choose File
                  </label>
                  <input
                    id="image-upload"
                    name="image-upload"
                    type="file"
                    className="sr-only"
                    accept="image/*"
                    onChange={handleImageChange}
                  />
                  {imageFile && (
                    <span className="ml-2 text-sm text-gray-600">
                      {imageFile.name}
                    </span>
                  )}
                </div>
                {imagePreview && (
                  <div className="mt-2">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="h-32 w-32 object-cover rounded"
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                >
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="p-6">
        <div className="mb-8">
          
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('active')}
                className={`${activeTab === 'active' 
                  ? 'border-indigo-500 text-indigo-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} 
                  whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Active Spots
              </button>
              <button
                onClick={() => setActiveTab('pending')}
                className={`${activeTab === 'pending' 
                  ? 'border-indigo-500 text-indigo-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} 
                  whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Pending Approval
              </button>
            </nav>
          </div>
        </div>

        {spots.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
            <MapPin size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-600">
              {activeTab === 'active' ? 'No tourist spots found' : 'No pending spots'}
            </h3>
            {activeTab === 'active' && (
              <p className="text-gray-500 mt-1">Get started by adding a new tourist spot using the 'Add New Spot' button above.</p>
            )}
          </div>
        ) : (
          <div className="grid gap-5">
            {spots.map((spot) => (
              <div key={spot.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                <div className="md:flex">
                  <div className="md:flex-shrink-0 md:w-48 h-48 bg-gray-100 relative">
                    {spot.images?.[0] || spot.image ? (
                      <img
                        src={spot.images?.[0] || spot.image}
                        alt={spot.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.onerror = null;
                          target.src = '';
                          target.parentElement!.innerHTML = `
                            <div class="w-full h-full flex items-center justify-center text-gray-400">
                              <MapPin size={32} />
                            </div>
                          `;
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <MapPin size={32} />
                      </div>
                    )}
                    <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                      {spot.category}
                    </div>
                  </div>
                  <div className="p-6 flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <h2 className="text-xl font-bold text-gray-800">{spot.name}</h2>
                      </div>
                      <div className="flex gap-2">
                        {spot.status === 'pending' ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewSpot(spot);
                            }}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="View Details"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                              <circle cx="12" cy="12" r="3"></circle>
                            </svg>
                          </button>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditNavigation(spot);
                            }}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="Edit"
                          >
                            <Edit size={18} />
                          </button>
                        )}
                        {activeTab === 'active' && (
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              try {
                                setLoading(true);
                                
                                // Navigate to announcements page with the spot ID
                                router.push(`/barangay-admin/announcements?spotId=${spot.id}`);
                              } catch (error) {
                                console.error('Error handling spot reopening:', error);
                                setAlertState({
                                  variant: 'destructive',
                                  message: 'Failed to process spot reopening. Please try again.'
                                });
                              } finally {
                                setLoading(false);
                              }
                            }}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
                            title="Manage Announcement"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                              <polyline points="22 4 12 14.01 9 11.01"></polyline>
                            </svg>
                          </button>
                        )}
                        {activeTab === 'pending' && (
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              // Move spot from pending to active
                              try {
                                setLoading(true);
                                const spotRef = doc(db, 'pendingSpots', spot.id);
                                const spotDoc = await getDoc(spotRef);
                                
                                if (spotDoc.exists()) {
                                  const spotData = spotDoc.data();
                                  // Add to touristSpots collection
                                  await setDoc(doc(db, 'touristSpots', spot.id), {
                                    ...spotData,
                                    status: 'active',
                                    updatedAt: new Date()
                                  });
                                  // Remove from pending
                                  await deleteDoc(spotRef);
                                  
                                  setAlertState({
                                    variant: 'success',
                                    message: 'Spot approved and moved to active spots'
                                  });
                                  await fetchSpots();
                                }
                              } catch (error) {
                                console.error('Error approving spot:', error);
                                setAlertState({
                                  variant: 'destructive',
                                  message: 'Failed to approve spot. Please try again.'
                                });
                              } finally {
                                setLoading(false);
                              }
                            }}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
                            title="Approve Spot"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                    
                    {spot.address && (
                      <div className="mt-3 flex items-center text-sm text-gray-500">
                        <MapPin className="w-4 h-4 mr-1.5 text-gray-400" />
                        <span>{spot.address}</span>
                      </div>
                    )}
                    
                    <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center text-sm">
                      {spot.contact && (
                        <div className="text-gray-500">
                          📞 {spot.contact}
                        </div>
                      )}
                      {spot.entranceFee && (
                        <div className="font-medium text-gray-700">
                          {spot.entranceFee === 'Free' ? 'Free Entry' : `Entrance: ${spot.entranceFee}`}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* View Spot Modal */}
      {viewingSpot && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold">{viewingSpot.name}</h2>
                <button 
                  onClick={closeViewModal}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="mb-6">
                {viewingSpot.images?.[0] ? (
                  <img 
                    src={viewingSpot.images[0]} 
                    alt={viewingSpot.name} 
                    className="w-full h-64 object-cover rounded-lg mb-4"
                  />
                ) : (
                  <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 mb-4">
                    <MapPin size={48} />
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <h3 className="font-semibold text-gray-700">Category</h3>
                    <p className="text-gray-600">{viewingSpot.category}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-700">Status</h3>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      viewingSpot.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : viewingSpot.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {viewingSpot.status}
                    </span>
                  </div>
                </div>
                
                <div className="mb-4">
                  <h3 className="font-semibold text-gray-700">Address</h3>
                  <p className="text-gray-600">{viewingSpot.address || 'Not specified'}</p>
                </div>
                
                {viewingSpot.contact && (
                  <div className="mb-4">
                    <h3 className="font-semibold text-gray-700">Contact</h3>
                    <p className="text-gray-600">{viewingSpot.contact}</p>
                  </div>
                )}
                
                <div className="mb-4">
                  <h3 className="font-semibold text-gray-700 mb-2">Entrance Fees</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {viewingSpot.entranceFees && Object.entries(viewingSpot.entranceFees).map(([feeType, fee]) => (
                      fee.amount > 0 && (
                        <div key={feeType} className="bg-gray-50 p-2 rounded">
                          <div className="text-sm font-medium text-gray-700">
                            {feeType.charAt(0).toUpperCase() + feeType.slice(1)}
                          </div>
                          <div className="text-sm text-gray-600">₱{fee.amount.toFixed(2)}</div>
                        </div>
                      )
                    ))}
                    {!viewingSpot.entranceFees && (
                      <p className="text-gray-500">No entrance fees specified</p>
                    )}
                  </div>
                </div>
                
                {viewingSpot.detailedDescription && (
                  <div className="mb-4">
                    <h3 className="font-semibold text-gray-700">Description</h3>
                    <p className="text-gray-600 whitespace-pre-line">{viewingSpot.detailedDescription}</p>
                  </div>
                )}
                
                {viewingSpot.googleMapsLink && (
                  <div className="mt-4">
                    <a 
                      href={viewingSpot.googleMapsLink} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline flex items-center"
                    >
                      <MapPin className="w-4 h-4 mr-1" />
                      View on Google Maps
                    </a>
                  </div>
                )}
                
              </div>
              
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={closeViewModal}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
