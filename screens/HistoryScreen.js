// screens/HistoryScreen.js
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ScrollView,
  Modal,
  ActivityIndicator,
  Platform,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

import TripCard from '../components/TripCard';
import ThemeToggle from '../components/ThemeToggle';
import { getAllTrips } from '../utils/storage';
import { formatKM, formatEarnings, getMonthName } from '../utils/formatters';
import { COLORS, FONTS, FONT_SIZES, SPACING, RADIUS, SHADOWS } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';

const MONTH_OPTIONS = Array.from({ length: 12 }, (_, i) => ({
  value: i + 1,
  label: getMonthName(i + 1),
}));

export default function HistoryScreen() {
  const [trips, setTrips] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(0); // 0 = All
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showMonthPicker, setShowMonthPicker] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadTrips();
    }, [])
  );

  async function loadTrips() {
    setLoading(true);
    try {
      const all = await getAllTrips();
      const sorted = all.slice().sort((a, b) => new Date(b.date) - new Date(a.date));
      setTrips(sorted);
      applyFilter(sorted, selectedMonth);
    } finally {
      setLoading(false);
    }
  }

  function applyFilter(all, month) {
    if (month === 0) {
      setFiltered(all);
    } else {
      setFiltered(all.filter((t) => new Date(t.date).getMonth() + 1 === month));
    }
  }

  function selectMonth(m) {
    setSelectedMonth(m);
    applyFilter(trips, m);
    setShowMonthPicker(false);
  }

  async function onRefresh() {
    setRefreshing(true);
    await loadTrips();
    setRefreshing(false);
  }

  // Monthly summary for filtered trips
  const filteredKM = filtered.reduce((s, t) => s + (t.distanceKM || 0), 0);
  const filteredEarnings = filtered.reduce((s, t) => s + (t.earnings || 0), 0);

  const selectedMonthLabel = selectedMonth === 0 ? 'All Months' : getMonthName(selectedMonth);

  const { isDark, colors, shadows } = useTheme();

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
          <Text style={styles.headerTitle}>Trip History</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <TouchableOpacity
            style={styles.filterBtn}
            onPress={() => setShowMonthPicker(true)}
          >
            <Ionicons name="filter-outline" size={16} color={COLORS.white} />
            <Text style={styles.filterBtnText}>{selectedMonthLabel}</Text>
            <Ionicons name="chevron-down" size={14} color={COLORS.white} />
          </TouchableOpacity>
          <ThemeToggle />
        </View>
      </View>

      {/* Summary Row */}
      {filtered.length > 0 && (
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryVal}>{filtered.length}</Text>
            <Text style={styles.summaryLbl}>Trips</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryVal}>{formatKM(Math.round(filteredKM * 100) / 100)}</Text>
            <Text style={styles.summaryLbl}>Total KM</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryVal, { color: COLORS.success }]}>
              {formatEarnings(Math.round(filteredEarnings * 100) / 100)}
            </Text>
            <Text style={styles.summaryLbl}>Earnings</Text>
          </View>
        </View>
      )}

      {/* Trip List */}
      {loading ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading trips...</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <TripCard trip={item} />}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={COLORS.primary}
              colors={[COLORS.primary]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="document-text-outline" size={72} color={COLORS.border} />
              <Text style={styles.emptyTitle}>No Trips Yet</Text>
              <Text style={styles.emptySubtitle}>
                {selectedMonth !== 0
                  ? `No trips found for ${selectedMonthLabel}`
                  : 'Start your first trip from the Dashboard'}
              </Text>
              {selectedMonth !== 0 && (
                <TouchableOpacity
                  style={styles.clearFilterBtn}
                  onPress={() => selectMonth(0)}
                >
                  <Text style={styles.clearFilterText}>Show All Trips</Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      )}

      {/* Month Picker Modal */}
      <Modal
        visible={showMonthPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMonthPicker(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowMonthPicker(false)}
        >
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Filter by Month</Text>
            <TouchableOpacity
              style={[styles.monthOption, selectedMonth === 0 && styles.monthOptionActive]}
              onPress={() => selectMonth(0)}
            >
              <Text style={[styles.monthOptionText, selectedMonth === 0 && styles.monthOptionTextActive]}>
                All Months
              </Text>
              {selectedMonth === 0 && (
                <Ionicons name="checkmark" size={18} color={COLORS.primary} />
              )}
            </TouchableOpacity>
            {MONTH_OPTIONS.map((m) => (
              <TouchableOpacity
                key={m.value}
                style={[styles.monthOption, selectedMonth === m.value && styles.monthOptionActive]}
                onPress={() => selectMonth(m.value)}
              >
                <Text style={[styles.monthOptionText, selectedMonth === m.value && styles.monthOptionTextActive]}>
                  {m.label}
                </Text>
                {selectedMonth === m.value && (
                  <Ionicons name="checkmark" size={18} color={COLORS.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
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
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: RADIUS.pill,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    gap: 4,
  },
  filterBtnText: {
    fontFamily: FONTS.semiBold,
    fontSize: FONT_SIZES.sm,
    color: COLORS.white,
  },

  summaryRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.base,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    justifyContent: 'space-around',
  },
  summaryItem: { alignItems: 'center' },
  summaryVal: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
  },
  summaryLbl: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },
  summaryDivider: {
    width: 1,
    backgroundColor: COLORS.border,
    marginVertical: 4,
  },

  listContent: {
    padding: SPACING.base,
    paddingBottom: SPACING.xxxl,
    flexGrow: 1,
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  loadingText: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: SPACING.xxxl,
    gap: SPACING.md,
  },
  emptyTitle: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZES.xl,
    color: COLORS.textSecondary,
  },
  emptySubtitle: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    paddingHorizontal: SPACING.xl,
  },
  clearFilterBtn: {
    backgroundColor: COLORS.badge,
    borderRadius: RADIUS.pill,
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.sm,
    marginTop: SPACING.sm,
  },
  clearFilterText: {
    fontFamily: FONTS.semiBold,
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
    padding: SPACING.base,
  },
  modalCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.card,
    padding: SPACING.base,
    ...SHADOWS.strong,
  },
  modalTitle: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  monthOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  monthOptionActive: {
    backgroundColor: COLORS.badge,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.sm,
  },
  monthOptionText: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZES.base,
    color: COLORS.textPrimary,
  },
  monthOptionTextActive: {
    fontFamily: FONTS.semiBold,
    color: COLORS.primary,
  },
});
