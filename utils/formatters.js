// utils/formatters.js
// Display formatting utilities for NCH GPS Tracker

const RATE_PER_KM = 4; // ₹4 per KM — change this constant to update rate globally

export { RATE_PER_KM };

/**
 * Formats a KM value to 2 decimal places with unit.
 * @param {number} km
 * @returns {string} e.g. "12.34 KM"
 */
export function formatKM(km) {
  if (km === null || km === undefined || isNaN(km)) return '0.00 KM';
  return `${parseFloat(km).toFixed(2)} KM`;
}

/**
 * Formats earnings with ₹ symbol, 2 decimal places.
 * @param {number} amount
 * @returns {string} e.g. "₹49.36"
 */
export function formatEarnings(amount) {
  if (amount === null || amount === undefined || isNaN(amount)) return '₹0.00';
  return `₹${parseFloat(amount).toFixed(2)}`;
}

/**
 * Calculates earnings from KM.
 * @param {number} km
 * @returns {number}
 */
export function calculateEarnings(km) {
  return Math.round(parseFloat(km || 0) * RATE_PER_KM * 100) / 100;
}

/**
 * Formats seconds into hh:mm:ss string.
 * @param {number} totalSeconds
 * @returns {string} e.g. "01:23:45"
 */
export function formatDuration(totalSeconds) {
  if (!totalSeconds || isNaN(totalSeconds)) return '00:00:00';
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = Math.floor(totalSeconds % 60);
  return [h, m, s].map((v) => String(v).padStart(2, '0')).join(':');
}

/**
 * Formats minutes into a human-readable duration.
 * @param {number} minutes
 * @returns {string} e.g. "2h 34m"
 */
export function formatMinutes(minutes) {
  if (!minutes || isNaN(minutes)) return '0m';
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

/**
 * Formats a Date object or ISO string to a human-readable time (12hr).
 * @param {Date|string} date
 * @returns {string} e.g. "09:35 AM"
 */
export function formatTime(date, includeSeconds = false) {
  if (!date) return '--:--';
  const d = typeof date === 'string' ? new Date(date) : date;
  const hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const h = hours % 12 || 12;
  const timeStr = `${String(h).padStart(2, '0')}:${minutes}${includeSeconds ? `:${seconds}` : ''}`;
  return `${timeStr} ${ampm}`;
}

/**
 * Formats a Date object or ISO string to full date string.
 * @param {Date|string} date
 * @returns {string} e.g. "Monday, 12 May 2025"
 */
export function formatDate(date) {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Returns short date string.
 * @param {Date|string} date
 * @returns {string} e.g. "12 May 2025"
 */
export function formatShortDate(date) {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Returns month name from month number (1-12).
 * @param {number} month
 * @returns {string} e.g. "January"
 */
export function getMonthName(month) {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  return months[(month - 1) % 12] || '';
}

/**
 * Returns the current time as a formatted string.
 * @returns {string}
 */
export function getNowTimeString() {
  return formatTime(new Date());
}

/**
 * Returns a Month key string for grouping (e.g. "2025-05").
 * @param {Date|string} date
 * @returns {string}
 */
export function getMonthKey(date) {
  const d = typeof date === 'string' ? new Date(date) : date;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

/**
 * Formats GPS coordinates for display.
 * @param {number} lat
 * @param {number} lng
 * @returns {string}
 */
export function formatCoords(lat, lng) {
  if (lat === null || lng === null || lat === undefined || lng === undefined) {
    return 'Acquiring GPS...';
  }
  return `${parseFloat(lat).toFixed(5)}°N, ${parseFloat(lng).toFixed(5)}°E`;
}

/**
 * Generates a simple UUID v4.
 * @returns {string}
 */
export function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export default {
  RATE_PER_KM,
  formatKM,
  formatEarnings,
  calculateEarnings,
  formatDuration,
  formatMinutes,
  formatTime,
  formatDate,
  formatShortDate,
  getMonthName,
  getNowTimeString,
  getMonthKey,
  formatCoords,
  generateUUID,
};
