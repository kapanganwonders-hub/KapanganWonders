import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, setDoc, getDoc, query, where } from 'firebase/firestore';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';

export interface Spot {
  id: string;
  name?: string;
  location?: string;
  imageUrl?: string;
  image?: string;
  description?: string;
  isPrivate?: boolean;
}

interface FeaturedSpotsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (selectedSpots: Spot[]) => void;
  currentFeatured: string[];
}

const FeaturedSpotsModal: React.FC<FeaturedSpotsModalProps> = ({ 
  isOpen, 
  onClose, 
  onSave,
  currentFeatured 
}) => {
  const [spots, setSpots] = useState<Spot[]>([]);
  const [selectedSpots, setSelectedSpots] = useState<Set<string>>(new Set());
  
  // Initialize selected spots when modal opens or currentFeatured changes
  useEffect(() => {
    if (isOpen && currentFeatured) {
      setSelectedSpots(new Set(currentFeatured));
    }
  }, [isOpen, currentFeatured]);

  // Sync selected spots with available spots when spots change
  useEffect(() => {
    if (spots.length > 0 && selectedSpots.size > 0) {
      const spotIds = new Set(spots.map(spot => spot.id));
      const validSelectedSpots = Array.from(selectedSpots).filter(id => spotIds.has(id));
      
      if (validSelectedSpots.length !== selectedSpots.size) {
        setSelectedSpots(new Set(validSelectedSpots));
      }
    }
  }, [spots, selectedSpots]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchSpots = async () => {
      try {
        setLoading(true);
        
        // Fetch all spots from both collections in parallel
        const [publicSpotsSnapshot, privateSpotsSnapshot] = await Promise.all([
          getDocs(query(collection(db, 'touristSpots'))),
          getDocs(query(collection(db, 'privateSpots')))
        ]);

        // Helper function to parse different timestamp formats
        const parseTimestamp = (timestamp: any) => {
          if (!timestamp) return '';
          try {
            if (typeof timestamp.toDate === 'function') {
              return timestamp.toDate().toISOString();
            } else if (timestamp.seconds) {
              return new Date(timestamp.seconds * 1000).toISOString();
            } else if (typeof timestamp === 'string') {
              return timestamp;
            }
            return '';
          } catch (error) {
            console.warn('Error parsing timestamp:', timestamp, error);
            return '';
          }
        };

        // Process public spots
        const publicSpots = publicSpotsSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: `public_${doc.id}`,
            name: data.name || 'Unnamed Spot',
            location: data.location || 'No location',
            imageUrl: data.imageUrl || data.image,
            image: data.image,
            description: data.description,
            isPrivate: false,
            createdAt: parseTimestamp(data.createdAt),
            updatedAt: parseTimestamp(data.updatedAt)
          } as Spot;
        });

        // Process private spots
        const privateSpots = privateSpotsSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: `private_${doc.id}`,
            name: data.name || 'Unnamed Spot',
            location: data.location || 'No location',
            imageUrl: data.imageUrl || data.image,
            image: data.image,
            description: data.description,
            isPrivate: true,
            createdAt: parseTimestamp(data.createdAt),
            updatedAt: parseTimestamp(data.updatedAt)
          } as Spot;
        });

        // Combine both spot types and sort by name
        const allSpots = [...publicSpots, ...privateSpots].sort((a, b) => {
          const nameA = a.name ?? '';
          const nameB = b.name ?? '';
          return nameA.localeCompare(nameB);
        });

        setSpots(allSpots);
      } catch (error) {
        console.error('Error fetching spots:', error);
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      fetchSpots();
    }
  }, [isOpen]);

  const toggleSpot = (spotId: string) => {
    const newSelected = new Set(selectedSpots);
    if (newSelected.has(spotId)) {
      newSelected.delete(spotId);
    } else if (newSelected.size < 3) { // Limit to 3 featured spots
      newSelected.add(spotId);
    } else {
      // Optional: Show a message or toast that the limit is reached
      alert('You can only select up to 3 spots as featured');
    }
    setSelectedSpots(newSelected);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const selectedSpotsData = spots.filter(spot => selectedSpots.has(spot.id));
      onSave(selectedSpotsData);
      onClose();
    } catch (error) {
      console.error('Error saving featured spots:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Transition appear show={isOpen} as={React.Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={React.Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={React.Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex justify-between items-center mb-4">
                  <Dialog.Title as="h3" className="text-lg font-medium text-gray-900">
                    Manage Featured Destinations
                  </Dialog.Title>
                  <button
                    type="button"
                    className="text-gray-400 hover:text-gray-500"
                    onClick={onClose}
                  >
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>
                
                <div className="mt-2">
                  <p className="text-sm text-gray-500 mb-4">
                    Select up to 3 destinations to feature on the homepage. 
                    {selectedSpots.size > 0 ? (
                      <span>Current selections: <span className="font-medium">{selectedSpots.size}/3</span>
                        {selectedSpots.size >= 3 && (
                          <span className="ml-2 text-amber-600">(Maximum limit reached)</span>
                        )}
                      </span>
                    ) : (
                      <span className="text-gray-400">No spots selected</span>
                    )}
                  </p>
                  
                  {loading ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
                    </div>
                  ) : (
                    <div className="space-y-3 overflow-y-auto max-h-[60vh] pr-2">
                      <style jsx>{`
                        .spot-card {
                          width: 100%;
                        }
                        /* Custom scrollbar styling */
                        .spot-cards-container::-webkit-scrollbar {
                          width: 6px;
                        }
                        .spot-cards-container::-webkit-scrollbar-track {
                          background: #f1f1f1;
                          border-radius: 3px;
                        }
                        .spot-cards-container::-webkit-scrollbar-thumb {
                          background: #888;
                          border-radius: 3px;
                        }
                        .spot-cards-container::-webkit-scrollbar-thumb:hover {
                          background: #555;
                        }
                      `}</style>
                      {spots.map((spot) => (
                        <div
                          key={spot.id}
                          onClick={() => toggleSpot(spot.id)}
                          className={`spot-card relative rounded-lg border p-4 cursor-pointer transition-all ${
                            selectedSpots.has(spot.id)
                              ? 'ring-2 ring-green-500 bg-green-50 border-green-200'
                              : 'hover:bg-gray-50 border-gray-200'
                          } ${
                            currentFeatured.includes(spot.id) && !selectedSpots.has(spot.id)
                              ? 'ring-2 ring-amber-300 border-amber-200 bg-amber-50'
                              : ''
                          }`}
                          title={currentFeatured.includes(spot.id) && !selectedSpots.has(spot.id) 
                            ? 'Currently featured on homepage' 
                            : selectedSpots.has(spot.id) 
                              ? 'Selected to be featured' 
                              : 'Click to select'}
                        >
                          <div className="flex items-start space-x-3">
                            <div className="flex-shrink-0 h-16 w-16 rounded-md overflow-hidden relative">
                              <img
                                className="h-full w-full object-cover"
                                src={spot.imageUrl || spot.image || '/empty-travel.svg'}
                                alt={spot.name}
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  // Try fallback image if available
                                  if (spot.image && target.src !== spot.image) {
                                    target.src = spot.image;
                                  } else {
                                    target.src = '/empty-travel.svg';
                                  }
                                }}
                              />
                              {spot.isPrivate && (
                                <span className="absolute top-1 right-1 bg-yellow-100 text-yellow-800 text-xs px-1 rounded">
                                  Private
                                </span>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{spot.name}</p>
                              <p className="text-sm text-gray-500">{spot.location}</p>
                            </div>
                            <div className="flex-shrink-0">
                              <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${
                                selectedSpots.has(spot.id)
                                  ? 'bg-green-500 border-green-500 text-white'
                                  : 'border-gray-300'
                              }`}>
                                {selectedSpots.has(spot.id) && (
                                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                    onClick={onClose}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="inline-flex justify-center rounded-md border border-transparent bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50"
                    onClick={handleSave}
                    disabled={saving || selectedSpots.size === 0 || selectedSpots.size > 3}
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default FeaturedSpotsModal;
