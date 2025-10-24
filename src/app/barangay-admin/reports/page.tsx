'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { FileText, Download, TrendingUp, Users, MapPin, Calendar, BarChart2, PieChart, Globe, User } from 'lucide-react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

type TimeRange = 'monthly' | 'quarterly' | 'yearly';

// Sample data
const generateReportData = (): ReportData => ({
  totalVisits: 1245,
  uniqueTourists: 842,
  touristSpots: 8,
  topSpots: [
    { name: 'Ampongot Rice Terraces', visits: 450 },
    { name: 'Amburayan River', visits: 380 },
    { name: 'Mt. Tagpew', visits: 210 },
    { name: 'Taba-ao Falls', visits: 185 },
    { name: 'Balakbak Rice Terraces', visits: 120 }
  ],
  monthlyVisits: [
    { month: 'Jan', count: 85 },
    { month: 'Feb', count: 92 },
    { month: 'Mar', count: 78 },
    { month: 'Apr', count: 64 },
    { month: 'May', count: 105 },
    { month: 'Jun', count: 132 },
    { month: 'Jul', count: 148 },
    { month: 'Aug', count: 126 },
    { month: 'Sep', count: 89 },
    { month: 'Oct', count: 97 },
    { month: 'Nov', count: 110 },
    { month: 'Dec', count: 98 }
  ],
  visitorsByMonth: 0 // Will be calculated
});

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
  const [timeRange, setTimeRange] = useState<TimeRange>('monthly');
  const [activeTab, setActiveTab] = useState('overview');
  
  // Generate sample data
  const reportData = generateReportData();
  // Calculate visitors for current month
  const currentMonth = new Date().getMonth();
  reportData.visitorsByMonth = reportData.monthlyVisits[currentMonth]?.count || 0;

  // Chart data
  const spotData = {
    labels: reportData.topSpots.map(spot => spot.name),
    datasets: [
      {
        label: 'Number of Visitors',
        data: reportData.topSpots.map(spot => spot.visits),
        backgroundColor: [
          'rgba(255, 99, 132, 0.7)',
          'rgba(54, 162, 235, 0.7)',
          'rgba(255, 206, 86, 0.7)',
          'rgba(75, 192, 192, 0.7)',
          'rgba(153, 102, 255, 0.7)',
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const visitorDemographics = {
    labels: ['Local', 'National', 'International'],
    datasets: [
      {
        label: 'Number of Visitors',
        data: [620, 380, 245],
        backgroundColor: [
          'rgba(255, 99, 132, 0.7)',
          'rgba(54, 162, 235, 0.7)',
          'rgba(255, 206, 86, 0.7)',
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const revenueData = {
    labels: reportData.monthlyVisits.map(month => month.month),
    datasets: [
      {
        label: 'Entrance Fees',
        data: reportData.monthlyVisits.map(month => month.count * 100), // Sample multiplier for revenue
        backgroundColor: 'rgba(75, 192, 192, 0.7)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      },
      {
        label: 'Guide Fees',
        data: reportData.monthlyVisits.map(month => month.count * 50), // Sample multiplier for guide fees
        backgroundColor: 'rgba(54, 162, 235, 0.7)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      },
    ],
  };

  const originData = {
    labels: ['Local', 'National', 'International'],
    datasets: [
      {
        label: 'Visitors by Origin',
        data: [
          Math.floor(reportData.uniqueTourists * 0.6), // 60% local
          Math.floor(reportData.uniqueTourists * 0.3), // 30% national
          Math.ceil(reportData.uniqueTourists * 0.1)   // 10% international
        ],
        backgroundColor: [
          'rgba(75, 192, 192, 0.7)',
          'rgba(54, 162, 235, 0.7)',
          'rgba(255, 99, 132, 0.7)'
        ],
        borderColor: [
          'rgba(75, 192, 192, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 99, 132, 1)'
        ],
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
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


  const renderTabContent = () => {
    switch (activeTab) {
      case 'visitors':
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Users size={24} />
              Visitor Demographics
            </h2>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <Bar data={visitorDemographics} options={chartOptions} />
            </div>
          </div>
        );
      case 'revenue':
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <BarChart2 size={24} />
              Revenue Overview
            </h2>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <Bar data={revenueData} options={{
                ...chartOptions,
                scales: {
                  x: { stacked: true },
                  y: { stacked: true }
                },
              }} />
            </div>
          </div>
        );
      case 'origin':
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Globe size={24} />
              Visitor Origin
            </h2>
            <div className="bg-white p-6 rounded-lg shadow-md max-w-md mx-auto">
              <Pie data={originData} options={chartOptions} />
            </div>
          </div>
        );
      default:
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <MapPin size={24} />
              Visitors per Tourist Spot
            </h2>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <Bar data={spotData} options={chartOptions} />
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen">
      <div className="p-6 bg-white border-b">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <FileText size={28} />
              Barangay Reports
            </h1>
            <p className="text-gray-600">
              Tourism statistics and analytics for {barangayAdminData?.barangayName}
            </p>
          </div>
          <button
            onClick={handleExportReport}
            className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition flex items-center gap-2 h-fit"
          >
            <Download size={20} />
            Export Report
          </button>
        </div>
        
        {/* Time Range Selector */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setTimeRange('monthly')}
            className={`px-4 py-2 rounded-lg ${timeRange === 'monthly' ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}
          >
            Monthly
          </button>
          <button
            onClick={() => setTimeRange('quarterly')}
            className={`px-4 py-2 rounded-lg ${timeRange === 'quarterly' ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}
          >
            Quarterly
          </button>
          <button
            onClick={() => setTimeRange('yearly')}
            className={`px-4 py-2 rounded-lg ${timeRange === 'yearly' ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}
          >
            Yearly
          </button>
        </div>
        
        {/* Navigation Tabs */}
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 font-medium ${activeTab === 'overview' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600'}`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('visitors')}
            className={`px-4 py-2 font-medium ${activeTab === 'visitors' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600'}`}
          >
            <div className="flex items-center gap-2">
              <Users size={18} />
              Visitor Demographics
            </div>
          </button>
          <button
            onClick={() => setActiveTab('revenue')}
            className={`px-4 py-2 font-medium ${activeTab === 'revenue' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600'}`}
          >
            <div className="flex items-center gap-2">
              <BarChart2 size={18} />
              Revenue
            </div>
          </button>
          <button
            onClick={() => setActiveTab('origin')}
            className={`px-4 py-2 font-medium ${activeTab === 'origin' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600'}`}
          >
            <div className="flex items-center gap-2">
              <Globe size={18} />
              Visitor Origin
            </div>
          </button>
        </div>
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
            <p className="text-sm text-gray-500 mt-1">This month's visitors</p>
          </div>
        </div>
        {renderTabContent()}
      </div>
    </div>
  );
}
