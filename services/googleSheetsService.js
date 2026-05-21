import AsyncStorage from '@react-native-async-storage/async-storage';

const GOOGLE_SHEETS_URL = "https://script.google.com/macros/s/AKfycbxbZoKrcF1rGKSgloLPYymo4YuXrCg7aaTgfDlQXPoUOP5YmvXjJRd6IrFl9yBW0CnqRw/exec";
// Paste your deployed Apps Script URL above
// after deploying from Google Sheets

const SHEETS_ENABLED = true;
// Change to true after pasting URL above

const SECRET_KEY = "nch_gps_2026";
const PENDING_QUEUE_KEY = "@nch_pending_sync_queue";

export async function saveTripToSheets(tripData) {
  if (!SHEETS_ENABLED || !GOOGLE_SHEETS_URL) {
    await addToPendingQueue(tripData);
    return false;
  }

  try {
    const response = await fetch(GOOGLE_SHEETS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-secret-key': SECRET_KEY,
      },
      body: JSON.stringify({
        employeeName: tripData.employeeName || 'Unknown',
        employeeId: tripData.employeeId || 'Unknown',
        bikeNumber: tripData.bikeNumber || 'N/A',
        date: tripData.date,
        outTime: tripData.outTime,
        inTime: tripData.inTime,
        durationMinutes: tripData.durationMinutes,
        distanceKM: tripData.distanceKM,
        earnings: tripData.earnings,
        month: tripData.month,
        year: tripData.year,
        id: tripData.id
      }),
    });

    const result = await response.json();
    if (result.status === 'success') {
      return true;
    } else {
      await addToPendingQueue(tripData);
      return false;
    }
  } catch (error) {
    console.warn('[googleSheetsService] Failed to sync trip:', error);
    await addToPendingQueue(tripData);
    return false;
  }
}

async function addToPendingQueue(tripData) {
  try {
    const queueRaw = await AsyncStorage.getItem(PENDING_QUEUE_KEY);
    const queue = queueRaw ? JSON.parse(queueRaw) : [];

    // Check if it's already in the queue to avoid duplicates
    const exists = queue.some(t => t.id === tripData.id);
    if (!exists) {
      queue.push(tripData);
      await AsyncStorage.setItem(PENDING_QUEUE_KEY, JSON.stringify(queue));
    }
  } catch (e) {
    console.error('[googleSheetsService] Error adding to pending queue', e);
  }
}

export async function syncPendingTrips() {
  if (!SHEETS_ENABLED || !GOOGLE_SHEETS_URL) return 0;

  try {
    const queueRaw = await AsyncStorage.getItem(PENDING_QUEUE_KEY);
    let queue = queueRaw ? JSON.parse(queueRaw) : [];

    if (queue.length === 0) return 0;

    let syncedCount = 0;
    const remainingQueue = [];

    for (const trip of queue) {
      try {
        const response = await fetch(GOOGLE_SHEETS_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-secret-key': SECRET_KEY,
          },
          body: JSON.stringify({
            employeeName: trip.employeeName || 'Unknown',
            employeeId: trip.employeeId || 'Unknown',
            bikeNumber: trip.bikeNumber || 'N/A',
            date: trip.date,
            outTime: trip.outTime,
            inTime: trip.inTime,
            durationMinutes: trip.durationMinutes,
            distanceKM: trip.distanceKM,
            earnings: trip.earnings,
            month: trip.month,
            year: trip.year,
            id: trip.id
          }),
        });

        const result = await response.json();
        if (result.status === 'success') {
          syncedCount++;
        } else {
          remainingQueue.push(trip);
        }
      } catch (error) {
        remainingQueue.push(trip);
      }
    }

    await AsyncStorage.setItem(PENDING_QUEUE_KEY, JSON.stringify(remainingQueue));
    return syncedCount;
  } catch (e) {
    console.error('[googleSheetsService] Error syncing pending trips', e);
    return 0;
  }
}

export async function getEmployeeTripsFromSheets(employeeId, month) {
  if (!SHEETS_ENABLED || !GOOGLE_SHEETS_URL) return [];

  try {
    const url = `${GOOGLE_SHEETS_URL}?employeeId=${encodeURIComponent(employeeId)}&month=${encodeURIComponent(month)}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'x-secret-key': SECRET_KEY,
      }
    });

    const result = await response.json();
    if (result.status === 'success') {
      return result.data || [];
    }
    return [];
  } catch (error) {
    console.warn('[googleSheetsService] Error fetching trips:', error);
    return [];
  }
}
