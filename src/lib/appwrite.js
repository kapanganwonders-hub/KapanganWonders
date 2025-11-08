import { Client, Account, Databases, Storage, ID } from 'appwrite';
import { getAuth } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';

// --- Initialize Appwrite client ---
const client = new Client()
  .setEndpoint('https://cloud.appwrite.io/v1')
  .setProject('6905f83f00038caa24fb'); // Your Appwrite Project ID

const account = new Account(client);
const databases = new Databases(client);
const storage = new Storage(client);

// --- Initialize Firebase Auth ---
const auth = getAuth();

// --- Function: Check if current user is admin ---
const isAdmin = async () => {
  try {
    const user = auth.currentUser;
    if (!user) return false;

    const adminDoc = await getDoc(doc(db, 'admins', user.uid));
    return adminDoc.exists() && adminDoc.data().email === user.email;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
};

// --- Function: Get Appwrite session using Firebase token ---
const getAppwriteSession = async () => {
  try {
    const user = auth.currentUser;
    if (!user) return null;

    const token = await user.getIdToken();
    const session = await account.createSession('firebase', token);
    return session;
  } catch (error) {
    console.error('Error creating Appwrite session:', error);
    return null;
  }
};

// --- Function: Ensure user exists in Appwrite ---
const ensureAppwriteUser = async () => {
  try {
    const user = auth.currentUser;
    if (!user) return null;

    await account.createSession('firebase', await user.getIdToken());

    try {
      await account.get();
    } catch (error) {
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

// --- Helper: Get headers for fetch requests ---
const getAppwriteHeaders = () => ({
  'X-Appwrite-Project': client.config.project,
  'x-sdk-version': 'appwrite:web:14.0.0',
  'Content-Type': 'application/json'
});

// --- Storage Bucket ID ---
const BUCKET_ID = '69062d080010accbfb9e'; // Your Appwrite Bucket ID

// --- Helper: Generate valid file name ---
const generateFileName = (file) => {
  const extension = file.name.split('.').pop().toLowerCase();
  const baseName = file.name.replace(/\.[^/.]+$/, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/\-+/g, '-')
    .replace(/^\-|\-$/g, '');
  
  const timestamp = Date.now();
  const maxLength = 200;
  const truncatedName = baseName.substring(0, maxLength);
  
  return `${truncatedName}-${timestamp}.${extension}`;
};

// --- Function: Upload file to Appwrite Storage ---
const uploadFile = async (file, folder = 'touristSpots') => {
  try {
    if (!BUCKET_ID) throw new Error('Appwrite bucket ID is not configured.');

    // Generate a clean filename
    const fileName = generateFileName(file);
    const fileToUpload = new File([file], fileName, { type: file.type });

    // Upload the file with default permissions (public read)
    const result = await storage.createFile(
      BUCKET_ID,
      ID.unique(),
      fileToUpload
    );

    // Wait a moment to ensure the file is fully processed
    await new Promise(resolve => setTimeout(resolve, 500));

    // Get the file URL
    const fileUrl = `${client.config.endpoint}/storage/buckets/${BUCKET_ID}/files/${result.$id}/view?project=${client.config.project}`;

    return {
      ...result,
      url: fileUrl,
      name: fileName,
      originalName: file.name,
      size: file.size,
      type: file.type
    };
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
};

// --- Function: Delete file from Appwrite Storage ---
const deleteFile = async (fileId) => {
  try {
    if (!BUCKET_ID) throw new Error('Appwrite bucket ID is not configured.');

    await storage.deleteFile(BUCKET_ID, fileId);
    return true;
  } catch (error) {
    console.error('Error deleting file:', error);

    // Optional fallback if permission denied
    if (error.code === 401 || error.code === 403) {
      try {
        await storage.updateFile(BUCKET_ID, fileId, ['any'], ['any']);
        await storage.deleteFile(BUCKET_ID, fileId);
        return true;
      } catch (retryError) {
        console.error('Failed to delete file after permission update:', retryError);
      }
    }

    throw error;
  }
};

export { 
  client, 
  account, 
  databases, 
  storage,
  ID,
  isAdmin, 
  getAppwriteSession, 
  ensureAppwriteUser, 
  getAppwriteHeaders,
  uploadFile,
  deleteFile
};