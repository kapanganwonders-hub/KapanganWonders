'use client';

import { db } from '@/firebase/config';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';

// Function to check if a user is a private spot admin by checking the database
export const checkIsPrivateSpotAdmin = async (user) => {
  if (!user) {
    console.log('🏢 No user provided');
    return false;
  }
  
  try {
    console.log('🏢 Checking private spot admin status for:', user.email, 'UID:', user.uid);
    
    // First, try to check by UID directly (most reliable)
    try {
      const userDocRef = doc(db, 'privateSpotOwners', user.uid);
      const userDocSnap = await getDoc(userDocRef);
      
      if (userDocSnap.exists()) {
        const privateSpotAdminData = userDocSnap.data();
        console.log('🏢 Private Spot Admin found by UID:', privateSpotAdminData);
        return {
          isPrivateSpotAdmin: true,
          businessName: privateSpotAdminData.businessName || privateSpotAdminData.displayName,
          data: privateSpotAdminData
        };
      }
    } catch (uidError) {
      console.log('🏢 UID check failed, trying email query:', uidError.message);
    }
    
    // If UID check fails, try email query
    if (user.email) {
      const privateSpotOwnersRef = collection(db, 'privateSpotOwners');
      const q = query(privateSpotOwnersRef, where('email', '==', user.email));
      const querySnapshot = await getDocs(q);
      
      console.log('🏢 Email query results:', querySnapshot.size, 'documents found');
      
      if (!querySnapshot.empty) {
        const privateSpotAdminData = querySnapshot.docs[0].data();
        console.log('🏢 Private Spot Admin found by email:', privateSpotAdminData);
        return {
          isPrivateSpotAdmin: true,
          businessName: privateSpotAdminData.businessName || privateSpotAdminData.displayName,
          data: privateSpotAdminData
        };
      }
      
      // Try lowercase comparison if exact match fails
      const qLower = query(privateSpotOwnersRef, where('email', '==', user.email.toLowerCase()));
      const querySnapshotLower = await getDocs(qLower);
      
      if (!querySnapshotLower.empty) {
        const privateSpotAdminData = querySnapshotLower.docs[0].data();
        console.log('🏢 Private Spot Admin found by lowercase email:', privateSpotAdminData);
        return {
          isPrivateSpotAdmin: true,
          businessName: privateSpotAdminData.businessName || privateSpotAdminData.displayName,
          data: privateSpotAdminData
        };
      }
    }
    
    console.log('🏢 No private spot admin found for this user');
    return false;
  } catch (error) {
    console.error('Error checking private spot admin status:', error);
    return false;
  }
};

// Function to get private spot admin data
export const getPrivateSpotAdminData = async (userId) => {
  if (!userId) return null;
  
  try {
    const privateSpotOwnersRef = collection(db, 'privateSpotOwners');
    const q = query(privateSpotOwnersRef, where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      return querySnapshot.docs[0].data();
    }
    
    return null;
  } catch (error) {
    console.error('Error getting private spot admin data:', error);
    return null;
  }
};
