'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { FileText, Download, TrendingUp, Users, MapPin, Calendar, BarChart2, PieChart, Globe, User } from 'lucide-react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

type TimeRange = 'monthly' | 'quarterly' | 'yearly';

// Sample data for private spot
const generateReportData = () => ({
  totalVisits: 856,
  uniqueVisitors: 623,
  totalRevenue: 42800,
  averageRating: 4.7,
  topMonths: [
    { month: 'December', visitors: 210, revenue: 10500 },
    { month: 'April', visitors: 185, revenue: 9250 },
    { month: 'March', visitors: 165, revenue: 8250 },
    { month: 'July', visitors: 150, revenue: 7500 },
    { month: 'January', visitors: 146, revenue: 7300 },
  ],
  monthlyVisits: [
    { month: 'Jan', count: 146 },
    { month: 'Feb', count: 125 },
    { month: 'Mar', count: 165 },
    { month: 'Apr', count: 185 },
    { month: 'May', count: 142 },
    { month: 'Jun', count: 138 },
    { month: 'Jul', count: 150 },
    { month: 'Aug', count: 132 },
    { month: 'Sep', count: 145 },
    { month: 'Oct', count: 158 },
    { month: 'Nov', count: 172 },
    { month: 'Dec', count: 210 },
  ],
  visitorsByMonth: 0 // Will be calculated
});

interface ReportData {
  totalVisits: number;
  uniqueVisitors: number;
  totalRevenue: number;
  averageRating: number;
  topMonths: Array<{ month: string; visitors: number; revenue: number }>;
  monthlyVisits: Array<{ month: string; count: number }>;
  visitorsByMonth: number;
}

