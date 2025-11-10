import { initializeApp, cert, getApps, getApp } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { defaultSpots } from '../src/data/defaultSpots';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Get the current file's directory in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load service account
const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

// Initialize Firebase Admin
const app = getApps().length === 0 
  ? initializeApp({
      credential: cert(serviceAccount)
    })
  : getApp();

const db = getFirestore(app);

async function importSpots() {
  try {
    console.log('Starting spot import process...');
    
    // Check if spots already exist
    const spotsRef = db.collection('touristSpots');
    const snapshot = await spotsRef.limit(1).get();
    
    if (!snapshot.empty) {
      console.log('Spots already exist in the database. Skipping import.');
      return;
    }

    console.log('No existing spots found. Starting import...');
    
    // Create a batch for bulk write
    let batch = db.batch();
    const batchSize = 500; // Firestore batch limit

    // Add spots in batches
    for (let i = 0; i < defaultSpots.length; i++) {
      const spot = defaultSpots[i];
      const docRef = db.collection('touristSpots').doc();
      
      batch.set(docRef, {
        ...spot,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
      });
      
      // Commit batch if we reach batch size or it's the last item
      if ((i > 0 && i % batchSize === 0) || i === defaultSpots.length - 1) {
        await batch.commit();
        console.log(`Imported ${i + 1} of ${defaultSpots.length} spots...`);
        
        // Create a new batch if there are more items to process
        if (i < defaultSpots.length - 1) {
          batch = db.batch();
        }
      }
    }
    
    console.log(`✅ Successfully imported ${defaultSpots.length} spots to Firestore.`);
  } catch (error) {
    console.error('Error importing spots:', error);
    process.exit(1);
  }
}

// Run the import
importSpots().then(() => process.exit(0));
