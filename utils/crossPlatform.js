// utils/crossPlatform.js
// Web-compatible wrappers for Alert, Share, and GPS that don't work in browsers

import { Platform, Alert, Share } from 'react-native';

/**
 * Cross-platform confirmation dialog.
 * Uses window.confirm on web, Alert.alert on native.
 */
export function confirmDialog(title, message, onConfirm, onCancel) {
  if (Platform.OS === 'web') {
    const result = window.confirm(`${title}\n\n${message}`);
    if (result) {
      onConfirm?.();
    } else {
      onCancel?.();
    }
  } else {
    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel', onPress: onCancel },
      { text: 'Confirm', style: 'destructive', onPress: onConfirm },
    ]);
  }
}

/**
 * Cross-platform info alert.
 * Uses window.alert on web, Alert.alert on native.
 */
export function showAlert(title, message) {
  if (Platform.OS === 'web') {
    window.alert(`${title}\n\n${message}`);
  } else {
    Alert.alert(title, message, [{ text: 'OK' }]);
  }
}

/**
 * Cross-platform share/export.
 * Uses clipboard + download on web, Share.share on native.
 */
export async function shareText(title, text) {
  if (Platform.OS === 'web') {
    // Try Web Share API first (mobile browsers)
    if (navigator.share) {
      try {
        await navigator.share({ title, text });
        return;
      } catch (e) {
        // User cancelled or API failed, fall through to clipboard
      }
    }
    // Fallback: copy to clipboard and offer download
    try {
      await navigator.clipboard.writeText(text);
      // Also trigger a file download
      const blob = new Blob([text], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title.replace(/[^a-zA-Z0-9]/g, '_')}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      window.alert('Summary copied to clipboard and downloaded!');
    } catch (e) {
      window.alert('Could not export. Please try again.');
    }
  } else {
    try {
      await Share.share({ title, message: text });
    } catch (e) {
      console.warn('Share failed:', e);
    }
  }
}

/**
 * Get current position using browser geolocation API (web fallback).
 * Returns { latitude, longitude } or null.
 */
export function getWebGeolocation() {
  return new Promise((resolve) => {
    if (Platform.OS !== 'web' || !navigator.geolocation) {
      resolve(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  });
}

/**
 * Watch position on web using browser geolocation API.
 * Returns a watchId that can be cleared with navigator.geolocation.clearWatch().
 */
export function watchWebGeolocation(callback) {
  if (Platform.OS !== 'web' || !navigator.geolocation) return null;
  return navigator.geolocation.watchPosition(
    (pos) => callback({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
    (err) => console.warn('[WebGeo] Watch error:', err.message),
    { enableHighAccuracy: true, distanceFilter: 10 }
  );
}

export function showToast(message) {
  if (Platform.OS === 'android') {
    const { ToastAndroid } = require('react-native');
    ToastAndroid.show(message, ToastAndroid.SHORT);
  } else if (Platform.OS === 'web') {
    // Simple web fallback
    window.alert(message);
  } else {
    // iOS fallback
    Alert.alert('Status', message);
  }
}

export default { confirmDialog, showAlert, shareText, getWebGeolocation, watchWebGeolocation, showToast };
