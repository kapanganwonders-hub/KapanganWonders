"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import toast from 'react-hot-toast';

interface FooterContent {
  description: string;
  address: string;
  email: string;
  phone: string;
  copyright: string;
}

export default function Footer() {
  const { currentUser, isAdmin } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [footerContent, setFooterContent] = useState<FooterContent>({
    description: 'Discover the natural beauty and cultural richness of Kapangan, Benguet. Experience the perfect blend of nature, adventure, and local culture.',
    address: '123 Tourism Road, Poblacion, Kapangan, Benguet, Philippines',
    email: 'info@kapanganwonders.com',
    phone: '+63 912 345 6789',
    copyright: `© ${new Date().getFullYear()} Kapangan Wonder. All rights reserved.`
  });
  const [editContent, setEditContent] = useState<FooterContent>({ ...footerContent });

  useEffect(() => {
    const fetchFooterContent = async () => {
      try {
        const docRef = doc(db, 'siteContent', 'footer');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setFooterContent(docSnap.data() as FooterContent);
          setEditContent(docSnap.data() as FooterContent);
        }
      } catch (error) {
        console.error('Error fetching footer content:', error);
      }
    };

    fetchFooterContent();
  }, []);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const docRef = doc(db, 'siteContent', 'footer');
      await setDoc(docRef, editContent);
      setFooterContent({ ...editContent });
      setIsEditing(false);
      toast.success('Footer content saved successfully!');
    } catch (error) {
      console.error('Error saving footer content:', error);
      toast.error('Failed to save footer content. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (field: keyof FooterContent, value: string) => {
    setEditContent(prev => ({
      ...prev,
      [field]: value
    }));
  };
  return (
    <footer className="bg-gradient-to-b from-green-100 to-green-200 text-black border-t-8 border-green-300 [&_*]:text-black relative">
      {/* Admin Controls */}
      {isAdmin && (
        <div className="absolute top-4 right-4 z-10">
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 bg-white border-2 border-primary-green text-primary-green hover:bg-green-50 px-4 py-2 rounded-lg shadow-md transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.793.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
              </svg>
              Manage Footer
            </button>
          ) : (
            <div className="flex gap-3">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg shadow-md transition-colors border-2 ${
                  isSaving 
                    ? 'bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed' 
                    : 'bg-white border-green-600 text-green-600 hover:bg-green-50'
                }`}
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                onClick={() => {
                  setEditContent({ ...footerContent });
                  setIsEditing(false);
                }}
                disabled={isSaving}
                className="flex items-center gap-2 bg-white border-2 border-red-600 text-red-600 hover:bg-red-50 px-4 py-2 rounded-lg shadow-md transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      )}
      
      {/* Mobile Only Copyright */}
      <div className="md:hidden py-4 text-center text-gray-700">
        <p className="text-sm">{footerContent.copyright}</p>
      </div>
      
      {/* Desktop Footer */}
      <div className="hidden md:block py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div>
            <h3 className="text-2xl font-bold text-green-800 mb-6 flex items-center">
              <span className="inline-block mr-2">🌿</span>
              Kapangan Wonder
            </h3>
            <div className="relative">
              {isEditing ? (
                <textarea
                  value={editContent.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  className="w-full p-2 border rounded text-gray-800 leading-relaxed"
                  rows={3}
                />
              ) : (
                <p className="text-gray-800 leading-relaxed">
                  {footerContent.description}
                </p>
              )}
              {isAdmin && !isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="absolute -top-6 right-0 text-xs bg-green-100 hover:bg-green-200 text-green-800 px-2 py-1 rounded"
                >
                  Edit
                </button>
              )}
            </div>
          </div>
          <div>
            <h4 className="text-lg font-semibold text-green-800 mb-6 flex items-center">
              <span className="inline-block mr-2">🔗</span>
              Quick Links
            </h4>
            <ul className="space-y-3">
              <li><Link href="/tourist-spots" className="text-gray-800 hover:text-green-700 transition-colors flex items-center">
                <span className="inline-block w-1.5 h-1.5 bg-green-700 rounded-full mr-2"></span>
                Tourist Spots
              </Link></li>
              <li><Link href="/blogs" className="text-gray-800 hover:text-green-700 transition-colors flex items-center">
                <span className="inline-block w-1.5 h-1.5 bg-green-700 rounded-full mr-2"></span>
                Travel Blogs
              </Link></li>
              <li><Link href="/contact" className="text-gray-800 hover:text-green-700 transition-colors flex items-center">
                <span className="inline-block w-1.5 h-1.5 bg-green-700 rounded-full mr-2"></span>
                Contact Us
              </Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-lg font-semibold text-green-800 mb-6 flex items-center">
              <span className="inline-block mr-2">📍</span>
              Visit Us
            </h4>
            <div className="space-y-4">
              <p className="text-gray-800 flex items-start">
                <svg className="h-5 w-5 text-green-700 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {isEditing ? (
                  <input
                    type="text"
                    value={editContent.address}
                    onChange={(e) => handleChange('address', e.target.value)}
                    className="w-full p-1 border rounded text-gray-800"
                  />
                ) : (
                  <span>{footerContent.address}</span>
                )}
              </p>
              <p className="text-green-100 flex items-center">
                <svg className="h-5 w-5 text-green-300 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                {isEditing ? (
                  <input
                    type="email"
                    value={editContent.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    className="w-full p-1 border rounded text-gray-800"
                  />
                ) : (
                  <span>{footerContent.email}</span>
                )}
              </p>
              <p className="text-green-100 flex items-center">
                <svg className="h-5 w-5 text-green-300 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                {isEditing ? (
                  <input
                    type="tel"
                    value={editContent.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    className="w-full p-1 border rounded text-gray-800"
                  />
                ) : (
                  <span>{footerContent.phone}</span>
                )}
              </p>
            </div>
          </div>
          </div>
          <div className="border-t border-green-400 mt-12 pt-8 text-center text-gray-700">
            <div className="relative">
              {isEditing ? (
                <div className="flex items-center justify-center">
                  <input
                    type="text"
                    value={editContent.copyright}
                    onChange={(e) => handleChange('copyright', e.target.value)}
                    className="text-center p-1 border rounded text-black text-sm w-full"
                  />
                </div>
              ) : (
                <p className="text-sm">{footerContent.copyright}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
