'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { collection, query, where, getDocs, doc, updateDoc, deleteDoc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { toast } from 'react-hot-toast';

// Format date helper function
const formatDate = (date: any): string => {
  if (!date) return 'N/A';
  
  try {
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
};

interface FeeItem {
  label: string;
  amount: number;
}

interface EntranceFees {
  adults: FeeItem;
  seniors: FeeItem;
  pwd: FeeItem;
  kids: FeeItem;
  children: FeeItem;
  environmental: FeeItem;
  tourGuide?: FeeItem;
}

interface TouristSpot {
  id: string;
  name: string;
  description: string;
  image: string;
  location: string;
  barangay: string;
  category: string;
  contact?: string;
  googleMapsLink?: string;
  status?: 'approved' | 'rejected' | 'pending';
  addedBy?: string;
  rejectionReason?: string;
  createdAt?: any;
  updatedAt?: any;
  createdBy?: string;
  detailedDescription?: string;
  entranceFees?: EntranceFees;
  entranceFee?: string; // For backward compatibility
}

export default function TouristSpotsManagement() {
  const { currentUser, isAdmin } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'approved' | 'pending' | 'rejected'>('approved');
  const [spots, setSpots] = useState<TouristSpot[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSpot, setSelectedSpot] = useState<TouristSpot | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [viewingSpot, setViewingSpot] = useState<TouristSpot | null>(null);

  useEffect(() => {
    if (typeof isAdmin === 'undefined') return;
    if (!isAdmin) {
      router.push('/');
    } else {
      fetchTouristSpots();
    }
  }, [isAdmin, router, activeTab]);

  const fetchTouristSpots = async () => {
    try {
      setLoading(true);
      
      let spotsQuery;
      let spotsCollection;
      
      if (activeTab === 'pending') {
        // Fetch from pendingSpots collection for pending tab
        spotsCollection = collection(db, 'pendingSpots');
        spotsQuery = query(spotsCollection);
      } else {
        // Fetch all tourist spots for approved tab
        spotsCollection = collection(db, 'touristSpots');
        spotsQuery = query(spotsCollection);
      }
      
      console.log(`Fetching ${activeTab} spots`);
      
      // Fetch all admins for reference
      const [barangayAdminsSnapshot, privateSpotOwnersSnapshot, querySnapshot] = await Promise.all([
        getDocs(collection(db, 'barangayAdmins')),
        getDocs(collection(db, 'privateSpotOwners')),
        getDocs(spotsQuery).catch(error => {
          console.error('Error fetching spots:', error);
          throw error;
        })
      ]);
      
      console.log(`Found ${querySnapshot.size} ${activeTab} spots`);
      
      // Create maps for quick lookup
      const barangayAdmins = new Map(
        barangayAdminsSnapshot.docs.map(doc => [doc.id, doc.data()])
      );
      const privateSpotOwners = new Map(
        privateSpotOwnersSnapshot.docs.map(doc => [doc.id, doc.data()])
      );
      
      // Process spots with admin information
      const spotsData = querySnapshot.docs.map(doc => {
        const data = doc.data();
        let addedBy = 'System';
        let createdBy = 'System';
        
        // Ensure status is properly set for pending spots
        if (activeTab === 'pending') {
          data.status = 'pending';
        }
        
        // Set createdBy to barangay name if it's a barangay spot
        if (data.barangay) {
          createdBy = data.barangay;
          addedBy = data.barangay;
        }
        
        // Handle private spots
        if (data.businessName) {
          addedBy = data.businessName;
        } 
        // Check if createdBy is a private spot owner
        else if (data.createdBy && privateSpotOwners.has(data.createdBy)) {
          const owner = privateSpotOwners.get(data.createdBy);
          if (owner?.businessName) {
            addedBy = owner.businessName;
          } else if (owner?.name) {
            addedBy = owner.name;
          } else {
            addedBy = 'Private Spot';
          }
        }
        
        // Process entrance fees
        let entranceFees = data.entranceFees || {};
        
        // If no entranceFees but has entranceFee (legacy field), create a default structure
        if (!entranceFees && data.entranceFee) {
          entranceFees = {
            adults: { label: 'Adults (18-59 years)', amount: parseFloat(data.entranceFee) || 0 },
            seniors: { label: 'Seniors (60+ years)', amount: 0 },
            pwd: { label: 'Persons with Disability', amount: 0 },
            kids: { label: 'Kids (6-17 years)', amount: 0 },
            children: { label: 'Children (0-5 years)', amount: 0 },
            environmental: { label: 'Environmental Fee', amount: 0 },
            tourGuide: { label: 'Tour Guide (optional)', amount: 0 }
          };
        }
            
        return {
          id: doc.id,
          ...data,
          name: data.name || 'Unnamed Spot',
          image: data.image || '/images/placeholder.jpg',
          location: data.location || 'Location not specified',
          category: data.category || 'Uncategorized',
          description: data.description || '',
          createdAt: data.createdAt ? (typeof data.createdAt.toDate === 'function' ? data.createdAt.toDate() : data.createdAt) : null,
          updatedAt: data.updatedAt ? (typeof data.updatedAt.toDate === 'function' ? data.updatedAt.toDate() : data.updatedAt) : null,
          createdBy: createdBy,
          addedBy: addedBy,
          entranceFees: entranceFees,
          entranceFee: data.entranceFee || '0'
        } as TouristSpot;
      });
      
      // Sort by creation date, newest first
      const sortedSpots = [...spotsData].sort((a, b) => {
        const dateA = a.createdAt ? (a.createdAt instanceof Date ? a.createdAt : a.createdAt.toDate()) : new Date(0);
        const dateB = b.createdAt ? (b.createdAt instanceof Date ? b.createdAt : b.createdAt.toDate()) : new Date(0);
        return dateB.getTime() - dateA.getTime();
      });
      
      console.log('Processed spots:', sortedSpots);
      setSpots(sortedSpots);
    } catch (error) {
      console.error('Error fetching tourist spots:', error);
      toast.error('Failed to load tourist spots');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (spotId: string) => {
    try {
      // Get the pending spot document
      const pendingSpotRef = doc(db, 'pendingSpots', spotId);
      const pendingSpotDoc = await getDoc(pendingSpotRef);
      
      if (!pendingSpotDoc.exists()) {
        throw new Error('Pending spot not found');
      }

      const spotData = pendingSpotDoc.data() as Omit<TouristSpot, 'id'>;
      
      // Add the spot to touristSpots collection
      const newSpotRef = doc(collection(db, 'touristSpots'));
      await setDoc(newSpotRef, {
        ...spotData,
        status: 'approved',
        approvedAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      } as Omit<TouristSpot, 'id'>);

      // Delete from pendingSpots
      await deleteDoc(pendingSpotRef);
      
      toast.success('Tourist spot approved successfully');
      fetchTouristSpots(); // Refresh the list
    } catch (error: unknown) {
      console.error('Error approving spot:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      toast.error(`Failed to approve tourist spot: ${errorMessage}`);
    }
  };

  const handleReject = async () => {
    if (!selectedSpot || !rejectionReason.trim()) return;
    
    try {
      await updateDoc(doc(db, 'touristSpots', selectedSpot.id), {
        status: 'rejected',
        rejectionReason: rejectionReason.trim(),
        updatedAt: Timestamp.now()
      });
      
      setShowRejectModal(false);
      setRejectionReason('');
      toast.success('Tourist spot rejected');
      fetchTouristSpots();
    } catch (error) {
      console.error('Error rejecting spot:', error);
      toast.error('Failed to reject tourist spot');
    }
  };

  const openRejectModal = (spot: TouristSpot) => {
    setSelectedSpot(spot);
    setShowRejectModal(true);
  };

  const openViewModal = (spot: TouristSpot) => {
    setViewingSpot(spot);
    setShowViewModal(true);
  };

  const handleDelete = async (spotId: string) => {
    if (!window.confirm('Are you sure you want to delete this tourist spot? This action cannot be undone.')) {
      return;
    }
    
    try {
      await deleteDoc(doc(db, 'touristSpots', spotId));
      toast.success('Tourist spot deleted successfully');
      fetchTouristSpots();
    } catch (error) {
      console.error('Error deleting spot:', error);
      toast.error('Failed to delete tourist spot');
    }
  };

  if (typeof isAdmin === 'undefined' || loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!currentUser || !isAdmin) {
    return <div className="min-h-screen flex items-center justify-center">Unauthorized access</div>;
  }

  const formatDate = (date: Date | undefined) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="bg-egg-white p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Tourist Spots Management</h1>
        
        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('pending')}
              className={`${activeTab === 'pending' ? 'border-primary-green text-primary-green' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Pending Approval
            </button>
            <button
              onClick={() => setActiveTab('approved')}
              className={`${activeTab === 'approved' ? 'border-primary-green text-primary-green' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Approved
            </button>
          </nav>
        </div>

        {/* Spots Table */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          {loading ? (
            <div className="p-6 text-center">Loading...</div>
          ) : activeTab === 'pending' && spots.some(spot => spot.status === 'pending') ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Spot
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Added By
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Submitted
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {spots
                    .filter(spot => spot.status === 'pending')
                    .map((spot) => (
                      <tr key={spot.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-12 w-12">
                              <img 
                                className="h-12 w-12 rounded-lg object-cover" 
                                src={spot.image} 
                                alt={spot.name}
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.onerror = null;
                                  target.src = '/images/placeholder.jpg';
                                }}
                              />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{spot.name}</div>
                              <div className="text-sm text-gray-500">{spot.category}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{spot.addedBy}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{formatDate(spot.createdAt)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                            Pending
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                          <button
                            onClick={() => openViewModal(spot)}
                            className="text-blue-600 hover:text-blue-900"
                            title="View Details"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleApprove(spot.id)}
                            className="text-green-600 hover:text-green-900"
                            title="Approve"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </button>
                          <button
                            onClick={() => openRejectModal(spot)}
                            className="text-red-600 hover:text-red-900"
                            title="Reject"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          ) : spots.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              {activeTab === 'pending' 
                ? 'No pending tourist spots found.' 
                : 'No approved tourist spots found.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Spot
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Added By
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Submitted
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {spots.map((spot) => (
                    <tr key={spot.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-12 w-12">
                            {spot.image ? (
                              <img 
                                className="h-12 w-12 rounded-lg object-cover" 
                                src={spot.image} 
                                alt={spot.name}
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.onerror = null;
                                  target.src = '/images/placeholder.jpg';
                                }}
                              />
                            ) : (
                              <div className="h-12 w-12 rounded-lg bg-gray-100 flex items-center justify-center">
                                <span className="text-gray-400">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{spot.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{spot.addedBy}</div>
                        <div className="text-xs text-gray-500">
                          {spot.createdAt ? new Date(spot.createdAt).toLocaleDateString() : 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(spot.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          Approved
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                        {spot.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApprove(spot.id)}
                              className="text-green-600 hover:text-green-900"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => {
                                setSelectedSpot(spot);
                                setShowRejectModal(true);
                              }}
                              className="text-red-600 hover:text-red-900 ml-3"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => {
                            // Navigate to the main tourist spot page with the spot ID
                            router.push(`/tourist-spots?id=${spot.id}&showDetails=true`);
                          }}
                          className="text-blue-600 hover:text-blue-900 ml-3"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div>
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                  <svg className="h-6 w-6 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div className="mt-3 text-center sm:mt-5">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Reject Tourist Spot</h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      Are you sure you want to reject this tourist spot? Please provide a reason for rejection.
                    </p>
                    <div className="mt-4">
                      <label htmlFor="rejectionReason" className="block text-sm font-medium text-gray-700 text-left mb-1">
                        Reason for Rejection
                      </label>
                      <textarea
                        id="rejectionReason"
                        rows={3}
                        className="shadow-sm focus:ring-primary-green focus:border-primary-green block w-full sm:text-sm border-gray-300 rounded-md"
                        placeholder="Please provide a reason for rejection..."
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:col-start-2 sm:text-sm"
                  onClick={handleReject}
                  disabled={!rejectionReason.trim()}
                >
                  Reject
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-green sm:mt-0 sm:col-start-1 sm:text-sm"
                  onClick={() => {
                    setShowRejectModal(false);
                    setRejectionReason('');
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Spot Modal */}
      {showViewModal && viewingSpot && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 overflow-y-auto">
          <div className="min-h-screen flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl overflow-hidden">
              {/* Modal Header */}
              <div className="bg-light-green border-b border-border-green px-8 py-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h1 className="text-3xl font-bold text-primary-green">{viewingSpot.name}</h1>
                    <div className="mt-2 flex items-center text-sm text-primary-green/80">
                      <span className="inline-flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {viewingSpot.barangay}, Kapangan
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      viewingSpot.status === 'approved' 
                        ? 'bg-green-100 text-green-800' 
                        : viewingSpot.status === 'rejected' 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {viewingSpot.status ? viewingSpot.status.charAt(0).toUpperCase() + viewingSpot.status.slice(1) : 'Pending'}
                    </span>
                    <button
                      onClick={() => setShowViewModal(false)}
                      className="text-gray-500 hover:text-gray-700 transition-colors"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Modal Body */}
              <div className="p-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Left Column - Image and Basic Info */}
                  <div className="space-y-6">
                    <div className="relative rounded-xl overflow-hidden bg-gray-100" style={{ aspectRatio: '16/9' }}>
                      <img
                        src={viewingSpot.image || '/images/placeholder.jpg'}
                        alt={viewingSpot.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.onerror = null;
                          target.src = '/images/placeholder.jpg';
                        }}
                      />
                    </div>
                    
                    {/* Spot Information */}
                    <div className="bg-light-green/30 p-6 rounded-lg border border-border-green">
                      <h2 className="text-xl font-semibold text-primary-green mb-4">Spot Information</h2>
                      
                      <div className="space-y-4">
                        {/* Category */}
                        <div>
                          <h3 className="font-medium text-primary-green mb-1">Category</h3>
                          <div className="bg-accent-green text-egg-white px-3 py-1 rounded-full text-sm font-medium inline-block">
                            {viewingSpot.category || 'Not specified'}
                          </div>
                        </div>
                        
                        {/* Location */}
                        <div>
                          <h3 className="font-medium text-primary-green mb-1">Location</h3>
                          <p className="text-primary-green/80">{viewingSpot.location || 'Not specified'}</p>
                        </div>
                        
                        {/* Barangay */}
                        <div>
                          <h3 className="font-medium text-primary-green mb-1">Barangay</h3>
                          <p className="text-primary-green/80">{viewingSpot.barangay || 'Not specified'}</p>
                        </div>
                        
                        {/* Contact */}
                        {viewingSpot.contact && (
                          <div>
                            <h3 className="font-medium text-primary-green mb-1">Contact</h3>
                            <a 
                              href={`tel:${viewingSpot.contact}`}
                              className="text-primary-green hover:underline"
                            >
                              {viewingSpot.contact}
                            </a>
                          </div>
                        )}
                        
                        {/* Google Maps Link */}
                        {viewingSpot.googleMapsLink && (
                          <div>
                            <h3 className="font-medium text-primary-green mb-2">Map Location</h3>
                            <a
                              href={viewingSpot.googleMapsLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center text-primary-green hover:underline"
                            >
                              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              View on Google Maps
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Right Column - Description and Details */}
                  <div className="space-y-6">
                    {/* Description */}
                    <div className="bg-egg-white border border-border-green rounded-lg p-6 shadow-sm">
                      <h2 className="text-xl font-semibold text-primary-green mb-4">Description</h2>
                      <div className="prose max-w-none text-primary-green/80 leading-relaxed whitespace-pre-line">
                        {viewingSpot.detailedDescription || viewingSpot.description || 'No description available.'}
                      </div>
                    </div>

                    {/* Entrance Fees */}
                    <div className="bg-egg-white border border-border-green rounded-lg p-6 shadow-sm">
                      <h2 className="text-xl font-semibold text-primary-green mb-4">Entrance Fees</h2>
                      <div className="space-y-2">
                        {viewingSpot.entranceFees ? (
                          <div className="space-y-2">
                            {Object.entries(viewingSpot.entranceFees).map(([key, fee]) => (
                              fee && (
                                <div key={key} className="flex justify-between items-center">
                                  <span className="text-primary-green/80">{fee.label || key}:</span>
                                  <span className="font-medium text-primary-green">
                                    {fee.amount > 0 ? `₱${fee.amount.toFixed(2)}` : 'Free'}
                                  </span>
                                </div>
                              )
                            ))}
                          </div>
                        ) : viewingSpot.entranceFee ? (
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-primary-green/80">Standard Fee:</span>
                              <span className="font-medium text-primary-green">
                                ₱{parseFloat(viewingSpot.entranceFee).toFixed(2)}
                              </span>
                            </div>
                            <p className="text-sm text-gray-500 mt-2">
                              Note: This spot uses the legacy pricing format. Some fee categories may not be available.
                            </p>
                          </div>
                        ) : (
                          <p className="text-primary-green/80">No entrance fee information available</p>
                        )}
                      </div>
                    </div>
                    
                    {/* Submission Details */}
                    <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                      <h2 className="text-xl font-semibold text-primary-green mb-4">Submission Details</h2>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Status:</span>
                          <span className="font-medium">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              viewingSpot.status === 'approved' 
                                ? 'bg-green-100 text-green-800' 
                                : viewingSpot.status === 'rejected' 
                                  ? 'bg-red-100 text-red-800' 
                                  : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {viewingSpot.status ? viewingSpot.status.charAt(0).toUpperCase() + viewingSpot.status.slice(1) : 'Pending'}
                            </span>
                          </span>
                        </div>
                        
                        <div className="flex justify-between">
                          <span className="text-gray-600">Submitted on:</span>
                          <span className="text-gray-800 font-medium">{formatDate(viewingSpot.createdAt)}</span>
                        </div>
                        
                        {viewingSpot.updatedAt && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Last updated:</span>
                            <span className="text-gray-800 font-medium">{formatDate(viewingSpot.updatedAt)}</span>
                          </div>
                        )}
                        
                        {viewingSpot.addedBy && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Added by:</span>
                            <span className="text-gray-800 font-medium">{viewingSpot.addedBy}</span>
                          </div>
                        )}
                        
                        {viewingSpot.createdBy && viewingSpot.createdBy !== viewingSpot.addedBy && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Created by:</span>
                            <span className="text-gray-800 font-medium">{viewingSpot.createdBy}</span>
                          </div>
                        )}
                        
                        {viewingSpot.rejectionReason && viewingSpot.status === 'rejected' && (
                          <div className="mt-4 pt-3 border-t border-gray-200">
                            <h4 className="font-medium text-red-700 mb-1">Rejection Reason:</h4>
                            <p className="text-red-600 text-sm">{viewingSpot.rejectionReason}</p>
                          </div>
                        )}
                      </div>
                    </div>
                    
                  </div>
                </div>
              </div>
              
              {/* Footer with action buttons */}
              <div className="bg-gray-50 px-8 py-4 border-t border-gray-200 flex justify-end gap-3">
                {viewingSpot.status === 'pending' && (
                  <>
                    <button
                      onClick={() => {
                        setShowViewModal(false);
                        handleApprove(viewingSpot.id);
                      }}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-md transition-colors flex items-center"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Approve
                    </button>
                    <button
                      onClick={() => {
                        setSelectedSpot(viewingSpot);
                        setShowViewModal(false);
                        setShowRejectModal(true);
                      }}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-md transition-colors flex items-center"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Reject
                    </button>
                  </>
                )}
                <button
                  onClick={() => setShowViewModal(false)}
                  className="px-4 py-2 bg-primary-green hover:bg-primary-green/90 text-white text-sm font-medium rounded-md transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
