'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect, useRef, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { doc, updateDoc, setDoc, getFirestore, collection, getDocs, query, where, getDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { toast } from 'react-hot-toast';
import { uploadFile, deleteFile } from '@/lib/appwrite';

interface Announcement {
  id: string;
  title: string;
  content: string;
  category: string;
  touristSpotId?: string;
  touristSpotName?: string;
  expiryDate?: string;
  createdAt: any;
}

interface AlertState {
  variant: 'default' | 'destructive' | 'success';
  message: string;
}

interface EntranceFees {
  adults: { label: string; amount: number };
  seniors: { label: string; amount: number };
  pwd: { label: string; amount: number };
  kids: { label: string; amount: number };
  children: { label: string; amount: number };
  environmental: { label: string; amount: number };
  tourGuide?: { label: string; amount: number }; // Optional
}

interface TouristSpot {
  id: string;
  numericId?: string | number; // For flexible ID matching
  name: string;
  description: string;
  image: string;
  location: string;
  barangay: string;
  category: string;
  contact?: string;
  entranceFee?: string; // Keeping for backward compatibility
  entranceFees?: EntranceFees;
  googleMapsLink?: string;
  detailedDescription?: string;
  status?: 'active' | 'inactive';
  closed?: boolean;
  closedReason?: string;
  closedUntil?: string;
  createdAt?: any;
  updatedAt?: any;
  _tempImage?: File; // Temporary file object for upload preview
}

