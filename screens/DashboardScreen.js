// screens/DashboardScreen.js
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Linking,
  Platform,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import NetInfo from '@react-native-community/netinfo';
import { showAlert, watchWebGeolocation, getWebGeolocation } from '../utils/crossPlatform';

// Conditionally import native-only modules
let Haptics = null;
let Location = null;
if (Platform.OS !== 'web') {
  Haptics = require('expo-haptics');
  Location = require('expo-location');
}

import { COLORS, FONTS, FONT_SIZES, SPACING, RADIUS, SHADOWS } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import ThemeToggle from '../components/ThemeToggle';
import LiveTripBanner from '../components/LiveTripBanner';
import {
  formatDate,
  formatTime,
  formatKM,
  formatEarnings,
  formatDuration,
  calculateEarnings,
  formatCoords,
  generateUUID,
  getNowTimeString,
} from '../utils/formatters';
import {
  saveActiveTrip,
  getActiveTrip,
  clearActiveTrip,
  saveTrip,
  getAllTrips,
  getBgDistance,
  clearBgDistance,
  setBgDistance,
  setBgLastCoord,
} from '../utils/storage';
import { haversineDistance } from '../utils/haversine';
import { updateLiveLocation, removeLiveLocation } from '../services/googleSheetsService';

export default function DashboardScreen({ user, navigation }) {
  const [now, setNow] = useState(new Date());
  const [activeTrip, setActiveTrip] = useState(null);
  const [liveDistance, setLiveDistance] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [todayKM, setTodayKM] = useState(0);
  const [todayEarnings, setTodayEarnings] = useState(0);
  const [currentCoords, setCurrentCoords] = useState(null);
  const [gpsStatus, setGpsStatus] = useState('checking');
  const [isSaving, setIsSaving] = useState(false);
  const [isOffline, setIsOffline] = useState(false);

  const clockRef = useRef(null);
  const tripTimerRef = useRef(null);
  const distancePollRef = useRef(null);
  const locationSubscription = useRef(null);
  const lastCoordRef = useRef(null);
  const lastPushTimeRef = useRef(0);
  const PUSH_INTERVAL = 30000; // Push location every 30 seconds
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // ─── Load initial data ─────────────────────────────────────────────────────
  // ─── Live Clock ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadTodayStats();
      loadActiveTrip();
      checkGPSStatus();
    }, [])
  );

  async function loadTodayStats() {
    const trips = await getAllTrips();
    const today = new Date().toDateString();
    const todayTrips = trips.filter((t) => new Date(t.date).toDateString() === today);
    const totalKM = todayTrips.reduce((sum, t) => sum + (t.distanceKM || 0), 0);
    setTodayKM(Math.round(totalKM * 100) / 100);
    setTodayEarnings(calculateEarnings(totalKM));
  }

  async function loadActiveTrip() {
    const trip = await getActiveTrip();
    if (trip) {
      setActiveTrip(trip);
      const bgDist = await getBgDistance();
      setLiveDistance(bgDist);
      const outMs = new Date(trip.outTime).getTime();
      setElapsedSeconds(Math.floor((Date.now() - outMs) / 1000));
      startTripTimer(outMs);
      startDistancePoll();
      startLocationWatch();
    }
  }

  async function checkGPSStatus() {
    if (Platform.OS === 'web') {
      // On web, check browser geolocation
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          () => setGpsStatus('active'),
          () => setGpsStatus('off'),
          { timeout: 5000 }
        );
      } else {
        setGpsStatus('off');
      }
      return;
    }
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') { setGpsStatus('off'); return; }
      const enabled = await Location.hasServicesEnabledAsync();
      setGpsStatus(enabled ? 'active' : 'off');
    } catch {
      setGpsStatus('off');
    }
  }

  // ─── Clock ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    clockRef.current = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(clockRef.current);
  }, []);

  // ─── Network Status ────────────────────────────────────────────────────────
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      // isConnected can be null on some platforms during init, default to true
      setIsOffline(state.isConnected === false);
    });
    return () => unsubscribe();
  }, []);

  // ─── GPS pulse animation ───────────────────────────────────────────────────
  useEffect(() => {
    if (gpsStatus === 'active') {
      const anim = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 0.3, duration: 700, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
        ])
      );
      anim.start();
      return () => anim.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [gpsStatus]);

  // ─── Trip timer ────────────────────────────────────────────────────────────
  function startTripTimer(outMs) {
    if (tripTimerRef.current) clearInterval(tripTimerRef.current);
    tripTimerRef.current = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - outMs) / 1000));
    }, 1000);
  }

  // ─── Distance polling from AsyncStorage (background task writes here) ──────
  function startDistancePoll() {
    if (distancePollRef.current) clearInterval(distancePollRef.current);
    distancePollRef.current = setInterval(async () => {
      const dist = await getBgDistance();
      setLiveDistance(dist);
    }, 3000);
  }

  // ─── Foreground location watch (when app is open) ─────────────────────────
  async function startLocationWatch() {
    const onLocationUpdate = (latitude, longitude) => {
      setCurrentCoords({ lat: latitude, lng: longitude });
      setGpsStatus('active');
      
      if (lastCoordRef.current) {
        const delta = haversineDistance(
          lastCoordRef.current.lat,
          lastCoordRef.current.lng,
          latitude, longitude
        );
        
        setLiveDistance((prev) => {
          const next = Math.max(0, prev + delta);
          setBgDistance(next);
          
          // Push to Google Sheets every 30 seconds (not every GPS tick)
          const now = Date.now();
          if (user?.employeeId && (now - lastPushTimeRef.current >= PUSH_INTERVAL)) {
            lastPushTimeRef.current = now;
            updateLiveLocation(user.employeeId, {
              lat: latitude,
              lng: longitude,
              employeeName: user?.name || 'Unknown',
              employeeId: user?.employeeId,
              bikeNumber: user?.bikeNumber || 'N/A',
              distanceKM: Math.round(next * 100) / 100,
              earnings: calculateEarnings(next),
              tripStartTime: activeTrip?.outTime || '',
            });
          }
          
          return next;
        });
      } else {
        // Initial location push (always send immediately)
        if (user?.employeeId) {
          lastPushTimeRef.current = Date.now();
          updateLiveLocation(user.employeeId, {
            lat: latitude,
            lng: longitude,
            employeeName: user?.name || 'Unknown',
            employeeId: user?.employeeId,
            bikeNumber: user?.bikeNumber || 'N/A',
            distanceKM: 0,
            earnings: 0,
            tripStartTime: activeTrip?.outTime || '',
          });
        }
      }
      
      lastCoordRef.current = { lat: latitude, lng: longitude };
      setBgLastCoord({ lat: latitude, lng: longitude, timestamp: Date.now() });
    };

    if (Platform.OS === 'web') {
      const watchId = watchWebGeolocation((coords) => {
        onLocationUpdate(coords.latitude, coords.longitude);
      });
      locationSubscription.current = { remove: () => navigator.geolocation.clearWatch(watchId) };
      return;
    }

    try {
      locationSubscription.current = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, distanceInterval: 10, timeInterval: 5000 },
        (loc) => onLocationUpdate(loc.coords.latitude, loc.coords.longitude)
      );
    } catch (e) {
      console.warn('[Dashboard] Location watch error:', e.message);
    }
  }

  function clearAllTimers() {
    clearInterval(clockRef.current);
    clearInterval(tripTimerRef.current);
    clearInterval(distancePollRef.current);
    if (locationSubscription.current) {
      locationSubscription.current.remove();
      locationSubscription.current = null;
    }
  }

  useEffect(() => {
    return () => {
      clearInterval(tripTimerRef.current);
      clearInterval(distancePollRef.current);
      if (locationSubscription.current) locationSubscription.current.remove();
    };
  }, []);

  // ─── OUT TIME — Start Trip ─────────────────────────────────────────────────
  async function handleOutTime() {
    if (activeTrip) return;

    try { if (Haptics) await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); } catch (e) { /* web */ }
    const outTimeISO = new Date().toISOString();
    const now = new Date();

    const newTrip = {
      id: generateUUID(),
      date: now.toISOString(),
      outTime: outTimeISO,
      inTime: null,
      durationMinutes: 0,
      distanceKM: 0,
      earnings: 0,
      coordinates: [],
      month: String(now.getMonth() + 1).padStart(2, '0'),
      year: now.getFullYear(),
      employeeName: user?.name || 'Unknown',
      employeeId: user?.employeeId || 'Unknown',
      bikeNumber: user?.bikeNumber || 'N/A',
    };

    await clearBgDistance();
    await saveActiveTrip(newTrip);
    setActiveTrip(newTrip);
    setLiveDistance(0);
    setElapsedSeconds(0);
    lastCoordRef.current = null;

    startTripTimer(new Date(outTimeISO).getTime());
    startDistancePoll();
    await startLocationWatch();

    setGpsStatus('active');
  }

  // ─── IN TIME — End Trip ────────────────────────────────────────────────────
  async function handleInTime() {
    if (!activeTrip) return;
    try { if (Haptics) await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); } catch (e) { /* web */ }

    setIsSaving(true);
    try {
      const inTimeISO = new Date().toISOString();
      const outMs = new Date(activeTrip.outTime).getTime();
      const durationMinutes = Math.round((Date.now() - outMs) / 60000);
      const finalDist = await getBgDistance();

      const completedTrip = {
        ...activeTrip,
        inTime: inTimeISO,
        durationMinutes,
        distanceKM: Math.round(finalDist * 100) / 100,
        earnings: calculateEarnings(finalDist),
      };

      await saveTrip(completedTrip);
      await clearActiveTrip();
      await clearBgDistance();
      
      if (user?.employeeId) {
        await removeLiveLocation(user.employeeId);
      }

      clearInterval(tripTimerRef.current);
      clearInterval(distancePollRef.current);
      if (locationSubscription.current) {
        locationSubscription.current.remove();
        locationSubscription.current = null;
      }

      setActiveTrip(null);
      setLiveDistance(0);
      setElapsedSeconds(0);
      setGpsStatus('off');
      await loadTodayStats();

      showAlert(
        '✅ Trip Completed!',
        `Distance: ${formatKM(completedTrip.distanceKM)}\nEarnings: ${formatEarnings(completedTrip.earnings)}`
      );
    } catch (e) {
      showAlert('Error', 'Could not save trip. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }

  const { isDark, colors, shadows } = useTheme();
  const liveEarnings = calculateEarnings(liveDistance);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primaryDark }]}>
        <View style={{ flex: 1 }}>
          <Image 
            source={require('../assets/logo.jpg')} 
            style={styles.headerLogo} 
            resizeMode="contain" 
          />
          <Text style={styles.greeting}>Good {getGreeting()},</Text>
          <Text style={styles.userName}>{user?.name || 'Field Executive'}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <ThemeToggle />
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>
              {(user?.name || 'U').charAt(0).toUpperCase()}
            </Text>
          </View>
        </View>
      </View>

      {/* Offline Banner */}
      {isOffline && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineText}>You are offline — trips saving locally</Text>
        </View>
      )}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Date & Time */}
        <View style={styles.dateTimeCard}>
          <Text style={styles.dateText}>{formatDate(now)}</Text>
          <Text style={styles.clockText}>{formatTime(now, true)}</Text>
        </View>

        {/* GPS Status + Today Stats */}
        <View style={styles.statsRow}>
          {/* GPS Badge */}
          <View style={[styles.gpsBadge, gpsStatus !== 'active' && styles.gpsBadgeOff]}>
            <Animated.View
              style={[
                styles.gpsDot,
                gpsStatus !== 'active' && styles.gpsDotOff,
                { opacity: gpsStatus === 'active' ? pulseAnim : 1 },
              ]}
            />
            <Text style={[styles.gpsText, gpsStatus !== 'active' && styles.gpsTextOff]}>
              GPS {gpsStatus === 'active' ? 'ACTIVE' : 'OFF'}
            </Text>
          </View>

          {/* Today KM */}
          <View style={styles.statCard}>
            <Text style={styles.statVal}>{formatKM(todayKM)}</Text>
            <Text style={styles.statLbl}>Today's KM</Text>
          </View>

          {/* Today Earnings */}
          <View style={styles.statCard}>
            <Text style={[styles.statVal, { color: COLORS.success }]}>
              {formatEarnings(todayEarnings)}
            </Text>
            <Text style={styles.statLbl}>Today's Earnings</Text>
          </View>
        </View>

        {/* Employee ID badge */}
        <View style={styles.idBadge}>
          <Ionicons name="id-card-outline" size={14} color={COLORS.textSecondary} />
          <Text style={styles.idText}>ID: {user?.employeeId}</Text>
          <Text style={styles.idSep}>•</Text>
          <Text style={styles.idText}>{user?.designation || 'Field Executive'}</Text>
        </View>

        {/* GPS Off Banner */}
        {gpsStatus === 'off' && (
          <TouchableOpacity
            style={styles.gpsBanner}
            onPress={() => Linking.openSettings()}
            activeOpacity={0.85}
          >
            <Ionicons name="warning-outline" size={18} color={COLORS.white} />
            <Text style={styles.gpsBannerText}>
              GPS is turned off. Tap to enable in settings.
            </Text>
            <Ionicons name="chevron-forward" size={16} color={COLORS.white} />
          </TouchableOpacity>
        )}

        {/* Live Trip Banner */}
        {activeTrip && (
          <LiveTripBanner
            distanceKM={liveDistance}
            earnings={liveEarnings}
            elapsedSeconds={elapsedSeconds}
          />
        )}

        {/* Live Coords (while trip active) */}
        {activeTrip && currentCoords && (
          <View style={styles.coordsCard}>
            <Ionicons name="location" size={14} color={COLORS.primary} />
            <Text style={styles.coordsText}>
              {formatCoords(currentCoords.lat, currentCoords.lng)}
            </Text>
          </View>
        )}

        {/* CTA Buttons */}
        <View style={styles.ctaSection}>
          {/* OUT TIME */}
          <TouchableOpacity
            style={[styles.outBtn, (!!activeTrip || isSaving) && styles.btnDisabled]}
            activeOpacity={0.85}
            onPress={handleOutTime}
            disabled={!!activeTrip || isSaving}
          >
            <Ionicons name="log-out-outline" size={24} color={COLORS.white} />
            <View>
              <Text style={styles.ctaBtnTitle}>OUT TIME</Text>
              <Text style={styles.ctaBtnSub}>Start New Trip</Text>
            </View>
          </TouchableOpacity>

          {/* IN TIME */}
          <TouchableOpacity
            style={[styles.inBtn, (!activeTrip || isSaving) && styles.btnDisabled]}
            activeOpacity={0.85}
            onPress={handleInTime}
            disabled={!activeTrip || isSaving}
          >
            <Ionicons name="log-in-outline" size={24} color={COLORS.white} />
            <View>
              <Text style={styles.ctaBtnTitle}>{isSaving ? 'Saving...' : 'IN TIME'}</Text>
              <Text style={styles.ctaBtnSub}>End Current Trip</Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Morning';
  if (h < 17) return 'Afternoon';
  return 'Evening';
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  header: {
    backgroundColor: COLORS.primaryDark,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.base,
    paddingTop: Platform.OS === 'android' ? 20 : 8, // Fixed overlap with status bar icons
    paddingBottom: SPACING.base,
  },
  headerLogo: {
    width: 80,
    height: 30,
    marginBottom: 4,
    backgroundColor: COLORS.white,
    borderRadius: 4,
    padding: 2,
  },
  greeting: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZES.sm,
    color: 'rgba(255,255,255,0.75)',
  },
  userName: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZES.xl,
    color: COLORS.white,
  },
  avatarCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZES.xl,
    color: COLORS.white,
  },
  scroll: { flex: 1 },
  scrollContent: { padding: SPACING.base, paddingBottom: SPACING.xxxl },

  offlineBanner: {
    backgroundColor: '#FF6B35',
    paddingVertical: 6,
    paddingHorizontal: SPACING.base,
    alignItems: 'center',
    justifyContent: 'center',
  },
  offlineText: {
    color: COLORS.white,
    fontFamily: FONTS.semiBold,
    fontSize: FONT_SIZES.xs,
  },

  dateTimeCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.card,
    padding: SPACING.base,
    alignItems: 'center',
    marginBottom: SPACING.md,
    ...SHADOWS.subtle,
  },
  dateText: {
    fontFamily: FONTS.semiBold,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  clockText: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZES.display,
    color: COLORS.textPrimary,
    letterSpacing: 2,
  },

  statsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  gpsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.badge,
    borderRadius: RADIUS.pill,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.sm,
    gap: 5,
    flex: 1,
    justifyContent: 'center',
  },
  gpsBadgeOff: {
    backgroundColor: COLORS.badgeDangerBg,
  },
  gpsDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },
  gpsDotOff: {
    backgroundColor: COLORS.danger,
  },
  gpsText: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZES.xs,
    color: COLORS.primary,
  },
  gpsTextOff: {
    color: COLORS.danger,
  },
  statCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.card,
    padding: SPACING.sm,
    alignItems: 'center',
    flex: 1.2,
    ...SHADOWS.subtle,
  },
  statVal: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
  },
  statLbl: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },

  idBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.xs,
  },
  idText: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },
  idSep: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.xs,
  },

  gpsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.danger,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  gpsBannerText: {
    fontFamily: FONTS.semiBold,
    fontSize: FONT_SIZES.sm,
    color: COLORS.white,
    flex: 1,
  },

  coordsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.badge,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    marginBottom: SPACING.md,
  },
  coordsText: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },

  ctaSection: {
    gap: SPACING.md,
    marginTop: SPACING.sm,
  },
  outBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.danger,
    borderRadius: RADIUS.pill,
    paddingVertical: SPACING.base,
    paddingHorizontal: SPACING.xl,
    gap: SPACING.md,
    ...SHADOWS.card,
  },
  inBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.success,
    borderRadius: RADIUS.pill,
    paddingVertical: SPACING.base,
    paddingHorizontal: SPACING.xl,
    gap: SPACING.md,
    ...SHADOWS.card,
  },
  btnDisabled: {
    opacity: 0.38,
  },
  ctaBtnTitle: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZES.lg,
    color: COLORS.white,
    textAlign: 'center',
  },
  ctaBtnSub: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZES.xs,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
  },
});
