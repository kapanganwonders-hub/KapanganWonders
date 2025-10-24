'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { 
  
  FileText, Download, TrendingUp, Users, MapPin, Calendar, 
  BarChart2, PieChart as PieChartIcon, Globe, Landmark, 
  Home, Map, DollarSign, UserCheck, MapPinned
} from 'lucide-react';
import { 
  Chart as ChartJS, 
  ArcElement, 
  Tooltip, 
  Legend, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title,
  LineElement,
  PointElement
} from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  ArcElement, 
  Tooltip, 
  Legend, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title,
  LineElement,
  PointElement
);

type TimeRange = 'week' | 'month' | 'year';
type ChartType = 'barangay' | 'touristSpot' | 'revenue' | 'demographics' | 'origin';

// Sample data
const generateReportData = (): ReportData => {
  const barangays = [
    'Balakbak', 'Bayoyo', 'Belen', 'Cayapes', 'Cuba', 
    'Datakan', 'Gadang', 'Gaswiling', 'Labueg', 'Paykek', 
    'Pongayan', 'Pudong', 'Puguis', 'Pongayan', 'Sagubo', 
    'Taba-ao', 'Tacadang', 'Tukukan', 'Tuel'
  ];

  // Generate random data for barangays
  const barangayVisits = barangays.map(barangay => ({
    name: barangay,
    visits: Math.floor(Math.random() * 1000) + 100
  })).sort((a, b) => b.visits - a.visits);

  // Top tourist spots with realistic names
  const topSpots = [
    { name: 'Ampongot Rice Terraces', visits: 1450, barangay: 'Sagubo' },
    { name: 'Amburayan River', visits: 1380, barangay: 'Taba-ao' },
    { name: 'Mt. Tagpew', visits: 1210, barangay: 'Tacadang' },
    { name: 'Taba-ao Falls', visits: 985, barangay: 'Taba-ao' },
    { name: 'Balakbak Rice Terraces', visits: 920, barangay: 'Balakbak' },
    { name: 'Pudong Rice Terraces', visits: 850, barangay: 'Pudong' },
    { name: 'Pongayan Falls', visits: 780, barangay: 'Pongayan' },
    { name: 'Gaswiling Hot Springs', visits: 720, barangay: 'Gaswiling' }
  ].sort((a, b) => b.visits - a.visits);

  // Monthly data for the past 12 months
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];
  
  const currentMonth = new Date().getMonth();
  const monthlyVisits = months.map((month, index) => ({
    month,
    count: Math.floor(Math.random() * 500) + 300,
    entranceFee: Math.floor(Math.random() * 50000) + 20000,
    guideFee: Math.floor(Math.random() * 30000) + 10000,
    local: Math.floor(Math.random() * 200) + 100,
    national: Math.floor(Math.random() * 150) + 50,
    international: Math.floor(Math.random() * 100) + 20
  }));

  // Calculate totals
  const totalVisits = barangayVisits.reduce((sum, b) => sum + b.visits, 0);
  const uniqueTourists = Math.floor(totalVisits * 0.7); // Assuming 30% are returning visitors
  
  return {
    totalVisits,
    uniqueTourists,
    touristSpots: topSpots.length,
    barangayVisits,
    topSpots,
    monthlyVisits,
    visitorsByMonth: monthlyVisits[currentMonth]?.count || 0,
    monthlyRevenue: monthlyVisits.reduce((sum, m) => sum + m.entranceFee + m.guideFee, 0),
    totalRevenue: (totalVisits * 100) + (totalVisits * 50) // 100 for entrance, 50 for guide fee per visitor
  };
};

interface MonthlyVisit {
  month: string;
  count: number;
  entranceFee: number;
  guideFee: number;
  local: number;
  national: number;
  international: number;
}

interface BarangayVisit {
  name: string;
  visits: number;
}

interface TouristSpot {
  name: string;
  visits: number;
  barangay: string;
}

interface ReportData {
  totalVisits: number;
  uniqueTourists: number;
  touristSpots: number;
  barangayVisits: BarangayVisit[];
  topSpots: TouristSpot[];
  monthlyVisits: MonthlyVisit[];
  visitorsByMonth: number;
  monthlyRevenue: number;
  totalRevenue: number;
}

