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
    <div className="min-h-screen">
      <div className="p-6 bg-white border-b">
        <h1 className="text-xl text-gray-700">
          Manage tourism activities, content, users, and analytics
        </h1>
      </div>

      {/* Stats Cards / Page Content */}
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
              <p className="text-green-500 text-sm mt-2">+15% from last month</p>
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
              <p className="text-green-500 text-sm mt-2">+8% from last quarter</p>
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
  );
}