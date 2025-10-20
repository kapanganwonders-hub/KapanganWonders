import {
  auth,
  db,
  googleProvider,
  signInWithPopup,
  signOut,
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  collection,
  getDocs,
  signInWithEmailAndPassword,
  updateProfile,
} from './firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { initializeApp, deleteApp } from 'firebase/app';
import { Timestamp } from 'firebase/firestore';

// 🖼️ Default profile image (stored in /public/assets/)
const DEFAULT_AVATAR = '/assets/default-avatar.png';

/* =========================
   🔹 GOOGLE SIGN-IN / SIGN-UP
========================= */
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
        displayName: user.displayName || 'New User',
        photoURL: user.photoURL || DEFAULT_AVATAR,
        role: 'Tourist',
        provider: 'google',
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        status: 'Active',
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
    let userFriendlyError = error.message;

    if (error.code === 'auth/operation-not-allowed') {
      userFriendlyError =
        'Google sign-in is not enabled. Enable it in Firebase Authentication > Sign-in method.';
    }

    return { success: false, error: userFriendlyError };
  }
};

/* =========================
   🔹 EMAIL SIGN-UP (Tourists)
========================= */
export const signUpWithEmail = async (email, password, displayName) => {
  try {
    if (email === 'kapanganwonders@gmail.com') {
      throw new Error('Admins cannot register using this sign-up form.');
    }

    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    await updateProfile(user, {
      displayName: displayName || 'New User',
      photoURL: DEFAULT_AVATAR,
    });

    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      email: user.email,
      displayName: displayName || 'New User',
      photoURL: DEFAULT_AVATAR,
      provider: 'email',
      role: 'Tourist',
      status: 'Active',
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
    });

    return { success: true, user };
  } catch (error) {
    console.error('Email sign-up error:', error);
    return { success: false, error: error.message };
  }
};

/* =========================
   🔹 ADMIN: CREATE USER ACCOUNT
   ✅ Uses secondary app so admin stays logged in
========================= */
export const createUserByAdmin = async (email, password, displayName, role) => {
  try {
    // ✅ Only main admin can create accounts
    if (!auth.currentUser || auth.currentUser.email !== 'kapanganwonders@gmail.com') {
      throw new Error('Only the main admin can create user accounts.');
    }

    if (!['Barangay Admin', 'Private Spot Owner'].includes(role)) {
      throw new Error('Admins can only create Barangay Admin or Private Spot Owner accounts.');
    }

    // ✅ Create a temporary secondary Firebase app
    const secondaryApp = initializeApp(auth.app.options, `secondary-${Date.now()}`);
    const { getAuth, createUserWithEmailAndPassword, updateProfile: updateProfileAuth, signOut: signOutAuth } =
      await import('firebase/auth');
    const secondaryAuth = getAuth(secondaryApp);

    // ✅ Create user in secondary app
    const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
    const newUser = userCredential.user;

    await updateProfileAuth(newUser, {
      displayName: displayName || 'New User',
      photoURL: DEFAULT_AVATAR,
    });

    // ✅ Common user data
    const userData = {
      uid: newUser.uid,
      email,
      displayName: displayName || 'New User',
      photoURL: DEFAULT_AVATAR,
      provider: 'admin-create',
      createdBy: 'kapanganwonders@gmail.com',
      role,
      status: 'Active',
      createdAt: new Date().toISOString(),
    };

    // ✅ Save in Firestore
    await setDoc(doc(db, 'users', newUser.uid), userData);
    if (role === 'Barangay Admin') {
      await setDoc(doc(db, 'barangayAdmins', newUser.uid), userData);
    } else if (role === 'Private Spot Owner') {
      await setDoc(doc(db, 'privateSpotOwners', newUser.uid), userData);
    }

    // ✅ Clean up secondary app
    try {
      await signOutAuth(secondaryAuth);
    } catch (e) {
      console.warn('Secondary sign-out failed (non-fatal):', e);
    }
    try {
      await deleteApp(secondaryApp);
    } catch (e) {
      console.warn('Secondary app deletion failed (non-fatal):', e);
    }

    return { success: true, user: newUser };
  } catch (error) {
    console.error('Admin create user error:', error);
    return { success: false, error: error.message };
  }
};

