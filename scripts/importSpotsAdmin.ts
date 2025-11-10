// Use dynamic import for ESM compatibility
import { initializeApp, cert, getApps, getApp, deleteApp } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { defaultSpots } from '../src/data/defaultSpots';
import * as fs from 'fs';
import * as path from 'path';

// Load service account
const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

// Initialize Firebase Admin
const app = getApps().length === 0 
  ? initializeApp({
      credential: cert(serviceAccount),
      databaseURL: 'https://kapangan-wonders.firebaseio.com'
    })
  : getApp();

const db = getFirestore(app);

async function importSpots() {
  try {
    const spotsRef = db.collection('touristSpots');
    const snapshot = await spotsRef.limit(1).get();
    
    // Check if spots already exist
    if (!snapshot.empty) {
      console.log('Spots already exist in the database. Skipping import.');
      return;
    }

    // Add each spot to Firestore
    const batch = db.batch();
    const spotsCollection = db.collection('touristSpots');
    
    for (const spot of defaultSpots) {
      const spotData = {
        ...spot,
        entranceFees: spot.entranceFees || null,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      };
      
      const docRef = spotsCollection.doc();
      batch.set(docRef, spotData);
    }

    // Commit the batch
    await batch.commit();
    
    console.log(`✅ Successfully imported ${defaultSpots.length} spots to Firestore.`);
  } catch (error) {
    console.error('❌ Error importing spots:', error);
    process.exit(1);
  } finally {
    // Close the connection
    await deleteApp(app);
  }
}

// Run the import
importSpots().then(() => process.exit(0));
