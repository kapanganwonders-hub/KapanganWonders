"use client";

import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { Pencil, Settings } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { db, doc, getDoc, setDoc } from "@/lib/firebase";
import useEmblaCarousel from 'embla-carousel-react';
import type { EmblaCarouselType } from 'embla-carousel';
import CarouselManagementModal from '@/components/CarouselManagementModal';
import { storage } from '@/lib/appwrite';
import { ID } from 'appwrite';

interface CarouselItem {
  id: string;
  image: string;
  fileId?: string;
}




export default function HeroSection() {
  const { isAdmin } = useAuth?.() || {};
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [carouselItems, setCarouselItems] = useState<CarouselItem[]>([]);
  const [title, setTitle] = useState("Loading...");
  const [description, setDescription] = useState("");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);

  // ✅ Load hero section data from Firestore
  useEffect(() => {
    const fetchHeroData = async () => {
      try {
        const docRef = doc(db, "heroSection", "main");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setTitle(data.title || "Welcome to Kapangan Wonders");
          setDescription(
            data.description ||
              "Discover the breathtaking beauty and rich culture of Kapangan, home to stunning landscapes like the Amburayan Bridge and more."
          );
        } else if (isAdmin) { // Only create default if admin is logged in
          // If no doc found, create default
          await setDoc(docRef, {
            title: "Welcome to Kapangan Wonders",
            description:
              "Discover the breathtaking beauty and rich culture of Kapangan, home to stunning landscapes like the Amburayan Bridge and more.",
          });
        }
      } catch (error) {
        console.error("Error loading hero data:", error);
      }
    };

    fetchHeroData();
  }, [isAdmin]);

  // ✅ Save updated title
  const handleSaveTitle = async (newTitle: string) => {
    try {
      setTitle(newTitle);
      setIsEditingTitle(false);
      await setDoc(doc(db, "heroSection", "main"), {
        title: newTitle,
        description,
      });
    } catch (error) {
      console.error("Error saving title:", error);
    }
  };

  // ✅ Save updated description
  const handleSaveDescription = async (newDescription: string) => {
    try {
      setDescription(newDescription);
      setIsEditingDescription(false);
      await setDoc(doc(db, "heroSection", "main"), {
        title,
        description: newDescription,
      });
    } catch (error) {
      console.error("Error saving description:", error);
    }
  };

  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: 'start',
    skipSnaps: false,
    dragFree: false,
    containScroll: 'trimSnaps',
    duration: 15, // Slower autoplay
    startIndex: 0,
    inViewThreshold: 0.7
  });

  // Load carousel items from Firestore
  useEffect(() => {
    const loadCarouselItems = async () => {
      try {
        const docRef = doc(db, 'carousel', 'items');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && docSnap.data().items) {
          setCarouselItems(docSnap.data().items);
        }
      } catch (error) {
        console.error('Error loading carousel items:', error);
      }
    };

    // Load carousel items for all users, including non-authenticated ones
    loadCarouselItems();
  }, []);

  // Save carousel items to Firestore
  const saveCarouselItems = async (items: CarouselItem[]) => {
    try {
      await setDoc(doc(db, 'carousel', 'items'), { items });
      setCarouselItems(items);
      return items;
    } catch (error) {
      console.error('Error saving carousel items:', error);
      throw error;
    }
  };

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  // Auto-scroll functionality
  useEffect(() => {
    if (!emblaApi) return;

    const autoplay = () => {
      if (emblaApi.canScrollNext()) {
        emblaApi.scrollNext();
      } else {
        emblaApi.scrollTo(0);
      }
    };

    const interval = setInterval(autoplay, 5000); 
    return () => clearInterval(interval);
  }, [emblaApi]);

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-white to-green-50 overflow-hidden border-b-8 border-green-100">
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-green-100 rounded-full opacity-20"></div>
        <div className="absolute -left-40 top-1/3 w-80 h-80 bg-green-200 rounded-full opacity-10"></div>
        <div className="absolute right-1/4 bottom-0 w-40 h-40 bg-green-300 rounded-full opacity-10"></div>
      </div>
      
      <div className="relative w-full max-w-7xl mx-auto px-4 py-16 md:py-24 flex flex-col md:flex-row items-center">
        {/* Left Column - Text Content */}
        <div className="relative w-full md:w-5/12 pr-0 md:pr-12 mb-12 md:mb-0 bg-white/80 backdrop-blur-sm p-8 rounded-2xl border-2 border-green-100 shadow-lg">
          {/* Editable Title */}
          <div className="relative group mb-6">
            {isEditingTitle ? (
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={() => handleSaveTitle(title)}
                onKeyDown={(e) => e.key === "Enter" && handleSaveTitle(title)}
                className="text-4xl md:text-5xl font-bold text-green-900 mb-6 bg-transparent border-b-2 border-green-200 outline-none w-full focus:border-green-500 transition-colors duration-300"
                autoFocus
              />
            ) : (
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-green-700 to-green-500 bg-clip-text text-transparent mb-6">
                {title}
              </h1>
            )}
            {isAdmin && !isEditingTitle && (
              <button
                className="absolute -right-10 top-0 p-2 text-gray-600 hover:text-gray-900 rounded-full hover:bg-gray-100 transition-colors"
                onClick={() => setIsEditingTitle(true)}
              >
                <Pencil className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Editable Description */}
          <div className="relative group mb-8">
            {isEditingDescription ? (
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onBlur={() => handleSaveDescription(description)}
                onKeyDown={(e) => e.key === "Enter" && handleSaveDescription(description)}
                className="text-lg text-gray-700 mb-8 w-full bg-transparent border-b-2 border-green-100 outline-none resize-none h-24 focus:border-green-500 transition-colors duration-300"
                autoFocus
              />
            ) : (
              <p className="text-lg text-gray-700 mb-8 leading-relaxed">
                {description}
              </p>
            )}
            {isAdmin && !isEditingDescription && (
              <button
                className="absolute -right-10 top-0 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
                onClick={() => setIsEditingDescription(true)}
              >
                <Pencil className="w-4 h-4" />
              </button>
            )}
          </div>

          <Link
            href="/tourist-spots"
            className="inline-block bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white px-8 py-4 rounded-full font-semibold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-green-200 border-2 border-white"
          >
            Explore More Destinations
          </Link>
        </div>

        {/* Right Column - Image Carousel */}
        <div className="w-full md:w-7/12 relative group z-10">
          {isAdmin && (
            <button
              onClick={() => setIsManageModalOpen(true)}
              className="absolute top-4 right-4 z-10 p-2 bg-white/80 hover:bg-white text-gray-700 rounded-full shadow-md hover:shadow-lg transition-all duration-200 opacity-0 group-hover:opacity-100"
              title="Manage carousel"
            >
              <Settings className="w-5 h-5" />
            </button>
          )}
          <div className="embla overflow-hidden w-full rounded-3xl shadow-2xl mx-auto border-4 border-white ring-2 ring-green-100" style={{ maxWidth: '1200px' }} ref={emblaRef}>
            <div className="embla__container flex">
              {carouselItems.length > 0 ? carouselItems.map((item, index) => (
                <div key={item.id} className="embla__slide flex-[0_0_100%] min-w-0 group">
                  <div className="relative h-80 md:h-96 w-full">
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt={`Carousel image ${index + 1}`}
                        fill
                        className="object-cover rounded-2xl transition-transform duration-500 group-hover:scale-105"
                        priority={index < 3} // Only preload first 3 images
                        unoptimized={item.image.startsWith('blob:')} // Don't optimize blob URLs
                        onError={(e) => {
                          // Fallback to a placeholder if image fails to load
                          const target = e.target as HTMLImageElement;
                          target.onerror = null; // Prevent infinite loop
                          target.src = '/placeholder-image.jpg';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-green-50 to-white flex items-center justify-center rounded-2xl border-2 border-dashed border-green-200">
                        <span className="text-gray-500">Image not available</span>
                      </div>
                    )}
                  </div>
                </div>
              )) : (
                <div className="w-full h-80 md:h-96 bg-gradient-to-br from-green-50 to-white rounded-2xl flex items-center justify-center text-gray-400 border-2 border-dashed border-green-200 p-8 text-center">
                  No images available. Add some images to the carousel.
                </div>
              )}
            </div>

            {/* Navigation Buttons */}
            <button 
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-green-700 p-3 rounded-full shadow-lg z-10 transition-all duration-300 hover:scale-110 border-2 border-green-100"
              onClick={scrollPrev}
              aria-label="Previous slide"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button 
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-green-700 p-3 rounded-full shadow-lg z-10 transition-all duration-300 hover:scale-110 border-2 border-green-100"
              onClick={scrollNext}
              aria-label="Next slide"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Carousel Management Modal */}
      <CarouselManagementModal
        isOpen={isManageModalOpen}
        onClose={() => setIsManageModalOpen(false)}
        items={carouselItems}
        onItemsUpdate={saveCarouselItems}
        bucketId="69062d080010accbfb9e"
      />
    </div>
  );
}

// Add these styles to your global CSS or a CSS module
// They should be in your global.css or a CSS module file
/*
.embla {
  position: relative;
}
.embla__container {
  display: flex;
}
.embla__slide {
  position: relative;
  min-width: 100%;
  flex: 0 0 100%;
}
.embla__slide img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
*/