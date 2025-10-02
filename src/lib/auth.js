import { auth, db, googleProvider, signInWithPopup, signOut, doc, setDoc, getDoc } from './firebase';

// Function to handle Google Sign In/Sign Up
export const signInWithGoogle = async () => {
  try {
    console.log('Starting Google sign-in process...');
    console.log('Firebase auth domain:', auth.config?.authDomain);
    
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    
    console.log('Google sign-in successful for user:', user.email);
    
    // Check if user document exists in Firestore
    const userDocRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);
    
    if (!userDoc.exists()) {
      console.log('Creating new user document for:', user.email);
      // Create new user document
      await setDoc(userDocRef, {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        provider: 'google',
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        isActive: true
      });
    } else {
      console.log('Updating last login for existing user:', user.email);
      // Update last login time
      await setDoc(userDocRef, {
        lastLogin: new Date().toISOString()
      }, { merge: true });
    }
    
    return { success: true, user };
  } catch (error) {
    console.error('Google sign-in error details:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    
    // Provide specific guidance for common errors
    let userFriendlyError = error.message;
    if (error.code === 'auth/operation-not-allowed') {
      userFriendlyError = 'Google sign-in is not enabled. Please enable it in your Firebase Console under Authentication > Sign-in method > Google.';
    } else if (error.code === 'auth/popup-blocked') {
      userFriendlyError = 'Popup was blocked. Please allow popups for this site and try again.';
    } else if (error.code === 'auth/cancelled-popup-request') {
      userFriendlyError = 'The sign-in popup was closed before completion. Please try again.';
    }
    
    return { success: false, error: userFriendlyError };
  }
};

// Function to handle user sign out
export const logout = async () => {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error) {
    console.error('Logout error:', error);
    return { success: false, error: error.message };
  }
};

// Function to get current user
export const getCurrentUser = () => {
  return auth.currentUser;
};

// Function to check if user is authenticated
export const isAuthenticated = () => {
  return auth.currentUser !== null;
};

// Function to get user data from Firestore
export const getUserData = async (uid) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      return userDoc.data();
    }
    return null;
  } catch (error) {
    console.error('Get user data error:', error);
    return null;
  }
};