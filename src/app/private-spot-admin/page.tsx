'use client';

import { useEffect, useState, useMemo } from 'react';
import { db, auth } from '@/lib/firebase';
import { collection, onSnapshot, query, getDoc, doc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { Card, CardContent } from '@/components/ui/card';
import { Users, MapPin, User, Calendar } from 'lucide-react';
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

export default function PrivateSpotOwnerDashboard() {
  const [visits, setVisits] = useState<any[]>([]);
  const [privateSpotName, setPrivateSpotName] = useState('');
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'monthly' | 'quarterly' | 'yearly'>('monthly');

  // 🔥 Fetch visits for this private spot owner
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      if (!user) return setLoading(false);

      try {
        // Get owner profile
        const ownerRef = doc(db, 'privateSpotOwners', user.uid);
        const ownerSnap = await getDoc(ownerRef);

        if (!ownerSnap.exists()) {
          setLoading(false);
          return;
        }

        const { privateSpotName } = ownerSnap.data();
        setPrivateSpotName(privateSpotName);

        // Fetch Visits
        const q = query(collection(db, 'visits'));

        const unsub = onSnapshot(q, (snapshot) => {
          const data = snapshot.docs
            .map((d) => ({ id: d.id, ...d.data() }))
            .filter((log: any) => {
              const matchesSpot =
                log.spotName === privateSpotName ||
                log.spots?.includes(privateSpotName) ||
                log.spotNames?.includes(privateSpotName);

              const isCompleted = log.status === 'Completed';

              return matchesSpot && isCompleted;
            });

          setVisits(data);
          setLoading(false);
        });

        return () => unsub();
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    });

    return () => unsubAuth();
  }, []);

  // 📊 Visitors for chart
  const filteredData = useMemo(() => {
    const grouped: Record<string, number> = {};

    visits.forEach((v: any) => {
      const date = new Date(v.date);
      const month = date.toLocaleString('default', { month: 'short' });
      const year = date.getFullYear();
      const visitors = 1 + (v.companions?.length || 0);

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

  // ✔ Total Visitors
  const totalVisitors = visits.reduce((sum, v) => {
    const main = 1;
    const companions = v.companions?.length || 0;
    return sum + (main + companions);
  }, 0);

  // ✔ Only 1 private spot
  const uniqueSpots = 1;

  // ✔ Unique users
  const uniqueUsers = new Set(visits.map((v) => v.email)).size;

  // ✔ Recent Activities (last 6 visits)
  const recentActivities = [...visits]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 6);

  if (loading) {
    return <p className="text-center mt-10 text-gray-600">Loading dashboard...</p>;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row justify-between items-start sm:items-center mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-green-700">
          Private Spot Dashboard – {privateSpotName}
        </h1>

        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          {['monthly', 'quarterly', 'yearly'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f as any)}
              className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium transition ${
                filter === f
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
          <Card className="shadow-sm border border-green-100">
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
          <Card className="shadow-sm border border-green-100">
            <CardContent className="p-4 sm:p-6 flex items-center justify-between">
              <div>
                <h2 className="text-xs sm:text-sm text-gray-500">Tourist Spot</h2>
                <p className="text-xl sm:text-2xl font-bold text-green-700">{uniqueSpots}</p>
              </div>
              <div className="p-2 bg-green-50 rounded-lg">
                <MapPin className="text-green-600" size={20} />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Card className="shadow-sm border border-green-100">
            <CardContent className="p-4 sm:p-6 flex items-center justify-between">
              <div>
                <h2 className="text-xs sm:text-sm text-gray-500">Active Users</h2>
                <p className="text-xl sm:text-2xl font-bold text-green-700">{uniqueUsers}</p>
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
        <Card className="shadow-sm border border-green-100">
          <CardContent className="p-4 sm:p-6">
            <h2 className="text-base sm:text-lg font-semibold mb-4 text-green-700">
              Visitors per {filter === 'yearly' ? 'Year' : filter === 'quarterly' ? 'Quarter' : 'Month'}
            </h2>
            <div className="h-[250px] sm:h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={filteredData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                  <XAxis dataKey="period" tick={{ fontSize: 12 }} tickMargin={8} />
                  <YAxis width={35} tick={{ fontSize: 12 }} tickMargin={8} />
                  <Tooltip />
                  <Bar dataKey="visitors" fill="#22c55e" radius={[4, 4, 0, 0]} name="Visitors" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* 🕒 Recent Activities */}
        <Card className="shadow-sm border border-green-100">
          <CardContent className="p-4 sm:p-6">
            <h2 className="text-base sm:text-lg font-semibold mb-4 text-green-700">Recent Activities</h2>
            <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1 -mr-2 sm:mr-0">
              {recentActivities.length > 0 ? (
                recentActivities.map((log) => (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ x: 2 }}
                    className="p-3 bg-green-50 rounded-lg border border-green-100 shadow-sm"
                  >
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm sm:text-base text-green-700 truncate">
                          {log.fullName}
                        </p>
                        <p className="text-xs sm:text-sm text-gray-600 flex items-center gap-1 mt-1">
                          <MapPin size={12} />{' '}
                          <span className="truncate">
                            {log.spotNames?.join(', ') ||
                              log.spots?.join(', ') ||
                              log.spotName ||
                              '—'}
                          </span>
                        </p>
                      </div>
                      <p className="text-xs text-gray-500 whitespace-nowrap flex items-center gap-1">
                        <Calendar size={12} /> {log.date}
                      </p>
                    </div>
                    <div className="mt-2 pt-2 border-t border-green-100">
                      <p className="text-xs sm:text-sm text-gray-600 flex items-center gap-1">
                        <User size={12} />
                        <span className="truncate">{log.email}</span>
                      </p>
                      <p className="text-xs sm:text-sm text-gray-500 mt-1">
                        Visitors: <strong>{1 + (log.companions?.length || 0)}</strong>
                      </p>
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
