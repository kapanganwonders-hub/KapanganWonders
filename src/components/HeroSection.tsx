"use client";

import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Save, Image as ImageIcon } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { db, doc, getDoc, setDoc } from "@/lib/firebase";
import { Alert, AlertTitle, AlertDescription } from "@/components/lightswind/alert";
import { getImageUrl } from "@/lib/appwrite";
import useEmblaCarousel from "embla-carousel-react";
import CarouselManagementModal from "@/components/CarouselManagementModal";

interface CarouselItem {
  id: string;
  image: string;
  fileId?: string;
}

export default function HeroSection() {
  const { isAdmin } = useAuth() || {};
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [carouselItems, setCarouselItems] = useState<CarouselItem[]>([]);
  const [title, setTitle] = useState("Loading...");
  const [description, setDescription] = useState("");
  const [showEditControls, setShowEditControls] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editingTitle, setEditingTitle] = useState("");
  const [editingDescription, setEditingDescription] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  // ✅ Load hero section data
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

  // ✅ Toggle edit mode for both title and description
  const toggleEditMode = () => {
    if (!isEditMode) {
      // Entering edit mode
      setEditingTitle(title);
      setEditingDescription(description);
      setIsEditingTitle(true);
      setIsEditingDescription(true);
      setIsEditMode(true);
    } else {
      // Exiting edit mode
      handleSave();
    }
  };

  // ✅ Save both title and description
  const handleSave = async () => {
    try {
      setTitle(editingTitle);
      setDescription(editingDescription);
      setIsEditingTitle(false);
      setIsEditingDescription(false);
      
      await setDoc(doc(db, "heroSection", "main"), {
        title: editingTitle,
        description: editingDescription,
      });
      
      // Show success notification
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000); // Hide after 3 seconds
      setIsEditMode(false);
    } catch (error) {
      console.error("Error saving changes:", error);
    }
  };

  // ✅ Cancel editing
  const handleCancel = () => {
    setIsEditingTitle(false);
    setIsEditingDescription(false);
    setEditingTitle(title);
    setEditingDescription(description);
    setIsEditMode(false);
  };

  // Check if in any edit mode
  const isEditing = isEditingTitle || isEditingDescription;

  // ✅ Initialize Embla carousel
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: "start",
    duration: 25,
  });

  // ✅ Fixed autoplay (works on mobile and desktop)
  useEffect(() => {
    if (!emblaApi) return;

    let autoplayInterval: NodeJS.Timeout;
    let restartTimeout: NodeJS.Timeout;

    const autoplay = () => {
      if (!emblaApi) return;
      if (emblaApi.canScrollNext()) emblaApi.scrollNext();
      else emblaApi.scrollTo(0);
    };

    const startAutoplay = () => {
      clearInterval(autoplayInterval);
      autoplayInterval = setInterval(autoplay, 5000);
    };

    const pauseAutoplay = () => {
      clearInterval(autoplayInterval);
      clearTimeout(restartTimeout);
      // Restart autoplay after 5s of no interaction
      restartTimeout = setTimeout(startAutoplay, 5000);
    };

    // Start autoplay on mount
    startAutoplay();

    // ✅ Listen for user interactions (desktop + mobile)
    const emblaNode = emblaApi.containerNode();

    emblaNode.addEventListener("pointerdown", pauseAutoplay, { passive: true });
    emblaNode.addEventListener("touchstart", pauseAutoplay, { passive: true });
    emblaNode.addEventListener("touchmove", pauseAutoplay, { passive: true });
    emblaNode.addEventListener("wheel", pauseAutoplay, { passive: true });

    // ✅ Resume autoplay when scrolling ends
    emblaApi.on("settle", startAutoplay);

    // Cleanup
    return () => {
      clearInterval(autoplayInterval);
      clearTimeout(restartTimeout);
      emblaApi.off("settle", startAutoplay);
      emblaNode.removeEventListener("pointerdown", pauseAutoplay);
      emblaNode.removeEventListener("touchstart", pauseAutoplay);
      emblaNode.removeEventListener("touchmove", pauseAutoplay);
      emblaNode.removeEventListener("wheel", pauseAutoplay);
    };
  }, [emblaApi]);

  // ✅ Load carousel items
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

  // ✅ Save carousel items
  const saveCarouselItems = async (items: CarouselItem[]) => {
    try {
      await setDoc(doc(db, "carousel", "items"), { items });
      setCarouselItems(items);
    } catch (error) {
      console.error("Error saving carousel items:", error);
    }
  };

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  return (
    <div className="relative min-h-screen overflow-hidden">
      {showSuccess && (
        <div className="fixed bottom-4 right-4 z-50 w-80">
          <Alert variant="success" className="bg-white border-2 border-green-500">
            <AlertTitle>Update Successful</AlertTitle>
            <AlertDescription>Hero section has been updated successfully</AlertDescription>
          </Alert>
        </div>
      )}
      {/* Carousel Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-black/30 z-10"></div>
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
                      className="object-fill"
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
                <p className="text-white">No images available. Add some images to the carousel.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Admin Controls */}
      {isAdmin && (
        <div className="flex justify-end mb-6 absolute top-4 right-4 z-20 space-x-2">
          {isEditMode ? (
            <>
              <button
                onClick={handleCancel}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
              >
                <XMarkIcon className="-ml-1 mr-2 h-5 w-5" />
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
              >
                <Save className="-ml-1 mr-2 h-5 w-5" />
                Save Changes
              </button>
              <button
                onClick={() => setIsManageModalOpen(true)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
              >
                <ImageIcon className="-ml-1 mr-2 h-5 w-5" />
                Manage Carousel
              </button>
            </>
          ) : (
            <button
              onClick={toggleEditMode}
              className="inline-flex items-center px-6 py-2.5 border-2 border-white/20 bg-white/10 hover:bg-white/20 text-sm font-medium rounded-full text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white/50 transition-all duration-300 hover:shadow-lg"
            >
              {isEditMode ? 'Cancel' : 'Manage Hero Section'}
            </button>
          )}
        </div>
      )}


      {/* Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-4xl mx-auto text-center text-white bg-black/40 backdrop-blur-sm rounded-2xl p-8 md:p-12 shadow-2xl">
          <div className="relative group mb-8">
            {isEditingTitle ? (
              <div className="w-full max-w-2xl mx-auto">
                <input
                  type="text"
                  value={editingTitle}
                  onChange={(e) => setEditingTitle(e.target.value)}
                  className="text-4xl md:text-6xl font-bold text-white mb-4 bg-transparent border-b-2 border-white/50 outline-none w-full focus:border-white transition-colors duration-300 text-center"
                  autoFocus
                />
              </div>
            ) : (
              <h1 className="text-4xl md:text-6xl font-bold mb-6 drop-shadow-lg px-4 py-2 rounded-lg inline-block">
                {title}
              </h1>
            )}
          </div>

          <div className="relative group mb-12">
            {isEditingDescription ? (
              <div className="w-full max-w-2xl mx-auto">
                <textarea
                  value={editingDescription}
                  onChange={(e) => setEditingDescription(e.target.value)}
                  className="text-lg md:text-xl text-white/90 mb-4 w-full bg-transparent border-b-2 border-white/50 outline-none resize-none h-24 focus:border-white transition-colors duration-300 p-1 text-center"
                />
              </div>
            ) : (
              <p className="text-lg md:text-xl text-white/95 mb-8 leading-relaxed max-w-3xl mx-auto drop-shadow px-6 py-4 bg-black/30 rounded-xl">
                {description}
              </p>
            )}
          </div>


          <div className="mt-12">
            <Link
              href="/tourist-spots"
              className="inline-block bg-white/90 hover:bg-white text-green-800 hover:text-green-900 px-8 py-3 rounded-full font-semibold text-sm md:text-base transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl border-2 border-white/20"
            >
              Explore More Destinations
            </Link>
          </div>
        </div>
      </div>

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
