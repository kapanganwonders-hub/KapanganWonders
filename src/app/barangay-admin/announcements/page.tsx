'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/firebase/config';
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc, Timestamp, orderBy } from 'firebase/firestore';
import { Megaphone, Plus, Edit, Trash2, Save, X, Calendar } from 'lucide-react';

interface Announcement {
  id: string;
  title: string;
  content: string;
  barangay: string;
  priority: 'low' | 'medium' | 'high';
  status: 'active' | 'inactive';
  createdBy: string;
  createdAt: any;
  updatedAt: any;
}

export default function AnnouncementsPage() {
  const { currentUser, barangayAdminData } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    status: 'active' as 'active' | 'inactive'
  });

  useEffect(() => {
    if (barangayAdminData?.barangayName) {
      fetchAnnouncements();
    }
  }, [barangayAdminData]);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const announcementsRef = collection(db, 'announcements');
      const announcementsQuery = query(
        announcementsRef,
        where('barangay', '==', barangayAdminData?.barangayName),
        orderBy('createdAt', 'desc')
      );
      const announcementsSnapshot = await getDocs(announcementsQuery);
      const announcementsData = announcementsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Announcement[];
      setAnnouncements(announcementsData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching announcements:', error);
      setLoading(false);
    }
  };

  const handleAddAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'announcements'), {
        ...formData,
        barangay: barangayAdminData?.barangayName,
        createdBy: currentUser?.uid,
        createdByName: currentUser?.displayName || 'Barangay Admin',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      setShowAddForm(false);
      setFormData({
        title: '',
        content: '',
        priority: 'medium',
        status: 'active'
      });
      fetchAnnouncements();
    } catch (error) {
      console.error('Error adding announcement:', error);
      alert('Failed to add announcement');
    }
  };

  const handleUpdateAnnouncement = async (announcementId: string) => {
    try {
      const announcementRef = doc(db, 'announcements', announcementId);
      await updateDoc(announcementRef, {
        ...formData,
        updatedAt: Timestamp.now()
      });
      setEditingAnnouncement(null);
      setFormData({
        title: '',
        content: '',
        priority: 'medium',
        status: 'active'
      });
      fetchAnnouncements();
    } catch (error) {
      console.error('Error updating announcement:', error);
      alert('Failed to update announcement');
    }
  };

  const handleDeleteAnnouncement = async (announcementId: string) => {
    if (!confirm('Are you sure you want to delete this announcement?')) return;
    
    try {
      await deleteDoc(doc(db, 'announcements', announcementId));
      fetchAnnouncements();
    } catch (error) {
      console.error('Error deleting announcement:', error);
      alert('Failed to delete announcement');
    }
  };

  const startEdit = (announcement: Announcement) => {
    setEditingAnnouncement(announcement.id);
    setFormData({
      title: announcement.title,
      content: announcement.content,
      priority: announcement.priority,
      status: announcement.status
    });
  };

  const cancelEdit = () => {
    setEditingAnnouncement(null);
    setFormData({
      title: '',
      content: '',
      priority: 'medium',
      status: 'active'
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading announcements...
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="p-6 bg-white border-b flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Megaphone size={28} />
            Announcements
          </h1>
          <p className="text-gray-600 mt-1">
            Manage announcements for {barangayAdminData?.barangayName}
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition flex items-center gap-2"
        >
          <Plus size={20} />
          New Announcement
        </button>
      </div>

      <div className="p-6">
        {/* Add Form Modal */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold mb-4">Create New Announcement</h2>
              <form onSubmit={handleAddAnnouncement} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Content *
                  </label>
                  <textarea
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    required
                    rows={6}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Priority *
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as 'low' | 'medium' | 'high' })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
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
                    Create Announcement
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Announcements List */}
        <div className="space-y-4">
          {announcements.map((announcement) => (
            <div key={announcement.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              {editingAnnouncement === announcement.id ? (
                <div className="p-6">
                  <form onSubmit={(e) => { e.preventDefault(); handleUpdateAnnouncement(announcement.id); }} className="space-y-4">
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg"
                      placeholder="Title"
                    />
                    <textarea
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg"
                      rows={4}
                      placeholder="Content"
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <select
                        value={formData.priority}
                        onChange={(e) => setFormData({ ...formData, priority: e.target.value as 'low' | 'medium' | 'high' })}
                        className="px-4 py-2 border rounded-lg"
                      >
                        <option value="low">Low Priority</option>
                        <option value="medium">Medium Priority</option>
                        <option value="high">High Priority</option>
                      </select>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })}
                        className="px-4 py-2 border rounded-lg"
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        className="flex-1 bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 transition flex items-center justify-center gap-2"
                      >
                        <Save size={18} />
                        Save Changes
                      </button>
                      <button
                        type="button"
                        onClick={cancelEdit}
                        className="flex-1 bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600 transition flex items-center justify-center gap-2"
                      >
                        <X size={18} />
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-xl font-semibold text-gray-800">{announcement.title}</h3>
                        <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(announcement.priority)}`}>
                          {announcement.priority}
                        </span>
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            announcement.status === 'active'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {announcement.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                        <Calendar size={14} />
                        {announcement.createdAt?.toDate?.()?.toLocaleDateString() || 'N/A'}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => startEdit(announcement)}
                        className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => handleDeleteAnnouncement(announcement.id)}
                        className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                  <p className="text-gray-700 whitespace-pre-wrap">{announcement.content}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        {announcements.length === 0 && (
          <div className="text-center py-12">
            <Megaphone size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500 text-lg">No announcements yet</p>
            <p className="text-gray-400 text-sm">Click "New Announcement" to create your first announcement</p>
          </div>
        )}
      </div>
    </div>
  );
}
