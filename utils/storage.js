// utils/storage.js
// AsyncStorage layer for NCH GPS Tracker
// Handles all read/write operations for trips, active trip state, user session

import AsyncStorage from '@react-native-async-storage/async-storage';
import { saveTripToSheets } from '../services/googleSheetsService';
import { showToast } from './crossPlatform';

// ─── Storage Keys ────────────────────────────────────────────────────────────
const KEYS = {
  TRIPS: '@nch_trips',
  ACTIVE_TRIP: '@nch_active_trip',
  USER_SESSION: '@nch_user_session',
  GPS_ENABLED: '@nch_gps_enabled',
  BG_TRACKING: '@nch_bg_tracking',
};

// ─── User Session ─────────────────────────────────────────────────────────────

export async function saveUserSession(user) {
  try {
    await AsyncStorage.setItem(KEYS.USER_SESSION, JSON.stringify(user));
  } catch (e) {
    console.error('[storage] saveUserSession error:', e);
  }
}

export async function getUserSession() {
  try {
    const raw = await AsyncStorage.getItem(KEYS.USER_SESSION);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    console.error('[storage] getUserSession error:', e);
    return null;
  }
}

export async function clearUserSession() {
  try {
    await AsyncStorage.removeItem(KEYS.USER_SESSION);
  } catch (e) {
    console.error('[storage] clearUserSession error:', e);
  }
}

// ─── Trips ───────────────────────────────────────────────────────────────────

export async function getAllTrips() {
  try {
    const raw = await AsyncStorage.getItem(KEYS.TRIPS);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('[storage] getAllTrips error:', e);
    return [];
  }
}

export async function saveTrip(trip) {
  try {
    const trips = await getAllTrips();
    const existingIndex = trips.findIndex((t) => t.id === trip.id);
    if (existingIndex >= 0) {
      trips[existingIndex] = trip;
    } else {
      trips.push(trip);
    }
    await AsyncStorage.setItem(KEYS.TRIPS, JSON.stringify(trips));
    
    // Background sync
    saveTripToSheets(trip).then(success => {
      if (success) {
        showToast("Trip saved and synced ✅");
      } else {
        showToast("Trip saved. Will sync when online 📶");
      }
    });

    return true;
  } catch (e) {
    console.error('[storage] saveTrip error:', e);
    return false;
  }
}

export async function deleteAllTrips() {
  try {
    await AsyncStorage.removeItem(KEYS.TRIPS);
    return true;
  } catch (e) {
    console.error('[storage] deleteAllTrips error:', e);
    return false;
  }
}

// ─── Active Trip (crash recovery) ────────────────────────────────────────────

export async function saveActiveTrip(trip) {
  try {
    await AsyncStorage.setItem(KEYS.ACTIVE_TRIP, JSON.stringify(trip));
  } catch (e) {
    console.error('[storage] saveActiveTrip error:', e);
  }
}

export async function getActiveTrip() {
  try {
    const raw = await AsyncStorage.getItem(KEYS.ACTIVE_TRIP);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    console.error('[storage] getActiveTrip error:', e);
    return null;
  }
}

export async function clearActiveTrip() {
  try {
    await AsyncStorage.removeItem(KEYS.ACTIVE_TRIP);
  } catch (e) {
    console.error('[storage] clearActiveTrip error:', e);
  }
}

// ─── GPS Settings ─────────────────────────────────────────────────────────────

export async function saveGpsEnabled(value) {
  try {
    await AsyncStorage.setItem(KEYS.GPS_ENABLED, JSON.stringify(value));
  } catch (e) {
    console.error('[storage] saveGpsEnabled error:', e);
  }
}

export async function getGpsEnabled() {
  try {
    const raw = await AsyncStorage.getItem(KEYS.GPS_ENABLED);
    return raw !== null ? JSON.parse(raw) : true;
  } catch (e) {
    return true;
  }
}

export async function saveBgTracking(value) {
  try {
    await AsyncStorage.setItem(KEYS.BG_TRACKING, JSON.stringify(value));
  } catch (e) {
    console.error('[storage] saveBgTracking error:', e);
  }
}

export async function getBgTracking() {
  try {
    const raw = await AsyncStorage.getItem(KEYS.BG_TRACKING);
    return raw !== null ? JSON.parse(raw) : true;
  } catch (e) {
    return true;
  }
}

// ─── Background task distance (written by background task) ───────────────────

export async function getBgDistance() {
  try {
    const raw = await AsyncStorage.getItem('@nch_bg_distance');
    return raw ? parseFloat(raw) : 0;
  } catch (e) {
    return 0;
  }
}

export async function setBgDistance(km) {
  try {
    await AsyncStorage.setItem('@nch_bg_distance', km.toString());
  } catch (e) {
    console.error('[storage] setBgDistance error:', e);
  }
}

export async function clearBgDistance() {
  try {
    await AsyncStorage.removeItem('@nch_bg_distance');
    await AsyncStorage.removeItem('@nch_bg_last_coord');
  } catch (e) {
    console.error('[storage] clearBgDistance error:', e);
  }
}

export async function getBgLastCoord() {
  try {
    const raw = await AsyncStorage.getItem('@nch_bg_last_coord');
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

export async function setBgLastCoord(coord) {
  try {
    await AsyncStorage.setItem('@nch_bg_last_coord', JSON.stringify(coord));
  } catch (e) {
    console.error('[storage] setBgLastCoord error:', e);
  }
}

export default {
  saveUserSession,
  getUserSession,
  clearUserSession,
  getAllTrips,
  saveTrip,
  deleteAllTrips,
  saveActiveTrip,
  getActiveTrip,
  clearActiveTrip,
  saveGpsEnabled,
  getGpsEnabled,
  saveBgTracking,
  getBgTracking,
  getBgDistance,
  setBgDistance,
  clearBgDistance,
  getBgLastCoord,
  setBgLastCoord,
};
