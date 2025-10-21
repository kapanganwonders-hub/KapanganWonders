'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  doc, 
  updateDoc, 
  deleteDoc 
} from 'firebase/firestore';
import { motion } from 'framer-motion';
import { 
  MapPin, 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X,
  Image as ImageIcon
} from 'lucide-react';

export default function TouristSpotsPage() {
  const { privateSpotAdminData } = useAuth();
  const [spots, setSpots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingSpot, setEditingSpot] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'Nature',
    location: '',
    latitude: '',
    longitude: '',
    entryFee: '',
    openingHours: '',
    contactNumber: '',
    imageUrl: '',
  });

  useEffect(() => {
    fetchSpots();
  }, [privateSpotAdminData]);

  const fetchSpots = async () => {
    if (!privateSpotAdminData?.uid) return;

    try {
      const spotsQuery = query(
        collection(db, 'touristSpots'),
        where('ownerId', '==', privateSpotAdminData.uid),
        where('isPrivate', '==', true)
      );
      const spotsSnapshot = await getDocs(spotsQuery);
      const spotsData = spotsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSpots(spotsData);
    } catch (error) {
      console.error('Error fetching spots:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAddSpot = async () => {
    if (!formData.name || !formData.description || !formData.location) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      await addDoc(collection(db, 'touristSpots'), {
        ...formData,
        ownerId: privateSpotAdminData?.uid,
        ownerName: privateSpotAdminData?.displayName,
        isPrivate: true,
        status: 'Active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      alert('Tourist spot added successfully!');
      setShowAddForm(false);
      setFormData({
        name: '',
        description: '',
        category: 'Nature',
        location: '',
        latitude: '',
        longitude: '',
        entryFee: '',
        openingHours: '',
        contactNumber: '',
        imageUrl: '',
      });
      fetchSpots();
    } catch (error) {
      console.error('Error adding spot:', error);
      alert('Failed to add tourist spot');
    }
  };

  const handleEditSpot = (spot: any) => {
    setEditingSpot(spot.id);
    setFormData({
      name: spot.name || '',
      description: spot.description || '',
      category: spot.category || 'Nature',
      location: spot.location || '',
      latitude: spot.latitude || '',
      longitude: spot.longitude || '',
      entryFee: spot.entryFee || '',
      openingHours: spot.openingHours || '',
      contactNumber: spot.contactNumber || '',
      imageUrl: spot.imageUrl || '',
    });
  };

  const handleUpdateSpot = async () => {
    if (!editingSpot) return;

    try {
      await updateDoc(doc(db, 'touristSpots', editingSpot), {
        ...formData,
        updatedAt: new Date().toISOString(),
      });

      alert('Tourist spot updated successfully!');
      setEditingSpot(null);
      setFormData({
        name: '',
        description: '',
        category: 'Nature',
        location: '',
        latitude: '',
        longitude: '',
        entryFee: '',
        openingHours: '',
        contactNumber: '',
        imageUrl: '',
      });
      fetchSpots();
    } catch (error) {
      console.error('Error updating spot:', error);
      alert('Failed to update tourist spot');
    }
  };

  const handleDeleteSpot = async (spotId: string) => {
    if (!window.confirm('Are you sure you want to delete this tourist spot?')) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'touristSpots', spotId));
      alert('Tourist spot deleted successfully!');
      fetchSpots();
    } catch (error) {
      console.error('Error deleting spot:', error);
      alert('Failed to delete tourist spot');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Tourist Spots</h1>
          <p className="text-gray-600 mt-1">Manage your private tourist spots</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <Plus size={20} />
          Add Spot
        </button>
      </div>

      {/* Add/Edit Form */}
      {(showAddForm || editingSpot) && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-sm p-6"
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">
              {editingSpot ? 'Edit Tourist Spot' : 'Add New Tourist Spot'}
            </h2>
            <button
              onClick={() => {
                setShowAddForm(false);
                setEditingSpot(null);
                setFormData({
                  name: '',
                  description: '',
                  category: 'Nature',
                  location: '',
                  latitude: '',
                  longitude: '',
                  entryFee: '',
                  openingHours: '',
                  contactNumber: '',
                  imageUrl: '',
                });
              }}
              className="text-gray-500 hover:text-gray-700"
            >
              <X size={24} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Spot name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="Nature">Nature</option>
                <option value="Historical">Historical</option>
                <option value="Cultural">Cultural</option>
                <option value="Adventure">Adventure</option>
                <option value="Recreational">Recreational</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Describe the tourist spot"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Address or location"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Latitude</label>
              <input
                type="text"
                name="latitude"
                value={formData.latitude}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., 16.5833"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Longitude</label>
              <input
                type="text"
                name="longitude"
                value={formData.longitude}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., 120.5833"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Entry Fee</label>
              <input
                type="text"
                name="entryFee"
                value={formData.entryFee}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., ₱50 or Free"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Opening Hours</label>
              <input
                type="text"
                name="openingHours"
                value={formData.openingHours}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., 8:00 AM - 5:00 PM"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Contact Number</label>
              <input
                type="text"
                name="contactNumber"
                value={formData.contactNumber}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., 09123456789"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Image URL</label>
              <input
                type="text"
                name="imageUrl"
                value={formData.imageUrl}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="https://example.com/image.jpg"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={() => {
                setShowAddForm(false);
                setEditingSpot(null);
              }}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              onClick={editingSpot ? handleUpdateSpot : handleAddSpot}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <Save size={20} />
              {editingSpot ? 'Update' : 'Add'} Spot
            </button>
          </div>
        </motion.div>
      )}

      {/* Spots List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {spots.length > 0 ? (
          spots.map((spot) => (
            <motion.div
              key={spot.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition"
            >
              {spot.imageUrl ? (
                <img
                  src={spot.imageUrl}
                  alt={spot.name}
                  className="w-full h-48 object-cover"
                />
              ) : (
                <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                  <ImageIcon className="text-gray-400" size={48} />
                </div>
              )}

              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-lg font-semibold text-gray-800">{spot.name}</h3>
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                    {spot.category}
                  </span>
                </div>

                <p className="text-sm text-gray-600 mb-3 line-clamp-2">{spot.description}</p>

                <div className="flex items-center text-sm text-gray-500 mb-4">
                  <MapPin size={16} className="mr-1" />
                  {spot.location}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditSpot(spot)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition"
                  >
                    <Edit size={16} />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteSpot(spot.id)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition"
                  >
                    <Trash2 size={16} />
                    Delete
                  </button>
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <MapPin className="mx-auto text-gray-400 mb-4" size={64} />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No Tourist Spots Yet</h3>
            <p className="text-gray-600 mb-4">Start by adding your first tourist spot</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Add Your First Spot
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
