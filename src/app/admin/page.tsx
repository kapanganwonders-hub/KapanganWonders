'use client';

import { useEffect, useState, useMemo } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent } from '@/components/ui/card';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

export default function AdminDashboard() {
  const [visitLogs, setVisitLogs] = useState<any[]>([]);
  const [activeUsers, setActiveUsers] = useState(0);
  const [inactiveUsers, setInactiveUsers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'monthly' | 'quarterly' | 'yearly'>('monthly');

  // 🎯 Fetch visit logs + user stats
  useEffect(() => {
    const fetchData = async () => {
      try {
        const visitSnapshot = await getDocs(collection(db, 'visitLogs'));
        const logs = visitSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setVisitLogs(logs);

        const barangayAdminsSnapshot = await getDocs(collection(db, 'barangayAdmins'));
        const privateOwnersSnapshot = await getDocs(collection(db, 'privateSpotOwners'));
        const usersSnapshot = await getDocs(collection(db, 'users'));

        // 🟢 Active
        const barangayAdminsActive = barangayAdminsSnapshot.docs
          .map((doc) => doc.data())
          .filter((user: any) => user.status === 'Active' || user.isActive === true);

        const privateOwnersActive = privateOwnersSnapshot.docs
          .map((doc) => doc.data())
          .filter((user: any) => user.status === 'Active' || user.isActive === true);

        const usersActive = usersSnapshot.docs
          .map((doc) => doc.data())
          .filter((user: any) => user.status === 'Active' || user.isActive === true);

        // 🔴 Inactive
        const barangayAdminsInactive = barangayAdminsSnapshot.docs
          .map((doc) => doc.data())
          .filter((user: any) => user.status === 'Inactive' || user.isActive === false);

        const privateOwnersInactive = privateOwnersSnapshot.docs
          .map((doc) => doc.data())
          .filter((user: any) => user.status === 'Inactive' || user.isActive === false);

        const usersInactive = usersSnapshot.docs
          .map((doc) => doc.data())
          .filter((user: any) => user.status === 'Inactive' || user.isActive === false);

        // ✅ Set counts
        setActiveUsers(barangayAdminsActive.length + privateOwnersActive.length + usersActive.length);
        setInactiveUsers(barangayAdminsInactive.length + privateOwnersInactive.length + usersInactive.length);
      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // ⚡ Data filtering logic (for monthly, quarterly, yearly)
  const filteredData = useMemo(() => {
    const now = new Date();

    if (filter === 'monthly') {
      const thisMonth = now.toLocaleString('default', { month: 'long' });
      return visitLogs.filter((log) => log.month === thisMonth);
    } else if (filter === 'quarterly') {
      const currentMonth = now.getMonth();
      const startMonth = Math.floor(currentMonth / 3) * 3;
      const monthsInQuarter = Array.from({ length: 3 }, (_, i) =>
        new Date(0, startMonth + i).toLocaleString('default', { month: 'long' })
      );
      return visitLogs.filter((log) => monthsInQuarter.includes(log.month));
    } else {
      const currentYear = now.getFullYear();
      return visitLogs.filter((log) => log.year === currentYear);
    }
  }, [filter, visitLogs]);

  // ✅ Loading skeleton
  if (loading) {
    return (
      <div className="p-6 space-y-6 animate-pulse">
        <div className="h-8 bg-gray-300 rounded w-1/3 mx-auto" />
        <div className="grid md:grid-cols-4 gap-4 mt-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-gray-200 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  // --- 📊 Process Data ---
  const monthlyCounts: Record<string, number> = {};
  const spotCounts: Record<string, number> = {};
  const visitorTypes = { domestic: 0, foreign: 0 };

  filteredData.forEach((log) => {
    const month = log.month || 'Unknown';
    monthlyCounts[month] = (monthlyCounts[month] || 0) + (log.numberOfVisitors || 1);

    const spot = log.spots?.[0] || 'Unknown';
    spotCounts[spot] = (spotCounts[spot] || 0) + (log.numberOfVisitors || 1);

    if (log.originType === 'foreign') visitorTypes.foreign++;
    else visitorTypes.domestic++;
  });

  const monthlyData = Object.entries(monthlyCounts).map(([month, count]) => ({ month, count }));
  const spotData = Object.entries(spotCounts).map(([spot, count]) => ({ spot, count }));
  const visitorTypeData = [
    { name: 'Domestic', value: visitorTypes.domestic },
    { name: 'Foreign', value: visitorTypes.foreign },
  ];

  const COLORS = ['#34d399', '#60a5fa'];

  // --- 🧮 Totals ---
  const totalVisitors = filteredData.reduce(
    (sum, log) => sum + (log.numberOfVisitors || 1),
    0
  );
  const totalThisMonth = monthlyCounts[new Date().toLocaleString('default', { month: 'long' })] || 0;
  const totalYear = new Date().getFullYear();

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-green-700">📊 Tourism Dashboard</h1>

        {/* Filter buttons */}
        <div className="flex gap-2">
          {(['monthly', 'quarterly', 'yearly'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition ${
                filter === type
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-gray-500">Total Visitors This {filter}</p>
            <p className="text-3xl font-bold text-green-600">{totalVisitors}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-gray-500">Total Visitors This Year ({totalYear})</p>
            <p className="text-3xl font-bold text-green-600">{totalThisMonth}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-gray-500">Active Users</p>
            <p className="text-3xl font-bold text-green-600">{activeUsers}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-gray-500">Inactive Accounts</p>
            <p className="text-3xl font-bold text-red-500">{inactiveUsers}</p>
          </CardContent>
        </Card>
      </div>

      {/* Visitors by Month */}
      <Card>
        <CardContent className="p-4">
          <h2 className="text-xl font-semibold mb-3">Visitors by Month</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyData}>
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#34d399" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Visitor Type Distribution */}
      <Card>
        <CardContent className="p-4">
          <h2 className="text-xl font-semibold mb-3">Visitor Type Distribution</h2>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={visitorTypeData}
                dataKey="value"
                nameKey="name"
                outerRadius={80}
                label={({ name, value }) => `${name}: ${value}`}
              >
                {visitorTypeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Most Visited Tourist Spots */}
      <Card>
        <CardContent className="p-4">
          <h2 className="text-xl font-semibold mb-3">Most Visited Tourist Spots</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={spotData}>
              <XAxis dataKey="spot" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#60a5fa" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
