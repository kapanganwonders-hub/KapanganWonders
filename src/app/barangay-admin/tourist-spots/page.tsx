'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/firebase/config';
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc, Timestamp } from 'firebase/firestore';
import { MapPin, Plus, Edit, Trash2, Save, X } from 'lucide-react';

interface TouristSpot {
  id: string;
  name: string;
  description: string;
  category: string;
  barangay: string;
  address: string;
  coordinates?: { lat: number; lng: number };
  images?: string[];
  status: 'active' | 'inactive';
  createdAt: any;
  updatedAt: any;
}

export default function TouristSpotsPage() {
  const { currentUser, barangayAdminData } = useAuth();
  const [spots, setSpots] = useState<TouristSpot[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingSpot, setEditingSpot] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'Natural',
    address: '',
    status: 'active' as 'active' | 'inactive'
  });

  useEffect(() => {
    if (barangayAdminData?.barangayName) {
      fetchSpots();
    }
  }, [barangayAdminData]);

  const fetchSpots = async () => {
    try {
      setLoading(true);
      const spotsRef = collection(db, 'touristSpots');
      const spotsQuery = query(
        spotsRef,
        where('barangay', '==', barangayAdminData?.barangayName)
      );
      const spotsSnapshot = await getDocs(spotsQuery);
      const spotsData = spotsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as TouristSpot[];
      setSpots(spotsData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching tourist spots:', error);
      setLoading(false);
    }
  };

  const handleAddSpot = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'touristSpots'), {
        ...formData,
        barangay: barangayAdminData?.barangayName,
        createdBy: currentUser?.uid,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      setShowAddForm(false);
      setFormData({
        name: '',
        description: '',
        category: 'Natural',
        address: '',
        status: 'active'
      });
      fetchSpots();
    } catch (error) {
      console.error('Error adding tourist spot:', error);
      alert('Failed to add tourist spot');
    }
  };

  const handleUpdateSpot = async (spotId: string) => {
    try {
      const spotRef = doc(db, 'touristSpots', spotId);
      await updateDoc(spotRef, {
        ...formData,
        updatedAt: Timestamp.now()
      });
      setEditingSpot(null);
      setFormData({
        name: '',
        description: '',
        category: 'Natural',
        address: '',
        status: 'active'
      });
      fetchSpots();
    } catch (error) {
      console.error('Error updating tourist spot:', error);
      alert('Failed to update tourist spot');
    }
  };

  const handleDeleteSpot = async (spotId: string) => {
    if (!confirm('Are you sure you want to delete this tourist spot?')) return;
    
    try {
      await deleteDoc(doc(db, 'touristSpots', spotId));
      fetchSpots();
    } catch (error) {
      console.error('Error deleting tourist spot:', error);
      alert('Failed to delete tourist spot');
    }
  };

  const startEdit = (spot: TouristSpot) => {
    setEditingSpot(spot.id);
    setFormData({
      name: spot.name,
      description: spot.description,
      category: spot.category,
      address: spot.address,
      status: spot.status
    });
  };

  const cancelEdit = () => {
    setEditingSpot(null);
    setFormData({
      name: '',
      description: '',
      category: 'Natural',
      address: '',
      status: 'active'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading tourist spots...
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="p-6 bg-white border-b flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <MapPin size={28} />
            Tourist Spots
          </h1>
          <p className="text-gray-600 mt-1">
            Manage tourist spots in {barangayAdminData?.barangayName}
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition flex items-center gap-2"
        >
          <Plus size={20} />
          Add Spot
        </button>
      </div>

      <div className="p-6">
        {/* Add Form Modal */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold mb-4">Add New Tourist Spot</h2>
              <form onSubmit={handleAddSpot} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description *
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="Natural">Natural</option>
                    <option value="Cultural">Cultural</option>
                    <option value="Historical">Historical</option>
                    <option value="Adventure">Adventure</option>
                    <option value="Religious">Religious</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address *
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddForm(false);
                      cancelEdit();
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
                  >
                    Add Spot
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Spots List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {spots.map((spot) => (
            <div key={spot.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              {editingSpot === spot.id ? (
                <div className="p-4">
                  <form onSubmit={(e) => { e.preventDefault(); handleUpdateSpot(spot.id); }} className="space-y-3">
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                      placeholder="Name"
                    />
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                      rows={3}
                      placeholder="Description"
                    />
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                    >
                      <option value="Natural">Natural</option>
                      <option value="Cultural">Cultural</option>
                      <option value="Historical">Historical</option>
                      <option value="Adventure">Adventure</option>
                      <option value="Religious">Religious</option>
                    </select>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                      placeholder="Address"
                    />
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })}
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        className="flex-1 bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 transition flex items-center justify-center gap-1"
                      >
                        <Save size={16} />
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={cancelEdit}
                        className="flex-1 bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600 transition flex items-center justify-center gap-1"
                      >
                        <X size={16} />
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                <>
                  <div className="h-48 bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center">
                    <MapPin size={48} className="text-white" />
                  </div>
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-semibold text-gray-800">{spot.name}</h3>
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          spot.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {spot.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{spot.description}</p>
                    <div className="space-y-1 text-sm text-gray-500 mb-4">
                      <p><strong>Category:</strong> {spot.category}</p>
                      <p><strong>Address:</strong> {spot.address}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => startEdit(spot)}
                        className="flex-1 bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition flex items-center justify-center gap-1"
                      >
                        <Edit size={16} />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteSpot(spot.id)}
                        className="flex-1 bg-red-500 text-white py-2 rounded-lg hover:bg-red-600 transition flex items-center justify-center gap-1"
                      >
                        <Trash2 size={16} />
                        Delete
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>

        {spots.length === 0 && (
          <div className="text-center py-12">
            <MapPin size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500 text-lg">No tourist spots yet</p>
            <p className="text-gray-400 text-sm">Click "Add Spot" to create your first tourist spot</p>
          </div>
        )}
      </div>
    </div>
  );
}
