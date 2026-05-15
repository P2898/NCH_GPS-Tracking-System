// components/CustomerCheckbox.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, FONT_SIZES, SPACING, RADIUS } from '../constants/theme';

export default function CustomerCheckbox({ customer, selected, onToggle }) {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => onToggle(customer.id)}
      style={[styles.row, selected && styles.rowSelected]}
    >
      {/* Checkbox */}
      <View style={[styles.checkbox, selected && styles.checkboxSelected]}>
        {selected && (
          <Ionicons name="checkmark" size={14} color={COLORS.white} />
        )}
      </View>

      {/* Customer Info */}
      <View style={styles.info}>
        <Text style={[styles.companyName, selected && styles.companyNameSelected]}>
          {customer.companyName}
        </Text>
        <View style={styles.metaRow}>
          <Ionicons name="location-outline" size={11} color={COLORS.textSecondary} />
          <Text style={styles.city}>{customer.city}</Text>
          <Text style={styles.separator}>•</Text>
          <Text style={styles.purity}>{customer.purity}</Text>
          <Text style={styles.separator}>•</Text>
          <Text style={styles.weight}>{customer.weightGm}g</Text>
        </View>
      </View>

      {/* Box No badge */}
      <View style={[styles.badge, selected && styles.badgeSelected]}>
        <Text style={[styles.badgeText, selected && styles.badgeTextSelected]}>
          {customer.boxNo}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBackground,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.base,
    marginBottom: SPACING.sm,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  rowSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.badge,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
    backgroundColor: COLORS.white,
  },
  checkboxSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary,
  },
  info: {
    flex: 1,
  },
  companyName: {
    fontFamily: FONTS.semiBold,
    fontSize: FONT_SIZES.base,
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  companyNameSelected: {
    color: COLORS.primary,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  city: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginLeft: 2,
  },
  separator: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.xs,
  },
  purity: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },
  weight: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },
  badge: {
    backgroundColor: COLORS.badge,
    borderRadius: RADIUS.pill,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    marginLeft: SPACING.sm,
  },
  badgeSelected: {
    backgroundColor: COLORS.primary,
  },
  badgeText: {
    fontFamily: FONTS.semiBold,
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },
  badgeTextSelected: {
    color: COLORS.white,
  },
});
