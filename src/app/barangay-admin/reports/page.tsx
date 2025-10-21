'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/firebase/config';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { FileText, Download, TrendingUp, Users, MapPin, Calendar } from 'lucide-react';

interface ReportData {
  totalVisits: number;
  uniqueTourists: number;
  touristSpots: number;
  topSpots: Array<{ name: string; visits: number }>;
  monthlyVisits: Array<{ month: string; count: number }>;
  visitorsByMonth: number;
}

export default function ReportsPage() {
  const { barangayAdminData } = useAuth();
  const [reportData, setReportData] = useState<ReportData>({
    totalVisits: 0,
    uniqueTourists: 0,
    touristSpots: 0,
    topSpots: [],
    monthlyVisits: [],
    visitorsByMonth: 0
  });
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('all');
  const [dateRange, setDateRange] = useState({
    start: '',
    end: ''
  });

  useEffect(() => {
    if (barangayAdminData?.barangayName) {
      fetchReportData();
    }
  }, [barangayAdminData, selectedPeriod]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const barangayName = barangayAdminData?.barangayName;

      // Fetch visits and spots in parallel
      const [visitsSnapshot, spotsSnapshot] = await Promise.all([
        getDocs(query(collection(db, 'visits'), where('barangay', '==', barangayName))),
        getDocs(query(collection(db, 'touristSpots'), where('barangay', '==', barangayName)))
      ]);

      const visits = visitsSnapshot.docs.map(doc => doc.data());

      // Calculate unique tourists
      const uniqueTouristIds = new Set(visits.map(v => v.userId).filter(Boolean));

      // Calculate top spots
      const spotVisits: { [key: string]: number } = {};
      visits.forEach(visit => {
        const spotName = visit.spotName || 'Unknown';
        spotVisits[spotName] = (spotVisits[spotName] || 0) + 1;
      });

      const topSpots = Object.entries(spotVisits)
        .map(([name, visits]) => ({ name, visits }))
        .sort((a, b) => b.visits - a.visits)
        .slice(0, 5);

      // Calculate monthly visits (last 6 months)
      const monthlyData: { [key: string]: number } = {};
      const now = new Date();
      
      visits.forEach(visit => {
        if (visit.createdAt) {
          const visitDate = visit.createdAt.toDate ? visit.createdAt.toDate() : new Date(visit.createdAt);
          const monthKey = `${visitDate.getFullYear()}-${String(visitDate.getMonth() + 1).padStart(2, '0')}`;
          monthlyData[monthKey] = (monthlyData[monthKey] || 0) + 1;
        }
      });

      const monthlyVisits = Object.entries(monthlyData)
        .map(([month, count]) => ({ month, count }))
        .sort((a, b) => a.month.localeCompare(b.month))
        .slice(-6);

      // Current month visitors
      const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const visitorsByMonth = monthlyData[currentMonth] || 0;

      setReportData({
        totalVisits: visits.length,
        uniqueTourists: uniqueTouristIds.size,
        touristSpots: spotsSnapshot.size,
        topSpots,
        monthlyVisits,
        visitorsByMonth
      });

      setLoading(false);
    } catch (error) {
      console.error('Error fetching report data:', error);
      setLoading(false);
    }
  };

  const handleExportReport = () => {
    // Create CSV content
    let csvContent = `Barangay Tourism Report - ${barangayAdminData?.barangayName}\n\n`;
    csvContent += `Report Generated: ${new Date().toLocaleDateString()}\n\n`;
    csvContent += `Summary Statistics\n`;
    csvContent += `Total Visits,${reportData.totalVisits}\n`;
    csvContent += `Unique Tourists,${reportData.uniqueTourists}\n`;
    csvContent += `Tourist Spots,${reportData.touristSpots}\n`;
    csvContent += `This Month Visitors,${reportData.visitorsByMonth}\n\n`;
    
    csvContent += `Top Tourist Spots\n`;
    csvContent += `Spot Name,Number of Visits\n`;
    reportData.topSpots.forEach(spot => {
      csvContent += `${spot.name},${spot.visits}\n`;
    });

    csvContent += `\nMonthly Visits\n`;
    csvContent += `Month,Visits\n`;
    reportData.monthlyVisits.forEach(month => {
      csvContent += `${month.month},${month.count}\n`;
    });

    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${barangayAdminData?.barangayName}_Tourism_Report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading report data...
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="p-6 bg-white border-b flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <FileText size={28} />
            Barangay Reports
          </h1>
          <p className="text-gray-600 mt-1">
            Tourism statistics and analytics for {barangayAdminData?.barangayName}
          </p>
        </div>
        <button
          onClick={handleExportReport}
          className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition flex items-center gap-2"
        >
          <Download size={20} />
          Export Report
        </button>
      </div>

      <div className="p-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-gray-600 text-sm font-medium">Total Visits</h3>
              <div className="p-2 bg-blue-100 rounded-lg">
                <TrendingUp size={20} className="text-blue-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-800">{reportData.totalVisits}</p>
            <p className="text-sm text-gray-500 mt-1">All time</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-gray-600 text-sm font-medium">Unique Tourists</h3>
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users size={20} className="text-purple-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-800">{reportData.uniqueTourists}</p>
            <p className="text-sm text-gray-500 mt-1">Different visitors</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-gray-600 text-sm font-medium">Tourist Spots</h3>
              <div className="p-2 bg-orange-100 rounded-lg">
                <MapPin size={20} className="text-orange-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-800">{reportData.touristSpots}</p>
            <p className="text-sm text-gray-500 mt-1">Active locations</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-gray-600 text-sm font-medium">This Month</h3>
              <div className="p-2 bg-green-100 rounded-lg">
                <Calendar size={20} className="text-green-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-800">{reportData.visitorsByMonth}</p>
            <p className="text-sm text-gray-500 mt-1">New visitors</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Tourist Spots */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <MapPin size={24} className="text-orange-600" />
              Top Tourist Spots
            </h2>
            {reportData.topSpots.length > 0 ? (
              <div className="space-y-3">
                {reportData.topSpots.map((spot, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold">
                        {index + 1}
                      </div>
                      <span className="font-medium text-gray-800">{spot.name}</span>
                    </div>
                    <span className="text-gray-600 font-semibold">{spot.visits} visits</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No visit data available</p>
            )}
          </div>

          {/* Monthly Visits Chart */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <TrendingUp size={24} className="text-blue-600" />
              Monthly Visits (Last 6 Months)
            </h2>
            {reportData.monthlyVisits.length > 0 ? (
              <div className="space-y-3">
                {reportData.monthlyVisits.map((month, index) => {
                  const maxVisits = Math.max(...reportData.monthlyVisits.map(m => m.count));
                  const percentage = (month.count / maxVisits) * 100;
                  
                  return (
                    <div key={index}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">{month.month}</span>
                        <span className="font-semibold text-gray-800">{month.count} visits</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className="bg-blue-500 h-3 rounded-full transition-all duration-300"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No monthly data available</p>
            )}
          </div>
        </div>

        {/* Additional Insights */}
        <div className="mt-6 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Report Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-700 mb-2">Key Metrics</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• Average visits per spot: {reportData.touristSpots > 0 ? (reportData.totalVisits / reportData.touristSpots).toFixed(1) : 0}</li>
                <li>• Visitor return rate: {reportData.uniqueTourists > 0 ? ((reportData.totalVisits / reportData.uniqueTourists) * 100).toFixed(1) : 0}%</li>
                <li>• Most popular spot: {reportData.topSpots[0]?.name || 'N/A'}</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-gray-700 mb-2">Report Period</h3>
              <p className="text-gray-600">
                This report includes all tourism data for {barangayAdminData?.barangayName} from the beginning of records to {new Date().toLocaleDateString()}.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
