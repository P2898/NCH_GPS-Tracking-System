// screens/ProfileScreen.js
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Switch,
  Platform,
  ActivityIndicator,
  Image,
} from 'react-native';
import { confirmDialog, showAlert } from '../utils/crossPlatform';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

import {
  clearUserSession,
  deleteAllTrips,
  clearActiveTrip,
  clearBgDistance,
  saveGpsEnabled,
  getGpsEnabled,
  saveBgTracking,
  getBgTracking,
} from '../utils/storage';

import { COLORS, FONTS, FONT_SIZES, SPACING, RADIUS, SHADOWS } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import ThemeToggle from '../components/ThemeToggle';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ProfileScreen({ user, onLogout }) {
  const { isDark, colors, shadows, toggleTheme } = useTheme();
  const [gpsEnabled, setGpsEnabled] = useState(true);
  const [bgTracking, setBgTrackingState] = useState(true);
  const [clearing, setClearing] = useState(false);
  const [ratePerKm, setRatePerKm] = useState(4); // Default to 4

  useFocusEffect(
    useCallback(() => {
      loadSettings();
    }, [])
  );

  async function loadSettings() {
    const gps = await getGpsEnabled();
    const bg = await getBgTracking();
    setGpsEnabled(gps);
    setBgTrackingState(bg);
    
    // Load dynamic rate from storage or formatters default
    try {
      const storageRate = await AsyncStorage.getItem('km_rate');
      if (storageRate) {
        const parsed = parseFloat(storageRate);
        if (!isNaN(parsed)) setRatePerKm(parsed);
      }
    } catch(e) {}
  }

  async function handleGpsToggle(val) {
    setGpsEnabled(val);
    await saveGpsEnabled(val);
  }

  async function handleBgTrackingToggle(val) {
    setBgTrackingState(val);
    await saveBgTracking(val);
  }



  function confirmLogout() {
    confirmDialog(
      'Logout',
      'Are you sure you want to log out? Your trip data will remain saved.',
      handleLogout
    );
  }

  async function handleLogout() {
    try {

      await clearUserSession();
      onLogout();
    } catch (e) {
      await clearUserSession();
      onLogout();
    }
  }

  const initials = user?.name
    ? user.name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
    : 'FE';

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <StatusBar style={isDark ? 'light' : 'light'} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primaryDark }]}>
        <View style={{ flex: 1 }}>
          <Image 
            source={require('../assets/logo.jpg')} 
            style={styles.headerLogo} 
            resizeMode="contain" 
          />
          <Text style={styles.headerTitle}>Profile & Settings</Text>
        </View>
        <ThemeToggle />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user?.name || 'Field Executive'}</Text>
            <Text style={styles.profileId}>ID: {user?.employeeId || '—'}</Text>
            <View style={styles.bikeInfo}>
              <Ionicons name="bicycle" size={12} color="rgba(255,255,255,0.75)" />
              <Text style={styles.profileBike}>{user?.bikeNumber || '—'}</Text>
            </View>
            <View style={styles.designationBadge}>
              <Ionicons name="briefcase-outline" size={11} color={COLORS.primary} />
              <Text style={styles.designationText}>{user?.designation || 'Field Executive'}</Text>
            </View>
          </View>
        </View>

        {/* GPS Settings Section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>GPS & Tracking</Text>

          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <View style={[styles.iconWrap, { backgroundColor: COLORS.badge }]}>
                <Ionicons name="location-outline" size={20} color={COLORS.primary} />
              </View>
              <View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={styles.settingTitle}>GPS Tracking</Text>
                  <View style={styles.mandatoryBadge}>
                    <Text style={styles.mandatoryText}>MANDATORY</Text>
                  </View>
                </View>
                <Text style={styles.settingSubtitle}>Enable location tracking</Text>
              </View>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <View style={[styles.iconWrap, { backgroundColor: '#eef8ff' }]}>
                <Ionicons name="phone-portrait-outline" size={20} color="#1565C0" />
              </View>
              <View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={styles.settingTitle}>Background Tracking</Text>
                  <View style={styles.mandatoryBadge}>
                    <Text style={styles.mandatoryText}>MANDATORY</Text>
                  </View>
                </View>
                <Text style={styles.settingSubtitle}>Track when app is closed</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Rate Information */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Pay Rate</Text>
          <View style={styles.rateCard}>
            <View style={styles.rateLeft}>
              <Ionicons name="cash-outline" size={28} color={COLORS.success} />
              <View style={styles.rateContent}>
                <Text style={styles.rateValue}>₹{ratePerKm.toFixed(2)} / KM</Text>
                <Text style={styles.rateSubtitle}>Current reimbursement rate</Text>
              </View>
            </View>
            <View style={styles.rateBadge}>
              <Text style={styles.rateBadgeText}>READ ONLY</Text>
            </View>
          </View>
        </View>

        {/* Appearance */}
        <View style={[styles.section, { backgroundColor: colors.cardBackground, ...shadows.subtle }]}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Appearance</Text>

          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <View style={[styles.iconWrap, { backgroundColor: isDark ? '#2a2a45' : '#fff3e0' }]}>
                <Ionicons name={isDark ? 'moon' : 'sunny'} size={20} color={isDark ? '#7b82e8' : '#FF9800'} />
              </View>
              <View>
                <Text style={[styles.settingTitle, { color: colors.textPrimary }]}>Dark Mode</Text>
                <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>
                  {isDark ? 'Dark theme active' : 'Light theme active'}
                </Text>
              </View>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: COLORS.border, true: '#5c63d6' }}
              thumbColor={isDark ? '#7b82e8' : COLORS.textSecondary}
              ios_backgroundColor={COLORS.border}
            />
          </View>
        </View>


        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} activeOpacity={0.85} onPress={confirmLogout}>
          <Ionicons name="log-out-outline" size={22} color={COLORS.white} />
          <Text style={styles.logoutBtnText}>Logout</Text>
        </TouchableOpacity>

        <Text style={styles.loginTime}>
          Logged in: {user?.loginTime ? new Date(user.loginTime).toLocaleString('en-IN') : '—'}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  header: {
    backgroundColor: COLORS.primaryDark,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.base,
    paddingTop: Platform.OS === 'android' ? 20 : 8,
    paddingBottom: SPACING.md,
  },
  headerLogo: {
    width: 60,
    height: 24,
    marginBottom: 4,
    backgroundColor: COLORS.white,
    borderRadius: 4,
    padding: 2,
  },
  headerTitle: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZES.lg,
    color: COLORS.white,
  },
  scroll: { flex: 1 },
  scrollContent: { padding: SPACING.base, paddingBottom: SPACING.section },

  profileCard: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.card,
    padding: SPACING.base,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.base,
    marginBottom: SPACING.md,
    ...SHADOWS.card,
  },
  avatarCircle: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZES.xxl,
    color: COLORS.white,
  },
  profileInfo: { flex: 1 },
  profileName: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZES.lg,
    color: COLORS.white,
  },
  profileId: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZES.sm,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 2,
  },
  bikeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  profileBike: {
    fontFamily: FONTS.semiBold,
    fontSize: FONT_SIZES.sm,
    color: 'rgba(255,255,255,0.75)',
  },
  designationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: RADIUS.pill,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    marginTop: SPACING.xs,
    alignSelf: 'flex-start',
  },
  designationText: {
    fontFamily: FONTS.semiBold,
    fontSize: FONT_SIZES.xs,
    color: COLORS.white,
  },

  section: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.card,
    padding: SPACING.base,
    marginBottom: SPACING.md,
    ...SHADOWS.subtle,
  },
  sectionLabel: {
    fontFamily: FONTS.semiBold,
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: SPACING.md,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingTitle: {
    fontFamily: FONTS.semiBold,
    fontSize: FONT_SIZES.base,
    color: COLORS.textPrimary,
  },
  settingSubtitle: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.xs,
  },

  rateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rateLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  rateValue: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZES.xl,
    color: COLORS.textPrimary,
  },
  rateSubtitle: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  rateBadge: {
    backgroundColor: COLORS.badge,
    borderRadius: RADIUS.pill,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
  },
  rateBadgeText: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    letterSpacing: 0.5,
  },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.sm,
  },
  infoText: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textPrimary,
    flex: 1,
  },
  infoValue: {
    fontFamily: FONTS.semiBold,
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },


  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primaryDark,
    borderRadius: RADIUS.pill,
    paddingVertical: SPACING.base,
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
    ...SHADOWS.card,
  },
  logoutBtnText: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZES.md,
    color: COLORS.white,
  },
  loginTime: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  mandatoryBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  mandatoryText: {
    fontFamily: FONTS.bold,
    fontSize: 9,
    color: '#2E7D32',
  },
});
