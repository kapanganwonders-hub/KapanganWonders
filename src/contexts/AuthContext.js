'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { checkIsAdmin, ADMIN_EMAIL } from '@/lib/admin';
import { checkIsBarangayAdmin } from '@/lib/barangayAdmin';
import { checkIsPrivateSpotAdmin } from '@/lib/privateSpotAdmin';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isBarangayAdmin, setIsBarangayAdmin] = useState(false);
  const [barangayAdminData, setBarangayAdminData] = useState(null);
  const [isPrivateSpotAdmin, setIsPrivateSpotAdmin] = useState(false);
  const [privateSpotAdminData, setPrivateSpotAdminData] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        // Check if the user is an admin
        const adminStatus = await checkIsAdmin(user);
        setIsAdmin(adminStatus);
        
        // Check if the user is a barangay admin
        const barangayStatus = await checkIsBarangayAdmin(user);
        if (barangayStatus && barangayStatus.isBarangayAdmin) {
          setIsBarangayAdmin(true);
          setBarangayAdminData(barangayStatus.data);
        } else {
          setIsBarangayAdmin(false);
          setBarangayAdminData(null);
        }
        
        // Check if the user is a private spot admin
        const privateSpotStatus = await checkIsPrivateSpotAdmin(user);
        if (privateSpotStatus && privateSpotStatus.isPrivateSpotAdmin) {
          setIsPrivateSpotAdmin(true);
          setPrivateSpotAdminData(privateSpotStatus.data);
        } else {
          setIsPrivateSpotAdmin(false);
          setPrivateSpotAdminData(null);
        }
      } else {
        setIsAdmin(false);
        setIsBarangayAdmin(false);
        setBarangayAdminData(null);
        setIsPrivateSpotAdmin(false);
        setPrivateSpotAdminData(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    loading,
    isAdmin,
    isBarangayAdmin,
    barangayAdminData,
    isPrivateSpotAdmin,
    privateSpotAdminData,
    adminEmail: ADMIN_EMAIL
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};