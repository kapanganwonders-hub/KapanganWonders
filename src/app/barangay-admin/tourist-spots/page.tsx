'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { storage, uploadFile, deleteFile } from '@/lib/appwrite';
import { db } from '@/firebase/config';
import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  doc
} from 'firebase/firestore';
import { MapPin, Plus, Edit, Trash2, X } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from "@/components/lightswind/alert";
import ConfirmationDialog from '@/components/ui/confirmation-dialog';

interface TouristSpot {
  id: string;
  name: string;
  detailedDescription?: string;
  category: string;
  barangay: string;
  address: string;
  location: string;
  image: string;
  imageId?: string;
  images?: string[];
  contact?: string;
  entranceFee?: string;
  googleMapsLink?: string;
  status: 'active' | 'inactive';
  coordinates?: { lat: number; lng: number };
  lat: number;
  lng: number;
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
  const [spotToDelete, setSpotToDelete] = useState<{ id: string; name: string } | null>(null);

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
    if (barangayAdminData) fetchSpots();
  }, [barangayAdminData]);

  const fetchSpots = async () => {
    try {
      setLoading(true);
      if (!barangayAdminData) return;

      const barangayName =
        barangayAdminData.barangay ||
        barangayAdminData.barangayName ||
        barangayAdminData.displayName;

      if (!barangayName) {
        console.error('No barangay name found');
        setLoading(false);
        return;
      }

      const spotsRef = collection(db, 'touristSpots');
      const spotsQuery = query(spotsRef, where('barangay', '==', barangayName));
      const snapshot = await getDocs(spotsQuery);

      const spotsData = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          ...data,
          images: data.images || [data.image].filter(Boolean)
        } as TouristSpot;
      });

      setSpots(spotsData);
    } catch (err) {
      console.error('Error fetching tourist spots:', err);
    } finally {
      setLoading(false);
    }
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
    try {
      if (!barangayAdminData) throw new Error('No barangay admin data available');
      if (!imageFile) {
        setAlertState({
          variant: 'destructive',
          message: 'Please select an image for the tourist spot'
        });
        return;
      }

      const barangayName =
        barangayAdminData.barangay ||
        barangayAdminData.barangayName ||
        barangayAdminData.displayName;

      if (!barangayName) throw new Error('Barangay name missing');

      // Upload image to Appwrite Storage
      const uploadedFile = await uploadFile(imageFile);
      const imageUrl = `https://cloud.appwrite.io/v1/storage/buckets/69062d080010accbfb9e/files/${uploadedFile.$id}/view?project=6905f83f00038caa24fb`;

      const spotData = {
        ...formData,
        barangay: barangayName,
        location: formData.address,
        image: imageUrl,
        images: [imageUrl],
        imageId: uploadedFile.$id, // Store the file ID for future reference
        status: 'active', // Set default status
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await addDoc(collection(db, 'touristSpots'), spotData);
      setShowAddForm(false);
      setFormData({
        name: '',
        detailedDescription: '',
        category: 'Natural',
        barangay: formData.barangay, // Preserve the barangay
        address: '',
        location: formData.location || '', // Preserve location if exists
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
      setAlertState({ variant: 'success', message: 'Tourist spot added successfully' });
      fetchSpots();
    } catch (err) {
      console.error('Error adding spot:', err);
      setAlertState({ variant: 'destructive', message: 'Failed to add tourist spot' });
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

  const handleDeleteSpot = async () => {
    if (!spotToDelete) return;

    try {
      setLoading(true);
      
      // Get the spot data first to get the image ID
      const spotDoc = await getDoc(doc(db, 'touristSpots', spotToDelete.id));
      if (spotDoc.exists()) {
        const spotData = spotDoc.data() as TouristSpot;
        
        // Delete the associated image from Appwrite Storage if it exists
        if (spotData.imageId) {
          try {
            await deleteFile(spotData.imageId);
          } catch (error) {
            console.warn('Failed to delete image from storage:', error);
            // Continue with spot deletion even if image deletion fails
          }
        }
      }

      // Delete the spot document from Firestore
      await deleteDoc(doc(db, 'touristSpots', spotToDelete.id));
      
      setAlertState({
        variant: 'success',
        message: 'Tourist spot deleted successfully'
      });
      
      await fetchSpots();
    } catch (err) {
      console.error('Error deleting spot:', err);
      setAlertState({
        variant: 'destructive',
        message: err instanceof Error ? err.message : 'Failed to delete tourist spot'
      });
    } finally {
      setSpotToDelete(null);
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
                  Add Spot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Spots List - Updated to match announcements style */}
      <div className="p-6">
        {spots.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
            <MapPin size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-600">No tourist spots found</h3>
            <p className="text-gray-500 mt-1">Get started by adding a new tourist spot.</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <Plus size={16} className="mr-2" />
              Add First Spot
            </button>
          </div>
        ) : (
          <div className="grid gap-5">
            {spots.map((spot) => (
              <div
                key={spot.id}
                className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="md:flex">
                  <div className="md:flex-shrink-0 md:w-48 h-48 bg-gray-100 relative">
                    {spot.images?.length ? (
                      <img
                        src={spot.images[0]}
                        alt={spot.name}
                        className="w-full h-full object-cover"
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
                        <div className="mt-1 flex items-center">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            spot.status === 'active' 
                              ? 'bg-green-100 text-green-800 border border-green-200' 
                              : 'bg-gray-100 text-gray-800 border border-gray-200'
                          }`}>
                            {spot.status}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
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
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (spot?.id && spot?.name) {
                              setSpotToDelete({ id: spot.id, name: spot.name });
                            } else {
                              setAlertState({ variant: 'destructive', message: 'Cannot delete this spot. Missing required data.' });
                            }
                          }}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
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
      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={!!spotToDelete}
        onClose={() => setSpotToDelete(null)}
        onConfirm={handleDeleteSpot}
        title="Delete Tourist Spot"
        message={`Are you sure you want to delete "${spotToDelete?.name}"? This action cannot be undone.`}
        confirmText="Delete Spot"
        cancelText="Cancel"
      />
    </div>
  );
};
