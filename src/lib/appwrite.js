import { Client, Account, Databases, Storage, Query, ID } from 'appwrite';
import { getAuth } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';

// Initialize Appwrite client
const client = new Client()
  .setEndpoint('https://cloud.appwrite.io/v1') // Replace with your Appwrite endpoint
  .setProject('6905f83f00038caa24fb'); // Replace with your project ID

const account = new Account(client);
const databases = new Databases(client);
const storage = new Storage(client);

// Initialize Firebase Auth
const auth = getAuth();

// Function to check if current user is an admin
const isAdmin = async () => {
  try {
    const user = auth.currentUser;
    if (!user) return false;

    // Check in Firestore admins collection
    const adminDoc = await getDoc(doc(db, 'admins', user.uid));
    return adminDoc.exists() && adminDoc.data().email === user.email;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
};

// Function to get Appwrite session using Firebase token
const getAppwriteSession = async () => {
  try {
    const user = auth.currentUser;
    if (!user) return null;

    // Get Firebase ID token
    const token = await user.getIdToken();
    
    // Create session in Appwrite
    const session = await account.createSession('firebase', token);
    return session;
  } catch (error) {
    console.error('Error creating Appwrite session:', error);
    return null;
  }
};

// Function to ensure user exists in Appwrite
const ensureAppwriteUser = async () => {
  try {
    const user = auth.currentUser;
    if (!user) return null;

    // Create or update user in Appwrite
    await account.createSession('firebase', await user.getIdToken());
    
    // Check if user exists in Appwrite
    try {
      await account.get();
    } catch (error) {
      // If user doesn't exist, create it
      if (error.code === 401) {
        await account.createEmailSession(user.email, user.uid);
        await account.updateName(user.displayName || user.email);
      } else {
        throw error;
      }
    }

    return true;
  } catch (error) {
    console.error('Error ensuring Appwrite user:', error);
    return false;
  }
};

// Helper function to get headers for fetch requests
const getAppwriteHeaders = () => ({
  'X-Appwrite-Project': client.config.project,
  'x-sdk-version': 'appwrite:web:11.0.0',
  'Content-Type': 'application/json'
});

export { 
  client, 
  account, 
  databases, 
  storage,
  ID,
  isAdmin, 
  getAppwriteSession, 
  ensureAppwriteUser, 
  getAppwriteHeaders 
};