export default function TouristSpots() {
  const { isBarangayAdmin, barangayAdminData, user } = useAuth();
  const [closureAnnouncements, setClosureAnnouncements] = useState<Announcement[]>([]);
  const [selectedBarangay, setSelectedBarangay] = useState<string>('all');
  const [selectedSpot, setSelectedSpot] = useState<TouristSpot | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedSpot, setEditedSpot] = useState<TouristSpot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize spots state
  const [spots, setSpots] = useState<TouristSpot[]>([]);
  const [alertState, setAlertState] = useState<AlertState | null>(null);

  // Auto-clear alert after 5 seconds
  useEffect(() => {
    if (alertState) {
      const timer = setTimeout(() => {
        setAlertState(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [alertState]);

  // Handle URL parameters for direct edit
  useEffect(() => {
    if (typeof window === 'undefined' || !spots.length) return;
    
    const params = new URLSearchParams(window.location.search);
    const spotId = params.get('spotId') || params.get('id');
    const editMode = params.get('edit') === 'true';
    
    if (!spotId) return;
    
    // Enhanced spot finding logic
    let spot: TouristSpot | undefined;
    
    // First try exact match
    spot = spots.find(s => String(s.id) === spotId);
    
    // If not found, try numeric comparison
    if (!spot && !isNaN(Number(spotId))) {
      spot = spots.find(s => 
        String(s.id) === String(Number(spotId)) || 
        (s.numericId && String(s.numericId) === String(Number(spotId)))
      );
    }
    
    // If still not found, try case-insensitive comparison of string IDs
    if (!spot) {
      spot = spots.find(s => 
        String(s.id).toLowerCase() === spotId.toLowerCase()
      );
    }
    
    if (!spot) {
      console.error('Spot not found:', spotId, 'Available spots:', spots.map(s => ({ id: s.id, numericId: s.numericId })));
      // Show error message to the user
      setAlertState({
        variant: 'destructive',
        message: `Tourist spot with ID ${spotId} not found. It may have been moved or deleted.`
      });
      return;
    }
    
    // Set the spot and show details
    setSelectedSpot(spot);
    setEditedSpot(spot);
    setShowDetails(true);
    
    // If in edit mode, enable editing
    if (editMode) {
      setIsEditing(true);
      // Clean up the URL
      const url = new URL(window.location.href);
      url.searchParams.delete('edit');
      window.history.replaceState({}, '', url.toString());
    }
  }, [spots]);

  // Fetch closure announcements
  const fetchClosureAnnouncements = async () => {
    try {
      const db = getFirestore();
      const now = new Date().toISOString();
      
      // Fetch all announcements (we'll filter in memory)
      const q = query(collection(db, 'announcements'));
      const querySnapshot = await getDocs(q);
      
      // Filter announcements in memory
      const announcements = querySnapshot.docs
        .map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            title: data.title || '',
            content: data.content || '',
            category: data.category || '',
            touristSpotId: data.touristSpotId,
            touristSpotName: data.touristSpotName,
            expiryDate: data.expiryDate,
            createdAt: data.createdAt
          } as Announcement;
        })
        .filter(announcement => {
          const isClosure = [
            'Closure - Maintenance', 
            'Closure - Weather Conditions', 
            'Closure - Road Access'
          ].includes(announcement.category);
          
          const isNotExpired = !announcement.expiryDate || 
            announcement.expiryDate >= now;
            
          return isClosure && isNotExpired;
        });
      
      setClosureAnnouncements(announcements);
      return announcements;
    } catch (error) {
      console.error('Error fetching closure announcements:', error);
      return [];
    }
  };

  // Process spots and update with closure status
  const processSpotsWithClosures = (spots: TouristSpot[], announcements: Announcement[]) => {
    console.log('Processing spots with closures...');
    console.log('Announcements:', announcements);
    
    const spotMap = new Map<string, Announcement>();
    
    // Create a map of spot IDs to their closure announcements
    announcements.forEach(announcement => {
      if (announcement.touristSpotId) {
        const announcementSpotId = announcement.touristSpotId;
        console.log(`Found closure announcement for spot ${announcementSpotId} (${typeof announcementSpotId}):`, announcement);
        
        // Store under both string and number keys to handle type mismatches
        spotMap.set(announcementSpotId.toString(), announcement);
        
        // If the ID can be parsed as a number, also store it as a number
        const numericId = parseInt(announcementSpotId);
        if (!isNaN(numericId)) {
          spotMap.set(numericId.toString(), announcement);
        }
      } else {
        console.log('Announcement missing touristSpotId:', announcement);
      }
    });
    
    console.log('Spot map:', Array.from(spotMap.entries()));
    
    // Update spots with closure information
    const processedSpots = spots.map(spot => {
      // Try multiple ID lookups to handle different formats
      const possibleIds = [
        spot.id,
        spot.numericId?.toString(),
        spot.id?.toString(),
        // If ID is a number, try it as a number too
        ...(spot.id && !isNaN(Number(spot.id)) ? [Number(spot.id).toString()] : [])
      ].filter(Boolean) as string[];
      
      // Find the first matching announcement
      const closureAnnouncement = possibleIds
        .map(id => spotMap.get(id))
        .find(Boolean);
      
      console.log(`Processing spot ID: ${spot.id} (${typeof spot.id}), numericId: ${spot.numericId}, closureAnnouncement:`, closureAnnouncement);
      
      if (closureAnnouncement) {
        console.log(`Marking spot ${spot.id} (${typeof spot.id}) as closed. Reason: ${closureAnnouncement.content}`);
        return {
          ...spot,
          closed: true,
          closedReason: closureAnnouncement.content || 'This spot is temporarily closed',
          closedUntil: closureAnnouncement.expiryDate
        };
      }
      
      // Ensure closed is explicitly set to false if no closure announcement exists
      return {
        ...spot,
        closed: false
      };
    });
    
    console.log('Processed spots:', processedSpots);
    return processedSpots;
  };

  // Fetch all tourist spots
  useEffect(() => {
    const fetchSpots = async () => {
      try {
        setLoading(true);
        const db = getFirestore();
        
        console.log('Fetching spots and announcements...');
        
        // Fetch spots and announcements in parallel
        const [announcements, spotsSnapshot] = await Promise.all([
          fetchClosureAnnouncements(),
          getDocs(query(collection(db, 'touristSpots')))
        ]);
        
        console.log('Raw spots from Firestore:', spotsSnapshot.docs.map(doc => doc.data()));
        
        const spotsData = spotsSnapshot.docs.map(doc => {
          const data = doc.data();
          const docId = doc.id;
          // Try to get numeric ID from data or parse the document ID
          const numericId = data.id || (!isNaN(Number(docId)) ? Number(docId) : docId);
          
          console.log(`Spot ID: ${docId}, Type: ${typeof docId}, Numeric ID: ${numericId} (${typeof numericId})`);
          
          return {
            ...data,
            id: docId,  // Keep original ID as string
            numericId,  // Add numeric ID for flexible matching
          } as TouristSpot;
        });
        
        console.log('Fetched spots:', spotsData);
        
        // Process spots with closure information
        const processedSpots = processSpotsWithClosures(spotsData, announcements);
        
        console.log('Processed spots with closures:', processedSpots);
        setSpots(processedSpots);
        setError(null);
      } catch (err) {
        console.error('Error fetching spots:', err);
        setError('Failed to load tourist spots. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchSpots();
  }, [isBarangayAdmin, barangayAdminData?.barangay]);

  // Get unique barangays from the fetched spots
  const barangays = ['all', ...Array.from(new Set(spots.map(spot => spot.barangay)))];

  // Filter spots based on selected barangay
  const filteredSpots = spots.filter(spot => {
    return selectedBarangay === 'all' || spot.barangay === selectedBarangay;
  });

  // Group spots by barangay for display
  const groupedSpots = filteredSpots.reduce<Record<string, TouristSpot[]>>((acc, spot) => {
    if (!acc[spot.barangay]) {
      acc[spot.barangay] = [];
    }
    acc[spot.barangay].push(spot);
    return acc;
  }, {});

  // Scroll to section when barangay is selected
  const scrollToSection = (barangay: string) => {
    if (barangay === 'all') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      const element = document.getElementById(`barangay-${barangay}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  useEffect(() => {
    if (selectedBarangay !== 'all') {
      scrollToSection(selectedBarangay);
    }
  }, [selectedBarangay]);

  const openDetails = (spot: TouristSpot) => {
    setSelectedSpot(spot);
    setEditedSpot({...spot});
    setShowDetails(true);
    setIsEditing(false);
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!editedSpot) return;
    
    try {
      setLoading(true);
      
      // Check if user is authenticated
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) {
        toast.error('You must be logged in to update a spot');
        return;
      }

      const db = getFirestore();
      
      // Ensure we have a valid ID (for new spots, this would be handled differently)
      if (!editedSpot.id) {
        throw new Error('Invalid spot ID');
      }
      
      const spotRef = doc(db, 'touristSpots', String(editedSpot.id));
      
      // Get current spot data to verify permissions
      const spotDoc = await getDoc(spotRef);
      
      // For new spots, spotDoc.exists() will be false
      const isNewSpot = !spotDoc.exists();
      
      let currentSpotData = {} as TouristSpot;
      if (!isNewSpot) {
        currentSpotData = spotDoc.data() as TouristSpot;
      }
      
      // Check if user is admin
      const adminDoc = await getDoc(doc(db, 'admins', user.uid));
      const isUserAdmin = adminDoc.exists() && adminDoc.data()?.email === user.email;
      
      // If not admin, check if user is barangay admin for this spot
      if (!isUserAdmin && !isNewSpot) {
        const barangayAdminDoc = await getDoc(doc(db, 'barangayAdmins', user.uid));
        const isBarangayAdmin = barangayAdminDoc.exists() && 
                              barangayAdminDoc.data()?.barangay === currentSpotData.barangay;
        
        if (!isBarangayAdmin) {
          throw new Error('You do not have permission to update this spot');
        }
      }
      
      // Create update data
      const updateData: Partial<TouristSpot> = {
        name: editedSpot.name || '',
        description: editedSpot.description || '',
        location: editedSpot.location || '',
        barangay: editedSpot.barangay || '',
        category: editedSpot.category || 'other',
        contact: editedSpot.contact || '',
        entranceFee: editedSpot.entranceFee || '',
        entranceFees: editedSpot.entranceFees || {
          adults: { label: 'Adults (18–59 years)', amount: 0 },
          seniors: { label: 'Seniors (60+ years)', amount: 0 },
          pwd: { label: 'Persons with Disability (PWD)', amount: 0 },
          kids: { label: 'Kids (11–17 years)', amount: 0 },
          children: { label: 'Children (below 6 years)', amount: 0 },
          environmental: { label: 'Environmental Fee', amount: 0 },
          tourGuide: { label: 'Tour Guide Fee (optional)', amount: 0 }
        },
        detailedDescription: editedSpot.detailedDescription || '',
        googleMapsLink: editedSpot.googleMapsLink || '',
        updatedAt: new Date().toISOString()
      };
      
      // Handle image separately if it was changed
      if (editedSpot.image !== selectedSpot?.image) {
        updateData.image = editedSpot.image || '';
      } else if (editedSpot.image) {
        updateData.image = editedSpot.image;
      }
      
      // Update or create the document in Firestore
      if (isNewSpot) {
        // For new spots, we need to use setDoc with merge
        await setDoc(spotRef, {
          ...updateData,
          createdAt: new Date().toISOString(),
          createdBy: user.uid
        }, { merge: true });
      } else {
        // For existing spots, use updateDoc
        await updateDoc(spotRef, updateData);
      }
      
      // Get the updated document
      const updatedDoc = await getDoc(spotRef);
      const updatedSpot = {
        id: updatedDoc.id,
        ...updatedDoc.data()
      } as TouristSpot;
      
      // Update local state
      const updatedSpots = isNewSpot 
        ? [...spots, updatedSpot]
        : spots.map(spot => spot.id === updatedSpot.id ? updatedSpot : spot);
      
      setSelectedSpot(updatedSpot);
      setEditedSpot(updatedSpot);
      setSpots(updatedSpots);
      
      toast.success(`Tourist spot ${isNewSpot ? 'created' : 'updated'} successfully!`);
      setIsEditing(false);
    } catch (error: any) {
      console.error('Error saving document: ', error);
      toast.error(error.message || 'Failed to save tourist spot. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    if (selectedSpot) {
      setEditedSpot({...selectedSpot});
    }
    setIsEditing(false);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !editedSpot) return;
    
    const file = e.target.files[0];
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    try {
      setIsUploading(true);
      
      // Create a temporary URL for immediate preview
      const tempUrl = URL.createObjectURL(file);
      
      // Update both editedSpot and selectedSpot with the temporary URL
      const updateWithTempImage = {
        ...editedSpot,
        image: tempUrl,
        _tempImage: file
      };
      
      setEditedSpot(updateWithTempImage);
      setSelectedSpot(updateWithTempImage);
      
      try {
        // Upload the file in the background
        const result = await uploadFile(file);
        const fileUrl = result.url;
        
        // If there was a previous image, delete it (but only if it's not the same as the new one)
        const oldImage = editedSpot.image;
        if (oldImage && typeof oldImage === 'string' && oldImage.includes('appwrite.io') && oldImage !== fileUrl) {
          try {
            const fileId = oldImage.split('/files/')[1]?.split('/view')[0];
            if (fileId) {
              await deleteFile(fileId);
            }
          } catch (error) {
            console.error('Error deleting old image:', error);
            // Continue even if deletion fails
          }
        }

        // Update with the permanent URL
        const updateWithPermanentImage = {
          ...editedSpot,
          image: fileUrl,
          _tempImage: undefined
        };
        
        setEditedSpot(updateWithPermanentImage);
        setSelectedSpot(updateWithPermanentImage);
        
        toast.success('Image uploaded successfully');
      } catch (error) {
        console.error('Error uploading file:', error);
        toast.error('Failed to upload image');
        // Revert to previous state on error
        setEditedSpot(prev => ({
          ...prev!,
          image: selectedSpot?.image || '',
          _tempImage: undefined
        }));
      }
    } catch (error) {
      console.error('Error handling file change:', error);
      toast.error('An error occurred while processing the image');
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveImage = async () => {
    if (!editedSpot || !editedSpot.image) return;
    
    const oldImageUrl = editedSpot.image;
    
    try {
      setIsUploading(true);
      
      // Update UI immediately
      setEditedSpot(prev => ({
        ...prev!,
        image: '',
        _tempImage: undefined
      }));
      
      // Delete the old image in the background
      if (oldImageUrl.includes('appwrite.io')) {
        try {
          const fileId = oldImageUrl.split('/files/')[1]?.split('/view')[0];
          if (fileId) {
            await deleteFile(fileId);
          }
        } catch (error) {
          console.error('Error deleting image from storage:', error);
          // Don't show error to user as the UI is already updated
        }
      }
      
      toast.success('Image removed successfully');
    } catch (error) {
      console.error('Error removing image:', error);
      // Revert the change if something goes wrong
      setEditedSpot(prev => ({
        ...prev!,
        image: oldImageUrl
      }));
      toast.error('Failed to remove image');
    } finally {
      setIsUploading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    if (!editedSpot) return;
    
    const { name, value, type } = e.target;
    
    // Handle nested entranceFees updates
    if (name.startsWith('entranceFees.')) {
      const [_, feeType, field] = name.split('.');
      
      // Create a deep copy of the current state to avoid direct mutations
      const updatedSpot = { ...editedSpot };
      
      // Initialize entranceFees if it doesn't exist
      if (!updatedSpot.entranceFees) {
        updatedSpot.entranceFees = {
          adults: { label: 'Adults (18–59 years)', amount: 0 },
          seniors: { label: 'Seniors (60+ years)', amount: 0 },
          pwd: { label: 'Persons with Disability (PWD)', amount: 0 },
          kids: { label: 'Kids (11–17 years)', amount: 0 },
          children: { label: 'Children (below 6 years)', amount: 0 },
          environmental: { label: 'Environmental Fee', amount: 0 },
          tourGuide: { label: 'Tour Guide Fee (optional)', amount: 0 }
        };
      }
      
      // Handle amount field specifically
      if (field === 'amount') {
        // If the value is empty string, set it to 0
        const amountValue = value === '' ? 0 : parseFloat(value);
        
        // Update the specific fee type
        updatedSpot.entranceFees = {
          ...updatedSpot.entranceFees,
          [feeType]: {
            ...(updatedSpot.entranceFees[feeType as keyof EntranceFees] || {
              label: feeType === 'adults' ? 'Adults (18–59 years)' : 
                     feeType === 'seniors' ? 'Seniors (60+ years)' :
                     feeType === 'pwd' ? 'Persons with Disability (PWD)' :
                     feeType === 'kids' ? 'Kids (11–17 years)' :
                     feeType === 'children' ? 'Children (below 6 years)' :
                     feeType === 'environmental' ? 'Environmental Fee' : 'Tour Guide Fee (optional)'
            }),
            amount: isNaN(amountValue) ? 0 : amountValue
          }
        };
      } else {
        // Handle label field
        updatedSpot.entranceFees = {
          ...updatedSpot.entranceFees,
          [feeType]: {
            ...(updatedSpot.entranceFees[feeType as keyof EntranceFees] || {
              amount: 0,
              label: ''
            }),
            [field]: value
          }
        };
      }
      
      setEditedSpot(updatedSpot);
    } else {
      setEditedSpot({
        ...editedSpot,
        [name]: value
      });
    }
  };

  const router = useRouter();

  const closeDetails = () => {
    if (isEditing) {
      // If in edit mode, navigate to dashboard
      router.push('/barangay-admin');
    } else {
      // Otherwise, just close the details view
      setSelectedSpot(null);
      setShowDetails(false);
    }
  };

  // If showing details, render the detail page
  if (showDetails && selectedSpot && editedSpot) {
    return (
      <div className="min-h-screen bg-egg-white">
        {/* Header with back button */}
        <div className="bg-light-green border-b border-border-green">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <button
              onClick={closeDetails}
              className="flex items-center gap-2 text-primary-green hover:text-accent-green font-medium transition-colors duration-300"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              {isEditing ? 'Back to Dashboard' : 'Back to Tourist Spots'}
            </button>
          </div>
        </div>

        {/* Detail Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Image and Info */}
            <div className="space-y-6">
              {/* Image */}
              <div className="relative h-96 w-full rounded-lg overflow-hidden shadow-lg bg-gray-100">
                {(selectedSpot.image || (editedSpot?._tempImage && isEditing)) ? (
                  <div className="relative h-full w-full">
                    {editedSpot?._tempImage ? (
                      <Image
                        src={URL.createObjectURL(editedSpot._tempImage)}
                        alt={selectedSpot.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 1024px) 100vw, 50vw"
                        onLoad={(e) => {
                          // Revoke the object URL to avoid memory leaks
                          if (e.currentTarget.src.startsWith('blob:')) {
                            URL.revokeObjectURL(e.currentTarget.src);
                          }
                        }}
                      />
                    ) : (
                      <Image
                        src={selectedSpot.image}
                        alt={selectedSpot.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 1024px) 100vw, 50vw"
                        unoptimized={selectedSpot.image.includes('appwrite.io')}
                      />
                    )}
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <span>No image available</span>
                  </div>
                )}
                {isEditing && (
                  <div className="absolute bottom-4 right-4 flex gap-2">
                    <label 
                      className="bg-white/90 hover:bg-white text-primary-green px-3 py-1.5 rounded-md text-sm font-medium cursor-pointer transition-colors shadow-md"
                      htmlFor="spot-image-upload"
                    >
                      {isUploading ? 'Uploading...' : 'Change Image'}
                    </label>
                    {selectedSpot.image && (
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        disabled={isUploading}
                        className="bg-red-500/90 hover:bg-red-600 text-white px-3 py-1.5 rounded-md text-sm font-medium disabled:opacity-50 transition-colors shadow-md"
                      >
                        Remove
                      </button>
                    )}
                    <input
                      id="spot-image-upload"
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                      disabled={isUploading}
                    />
                  </div>
                )}
              </div>
              <div className="bg-light-green rounded-lg p-6">
                <div className="flex justify-between items-start">
                  {isEditing ? (
                    <input
                      type="text"
                      name="name"
                      value={editedSpot.name}
                      onChange={handleInputChange}
                      className="text-3xl font-bold text-primary-green bg-egg-white border border-border-green rounded px-3 py-1 w-full"
                    />
                  ) : (
                    <h1 className="text-3xl font-bold text-primary-green">{selectedSpot.name}</h1>
                  )}
                  
                  {isBarangayAdmin && barangayAdminData?.barangay === selectedSpot.barangay && isEditing && (
                    <div className="flex gap-2">
                      <button
                        onClick={handleSave}
                        className="bg-primary-green text-egg-white px-3 py-1 rounded text-sm font-medium hover:bg-opacity-90 transition-colors"
                      >
                        Save
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="bg-gray-300 text-primary-green px-3 py-1 rounded text-sm font-medium hover:bg-opacity-90 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
                <div className="space-y-4">
                  {/* Category */}
                  <div>
                    <h3 className="font-semibold text-primary-green mb-1">Category</h3>
                    {isEditing ? (
                      <select
                        name="category"
                        value={editedSpot.category}
                        onChange={handleInputChange}
                        className="w-full p-2 border border-border-green rounded text-primary-green"
                      >
                        <option value="Agricultural Heritage">Agricultural Heritage</option>
                        <option value="Natural Attractions">Natural Attractions</option>
                        <option value="Waterfalls">Waterfalls</option>
                        <option value="Caves">Caves</option>
                        <option value="Mountains & Hiking">Mountains & Hiking</option>
                        <option value="Cultural Heritage">Cultural Heritage</option>
                        <option value="Viewing Areas">Viewing Areas</option>
                        <option value="Gardens & Farms">Gardens & Farms</option>
                        <option value="Adventure & Recreation">Adventure & Recreation</option>
                        <option value="Infrastructure">Infrastructure</option>
                      </select>
                    ) : (
                      <span className="bg-accent-green text-egg-white px-3 py-1 rounded-full text-sm font-medium">
                        {selectedSpot.category}
                      </span>
                    )}
                  </div>

                  {/* Location */}
                  <div>
                    <h3 className="font-semibold text-primary-green mb-1">Location</h3>
                    {isEditing ? (
                      <input
                        type="text"
                        name="location"
                        value={editedSpot.location}
                        onChange={handleInputChange}
                        className="w-full p-2 border border-border-green rounded text-primary-green"
                      />
                    ) : (
                      <p className="text-primary-green/70">{selectedSpot.location}</p>
                    )}
                  </div>

                  {/* Barangay - Not editable */}
                  <div>
                    <h3 className="font-semibold text-primary-green mb-1">Barangay</h3>
                    <p className="text-primary-green/70">{selectedSpot.barangay}</p>
                  </div>

                  {/* Contact */}
                  <div>
                    <h3 className="font-semibold text-primary-green mb-1">Contact</h3>
                    {isEditing ? (
                      <input
                        type="text"
                        name="contact"
                        value={editedSpot.contact || ''}
                        onChange={handleInputChange}
                        placeholder="Contact information"
                        className="w-full p-2 border border-border-green rounded text-primary-green"
                      />
                    ) : selectedSpot.contact ? (
                      <p className="text-primary-green/70">{selectedSpot.contact}</p>
                    ) : (
                      <p className="text-primary-green/70 italic">No contact information available</p>
                    )}
                  </div>

                  {/* Entrance Fees Section Moved Here */}
                  <div className="mt-4">
                    <h3 className="font-semibold text-primary-green mb-2">Entrance Fees</h3>
                    {isEditing ? (
                      <div className="space-y-3">
                        {['adults', 'seniors', 'pwd', 'kids', 'children', 'environmental', 'tourGuide'].map((feeType) => (
                          <div key={feeType} className="grid grid-cols-1 md:grid-cols-3 gap-2 items-center">
                            <label className="text-primary-green font-medium">
                              {feeType.charAt(0).toUpperCase() + feeType.slice(1)}:
                            </label>
                            <input
                              type="number"
                              name={`entranceFees.${feeType}.amount`}
                              value={{
                                'adults': editedSpot.entranceFees?.adults.amount,
                                'seniors': editedSpot.entranceFees?.seniors.amount,
                                'pwd': editedSpot.entranceFees?.pwd.amount,
                                'kids': editedSpot.entranceFees?.kids.amount,
                                'children': editedSpot.entranceFees?.children.amount,
                                'environmental': editedSpot.entranceFees?.environmental.amount,
                                'tourGuide': editedSpot.entranceFees?.tourGuide?.amount
                              }[feeType] || ''}
                              placeholder="0"
                              onChange={handleInputChange}
                              min="0"
                              className="p-2 border border-border-green rounded text-primary-green w-full"
                            />
                            <input
                              type="text"
                              name={`entranceFees.${feeType}.label`}
                              value={{
                                'adults': editedSpot.entranceFees?.adults.label || 'Adults (18–59 years)',
                                'seniors': editedSpot.entranceFees?.seniors.label || 'Seniors (60+ years)',
                                'pwd': editedSpot.entranceFees?.pwd.label || 'Persons with Disability (PWD)',
                                'kids': editedSpot.entranceFees?.kids.label || 'Kids (11–17 years)',
                                'children': editedSpot.entranceFees?.children.label || 'Children (below 6 years)',
                                'environmental': editedSpot.entranceFees?.environmental.label || 'Environmental Fee',
                                'tourGuide': editedSpot.entranceFees?.tourGuide?.label || 'Tour Guide Fee (optional)'
                              }[feeType]}
                              onChange={handleInputChange}
                              className="p-2 border border-border-green rounded text-primary-green w-full"
                            />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {selectedSpot.entranceFees ? (
                          Object.entries(selectedSpot.entranceFees).map(([feeType, fee]) => (
                            fee && (
                              <div key={feeType} className="flex justify-between">
                                <span className="text-primary-green/70">{fee.label || feeType}:</span>
                                <span className="font-medium">
                                  {fee.amount > 0 ? `₱${fee.amount.toFixed(2)}` : 'Free'}
                                </span>
                              </div>
                            )
                          ))
                        ) : (
                          <p className="text-primary-green/70 italic">No entrance fee information available</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Description and Map */}
            <div className="space-y-6">
              {/* Description */}
              <div className="bg-egg-white border border-border-green rounded-lg p-6 shadow-md">
                <h2 className="text-2xl font-semibold text-primary-green mb-4">Description</h2>
                {isEditing ? (
                  <textarea
                    name="detailedDescription"
                    value={editedSpot.detailedDescription || editedSpot.description}
                    onChange={handleInputChange}
                    rows={8}
                    className="w-full p-3 border border-border-green rounded text-primary-green/70 leading-relaxed"
                  />
                ) : (
                  <p className="text-primary-green/70 leading-relaxed">
                    {selectedSpot.detailedDescription || selectedSpot.description}
                  </p>
                )}
              </div>

              {/* Google Maps Link */}
              <div className="bg-egg-white border border-border-green rounded-lg p-6 shadow-md">
                <h2 className="text-2xl font-semibold text-primary-green mb-4">Google Maps Link</h2>
                {isEditing ? (
                  <input
                    type="url"
                    name="googleMapsLink"
                    value={editedSpot.googleMapsLink || ''}
                    onChange={handleInputChange}
                    placeholder="https://maps.google.com/..."
                    className="w-full p-2 border border-border-green rounded text-primary-green"
                  />
                ) : selectedSpot.googleMapsLink ? (
                  <a
                    href={selectedSpot.googleMapsLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent-green hover:underline inline-flex items-center gap-1"
                  >
                    <span>View on Google Maps</span>
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                    </svg>
                    Open in Google Maps
                  </a>
                ) : (
                  <p className="text-primary-green/70 italic">No Google Maps link available</p>
                )}
              </div>
              
              {/* Google Maps Embed */}
              {selectedSpot.googleMapsLink && !isEditing && (
                <div className="bg-egg-white border border-border-green rounded-lg p-6 shadow-md">
                  <h2 className="text-2xl font-semibold text-primary-green mb-4">Location Map</h2>
                  <div className="relative w-full h-96 rounded-lg overflow-hidden">
                    <iframe
                      src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d122344.74121741697!2d120.51233228135519!3d16.613054265539382!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3391beeacea4804b%3A0x70049a733cf9916b!2sKapangan%2C%20Benguet!5e0!3m2!1sen!2sph!4v1758168375066!5m2!1sen!2sph"
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      title="Map of Kapangan, Benguet"
                    ></iframe>
                  </div>
                  <div className="mt-4">
                    <a
                      href={selectedSpot.googleMapsLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-accent-green hover:text-primary-green font-medium transition-colors duration-300"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                      Open in Google Maps
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-egg-white">
      {/* Simple Hero Section */}
      <div className="bg-primary-green text-egg-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold">Tourist Spots</h1>
          <p className="mt-4 text-xl text-egg-white/90 max-w-3xl mx-auto">
            Explore the beautiful attractions and hidden gems of Kapangan
          </p>
        </div>
      </div>

      {/* Alert Message */}
      {alertState && (
        <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 ${alertState.variant === 'destructive' ? 'bg-red-100' : 'bg-green-100'} rounded-md mb-4`}>
          <div className="flex items-center justify-between">
            <p className={`text-sm ${alertState.variant === 'destructive' ? 'text-red-800' : 'text-green-800'}`}>
              {alertState.message}
            </p>
            <button
              onClick={() => setAlertState(null)}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {/* Filter Navigation */}
        <div className="mb-8">
          <div className="bg-light-green rounded-lg p-6 shadow-md">
            <h2 className="text-2xl font-semibold text-primary-green mb-4">Barangay</h2>
            <div className="flex flex-wrap gap-2">
              {barangays.map((barangay) => (
                <button
                  key={barangay}
                  onClick={() => setSelectedBarangay(barangay)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                    selectedBarangay === barangay
                      ? 'bg-primary-green text-egg-white shadow-md scale-105'
                      : 'bg-egg-white text-primary-green border border-border-green hover:bg-accent-green hover:text-egg-white hover:scale-105'
                  }`}
                >
                  {barangay === 'all' ? 'All Barangays' : barangay}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results Summary */}
        <div className="mb-8 text-center">
          <p className="text-lg text-primary-green/80">
            Showing {filteredSpots.length} tourist spot{filteredSpots.length !== 1 ? 's' : ''}
            {selectedBarangay !== 'all' && ` in ${selectedBarangay}`}
          </p>
        </div>

        {/* Tourist Spots by Barangay */}
        {Object.keys(groupedSpots).length > 0 ? (
          <div className="space-y-12">
            {Object.entries(groupedSpots).map(([barangay, spots]) => (
              <div key={barangay} id={`barangay-${barangay}`} className="scroll-mt-20">
                <div className="mb-6">
                  <h2 className="text-3xl font-bold text-primary-green mb-2">
                    {barangay}
                  </h2>
                  <div className="h-1 w-20 bg-accent-green rounded-full"></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {spots.map((spot) => (
                    <div key={spot.id} className={`bg-egg-white rounded-lg shadow-lg overflow-hidden transition-all duration-300 border ${spot.closed ? 'border-red-300' : 'border-border-green hover:shadow-xl hover:scale-105 group'}`}>
                      <div className="relative h-48 w-full">
                        {spot.image ? (
                          <>
                            <Image
                              src={spot.image}
                              alt={spot.name}
                              fill
                              className={`object-cover transition-transform duration-300 ${spot.closed ? 'opacity-50' : 'group-hover:scale-110'}`}
                              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                              unoptimized={spot.image.includes('appwrite.io')}
                            />
                            {spot.closed && (
                              <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                                <div className="bg-red-500/90 text-white px-3 py-1 rounded-full text-sm font-medium">
                                  Temporarily Closed
                                </div>
                              </div>
                            )}
                          </>
                        ) : (
                          <div className={`w-full h-full bg-gray-100 flex items-center justify-center ${spot.closed ? 'opacity-50' : ''}`}>
                            <span className={spot.closed ? 'text-gray-500' : 'text-gray-400'}>No image</span>
                          </div>
                        )}
                        <div className={`absolute top-2 right-2 ${spot.closed ? 'bg-red-500/90' : 'bg-accent-green/90'} text-egg-white px-2 py-1 rounded-full text-xs font-medium backdrop-blur-sm`}>
                          {spot.closed ? 'Closed' : spot.category}
                        </div>
                      </div>
                      <div className="p-6">
                        <h3 className="text-xl font-semibold text-primary-green mb-2 group-hover:text-accent-green transition-colors duration-300">
                          {spot.name}
                        </h3>
                        <p className={`text-sm ${spot.closed ? 'text-red-500' : 'text-accent-green'} font-medium mb-4`}>
                          {spot.location}
                          {spot.closed && spot.closedUntil && (
                            <span className="block text-xs mt-1">Closed until: {new Date(spot.closedUntil).toLocaleDateString()}</span>
                          )}
                        </p>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (spot.closed) {
                              toast.error('This spot is temporarily closed' + (spot.closedReason ? `: ${spot.closedReason}` : ''));
                            } else {
                              openDetails(spot);
                            }
                          }}
                          disabled={spot.closed}
                          className={`w-full ${spot.closed ? 'bg-gray-400 cursor-not-allowed' : 'bg-primary-green hover:bg-accent-green hover:scale-105 hover:shadow-lg'} text-egg-white px-4 py-2 rounded-lg font-medium transition-all duration-300 shadow-md`}
                        >
                          {spot.closed ? 'Temporarily Unavailable' : 'View More'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-2xl font-semibold text-primary-green mb-2">No Results Found</h3>
            <p className="text-primary-green/70 mb-6">
              Try selecting a different barangay to see more tourist spots.
            </p>
            <button
              onClick={() => setSelectedBarangay('all')}
              className="bg-primary-green hover:bg-accent-green text-egg-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 hover:scale-105"
            >
              Clear Filter
            </button>
          </div>
        )}

        <div className="text-center mt-12">
          <p className="text-primary-green/80 mb-4">
            Explore these amazing tourist destinations in Kapangan, Benguet. Each location offers unique experiences and breathtaking natural beauty.
          </p>
          <button className="bg-primary-green hover:bg-accent-green text-egg-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl">
            Plan Your Visit
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-primary-green text-egg-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-2xl font-bold text-light-green mb-4">Kapangan Wonder</h3>
              <p className="text-light-green/80">
                Discover the natural beauty and cultural richness of Kapangan, Benguet.
              </p>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <li><Link href="/tourist-spots" className="text-light-green/80 hover:text-egg-white">Tourist Spots</Link></li>
                <li><Link href="/eat-and-stay" className="text-light-green/80 hover:text-egg-white">Eat & Stay</Link></li>
                <li><Link href="/blogs" className="text-light-green/80 hover:text-egg-white">Blogs</Link></li>
                <li><Link href="/contact" className="text-light-green/80 hover:text-egg-white">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Support</h4>
              <ul className="space-y-2">
                <li><Link href="/contact" className="text-light-green/80 hover:text-egg-white">Help Center</Link></li>
                <li><Link href="/contact" className="text-light-green/80 hover:text-egg-white">Contact Us</Link></li>
                <li><Link href="/signin" className="text-light-green/80 hover:text-egg-white">Sign In</Link></li>
                <li><Link href="/signup" className="text-light-green/80 hover:text-egg-white">Sign Up</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Follow Us</h4>
              <div className="flex space-x-4">
                <a href="#" className="text-light-green/80 hover:text-egg-white text-2xl">📘</a>
                <a href="#" className="text-light-green/80 hover:text-egg-white text-2xl">🐦</a>
                <a href="#" className="text-light-green/80 hover:text-egg-white text-2xl">📷</a>
                <a href="#" className="text-light-green/80 hover:text-egg-white text-2xl">📺</a>
              </div>
            </div>
          </div>
          <div className="border-t border-border-green mt-8 pt-8 text-center text-light-green/80">
            <p>&copy; 2024 Kapangan Wonder. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
// This function is already defined as a state setter in the component
// and doesn't need to be redefined here

