'use client';

import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';

export default function OverviewPage() {
  const [user, setUser] = useState<any>(null);
  const [scheduledCount, setScheduledCount] = useState(0);
  const [visitedCount, setVisitedCount] = useState(0); // optional feature
  const [companionsCount, setCompanionsCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      if (u) {
        setUser(u);
        await fetchStats(u.uid);
      } else {
        setUser(null);
        setScheduledCount(0);
        setVisitedCount(0);
        setCompanionsCount(0);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const fetchStats = async (uid: string) => {
    try {
      const q = query(collection(db, 'visits'), where('userId', '==', uid));
      const snapshot = await getDocs(q);

      const visits = snapshot.docs.map((doc) => doc.data());

      setScheduledCount(visits.length);

      // Sum all companions
      const totalCompanions = visits.reduce(
        (acc, v) => acc + (v.companions?.length || 0),
        0
      );
      setCompanionsCount(totalCompanions);

      // Optional: if you later track "completed visits"
      setVisitedCount(0);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen text-gray-600">
        Loading your dashboard...
      </div>
    );
  }

  const profileImage =
    user?.photoURL || '/assets/default-avatar.png';

  return (
    <div className="p-6">
      {/* --- User Profile Header --- */}
      {user && (
        <div className="flex flex-col sm:flex-row items-center sm:items-start mb-8 bg-egg-white border border-border-green rounded-xl p-6 shadow-md">
          <img
            src={profileImage}
            onError={(e) => (e.currentTarget.src = '/assets/default-avatar.png')}
            alt="Profile Avatar"
            className="w-24 h-24 rounded-full border-2 border-border-green object-cover mb-4 sm:mb-0 sm:mr-6"
          />
          <div>
            <h1 className="text-2xl font-semibold text-primary-green">
              {user.displayName || 'Traveler'}
            </h1>
            <p className="text-gray-600">{user.email}</p>
          </div>
        </div>
      )}

      {/* --- Dashboard Summary --- */}
      <h2 className="text-xl font-semibold mb-4 text-primary-green">Dashboard Overview</h2>
      <p className="text-gray-500 mb-6">Welcome back, Traveler!</p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-green-100 text-green-800 p-6 rounded-lg text-center shadow-sm">
          <p className="text-4xl font-bold">{scheduledCount}</p>
          <p className="text-sm mt-2 font-medium">Scheduled Travels</p>
        </div>

        <div className="bg-blue-100 text-blue-800 p-6 rounded-lg text-center shadow-sm">
          <p className="text-4xl font-bold">{visitedCount}</p>
          <p className="text-sm mt-2 font-medium">Places Visited</p>
        </div>

        <div className="bg-purple-100 text-purple-800 p-6 rounded-lg text-center shadow-sm">
          <p className="text-4xl font-bold">{companionsCount}</p>
          <p className="text-sm mt-2 font-medium">Companions</p>
        </div>
      </div>
    </div>
  );
}
