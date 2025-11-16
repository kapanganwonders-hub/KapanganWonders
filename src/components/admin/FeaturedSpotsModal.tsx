import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, setDoc, getDoc, query, where } from 'firebase/firestore';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface Spot {
  id: string;
  name: string;
  location: string;
  imageUrl: string;
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
  const [selectedSpots, setSelectedSpots] = useState<Set<string>>(new Set(currentFeatured));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchSpots = async () => {
      try {
        const spotsRef = collection(db, 'touristSpots');
        const snapshot = await getDocs(spotsRef);
        const spotsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Spot[];
        setSpots(spotsData);
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
    } else if (newSelected.size < 6) { // Limit to 6 featured spots
      newSelected.add(spotId);
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
                    Select up to 6 destinations to feature on the homepage. Current selections: {selectedSpots.size}/6
                  </p>
                  
                  {loading ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[60vh] overflow-y-auto p-2">
                      {spots.map((spot) => (
                        <div
                          key={spot.id}
                          onClick={() => toggleSpot(spot.id)}
                          className={`relative rounded-lg border p-4 cursor-pointer transition-all ${
                            selectedSpots.has(spot.id)
                              ? 'ring-2 ring-green-500 bg-green-50 border-green-200'
                              : 'hover:bg-gray-50 border-gray-200'
                          }`}
                        >
                          <div className="flex items-start space-x-3">
                            <div className="flex-shrink-0 h-16 w-16 rounded-md overflow-hidden">
                              <img
                                className="h-full w-full object-cover"
                                src={spot.imageUrl || '/empty-travel.svg'}
                                alt={spot.name}
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.src = '/empty-travel.svg';
                                }}
                              />
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
                    disabled={saving || selectedSpots.size === 0}
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
