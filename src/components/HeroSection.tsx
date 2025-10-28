"use client";

import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Pencil } from 'lucide-react';
import { useState } from 'react';

interface HeroSectionProps {
  // Add any props if needed
}

export default function HeroSection({}: HeroSectionProps) {
  const { isAdmin } = useAuth() || {};
  const [title, setTitle] = useState('Welcome to Kapangan Wonders');
  const [description, setDescription] = useState('Discover the breathtaking beauty and rich culture of Kapangan, home to stunning landscapes like the Amburayan Bridge and more.');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  
  const handleSaveTitle = (newTitle: string) => {
    setTitle(newTitle);
    setIsEditingTitle(false);
    // TODO: Add API call to save the title
  };
  
  const handleSaveDescription = (newDescription: string) => {
    setDescription(newDescription);
    setIsEditingDescription(false);
    // TODO: Add API call to save the description
  };

  return (
    <div className="relative h-screen max-h-[90vh] min-h-[600px] overflow-hidden group">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 w-full h-full">
        <Image
          src="/assets/Ampongot Rice Terraces (Sagubo).jpg"
          alt="Ampongot Rice Terraces in Sagubo, Kapangan"
          layout="fill"
          objectFit="cover"
          priority
          className="brightness-75"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
      </div>
      
      {/* Content */}
      <div className="relative z-10 h-full flex flex-col justify-center items-center text-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="relative inline-block group max-w-full">
            {isEditingTitle ? (
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={() => handleSaveTitle(title)}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveTitle(title)}
                className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 bg-transparent border-b-2 border-white outline-none text-center w-full"
                autoFocus
              />
            ) : (
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
                {title}
              </h1>
            )}
            {isAdmin && !isEditingTitle && (
              <button 
                className="absolute -right-10 top-1/2 -translate-y-1/2 p-1.5 text-white bg-black/30 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/50"
                onClick={() => setIsEditingTitle(true)}
                aria-label="Edit title"
              >
                <Pencil className="w-5 h-5" />
              </button>
            )}
          </div>
          <div className="relative inline-block group max-w-full">
            {isEditingDescription ? (
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onBlur={() => handleSaveDescription(description)}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveDescription(description)}
                className="text-xl md:text-2xl text-gray-200 mb-8 max-w-3xl mx-auto bg-transparent border-b border-white outline-none text-center w-full resize-none h-24"
                autoFocus
              />
            ) : (
              <p className="text-xl md:text-2xl text-gray-200 mb-8 max-w-3xl mx-auto">
                {description}
              </p>
            )}
            {isAdmin && !isEditingDescription && (
              <button 
                className="absolute -right-8 top-0 p-1.5 text-white bg-black/30 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/50"
                onClick={() => setIsEditingDescription(true)}
                aria-label="Edit description"
              >
                <Pencil className="w-4 h-4" />
              </button>
            )}
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/tourist-spots"
              className="bg-white text-green-700 hover:bg-gray-100 px-8 py-3 rounded-full font-semibold text-lg transition-all duration-300 text-center"
            >
              Explore More Destinations
            </Link>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10">
        <div className="animate-bounce">
          <svg
            className="h-8 w-8 text-white"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
          </svg>
        </div>
      </div>
    </div>
  );
}
