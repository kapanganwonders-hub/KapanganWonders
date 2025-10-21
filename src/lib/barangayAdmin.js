'use client';

import { db } from '@/firebase/config';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';

// Function to check if a user is a barangay admin by checking the database
export const checkIsBarangayAdmin = async (user) => {
  if (!user || !user.email) {
    console.log('🏘️ No user or email provided');
    return false;
  }
  
  try {
    console.log('🏘️ Checking barangay admin status for:', user.email);
    
    // Check in barangayAdmins collection - try exact match first
    const barangayAdminsRef = collection(db, 'barangayAdmins');
    const q = query(barangayAdminsRef, where('email', '==', user.email));
    const querySnapshot = await getDocs(q);
    
    console.log('🏘️ Query results:', querySnapshot.size, 'documents found');
    
    if (!querySnapshot.empty) {
      const barangayAdminData = querySnapshot.docs[0].data();
      console.log('🏘️ Barangay Admin found:', barangayAdminData);
      return {
        isBarangayAdmin: true,
        barangayName: barangayAdminData.barangayName || barangayAdminData.displayName,
        data: barangayAdminData
      };
    }
    
    // Try lowercase comparison if exact match fails
    const qLower = query(barangayAdminsRef, where('email', '==', user.email.toLowerCase()));
    const querySnapshotLower = await getDocs(qLower);
    
    if (!querySnapshotLower.empty) {
      const barangayAdminData = querySnapshotLower.docs[0].data();
      console.log('🏘️ Barangay Admin found (lowercase):', barangayAdminData);
      return {
        isBarangayAdmin: true,
        barangayName: barangayAdminData.barangayName || barangayAdminData.displayName,
        data: barangayAdminData
      };
    }
    
    console.log('🏘️ No barangay admin found for this email');
    return false;
  } catch (error) {
    console.error('Error checking barangay admin status:', error);
    return false;
  }
};

// Function to get barangay admin data
export const getBarangayAdminData = async (userId) => {
  if (!userId) return null;
  
  try {
    const barangayAdminsRef = collection(db, 'barangayAdmins');
    const q = query(barangayAdminsRef, where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      return querySnapshot.docs[0].data();
    }
    
    return null;
  } catch (error) {
    console.error('Error getting barangay admin data:', error);
    return null;
  }
};
