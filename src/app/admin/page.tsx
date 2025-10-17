"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";

export default function AdminDashboard() {
  const { currentUser, isAdmin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // wait until isAdmin is resolved
    if (typeof isAdmin === "undefined") return;
    if (!isAdmin) {
      router.push("/");
    }
  }, [isAdmin, router]);

  // show loading while auth is resolving
  if (typeof isAdmin === "undefined") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  if (!currentUser || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <div className="w-60 bg-green-700 text-white min-h-screen">
        <div className="p-4 font-semibold text-lg">
          <Link href="/admin" className="flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 mr-2"
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
            Dashboard
          </Link>
        </div>
        <nav className="mt-4">
          <Link
            href="/admin"
            className="block py-3 px-4 bg-green-800 border-l-4 border-white"
          >
            <div className="flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-3"
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
              Dashboard
            </div>
          </Link>
          <Link
            href="/admin/accommodations"
            className="block py-3 px-4 hover:bg-green-800 transition-colors"
          >
            <div className="flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
              Accommodations
            </div>
          </Link>
          <Link
            href="/admin/tourist-spots"
            className="block py-3 px-4 hover:bg-green-800 transition-colors"
          >
            <div className="flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-3"
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
              Tourist Spots
            </div>
          </Link>
          <Link
            href="/admin/restaurants"
            className="block py-3 px-4 hover:bg-green-800 transition-colors"
          >
            <div className="flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
              Restaurants
            </div>
          </Link>
          <Link
            href="/admin/users"
            className="block py-3 px-4 hover:bg-green-800 transition-colors"
          >
            <div className="flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-3"
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
              User Management
            </div>
          </Link>
          <Link
            href="/admin/reports"
            className="block py-3 px-4 hover:bg-green-800 transition-colors"
          >
            <div className="flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
              Reports & Analytics
            </div>
          </Link>
          <Link
            href="/admin/barangay-reports"
            className="block py-3 px-4 hover:bg-green-800 transition-colors"
          >
            <div className="flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Barangay Reports
            </div>
          </Link>
          <Link
            href="/signout"
            className="block py-3 px-4 hover:bg-green-800 transition-colors"
          >
            <div className="flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              Logout
            </div>
          </Link>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 bg-gray-100">
        <div className="p-6 bg-white border-b">
          <h1 className="text-xl text-gray-700">
            Manage tourism activities, content, users, and analytics
          </h1>
        </div>

        {/* Stats Cards */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Total Visits */}
            <div className="bg-white rounded-lg shadow p-6 flex justify-between items-center">
              <div>
                <h2 className="text-3xl font-bold text-gray-800">1,254</h2>
                <p className="text-gray-500">Total Visits</p>
                <p className="text-green-500 text-sm mt-2">
                  +12% from last month
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
                <h2 className="text-3xl font-bold text-gray-800">842</h2>
                <p className="text-gray-500">Unique Tourists</p>
                <p className="text-green-500 text-sm mt-2">
                  +15% from last month
                </p>
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

            {/* Total Revenue */}
            <div className="bg-white rounded-lg shadow p-6 flex justify-between items-center">
              <div>
                <h2 className="text-3xl font-bold text-gray-800">₱100,134</h2>
                <p className="text-gray-500">Total Revenue</p>
                <p className="text-green-500 text-sm mt-2">
                  +8% from last quarter
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
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            {/* Tourist Spots */}
            <div className="bg-white rounded-lg shadow p-6 flex justify-between items-center">
              <div>
                <h2 className="text-3xl font-bold text-gray-800">10</h2>
                <p className="text-gray-500">Tourist Spots</p>
                <p className="text-yellow-500 text-sm mt-2">
                  5 pending approval
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

            {/* Barangay Admins */}
            <div className="bg-white rounded-lg shadow p-6 flex justify-between items-center">
              <div>
                <h2 className="text-3xl font-bold text-gray-800">7</h2>
                <p className="text-gray-500">Barangay Admins</p>
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
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Recent Activities */}
          <div className="mt-6 bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold">Recent Activities</h2>
            </div>
            <div className="p-6">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-gray-500">
                    <th className="pb-3 w-1/3">Activity</th>
                    <th className="pb-3 w-1/3">User</th>
                    <th className="pb-3 w-1/3">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {/* You can map through activities here */}
                  {/* This is just placeholder content */}
                  <tr className="border-t">
                    <td className="py-3">New tourist spot added</td>
                    <td className="py-3">John Doe</td>
                    <td className="py-3">2 hours ago</td>
                  </tr>
                  <tr className="border-t">
                    <td className="py-3">Updated accommodation details</td>
                    <td className="py-3">Jane Smith</td>
                    <td className="py-3">Yesterday</td>
                  </tr>
                  <tr className="border-t">
                    <td className="py-3">New blog post published</td>
                    <td className="py-3">Admin</td>
                    <td className="py-3">3 days ago</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}