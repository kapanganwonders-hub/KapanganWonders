'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import VisitsTable from '@/components/VisitsTable';
import { useEffect } from 'react';

export default function AdminVisitsPage() {
  const { currentUser, isAdmin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (typeof isAdmin === 'undefined') return;
    if (!isAdmin) router.push('/');
  }, [isAdmin]);

  if (!currentUser || !isAdmin) return <div>Loading...</div>;

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4 text-green-700">Admin - All Visits</h1>
      <VisitsTable role="admin" />
    </div>
  );
}
