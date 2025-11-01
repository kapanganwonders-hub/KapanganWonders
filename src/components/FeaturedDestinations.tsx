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
    <section className="py-16 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-block relative">
            <h2 className="text-4xl font-bold text-gray-900 mb-4 relative z-10">
              <span className="relative inline-block">
                Featured Destinations
                <span className="absolute bottom-1 left-0 w-full h-2 bg-green-100 -z-10 transform translate-y-1"></span>
              </span>
            </h2>
          </div>
          <div className="w-24 h-1 bg-gradient-to-r from-green-400 to-green-600 mx-auto my-6 rounded-full"></div>
          <p className="text-lg text-gray-700 max-w-2xl mx-auto">
            Discover the most beautiful and popular tourist spots in Kapangan
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {destinations.map((destination) => (
            <div 
              key={destination.id} 
              className="group bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100"
            >
              <div className="relative h-64 w-full overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent z-10"></div>
                <Image
                  src={destination.image}
                  alt={destination.name}
                  layout="fill"
                  objectFit="cover"
                  className="group-hover:scale-110 transition-transform duration-700 ease-in-out"
                />
                <div className="absolute bottom-0 left-0 right-0 p-6 z-20">
                  <h3 className="text-2xl font-bold text-white mb-1 group-hover:text-green-200 transition-colors">
                    {destination.name}
                  </h3>
                  <p className="text-green-100 font-medium">{destination.location}</p>
                </div>
                <div className="absolute top-4 right-4 z-20">
                  <span className="bg-green-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                    Featured
                  </span>
                </div>
              </div>
              <div className="p-6 bg-white">
                <p className="text-gray-600 mb-5 line-clamp-3">
                  Experience the breathtaking beauty of {destination.name} in {destination.location}. 
                  A must-visit destination for nature lovers and adventure seekers alike.
                </p>
                <Link 
                  href="/tourist-spots"
                  className="inline-flex items-center justify-center w-full text-center bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-medium py-3 px-6 rounded-lg transition-all duration-300 transform hover:shadow-lg group-hover:scale-[1.02]"
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
        
        <div className="text-center mt-16">
          <Link 
            href="/tourist-spots"
            className="group relative inline-flex items-center justify-center px-8 py-4 overflow-hidden font-semibold text-green-700 transition-all duration-300 rounded-full border-2 border-green-500 hover:bg-green-500 hover:text-white"
          >
            <span className="relative z-10">View All Destinations</span>
            <span className="absolute bottom-0 left-0 w-full h-0 bg-green-500 transition-all duration-300 group-hover:h-full -z-1"></span>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default FeaturedDestinations;
