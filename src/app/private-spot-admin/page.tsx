'use client';

import { useEffect, useState, useMemo } from 'react';
import { db, auth } from '@/lib/firebase';
import { collection, onSnapshot, query, getDoc, doc, getDocs, where } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { Card, CardContent } from '@/components/ui/card';
import { Users, MapPin, BarChart3, User, Calendar, MapPin as MapPinIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export default function BarangayAdminDashboard() {
  const [visits, setVisits] = useState<any[]>([]);
  const [barangay, setBarangay] = useState('');
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'monthly' | 'quarterly' | 'yearly'>('monthly');

  // Fetch scanned visits from visitLogs
  useEffect(() => {
    let unsub: (() => void) | undefined;
    
    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        // Get private spot owner info
        const ownerRef = doc(db, 'privateSpotOwners', user.uid);
        const ownerSnap = await getDoc(ownerRef);

        if (!ownerSnap.exists()) {
          setLoading(false);
          return;
        }

        const ownerData = ownerSnap.data();
        const displayName = ownerData?.displayName || 'Private Spot';
        setBarangay(displayName);

        // Query visitLogs for scans by this owner
        const q = query(collection(db, 'visitLogs'));

        unsub = onSnapshot(q, (snapshot) => {
          const data = snapshot.docs
            .map((d) => ({ id: d.id, ...d.data() }))
            .filter((log: any) => log.scannedBy === displayName);

          setVisits(data);
          setLoading(false);
        });
      } catch (error) {
        console.error('Error fetching visit logs:', error);
        setLoading(false);
      }
    });

    return () => {
      unsubAuth();
      if (unsub) unsub();
    };
  }, []);

  // Calculate statistics for the chart
  const filteredData = useMemo(() => {
    const grouped: Record<string, number> = {};

    visits.forEach((visit: any) => {
      const date = visit.scannedAt?.toDate() || new Date();
      const month = date.toLocaleString('default', { month: 'short' });
      const year = date.getFullYear();
      const visitors = visit.numberOfVisitors || 1;

      if (filter === 'monthly') {
        const key = `${month} ${year}`;
        grouped[key] = (grouped[key] || 0) + visitors;
      } else if (filter === 'quarterly') {
        const quarter = Math.floor(date.getMonth() / 3) + 1;
        const key = `Q${quarter} ${year}`;
        grouped[key] = (grouped[key] || 0) + visitors;
      } else if (filter === 'yearly') {
        const key = `${year}`;
        grouped[key] = (grouped[key] || 0) + visitors;
      }
    });

    return Object.entries(grouped).map(([period, visitors]) => ({
      period,
      visitors,
    }));
  }, [visits, filter]);

  // Calculate summary statistics
  const totalVisitors = visits.reduce(
    (sum, visit: any) => sum + 1, // Count each scan as 1 visitor
    0
  );

  const uniqueVisitors = new Set(visits.map((v: any) => v.email || v.userId)).size;
  const recentActivities = [...visits]
    .sort((a: any, b: any) => b.scannedAt?.toDate() - a.scannedAt?.toDate())
    .slice(0, 6);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-center">
          <div className="text-2xl font-bold text-gray-700 mb-4">
            Loading Scan Analytics...
          </div>
          <div className="h-2 bg-gray-200 rounded w-48 mx-auto"></div>
        </div>
      </div>
    );
  }

  if (!barangay) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center p-6 max-w-md mx-auto">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h2>
          <p className="text-gray-600">
            You don't have permission to view this dashboard. Please make sure you're logged in as a private spot owner.
          </p>
        </div>
      </div>
    );
  }

  // Calculate the statistics to use in the UI
  const totalVisits = visits.length;

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row justify-between items-start sm:items-center mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-green-700">
          {barangay} Dashboard
        </h1>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          {['monthly', 'quarterly', 'yearly'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f as any)}
              className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium transition ${filter === f
                  ? 'bg-green-600 text-white'
                  : 'bg-green-100 text-green-700 hover:bg-green-200'
                }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Card className="shadow-sm sm:shadow-md border border-green-50 sm:border-green-100">
            <CardContent className="p-4 sm:p-6 flex items-center justify-between">
              <div>
                <h2 className="text-xs sm:text-sm text-gray-500">Total Visitors</h2>
                <p className="text-xl sm:text-2xl font-bold text-green-700">{totalVisitors}</p>
              </div>
              <div className="p-2 bg-green-50 rounded-lg">
                <Users className="text-green-600" size={20} />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Card className="shadow-sm sm:shadow-md border border-green-50 sm:border-green-100">
            <CardContent className="p-4 sm:p-6 flex items-center justify-between">
              <div>
                <h2 className="text-xs sm:text-sm text-gray-500">Active Users</h2>
                <p className="text-xl sm:text-2xl font-bold text-green-700">{uniqueVisitors}</p>
              </div>
              <div className="p-2 bg-green-50 rounded-lg">
                <User className="text-green-600" size={20} />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Charts + Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
        {/* 📊 Bar Chart */}
        <Card className="shadow-sm sm:shadow-md border border-green-50 sm:border-green-100">
          <CardContent className="p-4 sm:p-6">
            <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-green-700">
              Visitors per {filter === 'yearly' ? 'Year' : filter === 'quarterly' ? 'Quarter' : 'Month'}
            </h2>
            <div className="h-[250px] sm:h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={filteredData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                  <XAxis
                    dataKey="period"
                    tick={{ fontSize: 12 }}
                    tickMargin={8}
                  />
                  <YAxis
                    width={35}
                    tick={{ fontSize: 12 }}
                    tickMargin={8}
                  />
                  <Tooltip />
                  <Bar
                    dataKey="visitors"
                    fill="#22c55e"
                    radius={[4, 4, 0, 0]}
                    name="Visitors"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* 🕒 Recent Activities */}
        <Card className="shadow-sm sm:shadow-md border border-green-50 sm:border-green-100">
          <CardContent className="p-4 sm:p-6">
            <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-green-700">
              Recent Activities
            </h2>
            <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1 -mr-2 sm:mr-0">
              {recentActivities.length > 0 ? (
                recentActivities.map((log: any) => (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ x: 2 }}
                    className="p-3 sm:p-4 bg-green-50 rounded-lg sm:rounded-xl border border-green-50 sm:border-green-100 shadow-xs sm:shadow-sm"
                  >
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm sm:text-base text-green-700 truncate">
                          {log.name || 'Unnamed Visitor'}
                        </p>
                        <p className="text-xs sm:text-sm text-gray-600 flex items-start sm:items-center gap-1 mt-1">
                          <MapPin size={12} />
                          <span className="truncate">
                            {log.spots?.length > 0 
                              ? Array.isArray(log.spots) 
                                ? log.spots.join(', ')
                                : log.spots
                              : 'No spot specified'}
                          </span>
                        </p>
                      </div>
                      <p className="text-xs text-gray-500 flex items-center gap-1 whitespace-nowrap">
                        <Calendar size={12} /> {log.scannedAt ? new Date(log.scannedAt.toDate()).toLocaleDateString() : 'No date'}
                      </p>
                    </div>
                    <div className="mt-2 sm:mt-3 pt-2 border-t border-green-100">
                      <div className="flex items-center gap-2">
                        <p className="text-xs sm:text-sm text-gray-600 flex items-center gap-1">
                          <User size={12} />
                          <span className="truncate">{log.email || 'No email'}</span>
                        </p>
                        <span className="text-gray-300">•</span>
                        <p className="text-xs sm:text-sm text-gray-600">
                          <span>Visitors: <strong>{log.numberOfVisitors || 1}</strong></span>
                        </p>
                      </div>
                      {log.purpose && (
                        <p className="text-xs sm:text-sm text-gray-500 mt-1">
                          Purpose: {log.purpose}
                        </p>
                      )}
                    </div>
                  </motion.div>
                ))
              ) : (
                <p className="text-gray-500 text-center">No recent activities found.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
