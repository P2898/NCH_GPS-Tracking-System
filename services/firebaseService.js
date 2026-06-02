import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';

// Placeholder Firebase Config - Needs to be replaced with actual keys from Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSyBSFWIOvYnDHU8IlKqkgqlKkeWKxUliAFQ",
  authDomain: "nch-gps-tracker.firebaseapp.com",
  projectId: "nch-gps-tracker",
  storageBucket: "nch-gps-tracker.firebasestorage.app",
  messagingSenderId: "790756782260",
  appId: "1:790756782260:web:5cbb5d63a25ec741d427e1"
};

// Initialize Firebase
let app;
let db;

try {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
} catch (error) {
  console.warn('[firebaseService] Initialization error:', error);
}

/**
 * Pushes the live location of an employee to Firestore
 */
export async function updateLiveLocation(employeeId, data) {
  if (!db || !employeeId) return false;

  try {
    const docRef = doc(db, 'active_trips', employeeId);
    await setDoc(docRef, {
      ...data,
      lastUpdated: serverTimestamp()
    }, { merge: true });
    return true;
  } catch (error) {
    console.warn('[firebaseService] Update location error:', error);
    return false;
  }
}

/**
 * Removes the active tracking data when the trip ends
 */
export async function removeLiveLocation(employeeId) {
  if (!db || !employeeId) return false;

  try {
    const docRef = doc(db, 'active_trips', employeeId);
    await deleteDoc(docRef);
    return true;
  } catch (error) {
    console.warn('[firebaseService] Remove location error:', error);
    return false;
  }
}

export default { updateLiveLocation, removeLiveLocation };
