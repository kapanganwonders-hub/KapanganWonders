"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { Alert, AlertTitle, AlertDescription } from "@/components/lightswind/alert";
import FeaturedSpotsModal from './admin/FeaturedSpotsModal';
import type { Spot } from './admin/FeaturedSpotsModal';
import { getImageUrl } from '@/lib/appwrite';

// Extend the Destination interface to include imageUrl
interface Destination {
  id: string;
  name: string;
  location: string;
  image: string;
  imageUrl?: string;
  description?: string;
}

interface Destination {
  id: string;
  name: string;
  location: string;
  image: string;
  description?: string;
}

const defaultDestinations: Destination[] = [
  {
    id: '1',
    name: 'Amburayan River',
    location: 'Taba-ao',
    image: '/assets/Amburayan River (Taba-ao).jpg',
    description: 'Experience the breathtaking beauty of Amburayan River in Taba-ao. A must-visit destination for nature lovers.'
  },
  {
    id: '2',
    name: 'Ampongot Rice Terraces',
    location: 'Sagubo',
    image: '/assets/Ampongot Rice Terraces (Sagubo).jpg',
    description: 'Marvel at the stunning Ampongot Rice Terraces in Sagubo. A testament to the rich agricultural heritage of Kapangan.'
  },
  {
    id: '3',
    name: 'Amburayan Bridge',
    location: 'Cuba',
    image: '/assets/Amburayan Bridge (Cuba).jpg',
    description: 'Visit the iconic Amburayan Bridge in Cuba, a perfect spot for photography and enjoying scenic views.'
  },
];

