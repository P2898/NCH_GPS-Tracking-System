// utils/backgroundTask.js
// Background GPS task registration and management
// Uses expo-task-manager + expo-location for persistent background tracking

import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { haversineDistance } from './haversine';
import {
  getBgDistance,
  setBgDistance,
  getBgLastCoord,
  setBgLastCoord,
} from './storage';

export const BACKGROUND_LOCATION_TASK = 'BACKGROUND_LOCATION_TASK';
const NOTIFICATION_ID = 'nch-tracking-notification';
let notificationUpdateTimer = null;

// ─── Define the background task ──────────────────────────────────────────────
// This MUST be called at the top level of the file (outside components/functions)
// so it registers before the app finishes loading.

TaskManager.defineTask(BACKGROUND_LOCATION_TASK, async ({ data, error }) => {
  if (error) {
    console.error('[BackgroundTask] Error:', error.message);
    return;
  }

  if (data) {
    const { locations } = data;
    if (!locations || locations.length === 0) return;

    for (const location of locations) {
      const { latitude, longitude } = location.coords;
      const timestamp = location.timestamp;

      // Get last known coordinate from AsyncStorage
      const lastCoord = await getBgLastCoord();
      const currentDistance = await getBgDistance();

      let newDistance = currentDistance;

      if (lastCoord) {
        const delta = haversineDistance(
          lastCoord.lat,
          lastCoord.lng,
          latitude,
          longitude
        );
        // Only add if movement is meaningful (> 0.005 KM = ~5m)
        if (delta > 0.005) {
          newDistance = Math.round((currentDistance + delta) * 100) / 100;
          await setBgDistance(newDistance);
        }
      }

      // Update last known coordinate
      await setBgLastCoord({ lat: latitude, lng: longitude, timestamp });

      // Update notification body with current distance
      await updateTrackingNotification(newDistance);
    }
  }
});

// ─── Notification Management ─────────────────────────────────────────────────

export async function updateTrackingNotification(distanceKM) {
  try {
    await Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: false,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
    });

    await Notifications.scheduleNotificationAsync({
      identifier: NOTIFICATION_ID,
      content: {
        title: 'NCH GPS Tracker Active',
        body: `Tracking your trip... ${distanceKM.toFixed(2)} KM travelled`,
        sticky: true,
        autoDismiss: false,
        color: '#333788',
      },
      trigger: null,
    });
  } catch (e) {
    // Notifications might not be available in all environments
    console.warn('[BackgroundTask] Notification update failed:', e.message);
  }
}

export async function dismissTrackingNotification() {
  try {
    await Notifications.dismissNotificationAsync(NOTIFICATION_ID);
    await Notifications.cancelScheduledNotificationAsync(NOTIFICATION_ID);
  } catch (e) {
    console.warn('[BackgroundTask] Notification dismiss failed:', e.message);
  }
}

// ─── Start Background Location Tracking ──────────────────────────────────────

export async function startBackgroundTracking() {
  try {
    // Request foreground permissions first
    const { status: fgStatus } = await Location.requestForegroundPermissionsAsync();
    if (fgStatus !== 'granted') {
      console.warn('[BackgroundTask] Foreground location permission denied');
      return { success: false, reason: 'foreground_denied' };
    }

    // Request background permissions
    const { status: bgStatus } = await Location.requestBackgroundPermissionsAsync();
    if (bgStatus !== 'granted') {
      console.warn('[BackgroundTask] Background location permission denied');
      return { success: false, reason: 'background_denied' };
    }

    // Check if already running
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_LOCATION_TASK);
    if (isRegistered) {
      console.log('[BackgroundTask] Task already registered');
      return { success: true };
    }

    // Setup notification channel for Android
    await setupNotificationChannel();

    // Start location updates
    await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, {
      accuracy: Location.Accuracy.High,
      distanceInterval: 10, // metres
      timeInterval: 5000,   // every 5 seconds
      showsBackgroundLocationIndicator: true,
      foregroundService: {
        notificationTitle: 'NCH GPS Tracker Active',
        notificationBody: 'Tracking your trip...',
        notificationColor: '#333788',
      },
      pausesUpdatesAutomatically: false,
      activityType: Location.ActivityType.AutomotiveNavigation,
    });

    // Show initial notification
    await updateTrackingNotification(0);

    console.log('[BackgroundTask] Started successfully');
    return { success: true };
  } catch (e) {
    console.error('[BackgroundTask] startBackgroundTracking error:', e);
    return { success: false, reason: e.message };
  }
}

// ─── Stop Background Location Tracking ───────────────────────────────────────

export async function stopBackgroundTracking() {
  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_LOCATION_TASK);
    if (isRegistered) {
      await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
    }

    await dismissTrackingNotification();

    if (notificationUpdateTimer) {
      clearInterval(notificationUpdateTimer);
      notificationUpdateTimer = null;
    }

    console.log('[BackgroundTask] Stopped successfully');
    return { success: true };
  } catch (e) {
    console.error('[BackgroundTask] stopBackgroundTracking error:', e);
    return { success: false, reason: e.message };
  }
}

// ─── Check if task is running ─────────────────────────────────────────────────

export async function isBackgroundTrackingActive() {
  try {
    return await TaskManager.isTaskRegisteredAsync(BACKGROUND_LOCATION_TASK);
  } catch (e) {
    return false;
  }
}

// ─── Request Permissions ──────────────────────────────────────────────────────

export async function requestLocationPermissions() {
  const { status: fgStatus } = await Location.requestForegroundPermissionsAsync();
  if (fgStatus !== 'granted') {
    return { granted: false, type: 'foreground' };
  }
  const { status: bgStatus } = await Location.requestBackgroundPermissionsAsync();
  if (bgStatus !== 'granted') {
    return { granted: false, type: 'background' };
  }
  return { granted: true };
}

// ─── Notification Channel Setup (Android) ────────────────────────────────────

async function setupNotificationChannel() {
  try {
    await Notifications.setNotificationChannelAsync('nch-gps-channel', {
      name: 'NCH GPS Tracking',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 0, 0, 0],
      lightColor: '#333788',
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      bypassDnd: false,
      sound: null,
    });
  } catch (e) {
    // Channel setup only needed on Android
  }
}

export default {
  BACKGROUND_LOCATION_TASK,
  startBackgroundTracking,
  stopBackgroundTracking,
  isBackgroundTrackingActive,
  requestLocationPermissions,
  updateTrackingNotification,
  dismissTrackingNotification,
};
