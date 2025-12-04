'use client';

import { useEffect, useState } from 'react';
import {
  collection,
  query,
  where,
  updateDoc,
  doc,
  onSnapshot,
  getDocs,
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '@/lib/firebase';
import { motion } from 'framer-motion';
import { deleteDoc } from 'firebase/firestore';
import { Calendar, MapPin, Mail, Phone, XCircle, Clock } from 'lucide-react';

// Simple safe date formatting helper
const formatDate = (d: any) => {
  try {
    if (!d) return 'N/A';
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return String(d);
    return dt.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return String(d);
  }
};

export default function MyTravelsPage() {
  const [user, setUser] = useState<any>(null);
  const [visits, setVisits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  // Edit modal state
  const [editingVisit, setEditingVisit] = useState<any | null>(null);
  const [editForm, setEditForm] = useState({
    id: '',
    fullName: '',
    visitorType: '',
    email: '',
    age: '',
    contactNumber: '',
    barangays: '', // comma separated
    spots: '', // comma separated
    date: '', // YYYY-MM-DD
  });
  const [isEditOpen, setIsEditOpen] = useState(false);

  // --- New: spot/barangay options for the edit modal (mirror schedule-visit) ---
  const [allSpots, setAllSpots] = useState<{ id: string; name: string; barangay?: string }[]>([]);
  // single-selection: only one destination (barangay) and one spot allowed
  const [selectedBarangay, setSelectedBarangay] = useState<string>('');
  const [selectedSpotId, setSelectedSpotId] = useState<string>('');
  
  useEffect(() => {
    // fetch touristSpots for selection lists
    const fetchSpots = async () => {
      try {
        const snap = await getDocs(collection(db, 'touristSpots'));
        const items: { id: string; name: string; barangay?: string }[] = snap.docs.map((d) => {
          const data: any = d.data();
          return { id: d.id, name: data.name || d.id, barangay: data.barangay || data.barangayName || '' };
        });
        setAllSpots(items);
      } catch (err) {
        console.error('Failed to load tourist spots:', err);
      }
    };
    fetchSpots();
  }, []);
  // -------------------------------------------------------------------------

  // 🔄 Listen for real-time user visits excluding completed
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (u) => {
      if (u) {
        setUser(u);
        const q = query(
          collection(db, 'visits'),
          where('userId', '==', u.uid),
          where('status', 'in', ['pending', 'accepted']) // ✅ exclude completed
        );

        const unsubscribeVisits = onSnapshot(q, (snapshot) => {
          const data = snapshot.docs.map((docSnap) => ({
            id: docSnap.id,
            ...docSnap.data(),
          }));
          setVisits(data);
          setLoading(false);
        });
        return () => unsubscribeVisits();
      } else {
        setUser(null);
        setVisits([]);
        setLoading(false);
      }
    });
    return () => unsubscribeAuth();
  }, []);

  // ❌ Cancel visit
  const handleCancel = async (id: string) => {
    const confirmCancel = confirm(
      'Are you sure you want to cancel this scheduled visit?'
    );
    if (!confirmCancel) return;

    try {
      await deleteDoc(doc(db, 'visits', id)); // ✅ remove from firestore
      alert('Your scheduled visit has been cancelled and removed.');
    } catch (error) {
      console.error('Error deleting visit:', error);
      alert('Failed to cancel visit. Please try again.');
    }
  };

  // Open edit modal and populate form
  const openEditModal = (visit: any) => {
    setEditingVisit(visit);
    // populate text form fields as before
    setEditForm({
      id: visit.id,
      fullName: visit.fullName || '',
      visitorType: visit.visitorType || '',
      email: visit.email || '',
      age: visit.age || '',
      contactNumber: visit.contactNumber || '',
      barangays: Array.isArray(visit.barangays) ? visit.barangays.join(', ') : visit.barangays || '',
      spots:
        visit.spotNames && Array.isArray(visit.spotNames)
          ? visit.spotNames.join(', ')
          : Array.isArray(visit.spots)
          ? visit.spots.join(', ')
          : visit.spots || '',
      date: visit.date || '',
    });

    // populate single-selection states (pick first if multiple)
    const initialBarangay = Array.isArray(visit.barangays) ? visit.barangays[0] : visit.barangays ? String(visit.barangays).split(',').map((s: string) => s.trim())[0] : '';
    setSelectedBarangay(initialBarangay || '');

    // Map visit.spots (could be ids or names) to the first matching spot id
    let initialSpotId = '';
    if (Array.isArray(visit.spots)) {
      for (const s of visit.spots) {
        const byId = allSpots.find(sp => sp.id === s);
        if (byId) { initialSpotId = byId.id; break; }
        const byName = allSpots.find(sp => (sp.name || '').toLowerCase() === String(s).toLowerCase());
        if (byName) { initialSpotId = byName.id; break; }
      }
    } else if (visit.spotNames && Array.isArray(visit.spotNames)) {
      const byName = allSpots.find(sp => (sp.name || '').toLowerCase() === String(visit.spotNames[0]).toLowerCase());
      if (byName) initialSpotId = byName.id;
    }
    setSelectedSpotId(initialSpotId);

    setIsEditOpen(true);
  };

  const closeEditModal = () => {
    setIsEditOpen(false);
    setEditingVisit(null);
    // reset selections
    setSelectedBarangay('');
    setSelectedSpotId('');
  };

  const handleEditChange = (key: string, value: string) => {
    setEditForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleUpdateVisit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm.id) return;
    try {
      const visitRef = doc(db, 'visits', editForm.id);

      // Determine barangays to save: prefer single selectedBarangay, otherwise fall back to text input (split)
      const barangaysToSave = selectedBarangay
        ? [selectedBarangay]
        : editForm.barangays
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean);

      // Determine spots to save as names: prefer selectedSpotId mapped to name, otherwise fall back to text input
      const spotsFromSelection = selectedSpotId ? [allSpots.find((s) => s.id === selectedSpotId)?.name || selectedSpotId] : [];

      const spotsToSave = spotsFromSelection.length
        ? spotsFromSelection
        : editForm.spots
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean);

      await updateDoc(visitRef, {
        fullName: editForm.fullName,
        visitorType: editForm.visitorType,
        email: editForm.email,
        age: editForm.age,
        contactNumber: editForm.contactNumber,
        barangays: barangaysToSave,
        spots: spotsToSave,
        date: editForm.date,
      });
      alert('Visit updated successfully.');
      closeEditModal();
    } catch (err) {
      console.error('Failed to update visit:', err);
      alert('Failed to update visit. Please try again.');
    }
  };

  // single-selection helpers
  const selectBarangay = (b: string) => {
    setSelectedBarangay(b);
    // clear spot selection when changing barangay
    setSelectedSpotId('');
    handleEditChange('barangays', b || '');
    handleEditChange('spots', '');
  };

  const selectSpot = (id: string) => {
    setSelectedSpotId(id);
    const name = allSpots.find((s) => s.id === id)?.name || id;
    handleEditChange('spots', name);
  };

  if (loading)
    return (
      <div className="flex justify-center items-center min-h-screen text-gray-600">
        Loading your travels...
      </div>
    );

  return (
    <motion.div
      className="max-w-5xl mx-auto bg-white rounded-2xl shadow-md p-8"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <h1 className="text-3xl font-bold text-gray-800 mb-4">My Travels</h1>

      {visits.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-16 text-gray-600">
          <img
            src="/empty-travel.svg"
            alt="No travels yet"
            className="w-56 mb-6 opacity-80"
          />
          <h2 className="text-xl font-semibold mb-2">No scheduled travels yet</h2>
          <p className="text-gray-500 mb-4">
            Start exploring and schedule your visits now!
          </p>
          <a
            href="/dashboard/schedule-visit"
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
          >
            Schedule Your Visit
          </a>
        </div>
      ) : (
        <div className="space-y-4">
          <ul className="space-y-4">
            {visits.map((visit: any) => (
              <motion.li
                key={visit.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{
                  translateY: -4,
                  boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
                }}
                className="bg-white/70 backdrop-blur-sm border border-gray-100 rounded-xl p-5 shadow-sm transition"
              >
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-md bg-green-50 text-green-600">
                        <MapPin size={20} />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800">
                          {visit.fullName}
                        </h3>
                        <p className="text-sm text-gray-500 flex items-center gap-2">
                          <Mail size={14} /> <span>{visit.email || '—'}</span>
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-700">
                      <div className="flex items-start gap-2">
                        <Phone className="text-green-500 mt-1" size={16} />
                        <div>
                          <div className="font-medium text-gray-600">Contact</div>
                          <div className="mt-1">{visit.contactNumber || 'N/A'}</div>
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <Calendar className="text-orange-500 mt-1" size={16} />
                        <div>
                          <div className="font-medium text-gray-600">Date</div>
                          <div className="mt-1">{formatDate(visit.date)}</div>
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <MapPin className="text-blue-500 mt-1" size={16} />
                        <div>
                          <div className="font-medium text-gray-600">Barangays</div>
                          <div className="mt-1">
                            {visit.barangays?.join(', ') || 'N/A'}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <MapPin className="text-indigo-500 mt-1" size={16} />
                        <div>
                          <div className="font-medium text-gray-600">Spots</div>
                          <div className="mt-1">
                            {visit.spotNames?.join(', ') ||
                              visit.spots?.join(', ') ||
                              'N/A'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex-shrink-0 w-full md:w-auto text-right flex flex-col items-end gap-3">
                    <span
                      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                        visit.status === 'Accepted'
                          ? 'bg-green-100 text-green-700'
                          : visit.status === 'Cancelled'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}
                    >
                      <Clock size={14} />
                      {visit.status || 'Pending'}
                    </span>

                    <div className="flex flex-col sm:flex-row items-center gap-2 mt-2">
                      {String(visit.status || '').toLowerCase() === 'pending' && (
                        <button
                          onClick={() => openEditModal(visit)}
                          className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition text-sm"
                        >
                          Edit
                        </button>
                      )}
                      <button
                        onClick={() => handleCancel(visit.id)}
                        className="px-3 py-1 border border-red-200 text-red-600 rounded-md hover:bg-red-50 transition text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </motion.li>
            ))}
          </ul>
        </div>
      )}

      {/* Edit Visit Modal */}
      {isEditOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50 px-4">
          <div className="bg-white rounded-2xl p-6 shadow-2xl w-full max-w-2xl relative">
            <button
              onClick={closeEditModal}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              aria-label="Close"
            >
              <XCircle size={22} />
            </button>
            <h3 className="text-xl font-semibold mb-4">Edit Scheduled Visit</h3>
            <form
              onSubmit={handleUpdateVisit}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              <div className="md:col-span-2">
                <label className="block text-sm text-gray-600">Full Name</label>
                <input
                  className="w-full border p-2 rounded-md focus:ring-2 focus:ring-green-200"
                  value={editForm.fullName}
                  onChange={(e) => handleEditChange('fullName', e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-gray-600">Visitor Type</label>
                <select
                  className="w-full border p-2 rounded-md focus:ring-2 focus:ring-green-200"
                  value={editForm.visitorType}
                  onChange={(e) => handleEditChange('visitorType', e.target.value)}
                  required
                >
                  <option value="">Select</option>
                  <option value="domestic">Domestic</option>
                  <option value="foreign">Foreign</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-600">Email</label>
                <input
                  className="w-full border p-2 rounded-md focus:ring-2 focus:ring-green-200"
                  value={editForm.email}
                  onChange={(e) => handleEditChange('email', e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-gray-600">Contact Number</label>
                <input
                  className="w-full border p-2 rounded-md focus:ring-2 focus:ring-green-200"
                  value={editForm.contactNumber}
                  onChange={(e) => handleEditChange('contactNumber', e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-gray-600">Age</label>
                <input
                  type="number"
                  min={1}
                  className="w-full border p-2 rounded-md focus:ring-2 focus:ring-green-200"
                  value={editForm.age}
                  onChange={(e) => handleEditChange('age', e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-gray-600">Date</label>
                <input
                  type="date"
                  className="w-full border p-2 rounded-md focus:ring-2 focus:ring-green-200"
                  value={editForm.date}
                  onChange={(e) => handleEditChange('date', e.target.value)}
                  required
                />
              </div>

              {/* Updated: radio list for barangays */}
              <div className="md:col-span-2">
                <label className="block text-sm text-gray-600">Select Barangays</label>
                <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-auto border rounded p-2">
                  {Array.from(
                    new Set([
                      ...allSpots.map((s) => s.barangay).filter(Boolean),
                      ...visits.flatMap((v: any) => v.barangays || []),
                    ])
                  )
                    .filter(Boolean)
                    .map((b) => (
                      <label key={b} className="inline-flex items-center gap-2 text-sm">
                        <input
                          type="radio"
                          name="selectedBarangay"
                          checked={selectedBarangay === b}
                          onChange={() => selectBarangay(b)}
                          className="w-4 h-4 rounded"
                        />
                        <span>{b}</span>
                      </label>
                    ))}
                </div>
                <div className="text-xs text-gray-400 mt-1">Select one barangay as the destination.</div>
              </div>
 
              {/* Updated: radio list for spots (filtered by selected barangays) */}
              <div className="md:col-span-2">
                <label className="block text-sm text-gray-600">Select Spots</label>
                <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-auto border rounded p-2">
                  {allSpots
                    .filter((sp) => {
                      if (!selectedBarangay) return true;
                      return selectedBarangay === (sp.barangay || '');
                    })
                    .map((sp) => (
                      <label key={sp.id} className="inline-flex items-center gap-2 text-sm">
                        <input
                          type="radio"
                          name="selectedSpot"
                          checked={selectedSpotId === sp.id}
                          onChange={() => selectSpot(sp.id)}
                          className="w-4 h-4 rounded"
                        />
                        <span>{sp.name}{sp.barangay ? ` — ${sp.barangay}` : ''}</span>
                      </label>
                    ))}
                </div>
                <div className="text-xs text-gray-400 mt-1">Select one spot for the visit (filtered by chosen barangay).</div>
              </div>

              <div className="md:col-span-2 flex justify-end gap-3 mt-2">
                <button type="button" onClick={closeEditModal} className="px-4 py-2 rounded-md border">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 rounded-md bg-green-600 text-white hover:bg-green-700">
                  Save changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </motion.div>
  );
}
