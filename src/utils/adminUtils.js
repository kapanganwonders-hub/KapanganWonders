import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

/**
 * Check if the current user is an admin
 * @param {string} userId - The user's ID
 * @returns {Promise<boolean>} - True if the user is an admin, false otherwise
 */
export const checkAdminStatus = async (userId) => {
  if (!userId) return false;
  
  try {
    const adminDoc = await getDoc(doc(db, 'admins', userId));
    return adminDoc.exists();
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
};

/**
 * Get admin data for a user
 * @param {string} userId - The user's ID
 * @returns {Promise<Object|null>} - Admin data if user is admin, null otherwise
 */
export const getAdminData = async (userId) => {
  if (!userId) return null;
  
  try {
    const adminDoc = await getDoc(doc(db, 'admins', userId));
    return adminDoc.exists() ? { id: adminDoc.id, ...adminDoc.data() } : null;
  } catch (error) {
    console.error('Error getting admin data:', error);
    return null;
  }
};
