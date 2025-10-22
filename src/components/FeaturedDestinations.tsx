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
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Featured Destinations
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Discover the most beautiful and popular tourist spots in Kapangan
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {destinations.map((destination) => (
            <div key={destination.id} className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300">
              <div className="relative h-56 w-full">
                <Image
                  src={destination.image}
                  alt={destination.name}
                  layout="fill"
                  objectFit="cover"
                  className="hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-1">{destination.name}</h3>
                <p className="text-gray-600 mb-4">{destination.location}</p>
                <Link 
                  href="/tourist-spots"
                  className="block w-full text-center bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded transition duration-300"
                >
                  View Details
                </Link>
              </div>
            </div>
          ))}
        </div>
        
        <div className="text-center mt-10">
          <Link 
            href="/tourist-spots"
            className="inline-block border-2 border-green-600 text-green-600 hover:bg-green-600 hover:text-white font-medium py-2 px-6 rounded-full transition duration-300"
          >
            View All Destinations
          </Link>
        </div>
      </div>
    </section>
  );
};

export default FeaturedDestinations;
