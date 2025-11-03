'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import VisitsTable from '@/components/VisitsTable';
import { useEffect } from 'react';

export default function BarangayVisitsPage() {
  const { currentUser, barangayAdminData } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!currentUser) router.push('/');
  }, [currentUser]);

  if (!currentUser) return <div>Loading...</div>;

  // ✅ Correct filter using barangayAdminData.barangay
  const filterByBarangay = (visit: any) => {
    if (!barangayAdminData?.barangay) return false;
    return visit.barangays?.some(
      (b: string) => b.toLowerCase() === barangayAdminData.barangay.toLowerCase()
    );
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4 text-green-700">
        Barangay Visits ({barangayAdminData?.barangay || 'Unknown'})
      </h1>
      <VisitsTable role="barangay" filterFn={filterByBarangay} />
    </div>
  );
}
