import {
  auth,
  db,
  googleProvider,
  signInWithPopup,
  signOut,
  doc,
  setDoc,
  getDoc
} from './firebase';

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile
} from 'firebase/auth'; // ✅ Import these from Firebase Auth, NOT from ./firebase

// 🖼️ Default profile image (stored in /public/assets/)
const DEFAULT_AVATAR = '/assets/default-avatar.png';

// Function to handle Google Sign In/Sign Up
export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;

    const userDocRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      await setDoc(userDocRef, {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL || DEFAULT_AVATAR,
        provider: 'google',
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        isActive: true
      });
    } else {
      await setDoc(
        userDocRef,
        { lastLogin: new Date().toISOString() },
        { merge: true }
      );
    }

    return { success: true, user };
  } catch (error) {
    console.error('Google sign-in error:', error);
    return { success: false, error: error.message };
  }
};

// Function for Email/Password Sign Up with default avatar
export const signUpWithEmail = async (email, password, displayName) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    await updateProfile(user, {
      displayName,
      photoURL: DEFAULT_AVATAR
    });

    const userDocRef = doc(db, 'users', user.uid);
    await setDoc(userDocRef, {
      uid: user.uid,
      email: user.email,
      displayName,
      photoURL: DEFAULT_AVATAR,
      provider: 'email',
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      isActive: true
    });

    return { success: true, user };
  } catch (error) {
    console.error('Email sign-up error:', error);
    return { success: false, error: error.message };
  }
};

// Function for Email/Password Sign In
export const signInWithEmail = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    const userDocRef = doc(db, 'users', user.uid);
    await setDoc(
      userDocRef,
      { lastLogin: new Date().toISOString() },
      { merge: true }
    );

    return { success: true, user };
  } catch (error) {
    console.error('Email sign-in error:', error);
    return { success: false, error: error.message };
  }
};

// Logout function
export const logout = async () => {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Get current user
export const getCurrentUser = () => auth.currentUser;

// Check authentication
export const isAuthenticated = () => auth.currentUser !== null;

// Get user data
export const getUserData = async (uid) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) return userDoc.data();
    return null;
  } catch (error) {
    console.error('Get user data error:', error);
    return null;
  }
};
