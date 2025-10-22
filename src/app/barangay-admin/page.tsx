"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import { db } from "@/firebase/config";
import { collection, query, where, getDocs, orderBy, limit } from "firebase/firestore";

export default function BarangayAdminDashboard() {
  const { currentUser, isBarangayAdmin, barangayAdminData } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState({
    totalVisits: 0,
    uniqueTourists: 0,
    touristSpots: 0,
    restaurants: 0,
    accommodations: 0,
    pendingApprovals: 0
  });
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Debug authentication state
  console.log('Auth State:', { 
    isBarangayAdmin, 
    currentUser: !!currentUser, 
    barangayAdminData
  });

  useEffect(() => {
    console.log('Auth check effect running...');
    
    // If still determining auth state, do nothing
    if (typeof isBarangayAdmin === "undefined") {
      console.log('Auth state not determined yet');
      return;
    }
    
    // If not a barangay admin, redirect
    if (!isBarangayAdmin) {
      console.log('Not a barangay admin, redirecting...');
      router.push("/");
      return;
    }
    
    console.log('Barangay admin verified, checking data...');
    
    // If we have barangay data, fetch dashboard data
    if (barangayAdminData?.barangayName) {
      console.log('Barangay data available, fetching dashboard data...');
      fetchDashboardData();
    } else {
      console.log('Waiting for barangay data...', { barangayAdminData });
      // If no barangay data after a delay, try to fetch it
      const timer = setTimeout(() => {
        console.log('Checking barangay data after delay...', { 
          hasBarangayData: !!barangayAdminData,
          currentUser
        });
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [isBarangayAdmin, barangayAdminData, router]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const barangayName = barangayAdminData?.barangayName;

      // Run all queries in parallel for faster loading
      const [
        touristSpotsSnapshot,
        restaurantsSnapshot,
        accommodationsSnapshot,
        visitsSnapshot,
        recentVisitsSnapshot
      ] = await Promise.all([
        // Fetch tourist spots
        getDocs(query(collection(db, "touristSpots"), where("barangay", "==", barangayName))),
        // Fetch restaurants
        getDocs(query(collection(db, "restaurants"), where("barangay", "==", barangayName))),
        // Fetch accommodations
        getDocs(query(collection(db, "accommodations"), where("barangay", "==", barangayName))),
        // Fetch all visits
        getDocs(query(collection(db, "visits"), where("barangay", "==", barangayName))),
        // Fetch recent visits (last 5)
        getDocs(query(
          collection(db, "visits"),
          where("barangay", "==", barangayName),
          orderBy("createdAt", "desc"),
          limit(5)
        ))
      ]);

      // Count unique tourists (unique user IDs from visits)
      const uniqueTouristIds = new Set();
      visitsSnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.userId) {
          uniqueTouristIds.add(data.userId);
        }
      });

      // Count pending approvals (spots with status 'pending')
      const pendingCount = touristSpotsSnapshot.docs.filter(
        (doc) => doc.data().status === "pending"
      ).length;

      setStats({
        totalVisits: visitsSnapshot.size,
        uniqueTourists: uniqueTouristIds.size,
        touristSpots: touristSpotsSnapshot.size,
        restaurants: restaurantsSnapshot.size,
        accommodations: accommodationsSnapshot.size,
        pendingApprovals: pendingCount
      });

      // Set recent activities
      const activities = recentVisitsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }));
      setRecentActivities(activities);

      setLoading(false);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      setLoading(false);
    }
  };

  // show loading while auth is resolving
  if (typeof isBarangayAdmin === "undefined") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  // Show loading state while checking auth
  if (typeof isBarangayAdmin === 'undefined' || !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying your access...</p>
        </div>
      </div>
    );
  }

  // Redirect if not a barangay admin
  if (!isBarangayAdmin) {
    router.push("/");
    return null;
  }

  // Show loading state while fetching data
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
        <div className="w-full max-w-4xl">
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex items-center space-x-4">
              <div className="h-12 w-12 bg-gray-200 rounded-full animate-pulse"></div>
              <div className="flex-1">
                <div className="h-6 bg-gray-200 rounded w-48 mb-2 animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-lg shadow-sm p-6 animate-pulse">
                <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
              </div>
            ))}
          </div>
          
          <div className="mt-6 p-4 bg-blue-50 text-blue-800 text-sm rounded-lg">
            <p className="font-medium">Loading dashboard data...</p>
            <p className="mt-1 text-xs">
              {!barangayAdminData ? 'Fetching barangay information...' : 'Loading statistics...'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // If we have no barangay data after loading, show an error with debug info
  if (!barangayAdminData) {
    console.log('Debug Info - User:', currentUser?.email);
    console.log('Is Barangay Admin:', isBarangayAdmin);
    console.log('Barangay Admin Data:', barangayAdminData);
    
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-lg font-medium text-gray-900 mb-2">Barangay Data Not Found</h2>
          <div className="bg-gray-50 p-4 rounded-md text-left text-sm text-gray-600 mb-6">
            <p className="mb-2">We couldn't find the barangay information for your account.</p>
            <p className="font-mono text-xs bg-black/5 p-2 rounded">
              User: {currentUser?.email || 'Not logged in'}<br />
              UID: {currentUser?.uid || 'N/A'}
            </p>
            <p className="mt-3 text-sm">
              Please ensure your account is properly registered as a barangay administrator.
            </p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="p-6 bg-white border-b">
        <div className="flex items-center space-x-4">
          <div className="flex-shrink-0">
            <img 
              className="h-12 w-12 rounded-full" 
              src={currentUser?.photoURL || '/assets/default-avatar.png'} 
              alt="Profile"
            />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              {currentUser?.displayName || 'Barangay Admin'}
            </h1>
            <div className="mt-1">
              <div className="inline-flex items-center bg-blue-50 text-blue-800 text-sm px-3 py-1 rounded-full">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-4 w-4 mr-1.5" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" 
                  />
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" 
                  />
                </svg>
                <span className="font-medium">
                  Managing: {barangayAdminData?.barangayName || barangayAdminData?.displayName || 'Barangay'}
                </span>
              </div>
            </div>
            <p className="text-sm text-gray-500">Barangay Administrator</p>
          </div>
        </div>
      </div>

      {/* Stats Cards / Page Content */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Total Visits */}
          <div className="bg-white rounded-lg shadow p-6 flex justify-between items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-800">{stats.totalVisits}</h2>
              <p className="text-gray-500">Total Visits</p>
              <p className="text-green-500 text-sm mt-2">
                To your barangay
              </p>
            </div>
            <div className="bg-blue-500 p-3 rounded-lg">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
          </div>

          {/* Unique Tourists */}
          <div className="bg-white rounded-lg shadow p-6 flex justify-between items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-800">{stats.uniqueTourists}</h2>
              <p className="text-gray-500">Unique Tourists</p>
              <p className="text-green-500 text-sm mt-2">Visited your area</p>
            </div>
            <div className="bg-purple-500 p-3 rounded-lg">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            </div>
          </div>

          {/* Tourist Spots */}
          <div className="bg-white rounded-lg shadow p-6 flex justify-between items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-800">{stats.touristSpots}</h2>
              <p className="text-gray-500">Tourist Spots</p>
              <p className="text-yellow-500 text-sm mt-2">
                {stats.pendingApprovals} pending approval
              </p>
            </div>
            <div className="bg-orange-500 p-3 rounded-lg">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          {/* Restaurants */}
          <div className="bg-white rounded-lg shadow p-6 flex justify-between items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-800">{stats.restaurants}</h2>
              <p className="text-gray-500">Restaurants</p>
              <p className="text-gray-400 text-sm mt-2">
                In your barangay
              </p>
            </div>
            <div className="bg-red-500 p-3 rounded-lg">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
          </div>

          {/* Accommodations */}
          <div className="bg-white rounded-lg shadow p-6 flex justify-between items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-800">{stats.accommodations}</h2>
              <p className="text-gray-500">Accommodations</p>
              <p className="text-gray-400 text-sm mt-2">
                Available in your area
              </p>
            </div>
            <div className="bg-green-500 p-3 rounded-lg">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Recent Activities */}
        <div className="mt-6 bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold">Recent Visits</h2>
          </div>
          <div className="p-6">
            {recentActivities.length > 0 ? (
              <table className="w-full">
                <thead>
                  <tr className="text-left text-gray-500">
                    <th className="pb-3 w-1/3">Location</th>
                    <th className="pb-3 w-1/3">Visitor</th>
                    <th className="pb-3 w-1/3">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentActivities.map((activity) => (
                    <tr key={activity.id} className="border-t">
                      <td className="py-3">{activity.spotName || "Unknown Location"}</td>
                      <td className="py-3">{activity.userName || "Anonymous"}</td>
                      <td className="py-3">
                        {activity.createdAt
                          ? new Date(activity.createdAt.seconds * 1000).toLocaleDateString()
                          : "N/A"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-gray-500 text-center py-4">No recent visits recorded</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
