// components/TripCard.js
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, FONT_SIZES, SPACING, RADIUS, SHADOWS } from '../constants/theme';
import { formatDate, formatTime, formatKM, formatEarnings, formatMinutes } from '../utils/formatters';

export default function TripCard({ trip }) {
  const [expanded, setExpanded] = useState(false);

  const dateStr = formatDate(trip.date);
  const outTime = formatTime(trip.outTime);
  const inTime = trip.inTime ? formatTime(trip.inTime) : '--:--';
  const km = formatKM(trip.distanceKM);
  const earnings = formatEarnings(trip.earnings);
  const duration = formatMinutes(trip.durationMinutes);
  const customersStr = Array.isArray(trip.customers)
    ? trip.customers.join(', ')
    : trip.customers || '—';

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => setExpanded(!expanded)}
      style={styles.card}
    >
      {/* Top Row */}
      <View style={styles.topRow}>
        <View style={styles.dateBadge}>
          <Ionicons name="calendar-outline" size={14} color={COLORS.primary} />
          <Text style={styles.dateText}>{dateStr}</Text>
        </View>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={COLORS.textSecondary}
        />
      </View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Ionicons name="speedometer-outline" size={18} color={COLORS.primary} />
          <Text style={styles.statValue}>{km}</Text>
          <Text style={styles.statLabel}>Distance</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Ionicons name="cash-outline" size={18} color={COLORS.success} />
          <Text style={[styles.statValue, { color: COLORS.success }]}>{earnings}</Text>
          <Text style={styles.statLabel}>Earnings</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Ionicons name="time-outline" size={18} color={COLORS.textSecondary} />
          <Text style={styles.statValue}>{duration}</Text>
          <Text style={styles.statLabel}>Duration</Text>
        </View>
      </View>

      {/* Time Row */}
      <View style={styles.timeRow}>
        <View style={styles.timeChip}>
          <Ionicons name="log-out-outline" size={13} color={COLORS.danger} />
          <Text style={styles.timeLabel}>OUT: </Text>
          <Text style={styles.timeValue}>{outTime}</Text>
        </View>
        <View style={styles.timeChip}>
          <Ionicons name="log-in-outline" size={13} color={COLORS.success} />
          <Text style={styles.timeLabel}>IN: </Text>
          <Text style={styles.timeValue}>{inTime}</Text>
        </View>
      </View>

      {/* Expanded Details */}
      {expanded && (
        <View style={styles.expandedSection}>
          <View style={styles.divider} />
          <Text style={styles.sectionLabel}>Customers Visited</Text>
          <Text style={styles.customersText}>{customersStr}</Text>

          {trip.coordinates && trip.coordinates.length > 0 && (
            <>
              <Text style={styles.sectionLabel}>Coordinate Points Recorded</Text>
              <Text style={styles.coordCount}>
                {trip.coordinates.length} GPS points tracked
              </Text>
            </>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: RADIUS.card,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.tripCardBorder,
    padding: SPACING.base,
    marginBottom: SPACING.md,
    ...SHADOWS.card,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  dateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateText: {
    fontFamily: FONTS.semiBold,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textPrimary,
    marginLeft: 4,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginBottom: SPACING.md,
    backgroundColor: COLORS.badge,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.sm,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZES.base,
    color: COLORS.textPrimary,
    marginTop: 2,
  },
  statLabel: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  statDivider: {
    width: 1,
    height: 36,
    backgroundColor: COLORS.border,
  },
  timeRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  timeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.badge,
    borderRadius: RADIUS.pill,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    gap: 2,
  },
  timeLabel: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },
  timeValue: {
    fontFamily: FONTS.semiBold,
    fontSize: FONT_SIZES.xs,
    color: COLORS.textPrimary,
  },
  expandedSection: {
    marginTop: SPACING.sm,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.sm,
  },
  sectionLabel: {
    fontFamily: FONTS.semiBold,
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  customersText: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
    lineHeight: 20,
  },
  coordCount: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
});
