// components/LiveTripBanner.js
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, FONT_SIZES, SPACING, RADIUS, SHADOWS } from '../constants/theme';
import { formatDuration } from '../utils/formatters';

export default function LiveTripBanner({ distanceKM = 0, earnings = 0, elapsedSeconds = 0 }) {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.2,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  return (
    <View style={styles.banner}>
      {/* Header Row */}
      <View style={styles.headerRow}>
        <Animated.View style={[styles.pulseDot, { opacity: pulseAnim }]} />
        <Text style={styles.bannerTitle}>TRIP IN PROGRESS</Text>
        <View style={styles.timerBadge}>
          <Ionicons name="time-outline" size={12} color={COLORS.white} />
          <Text style={styles.timerText}>{formatDuration(elapsedSeconds)}</Text>
        </View>
      </View>

      {/* Live Stats Row */}
      <View style={styles.liveDistanceContainer}>
        <Text style={styles.liveDistanceText}>
          {distanceKM.toFixed(2)} KM covered
        </Text>
        <Text style={styles.liveEarningsText}>
          ₹{earnings.toFixed(2)} earned
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.card,
    padding: SPACING.base,
    marginBottom: SPACING.md,
    borderWidth: 2,
    borderColor: '#333788',
    ...SHADOWS.card,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  pulseDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#333788',
    marginRight: SPACING.sm,
  },
  bannerTitle: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZES.sm,
    color: '#333788',
    letterSpacing: 1,
    flex: 1,
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#333788',
    borderRadius: RADIUS.pill,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    gap: 4,
  },
  timerText: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZES.xs,
    color: COLORS.white,
    letterSpacing: 1,
  },
  liveDistanceContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
  },
  liveDistanceText: {
    fontFamily: FONTS.bold,
    fontSize: 28, // Large text
    color: '#333788',
    marginBottom: 4,
  },
  liveEarningsText: {
    fontFamily: FONTS.semiBold,
    fontSize: FONT_SIZES.md,
    color: COLORS.success,
  },
});
