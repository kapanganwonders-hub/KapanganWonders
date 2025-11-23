"use client";

import { useState, useEffect, useCallback, useContext } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { collection, query, getDocs, orderBy, onSnapshot, doc, setDoc, getDoc } from 'firebase/firestore';
import { Alert, AlertTitle, AlertDescription } from "@/components/lightswind/alert";
import { db } from '@/lib/firebase';
import useEmblaCarousel from 'embla-carousel-react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// Helper function to calculate remaining percentage of time
const calculateRemainingPercentage = (startDate: string, endDate: string): number => {
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  const now = new Date().getTime();
  if (now >= end) return 100;
  if (now <= start) return 0;
  const totalDuration = end - start;
  const elapsed = now - start;
  return Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
};

// Helper function to calculate remaining days
const calculateRemainingDays = (endDate: string): number => {
  const end = new Date(endDate).getTime();
  const now = new Date().getTime();
  return Math.ceil((end - now) / (1000 * 60 * 60 * 24));
};

interface Advisory {
  id: string;
  barangay: string;
  category: string;
  content: string;
  createdAt: string;
  createdBy: string;
  title: string;
  author?: string; // Added author field
  privateSpotName?: string; // For private spot owners
}

export default function AdvisorySection() {
  const { isAdmin } = useAuth();
  const [advisories, setAdvisories] = useState<Advisory[]>([]);
  const [visibleAdvisories, setVisibleAdvisories] = useState<Set<string>>(new Set());
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [isEditingSection, setIsEditingSection] = useState(false);
  const [sectionTitle, setSectionTitle] = useState('Latest Announcements');
  const [sectionDesc, setSectionDesc] = useState('Stay updated with the latest news and important updates from Kapangan');
  const [originalTitle, setOriginalTitle] = useState('');
  const [originalDesc, setOriginalDesc] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [notification, setNotification] = useState<{type: 'success' | 'destructive', title: string, message: string} | null>(null);

  const handleTitleBlur = async () => {
    setIsEditingTitle(false);
    if (sectionTitle.trim()) {
      await saveSectionData({ title: sectionTitle });
    }
  };

  const handleTitleKeyDown = async (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      setIsEditingTitle(false);
      if (sectionTitle.trim()) {
        await saveSectionData({ title: sectionTitle });
      }
    }
  };

  const handleDescBlur = async () => {
    setIsEditingDesc(false);
    if (sectionDesc.trim()) {
      await saveSectionData({ description: sectionDesc });
    }
  };

  const handleDescKeyDown = async (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      setIsEditingDesc(false);
      if (sectionDesc.trim()) {
        await saveSectionData({ description: sectionDesc });
      }
    }
  };

  // Save section data to Firestore
  const saveSectionData = async (updates: { title?: string; description?: string }) => {
    try {
      const sectionRef = doc(db, 'sections', 'advisory');
      await setDoc(sectionRef, updates, { merge: true });
    } catch (error) {
      console.error('Error saving section data:', error);
      // Revert UI state on error
      if (updates.title !== undefined) {
        const savedData = await getSectionData();
        setSectionTitle(savedData.title);
      }
      if (updates.description !== undefined) {
        const savedData = await getSectionData();
        setSectionDesc(savedData.description);
      }
    }
  };

  // Get section data from Firestore
  const getSectionData = async () => {
    try {
      const sectionRef = doc(db, 'sections', 'advisory');
      const docSnap = await getDoc(sectionRef);
      
      if (docSnap.exists()) {
        return {
          title: docSnap.data().title || 'Latest Announcements',
          description: docSnap.data().description || 'Stay updated with the latest news and important updates from Kapangan'
        };
      }
      // If no data exists, save defaults
      const defaultData = {
        title: 'Latest Announcements',
        description: 'Stay updated with the latest news and important updates from Kapangan'
      };
      await saveSectionData(defaultData);
      return defaultData;
    } catch (error) {
      console.error('Error getting section data:', error);
      return {
        title: 'Latest Announcements',
        description: 'Stay updated with the latest news and important updates from Kapangan'
      };
    }
  };

  // Handle edit section
  const handleEditSection = () => {
    setOriginalTitle(sectionTitle);
    setOriginalDesc(sectionDesc);
    setIsEditingSection(true);
  };

  // Save section changes
  const saveSection = async () => {
    try {
      await saveSectionData({ title: sectionTitle, description: sectionDesc });
      setIsEditingSection(false);
      setNotification({
        type: 'success',
        title: 'Success',
        message: 'Announcement section updated successfully!'
      });
    } catch (error) {
      console.error('Error saving section:', error);
      setNotification({
        type: 'destructive',
        title: 'Error',
        message: 'Failed to update announcement section. Please try again.'
      });
    }
    
    // Auto-hide notification after 5 seconds
    setTimeout(() => setNotification(null), 5000);
  };

  // Cancel editing
  const cancelEdit = () => {
    setSectionTitle(originalTitle);
    setSectionDesc(originalDesc);
    setIsEditingSection(false);
  };

  // Load section data on component mount
  useEffect(() => {
    const loadSectionData = async () => {
      const data = await getSectionData();
      setSectionTitle(data.title);
      setSectionDesc(data.description);
      setOriginalTitle(data.title);
      setOriginalDesc(data.description);
      setIsLoading(false);
    };
    
    loadSectionData();
  }, []);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const q = query(collection(db, 'announcements'), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        const announcementsData: Advisory[] = [];

        querySnapshot.forEach((doc) => {
          const data = doc.data();
          console.log('Fetched data:', data); // Debug log
          announcementsData.push({
            id: doc.id,
            barangay: data.barangay || 'N/A',
            category: data.category || 'General',
            content: data.content || data.message || 'No content available', // Fallback to message if content is empty
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toLocaleString() : 'Unknown date',
            createdBy: data.createdBy || data.author || 'Unknown', // Fallback to author if createdBy is empty
            title: data.title || 'No Title',
            author: data.author, // Keep original author if available
            privateSpotName: data.privateSpotName || data.businessName || undefined // Include private spot name or business name
          });
        });

        setAdvisories(announcementsData);
        announcementsData.forEach((advisory, index) => {
          setTimeout(() => {
            setVisibleAdvisories(prev => new Set(prev).add(advisory.id));
          }, index * 100);
        });
      } catch (error) {
        console.error('Error fetching announcements:', error);
      }
    };

    fetchAnnouncements();
    const announcementsRef = collection(db, 'announcements');
    const unsubscribe = onSnapshot(announcementsRef, fetchAnnouncements);
    return () => unsubscribe();
  }, []);

  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: 'start' });
  const [prevBtnEnabled, setPrevBtnEnabled] = useState(false);
  const [nextBtnEnabled, setNextBtnEnabled] = useState(false);

  const scrollPrev = useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setPrevBtnEnabled(emblaApi.canScrollPrev());
    setNextBtnEnabled(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
    return () => {
      emblaApi.off('select', onSelect);
    };
  }, [emblaApi, onSelect]);

  const getCategoryBadge = (category: string) => {
    const categoryMap: { [key: string]: string } = {
      'Event Update': 'bg-blue-100 text-blue-800',
      'Maintenance': 'bg-yellow-100 text-yellow-800',
      'Closure': 'bg-red-100 text-red-800',
      'Information': 'bg-gray-100 text-gray-800',
    };
    
    return (
      <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${categoryMap[category] || 'bg-gray-100 text-gray-800'}`}>
        {category}
      </span>
    );
  };

  return (
    <section className="py-12 relative overflow-hidden">
      {notification && (
        <div className="fixed bottom-4 right-4 z-50 w-80">
          <Alert variant={notification.type}>
            <AlertTitle>{notification.title}</AlertTitle>
            <AlertDescription>{notification.message}</AlertDescription>
          </Alert>
        </div>
      )}
      {isAdmin && (
        <div className="flex justify-end mb-6 absolute top-4 right-4 z-20">
          <div className="flex space-x-3">
            <button
              onClick={isEditingSection ? cancelEdit : handleEditSection}
              className={`inline-flex items-center px-4 py-2 border ${
                isEditingSection ? 'border-red-500 bg-red-600 hover:bg-red-700' : 'border-transparent bg-emerald-600 hover:bg-emerald-700'
              } text-sm font-medium rounded-md shadow-sm text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors`}
            >
{isEditingSection ? 'Cancel' : 'Manage Announcement Section'}
            </button>
            {isEditingSection && (
              <button
                onClick={saveSection}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors"
              >
                Save Changes
              </button>
            )}
          </div>
        </div>
      )}
      {/* Background Design */}
      <div className="absolute inset-0 z-0">
        {/* Subtle Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/30 to-green-50/30"></div>
        
        {/* Animated Background Elements */}
        <div className="absolute top-0 left-0 w-72 h-72 bg-emerald-200/20 rounded-full mix-blend-multiply filter blur-3xl animate-pulse-slow"></div>
        <div className="absolute top-1/4 right-10 w-96 h-96 bg-green-200/20 rounded-full mix-blend-multiply filter blur-3xl animate-pulse-slower"></div>
        <div className="absolute bottom-10 left-1/4 w-80 h-80 bg-lime-200/20 rounded-full mix-blend-multiply filter blur-3xl animate-pulse-medium"></div>
        
        {/* Grid Pattern Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.02)_1px,transparent_1px)] bg-[size:40px_40px]"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12" style={{ opacity: isLoading ? 0.7 : 1, transition: 'opacity 0.3s' }}>
          <div className="inline-block relative group">
            {isEditingSection ? (
              <input
                type="text"
                value={sectionTitle}
                onChange={(e) => setSectionTitle(e.target.value)}
                className="text-4xl font-bold text-gray-900 mb-4 text-center bg-white/50 border-b-2 border-emerald-400 focus:outline-none focus:border-emerald-600 font-serif px-4 py-2 rounded-md"
                autoFocus
              />
            ) : (
              <h2 className="text-4xl font-bold text-gray-900 mb-4 relative z-10 font-serif">
                <span className="relative inline-block">
                  {sectionTitle}
                  <span className="absolute bottom-1 left-0 w-full h-2 bg-emerald-100 -z-10 transform translate-y-1 rounded-full"></span>
                </span>
              </h2>
            )}
          </div>
          <div className="w-24 h-1 bg-gradient-to-r from-emerald-400 to-green-600 mx-auto my-4 rounded-full"></div>
          {isEditingSection ? (
            <input
              type="text"
              value={sectionDesc}
              onChange={(e) => setSectionDesc(e.target.value)}
              className="text-lg text-gray-700 max-w-2xl mx-auto font-sans bg-white/50 border border-emerald-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-center w-full px-4 py-2"
            />
          ) : (
            <p className="text-lg text-gray-700 max-w-2xl mx-auto font-sans">
              {sectionDesc}
            </p>
          )}
        </div>
        
        {advisories.length === 0 ? (
          <div className="text-center py-12 bg-white/70 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100">
            <p className="text-gray-600">No announcements found.</p>
          </div>
        ) : (
          <div className="relative">
            <div className="overflow-hidden" ref={emblaRef}>
              <div className="flex -ml-4">
                {advisories.map((advisory) => (
                  <div 
                    key={advisory.id} 
                    className="pl-4 flex-[0_0_90%] sm:flex-[0_0_70%] md:flex-[0_0_50%] lg:flex-[0_0_40%] transition-all duration-300"
                  >
                    <div className="h-full bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100 hover:border-emerald-100 group relative overflow-hidden">
                      {/* Glow effect */}
                      <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-400 to-green-600 rounded-2xl opacity-0 group-hover:opacity-20 blur-lg transition duration-300"></div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-4">
                          <h4 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                            {advisory.title}
                          </h4>
                          {advisory.category && (
                            <div className="flex-shrink-0">
                              {getCategoryBadge(advisory.category)}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center text-sm text-gray-600 mb-4">
                          <svg className="w-4 h-4 mr-1.5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                          </svg>
                          <span className="text-gray-700 font-medium">{advisory.barangay || 'N/A'}</span>
                        </div>

                        <div className="bg-white/50 p-4 rounded-xl mb-5 border border-gray-100">
                          <p className="text-gray-700 whitespace-pre-line break-words leading-relaxed">
                            {advisory.content}
                          </p>
                        </div>

                        <div className="flex flex-col sm:flex-row justify-between gap-4 text-sm border-t border-gray-100 pt-4">
                          <div className="flex-1">
                            <p className="text-xs text-gray-500 font-medium">Posted By</p>
                            <p className="text-gray-700 font-medium break-words">
                              {advisory.author === 'kapanganwonders@gmail.com' 
                                ? 'Kapangan Municipality' 
                                : advisory.privateSpotName || advisory.barangay || advisory.author || advisory.createdBy}
                            </p>
                          </div>
                          <div className="flex-1">
                            <p className="text-xs text-gray-500 font-medium">Posted On</p>
                            <p className="text-gray-700 font-medium">{advisory.createdAt}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <button 
              onClick={scrollPrev}
              disabled={!prevBtnEnabled}
              className={`absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 bg-white/80 backdrop-blur-sm rounded-full p-2 shadow-lg hover:shadow-xl transition-all ${!prevBtnEnabled ? 'opacity-50 cursor-default' : 'hover:bg-white hover:scale-110'}`}
              aria-label="Previous slide"
            >
              <ChevronLeft className="w-5 h-5 text-emerald-600" />
            </button>
            
            <button 
              onClick={scrollNext}
              disabled={!nextBtnEnabled}
              className={`absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 bg-white/80 backdrop-blur-sm rounded-full p-2 shadow-lg hover:shadow-xl transition-all ${!nextBtnEnabled ? 'opacity-50 cursor-default' : 'hover:bg-white hover:scale-110'}`}
              aria-label="Next slide"
            >
              <ChevronRight className="w-5 h-5 text-emerald-600" />
            </button>
          </div>
        )}
        
      </div>
    </section>
  );
}
