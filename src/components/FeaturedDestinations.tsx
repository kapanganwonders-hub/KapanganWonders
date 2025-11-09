"use client";

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

const destinations = [
  {
    id: 1,
    name: 'Amburayan River',
    location: 'Taba-ao',
    image: '/assets/Amburayan River (Taba-ao).jpg',
  },
  {
    id: 2,
    name: 'Ampongot Rice Terraces',
    location: 'Sagubo',
    image: '/assets/Ampongot Rice Terraces (Sagubo).jpg',
  },
  {
    id: 3,
    name: 'Amburayan Bridge',
    location: 'Cuba',
    image: '/assets/Amburayan Bridge (Cuba).jpg',
  },
];

const FeaturedDestinations = () => {
  return (
    <section className="py-12 relative overflow-hidden">
      {/* Background Design */}
      <div className="absolute inset-0 z-0">
        {/* Subtle Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-green-50/30 to-blue-50/30"></div>
        
        {/* Animated Background Elements */}
<div className="absolute top-0 left-0 w-72 h-72 bg-green-200/20 rounded-full mix-blend-multiply filter blur-3xl animate-pulse-slow"></div>
<div className="absolute top-1/4 right-10 w-96 h-96 bg-blue-200/20 rounded-full mix-blend-multiply filter blur-3xl animate-pulse-slower"></div>
<div className="absolute bottom-10 left-1/4 w-80 h-80 bg-emerald-200/20 rounded-full mix-blend-multiply filter blur-3xl animate-pulse-medium"></div>
        
        {/* Grid Pattern Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.02)_1px,transparent_1px)] bg-[size:40px_40px]"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="inline-block relative">
            <h2 className="text-4xl font-bold text-gray-900 mb-4 relative z-10 font-serif">
              <span className="relative inline-block">
                Featured Destinations
                <span className="absolute bottom-1 left-0 w-full h-2 bg-green-100 -z-10 transform translate-y-1 rounded-full"></span>
              </span>
            </h2>
          </div>
          <div className="w-24 h-1 bg-gradient-to-r from-green-400 to-green-600 mx-auto my-4 rounded-full"></div>
          <p className="text-lg text-gray-700 max-w-2xl mx-auto font-sans">
            Discover the most beautiful and popular tourist spots in Kapangan
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {destinations.map((destination) => (
            <div 
              key={destination.id} 
              className="group bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-400 transform hover:-translate-y-2 border border-gray-100 hover:border-green-200"
            >
              <div className="relative h-56 w-full overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent z-10"></div>
                <Image
                  src={destination.image}
                  alt={destination.name}
                  layout="fill"
                  objectFit="cover"
                  className="group-hover:scale-110 transition-transform duration-700 ease-in-out"
                />
                <div className="absolute bottom-0 left-0 right-0 p-4 z-20">
                  <h3 className="text-xl font-bold text-white mb-1 group-hover:text-green-200 transition-colors">
                    {destination.name}
                  </h3>
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
              <div className="p-4 bg-white">
                <p className="text-gray-600 text-sm mb-4 line-clamp-2 leading-relaxed">
                  Experience the breathtaking beauty of {destination.name} in {destination.location}. 
                  A must-visit destination for nature lovers.
                </p>
                <Link 
                  href="/tourist-spots"
                  className="inline-flex items-center justify-center w-full text-center bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-medium py-2 px-4 rounded-lg transition-all duration-300 transform hover:shadow-lg group-hover:scale-[1.02] text-sm"
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
            className="group relative inline-flex items-center justify-center px-6 py-3 overflow-hidden font-semibold text-green-700 transition-all duration-300 rounded-full border-2 border-green-500 hover:bg-green-500 hover:text-white text-sm"
          >
            <span className="relative z-10">View All Destinations</span>
            <span className="absolute bottom-0 left-0 w-full h-0 bg-green-500 transition-all duration-300 group-hover:h-full -z-1"></span>
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