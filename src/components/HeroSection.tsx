
"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import AdvisorySection from './AdvisorySection';

export default function HeroSection() {
  const [title, setTitle] = useState("Explore Dream Destination");
  const [description, setDescription] = useState("Discover the breathtaking beauty and rich culture of Kapangan, home to stunning landscapes like the Amburayan Bridge and more. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed diam nonummy nibh euismod tincidunt ut labore et dolore magna aliquam erat volutpat.");
  
  const carouselItems = [
    {
      id: '1',
      image: '/assets/hero-1.jpg',
      title: 'Amburayan Bridge'
    },
    {
      id: '2', 
      image: '/assets/hero-2.jpg',
      title: 'Nature Scenery'
    },
    {
      id: '3',
      image:'/assets/hero-3.jpg',
      title: 'Forest Path'
    },
    {
      id: '4',
      image:'/assets/Mt. Dakiwagan (Balakbak).jpg',
      title: 'Forest Path'
    },
    {
      id: '5',
      image:'/assets/Kapangan.jpg',
      title: 'Forest Path'
    },
    {
      id: '6',
      image:'/assets/Municipalhall.jpg',
      title: 'Forest Path'
    }
  ];

  const socialMediaLinks = [
    {
      name: 'Facebook',
      url: 'https://facebook.com/kapanganwonders',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
      ),
      color: 'hover:bg-blue-500/20'
    },
    {
      name: 'Tiktok',
      url: 'https://tiktok.com/@kapanganwonders',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
        </svg>
      ),
      color: 'hover:bg-black/20'
    },
    {
      name: 'Twitter',
      url: 'https://twitter.com/kapanganwonders',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
        </svg>
      ),
      color: 'hover:bg-blue-400/20'
    }
 
  ];

  const [currentSlide, setCurrentSlide] = useState(0);

  // Auto-play
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % carouselItems.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [carouselItems.length]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % carouselItems.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + carouselItems.length) % carouselItems.length);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gray-900">
      {/* SBACKGROUND CAROUSEL */}
      <div className="absolute inset-0 z-0">
        {carouselItems.map((item, index) => (
          <div
            key={item.id}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === currentSlide ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <img
              src={item.image}
              alt={item.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/40"></div>
          </div>
        ))}
      </div>
      

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-12 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Left Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Hero Text  */}
            <div className="text-white">
              <h1 className="text-6xl md:text-7xl font-bold mb-8 leading-tight font-serif">
                {title}
              </h1>
              <p className="text-xl text-white/90 mb-10 leading-relaxed font-sans max-w-3xl">
                {description}
              </p>
              
              {/* Explore Button */}
              <Link
                href="/tourist-spots"
                className="inline-block bg-white text-green-600 hover:bg-green-50 px-10 py-5 rounded-full font-semibold text-xl transition-all duration-300 transform hover:scale-105 font-sans shadow-2xl mb-8"
              >
                Explore More Destinations
              </Link>

              {/* Social Media Links */}
              <div className="flex items-center gap-4">
                Follow us:
                <div className="flex items-center gap-3">
                  {socialMediaLinks.map((social) => (
                    <a
                      key={social.name}
                      href={social.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`
                        w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm
                        border border-white/20 flex items-center justify-center
                        text-xl transition-all duration-300 transform hover:scale-110
                        hover:bg-white/20 ${social.color}
                        group relative
                      `}
                      aria-label={`Follow us on ${social.name}`}
                    >
                      <span className="transition-transform duration-300 group-hover:scale-110">
                        {social.icon}
                      </span>
                      
                      {/* Tooltip */}
                      <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 
                        bg-black/80 text-white text-xs px-2 py-1 rounded 
                        opacity-0 group-hover:opacity-100 transition-opacity duration-300
                        pointer-events-none whitespace-nowrap">
                        {social.name}
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            </div>    
          </div>

          {/* Right Content - Advisories */}
          <div className="lg:col-span-1">
            <AdvisorySection />
          </div>
        </div>
      </div>

      {/* Carousel Controls */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20 flex items-center gap-4">
 
        
        <div className="flex items-center gap-2">
          {carouselItems.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-3 h-3 rounded-full transition-all ${
                index === currentSlide ? 'bg-white scale-125' : 'bg-white/50'
              }`}
            />
          ))}
        </div>


      </div>
    </div>
  );
}