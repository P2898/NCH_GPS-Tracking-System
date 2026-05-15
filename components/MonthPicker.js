// components/MonthPicker.js
import React, { useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS, FONTS, FONT_SIZES, SPACING, RADIUS } from '../constants/theme';

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

export default function MonthPicker({ selectedMonth, selectedYear, onSelect }) {
  const scrollRef = useRef(null);

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {MONTHS.map((month, index) => {
          const monthNumber = index + 1;
          const isActive = selectedMonth === monthNumber;

          return (
            <TouchableOpacity
              key={month}
              activeOpacity={0.7}
              onPress={() => onSelect(monthNumber)}
              style={[styles.tab, isActive && styles.tabActive]}
            >
              <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                {month}
              </Text>
              {isActive && <View style={styles.indicator} />}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      <Text style={styles.yearLabel}>{selectedYear}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.sm,
  },
  scrollContent: {
    paddingHorizontal: SPACING.base,
    gap: SPACING.xs,
  },
  tab: {
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.pill,
    alignItems: 'center',
    position: 'relative',
  },
  tabActive: {
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  tabText: {
    fontFamily: FONTS.semiBold,
    fontSize: FONT_SIZES.sm,
    color: COLORS.tabInactiveIcon,
  },
  tabTextActive: {
    color: COLORS.white,
  },
  indicator: {
    position: 'absolute',
    bottom: 2,
    width: 16,
    height: 3,
    borderRadius: 2,
    backgroundColor: COLORS.white,
  },
  yearLabel: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZES.xs,
    color: COLORS.tabInactiveIcon,
    textAlign: 'center',
    paddingBottom: SPACING.xs,
  },
});