function ReportsPage() {
  const { currentUser, isAdmin } = useAuth();
  const router = useRouter();
  const [timeRange, setTimeRange] = useState<TimeRange>('month');
  const [activeTab, setActiveTab] = useState<ChartType | ''>('');
  const [loading, setLoading] = useState(true);
  
  // Generate sample data
  const reportData = generateReportData();
  // Calculate visitors for current month
  const currentMonth = new Date().getMonth();
  reportData.visitorsByMonth = reportData.monthlyVisits[currentMonth]?.count || 0;

  // Chart data
  const barangayData = {
    labels: reportData.barangayVisits.slice(0, 10).map(barangay => barangay.name),
    datasets: [
      {
        label: 'Number of Visitors',
        data: reportData.barangayVisits.slice(0, 10).map(barangay => barangay.visits),
        backgroundColor: 'rgba(75, 192, 192, 0.7)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      },
    ],
  };

  const spotData = {
    labels: reportData.topSpots.map(spot => spot.name),
    datasets: [
      {
        label: 'Number of Visitors',
        data: reportData.topSpots.map(spot => spot.visits),
        backgroundColor: 'rgba(54, 162, 235, 0.7)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      },
    ],
  };

  const revenueData = {
    labels: reportData.monthlyVisits.map(month => month.month),
    datasets: [
      {
        label: 'Entrance Fees (₱)',
        data: reportData.monthlyVisits.map(month => month.entranceFee),
        backgroundColor: 'rgba(75, 192, 192, 0.7)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      },
      {
        label: 'Guide Fees (₱)',
        data: reportData.monthlyVisits.map(month => month.guideFee),
        backgroundColor: 'rgba(54, 162, 235, 0.7)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      },
    ],
  };

  const visitorDemographicsData = {
    labels: reportData.monthlyVisits.map(month => month.month),
    datasets: [
      {
        label: 'Total Visitors',
        data: reportData.monthlyVisits.map(month => month.count),
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        fill: true,
        tension: 0.3,
      },
    ],
  };

  const originData = {
    labels: ['Local', 'National', 'International'],
    datasets: [
      {
        label: 'Visitors by Origin',
        data: [
          reportData.monthlyVisits.reduce((sum, month) => sum + month.local, 0),
          reportData.monthlyVisits.reduce((sum, month) => sum + month.national, 0),
          reportData.monthlyVisits.reduce((sum, month) => sum + month.international, 0),
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
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        callbacks: {
          label: function(context: { 
            dataset: { 
              label?: string; 
              [key: string]: any 
            }; 
            parsed: { 
              y: number | null 
            } 
          }) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              // Format numbers with commas for thousands
              label += new Intl.NumberFormat('en-US').format(context.parsed.y);
              // Add currency symbol for revenue data
              if (context.dataset.label?.includes('₱')) {
                label = label.replace('₱', '₱ ');
              }
            }
            return label;
          }
        }
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value: number | string) {
            // Format y-axis labels with commas for thousands
            return new Intl.NumberFormat('en-US').format(Number(value));
          }
        }
      }
    }
  };

  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
      },
    },
  };

  useEffect(() => {
    if (typeof isAdmin === 'undefined') return;
    if (!isAdmin) router.push('/');
    else setLoading(false);
  }, [isAdmin, router]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!currentUser || !isAdmin) {
    return <div className="min-h-screen flex items-center justify-center">Unauthorized</div>;
  }

  const handleExportReport = () => {
    // Create CSV content
    let csvContent = 'Kapangan Tourism Report\n\n';
    csvContent += `Report Generated: ${new Date().toLocaleDateString()}\n\n`;
    csvContent += 'Summary Statistics\n';
    csvContent += `Total Visits,${reportData.totalVisits}\n`;
    csvContent += `Unique Tourists,${reportData.uniqueTourists}\n`;
    csvContent += `Tourist Spots,${reportData.touristSpots}\n`;
    csvContent += `This Month Visitors,${reportData.visitorsByMonth}\n\n`;
    
    csvContent += 'Top Tourist Spots\n';
    csvContent += 'Spot Name,Number of Visits\n';
    reportData.topSpots.forEach(spot => {
      csvContent += `${spot.name},${spot.visits}\n`;
    });

    csvContent += '\nMonthly Visits\n';
    csvContent += 'Month,Visits\n';
    reportData.monthlyVisits.forEach(month => {
      csvContent += `${month.month},${month.count}\n`;
    });

    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Kapangan_Tourism_Report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'barangay':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Home size={24} />
                Visitors per Barangay
              </h2>
              <div className="text-sm text-gray-500">
                Showing top 10 barangays by visitor count
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md h-96">
              <Bar data={barangayData} options={chartOptions} />
            </div>
            
            <div className="mt-8">
              <h3 className="text-lg font-semibold mb-4">Full Barangay Statistics</h3>
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Barangay</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Visitors</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">% of Total</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {reportData.barangayVisits.map((barangay, index) => (
                        <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{barangay.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                            {barangay.visits.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                            {((barangay.visits / reportData.totalVisits) * 100).toFixed(1)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        );

      case 'touristSpot':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <MapPinned size={24} />
                Visitors per Tourist Spot
              </h2>
              <div className="text-sm text-gray-500">
                Showing all tourist spots
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md h-96">
              <Bar data={spotData} options={chartOptions} />
            </div>
            
            <div className="mt-8">
              <h3 className="text-lg font-semibold mb-4">Tourist Spot Details</h3>
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tourist Spot</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Barangay</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Visitors</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {reportData.topSpots.map((spot, index) => (
                        <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{spot.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{spot.barangay}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                            {spot.visits.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        );

      case 'revenue':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <DollarSign size={24} />
                Revenue Overview
              </h2>
              <div className="text-sm text-gray-500">
                {timeRange === 'month' ? 'Monthly' : timeRange === 'week' ? 'Weekly' : 'Yearly'} View
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-lg shadow-md">
                <div className="text-sm font-medium text-gray-500">Total Revenue</div>
                <div className="mt-1 text-2xl font-semibold text-gray-900">
                  ₱{reportData.totalRevenue.toLocaleString()}
                </div>
                <div className="mt-2 text-sm text-green-600">
                  +12.5% from last period
                </div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-md">
                <div className="text-sm font-medium text-gray-500">Entrance Fees</div>
                <div className="mt-1 text-2xl font-semibold text-gray-900">
                  ₱{(reportData.totalVisits * 100).toLocaleString()}
                </div>
                <div className="mt-2 text-sm text-green-600">
                  +8.3% from last period
                </div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-md">
                <div className="text-sm font-medium text-gray-500">Guide Fees</div>
                <div className="mt-1 text-2xl font-semibold text-gray-900">
                  ₱{(reportData.totalVisits * 50).toLocaleString()}
                </div>
                <div className="mt-2 text-sm text-green-600">
                  +5.7% from last period
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md h-96">
              <Bar 
                data={revenueData} 
                options={{
                  ...chartOptions,
                  scales: {
                    ...chartOptions.scales,
                    x: { stacked: true },
                    y: { 
                      ...chartOptions.scales?.y,
                      stacked: true,
                      ticks: {
                        ...chartOptions.scales?.y?.ticks,
                        callback: function(value) {
                          return '₱' + new Intl.NumberFormat('en-US').format(Number(value));
                        }
                      }
                    },
                  },
                  plugins: {
                    ...chartOptions.plugins,
                    tooltip: {
                      callbacks: {
                        label: function(context) {
                          let label = context.dataset.label || '';
                          if (label) {
                            label += ': ';
                          }
                          if (context.parsed.y !== null) {
                            label += '₱' + new Intl.NumberFormat('en-US').format(context.parsed.y);
                          }
                          return label;
                        }
                      }
                    }
                  }
                }} 
              />
            </div>
            
            <div className="mt-8">
              <h3 className="text-lg font-semibold mb-4">Monthly Revenue Breakdown</h3>
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Month</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Entrance Fees</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Guide Fees</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {reportData.monthlyVisits.map((month, index) => {
                        const total = month.entranceFee + month.guideFee;
                        return (
                          <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{month.month}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                              ₱{month.entranceFee.toLocaleString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                              ₱{month.guideFee.toLocaleString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                              ₱{total.toLocaleString()}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        );

      case 'demographics':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <UserCheck size={24} />
                Visitor Demographics
              </h2>
              <div className="text-sm text-gray-500">
                {timeRange === 'month' ? 'Monthly' : timeRange === 'week' ? 'Weekly' : 'Yearly'} View
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-lg shadow-md">
                <div className="text-sm font-medium text-gray-500">Average Daily Visitors</div>
                <div className="mt-1 text-2xl font-semibold text-gray-900">
                  {Math.round(reportData.monthlyVisits.reduce((sum, m) => sum + m.count, 0) / 30).toLocaleString()}
                </div>
                <div className="mt-2 text-sm text-green-600">
                  +15.2% from last period
                </div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-md">
                <div className="text-sm font-medium text-gray-500">Peak Month</div>
                <div className="mt-1 text-2xl font-semibold text-gray-900">
                  {reportData.monthlyVisits.reduce((max, month) => 
                    month.count > max.count ? month : max, 
                    {month: '', count: 0, entranceFee: 0, guideFee: 0, local: 0, national: 0, international: 0}
                  ).month}
                </div>
                <div className="mt-2 text-sm text-gray-500">
                  with {Math.max(...reportData.monthlyVisits.map(m => m.count)).toLocaleString()} visitors
                </div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-md">
                <div className="text-sm font-medium text-gray-500">Average Stay Duration</div>
                <div className="mt-1 text-2xl font-semibold text-gray-900">
                  2.5 days
                </div>
                <div className="mt-2 text-sm text-green-600">
                  +0.3 days from last year
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md h-96">
              <Line data={visitorDemographicsData} options={chartOptions} />
            </div>
            
            <div className="mt-8">
              <h3 className="text-lg font-semibold mb-4">Monthly Visitor Statistics</h3>
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Month</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total Visitors</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Local</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">National</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">International</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {reportData.monthlyVisits.map((month, index) => (
                        <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{month.month}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-medium">
                            {month.count.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                            {month.local.toLocaleString()} ({(month.local / month.count * 100).toFixed(1)}%)
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                            {month.national.toLocaleString()} ({(month.national / month.count * 100).toFixed(1)}%)
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                            {month.international.toLocaleString()} ({(month.international / month.count * 100).toFixed(1)}%)
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        );

      case 'origin':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Globe size={24} />
                Visitor Origin Demographics
              </h2>
              <div className="text-sm text-gray-500">
                All-time statistics
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-lg shadow-md">
                <div className="text-sm font-medium text-gray-500">Local Visitors</div>
                <div className="mt-1 text-2xl font-semibold text-gray-900">
                  {reportData.monthlyVisits.reduce((sum, m) => sum + m.local, 0).toLocaleString()}
                </div>
                <div className="mt-2 text-sm text-green-600">
                  {((reportData.monthlyVisits.reduce((sum, m) => sum + m.local, 0) / reportData.totalVisits) * 100).toFixed(1)}% of total
                </div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-md">
                <div className="text-sm font-medium text-gray-500">National Visitors</div>
                <div className="mt-1 text-2xl font-semibold text-gray-900">
                  {reportData.monthlyVisits.reduce((sum, m) => sum + m.national, 0).toLocaleString()}
                </div>
                <div className="mt-2 text-sm text-blue-600">
                  {((reportData.monthlyVisits.reduce((sum, m) => sum + m.national, 0) / reportData.totalVisits) * 100).toFixed(1)}% of total
                </div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-md">
                <div className="text-sm font-medium text-gray-500">International Visitors</div>
                <div className="mt-1 text-2xl font-semibold text-gray-900">
                  {reportData.monthlyVisits.reduce((sum, m) => sum + m.international, 0).toLocaleString()}
                </div>
                <div className="mt-2 text-sm text-purple-600">
                  {((reportData.monthlyVisits.reduce((sum, m) => sum + m.international, 0) / reportData.totalVisits) * 100).toFixed(1)}% of total
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-md h-96">
                <Bar 
                  data={{
                    labels: reportData.monthlyVisits.map(m => m.month),
                    datasets: [
                      {
                        label: 'Local',
                        data: reportData.monthlyVisits.map(m => m.local),
                        backgroundColor: 'rgba(75, 192, 192, 0.7)',
                        borderColor: 'rgba(75, 192, 192, 1)',
                        borderWidth: 1,
                      },
                      {
                        label: 'National',
                        data: reportData.monthlyVisits.map(m => m.national),
                        backgroundColor: 'rgba(54, 162, 235, 0.7)',
                        borderColor: 'rgba(54, 162, 235, 1)',
                        borderWidth: 1,
                      },
                      {
                        label: 'International',
                        data: reportData.monthlyVisits.map(m => m.international),
                        backgroundColor: 'rgba(255, 99, 132, 0.7)',
                        borderColor: 'rgba(255, 99, 132, 1)',
                        borderWidth: 1,
                      },
                    ],
                  }}
                  options={{
                    ...chartOptions,
                    scales: {
                      ...chartOptions.scales,
                      x: { stacked: true },
                      y: { 
                        ...chartOptions.scales?.y,
                        stacked: true,
                      },
                    },
                  }}
                />
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md h-96 flex flex-col items-center justify-center">
                <h3 className="text-lg font-semibold mb-4">Visitor Distribution</h3>
                <div className="w-64 h-64">
                  <Pie data={originData} options={pieChartOptions} />
                </div>
              </div>
            </div>
            
            <div className="mt-8">
              <h3 className="text-lg font-semibold mb-4">Top Visitor Origins</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-lg shadow">
                  <h4 className="font-medium text-gray-700 mb-3">Top Local Municipalities</h4>
                  <ul className="space-y-2">
                    {['Kapangan', 'La Trinidad', 'Baguio City', 'Tublay', 'Atok', 'Buguias', 'Bakun', 'Kibungan', 'Mankayan', 'Sablan']
                      .map((municipality, i) => (
                        <li key={i} className="flex justify-between text-sm">
                          <span className="text-gray-600">{i + 1}. {municipality}</span>
                          <span className="font-medium">
                            {Math.floor(Math.random() * 500 + 100).toLocaleString()}
                          </span>
                        </li>
                      ))}
                  </ul>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow">
                  <h4 className="font-medium text-gray-700 mb-3">Top National Cities</h4>
                  <ul className="space-y-2">
                    {['Manila', 'Quezon City', 'Cebu City', 'Davao City', 'Bacolod', 'Iloilo City', 'Baguio City', 'Dagupan', 'Batangas City', 'Pampanga']
                      .map((city, i) => (
                        <li key={i} className="flex justify-between text-sm">
                          <span className="text-gray-600">{i + 1}. {city}</span>
                          <span className="font-medium">
                            {Math.floor(Math.random() * 300 + 50).toLocaleString()}
                          </span>
                        </li>
                      ))}
                  </ul>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow">
                  <h4 className="font-medium text-gray-700 mb-3">Top International Countries</h4>
                  <ul className="space-y-2">
                    {['United States', 'South Korea', 'Japan', 'China', 'Australia', 'Canada', 'United Kingdom', 'Germany', 'Singapore', 'Malaysia']
                      .map((country, i) => (
                        <li key={i} className="flex justify-between text-sm">
                          <span className="text-gray-600">{i + 1}. {country}</span>
                          <span className="font-medium">
                            {Math.floor(Math.random() * 100 + 10).toLocaleString()}
                          </span>
                        </li>
                      ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <BarChart2 size={24} />
              Analytics Dashboard
            </h2>
            <div className="bg-white p-8 rounded-lg shadow-md text-center">
              <div className="max-w-md mx-auto">
                <svg
                  className="mx-auto h-16 w-16 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
                <h3 className="mt-2 text-lg font-medium text-gray-900">Welcome to Analytics Dashboard</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Select a report from the tabs above to view detailed analytics and statistics.
                </p>
                <div className="mt-6">
                  <div className="inline-flex rounded-md shadow-sm">
                    <button
                      type="button"
                      onClick={() => setActiveTab('barangay')}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    >
                      <MapPin className="-ml-1 mr-2 h-5 w-5" />
                      View Barangay Reports
                    </button>
                  </div>
                </div>
              </div>
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
              Kapangan Tourism Reports
            </h1>
            <p className="text-gray-600">
              Comprehensive tourism statistics and analytics for Kapangan
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
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex gap-2">
            <button
              onClick={() => setTimeRange('week')}
              className={`px-4 py-2 text-sm rounded-lg ${timeRange === 'week' ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
            >
              Weekly
            </button>
            <button
              onClick={() => setTimeRange('month')}
              className={`px-4 py-2 text-sm rounded-lg ${timeRange === 'month' ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
            >
              Monthly
            </button>
            <button
              onClick={() => setTimeRange('year')}
              className={`px-4 py-2 text-sm rounded-lg ${timeRange === 'year' ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
            >
              Yearly
            </button>
          </div>
          <div className="text-sm text-gray-500">
            Showing data for {new Date().getFullYear()}
          </div>
        </div>
        
        {/* Navigation Tabs */}
        <div className="flex flex-wrap border-b">
          <button
            onClick={() => setActiveTab('barangay')}
            className={`px-4 py-3 font-medium flex items-center gap-2 ${activeTab === 'barangay' ? 'border-b-2 border-green-500 text-green-600' : 'text-gray-600 hover:text-gray-800'}`}
          >
            <Home size={18} />
            Barangay
          </button>
          <button
            onClick={() => setActiveTab('touristSpot')}
            className={`px-4 py-3 font-medium flex items-center gap-2 ${activeTab === 'touristSpot' ? 'border-b-2 border-green-500 text-green-600' : 'text-gray-600 hover:text-gray-800'}`}
          >
            <MapPinned size={18} />
            Tourist Spots
          </button>
          <button
            onClick={() => setActiveTab('revenue')}
            className={`px-4 py-3 font-medium flex items-center gap-2 ${activeTab === 'revenue' ? 'border-b-2 border-green-500 text-green-600' : 'text-gray-600 hover:text-gray-800'}`}
          >
            <DollarSign size={18} />
            Revenue
          </button>
          <button
            onClick={() => setActiveTab('demographics')}
            className={`px-4 py-3 font-medium flex items-center gap-2 ${activeTab === 'demographics' ? 'border-b-2 border-green-500 text-green-600' : 'text-gray-600 hover:text-gray-800'}`}
          >
            <UserCheck size={18} />
            Demographics
          </button>
          <button
            onClick={() => setActiveTab('origin')}
            className={`px-4 py-3 font-medium flex items-center gap-2 ${activeTab === 'origin' ? 'border-b-2 border-green-500 text-green-600' : 'text-gray-600 hover:text-gray-800'}`}
          >
            <Globe size={18} />
            Visitor Origin
          </button>
        </div>
      </div>

      <div className="p-6">
        {/* Summary Cards - Only show when no specific tab is selected */}
        {!activeTab && (
          <>
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Tourism Analytics Dashboard</h2>
              <p className="text-gray-600">Comprehensive insights and statistics for Kapangan's tourism industry</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-gray-600 text-sm font-medium">Total Visitors</h3>
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <Users size={20} className="text-blue-600" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-gray-800">{reportData.totalVisits.toLocaleString()}</p>
                <div className="mt-2 flex items-center text-sm">
                  <span className="text-green-500 flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                    12.5%
                  </span>
                  <span className="text-gray-500 ml-2">vs last year</span>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-gray-600 text-sm font-medium">Unique Tourists</h3>
                  <div className="p-2 bg-purple-50 rounded-lg">
                    <UserCheck size={20} className="text-purple-600" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-gray-800">{reportData.uniqueTourists.toLocaleString()}</p>
                <div className="mt-2 flex items-center text-sm">
                  <span className="text-green-500 flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                    8.3%
                  </span>
                  <span className="text-gray-500 ml-2">vs last year</span>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-gray-600 text-sm font-medium">Tourist Spots</h3>
                  <div className="p-2 bg-orange-50 rounded-lg">
                    <MapPin size={20} className="text-orange-600" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-gray-800">{reportData.touristSpots}</p>
                <p className="text-sm text-gray-500 mt-2">Across {reportData.barangayVisits.length} barangays</p>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-gray-600 text-sm font-medium">Total Revenue</h3>
                  <div className="p-2 bg-green-50 rounded-lg">
                    <DollarSign size={20} className="text-green-600" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-gray-800">₱{reportData.totalRevenue.toLocaleString()}</p>
                <div className="mt-2 flex items-center text-sm">
                  <span className="text-green-500 flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                    15.2%
                  </span>
                  <span className="text-gray-500 ml-2">vs last year</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <MapPinned size={20} />
                  Top Tourist Spots
                </h3>
                <div className="h-64">
                  <Bar 
                    data={spotData} 
                    options={{
                      ...chartOptions,
                      indexAxis: 'y',
                      plugins: {
                        ...chartOptions.plugins,
                        legend: {
                          display: false
                        }
                      },
                      scales: {
                        ...chartOptions.scales,
                        x: {
                          beginAtZero: true,
                          title: {
                            display: true,
                            text: 'Number of Visitors'
                          }
                        }
                      }
                    }} 
                  />
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Globe size={20} />
                  Visitor Origins
                </h3>
                <div className="h-64 flex items-center justify-center">
                  <Pie 
                    data={originData} 
                    options={{
                      ...pieChartOptions,
                      plugins: {
                        ...pieChartOptions.plugins,
                        tooltip: {
                          callbacks: {
                            label: function(context) {
                              const label = context.label || '';
                              const value = context.raw as number;
                              const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
                              const percentage = Math.round((value / total) * 100);
                              return `${label}: ${value.toLocaleString()} (${percentage}%)`;
                            }
                          }
                        }
                      }
                    }} 
                  />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <BarChart2 size={20} />
                Monthly Visitor Trends
              </h3>
              <div className="h-80">
                <Line 
                  data={{
                    labels: reportData.monthlyVisits.map(m => m.month),
                    datasets: [
                      {
                        label: 'Total Visitors',
                        data: reportData.monthlyVisits.map(m => m.count),
                        borderColor: 'rgba(59, 130, 246, 1)',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        fill: true,
                        tension: 0.3,
                      },
                      {
                        label: 'Local Visitors',
                        data: reportData.monthlyVisits.map(m => m.local),
                        borderColor: 'rgba(16, 185, 129, 1)',
                        borderDash: [5, 5],
                        backgroundColor: 'transparent',
                        tension: 0.3,
                      },
                      {
                        label: 'National Visitors',
                        data: reportData.monthlyVisits.map(m => m.national),
                        borderColor: 'rgba(245, 158, 11, 1)',
                        borderDash: [5, 5],
                        backgroundColor: 'transparent',
                        tension: 0.3,
                      },
                      {
                        label: 'International Visitors',
                        data: reportData.monthlyVisits.map(m => m.international),
                        borderColor: 'rgba(239, 68, 68, 1)',
                        borderDash: [5, 5],
                        backgroundColor: 'transparent',
                        tension: 0.3,
                      },
                    ],
                  }}
                  options={{
                    ...chartOptions,
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: {
                      mode: 'index' as const,
                      intersect: false,
                    },
                    plugins: {
                      ...chartOptions.plugins,
                      tooltip: {
                        callbacks: {
                          label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                              label += ': ';
                            }
                            if (context.parsed.y !== null) {
                              label += context.parsed.y.toLocaleString();
                            }
                            return label;
                          }
                        }
                      }
                    },
                    scales: {
                      ...chartOptions.scales,
                      y: {
                        ...chartOptions.scales?.y,
                        title: {
                          display: true,
                          text: 'Number of Visitors'
                        }
                      },
                      x: {
                        title: {
                          display: true,
                          text: 'Month'
                        }
                      }
                    }
                  }}
                />
              </div>
            </div>
          </>
        )}
        <div className={`transition-opacity duration-300 ${activeTab ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'}`}>
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
}

export default ReportsPage;
