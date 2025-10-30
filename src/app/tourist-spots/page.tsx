'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { doc, updateDoc, getFirestore, collection, getDocs, query, where } from 'firebase/firestore';
import { toast } from 'react-hot-toast';

interface TouristSpot {
  id: string;
  name: string;
  description: string;
  image: string;
  location: string;
  barangay: string;
  category: string;
  contact?: string;
  entranceFee?: string;
  googleMapsLink?: string;
  detailedDescription?: string;
  status?: 'active' | 'inactive';
  createdAt?: any;
  updatedAt?: any;
}

export default function TouristSpots() {
  const { isBarangayAdmin, barangayAdminData } = useAuth();
  const [selectedBarangay, setSelectedBarangay] = useState<string>('all');
  const [selectedSpot, setSelectedSpot] = useState<TouristSpot | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedSpot, setEditedSpot] = useState<TouristSpot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize spots state
  const [spots, setSpots] = useState<TouristSpot[]>([]);

  // Fetch all tourist spots
  useEffect(() => {
    const fetchSpots = async () => {
      try {
        setLoading(true);
        const db = getFirestore();
        // Fetch all spots without any filters
        const q = query(collection(db, 'touristSpots'));
        
        const querySnapshot = await getDocs(q);
        const spotsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as TouristSpot[];
        
        setSpots(spotsData);
        setError(null);
      } catch (err) {
        console.error('Error fetching spots:', err);
        setError('Failed to load tourist spots. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchSpots();
  }, [isBarangayAdmin, barangayAdminData?.barangay]);

  // Get unique barangays from the fetched spots
  const barangays = ['all', ...Array.from(new Set(spots.map(spot => spot.barangay)))];

  // Filter spots based on selected barangay
  const filteredSpots = spots.filter(spot => {
    return selectedBarangay === 'all' || spot.barangay === selectedBarangay;
  });

  // Group spots by barangay for display
  const groupedSpots = filteredSpots.reduce((acc, spot) => {
    if (!acc[spot.barangay]) {
      acc[spot.barangay] = [];
    }
    acc[spot.barangay].push(spot);
    return acc;
  }, {} as Record<string, TouristSpot[]>);

  // Scroll to section when barangay is selected
  const scrollToSection = (barangay: string) => {
    if (barangay === 'all') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      const element = document.getElementById(`barangay-${barangay}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  useEffect(() => {
    if (selectedBarangay !== 'all') {
      scrollToSection(selectedBarangay);
    }
  }, [selectedBarangay]);

  const openDetails = (spot: TouristSpot) => {
    setSelectedSpot(spot);
    setEditedSpot({...spot});
    setShowDetails(true);
    setIsEditing(false);
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!editedSpot) return;
    
    try {
      // Update the document in Firestore
      const db = getFirestore();
      const spotRef = doc(db, 'touristSpots', editedSpot.id.toString());
      
      // Create an object with only the fields that should be updated
      const updateData = {
        name: editedSpot.name,
        description: editedSpot.description,
        location: editedSpot.location,
        category: editedSpot.category,
        contact: editedSpot.contact || '',
        entranceFee: editedSpot.entranceFee || '',
        detailedDescription: editedSpot.detailedDescription || '',
        googleMapsLink: editedSpot.googleMapsLink || '',
        updatedAt: new Date().toISOString()
      };
      
      // Update the document in Firestore
      await updateDoc(spotRef, updateData);
      
      // Update local state
      const updatedSpots = spots.map(spot => 
        spot.id === editedSpot.id ? { ...spot, ...updateData } : spot
      );
      
      setSelectedSpot(prev => prev ? { ...prev, ...updateData } : null);
      setEditedSpot(prev => prev ? { ...prev, ...updateData } : null);
      
      // Update the spots state
      setSpots(updatedSpots);
      
      // Show success message
      toast.success('Spot updated successfully!');
      setIsEditing(false);
      
      // Show success message
      toast.success('Tourist spot updated successfully!');
    } catch (error) {
      console.error('Error updating document: ', error);
      toast.error('Failed to update tourist spot. Please try again.');
    } finally {
      setIsEditing(false);
    }
  };

  const handleCancelEdit = () => {
    if (selectedSpot) {
      setEditedSpot({...selectedSpot});
    }
    setIsEditing(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    if (!editedSpot) return;
    
    const { name, value } = e.target;
    setEditedSpot({
      ...editedSpot,
      [name]: value
    });
  };

  const closeDetails = () => {
    setSelectedSpot(null);
    setShowDetails(false);
  };

  // If showing details, render the detail page
  if (showDetails && selectedSpot && editedSpot) {
    return (
      <div className="min-h-screen bg-egg-white">
        {/* Header with back button */}
        <div className="bg-light-green border-b border-border-green">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <button
              onClick={closeDetails}
              className="flex items-center gap-2 text-primary-green hover:text-accent-green font-medium transition-colors duration-300"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Tourist Spots
            </button>
          </div>
        </div>

        {/* Detail Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Image and Info */}
            <div className="space-y-6">
              {/* Image */}
              <div className="relative h-96 w-full rounded-lg overflow-hidden shadow-lg">
                <Image
                  src={selectedSpot.image}
                  alt={selectedSpot.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              </div>
              <div className="bg-light-green rounded-lg p-6">
                <div className="flex justify-between items-start">
                  {isEditing ? (
                    <input
                      type="text"
                      name="name"
                      value={editedSpot.name}
                      onChange={handleInputChange}
                      className="text-3xl font-bold text-primary-green bg-egg-white border border-border-green rounded px-3 py-1 w-full"
                    />
                  ) : (
                    <h1 className="text-3xl font-bold text-primary-green">{selectedSpot.name}</h1>
                  )}
                  
                  {isBarangayAdmin && barangayAdminData?.barangay === selectedSpot.barangay && (
                    <div className="flex gap-2">
                      {isEditing ? (
                        <>
                          <button
                            onClick={handleSave}
                            className="bg-primary-green text-egg-white px-3 py-1 rounded text-sm font-medium hover:bg-opacity-90 transition-colors"
                          >
                            Save
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="bg-gray-300 text-primary-green px-3 py-1 rounded text-sm font-medium hover:bg-opacity-90 transition-colors"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={handleEdit}
                          className="bg-accent-green text-egg-white px-3 py-1 rounded text-sm font-medium hover:bg-opacity-90 transition-colors"
                        >
                          Edit Spot
                        </button>
                      )}
                    </div>
                  )}
                </div>
                <div className="space-y-4">
                  {/* Category */}
                  <div>
                    <h3 className="font-semibold text-primary-green mb-1">Category</h3>
                    {isEditing ? (
                      <select
                        name="category"
                        value={editedSpot.category}
                        onChange={handleInputChange}
                        className="w-full p-2 border border-border-green rounded text-primary-green"
                      >
                        <option value="Agricultural Heritage">Agricultural Heritage</option>
                        <option value="Natural Attractions">Natural Attractions</option>
                        <option value="Waterfalls">Waterfalls</option>
                        <option value="Caves">Caves</option>
                        <option value="Mountains & Hiking">Mountains & Hiking</option>
                        <option value="Cultural Heritage">Cultural Heritage</option>
                        <option value="Viewing Areas">Viewing Areas</option>
                        <option value="Gardens & Farms">Gardens & Farms</option>
                        <option value="Adventure & Recreation">Adventure & Recreation</option>
                        <option value="Infrastructure">Infrastructure</option>
                      </select>
                    ) : (
                      <span className="bg-accent-green text-egg-white px-3 py-1 rounded-full text-sm font-medium">
                        {selectedSpot.category}
                      </span>
                    )}
                  </div>

                  {/* Location */}
                  <div>
                    <h3 className="font-semibold text-primary-green mb-1">Location</h3>
                    {isEditing ? (
                      <input
                        type="text"
                        name="location"
                        value={editedSpot.location}
                        onChange={handleInputChange}
                        className="w-full p-2 border border-border-green rounded text-primary-green"
                      />
                    ) : (
                      <p className="text-primary-green/70">{selectedSpot.location}</p>
                    )}
                  </div>

                  {/* Barangay - Not editable */}
                  <div>
                    <h3 className="font-semibold text-primary-green mb-1">Barangay</h3>
                    <p className="text-primary-green/70">{selectedSpot.barangay}</p>
                  </div>

                  {/* Contact */}
                  <div>
                    <h3 className="font-semibold text-primary-green mb-1">Contact</h3>
                    {isEditing ? (
                      <input
                        type="text"
                        name="contact"
                        value={editedSpot.contact || ''}
                        onChange={handleInputChange}
                        placeholder="Contact information"
                        className="w-full p-2 border border-border-green rounded text-primary-green"
                      />
                    ) : selectedSpot.contact ? (
                      <p className="text-primary-green/70">{selectedSpot.contact}</p>
                    ) : (
                      <p className="text-primary-green/70 italic">No contact information available</p>
                    )}
                  </div>

                  {/* Entrance Fee */}
                  <div>
                    <h3 className="font-semibold text-primary-green mb-1">Entrance Fee</h3>
                    {isEditing ? (
                      <input
                        type="text"
                        name="entranceFee"
                        value={editedSpot.entranceFee || ''}
                        onChange={handleInputChange}
                        placeholder="e.g., Free or ₱100 per person"
                        className="w-full p-2 border border-border-green rounded text-primary-green"
                      />
                    ) : selectedSpot.entranceFee ? (
                      <p className="text-primary-green/70 font-medium">{selectedSpot.entranceFee}</p>
                    ) : (
                      <p className="text-primary-green/70 italic">No entrance fee information available</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Description and Map */}
            <div className="space-y-6">
              {/* Description */}
              <div className="bg-egg-white border border-border-green rounded-lg p-6 shadow-md">
                <h2 className="text-2xl font-semibold text-primary-green mb-4">Description</h2>
                {isEditing ? (
                  <textarea
                    name="detailedDescription"
                    value={editedSpot.detailedDescription || editedSpot.description}
                    onChange={handleInputChange}
                    rows={8}
                    className="w-full p-3 border border-border-green rounded text-primary-green/70 leading-relaxed"
                  />
                ) : (
                  <p className="text-primary-green/70 leading-relaxed">
                    {selectedSpot.detailedDescription || selectedSpot.description}
                  </p>
                )}
              </div>

              {/* Google Maps Link */}
              <div className="bg-egg-white border border-border-green rounded-lg p-6 shadow-md">
                <h2 className="text-2xl font-semibold text-primary-green mb-4">Google Maps Link</h2>
                {isEditing ? (
                  <input
                    type="url"
                    name="googleMapsLink"
                    value={editedSpot.googleMapsLink || ''}
                    onChange={handleInputChange}
                    placeholder="https://maps.google.com/..."
                    className="w-full p-2 border border-border-green rounded text-primary-green"
                  />
                ) : selectedSpot.googleMapsLink ? (
                  <a
                    href={selectedSpot.googleMapsLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent-green hover:underline inline-flex items-center gap-1"
                  >
                    <span>View on Google Maps</span>
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                    </svg>
                    Open in Google Maps
                  </a>
                ) : (
                  <p className="text-primary-green/70 italic">No Google Maps link available</p>
                )}
              </div>
              
              {/* Google Maps Embed */}
              {selectedSpot.googleMapsLink && !isEditing && (
                <div className="bg-egg-white border border-border-green rounded-lg p-6 shadow-md">
                  <h2 className="text-2xl font-semibold text-primary-green mb-4">Location Map</h2>
                  <div className="relative w-full h-96 rounded-lg overflow-hidden">
                    <iframe
                      src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d122344.74121741697!2d120.51233228135519!3d16.613054265539382!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3391beeacea4804b%3A0x70049a733cf9916b!2sKapangan%2C%20Benguet!5e0!3m2!1sen!2sph!4v1758168375066!5m2!1sen!2sph"
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      title="Map of Kapangan, Benguet"
                    ></iframe>
                  </div>
                  <div className="mt-4">
                    <a
                      href={selectedSpot.googleMapsLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-accent-green hover:text-primary-green font-medium transition-colors duration-300"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                      Open in Google Maps
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-egg-white">

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {/* Filter Navigation */}
        <div className="mb-8">
          <div className="bg-light-green rounded-lg p-6 shadow-md">
            <h2 className="text-2xl font-semibold text-primary-green mb-4">Barangay</h2>
            <div className="flex flex-wrap gap-2">
              {barangays.map((barangay) => (
                <button
                  key={barangay}
                  onClick={() => setSelectedBarangay(barangay)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                    selectedBarangay === barangay
                      ? 'bg-primary-green text-egg-white shadow-md scale-105'
                      : 'bg-egg-white text-primary-green border border-border-green hover:bg-accent-green hover:text-egg-white hover:scale-105'
                  }`}
                >
                  {barangay === 'all' ? 'All Barangays' : barangay}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results Summary */}
        <div className="mb-8 text-center">
          <p className="text-lg text-primary-green/80">
            Showing {filteredSpots.length} tourist spot{filteredSpots.length !== 1 ? 's' : ''}
            {selectedBarangay !== 'all' && ` in ${selectedBarangay}`}
          </p>
        </div>

        {/* Tourist Spots by Barangay */}
        {Object.keys(groupedSpots).length > 0 ? (
          <div className="space-y-12">
            {Object.entries(groupedSpots).map(([barangay, spots]) => (
              <div key={barangay} id={`barangay-${barangay}`} className="scroll-mt-20">
                <div className="mb-6">
                  <h2 className="text-3xl font-bold text-primary-green mb-2">
                    {barangay}
                  </h2>
                  <div className="h-1 w-20 bg-accent-green rounded-full"></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {spots.map((spot) => (
                    <div key={spot.id} className="bg-egg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 border border-border-green hover:scale-105 group">
                      <div className="relative h-48 w-full">
                        <Image
                          src={spot.image}
                          alt={spot.name}
                          fill
                          className="object-cover group-hover:scale-110 transition-transform duration-300"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                        <div className="absolute top-2 right-2 bg-accent-green text-egg-white px-2 py-1 rounded-full text-xs font-medium">
                          {spot.category}
                        </div>
                      </div>
                      <div className="p-6">
                        <h3 className="text-xl font-semibold text-primary-green mb-2 group-hover:text-accent-green transition-colors duration-300">
                          {spot.name}
                        </h3>
                        <p className="text-primary-green/70 mb-3 line-clamp-3">{spot.description}</p>
                        <p className="text-sm text-accent-green font-medium mb-4">{spot.location}</p>
                        <button
                          onClick={() => openDetails(spot)}
                          className="w-full bg-primary-green hover:bg-accent-green text-egg-white px-4 py-2 rounded-lg font-medium transition-all duration-300 hover:scale-105 shadow-md hover:shadow-lg"
                        >
                          View More
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-2xl font-semibold text-primary-green mb-2">No Results Found</h3>
            <p className="text-primary-green/70 mb-6">
              Try selecting a different barangay to see more tourist spots.
            </p>
            <button
              onClick={() => setSelectedBarangay('all')}
              className="bg-primary-green hover:bg-accent-green text-egg-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 hover:scale-105"
            >
              Clear Filter
            </button>
          </div>
        )}

        <div className="text-center mt-12">
          <p className="text-primary-green/80 mb-4">
            Explore these amazing tourist destinations in Kapangan, Benguet. Each location offers unique experiences and breathtaking natural beauty.
          </p>
          <button className="bg-primary-green hover:bg-accent-green text-egg-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl">
            Plan Your Visit
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-primary-green text-egg-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-2xl font-bold text-light-green mb-4">Kapangan Wonder</h3>
              <p className="text-light-green/80">
                Discover the natural beauty and cultural richness of Kapangan, Benguet.
              </p>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <li><Link href="/tourist-spots" className="text-light-green/80 hover:text-egg-white">Tourist Spots</Link></li>
                <li><Link href="/eat-and-stay" className="text-light-green/80 hover:text-egg-white">Eat & Stay</Link></li>
                <li><Link href="/blogs" className="text-light-green/80 hover:text-egg-white">Blogs</Link></li>
                <li><Link href="/contact" className="text-light-green/80 hover:text-egg-white">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Support</h4>
              <ul className="space-y-2">
                <li><Link href="/contact" className="text-light-green/80 hover:text-egg-white">Help Center</Link></li>
                <li><Link href="/contact" className="text-light-green/80 hover:text-egg-white">Contact Us</Link></li>
                <li><Link href="/signin" className="text-light-green/80 hover:text-egg-white">Sign In</Link></li>
                <li><Link href="/signup" className="text-light-green/80 hover:text-egg-white">Sign Up</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Follow Us</h4>
              <div className="flex space-x-4">
                <a href="#" className="text-light-green/80 hover:text-egg-white text-2xl">📘</a>
                <a href="#" className="text-light-green/80 hover:text-egg-white text-2xl">🐦</a>
                <a href="#" className="text-light-green/80 hover:text-egg-white text-2xl">📷</a>
                <a href="#" className="text-light-green/80 hover:text-egg-white text-2xl">📺</a>
              </div>
            </div>
          </div>
          <div className="border-t border-border-green mt-8 pt-8 text-center text-light-green/80">
            <p>&copy; 2024 Kapangan Wonder. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
function setSpots(updatedSpots: TouristSpot[]) {
  throw new Error('Function not implemented.');
}

