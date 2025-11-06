'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

export default function ReportsPage() {
  const [visitLogs, setVisitLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      const snapshot = await getDocs(collection(db, 'visitLogs'));
      const logs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setVisitLogs(logs);
      setLoading(false);
    };
    fetchLogs();
  }, []);

  if (loading) return <p className="text-center mt-10">Loading reports...</p>;

  // --- 📊 Process Data ---
  const monthlyCounts: Record<string, number> = {};
  const spotCounts: Record<string, number> = {};
  const visitorTypes = { domestic: 0, foreign: 0 };

  visitLogs.forEach(log => {
    // Month count
    const month = log.month || 'Unknown';
    monthlyCounts[month] = (monthlyCounts[month] || 0) + (log.numberOfVisitors || 1);

    // Spot count
    const spot = log.spots?.[0] || 'Unknown';
    spotCounts[spot] = (spotCounts[spot] || 0) + (log.numberOfVisitors || 1);

    // Visitor type
    if (log.originType === 'foreign') visitorTypes.foreign++;
    else visitorTypes.domestic++;
  });

  const monthlyData = Object.entries(monthlyCounts).map(([month, count]) => ({ month, count }));
  const spotData = Object.entries(spotCounts).map(([spot, count]) => ({ spot, count }));
  const visitorTypeData = [
    { name: 'Domestic', value: visitorTypes.domestic },
    { name: 'Foreign', value: visitorTypes.foreign },
  ];

  // --- 🎨 Colors ---
  const COLORS = ['#34d399', '#60a5fa'];

  // --- 🧮 Totals ---
  const totalVisitors = visitLogs.reduce((sum, log) => sum + (log.numberOfVisitors || 1), 0);
  const totalThisMonth = monthlyCounts[new Date().toLocaleString('default', { month: 'long' })] || 0;
  const totalYear = new Date().getFullYear();

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold text-green-700 mb-6">📈 Tourism Reports Dashboard</h1>

      {/* Summary Cards */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-gray-500">Total Visitors This Month</p>
            <p className="text-3xl font-bold text-green-600">{totalThisMonth}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-gray-500">Total Visitors This Year ({totalYear})</p>
            <p className="text-3xl font-bold text-green-600">{totalVisitors}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-gray-500">Most Popular Spot</p>
            <p className="text-2xl font-semibold">
              {Object.entries(spotCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Visitors Chart */}
      <Card>
        <CardContent className="p-4">
          <h2 className="text-xl font-semibold mb-3">Monthly Visitors</h2>
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

      {/* Visitor Type Pie Chart */}
      <Card>
        <CardContent className="p-4">
          <h2 className="text-xl font-semibold mb-3">Visitor Type</h2>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={visitorTypeData} dataKey="value" nameKey="name" outerRadius={80} label>
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

      {/* Top Spots Bar Chart */}
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