/* =========================
   🔹 ADMIN: UPDATE EXISTING USER ROLE
========================= */
export const updateUserRole = async (uid, newRole) => {
  try {
    // ✅ Only main admin can do this
    if (!auth.currentUser || auth.currentUser.email !== 'kapanganwonders@gmail.com') {
      throw new Error('Only the main admin can update user roles.');
    }

    const validRoles = ['Tourist', 'Barangay Admin', 'Private Spot Owner'];
    if (!validRoles.includes(newRole)) {
      throw new Error('Invalid role selected.');
    }

    // ✅ Get user doc
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      throw new Error('User not found.');
    }

    const userData = userSnap.data();

    // ✅ Update in `users` collection
    await setDoc(userRef, { role: newRole }, { merge: true });

    // ✅ Sync other collections
    if (newRole === 'Barangay Admin') {
      await setDoc(doc(db, 'barangayAdmins', uid), userData, { merge: true });
      await setDoc(doc(db, 'privateSpotOwners', uid), {}, { merge: false }); // clear old data
    } else if (newRole === 'Private Spot Owner') {
      await setDoc(doc(db, 'privateSpotOwners', uid), userData, { merge: true });
      await setDoc(doc(db, 'barangayAdmins', uid), {}, { merge: false });
    } else {
      // Tourist: remove from both admin collections
      await setDoc(doc(db, 'barangayAdmins', uid), {}, { merge: false });
      await setDoc(doc(db, 'privateSpotOwners', uid), {}, { merge: false });
    }

    return { success: true };
  } catch (error) {
    console.error('Error updating user role:', error);
    return { success: false, error: error.message };
  }
};

/* =========================
   🔹 FETCH ALL USERS (Admin)
========================= */
export const fetchAllUsers = async () => {
  try {
    const usersSnapshot = await getDocs(collection(db, 'users'));
    const barangaySnapshot = await getDocs(collection(db, 'barangayAdmins'));
    const privateSnapshot = await getDocs(collection(db, 'privateSpotOwners'));

    const users = [
      ...usersSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
      ...barangaySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
      ...privateSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
    ];

    // ✅ Remove duplicates based on UID
    const uniqueUsers = Object.values(
      users.reduce((acc, user) => {
        acc[user.uid] = user;
        return acc;
      }, {})
    );

    return uniqueUsers;
  } catch (error) {
    console.error('Fetch all users error:', error);
    return [];
  }
};

/* =========================
   🔹 LOGIN (Email & Password)
========================= */
export const loginWithEmail = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    await setDoc(
      doc(db, 'users', user.uid),
      { lastLogin: new Date().toISOString() },
      { merge: true }
    );

    return { success: true, user };
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, error: error.message };
  }
};

/* =========================
   🔹 LOGOUT
========================= */
export const logout = async () => {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error) {
    console.error('Logout error:', error);
    return { success: false, error: error.message };
  }
};

/* =========================
   🔹 GET USER DATA
========================= */
export const getUserData = async (uid) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) return userDoc.data();

    const barangayDoc = await getDoc(doc(db, 'barangayAdmins', uid));
    if (barangayDoc.exists()) return barangayDoc.data();

    const privateDoc = await getDoc(doc(db, 'privateSpotOwners', uid));
    if (privateDoc.exists()) return privateDoc.data();

    return null;
  } catch (error) {
    console.error('Get user data error:', error);
    return null;
  }
};

/* =========================
   🔹 ADMIN: GET ALL BARANGAY ADMINS
========================= */
export const getAllBarangayAdmins = async () => {
  try {
    const snapshot = await getDocs(collection(db, 'barangayAdmins'));
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      type: 'barangay',
    }));
  } catch (error) {
    console.error('Error fetching barangay admins:', error);
    return [];
  }
};

/* =========================
   🔹 ADMIN: GET ALL PRIVATE SPOT OWNERS
========================= */
export const getAllSpotOwners = async () => {
  try {
    const snapshot = await getDocs(collection(db, 'privateSpotOwners'));
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      type: 'spotOwner',
    }));
  } catch (error) {
    console.error('Error fetching spot owners:', error);
    return [];
  }
};

