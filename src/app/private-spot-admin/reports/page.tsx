'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  TrendingUp, 
  Calendar,
  Download,
  Users,
  MapPin,
  Eye,
  Filter
} from 'lucide-react';

export default function ReportsPage() {
  const { privateSpotAdminData } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });
  const [reportData, setReportData] = useState({
    totalVisits: 0,
    totalSpots: 0,
    visitsBySpot: [] as any[],
    visitsByMonth: [] as any[],
    recentVisits: [] as any[],
  });

  useEffect(() => {
    fetchReportData();
  }, [privateSpotAdminData, dateRange]);

  const fetchReportData = async () => {
    if (!privateSpotAdminData?.uid) return;

    try {
      setLoading(true);

      // Fetch owned spots
      const spotsQuery = query(
        collection(db, 'touristSpots'),
        where('ownerId', '==', privateSpotAdminData.uid),
        where('isPrivate', '==', true)
      );
      const spotsSnapshot = await getDocs(spotsQuery);
      const spots = spotsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const spotIds = spots.map(spot => spot.id);

      if (spotIds.length === 0) {
        setReportData({
          totalVisits: 0,
          totalSpots: 0,
          visitsBySpot: [],
          visitsByMonth: [],
          recentVisits: [],
        });
        setLoading(false);
        return;
      }

      // Fetch visits for owned spots
      const visitsQuery = query(
        collection(db, 'visits'),
        where('spotId', 'in', spotIds),
        orderBy('visitDate', 'desc')
      );
      const visitsSnapshot = await getDocs(visitsQuery);
      const allVisits = visitsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Filter by date range
      const filteredVisits = allVisits.filter(visit => {
        const visitDate = new Date(visit.visitDate);
        const start = new Date(dateRange.startDate);
        const end = new Date(dateRange.endDate);
        return visitDate >= start && visitDate <= end;
      });

      // Calculate visits by spot
      const visitsBySpot = spots.map(spot => {
        const spotVisits = filteredVisits.filter(visit => visit.spotId === spot.id);
        return {
          spotName: spot.name,
          visits: spotVisits.length,
        };
      }).sort((a, b) => b.visits - a.visits);

      // Calculate visits by month
      const monthsMap = new Map<string, number>();
      filteredVisits.forEach(visit => {
        const month = new Date(visit.visitDate).toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'short' 
        });
        monthsMap.set(month, (monthsMap.get(month) || 0) + 1);
      });
      const visitsByMonth = Array.from(monthsMap.entries()).map(([month, count]) => ({
        month,
        visits: count,
      }));

      setReportData({
        totalVisits: filteredVisits.length,
        totalSpots: spots.length,
        visitsBySpot,
        visitsByMonth,
        recentVisits: filteredVisits.slice(0, 10),
      });
    } catch (error) {
      console.error('Error fetching report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (reportData.recentVisits.length === 0) {
      alert('No data to export');
      return;
    }

    const headers = ['Date', 'Visitor Name', 'Spot Name', 'Check-in Method'];
    const rows = reportData.recentVisits.map(visit => [
      new Date(visit.visitDate).toLocaleDateString(),
      visit.visitorName || 'Unknown',
      visit.spotName || 'Unknown',
      visit.checkInMethod || 'manual',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `visits-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-600">Loading reports...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Reports & Analytics</h1>
          <p className="text-gray-600 mt-1">View insights and statistics for your tourist spots</p>
        </div>
        <button
          onClick={handleExportCSV}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
        >
          <Download size={20} />
          Export CSV
        </button>
      </div>

      {/* Date Range Filter */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-sm p-6"
      >
        <div className="flex items-center gap-3 mb-4">
          <Filter className="text-gray-600" size={20} />
          <h2 className="text-lg font-semibold text-gray-800">Filter by Date Range</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={fetchReportData}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Apply Filter
            </button>
          </div>
        </div>
      </motion.div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-blue-500"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Total Visits</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">{reportData.totalVisits}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <Users className="text-blue-600" size={24} />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-green-500"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Active Spots</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">{reportData.totalSpots}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <MapPin className="text-green-600" size={24} />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-purple-500"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Avg. Visits/Spot</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">
                {reportData.totalSpots > 0 
                  ? Math.round(reportData.totalVisits / reportData.totalSpots) 
                  : 0}
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <TrendingUp className="text-purple-600" size={24} />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Visits by Spot */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl shadow-sm p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <BarChart3 className="text-blue-600" size={24} />
            <h2 className="text-xl font-semibold text-gray-800">Visits by Tourist Spot</h2>
          </div>
          <div className="space-y-3">
            {reportData.visitsBySpot.length > 0 ? (
              reportData.visitsBySpot.map((spot, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">{spot.spotName}</span>
                      <span className="text-sm text-gray-600">{spot.visits} visits</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{
                          width: `${reportData.totalVisits > 0 
                            ? (spot.visits / reportData.totalVisits) * 100 
                            : 0}%`
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No visit data available</p>
            )}
          </div>
        </motion.div>

        {/* Visits by Month */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-xl shadow-sm p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <Calendar className="text-green-600" size={24} />
            <h2 className="text-xl font-semibold text-gray-800">Visits by Month</h2>
          </div>
          <div className="space-y-3">
            {reportData.visitsByMonth.length > 0 ? (
              reportData.visitsByMonth.map((month, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">{month.month}</span>
                      <span className="text-sm text-gray-600">{month.visits} visits</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{
                          width: `${reportData.totalVisits > 0 
                            ? (month.visits / reportData.totalVisits) * 100 
                            : 0}%`
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No monthly data available</p>
            )}
          </div>
        </motion.div>
      </div>

      {/* Recent Visits Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white rounded-xl shadow-sm p-6"
      >
        <div className="flex items-center gap-3 mb-4">
          <Eye className="text-purple-600" size={24} />
          <h2 className="text-xl font-semibold text-gray-800">Recent Visits</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Visitor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tourist Spot
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Method
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reportData.recentVisits.length > 0 ? (
                reportData.recentVisits.map((visit) => (
                  <tr key={visit.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(visit.visitDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {visit.visitorName || 'Unknown'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {visit.spotName || 'Unknown'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        visit.checkInMethod === 'qr-scan' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {visit.checkInMethod || 'manual'}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                    No recent visits
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
