'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect, useRef, ChangeEvent, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { doc, updateDoc, setDoc, getFirestore, collection, getDocs, query, where, getDoc, initializeFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { toast } from 'react-hot-toast';
import { uploadFile, deleteFile } from '@/lib/appwrite';
import useEmblaCarousel from 'embla-carousel-react';
import { Share2, Check } from 'lucide-react';

interface Announcement {
  id: string;
  title: string;
  content: string;
  category: string;
  touristSpotId?: string;
  touristSpotName?: string;
  privateSpotName?: string;
  expiryDate?: string;
  createdAt: any;
  businessId?: string;
  businessName?: string;
  closedAt?: any;
  closureAnnouncementId?: string;
}

interface AlertState {
  variant: 'default' | 'destructive' | 'success';
  message: string;
}

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
  tourGuide?: FeeItem; // Optional
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
  closedAt?: any;
  businessId?: string;
  businessName?: string;
  closureAnnouncementId?: string;
  createdAt?: any;
  updatedAt?: any;
  _tempImage?: File; // Temporary file object for upload preview
}

interface CarouselItem {
  id: string;
  image: string;
  fileId?: string;
}

export default function TouristSpots() {
  const router = useRouter();
  const { isBarangayAdmin, barangayAdminData, currentUser, isPrivateSpotAdmin, privateSpotAdminData, isAdmin } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBarangay, setSelectedBarangay] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [carouselItems, setCarouselItems] = useState<CarouselItem[]>([]);
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: "start",
    duration: 20, // Slower scroll duration for better visibility
  });

  // Auto-scroll functionality
  useEffect(() => {
    if (!emblaApi) return;
    
    const autoScroll = setInterval(() => {
      if (emblaApi.canScrollNext()) {
        emblaApi.scrollNext();
      } else {
        emblaApi.scrollTo(0); // Reset to first slide if at the end
      }
    }, 5000); // Change slide every 5 seconds
    
    return () => clearInterval(autoScroll);
  }, [emblaApi]);
  const [isMounted, setIsMounted] = useState(false);
  const [closureAnnouncements, setClosureAnnouncements] = useState<Announcement[]>([]);
  
  // Debug user state changes
  useEffect(() => {
    console.log('User state changed:', { 
      currentUser: currentUser ? { uid: currentUser.uid, email: currentUser.email } : 'No user',
      isBarangayAdmin,
      isPrivateSpotAdmin,
      isAdmin
    });
  }, [currentUser, isBarangayAdmin, isPrivateSpotAdmin, isAdmin]);
  
  // Add a mounted state to prevent hydration issues
  useEffect(() => {
    console.log('Component mounted');
    setIsMounted(true);
    
    // Reinitialize carousel when component mounts
    if (emblaApi) {
      emblaApi.reInit();
    }
    
    return () => {
      console.log('Component unmounted');
      setIsMounted(false);
    };
  }, [emblaApi]);
  const [selectedSpot, setSelectedSpot] = useState<TouristSpot | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedSpot, setEditedSpot] = useState<TouristSpot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [cameFromAdmin, setCameFromAdmin] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check URL parameters and set initial states
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      setCameFromAdmin(params.get('fromAdmin') === 'true');
      
      // Set selectedBarangay from URL if it exists, otherwise default to 'all'
      const barangayParam = params.get('barangay');
      if (barangayParam && barangays.includes(barangayParam)) {
        setSelectedBarangay(barangayParam);
      } else {
        setSelectedBarangay('all');
      }
    }
  }, []);

  const handleRemoveImage = () => {
    if (!editedSpot) return;
    
    setEditedSpot({
      ...editedSpot,
      image: '',
      _tempImage: undefined
    });
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSave = async () => {
    if (!editedSpot) return;
    
    try {
      setLoading(true);
      const db = getFirestore();
      const spotRef = doc(db, 'touristSpots', editedSpot.id);
      
      // Create update data object with validation
      const updateData: Partial<TouristSpot> = {
        name: editedSpot.name || '',
        description: editedSpot.description || '',
        location: editedSpot.location || '',
        barangay: editedSpot.barangay || '',
        category: editedSpot.category || 'Other',
        contact: editedSpot.contact || '',
        googleMapsLink: editedSpot.googleMapsLink || '',
        detailedDescription: editedSpot.detailedDescription || editedSpot.description || '',
        updatedAt: new Date().toISOString()
      };

      // Handle image upload if there's a new image
      if (editedSpot._tempImage) {
        try {
          // Show loading toast for image upload
          const uploadToast = toast.loading('Uploading image...');
          const fileData = await uploadFile(editedSpot._tempImage, `tourist-spots/${editedSpot.id}`);
          updateData.image = fileData.url;
          toast.dismiss(uploadToast);
          toast.success('Image uploaded successfully');
        } catch (error) {
          console.error('Error uploading image:', error);
          toast.dismiss();
          toast.error('Failed to upload image. Please try again.');
          setLoading(false);
          return;
        }
      }

      // Show saving toast
      const saveToast = toast.loading('Saving changes...');
      
      // Update the document in Firestore
      await updateDoc(spotRef, updateData);
      
      // Update the local state
      const updatedSpot = { ...editedSpot, ...updateData };
      setSelectedSpot(updatedSpot);
      setEditedSpot(updatedSpot);
      
      // Update the spots array
      setSpots(prevSpots => 
        prevSpots.map(spot => 
          spot.id === updatedSpot.id ? updatedSpot : spot
        )
      );
      
      // Show success message and dismiss loading toast
      toast.dismiss(saveToast);
      toast.success('Tourist spot updated successfully!', {
        duration: 3000,
        position: 'top-center',
      });
      
      // Exit edit mode after a short delay
      setTimeout(() => {
        setIsEditing(false);
      }, 500);
      
    } catch (error) {
      console.error('Error updating tourist spot:', error);
      toast.dismiss();
      toast.error('Failed to update tourist spot. Please try again.', {
        duration: 4000,
        position: 'top-center',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedSpot(null);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    if (!file) return;

    // Check if file is an image
    if (!file.type.startsWith('image/')) {
      setAlertState({
        variant: 'destructive',
        message: 'Please upload an image file.'
      });
      return;
    }

    // Check file size (e.g., 5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      setAlertState({
        variant: 'destructive',
        message: 'Image size should be less than 5MB.'
      });
      return;
    }

    // Create a temporary URL for the image preview
    const imageUrl = URL.createObjectURL(file);
    
    // Update the editedSpot with the new image file and URL
    if (editedSpot) {
      setEditedSpot({
        ...editedSpot,
        image: imageUrl,
        _tempImage: file
      });
    }
  };

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
  const fetchClosureAnnouncements = async (): Promise<Announcement[]> => {
    try {
      const db = getFirestore();
      const now = new Date().toISOString();
      
      // Default closure categories as fallback
      let closureCategories = [
        'Closure - Maintenance',
        'Closure - Weather Conditions',
        'Closure - Road Access',
        'Closure - Other'
      ];

      // Try to fetch categories from API with error handling
      try {
        const categoriesResponse = await fetch('/api/announcements/categories');
        if (categoriesResponse.ok) {
          const contentType = categoriesResponse.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const categories = await categoriesResponse.json();
            if (Array.isArray(categories)) {
              const dynamicClosureCats = categories.filter((cat: string) => 
                cat && typeof cat === 'string' && cat.toLowerCase().includes('closure')
              );
              if (dynamicClosureCats.length > 0) {
                closureCategories = dynamicClosureCats;
              }
            }
          }
        }
      } catch (error) {
        console.warn('Failed to fetch announcement categories, using defaults:', error);
      }
      
      console.log('Using closure categories:', closureCategories);
      
      try {
        // Fetch all announcements that are in any closure category
        // Using a try-catch block to handle potential permission errors
        let querySnapshot;
        try {
          const q = query(
            collection(db, 'announcements'),
            where('category', 'in', closureCategories)
          );
          querySnapshot = await getDocs(q);
        } catch (queryError) {
          console.error('Error querying announcements:', queryError);
          // If there's a permission error, try with a more permissive query
          try {
            // Try with a simpler query that only checks for one category
            const q = query(
              collection(db, 'announcements'),
              where('category', '==', 'Closure - Maintenance')
            );
            querySnapshot = await getDocs(q);
          } catch (fallbackError) {
            console.error('Fallback query failed:', fallbackError);
            return [];
          }
        }
        
        if (!querySnapshot) return [];
        
        // Process announcements
        const announcements = querySnapshot.docs
          .map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              title: data.title || 'Announcement',
              content: data.content || 'This spot is temporarily closed.',
              category: data.category || 'Closure - Maintenance',
              touristSpotId: data.touristSpotId || data.spotId || '',
              touristSpotName: data.touristSpotName || data.spotName || 'Unknown Spot',
              privateSpotName: data.privateSpotName || '',
              businessId: data.businessId || '',
              businessName: data.businessName || '',
              expiryDate: data.expiryDate || data.endDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // Default to 7 days from now
              createdAt: data.createdAt || new Date().toISOString(),
              closedAt: data.closedAt || new Date().toISOString()
            } as Announcement;
          })
          .filter(announcement => {
            // Check if announcement is not expired
            const isNotExpired = !announcement.expiryDate || 
              new Date(announcement.expiryDate) >= new Date(now);
              
            if (!isNotExpired) {
              console.log(`Skipping expired announcement: ${announcement.id}`);
            }
            
            return isNotExpired;
          });
        
        console.log('Fetched announcements:', announcements);
        return announcements;
      } catch (firestoreError) {
        console.error('Error in fetchClosureAnnouncements:', firestoreError);
        // Return a default closure announcement if there's an error
        return [{
          id: 'default-closure',
          title: 'Temporary Closure',
          content: 'This spot is temporarily closed. Please check back later.',
          category: 'Closure - Maintenance',
          touristSpotId: '',
          touristSpotName: '',
          privateSpotName: '',
          businessId: '',
          businessName: '',
          expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          createdAt: new Date().toISOString(),
          closedAt: new Date().toISOString()
        }];
      }
    } catch (error) {
      console.error('Unexpected error in fetchClosureAnnouncements:', error);
      // Return an empty array to prevent breaking the UI
      return [];
    }
  };

  // Process spots and update with closure status
  const processSpotsWithClosures = (spots: TouristSpot[], announcements: Announcement[]) => {
    console.log('Processing spots with closures...');
    console.log('Announcements:', announcements);
    
    const spotMap = new Map<string, Announcement>();
    const businessClosureMap = new Map<string, Announcement>();
    const now = new Date().toISOString();
    
    // Process announcements
    announcements.forEach(announcement => {
      console.log('Processing announcement:', announcement);
      
      // Handle spot-based closures
      if (announcement.touristSpotId && announcement.touristSpotId !== 'default') {
        const announcementSpotId = announcement.touristSpotId;
        console.log(`Found spot-based closure announcement for ${announcementSpotId}`);
        
        // Store under multiple possible keys to handle different ID formats
        const keys = new Set<string>([
          announcementSpotId.toString(),
          announcementSpotId.toString().toLowerCase(),
          announcementSpotId.toString().trim()
        ]);
        
        // If the ID can be parsed as a number, also store it as a number
        const numericId = parseInt(announcementSpotId);
        if (!isNaN(numericId)) {
          keys.add(numericId.toString());
        }
        
        // Store the announcement under all possible keys
        keys.forEach(key => {
          const existingAnnouncement = spotMap.get(key);
          const existingDate = existingAnnouncement?.createdAt?.toDate?.() || 0;
          const newDate = announcement.createdAt?.toDate?.() || 0;
          
          if (!existingAnnouncement || newDate > existingDate) {
            console.log(`Storing spot announcement under key: ${key}`);
            spotMap.set(key, announcement);
          }
        });
      } 
      // Handle business-based closures (for private spots)
      if (announcement.businessId) {
        console.log(`Found business-based closure announcement for business ${announcement.businessId}`);
        const businessKey = announcement.businessId;
        const existingAnnouncement = businessClosureMap.get(businessKey);
        const existingDate = existingAnnouncement?.createdAt?.toDate?.() || 0;
        const newDate = announcement.createdAt?.toDate?.() || 0;
        
        if (!existingAnnouncement || newDate > existingDate) {
          console.log(`Storing business announcement for business ID: ${businessKey}`);
          businessClosureMap.set(businessKey, announcement);
        }
      }
    });
    
    console.log('Spot map:', Array.from(spotMap.entries()));
    console.log('Business closure map:', Array.from(businessClosureMap.entries()));
    
    // Update spots with closure information
    return spots.map(spot => {
      // Check for direct spot-based closure
      const possibleIds = [
        spot.id,
        spot.numericId?.toString(),
        spot.id?.toString(),
        spot.id?.toString().toLowerCase()
      ].filter(Boolean) as string[];
      
      const spotClosureAnnouncement = possibleIds
        .map(id => spotMap.get(id))
        .find(Boolean);
      
      // Check for business-based closure
      const businessClosureAnnouncement = spot.businessId 
        ? businessClosureMap.get(spot.businessId)
        : null;
      
      // Use the most recent closure announcement (spot-based takes precedence over business-based)
      const closureAnnouncement = spotClosureAnnouncement || businessClosureAnnouncement;
      
      if (closureAnnouncement) {
        const closedSpot = {
          ...spot,
          closed: true,
          closedReason: closureAnnouncement.content || 'This spot is temporarily closed',
          closedUntil: closureAnnouncement.expiryDate,
          businessId: spot.businessId || closureAnnouncement.businessId,
          businessName: spot.businessName || closureAnnouncement.businessName || closureAnnouncement.privateSpotName,
          closedAt: spot.closedAt || closureAnnouncement.closedAt || now,
          closureAnnouncementId: spot.closureAnnouncementId || closureAnnouncement.id,
          status: spot.status === 'active' ? 'inactive' : spot.status
        };
        
        console.log(`Marked spot as closed:`, {
          spotId: spot.id,
          spotName: spot.name,
          businessId: closedSpot.businessId,
          businessName: closedSpot.businessName,
          reason: closedSpot.closedReason,
          closedUntil: closedSpot.closedUntil
        });
        
        return closedSpot;
      }
      
      // If no closure announcement exists, ensure the spot is marked as open
      // but preserve any other status if it was set manually
      if (spot.closed) {
        console.log(`Marking spot ${spot.id} as open (no active closure announcements)`);
        return {
          ...spot,
          closed: false,
          // Only update status to 'active' if it was previously 'inactive' due to a closure
          status: spot.status === 'inactive' && spot.closureAnnouncementId ? 'active' : spot.status,
          closureAnnouncementId: undefined
        };
      }
      
      return spot;
    });
  };

  // Fetch all tourist spots
  useEffect(() => {
    const fetchSpots = async () => {
      try {
        setLoading(true);
        const db = getFirestore();
        
        console.log('Fetching spots...');
        
        try {
          // Fetch spots first
          const spotsSnapshot = await getDocs(collection(db, 'touristSpots'));
          
          // Then try to fetch announcements
          let announcements: Announcement[] = [];
          try {
            announcements = await fetchClosureAnnouncements();
            console.log('Fetched closure announcements:', announcements);
          } catch (announcementError) {
            console.warn('Could not load closure announcements, continuing without them', announcementError);
          }
          
          console.log('Raw spots from Firestore:', spotsSnapshot.docs.map(doc => doc.data()));
          
          const spotsData = spotsSnapshot.docs.map(doc => {
            const data = doc.data();
            const docId = doc.id;
            const numericId = data.id || (!isNaN(Number(docId)) ? Number(docId) : docId);
            
            console.log(`Spot ID: ${docId}, Type: ${typeof docId}, Numeric ID: ${numericId} (${typeof numericId})`);
            
            return {
              ...data,
              id: docId,  // Keep original ID as string
              numericId,  // Add numeric ID for flexible matching
            } as TouristSpot;
          });
          
          console.log('Fetched spots:', spotsData);
          
          // Process spots with any announcements we could fetch
          const processedSpots = processSpotsWithClosures(spotsData, announcements);
          
          console.log('Processed spots with closures:', processedSpots);
          setSpots(processedSpots);
          setError(null);
        } catch (firestoreError) {
          console.error('Error fetching spots from Firestore:', firestoreError);
          setError('Failed to load tourist spots. Please try again later.');
        }
      } catch (err) {
        console.error('Unexpected error in fetchSpots:', err);
        setError('An unexpected error occurred. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchSpots();
  }, [isBarangayAdmin, barangayAdminData?.barangay]);

  // Initialize Firestore
  const db = getFirestore();

  // Load carousel items
  useEffect(() => {
    const loadCarouselItems = async () => {
      try {
        const docRef = doc(db, "carousel", "items");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && docSnap.data().items) {
          setCarouselItems(docSnap.data().items);
        }
      } catch (error) {
        console.error("Error loading carousel items:", error);
      }
    };
    loadCarouselItems();
  }, []);

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

  // Handle barangay selection and update URL
  const handleBarangaySelect = (barangay: string) => {
    setSelectedBarangay(barangay);
    // Update URL without page reload
    const url = new URL(window.location.href);
    if (barangay === 'all') {
      url.searchParams.delete('barangay');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      url.searchParams.set('barangay', barangay);
      const element = document.getElementById(`barangay-${barangay}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
    window.history.pushState({}, '', url.toString());
  };

  // Handle input changes for the form
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    if (!editedSpot) return;
    
    const { name, value } = e.target;
    
    // Create a deep copy of the edited spot with default entranceFees if not present
    const updatedSpot: TouristSpot = { 
      ...editedSpot,
      entranceFees: editedSpot.entranceFees ? { ...editedSpot.entranceFees } : {
        adults: { label: 'Adults (18–59 years)', amount: 0 },
        seniors: { label: 'Seniors (60+ years)', amount: 0 },
        pwd: { label: 'Persons with Disability (PWD)', amount: 0 },
        kids: { label: 'Kids (11–17 years)', amount: 0 },
        children: { label: 'Children (below 6 years)', amount: 0 },
        environmental: { label: 'Environmental Fee', amount: 0 },
        tourGuide: { label: 'Tour Guide Fee (optional)', amount: 0 }
      }
    };
    
    // Handle entrance fees fields
    if (name.startsWith('entranceFees.')) {
      const [_, feeType, field] = name.split('.');
      
      // Ensure entranceFees is properly typed
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
      
      const feeKey = feeType as keyof EntranceFees;
      const currentFee = updatedSpot.entranceFees[feeKey] || { label: '', amount: 0 };
      
      if (field === 'amount') {
        const amountValue = value === '' ? 0 : parseFloat(value);
        updatedSpot.entranceFees = {
          ...updatedSpot.entranceFees,
          [feeKey]: {
            ...currentFee,
            amount: isNaN(amountValue) ? 0 : amountValue
          }
        };
      } else {
        updatedSpot.entranceFees = {
          ...updatedSpot.entranceFees,
          [feeKey]: {
            ...currentFee,
            [field]: value
          }
        };
      }
    } else {
      // Handle regular fields
      (updatedSpot as any)[name] = value;
    }
    
    setEditedSpot(updatedSpot);
  };

  const closeDetails = () => {
    if (isEditing) {
      // If in edit mode, go back to the appropriate dashboard
      if (isAdmin) {
        router.push('/admin');
      } else if (isPrivateSpotAdmin) {
        router.push('/private-spot-admin');
      } else if (isBarangayAdmin) {
        router.push('/barangay-admin');
      } else {
        router.push('/tourist-spots');
      }
    } else if (cameFromAdmin) {
      // If came from admin, go back to admin
      router.push('/admin');
    } else {
      // Otherwise, just close the details view and stay on the same page
      setSelectedSpot(null);
      setShowDetails(false);
    }
  };

  const handleShareSpot = async () => {
    if (!selectedSpot) return;
    
    try {
      const spotUrl = `${window.location.origin}/tourist-spots?id=${selectedSpot.id}`;
      await navigator.clipboard.writeText(spotUrl);
      
      setLinkCopied(true);
      toast.success('Link copied to clipboard!');
      
      // Reset the copied state after 2 seconds
      setTimeout(() => {
        setLinkCopied(false);
      }, 2000);
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      toast.error('Failed to copy link');
    }
  };

  // If showing details, render the detail page
    if (showDetails && selectedSpot && editedSpot) {
    return (
      <div className="min-h-screen bg-black/70 backdrop-blur-sm modal-black" style={{ color: '#000' }}>
        <style>{`.modal-black, .modal-black * { color: #000 !important; }`}</style>
        {/* Header with back button */}
        <div className="bg-white/50 backdrop-blur-sm border-b border-white/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
            <button
              onClick={closeDetails}
              className="flex items-center gap-2 text-white hover:text-accent-yellow font-medium transition-colors duration-300 font-poppins"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
              {isEditing 
                ? 'Back to Dashboard' 
                : cameFromAdmin 
                  ? 'Back to Admin Dashboard' 
                  : 'Back to Tourist Spots'}
            </button>
            {!isEditing && (
              <button
                onClick={handleShareSpot}
                className={`p-2 rounded-full transition-all duration-300 flex items-center gap-2 ${
                  linkCopied
                    ? 'bg-green-500/20 text-green-400'
                    : 'hover:bg-white/10 text-white/70 hover:text-white'
                }`}
                title="Copy link to clipboard"
              >
                {linkCopied ? (
                  <>
                    <Check className="w-5 h-5" />
                    <span className="text-xs sm:text-sm font-medium">Copied!</span>
                  </>
                ) : (
                  <Share2 className="w-5 h-5" />
                )}
              </button>
            )}
          </div>
        </div>

        {/* Detail Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-white">
          {/* Inline Back button (also navigates depending on edit/admin state) */}
          <div className="flex justify-end mb-4">
            <button
              onClick={closeDetails}
              className="text-sm text-white/90 bg-transparent hover:underline"
            >
              Back
            </button>
          </div>
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
                        className="object-fill"
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
                        className="object-fill"
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
                    <div className="w-full">
                      <input
                        type="text"
                        name="name"
                        value={isPrivateSpotAdmin ? (privateSpotAdminData?.privateSpotName || editedSpot.name) : editedSpot.name}
                        onChange={handleInputChange}
                        className={`text-3xl font-bold text-primary-green bg-egg-white border border-border-green rounded px-3 py-1 w-full ${
                          isPrivateSpotAdmin ? 'bg-gray-100 cursor-not-allowed' : ''
                        }`}
                        readOnly={isPrivateSpotAdmin}
                      />
                      {isPrivateSpotAdmin && (
                        <p className="text-xs text-gray-500 mt-1">
                          The name is set to your private spot name and cannot be changed
                        </p>
                      )}
                    </div>
                  ) : (
                    <h1 className="text-3xl font-bold text-primary-green">{selectedSpot.name}</h1>
                  )}
                  
                  {(isBarangayAdmin && barangayAdminData?.barangay === selectedSpot.barangay || isPrivateSpotAdmin) && isEditing && (
                    <div className="flex gap-2">
                      <button
                        onClick={handleSave}
                        disabled={loading}
                        className={`flex items-center gap-2 bg-primary-green text-egg-white px-4 py-1.5 rounded text-sm font-medium hover:bg-opacity-90 transition-colors ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                      >
                        {loading ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Saving...
                          </>
                        ) : (
                          'Save Changes'
                        )}
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        disabled={loading}
                        className="bg-gray-200 text-primary-green px-4 py-1.5 rounded text-sm font-medium hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                        <option value="Camping">Camping</option>
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
                    <h3 className="font-semibold text-primary-green mb-2">Entrance Fees (per day)</h3>
                    {isEditing ? (
                      <div className="space-y-3">
                        {['adults', 'seniors', 'pwd', 'kids', 'children', 'environmental', 'tourGuide'].map((feeType) => (
                          <div key={feeType} className="grid grid-cols-1 md:grid-cols-3 gap-2 items-center">
                            <div className="p-2 border border-border-green rounded text-primary-green w-full bg-gray-50">
                              {{
                                'adults': 'Adults (18–59 years)',
                                'seniors': 'Seniors (60+ years)',
                                'pwd': 'Persons with Disability (PWD)',
                                'kids': 'Kids (11–17 years)',
                                'children': 'Children (below 6 years)',
                                'environmental': 'Environmental Fee',
                                'tourGuide': 'Tour Guide Fee (optional)'
                              }[feeType]}
                            </div>
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
                              type="hidden"
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
                            />
                          </div>
                        ))}

                        {/* Helper note for editors: explain tour guide optionality */}
                        <p className="text-sm text-black mt-2">
                          Note: The tour guide is optional. If visitors choose to avail a tour guide, charge the additional amount under "Tour Guide Fee" above.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {selectedSpot.entranceFees ? (
                          <>
                            {Object.entries(selectedSpot.entranceFees).map(([feeType, fee]) => (
                              fee && (
                                <div key={feeType} className="flex justify-between">
                                  <span className="text-primary-green/70">{fee.label || feeType}:</span>
                                  <span className="font-medium">
                                    {fee.amount > 0 ? `₱${fee.amount.toFixed(2)}` : 'Free'}
                                  </span>
                                </div>
                              )
                            ))}

                            {/* Informational note for visitors in the details modal */}
                            <p className="text-sm text-black mt-2">
                              Note: Tour guide is optional. If you want to avail a tour guide, an additional fee will apply — see the "Tour Guide Fee" above.
                            </p>
                          </>
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

            {/* Schedule Visit Button - Fixed at bottom right */}
            {!isEditing && (
              <div key={`schedule-btn-${currentUser?.uid || 'no-user'}-${Date.now()}`} className="fixed bottom-6 right-6 z-50">
                {isMounted && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      const spotParams = `?spotId=${selectedSpot.id}&spotName=${encodeURIComponent(selectedSpot.name)}`;
                      if (currentUser) {
                        router.push(`/dashboard/schedule-visit${spotParams}`);
                      } else {
                        router.push(`/signin?redirectTo=${encodeURIComponent(`/dashboard/schedule-visit${spotParams}`)}`);
                      }
                    }}
                    className={`flex items-center justify-center gap-2 font-medium py-3 px-6 rounded-lg shadow-lg transition-all duration-300 ${
                      currentUser 
                        ? 'bg-primary-green hover:bg-opacity-90 text-egg-white' 
                        : 'bg-yellow-500 hover:bg-yellow-600 text-egg-white transform hover:scale-105 shadow-xl'
                    }`}
                    data-user-id={currentUser?.uid || 'no-user'}
                    data-testid="schedule-visit-button"
                    key={`schedule-btn-${currentUser ? 'user' : 'no-user'}`}
                  >
                    {currentUser ? (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                        </svg>
                        <span>Schedule a Visit</span>
                      </>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                        </svg>
                        <span>Sign In to Schedule a Visit</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Render the list view by default
  return (
    <div className="min-h-screen relative">
      {/* Carousel Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-black/70 z-10"></div>
        <div className="embla overflow-hidden w-full h-full" ref={emblaRef}>
          <div className="embla__container flex h-full">
            {carouselItems.length > 0 ? (
              carouselItems.map((item, index) => (
                <div
                  key={item.id}
                  className="embla__slide flex-[0_0_100%] min-w-0 h-full"
                >
                  <div className="relative w-full h-full">
                    <Image
                      src={item.image || "/placeholder-image.jpg"}
                      alt={`Carousel image ${index + 1}`}
                      fill
                      className={`object-fill transition-transform duration-300`}
                      priority={index < 3}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.onerror = null;
                        target.src = "/placeholder-image.jpg";
                      }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-green-800 to-green-600 flex items-center justify-center">
                <p className="text-white">No images available</p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Semi-transparent overlay */}
      <div className="fixed inset-0 -z-10 bg-black/30"></div>
      
      {/* Hero Section */}
      <div className="bg-black/30 backdrop-blur-sm py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold text-white font-poppins">Tourist Spots</h1>
          <p className="mt-4 text-xl text-white/90 max-w-3xl mx-auto font-poppins">
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
          <div className="bg-black/30 backdrop-blur-sm rounded-lg p-6 shadow-md">
            <h2 className="text-2xl font-semibold text-white font-poppins mb-4">Barangay</h2>
            <div className="flex flex-wrap gap-2">
              {barangays.map((barangay) => (
                <button
                  key={barangay}
                  onClick={() => handleBarangaySelect(barangay)}
                  className={`px-4 py-2 rounded-full text-sm font-medium font-poppins transition-all duration-300 ${
                    selectedBarangay === barangay
                      ? 'bg-white text-primary-green shadow-md scale-105'
                      : 'bg-white/20 text-white border border-white/30 hover:bg-white/30 hover:scale-105'
                  }`}
                >
                  {barangay === 'all' ? 'All Barangays' : barangay}
                </button>
              ))}
            </div>
          </div>
        </div>


        {/* Tourist Spots by Barangay */}
        {Object.keys(groupedSpots).length > 0 ? (
          <div className="space-y-12">
            {Object.entries(groupedSpots).map(([barangay, spots]) => (
              <div key={barangay} id={`barangay-${barangay}`} className="scroll-mt-20">
                <div className="mb-6">
                  <h2 className="text-3xl font-bold text-white font-poppins mb-2">
                    {barangay}
                  </h2>
                  <div className="h-1 w-20 bg-white rounded-full"></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {spots.map((spot) => (
                    <div key={spot.id} className={`bg-black/30 backdrop-blur-sm rounded-lg shadow-lg overflow-hidden transition-all duration-300 border border-white/20 ${spot.closed ? 'border-red-300/50' : 'hover:shadow-xl hover:scale-105 group'}`}>
                      <div className="relative h-48 w-full">
                        {spot.image ? (
                          <>
                            <Image
                              src={spot.image}
                              alt={spot.name}
                              fill
                              className={`object-fill transition-transform duration-300 ${spot.closed ? 'opacity-30' : 'group-hover:scale-110'}`}
                              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                              unoptimized={spot.image.includes('appwrite.io')}
                            />
                            {spot.closed && (
                              <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center p-4 text-center">
                                <div className="bg-red-500/90 text-white px-4 py-2 rounded-lg max-w-xs">
                                  <div className="font-medium text-sm">Temporarily Closed</div>
                                  {spot.businessName && (
                                    <div className="text-xs mt-1 bg-white/20 px-2 py-0.5 rounded-full inline-block">
                                      {spot.businessName}
                                    </div>
                                  )}
                                </div>
                                {spot.closedReason && (
                                  <div className="mt-2 text-white text-sm bg-black/50 px-3 py-1.5 rounded-lg max-w-md">
                                    {spot.closedReason}
                                  </div>
                                )}
                              </div>
                            )}
                          </>
                        ) : (
                          <div className={`w-full h-full bg-black/20 flex items-center justify-center ${spot.closed ? 'opacity-50' : ''}`}>
                            <span className="text-white/70">No image</span>
                          </div>
                        )}
                        <div className={`absolute top-2 right-2 ${spot.closed ? 'bg-red-500/90' : 'bg-black/80'} text-white px-2 py-1 rounded-full text-xs font-medium`}>
                          {spot.closed ? 'Closed' : spot.category}
                        </div>
                      </div>
                      <div className="p-6">
                        <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-accent-yellow transition-colors duration-300">
                          {spot.name}
                        </h3>
                        <p className={`text-sm ${spot.closed ? 'text-red-300' : 'text-white/80'} font-medium mb-4`}>
                          {spot.location}
                          {spot.closed && spot.closedUntil && (
                            <span className="block text-xs mt-1 text-white/60">
                              Closed until: {new Date(spot.closedUntil).toLocaleDateString()}
                            </span>
                          )}
                        </p>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (spot.closed) {
                              toast.error('This spot is temporarily closed' + (spot.closedReason ? `: ${spot.closedReason}` : ''));
                            } else {
                              setSelectedSpot(spot);
                              setEditedSpot({ ...spot });
                              setShowDetails(true);
                            }
                          }}
                          disabled={spot.closed}
                          className="w-full bg-white/20 hover:bg-white/30 text-white border border-white/30 py-2 px-4 rounded-md transition-all duration-300 hover:scale-[1.02]"
                        >
                          View Details
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

      </div>
    </div>
  );
}
