'use client';

import { db } from '@/firebase/config';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';

// Function to check if a user is a barangay admin by checking the database
export const checkIsBarangayAdmin = async (user) => {
  console.log('🏘️ checkIsBarangayAdmin called with user:', { 
    uid: user?.uid, 
    email: user?.email 
  });
  
  if (!user || !user.email) {
    console.log('🏘️ No user or email provided');
    return { isBarangayAdmin: false };
  }
  
  try {
    console.log('🏘️ Checking barangay admin status for user:', { 
      email: user.email, 
      uid: user.uid 
    });
    
    const barangayAdminsRef = collection(db, 'barangayAdmins');
    
    // First, try to find by userId (more reliable)
    const qByUid = query(barangayAdminsRef, where('userId', '==', user.uid));
    console.log('🏘️ Querying barangayAdmins by UID:', user.uid);
    const uidQuerySnapshot = await getDocs(qByUid);
    
    if (!uidQuerySnapshot.empty) {
      const docData = uidQuerySnapshot.docs[0].data();
      const barangayAdminData = {
        ...docData,
        id: uidQuerySnapshot.docs[0].id
      };
      
      console.log('🏘️ Barangay Admin found by UID:', {
        documentId: uidQuerySnapshot.docs[0].id,
        data: barangayAdminData,
        hasBarangayName: !!barangayAdminData.barangayName,
        hasDisplayName: !!barangayAdminData.displayName
      });
      
      return {
        isBarangayAdmin: true,
        barangayName: barangayAdminData.barangay || barangayAdminData.barangayName || barangayAdminData.displayName || 'Unknown Barangay',
        data: barangayAdminData
      };
    }
    
    // If not found by UID, try by email (for backward compatibility)
    const qByEmail = query(barangayAdminsRef, where('email', '==', user.email));
    const emailQuerySnapshot = await getDocs(qByEmail);
    
    if (!emailQuerySnapshot.empty) {
      const docData = emailQuerySnapshot.docs[0].data();
      const barangayAdminData = {
        ...docData,
        id: emailQuerySnapshot.docs[0].id
      };
      
      console.log('🏘️ Barangay Admin found by email:', {
        documentId: emailQuerySnapshot.docs[0].id,
        data: barangayAdminData,
        hasBarangay: !!barangayAdminData.barangay,
        hasBarangayName: !!barangayAdminData.barangayName,
        hasDisplayName: !!barangayAdminData.displayName
      });
      
      // Update the document to include userId for future lookups
      if (!barangayAdminData.userId) {
        console.log('🏘️ Updating document with userId for future lookups');
        // Note: You might want to add this update logic if needed
      }
      
      return {
        isBarangayAdmin: true,
        barangayName: barangayAdminData.barangay || barangayAdminData.barangayName || barangayAdminData.displayName || 'Unknown Barangay',
        data: barangayAdminData
      };
    }
    
    // Try lowercase email comparison if still not found
    const qByEmailLower = query(barangayAdminsRef, where('email', '==', user.email.toLowerCase()));
    const emailLowerQuerySnapshot = await getDocs(qByEmailLower);
    
    if (!emailLowerQuerySnapshot.empty) {
      const barangayAdminData = emailLowerQuerySnapshot.docs[0].data();
      console.log('🏘️ Barangay Admin found by lowercase email:', barangayAdminData);
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