/* =========================
   🔹 ADMIN: VERIFY ADMIN ACCOUNT
   Can be used by main admin to verify Barangay Admins or Spot Owners
========================= */
export const verifyAdminAccount = async (adminId, adminType) => {
  try {
    if (!auth.currentUser || auth.currentUser.email !== 'kapanganwonders@gmail.com') {
      throw new Error('Only the main admin can verify admin accounts.');
    }

    const validTypes = ['barangay', 'spotOwner'];
    if (!validTypes.includes(adminType)) {
      throw new Error('Invalid admin type. Must be "barangay" or "spotOwner".');
    }

    const collectionName = adminType === 'barangay' ? 'barangayAdmins' : 'privateSpotOwners';
    const docRef = doc(db, collectionName, adminId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      throw new Error(`${adminType === 'barangay' ? 'Barangay admin' : 'Spot owner'} not found.`);
    }

    await setDoc(docRef, {
      isVerified: true,
      approvedBy: auth.currentUser.uid,
      approvedAt: Timestamp.now(),
    }, { merge: true });

    // Also update the users collection for role-based access
    await setDoc(doc(db, 'users', adminId), {
      status: 'Active',
      role: adminType === 'barangay' ? 'Barangay Admin' : 'Private Spot Owner',
    }, { merge: true });

    return { success: true };
  } catch (error) {
    console.error('Error verifying admin account:', error);
    return { success: false, error: error.message };
  }
};

/* =========================
   🔹 UPDATE BARANGAY ADMIN PROFILE
========================= */
export const updateBarangayAdminProfile = async (uid, updates) => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('Not authenticated');
    
    // Only the user themselves or main admin can update
    if (currentUser.uid !== uid && currentUser.email !== 'kapanganwonders@gmail.com') {
      throw new Error('Unauthorized to update this profile');
    }

    const docRef = doc(db, 'barangayAdmins', uid);
    await setDoc(docRef, updates, { merge: true });
    
    // Also update the users collection for role-based access
    await setDoc(doc(db, 'users', uid), updates, { merge: true });

    return { success: true };
  } catch (error) {
    console.error('Error updating barangay admin profile:', error);
    return { success: false, error: error.message };
  }
};

/* =========================
   🔹 UPDATE SPOT OWNER PROFILE
========================= */
export const updateSpotOwnerProfile = async (uid, updates) => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('Not authenticated');
    
    // Only the user themselves or main admin can update
    if (currentUser.uid !== uid && currentUser.email !== 'kapanganwonders@gmail.com') {
      throw new Error('Unauthorized to update this profile');
    }

    const docRef = doc(db, 'privateSpotOwners', uid);
    await setDoc(docRef, updates, { merge: true });
    
    // Also update the users collection for role-based access
    await setDoc(doc(db, 'users', uid), updates, { merge: true });

    return { success: true };
  } catch (error) {
    console.error('Error updating spot owner profile:', error);
    return { success: false, error: error.message };
  }
};

/* =========================
   🔹 ADMIN: DELETE USER
   Deletes user from both Auth and Firestore
========================= */
export const deleteUserAccount = async (userId) => {
  try {
    // Only main admin can delete users
    if (!auth.currentUser || auth.currentUser.email !== 'kapanganwonders@gmail.com') {
      throw new Error('Only the main admin can delete users.');
    }

    // Delete from all collections
    const collections = ['users', 'barangayAdmins', 'privateSpotOwners'];
    const batch = [];
    
    // Add all delete operations to batch
    for (const collection of collections) {
      const docRef = doc(db, collection, userId);
      batch.push(deleteDoc(docRef));
    }

    // Execute all deletes in parallel
    await Promise.all(batch);

    // If you want to delete the auth user as well (uncomment if needed)
    // Note: This requires the admin SDK on the server side for security
    // You'll need to implement a cloud function for this
    // await deleteUser(userId);

    return { success: true };
  } catch (error) {
    console.error('Error deleting user:', error);
    return { success: false, error: error.message };
  }
};

/* =========================
   🔹 AUTH HELPERS
========================= */
export const getCurrentUser = () => {
  return auth.currentUser;
};

export const isAuthenticated = () => !!auth.currentUser;