export default function PrivateSpotReportsPage() {
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState<TimeRange>('monthly');
  const [activeTab, setActiveTab] = useState('overview');
  
  // Generate sample data
  const reportData = generateReportData();
  // Calculate visitors for current month
  const currentMonth = new Date().getMonth();
  reportData.visitorsByMonth = reportData.monthlyVisits[currentMonth]?.count || 0;

  // Chart data
  const spotData = {
    labels: reportData.topMonths.map(month => month.month),
    datasets: [
      {
        label: 'Number of Visitors',
        data: reportData.topMonths.map(month => month.visitors),
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

  const revenueData = {
    labels: reportData.monthlyVisits.map(month => month.month),
    datasets: [
      {
        label: 'Revenue (₱)',
        data: reportData.monthlyVisits.map(month => month.count * 50), // Sample multiplier for revenue
        backgroundColor: 'rgba(75, 192, 192, 0.7)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      },
    ],
  };

  const visitorOriginData = {
    labels: ['Local', 'National', 'International'],
    datasets: [
      {
        label: 'Visitors by Origin',
        data: [
          Math.floor(reportData.uniqueVisitors * 0.5), // 50% local
          Math.floor(reportData.uniqueVisitors * 0.4), // 40% national
          Math.ceil(reportData.uniqueVisitors * 0.1)   // 10% international
        ],
        backgroundColor: [
          'rgba(54, 162, 235, 0.7)',
          'rgba(75, 192, 192, 0.7)',
          'rgba(255, 159, 64, 0.7)'
        ],
        borderColor: [
          'rgba(54, 162, 235, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(255, 159, 64, 1)'
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
    let csvContent = `Private Spot Report - ${user?.displayName || 'My Spot'}\n\n`;
    csvContent += `Report Generated: ${new Date().toLocaleDateString()}\n\n`;
    csvContent += `Summary Statistics\n`;
    csvContent += `Total Visits,${reportData.totalVisits}\n`;
    csvContent += `Unique Visitors,${reportData.uniqueVisitors}\n`;
    csvContent += `Total Revenue,₱${reportData.totalRevenue.toLocaleString()}\n`;
    csvContent += `Average Rating,${reportData.averageRating}/5\n\n`;
    
    csvContent += `Top Months\n`;
    csvContent += `Month,Visitors,Revenue\n`;
    reportData.topMonths.forEach(month => {
      csvContent += `${month.month},${month.visitors},₱${month.revenue.toLocaleString()}\n`;
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
    a.download = `Private_Spot_Report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'visitors':
        return (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium mb-4">Monthly Visitors</h3>
              <div className="h-80">
                <Bar data={revenueData} options={chartOptions} />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium mb-4">Visitor Origins</h3>
                <div className="h-64">
                  <Pie data={visitorOriginData} options={chartOptions} />
                </div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium mb-4">Top Months</h3>
                <div className="space-y-4">
                  {reportData.topMonths.map((item, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="font-medium">{item.month}</span>
                      <div className="flex items-center space-x-4">
                        <span className="text-gray-600">{item.visitors} visitors</span>
                        <span className="font-medium">₱{item.revenue.toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      case 'revenue':
        return (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium mb-4">Monthly Revenue</h3>
              <div className="h-80">
                <Bar data={revenueData} options={{
                  ...chartOptions,
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: {
                        callback: (value: any) => `₱${value.toLocaleString()}`
                      }
                    }
                  }
                }} />
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium mb-4">Revenue Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500">Total Revenue</p>
                  <p className="text-2xl font-bold">₱{reportData.totalRevenue.toLocaleString()}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500">This Month</p>
                  <p className="text-2xl font-bold">₱{(reportData.visitorsByMonth * 50).toLocaleString()}</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500">Avg. Revenue/Visitor</p>
                  <p className="text-2xl font-bold">₱50</p>
                </div>
              </div>
            </div>
          </div>
        );
      default: // overview
        return (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Total Visits</p>
                    <p className="text-2xl font-bold">{reportData.totalVisits}</p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-full text-blue-600">
                    <Users className="h-6 w-6" />
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-sm text-green-600">
                    <span className="font-medium">+12.5%</span> from last month
                  </p>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Unique Visitors</p>
                    <p className="text-2xl font-bold">{reportData.uniqueVisitors}</p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-full text-green-600">
                    <User className="h-6 w-6" />
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-sm text-green-600">
                    <span className="font-medium">+8.3%</span> from last month
                  </p>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Total Revenue</p>
                    <p className="text-2xl font-bold">₱{reportData.totalRevenue.toLocaleString()}</p>
                  </div>
                  <div className="p-3 bg-yellow-100 rounded-full text-yellow-600">
                    <TrendingUp className="h-6 w-6" />
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-sm text-green-600">
                    <span className="font-medium">+15.2%</span> from last month
                  </p>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Average Rating</p>
                    <div className="flex items-center">
                      <span className="text-2xl font-bold">{reportData.averageRating}</span>
                      <span className="text-gray-500 ml-1">/ 5.0</span>
                    </div>
                  </div>
                  <div className="p-3 bg-purple-100 rounded-full text-purple-600">
                    <BarChart2 className="h-6 w-6" />
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-sm text-green-600">
                    <span className="font-medium">+0.2</span> from last month
                  </p>
                </div>
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium mb-4">Monthly Visitors</h3>
                <div className="h-64">
                  <Bar data={revenueData} options={chartOptions} />
                </div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium mb-4">Visitor Origins</h3>
                <div className="h-64">
                  <Pie data={visitorOriginData} options={chartOptions} />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Recent Activity</h3>
                <button 
                  onClick={() => setActiveTab('visitors')}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  View All
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Visitors</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reportData.monthlyVisits.slice(-5).reverse().map((month, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{month.month}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{month.count}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₱{(month.count * 50).toLocaleString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            Completed
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Private Spot Analytics</h1>
          <p className="mt-2 text-gray-600">Track your spot's performance and visitor statistics</p>
        </div>
        <div className="mt-4 md:mt-0 flex space-x-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as TimeRange)}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
            <option value="yearly">Yearly</option>
          </select>
          <button
            onClick={handleExportReport}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`${activeTab === 'overview' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            <div className="flex items-center">
              <BarChart2 className="h-5 w-5 mr-2" />
              Overview
            </div>
          </button>
          <button
            onClick={() => setActiveTab('visitors')}
            className={`${activeTab === 'visitors' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            <div className="flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Visitors
            </div>
          </button>
          <button
            onClick={() => setActiveTab('revenue')}
            className={`${activeTab === 'revenue' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            <div className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              Revenue
            </div>
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mb-8">
        {renderTabContent()}
      </div>
    </div>
  );
}
