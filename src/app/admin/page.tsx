'use client';

import { useEffect, useState, useMemo } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent } from '@/components/ui/card';

// ✅ Chart.js imports
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Line, Pie } from 'react-chartjs-2';

// ✅ Recharts imports (for bar chart)
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  Legend as RechartsLegend,
  CartesianGrid,
  ResponsiveContainer,
} from 'recharts';

// ✅ Register Chart.js components
ChartJS.register(
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

export default function AdminDashboard() {
  const [visits, setVisits] = useState<any[]>([]);
  const [activeUsers, setActiveUsers] = useState(0);
  const [inactiveUsers, setInactiveUsers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'monthly' | 'quarterly' | 'yearly'>('monthly');

  // 🎯 Fetch visits and user stats
  useEffect(() => {
    const fetchData = async () => {
      try {
        // ✅ Fetch only completed visits directly from Firestore
        const visitsQuery = query(collection(db, 'visits'), where('status', '==', 'Completed'));
        const visitsSnapshot = await getDocs(visitsQuery);
        const visitsData = visitsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setVisits(visitsData);

        // ✅ Fetch all user collections
        const barangayAdminsSnapshot = await getDocs(collection(db, 'barangayAdmins'));
        const privateOwnersSnapshot = await getDocs(collection(db, 'privateSpotOwners'));
        const usersSnapshot = await getDocs(collection(db, 'users'));

        // ✅ Updated filter function (checks both isActive + status)
        const filterByStatus = (docs: any[], active = true) =>
          docs
            .map((doc) => doc.data())
            .filter((u: any) => {
              const status = (u.status || '').toString().toLowerCase();
              const isActive = u.isActive;

              if (active) {
                return isActive === true || status === 'active';
              } else {
                return isActive === false || status === 'inactive';
              }
            });

        // ✅ Count users properly across all collections
        const active =
          filterByStatus(barangayAdminsSnapshot.docs, true).length +
          filterByStatus(privateOwnersSnapshot.docs, true).length +
          filterByStatus(usersSnapshot.docs, true).length;

        const inactive =
          filterByStatus(barangayAdminsSnapshot.docs, false).length +
          filterByStatus(privateOwnersSnapshot.docs, false).length +
          filterByStatus(usersSnapshot.docs, false).length;

        setActiveUsers(active);
        setInactiveUsers(inactive);
      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // ⚙️ Filter data by month, quarter, or year
  const filteredData = useMemo(() => {
    const now = new Date();

    if (filter === 'monthly') {
      const thisMonth = now.getMonth() + 1;
      return visits.filter((v) => new Date(v.date).getMonth() + 1 === thisMonth);
    } else if (filter === 'quarterly') {
      const currentMonth = now.getMonth();
      const startMonth = Math.floor(currentMonth / 3) * 3;
      return visits.filter((v) => {
        const visitDate = new Date(v.date);
        return (
          visitDate.getMonth() >= startMonth &&
          visitDate.getMonth() < startMonth + 3
        );
      });
    } else {
      const currentYear = now.getFullYear();
      return visits.filter((v) => new Date(v.date).getFullYear() === currentYear);
    }
  }, [filter, visits]);

  // 🧮 Compute stats
  const monthlyCounts: Record<string, number> = {};
  const spotCounts: Record<string, number> = {};
  const visitorTypes = { domestic: 0, foreign: 0 };

  filteredData.forEach((visit) => {
    const visitDate = new Date(visit.date);
    const month = visitDate.toLocaleString('default', { month: 'short' });
    monthlyCounts[month] = (monthlyCounts[month] || 0) + 1;

    visit.spots?.forEach((spot: string) => {
      spotCounts[spot] = (spotCounts[spot] || 0) + 1;
    });

    if (visit.visitorType === 'foreign') visitorTypes.foreign++;
    else visitorTypes.domestic++;
  });

  const monthlyLabels = Object.keys(monthlyCounts);
  const monthlyValues = Object.values(monthlyCounts);

  const spotData = Object.entries(spotCounts).map(([spot, count]) => ({
    spot,
    count,
  }));

  // 🧩 Chart.js Configs
  const lineData = {
    labels: monthlyLabels,
    datasets: [
      {
        label: 'Visitors',
        data: monthlyValues,
        fill: false,
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1,
      },
    ],
  };

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: true }, title: { display: false } },
  };

  const pieData = {
    labels: ['Domestic', 'Foreign'],
    datasets: [
      {
        label: 'Visitor Types',
        data: [visitorTypes.domestic, visitorTypes.foreign],
        backgroundColor: ['rgb(255, 99, 132)', 'rgb(54, 162, 235)'],
        hoverOffset: 4,
      },
    ],
  };

  const totalVisitors = filteredData.length;
  const totalThisMonth =
    monthlyCounts[new Date().toLocaleString('default', { month: 'short' })] || 0;
  const totalYear = new Date().getFullYear();

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

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-green-700">📊 Tourism Dashboard</h1>

        {/* Filter Buttons */}
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

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Line Chart */}
        <Card className="h-[280px]">
          <CardContent className="p-4 h-full">
            <h2 className="text-lg font-semibold mb-3">Visitors by Month</h2>
            <div className="h-[200px]">
              <Line data={lineData} options={lineOptions} />
            </div>
          </CardContent>
        </Card>

        {/* Pie Chart */}
        <Card className="h-[280px]">
          <CardContent className="p-4 h-full">
            <h2 className="text-lg font-semibold mb-3">Visitor Type Distribution</h2>
            <div className="h-[200px] flex items-center justify-center">
              <Pie data={pieData} options={{ maintainAspectRatio: false }} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ✅ Most Visited Tourist Spots */}
      <Card>
        <CardContent className="p-4">
          <h2 className="text-xl font-semibold mb-3">Most Visited Tourist Spots</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={spotData || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="spot" />
              <YAxis />
              <RechartsTooltip />
              <RechartsLegend />
              <Bar dataKey="count" fill="#60a5fa" barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
