'use client';

import { db } from '@/firebase/config';
import { doc, setDoc } from 'firebase/firestore';

// Admin email constant - this is the main admin
export const ADMIN_EMAIL = 'kapanganwonders@gmail.com';

// Function to check if a user is an admin - direct check for kapanganwonders@gmail.com
export const checkIsAdmin = (user) => {
  if (!user || !user.email) return false;
  
  // Direct check if the user's email is kapanganwonders@gmail.com
  // Using toLowerCase() to make the comparison case-insensitive
  const isAdmin = user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
  
  // If user is admin, save to database (don't wait for this to complete)
  if (isAdmin) {
    saveAdminToDatabase(user).catch(console.error);
  }
  
  return isAdmin;
};

// Function to save the admin user to the database
export const saveAdminToDatabase = async (user) => {
  if (!user || !user.email) return;
  
  // Double-check this is the admin
  if (user.email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) return;
  
  try {
    // Save admin info to Firestore
    const adminRef = doc(db, 'admins', user.uid);
    await setDoc(adminRef, {
      email: user.email,
      displayName: user.displayName || 'Main Admin',
      role: 'main_admin',
      isAdmin: true, // Explicit flag
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString()
    }, { merge: true });
    
    console.log('Admin saved to database successfully');
  } catch (error) {
    console.error('Error saving admin to database:', error);
  }
};