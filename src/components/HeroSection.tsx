"use client";

import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { Pencil } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { db, doc, getDoc, setDoc } from "@/lib/firebase";
import useEmblaCarousel from 'embla-carousel-react';
import type { EmblaCarouselType } from 'embla-carousel';

interface TouristSpot {
  id: string;
  name: string;
  location: string;
  image: string;
}

const touristSpots: TouristSpot[] = [
  { id: 'amburayan-bridge', name: 'Amburayan Bridge', location: 'Cuba', image: '/assets/Amburayan Bridge (Cuba).jpg' },
  { id: 'amburayan-river', name: 'Amburayan River', location: 'Taba-ao', image: '/assets/Amburayan River (Taba-ao).jpg' },
  { id: 'ampongot-rice-terraces', name: 'Ampongot Rice Terraces', location: 'Sagubo', image: '/assets/Ampongot Rice Terraces (Sagubo).jpg' },
  { id: 'avong-nen-suvani', name: 'Avong Nen Suvani', location: 'Datakan', image: '/assets/Avong Nen Suvani (Datakan).jpg' },
  { id: 'badi-falls', name: 'Badi Falls', location: 'Sagubo', image: '/assets/Badi Falls (Sagubo).jpg' },
  { id: 'beleng-belis', name: 'Beleng-Belis Viewing Area', location: '', image: '/assets/Beleng-Belis Viewing Area.jpg' },
  { id: 'burcios-anthurium', name: 'Burcio\'s Anthurium Forest', location: 'Labueg', image: '/assets/Burcio_s Anthurium Forest (Labueg) (1).jpg' },
  { id: 'camp-utopia', name: 'Camp Utopia', location: 'Sagubo', image: '/assets/Camp Utopia (Sagubo).jpg' },
  { id: 'canutos-dragon-fruit', name: 'Canuto\'s Dragon Fruit Farm', location: 'Labueg', image: '/assets/Canuto_s Dragon Fruit Farm (Labueg).jpg' },
  { id: 'dangwa-cave', name: 'Dangwa Cave', location: 'Taba-ao', image: '/assets/Dangwa Cave (Taba-ao).jpg' },
  { id: 'dumanay-cave', name: 'Dumanay Cave', location: 'Pongayan', image: '/assets/Dumanay Cave (Pongayan).jpg' },
  { id: 'i-love-kapangan', name: 'I Love Kapangan Marker', location: 'Datakan', image: '/assets/I love Kapangan Marker (Datakan).jpg' },
  { id: 'kilong-hanging-coffin', name: 'Kilong Hanging Coffin', location: 'Central', image: '/assets/Kilong Hanging Coffin (Central).jpg' },
  { id: 'longog-cave', name: 'Longog Cave', location: 'Balakbak', image: '/assets/Longog Cave (Balakbak).jpg' },
  { id: 'malagyao-footbridge', name: 'Malagyao Footbridge', location: 'Cuba', image: '/assets/Malagyao Footbridge (Cuba).jpg' },
  { id: 'mt-dakiwagan', name: 'Mt. Dakiwagan', location: 'Balakbak', image: '/assets/Mt. Dakiwagan (Balakbak).jpg' },
  { id: 'mt-kalukasog', name: 'Mt. Kalukasog', location: 'Cuba', image: '/assets/Mt. Kalukasog (Cuba).jpg' },
  { id: 'municipal-hall', name: 'Municipal Hall', location: 'Paykek', image: '/assets/Municipal Hall (Paykek).jpg' },
  { id: 'obellan-rice-terraces', name: 'Obellan-Catampan Rice Terraces', location: 'Balakbak', image: '/assets/Obellan-Catampan Rice Terraces (Balakbak).jpg' },
  { id: 'pey-og-falls', name: 'Pey-og Falls', location: 'Boklaoan', image: '/assets/Pey-og Falls (Boklaoan).jpg' },
  { id: 'puga-coffin-cave', name: 'Puga Coffin Cave', location: 'Sagubo', image: '/assets/Puga Coffin Cave (Sagubo).jpg' },
  { id: 'taba-ao-viewdeck', name: 'Taba-ao Viewdeck', location: 'Taba-ao', image: '/assets/Taba-ao Viewdeck (Taba-ao).jpg' },
  { id: 'toplac-falls', name: 'Toplac Falls', location: 'Pudong', image: '/assets/Toplac Falls (Pudong).jpg' },
  { id: 'toplac-rice-fields', name: 'Toplac Rice Fields', location: 'Pudong', image: '/assets/Toplac Rice Fields (Pudong).jpg' },
  { id: 'welcome-marker', name: 'Welcome Marker', location: 'Datakan', image: '/assets/Welcome Marker (Datakan).jpg' },
];

export default function HeroSection() {
  const { isAdmin } = useAuth() || {};
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
        } else {
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
  }, []);

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
    containScroll: 'trimSnaps'
  });

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  return (
    <div className="relative min-h-screen bg-gray-50 overflow-hidden">
      <div className="container mx-auto px-4 py-16 md:py-24 flex flex-col md:flex-row items-center">
        {/* Left Column - Text Content */}
        <div className="w-full md:w-1/2 pr-0 md:pr-12 mb-12 md:mb-0">
          {/* Editable Title */}
          <div className="relative group mb-6">
            {isEditingTitle ? (
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={() => handleSaveTitle(title)}
                onKeyDown={(e) => e.key === "Enter" && handleSaveTitle(title)}
                className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 bg-transparent border-b-2 border-gray-900 outline-none w-full"
                autoFocus
              />
            ) : (
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
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
                className="text-lg text-gray-600 mb-8 w-full bg-transparent border-b border-gray-400 outline-none resize-none h-24"
                autoFocus
              />
            ) : (
              <p className="text-lg text-gray-600 mb-8">
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
            className="inline-block bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-full font-semibold text-lg transition-colors duration-300"
          >
            Explore More Destinations
          </Link>
        </div>

        {/* Right Column - Carousel */}
        <div className="w-full md:w-1/2 relative">
          <div className="embla overflow-hidden rounded-2xl shadow-xl" ref={emblaRef}>
            <div className="embla__container flex">
              {touristSpots.map((spot, index) => (
                <div key={spot.id} className="embla__slide flex-[0_0_100%] min-w-0 group">
                  <div className="relative h-80 md:h-96 w-full">
                    <Image
                      src={spot.image}
                      alt={`${spot.name} in ${spot.location}`}
                      fill
                      className="object-cover rounded-2xl transition-transform duration-500 group-hover:scale-105"
                      priority={index < 3} // Only preload first 3 images
                    />
                    <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent text-white rounded-b-2xl">
                      <h3 className="text-xl font-bold">{spot.name}</h3>
                      {spot.location && <p className="text-sm text-gray-200">{spot.location}</p>}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Navigation Buttons */}
            <button 
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 p-2 rounded-full shadow-lg z-10 transition-colors"
              onClick={scrollPrev}
              aria-label="Previous slide"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button 
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 p-2 rounded-full shadow-lg z-10 transition-colors"
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