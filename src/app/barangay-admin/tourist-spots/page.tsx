'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
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

interface TouristSpot {
  id: string;
  name: string;
  description: string;
  detailedDescription?: string;
  category: string;
  barangay: string;
  address: string;
  location: string;
  image: string;
  images?: string[];
  contact?: string;
  entranceFee?: string;
  googleMapsLink?: string;
  status: 'active' | 'inactive';
  coordinates?: { lat: number; lng: number };
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

  interface FormData {
    name: string;
    description: string;
    category: string;
    address: string;
    contact: string;
    entranceFee: string;
    googleMapsLink: string;
    detailedDescription: string;
  }

  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    category: 'Natural',
    address: '',
    contact: '',
    entranceFee: '',
    googleMapsLink: '',
    detailedDescription: ''
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
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddSpot = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!barangayAdminData) throw new Error('No barangay admin data available');
      if (!imageFile) {
        alert('Please select an image for the tourist spot');
        return;
      }

      const barangayName =
        barangayAdminData.barangay ||
        barangayAdminData.barangayName ||
        barangayAdminData.displayName;

      if (!barangayName) throw new Error('Barangay name missing');

      // In a real implementation, you would upload the image to a storage service here
      // and get the download URL. For now, we'll just use the file name.
      const imageUrl = URL.createObjectURL(imageFile);

      const spotData = {
        ...formData,
        barangay: barangayName,
        location: formData.address,
        image: imageUrl,
        images: [imageUrl],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await addDoc(collection(db, 'touristSpots'), spotData);

      setFormData({
        name: '',
        description: '',
        category: 'Natural',
        address: '',
        contact: '',
        entranceFee: '',
        googleMapsLink: '',
        detailedDescription: ''
      });
      setImageFile(null);
      setImagePreview(null);
      setShowAddForm(false);
      fetchSpots();
    } catch (err) {
      console.error('Error adding tourist spot:', err);
      alert('Failed to add tourist spot');
    }
  };

  const handleUpdateSpot = async (spotId: string) => {
    try {
      // Get the current spot data to preserve existing fields
      const spotDoc = await getDoc(doc(db, 'touristSpots', spotId));
      if (!spotDoc.exists()) {
        throw new Error('Tourist spot not found');
      }
      const currentData = spotDoc.data() as TouristSpot;

      // Prepare update data
      const updateData: Partial<TouristSpot> = {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        address: formData.address,
        contact: formData.contact,
        entranceFee: formData.entranceFee,
        googleMapsLink: formData.googleMapsLink,
        detailedDescription: formData.detailedDescription,
        updatedAt: new Date()
      };

      // Handle image update if a new image was selected
      if (imageFile) {
        // In a real implementation, upload the image to storage here
        const imageUrl = URL.createObjectURL(imageFile);
        updateData.image = imageUrl;
        updateData.images = [imageUrl, ...(currentData.images || []).filter(Boolean)];
      }
      
      await updateDoc(doc(db, 'touristSpots', spotId), updateData);
      
      // Reset form and fetch updated data
      setEditingSpot(null);
      setImageFile(null);
      setImagePreview(null);
      fetchSpots();
    } catch (err) {
      console.error('Error updating tourist spot:', err);
      alert('Failed to update tourist spot');
    }
  };

  const handleDeleteSpot = async (spotId: string) => {
    if (!confirm('Are you sure you want to delete this tourist spot?')) return;
    try {
      await deleteDoc(doc(db, 'touristSpots', spotId));
      fetchSpots();
    } catch (err) {
      console.error('Error deleting spot:', err);
    }
  };

  const handleViewDetails = (spot: TouristSpot) => {
    window.location.href = `/tourist-spots?id=${spot.id}`;
  };

  const router = useRouter();

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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 relative">
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
                  <option value="Natural">Natural</option>
                  <option value="Cultural">Cultural</option>
                  <option value="Historical">Historical</option>
                  <option value="Adventure">Adventure</option>
                  <option value="Religious">Religious</option>
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

              {/* Entrance Fee */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Entrance Fee
                </label>
                <input
                  type="text"
                  value={formData.entranceFee}
                  onChange={(e) =>
                    setFormData({ ...formData, entranceFee: e.target.value })
                  }
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="e.g., Free or PHP 100.00"
                />
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

      {/* Spots List */}
      {spots.length === 0 ? (
        <div className="text-center py-12">
          <MapPin size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">
            No tourist spots found
          </h3>
          <p className="text-gray-500 mt-1">
            Get started by adding a new tourist spot.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
          {spots.map((spot) => (
            <div
              key={spot.id}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition"
            >
              <div
                className="h-48 bg-gray-200 relative group cursor-pointer"
                onClick={() => handleViewDetails(spot)}
              >
                {spot.images?.length ? (
                  <img
                    src={spot.images[0]}
                    alt={spot.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-100">
                    <MapPin size={32} className="text-gray-400" />
                  </div>
                )}
                <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                  {spot.category}
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-lg mb-1">{spot.name}</h3>
                <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                  {spot.description}
                </p>
                <div className="flex justify-between items-center">
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      spot.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {spot.status}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditNavigation(spot);
                      }}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteSpot(spot.id);
                      }}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
