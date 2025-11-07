'use client';

import { useEffect, useState, useMemo } from 'react';
import { db, auth } from '@/lib/firebase';
import { collection, onSnapshot, query, getDoc, doc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { Card, CardContent } from '@/components/ui/card';
import { Users, MapPin, BarChart3, User, Calendar } from 'lucide-react';
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

  // 🔥 Fetch barangay name and related visit logs
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      if (!user) return setLoading(false);

      const barangayRef = doc(db, 'barangayAdmins', user.uid);
      const barangaySnap = await getDoc(barangayRef);

      if (!barangaySnap.exists()) {
        setLoading(false);
        return;
      }

      const barangayName = barangaySnap.data().barangay;
      setBarangay(barangayName);

      const q = query(collection(db, 'visitLogs'));
      const unsub = onSnapshot(q, (snapshot) => {
        const data = snapshot.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((log: any) =>
            log.barangays?.map((b: string) => b.toLowerCase()).includes(barangayName.toLowerCase())
          );
        setVisits(data);
        setLoading(false);
      });

      return () => unsub();
    });

    return () => unsubAuth();
  }, []);

  // 📊 Processed Data for Bar Chart
  const filteredData = useMemo(() => {
    const grouped: Record<string, number> = {};

    visits.forEach((v: any) => {
      const date = new Date(v.date);
      const month = date.toLocaleString('default', { month: 'short' });
      const year = date.getFullYear();

      if (filter === 'monthly') {
        const key = `${month} ${year}`;
        grouped[key] = (grouped[key] || 0) + v.numberOfVisitors;
      } else if (filter === 'quarterly') {
        const quarter = Math.floor(date.getMonth() / 3) + 1;
        const key = `Q${quarter} ${year}`;
        grouped[key] = (grouped[key] || 0) + v.numberOfVisitors;
      } else if (filter === 'yearly') {
        const key = `${year}`;
        grouped[key] = (grouped[key] || 0) + v.numberOfVisitors;
      }
    });

    return Object.entries(grouped).map(([period, visitors]) => ({
      period,
      visitors,
    }));
  }, [visits, filter]);

  const totalVisitors = visits.reduce((sum, v) => sum + (v.numberOfVisitors || 0), 0);
  const uniqueSpots = new Set(visits.flatMap((v) => v.spots || [])).size;
  const uniqueUsers = new Set(visits.map((v) => v.email)).size;

  const recentActivities = [...visits]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 6); // show latest 6

  if (loading) {
    return <p className="text-center mt-10 text-gray-600">Loading dashboard...</p>;
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <h1 className="text-3xl font-bold text-green-700">
          Barangay {barangay} Dashboard
        </h1>
        <div className="flex gap-2 mt-4 sm:mt-0">
          {['monthly', 'quarterly', 'yearly'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f as any)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <motion.div whileHover={{ scale: 1.03 }}>
          <Card className="shadow-md border border-green-100">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <h2 className="text-sm text-gray-500">Total Visitors</h2>
                <p className="text-2xl font-bold text-green-700">{totalVisitors}</p>
              </div>
              <Users className="text-green-600" size={28} />
            </CardContent>
          </Card>
        </motion.div>


        <motion.div whileHover={{ scale: 1.03 }}>
          <Card className="shadow-md border border-green-100">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <h2 className="text-sm text-gray-500">Active Users</h2>
                <p className="text-2xl font-bold text-green-700">{uniqueUsers}</p>
              </div>
              <BarChart3 className="text-green-600" size={28} />
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Charts + Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 📊 Bar Chart */}
        <Card className="shadow-md border border-green-100">
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold mb-4 text-green-700">
              Visitors per {filter === 'yearly' ? 'Year' : filter === 'quarterly' ? 'Quarter' : 'Month'}
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={filteredData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis dataKey="period" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="visitors" fill="#22c55e" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 🕒 Recent Activities */}
        <Card className="shadow-md border border-green-100">
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold mb-4 text-green-700">Recent Activities</h2>
            <div className="space-y-4 max-h-[320px] overflow-y-auto">
              {recentActivities.length > 0 ? (
                recentActivities.map((log) => (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-green-50 rounded-xl border border-green-100 shadow-sm"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium text-green-700">{log.name}</p>
                        <p className="text-sm text-gray-600 flex items-center gap-1">
                          <MapPin size={14} /> {log.spots?.join(', ') || '—'}
                        </p>
                      </div>
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <Calendar size={12} /> {log.date}
                      </p>
                    </div>
                    <p className="text-sm text-gray-600 mt-2 flex items-center gap-1">
                      <User size={14} /> {log.email}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      Visitors: <strong>{log.numberOfVisitors || 0}</strong>
                    </p>
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
