// screens/SummaryScreen.js
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Platform,
  Image,
} from 'react-native';
import { exportPDF } from '../utils/pdfExport';
import { showAlert } from '../utils/crossPlatform';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { BarChart } from 'react-native-chart-kit';

import MonthPicker from '../components/MonthPicker';
import SummaryCard from '../components/SummaryCard';
import ThemeToggle from '../components/ThemeToggle';
import { getAllTrips } from '../utils/storage';
import {
  formatKM,
  formatEarnings,
  getMonthName,
  formatShortDate,
  calculateEarnings,
} from '../utils/formatters';
import { COLORS, FONTS, FONT_SIZES, SPACING, RADIUS, SHADOWS } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function SummaryScreen({ user }) {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear] = useState(now.getFullYear());
  const [monthTrips, setMonthTrips] = useState([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      loadMonthData(selectedMonth, selectedYear);
    }, [selectedMonth, selectedYear])
  );

  async function loadMonthData(month, year) {
    setLoading(true);
    try {
      const all = await getAllTrips();
      const filtered = all.filter((t) => {
        const d = new Date(t.date);
        return d.getMonth() + 1 === month && d.getFullYear() === year;
      });
      setMonthTrips(filtered);
    } finally {
      setLoading(false);
    }
  }

  function handleMonthSelect(m) {
    setSelectedMonth(m);
  }

  // ─── Derived stats ─────────────────────────────────────────────────────────
  const totalTrips = monthTrips.length;
  const totalKM = monthTrips.reduce((s, t) => s + (t.distanceKM || 0), 0);
  const totalEarnings = monthTrips.reduce((s, t) => s + (t.earnings || 0), 0);
  const avgKM = totalTrips > 0 ? totalKM / totalTrips : 0;

  // ─── Daily KM bar chart data ───────────────────────────────────────────────
  const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
  const dailyKM = Array(daysInMonth).fill(0);
  monthTrips.forEach((t) => {
    const day = new Date(t.date).getDate();
    dailyKM[day - 1] += t.distanceKM || 0;
  });

  // Chunk into groups of 10 for readability
  const chartLabels = Array.from({ length: daysInMonth }, (_, i) => (i + 1) % 5 === 0 || i === 0 ? String(i + 1) : '');
  const chartData = {
    labels: chartLabels,
    datasets: [{ data: dailyKM.map((v) => Math.round(v * 100) / 100) }],
  };



  // ─── Export PDF ─────────────────────────────────────────────────────────────
  async function handleExport() {
    try {
      const trips = monthTrips
        .slice()
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .map((t) => ({
          ...t,
          dateStr: formatShortDate(t.date),
        }));

      await exportPDF({
        month: getMonthName(selectedMonth),
        year: selectedYear,
        employeeName: user?.name || 'Field Executive',
        employeeId: user?.employeeId || '—',
        bikeNumber: user?.bikeNumber || '—',
        totalTrips,
        totalKM: Math.round(totalKM * 100) / 100,
        totalEarnings: Math.round(totalEarnings * 100) / 100,
        avgKM: Math.round(avgKM * 100) / 100,
        trips,
      });
    } catch (e) {
      showAlert('Export Error', 'Could not generate PDF. Please try again.');
    }
  }

  const { isDark, colors, shadows } = useTheme();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <StatusBar style="light" />

      {/* Month Picker (built into top area) */}
      <View style={[styles.headerWrap, { backgroundColor: colors.primaryDark }]}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Image 
              source={require('../assets/logo.jpg')} 
              style={styles.headerLogo} 
              resizeMode="contain" 
            />
            <Text style={styles.headerTitle}>Monthly Summary</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <TouchableOpacity style={styles.exportBtn} onPress={handleExport} disabled={totalTrips === 0}>
              <Ionicons name="document-outline" size={18} color={COLORS.white} />
              <Text style={styles.exportBtnText}>Export PDF</Text>
            </TouchableOpacity>
            <ThemeToggle />
          </View>
        </View>
        <MonthPicker
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
          onSelect={handleMonthSelect}
        />
      </View>

      {loading ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading summary...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Stats Cards Row */}
          <View style={styles.cardsRow}>
            <SummaryCard
              icon="car-outline"
              label="Trips"
              value={String(totalTrips)}
              style={styles.cardFlex}
            />
            <SummaryCard
              icon="speedometer-outline"
              label="Total KM"
              value={`${Math.round(totalKM * 100) / 100}`}
              subValue="kilometres"
              style={styles.cardFlex}
            />
          </View>
          <View style={[styles.cardsRow, { marginTop: SPACING.sm }]}>
            <SummaryCard
              icon="cash-outline"
              label="Earnings"
              value={formatEarnings(Math.round(totalEarnings * 100) / 100)}
              style={styles.cardFlex}
            />
            <SummaryCard
              icon="analytics-outline"
              label="Avg KM/Trip"
              value={`${Math.round(avgKM * 100) / 100}`}
              subValue="km per trip"
              style={styles.cardFlex}
            />
          </View>

          {/* Bar Chart */}
          {totalTrips > 0 ? (
            <View style={styles.chartCard}>
              <Text style={styles.sectionTitle}>Daily KM — {getMonthName(selectedMonth)}</Text>
              <BarChart
                data={chartData}
                width={SCREEN_WIDTH - SPACING.base * 2 - SPACING.xl}
                height={180}
                fromZero
                showValuesOnTopOfBars={false}
                withInnerLines={false}
                chartConfig={{
                  backgroundColor: COLORS.white,
                  backgroundGradientFrom: COLORS.white,
                  backgroundGradientTo: COLORS.white,
                  decimalPlaces: 1,
                  color: () => COLORS.chartBarFill,
                  labelColor: () => COLORS.chartLabel,
                  style: { borderRadius: RADIUS.md },
                  propsForBars: { rx: 4, ry: 4 },
                  fillShadowGradient: COLORS.chartBarFill,
                  fillShadowGradientOpacity: 1,
                }}
                style={styles.chart}
              />
            </View>
          ) : (
            <View style={styles.emptyChart}>
              <Ionicons name="bar-chart-outline" size={48} color={COLORS.border} />
              <Text style={styles.emptyChartText}>No trips in {getMonthName(selectedMonth)}</Text>
            </View>
          )}



          {/* Trip List Preview */}
          {totalTrips > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>All Trips ({totalTrips})</Text>
              {monthTrips
                .slice()
                .sort((a, b) => new Date(b.date) - new Date(a.date))
                .map((t) => (
                  <View key={t.id} style={styles.tripRow}>
                    <View style={styles.tripRowLeft}>
                      <Text style={styles.tripDate}>{formatShortDate(t.date)}</Text>
                    </View>
                    <View style={styles.tripRowRight}>
                      <Text style={styles.tripKM}>{formatKM(t.distanceKM)}</Text>
                      <Text style={styles.tripEarnings}>{formatEarnings(t.earnings)}</Text>
                    </View>
                  </View>
                ))}
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  headerWrap: { backgroundColor: COLORS.primaryDark },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.base,
    paddingTop: Platform.OS === 'android' ? 20 : 8,
    paddingBottom: SPACING.sm,
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
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: RADIUS.pill,
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
  },
  exportBtnText: {
    fontFamily: FONTS.semiBold,
    fontSize: FONT_SIZES.sm,
    color: COLORS.white,
  },
  scroll: { flex: 1 },
  scrollContent: { padding: SPACING.base, paddingBottom: SPACING.section },

  cardsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  cardFlex: { flex: 1 },

  chartCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.card,
    padding: SPACING.base,
    marginTop: SPACING.md,
    ...SHADOWS.card,
    overflow: 'hidden',
  },
  chart: {
    marginTop: SPACING.sm,
    borderRadius: RADIUS.md,
    marginLeft: -SPACING.md,
  },

  emptyChart: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.card,
    padding: SPACING.xxl,
    marginTop: SPACING.md,
    alignItems: 'center',
    gap: SPACING.sm,
    ...SHADOWS.subtle,
  },
  emptyChartText: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },

  section: {
    marginTop: SPACING.md,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.card,
    padding: SPACING.base,
    ...SHADOWS.card,
  },
  sectionTitle: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZES.base,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },

  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: SPACING.sm,
  },
  customerRank: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: COLORS.badge,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customerRankText: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZES.xs,
    color: COLORS.primary,
  },
  customerName: {
    fontFamily: FONTS.semiBold,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textPrimary,
    flex: 1,
  },
  visitBadge: {
    backgroundColor: COLORS.badge,
    borderRadius: RADIUS.pill,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
  },
  visitBadgeText: {
    fontFamily: FONTS.semiBold,
    fontSize: FONT_SIZES.xs,
    color: COLORS.primary,
  },

  tripRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tripRowLeft: { flex: 1, marginRight: SPACING.sm },
  tripDate: {
    fontFamily: FONTS.semiBold,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textPrimary,
  },
  tripCustomers: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  tripRowRight: { alignItems: 'flex-end' },
  tripKM: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textPrimary,
  },
  tripEarnings: {
    fontFamily: FONTS.semiBold,
    fontSize: FONT_SIZES.sm,
    color: COLORS.success,
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
});
