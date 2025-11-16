import { Client, Account, Databases, Storage, ID, Permission, Role } from 'appwrite';
import { getAuth } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';

// --- Initialize Appwrite client ---
const client = new Client()
  .setEndpoint('https://cloud.appwrite.io/v1')
  .setProject('6905f83f00038caa24fb'); // ✅ Your Appwrite Project ID

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
    } catch (error: any) {
      if (error.code === 401) {
        if (!user.email) {
          throw new Error('User email is required');
        }
        await account.createEmailPasswordSession(user.email, user.uid);
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
const BUCKET_ID = '69062d080010accbfb9e'; // ✅ Your Appwrite Bucket ID

// --- Helper: Generate valid file name ---
const generateFileName = (file: File) => {
  const extension = file.name.split('.').pop()?.toLowerCase() || 'dat';
  const baseName = file.name
    .replace(/\.[^/.]+$/, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/\-+/g, '-')
    .replace(/^\-|\-$/g, '');
  const timestamp = Date.now();
  const truncatedName = baseName.substring(0, 200);
  return `${truncatedName}-${timestamp}.${extension}`;
};

// --- Function: Upload file to Appwrite Storage (safe version) ---
const uploadFile = async (file: File, folder = 'touristSpots', p0: { onProgress: (progress: any) => void; }) => {
  try {
    if (!BUCKET_ID) throw new Error('Appwrite bucket ID is not configured.');

    // Generate a clean unique file name
    const fileName = generateFileName(file);
    const fileToUpload = new File([file], fileName, { type: file.type });

    // Upload file
    const result = await storage.createFile(BUCKET_ID, ID.unique(), fileToUpload);

    // Wait a bit for file processing
    await new Promise((resolve) => setTimeout(resolve, 300));

    // Construct public file URL
    const fileUrl = `${client.config.endpoint}/storage/buckets/${BUCKET_ID}/files/${result.$id}/view?project=${client.config.project}`;

    console.log(`✅ Uploaded file to Appwrite: ${fileName}`);

    return {
      ...result,
      url: fileUrl,
      name: fileName,
      originalName: file.name,
      size: file.size,
      type: file.type
    };
  } catch (error) {
    console.error('❌ Error uploading file to Appwrite:', error);
    throw error;
  }
};

// --- Function: Delete file from Appwrite Storage (safe version) ---
const deleteFile = async (fileId: string) => {
  try {
    if (!BUCKET_ID) throw new Error('Appwrite bucket ID is not configured.');
    if (!fileId) {
      console.warn('⚠️ deleteFile called without a valid fileId, skipping.');
      return false;
    }

    await storage.deleteFile(BUCKET_ID, fileId);
    console.log(`✅ File ${fileId} deleted successfully.`);
    return true;

  } catch (error: any) {
    // File not found
    if (error?.message?.includes('not be found') || error?.code === 404) {
      console.warn(`⚠️ File ${fileId} not found in Appwrite. Skipping delete.`);
      return false;
    }

    // Permission issue fallback
    if (error?.code === 401 || error?.code === 403) {
      console.warn(`⚠️ Permission issue deleting file ${fileId}. Attempting fallback...`);
      try {
        await storage.updateFile(BUCKET_ID, fileId, 
          `read("any"),update("any")
        `);
        await storage.deleteFile(BUCKET_ID, fileId);
        console.log(`✅ File ${fileId} deleted after fallback permission update.`);
        return true;
      } catch (retryError) {
        console.error(`❌ Failed to delete file ${fileId} after permission update:`, retryError);
        return false;
      }
    }

    // Unexpected error
    console.error('❌ Unexpected error deleting file:', error);
    return false; // Don’t throw — keep app running
  }
};

// --- Safe wrapper to prevent crashes in UI ---
const safeDeleteFile = async (fileUrl: string) => {
  try {
    if (!fileUrl || !fileUrl.includes('/files/')) {
      console.warn('⚠️ safeDeleteFile: Invalid file URL, skipping.');
      return false;
    }

    const fileId = fileUrl.split('/files/')[1]?.split('/view')[0];
    if (!fileId) {
      console.warn('⚠️ safeDeleteFile: Could not extract file ID, skipping.');
      return false;
    }

    return await deleteFile(fileId);
  } catch (err) {
    console.error('❌ safeDeleteFile error:', err);
    return false;
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
  deleteFile,
  safeDeleteFile
};
