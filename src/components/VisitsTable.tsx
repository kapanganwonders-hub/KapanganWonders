'use client';

import { useEffect, useState, useMemo } from 'react';
import {
  collection,
  onSnapshot,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Check, Trash, ChevronDown, ChevronUp, Info, Mail, Phone, Calendar, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';

// Define the shape of a Visit
interface Visit {
  id: string;
  fullName?: string;
  barangays?: string[];
  spots?: string[];
  spotNames?: string[];
  date?: string;
  status?: string;
  isPrivate?: boolean;
  businessId?: string;
  businessName?: string;
  contactNumber?: string; // added optional contact
}

interface VisitsTableProps {
  role: 'admin' | 'barangay' | 'private';
  filterFn?: (visit: Visit) => boolean; // optional filter based on user role
}

export default function VisitsTable({ role, filterFn }: VisitsTableProps) {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const [spotNames, setSpotNames] = useState<Record<string, string>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Search query for quick filtering
  const [query, setQuery] = useState('');

  const toggleExpanded = (id: string) => {
    setExpandedId(prev => (prev === id ? null : id));
  };

  const formatDate = (d?: string) => {
    if (!d) return 'N/A';
    try {
      const dt = new Date(d);
      return dt.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
    } catch {
      return d;
    }
  };

  useEffect(() => {
    // Fetch spot names for all spots in visits
    const fetchSpotNames = async () => {
      try {
        // Get all unique spot IDs from all visits
        const allSpotIds = new Set<string>();
        visits.forEach(visit => {
          if (visit.spots) {
            visit.spots.forEach(spotId => allSpotIds.add(spotId));
          }
        });

        // Only fetch spot names that we don't already have
        const spotIdsToFetch = Array.from(allSpotIds).filter(id => !spotNames[id]);
        
        if (spotIdsToFetch.length === 0) return;

        const names: Record<string, string> = {};
        
        // Fetch spot names in batches to avoid too many requests
        for (const spotId of spotIdsToFetch) {
          try {
            const spotDoc = await getDoc(doc(db, 'touristSpots', spotId));
            if (spotDoc.exists()) {
              const spotData = spotDoc.data();
              // Use the spot's name from the touristSpots collection
              names[spotId] = spotData.name || 'Unknown Spot';
            }
          } catch (error) {
            console.error(`Error fetching spot ${spotId}:`, error);
            names[spotId] = 'Unknown Spot';
          }
        }
        
        if (Object.keys(names).length > 0) {
          setSpotNames(prev => ({ ...prev, ...names }));
        }
      } catch (error) {
        console.error('Error in fetchSpotNames:', error);
      }
    };

    fetchSpotNames();
  }, [visits]);

  useEffect(() => {
    // ✅ Real-time listener for visits collection
    const unsub = onSnapshot(collection(db, 'visits'), (snap) => {
      let data: Visit[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<Visit, 'id'>),
      }));

      // ❌ Exclude "completed" visits
      data = data.filter((v) => v.status?.toLowerCase() !== 'completed');

      // ✅ Apply custom filter (barangay/private)
      if (filterFn) data = data.filter(filterFn);

      setVisits(data);
      setLoading(false);
    });

    // 🧹 Cleanup listener on unmount
    return () => unsub();
  }, [filterFn]);

  // ✅ Approve a visit
 const handleApprove = async (id: string) => {
  try {
    const ref = doc(db, "visits", id);
    const snap = await getDoc(ref);
    const data = snap.data();

    if (!data || !data.email) {
      alert("⚠ No email found for this user.");
      return;
    }

    // 1. Approve visit
    await updateDoc(ref, { status: "Approved" });

    // 2. Send QR to user's email
    await fetch("/api/send-qr-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: data.email,
        fullName: data.fullName,
        visitId: id,
        barangays: data.barangays || [],
        spotNames: data.spotNames || data.spots || [],
        date: data.date,
      }),
    });

    alert("✅ Visit approved & email sent!");
  } catch (error) {
    console.error("Approve+Email error:", error);
    alert("Failed to approve or send email.");
  }
};


  // 🗑️ Delete a visit
  const handleDelete = async (id: string) => {
    const ok = confirm('Are you sure you want to delete this visit?');
    if (!ok) return;
    try {
      await deleteDoc(doc(db, 'visits', id));
      alert('🗑️ Visit deleted successfully.');
    } catch (error) {
      console.error('Error deleting visit:', error);
      alert('Failed to delete visit.');
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .filter(Boolean)
      .map((s) => s[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const filteredVisits = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return visits;
    return visits.filter((v) => {
      const name = (v.fullName || '').toLowerCase();
      const brgy = (v.barangays || []).join(' ').toLowerCase();
      const spots = (v.spots || []).map(s => (spotNames[s] || s).toLowerCase()).join(' ');
      return name.includes(q) || brgy.includes(q) || spots.includes(q);
    });
  }, [visits, spotNames, query]);

  if (loading) return <div>Loading visits...</div>;

  return (
    <div className="overflow-hidden">
      <div className="bg-white/40 backdrop-blur-sm rounded-2xl shadow-lg overflow-hidden">
        <div className="p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b">
          <div>
            <h2 className="text-2xl font-extrabold text-green-800 tracking-tight">Scheduled Visits</h2>
            <div className="text-sm text-gray-500 mt-1">Refined cards with motion, icons, and clearer metadata.</div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-sm text-gray-600 px-3 py-1 bg-white rounded-full shadow-sm">
              <span className="font-medium">{filteredVisits.length}</span> visit{filteredVisits.length !== 1 ? 's' : ''}
            </div>

            <div className="relative">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search visitor, barangay, or spot..."
                className="w-64 md:w-80 text-sm px-4 py-2 rounded-xl border bg-white/90 shadow-sm focus:outline-none focus:ring-2 focus:ring-green-200"
              />
              {query && (
                <button onClick={() => setQuery('')} title="Clear" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {filteredVisits.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <svg className="mx-auto mb-4" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M8 7h.01"/><path d="M8 12h.01"/><path d="M8 17h.01"/><path d="M12 7h5"/></svg>
              No visits match your search.
            </div>
          ) : (
            filteredVisits.map((v, idx) => (
              <motion.div
                key={v.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.28, delay: idx * 0.03 }}
                whileHover={{ scale: 1.02, y: -3 }}
                className="relative flex flex-col md:flex-row items-start md:items-center bg-white border border-gray-100 rounded-2xl p-4 md:p-5 gap-4 shadow-sm"
              >
                <div className="flex items-center gap-4 w-full">
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-300 to-green-500 flex items-center justify-center text-white font-bold text-lg shadow-inner">
                      {getInitials(v.fullName)}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="text-lg font-semibold text-gray-800 truncate">{v.fullName || 'Anonymous'}</div>
                        <div className="text-sm text-gray-500 truncate mt-1 flex items-center gap-3">
                          <span className="inline-flex items-center gap-2">
                            <Mail size={14} className="text-green-500" /> <span className="truncate">{v.contactNumber ? `${v.contactNumber}` : 'No email/phone'}</span>
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className={
                          `inline-flex items-center px-3 py-1 text-sm font-medium rounded-full shadow-sm ${
                            v.status === 'Approved' ? 'bg-green-100 text-green-800' :
                            v.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`
                        }>
                          {v.status || 'Pending'}
                        </div>
                        {v.isPrivate && <div className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">Private</div>}
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-gray-700">
                      <div className="flex items-start gap-2">
                        <MapPin size={16} className="text-green-500 mt-1" />
                        <div>
                          <div className="font-medium text-gray-800">Barangays</div>
                          <div className="mt-1 flex flex-wrap gap-2">
                            {v.barangays?.length ? v.barangays.map((b, i) => (
                              <span key={i} className="text-xs bg-green-50 text-green-800 px-2 py-1 rounded-full">{b}</span>
                            )) : <span className="text-sm text-gray-400">N/A</span>}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <div className="pt-1">
                          <Calendar size={16} className="text-green-500" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-800">Date</div>
                          <div className="mt-1 text-sm text-gray-600">{formatDate(v.date)}</div>
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <div className="pt-1">
                          <Phone size={16} className="text-green-500" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-800">Spots</div>
                          <div className="mt-1 flex flex-wrap gap-2">
                            {v.spots?.length ? v.spots.map((s) => (
                              <span key={s} title={spotNames[s] || s} className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded hover:bg-gray-200 transition">{spotNames[s] || s}</span>
                            )) : <span className="text-sm text-gray-400">N/A</span>}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex-shrink-0 flex flex-col md:items-end gap-2 mt-3 md:mt-0">
                  {(v.status !== 'Approved' && (role === 'admin' || role === 'barangay' || role === 'private')) && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleApprove(v.id); }}
                      className="flex items-center gap-2 text-white bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg text-sm shadow-sm"
                      title="Approve visit"
                    >
                      <Check size={16} /> Approve
                    </button>
                  )}

                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(v.id); }}
                    className="flex items-center gap-2 text-red-600 border border-red-100 hover:bg-red-50 px-4 py-2 rounded-lg text-sm"
                    title="Delete visit"
                  >
                    <Trash size={16} /> Delete
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
