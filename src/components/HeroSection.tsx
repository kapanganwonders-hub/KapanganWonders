"use client";

import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { PencilSquareIcon, XMarkIcon } from '@heroicons/react/24/outline';
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
    <div className="relative min-h-screen bg-gradient-to-br from-white to-green-50 overflow-hidden border-b-8 border-green-100">
      {showSuccess && (
        <div className="fixed bottom-4 right-4 z-50 w-80">
          <Alert variant="success" className="bg-white border-2 border-green-500">
            <AlertTitle>Update Successful</AlertTitle>
            <AlertDescription>Hero section has been updated successfully</AlertDescription>
          </Alert>
        </div>
      )}
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
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
            >
              <PencilSquareIcon className="-ml-1 mr-2 h-5 w-5" />
              Manage Hero Section
            </button>
          )}
        </div>
      )}

      {/* Background circles */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-green-100 rounded-full opacity-20"></div>
        <div className="absolute -left-40 top-1/3 w-80 h-80 bg-green-200 rounded-full opacity-10"></div>
        <div className="absolute right-1/4 bottom-0 w-40 h-40 bg-green-300 rounded-full opacity-10"></div>
      </div>

      {/* Content */}
      <div className="relative w-full max-w-7xl mx-auto px-4 py-16 md:py-24 flex flex-col md:flex-row items-center">
        {/* Left: Text Content (Desktop) */}
        <div className="hidden md:block relative w-full md:w-5/12 pr-0 md:pr-12 mb-12 md:mb-0 bg-white/80 backdrop-blur-sm p-8 rounded-2xl border-2 border-green-100 shadow-lg">
          <div className="relative group mb-6">
            {isEditingTitle ? (
              <div className="w-full max-w-[90%]">
                <input
                  type="text"
                  value={editingTitle}
                  onChange={(e) => setEditingTitle(e.target.value)}
                  className="text-3xl md:text-4xl font-bold text-green-900 mb-4 bg-transparent border-b-2 border-green-200 outline-none w-full focus:border-green-500 transition-colors duration-300"
                  autoFocus
                  style={{ maxWidth: '100%' }}
                />
              </div>
            ) : (
              <div className="flex items-center group">
                <h1 className="text-3xl md:text-5xl font-bold bg-gradient-to-r from-green-700 to-green-500 bg-clip-text text-transparent mb-6 break-words">
                  {title}
                </h1>
                {isAdmin && showEditControls && (
                  <button
                    className="ml-3 px-3 py-1 text-sm text-gray-600 hover:text-green-700 rounded-full hover:bg-green-50 transition-colors border border-gray-200 hover:border-green-200 flex items-center h-8"
                    onClick={toggleEditMode}
                  >
                    <PencilSquareIcon className="w-4 h-4 mr-1" />
                    <span>Edit</span>
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="relative group mb-8">
            {isEditingDescription ? (
              <div className="w-full">
                <textarea
                  value={editingDescription}
                  onChange={(e) => setEditingDescription(e.target.value)}
                  className="text-lg text-gray-700 mb-4 w-full bg-transparent border-b-2 border-green-100 outline-none resize-none h-24 focus:border-green-500 transition-colors duration-300 p-1"
                />
              </div>
            ) : (
              <div className="w-full">
                <p className="text-lg text-gray-700 mb-4 leading-relaxed">
                  {description}
                </p>
              </div>
            )}
          </div>

          {/* Edit button for title/description */}
          {isAdmin && isEditing && !isEditMode && (
            <button
              className="flex items-center px-3 py-1 text-sm text-gray-600 hover:text-green-700 rounded-full hover:bg-green-50 transition-colors border border-gray-200 hover:border-green-200 mt-4"
              onClick={toggleEditMode}
            >
              <PencilSquareIcon className="w-4 h-4 mr-1" />
              <span>Edit</span>
            </button>
          )}

          <Link
            href="/tourist-spots"
            className="inline-block bg-gradient-to-r from-green-600 to-green-500 text-white px-6 py-3 rounded-full font-semibold text-sm transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg mt-6"
          >
            Explore More Destinations
          </Link>
        </div>

        {/* Carousel Section */}
        <div className="w-full md:w-7/12 relative group z-10">

          <div
            className="embla overflow-hidden w-full rounded-3xl shadow-2xl mx-auto border-4 border-white ring-2 ring-green-100 relative"
            style={{ maxWidth: "1200px" }}
            ref={emblaRef}
          >
            <div className="embla__container flex">
              {carouselItems.length > 0 ? (
                carouselItems.map((item, index) => (
                  <div
                    key={item.id}
                    className="embla__slide flex-[0_0_100%] min-w-0 group select-none"
                  >
                    <div className="relative h-80 md:h-96 w-full">
                      <Image
                        src={item.image || "/placeholder-image.jpg"}
                        alt={`Carousel image ${index + 1}`}
                        fill
                        className="object-cover rounded-2xl transition-transform duration-500 group-hover:scale-105"
                        priority={index < 3}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.onerror = null;
                          target.src = "/placeholder-image.jpg";
                        }}
                      />
                      {/* Mobile Overlay - Fixed Position */}
                      <div className="md:hidden absolute bottom-0 left-0 right-0 z-10 text-white bg-gradient-to-t from-black/80 via-black/50 to-transparent rounded-b-2xl pointer-events-none p-6 pt-12">
                        <div className="pointer-events-auto transform transition-transform duration-300 hover:scale-[1.01]">
                          <h1 className="text-2xl font-bold mb-2 drop-shadow-md">{title}</h1>
                          <p className="text-sm mb-4 line-clamp-2 drop-shadow-md">{description}</p>
                          <Link
                            href="/tourist-spots"
                            className="inline-block bg-white text-green-700 px-6 py-2 rounded-full font-semibold text-sm transition-all duration-300 transform hover:scale-105 shadow-lg w-fit"
                            onClick={(e) => e.stopPropagation()}
                          >
                            Explore More
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="w-full h-80 md:h-96 bg-gradient-to-br from-green-50 to-white rounded-2xl flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-green-200 p-8 text-center relative">
                  <div className="md:hidden absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-white to-transparent rounded-b-2xl">
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">{title}</h1>
                    <p className="text-gray-600 mb-4">{description}</p>
                    <Link
                      href="/tourist-spots"
                      className="inline-block bg-gradient-to-r from-green-600 to-green-500 text-white px-6 py-2 rounded-full font-semibold text-sm transition-all duration-300 transform hover:scale-105 shadow-md"
                    >
                      Explore More
                    </Link>
                  </div>
                  <p className="mt-auto mb-8 md:my-0">No images available. Add some images to the carousel.</p>
                </div>
              )}
            </div>

            {/* Navigation buttons removed as per request */}
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
