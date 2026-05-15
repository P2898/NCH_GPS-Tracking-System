// components/SummaryCard.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, FONT_SIZES, SPACING, RADIUS, SHADOWS } from '../constants/theme';

export default function SummaryCard({ icon, label, value, subValue, style }) {
  return (
    <View style={[styles.card, style]}>
      <View style={styles.iconWrap}>
        <Ionicons name={icon} size={22} color={COLORS.white} />
      </View>
      <Text style={styles.value}>{value}</Text>
      {subValue ? <Text style={styles.subValue}>{subValue}</Text> : null}
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.summaryCardBg,
    borderRadius: RADIUS.card,
    padding: SPACING.base,
    alignItems: 'center',
    flex: 1,
    ...SHADOWS.card,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  value: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZES.xl,
    color: COLORS.summaryCardText,
    textAlign: 'center',
  },
  subValue: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZES.xs,
    color: COLORS.summaryCardSubLabel,
    textAlign: 'center',
    marginTop: 1,
  },
  label: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZES.xs,
    color: COLORS.summaryCardSubLabel,
    textAlign: 'center',
    marginTop: SPACING.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
