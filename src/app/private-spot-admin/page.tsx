'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { motion } from 'framer-motion';
import { 
  Users, 
  MapPin, 
  TrendingUp, 
  Calendar,
  Eye,
  MessageSquare
} from 'lucide-react';

export default function PrivateSpotAdminDashboard() {
  const { privateSpotAdminData } = useAuth();
  const [stats, setStats] = useState({
    totalVisits: 0,
    totalSpots: 0,
    totalAnnouncements: 0,
    totalBlogs: 0,
  });
  const [recentVisits, setRecentVisits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!privateSpotAdminData?.uid) return;

      try {
        // Fetch spots owned by this admin
        const spotsQuery = query(
          collection(db, 'touristSpots'),
          where('ownerId', '==', privateSpotAdminData.uid),
          where('isPrivate', '==', true)
        );
        const spotsSnapshot = await getDocs(spotsQuery);
        const spotIds = spotsSnapshot.docs.map(doc => doc.id);

        // Fetch visits to owned spots
        let totalVisits = 0;
        if (spotIds.length > 0) {
          const visitsQuery = query(
            collection(db, 'visits'),
            where('spotId', 'in', spotIds)
          );
          const visitsSnapshot = await getDocs(visitsQuery);
          totalVisits = visitsSnapshot.size;

          // Get recent visits
          const recentVisitsQuery = query(
            collection(db, 'visits'),
            where('spotId', 'in', spotIds),
            orderBy('visitDate', 'desc'),
            limit(5)
          );
          const recentVisitsSnapshot = await getDocs(recentVisitsQuery);
          setRecentVisits(recentVisitsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        }

        // Fetch announcements
        const announcementsQuery = query(
          collection(db, 'announcements'),
          where('createdBy', '==', privateSpotAdminData.uid)
        );
        const announcementsSnapshot = await getDocs(announcementsQuery);

        // Fetch blogs
        const blogsQuery = query(
          collection(db, 'blogs'),
          where('authorId', '==', privateSpotAdminData.uid)
        );
        const blogsSnapshot = await getDocs(blogsQuery);

        setStats({
          totalVisits,
          totalSpots: spotsSnapshot.size,
          totalAnnouncements: announcementsSnapshot.size,
          totalBlogs: blogsSnapshot.size,
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [privateSpotAdminData]);

  const StatCard = ({ icon: Icon, title, value, color }: any) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white rounded-xl shadow-sm p-6 border-l-4 ${color}`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm font-medium">{title}</p>
          <p className="text-3xl font-bold text-gray-800 mt-2">{value}</p>
        </div>
        <div className={`p-3 rounded-full ${color.replace('border', 'bg').replace('500', '100')}`}>
          <Icon className={color.replace('border-', 'text-')} size={24} />
        </div>
      </div>
    </motion.div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-600">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-gray-600 mt-1">
          Welcome back, {privateSpotAdminData?.displayName || 'Admin'}!
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={Users}
          title="Total Visits"
          value={stats.totalVisits}
          color="border-blue-500"
        />
        <StatCard
          icon={MapPin}
          title="Tourist Spots"
          value={stats.totalSpots}
          color="border-green-500"
        />
        <StatCard
          icon={MessageSquare}
          title="Announcements"
          value={stats.totalAnnouncements}
          color="border-purple-500"
        />
        <StatCard
          icon={TrendingUp}
          title="Blog Posts"
          value={stats.totalBlogs}
          color="border-orange-500"
        />
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Visits */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl shadow-sm p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Recent Visits</h2>
            <Eye className="text-gray-400" size={20} />
          </div>
          <div className="space-y-3">
            {recentVisits.length > 0 ? (
              recentVisits.map((visit) => (
                <div key={visit.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-800">{visit.spotName || 'Unknown Spot'}</p>
                    <p className="text-sm text-gray-500">{visit.visitorName || 'Anonymous'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">
                      {visit.visitDate ? new Date(visit.visitDate).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No recent visits</p>
            )}
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl shadow-sm p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Quick Actions</h2>
            <Calendar className="text-gray-400" size={20} />
          </div>
          <div className="space-y-3">
            <a
              href="/private-spot-admin/scan-qr"
              className="block p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition text-center"
            >
              <p className="font-medium text-blue-700">Scan QR Code</p>
              <p className="text-sm text-blue-600">Record visitor check-ins</p>
            </a>
            <a
              href="/private-spot-admin/tourist-spots"
              className="block p-4 bg-green-50 hover:bg-green-100 rounded-lg transition text-center"
            >
              <p className="font-medium text-green-700">Manage Spots</p>
              <p className="text-sm text-green-600">Add or edit tourist spots</p>
            </a>
            <a
              href="/private-spot-admin/announcements"
              className="block p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition text-center"
            >
              <p className="font-medium text-purple-700">Post Announcement</p>
              <p className="text-sm text-purple-600">Share updates with visitors</p>
            </a>
          </div>
        </motion.div>
      </div>

      {/* Business Info */}
      {privateSpotAdminData?.businessName && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-sm p-6 text-white"
        >
          <h2 className="text-2xl font-bold mb-2">{privateSpotAdminData.businessName}</h2>
          {privateSpotAdminData.businessAddress && (
            <p className="text-blue-100">{privateSpotAdminData.businessAddress}</p>
          )}
          {privateSpotAdminData.contactNumber && (
            <p className="text-blue-100 mt-1">Contact: {privateSpotAdminData.contactNumber}</p>
          )}
        </motion.div>
      )}
    </div>
  );
}