const FeaturedDestinations = () => {
  const { currentUser, isAdmin } = useAuth();
  const [destinations, setDestinations] = useState<Destination[]>(defaultDestinations);
  const [title, setTitle] = useState('Featured Destinations');
  const [description, setDescription] = useState('Discover the most beautiful and popular tourist spots in Kapangan');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [isEditingSection, setIsEditingSection] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showSpotsModal, setShowSpotsModal] = useState(false);
  const [sectionTitle, setSectionTitle] = useState(title);
  const [sectionDescription, setSectionDescription] = useState(description);
  const [originalTitle, setOriginalTitle] = useState(title);
  const [originalDescription, setOriginalDescription] = useState(description);
  const [loading, setLoading] = useState(true);
  // Define notification type
  type NotificationType = {
    type: 'success' | 'info' | 'warning' | 'destructive' | 'default';
    title: string;
    message: string;
  };

  const [notification, setNotification] = useState<NotificationType | null>(null);
  
  // Auto-hide notifications after 5 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Log rendering of spots for debugging
  useEffect(() => {
    if (destinations.length > 0) {
      console.log('Rendering spots with images:', 
        destinations.map(d => ({
          id: d.id, 
          name: d.name, 
          hasImage: !!d.image,
          image: d.image
        }))
      );
    }
  }, [destinations]);

  // Reset edit states when admin logs out
  useEffect(() => {
    if (!isAdmin) {
      setIsEditingTitle(false);
      setIsEditingDescription(false);
      setShowModal(false);
      setShowSpotsModal(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    const fetchFeaturedData = async () => {
      try {
        const docRef = doc(db, 'featured', 'destinations');
        const unsubscribe = onSnapshot(docRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data) {
              if (Array.isArray(data.spots) && data.spots.length > 0) {
                setDestinations(data.spots);
              }
              if (data.title) setTitle(data.title);
              if (data.description) setDescription(data.description);
            }
          }
          setLoading(false);
        });

        return () => unsubscribe();
      } catch (error) {
        console.error('Error fetching featured data:', error);
        setLoading(false);
      }
    };

    fetchFeaturedData();
  }, []);

  const saveTitle = async () => {
    if (!isAdmin) {
      console.error('Only admins can edit the title');
      setIsEditingTitle(false);
      return;
    }
    try {
      const docRef = doc(db, 'featured', 'destinations');
      await setDoc(docRef, { 
        title: sectionTitle,
        description: sectionDescription 
      }, { merge: true });
      setIsEditingTitle(false);
      setTitle(sectionTitle);
      setDescription(sectionDescription);
      setNotification({
        type: 'success',
        title: 'Success',
        message: 'Title updated successfully!'
      });
    } catch (error) {
      console.error('Error saving title:', error);
      setNotification({
        type: 'destructive',
        title: 'Error',
        message: 'Failed to update title'
      });
    }
  };

  const saveSection = async () => {
    if (!isAdmin) {
      console.error('Only admins can edit the section');
      return;
    }
    try {
      const docRef = doc(db, 'featured', 'destinations');
      await setDoc(docRef, { 
        title: sectionTitle,
        description: sectionDescription 
      }, { merge: true });
      
      // Update original values
      setOriginalTitle(sectionTitle);
      setOriginalDescription(sectionDescription);
      setIsEditingSection(false);
      setNotification({
        type: 'success',
        title: 'Success',
        message: 'Feature Spot Section updated successfully!'
      });
    } catch (error) {
      console.error('Error saving section:', error);
      setNotification({
        type: 'destructive',
        title: 'Error',
        message: 'Failed to update section'
      });
    }
  };

  const cancelEdit = () => {
    // Revert to original values
    setSectionTitle(originalTitle);
    setSectionDescription(originalDescription);
    setIsEditingSection(false);
  };

  const handleEditSection = () => {
    // Save current values as original when starting to edit
    setOriginalTitle(sectionTitle);
    setOriginalDescription(sectionDescription);
    setIsEditingSection(true);
  };

  const saveDescription = async () => {
    if (!isAdmin) return;
    try {
      const docRef = doc(db, 'featured', 'destinations');
      await setDoc(docRef, { 
        title: sectionTitle,
        description: sectionDescription 
      }, { merge: true });
      setIsEditingDescription(false);
      setTitle(sectionTitle);
      setDescription(sectionDescription);
      setNotification({
        type: 'success',
        title: 'Success',
        message: 'Description updated successfully!'
      });
    } catch (error) {
      console.error('Error saving description:', error);
      setNotification({
        type: 'destructive',
        title: 'Error',
        message: 'Failed to update description'
      });
    }
  };

  interface SelectedSpot {
    id: string;
    name: string;
    location: string;
    imageUrl: string;
    image?: string;      // Optional for backward compatibility
    description?: string; // Optional since it's not in the base Spot type
  }

  const handleSaveFeaturedSpots = async (selectedSpots: Spot[]) => {
    if (!isAdmin) {
      setNotification({
        type: 'destructive',
        title: 'Error',
        message: 'You do not have permission to update featured destinations'
      });
      return;
    }

    try {
      const docRef = doc(db, 'featured', 'destinations');
      
      // Transform spots to match the Destination type
      const spotsToSave = selectedSpots.map(spot => ({
        id: spot.id || '',
        name: spot.name || 'Unnamed Spot',
        location: spot.location || 'Unknown Location',
        image: spot.image || spot.imageUrl || '',
        description: spot.description || ''
      }));

      await setDoc(docRef, {
        spots: spotsToSave,
        title: sectionTitle,
        description: sectionDescription,
        updatedAt: new Date().toISOString(),
        updatedBy: currentUser?.uid || 'admin'
      }, { merge: true });

      // Update local state
      setDestinations(spotsToSave);
      setShowSpotsModal(false);
      
      // Show success notification
      setNotification({
        type: 'success',
        title: 'Success',
        message: 'Featured destinations have been updated successfully!'
      });
    } catch (error) {
      console.error('Error saving featured spots:', error);
      setNotification({
        type: 'destructive',
        title: 'Error',
        message: 'Failed to update featured destinations. Please try again.'
      });
      throw error;
    }
  };

  return (
    <section className="py-12 relative overflow-hidden font-['Poppins']">
      {/* Notification Alert */}
      {notification && (
        <div className="fixed bottom-4 right-4 z-50 w-80 animate-fade-in-up">
          <Alert variant={notification.type} onDismiss={() => setNotification(null)}>
            <div className="flex items-start">
              <div className="flex-shrink-0">
                {notification.type === 'success' && (
                  <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
                {notification.type === 'destructive' && (
                  <svg className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
                {notification.type === 'info' && (
                  <svg className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
              </div>
              <div className="ml-3">
                <AlertTitle className="font-semibold text-sm">{notification.title}</AlertTitle>
                <AlertDescription className="mt-1 text-sm">{notification.message}</AlertDescription>
              </div>
            </div>
          </Alert>
        </div>
      )}
      <FeaturedSpotsModal
        isOpen={showSpotsModal}
        onClose={() => setShowSpotsModal(false)}
        onSave={handleSaveFeaturedSpots}
        currentFeatured={destinations.map(d => d.id)}
      />
      
      {showModal && (
        <div className="fixed z-50 inset-0 overflow-y-auto">
          {/* Your existing modal content */}
        </div>
      )}
      {/* Background Design */}
      <div className="absolute inset-0 z-0 bg-black/30">
        {/* Subtle Background Pattern */}
        <div className="absolute inset-0"></div>
        
        {/* Animated Background Elements */}
        <div className="absolute top-0 left-0 w-72 h-72 bg-green-500/10 rounded-full mix-blend-overlay filter blur-3xl animate-pulse-slow"></div>
        <div className="absolute top-1/4 right-10 w-96 h-96 bg-blue-500/10 rounded-full mix-blend-overlay filter blur-3xl animate-pulse-slower"></div>
        <div className="absolute bottom-10 left-1/4 w-80 h-80 bg-emerald-500/10 rounded-full mix-blend-overlay filter blur-3xl animate-pulse-medium"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {isAdmin && (
          <div className="flex justify-end mb-6">
            <div className="flex space-x-3">
              <button
                onClick={isEditingSection ? cancelEdit : handleEditSection}
                className={`inline-flex items-center px-6 py-2.5 border-2 ${isEditingSection ? 'border-red-400 bg-red-500/90 hover:bg-red-600' : 'border-white/20 bg-white/10 hover:bg-white/20'} text-sm font-medium rounded-full text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white/50 transition-all duration-300 hover:shadow-lg`}
              >
                {isEditingSection ? 'Cancel' : 'Manage Featured Spots Section'}
              </button>
              {isEditingSection && (
                <button
                  onClick={saveSection}
                  className="inline-flex items-center px-6 py-2.5 border-2 border-white/20 text-sm font-medium rounded-full text-white bg-green-500/90 hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-400 transition-all duration-300 hover:shadow-lg"
                >
                  Save Changes
                </button>
              )}
              {isEditingSection && (
                <button
                  onClick={() => setShowSpotsModal(true)}
                  className="inline-flex items-center px-6 py-2.5 border-2 border-white/20 text-sm font-medium rounded-full text-white bg-blue-500/90 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-400 transition-all duration-300 hover:shadow-lg"
                >
                  Select Featured Spots
                </button>
              )}
            </div>
          </div>
        )}
        <div className="text-center mb-12 relative group">
          <div className="inline-block relative">
            {!isEditingTitle ? (
              <div className="relative group">
                <h2 className="text-4xl font-bold text-white mb-4 relative z-10">
                  {isEditingSection ? (
                    <input
                      type="text"
                      value={sectionTitle}
                      onChange={(e) => setSectionTitle(e.target.value)}
                      className="text-center border-b-2 border-green-500 focus:outline-none focus:border-green-700 bg-transparent"
                      placeholder="Enter section title"
                    />
                  ) : (
                    <span 
                      className={`relative inline-block ${isAdmin ? 'cursor-pointer hover:bg-gray-50 rounded-lg p-2 -m-2' : ''}`}
                      onClick={isAdmin ? () => setIsEditingTitle(true) : undefined}
                    >
                      {sectionTitle}
                      <span className="absolute bottom-1 left-0 w-full h-2 bg-green-100 -z-10 transform translate-y-1 rounded-full"></span>
                    </span>
                  )}
                </h2>
              </div>
            ) : (
              <div className="flex justify-center items-center">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onBlur={isAdmin ? saveTitle : undefined}
                  onKeyDown={(e) => e.key === 'Enter' && isAdmin && saveTitle()}
                  className="text-4xl font-bold text-center bg-transparent border-b-2 border-dashed border-gray-300 focus:border-green-500 focus:outline-none font-serif w-full max-w-2xl"
                  autoFocus
                />
              </div>
            )}
          </div>
          <div className="w-24 h-1 bg-gradient-to-r from-green-400 to-green-600 mx-auto my-4 rounded-full"></div>
          
          {isEditingSection ? (
            <div className="mb-8">
              <textarea
                value={sectionDescription}
                onChange={(e) => setSectionDescription(e.target.value)}
                className="text-xl text-center w-full max-w-3xl mx-auto border-2 border-green-500 rounded-lg p-2 focus:outline-none focus:border-green-700 bg-white/80"
                rows={3}
                placeholder="Enter section description"
              />
            </div>
          ) : isEditingDescription ? (
            <input
              type="text"
              value={sectionDescription}
              onChange={(e) => setSectionDescription(e.target.value)}
              onBlur={() => setIsEditingDescription(false)}
              onKeyDown={(e) => e.key === 'Enter' && setIsEditingDescription(false)}
              className="text-xl text-center w-full max-w-3xl mx-auto border-b-2 border-green-500 focus:outline-none focus:border-green-700 bg-transparent"
              autoFocus
            />
          ) : (
            <p 
              className={`text-xl text-gray-200 max-w-3xl mx-auto relative z-10 ${isAdmin ? 'cursor-pointer hover:bg-gray-50 rounded-lg p-2 -m-2' : ''}`}
              onClick={isAdmin ? () => setIsEditingDescription(true) : undefined}
            >
              {sectionDescription}
            </p>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {destinations.map((destination) => (
            <div 
              key={destination.id} 
              className="group bg-black/30 backdrop-blur-sm rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-400 transform hover:-translate-y-2 border border-white/20 hover:border-green-300/50"
            >
              <div className="relative h-56 w-full overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent z-10"></div>
                {(() => {
                  const imageSrc = destination.image 
                    ? (destination.image.startsWith('http') || destination.image.startsWith('/') 
                        ? destination.image 
                        : getImageUrl(destination.image))
                    : '';

                  return (
                    <div className="relative w-full h-full">
                      {imageSrc ? (
                        <Image
                          src={imageSrc}
                          alt={destination.name}
                          fill
                          className="object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            if (destination.imageUrl && destination.imageUrl !== destination.image) {
                              target.src = destination.imageUrl;
                            } else {
                              target.src = '/images/default-spot.jpg';
                            }
                          }}
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                          <span className="text-gray-400">No image available</span>
                        </div>
                      )}
                    </div>
                  );
                })()}
                <div className="absolute bottom-0 left-0 right-0 p-4 z-20">
                  <h3 className="text-xl font-bold text-white mb-1">{destination.name}</h3>
                  <div className="flex items-center text-green-100 text-sm">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                    {destination.location}
                  </div>
                </div>
                <div className="absolute top-3 right-3 z-20">
                  <span className="bg-white/20 backdrop-blur-sm text-white text-xs font-semibold px-2 py-1 rounded-full border border-white/30">
                    Featured
                  </span>
                </div>
              </div>
              <div className="p-4 bg-transparent">
                <p className="text-white/80 text-sm mb-4 line-clamp-2 leading-relaxed">
                  {destination.description || `Experience the beauty of ${destination.name} in ${destination.location}. A must-visit destination for nature lovers.`}
                </p>
                <Link 
                  href="/tourist-spots"
                  className="inline-flex items-center justify-center w-full text-center bg-white/10 hover:bg-white/20 text-white font-medium py-2 px-4 rounded-lg transition-all duration-300 transform hover:shadow-lg group-hover:scale-[1.02] text-sm border border-white/20 hover:border-white/40"
                >
                  <span>Explore Now</span>
                  <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </Link>
              </div>
            </div>
          ))}
        </div>
        
        <div className="text-center mt-12">
          <Link 
            href="/tourist-spots"
            className="group relative inline-flex items-center justify-center px-6 py-3 overflow-hidden font-semibold text-white transition-all duration-300 rounded-full border-2 border-white/30 hover:bg-white/20 hover:text-white text-sm"
          >
            <span className="relative z-10">View All Destinations</span>
            <span className="absolute bottom-0 left-0 w-full h-0 bg-white/20 transition-all duration-300 group-hover:h-full -z-1"></span>
            <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default FeaturedDestinations;