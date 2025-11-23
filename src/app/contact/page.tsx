'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { CheckCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { Save } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/lightswind/alert';

interface ContactInfo {
  icon: string;
  title: string;
  details: string;
}

interface TravelInfo {
  title: string;
  description: string;
  time: string;
  distance?: string;
  price?: string;
}

export default function Contact() {
  const { currentUser, isAdmin } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const [contactInfo, setContactInfo] = useState<ContactInfo[]>([
    {
      icon: "🏢",
      title: "Office Location",
      details: "Municipal Tourism Office, Kapangan, Benguet"
    },
    {
      icon: "📞",
      title: "Phone",
      details: "+63 (123) 456-7890"
    },
    {
      icon: "✉️",
      title: "Email",
      details: "info@kapanganwonders.com"
    },
    {
      icon: "⏰",
      title: "Office Hours",
      details: "Monday - Friday: 8:00 AM - 5:00 PM"
    }
  ]);

  const [travelInfo, setTravelInfo] = useState<TravelInfo[]>([
    {
      title: "By Private Vehicle",
      description: "From Baguio City: Take the Naguilian Road towards La Trinidad. Continue to Kapangan via the Benguet-Nueva Vizcaya Road.",
      time: "1.5–2 hours",
      distance: "~45 km"
    },
    {
      title: "By Public Transportation",
      description: "Regular buses and jeepneys depart from Baguio's Dangwa Terminal to Kapangan.",
      time: "~2 hours",
      price: "₱80–₱100"
    }
  ]);

  useEffect(() => {
    const fetchContactData = async () => {
      try {
        const docRef = doc(db, 'content', 'contact');
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.contactInfo) setContactInfo(data.contactInfo);
          if (data.travelInfo) setTravelInfo(data.travelInfo);
        }
      } catch (error) {
        console.error("Error fetching contact data: ", error);
      }
    };

    fetchContactData();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleContactInfoChange = (index: number, field: keyof ContactInfo, value: string) => {
    const updatedInfo = [...contactInfo];
    updatedInfo[index] = { ...updatedInfo[index], [field]: value };
    setContactInfo(updatedInfo);
  };

  const handleTravelInfoChange = (index: number, field: keyof TravelInfo, value: string) => {
    const updatedInfo = [...travelInfo];
    updatedInfo[index] = { ...updatedInfo[index], [field]: value };
    setTravelInfo(updatedInfo);
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const docRef = doc(db, 'content', 'contact');
      await setDoc(docRef, {
        contactInfo,
        travelInfo,
        lastUpdated: new Date()
      }, { merge: true });
      
      setIsEditing(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error("Error saving contact information: ", error);
      alert('Failed to save contact information. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
    setFormData({ name: '', email: '', subject: '', message: '' });
  };

  return (
    <div className="min-h-screen bg-egg-white">
      {/* Hero Section with Green Gradient */}
      <div className="bg-gradient-to-b from-green-100 to-green-200 text-black py-12 md:py-16 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-3xl sm:text-4xl font-bold">Contact Us</h1>
          <p className="mt-3 sm:mt-4 text-lg sm:text-xl text-gray-800 max-w-3xl mx-auto">
            Reach out to the Municipal Tourism Office for inquiries and assistance.
          </p>
        </div>
      </div>
      {isAdmin && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          <div className="flex justify-end mb-4">
            {isEditing ? (
              <div className="flex space-x-3">
                <button
                  onClick={handleSave}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                  disabled={isSaving}
                >
                  {isSaving ? (
                    'Saving...'
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Edit Content
              </button>
            )}
          </div>
        </div>
      )}

      {showSuccess && (
        <div className="fixed bottom-4 right-4 z-50 max-w-sm w-full">
          <div className="bg-white rounded-lg shadow-lg border-l-4 border-green-500 overflow-hidden">
            <div className="p-4">
              <div className="flex items-start">
                <CheckCircleIcon className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" aria-hidden="true" />
                <div className="ml-3 flex-1">
                  <p className="text-sm font-medium text-green-800">
                    Success
                  </p>
                  <p className="mt-1 text-sm text-green-700">
                    {isEditing ? 'Changes saved successfully!' : 'Thank you for your message! We will get back to you soon.'}
                  </p>
                </div>
                <button
                  type="button"
                  className="ml-4 flex-shrink-0 rounded-md inline-flex text-green-500 hover:text-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  onClick={() => setShowSuccess(false)}
                >
                  <span className="sr-only">Close</span>
                  <XMarkIcon className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
          {/* Left Column - Our Office */}
          <div className="bg-white p-5 sm:p-6 md:p-8 rounded-lg shadow-md">
            <div className="flex items-center mb-6 sm:mb-8">
              <div className="bg-green-100 p-3 rounded-full mr-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-primary-green">Our Office</h2>
            </div>
            <div className="space-y-6">
              {contactInfo.map((info, index) => (
                <div key={index} className="flex items-start space-x-3 sm:space-x-4">
                  {isEditing ? (
                    <select
                      value={info.icon}
                      onChange={(e) => handleContactInfoChange(index, 'icon', e.target.value)}
                      className="text-2xl bg-white border rounded p-1"
                    >
                      <option value="🏢">🏢</option>
                      <option value="📞">📞</option>
                      <option value="✉️">✉️</option>
                      <option value="⏰">⏰</option>
                      <option value="📍">📍</option>
                      <option value="🌐">🌐</option>
                    </select>
                  ) : (
                    <div className="text-xl sm:text-2xl text-primary-green">{info.icon}</div>
                  )}
                  <div className="flex-1">
                    {isEditing ? (
                      <input
                        type="text"
                        value={info.title}
                        onChange={(e) => handleContactInfoChange(index, 'title', e.target.value)}
                        className="w-full font-semibold text-lg text-gray-800 bg-gray-50 border rounded p-1 mb-1"
                      />
                    ) : (
                      <h3 className="text-lg font-semibold text-gray-800">{info.title}</h3>
                    )}
                    {isEditing ? (
                      <input
                        type="text"
                        value={info.details}
                        onChange={(e) => handleContactInfoChange(index, 'details', e.target.value)}
                        className="w-full text-gray-600 bg-gray-50 border rounded p-1"
                      />
                    ) : (
                      <p className="text-gray-600">{info.details}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column - Getting to Kapangan */}
          <div className="bg-white p-5 sm:p-6 md:p-8 rounded-lg shadow-md">
            <div className="flex items-center mb-6 sm:mb-8">
              <div className="bg-green-100 p-3 rounded-full mr-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-primary-green">Getting to Kapangan</h2>
            </div>
            
            <div className="space-y-6 sm:space-y-8">
              {travelInfo.map((info, index) => (
                <div key={index} className="flex">
                  <div className="flex-shrink-0 mr-3 sm:mr-4 mt-1">
                    <div className={`${index % 2 === 0 ? 'bg-blue-100' : 'bg-green-100'} p-3 rounded-full`}>
                      {index % 2 === 0 ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                        </svg>
                      )}
                    </div>
                  </div>
                  <div className={`border-l-4 ${index % 2 === 0 ? 'border-blue-400' : 'border-green-400'} pl-3 sm:pl-4 flex-1`}>
                    {isEditing ? (
                      <input
                        type="text"
                        value={info.title}
                        onChange={(e) => handleTravelInfoChange(index, 'title', e.target.value)}
                        className="w-full text-xl font-semibold text-gray-800 bg-gray-50 border rounded p-1 mb-2"
                      />
                    ) : (
                      <h3 className="text-xl font-semibold text-gray-800 mb-2">{info.title}</h3>
                    )}
                    
                    {isEditing ? (
                      <textarea
                        value={info.description}
                        onChange={(e) => handleTravelInfoChange(index, 'description', e.target.value)}
                        className="w-full text-gray-700 bg-gray-50 border rounded p-1 mb-3 h-20"
                      />
                    ) : (
                      <p className="text-gray-700 mb-3">{info.description}</p>
                    )}
                    
                    <div className="flex items-center text-gray-600 text-xs sm:text-sm flex-wrap gap-3 sm:gap-4">
                      <span className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {isEditing ? (
                          <input
                            type="text"
                            value={info.time}
                            onChange={(e) => handleTravelInfoChange(index, 'time', e.target.value)}
                            className="w-20 sm:w-24 bg-gray-50 border rounded p-1 text-sm"
                          />
                        ) : (
                          info.time
                        )}
                      </span>
                      
                      {info.distance && (
                        <span className="flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {isEditing ? (
                            <input
                              type="text"
                              value={info.distance}
                              onChange={(e) => handleTravelInfoChange(index, 'distance', e.target.value)}
                              className="w-20 sm:w-24 bg-gray-50 border rounded p-1 text-sm"
                            />
                          ) : (
                            info.distance
                          )}
                        </span>
                      )}
                      
                      {info.price && (
                        <span className="flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {isEditing ? (
                            <input
                              type="text"
                              value={info.price}
                              onChange={(e) => handleTravelInfoChange(index, 'price', e.target.value)}
                              className="w-20 sm:w-24 bg-gray-50 border rounded p-1 text-sm"
                            />
                          ) : (
                            info.price
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
