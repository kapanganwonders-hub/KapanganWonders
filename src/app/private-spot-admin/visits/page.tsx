'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import VisitsTable from '@/components/VisitsTable';
import { useEffect } from 'react';

export default function PrivateSpotVisitsPage() {
  const { currentUser, privateSpotAdminData } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!currentUser) router.push('/');
  }, [currentUser]);

  if (!currentUser) return <div>Loading...</div>;

  // Filter visits by businessId to show only this private spot's visits
  const filterByPrivateSpot = (visit: any) => {
    if (!privateSpotAdminData?.uid) return false;
    // only require that the visit is marked private
    return !!visit.isPrivate;
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4 text-blue-700">
        Scheduled Visits ({privateSpotAdminData?.businessName || privateSpotAdminData?.displayName || 'Your Business'})
      </h1>
      <VisitsTable role="private" filterFn={filterByPrivateSpot} />
    </div>
  );
}
