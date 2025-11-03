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

  // ✅ Correct filter using private spot name
  const filterByPrivateSpot = (visit: any) => {
    if (!privateSpotAdminData?.privateSpotName) return false;
    return visit.spots?.some(
      (s: string) => s.toLowerCase() === privateSpotAdminData.privateSpotName.toLowerCase()
    );
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4 text-blue-700">
        Scheduled Visits ({privateSpotAdminData?.privateSpotName || 'Unknown Spot'})
      </h1>
      <VisitsTable role="private" filterFn={filterByPrivateSpot} />
    </div>
  );
}
