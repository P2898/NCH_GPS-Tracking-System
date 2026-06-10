import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { COLORS, FONTS, FONT_SIZES, SPACING, RADIUS, SHADOWS } from '../../constants/theme';
import { formatKM, formatEarnings, getMonthName } from '../../utils/formatters';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function AdminEmployeeDetailScreen({ route, navigation }) {
  const { employee } = route.params;
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [expandedTrip, setExpandedTrip] = useState(null);

  const monthTrips = useMemo(() => {
    return employee.trips.filter(t => (t.month - 1) === selectedMonth)
      .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
  }, [employee.trips, selectedMonth]);

  const stats = useMemo(() => {
    let tKM = 0, tEarn = 0;
    let maxDayKM = 0;
    
    monthTrips.forEach(t => {
      const km = parseFloat(t.distanceKM || 0);
      tKM += km;
      tEarn += parseFloat(t.earnings || 0);
      if (km > maxDayKM) maxDayKM = km;
    });

    const total = monthTrips.length;
    return {
      totalTrips: total,
      totalKM: tKM,
      totalEarnings: tEarn,
      avgKM: total > 0 ? (tKM / total).toFixed(2) : 0,
      bestDayKM: maxDayKM.toFixed(2),
    };
  }, [monthTrips]);

  const exportPDF = async () => {
    try {
      const htmlContent = `
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              h1 { color: #333788; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #333788; color: white; }
              tr:nth-child(even) { background-color: #f4f4fb; }
            </style>
          </head>
          <body>
            <h1>NCH GPS Tracker — Employee Report</h1>
            <p>Generated on: ${new Date().toLocaleString()}</p>
            <p>Employee: <b>${employee.employeeName}</b> (${employee.employeeId})</p>
            <p>Report Period: ${MONTHS[selectedMonth]} ${new Date().getFullYear()}</p>
            
            <table style="width: 50%; margin-bottom: 20px;">
              <tr><th>Total Trips</th><td>${stats.totalTrips}</td></tr>
              <tr><th>Total KM</th><td>${formatKM(stats.totalKM)}</td></tr>
              <tr><th>Total Earnings</th><td>${formatEarnings(stats.totalEarnings)}</td></tr>
            </table>

            <table>
              <tr>
                <th>No.</th>
                <th>Date</th>
                <th>Bike</th>
                <th>OUT</th>
                <th>IN</th>
                <th>Duration</th>
                <th>KM</th>
                <th>Earnings</th>
              </tr>
              ${monthTrips.map((t, i) => `
                <tr>
                  <td>${i + 1}</td>
                  <td>${t.date}</td>
                  <td>${t.bikeNumber}</td>
                  <td>${t.outTime}</td>
                  <td>${t.inTime}</td>
                  <td>${t.durationMinutes ? Math.floor(t.durationMinutes/60) + 'h ' + t.durationMinutes%60 + 'm' : 'Live'}</td>
                  <td>${formatKM(t.distanceKM)}</td>
                  <td>${formatEarnings(t.earnings)}</td>
                </tr>
              `).join('')}
            </table>
          </body>
        </html>
      `;
      
      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      await Sharing.shareAsync(uri);
    } catch (error) {
      Alert.alert('Export Error', 'Failed to generate PDF');
    }
  };

  const initials = employee.employeeName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

  const renderTripCard = ({ item }) => {
    const isExpanded = expandedTrip === item.id;
    return (
      <TouchableOpacity 
        style={styles.tripCard}
        onPress={() => setExpandedTrip(isExpanded ? null : item.id)}
        activeOpacity={0.7}
      >
        <View style={styles.tripCardHeader}>
          <Text style={styles.tripDate}>{item.date}</Text>
          <Text style={styles.tripTime}>{item.outTime || '--'} &rarr; {item.inTime || 'Active'}</Text>
        </View>
        
        <View style={styles.tripMetrics}>
          <Text style={styles.tripMetricText}>{formatKM(item.distanceKM)}</Text>
          <Text style={styles.tripMetricText}>|</Text>
          <Text style={styles.tripMetricText}>{item.durationMinutes ? `${item.durationMinutes}m` : 'Live'}</Text>
          <Text style={styles.tripMetricText}>|</Text>
          <Text style={[styles.tripMetricText, { color: COLORS.success, fontFamily: FONTS.bold }]}>
            {formatEarnings(item.earnings)}
          </Text>
        </View>

        {isExpanded && (
          <View style={styles.expandedContent}>
            <View style={styles.divider} />
            <Text style={styles.detailText}><Text style={styles.detailLabel}>Bike Number: </Text>{item.bikeNumber || 'N/A'}</Text>
            <Text style={styles.detailText}><Text style={styles.detailLabel}>Start Coords: </Text>{item.startLocation || 'N/A'}</Text>
            <Text style={styles.detailText}><Text style={styles.detailLabel}>End Coords: </Text>{item.endLocation || 'N/A'}</Text>
            <Text style={styles.detailText}><Text style={styles.detailLabel}>Duration: </Text>{item.durationMinutes ? `${Math.floor(item.durationMinutes/60)}h ${item.durationMinutes%60}m` : 'Active'}</Text>
            <Text style={styles.detailText}><Text style={styles.detailLabel}>Month/Year: </Text>{getMonthName(parseInt(item.month))} {item.year}</Text>
            <Text style={styles.detailText}><Text style={styles.detailLabel}>Sync Status: </Text>
              <Text style={{ color: COLORS.success, fontFamily: FONTS.semiBold }}>{item.syncStatus || 'Synced'}</Text>
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <FlatList
        data={monthTrips}
        keyExtractor={(item, idx) => item.id || `trip-${idx}`}
        renderItem={renderTripCard}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <>
            {/* Header Profile */}
            <View style={styles.profileHeader}>
              <View style={styles.avatarLarge}>
                <Text style={styles.avatarTextLarge}>{initials}</Text>
              </View>
              <Text style={styles.nameLarge}>{employee.employeeName}</Text>
              <Text style={styles.subTextLarge}>{employee.employeeId} • {employee.bikeNumber}</Text>
            </View>

            {/* Month Tabs */}
            <View style={styles.monthTabsContainer}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.monthScroll}>
                {MONTHS.map((m, i) => (
                  <TouchableOpacity 
                    key={m}
                    style={[styles.monthTab, selectedMonth === i && styles.monthTabActive]}
                    onPress={() => setSelectedMonth(i)}
                  >
                    <Text style={[styles.monthTabText, selectedMonth === i && styles.monthTabTextActive]}>{m}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Stats Grid */}
            <View style={styles.statsCard}>
              <View style={styles.statsRow}>
                <View style={styles.statBox}>
                  <Text style={styles.statVal}>{stats.totalTrips}</Text>
                  <Text style={styles.statLab}>Trips</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statBox}>
                  <Text style={styles.statVal}>{formatKM(stats.totalKM).replace(' KM','')}</Text>
                  <Text style={styles.statLab}>Total KM</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statBox}>
                  <Text style={[styles.statVal, {color: COLORS.success}]}>₹{stats.totalEarnings.toFixed(0)}</Text>
                  <Text style={styles.statLab}>Earnings</Text>
                </View>
              </View>
              <View style={styles.divider} />
              <View style={styles.statsRow}>
                <View style={styles.statBox}>
                  <Text style={styles.statVal2}>{stats.avgKM}</Text>
                  <Text style={styles.statLab}>Avg KM/Trip</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statBox}>
                  <Text style={styles.statVal2}>{stats.bestDayKM}</Text>
                  <Text style={styles.statLab}>Best Day KM</Text>
                </View>
              </View>
            </View>

            {/* Export Button */}
            <TouchableOpacity style={styles.exportBtn} onPress={exportPDF}>
              <Ionicons name="document-text" size={20} color={COLORS.white} style={{marginRight: 8}} />
              <Text style={styles.exportText}>Export PDF for {employee.employeeName} — {MONTHS[selectedMonth]}</Text>
            </TouchableOpacity>

            <Text style={styles.sectionTitle}>Trip History</Text>
          </>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={48} color={COLORS.textMuted} />
            <Text style={styles.emptyText}>No trips recorded in {MONTHS[selectedMonth]}</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  listContent: { padding: SPACING.base, paddingBottom: SPACING.xxxl },
  profileHeader: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
    marginTop: SPACING.base,
  },
  avatarLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
    ...SHADOWS.card,
  },
  avatarTextLarge: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZES.xxxl,
    color: COLORS.white,
  },
  nameLarge: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZES.xl,
    color: COLORS.textPrimary,
  },
  subTextLarge: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  monthTabsContainer: {
    marginBottom: SPACING.lg,
  },
  monthScroll: {
    paddingVertical: SPACING.xs,
  },
  monthTab: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.white,
    marginRight: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  monthTabActive: {
    backgroundColor: COLORS.primaryDark,
    borderColor: COLORS.primaryDark,
  },
  monthTabText: {
    fontFamily: FONTS.semiBold,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  monthTabTextActive: {
    color: COLORS.white,
  },
  statsCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.card,
    padding: SPACING.base,
    marginBottom: SPACING.lg,
    ...SHADOWS.subtle,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statVal: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZES.lg,
    color: COLORS.primary,
  },
  statVal2: {
    fontFamily: FONTS.semiBold,
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
  },
  statLab: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: COLORS.border,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.sm,
  },
  exportBtn: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    padding: SPACING.base,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xl,
    ...SHADOWS.card,
  },
  exportText: {
    color: COLORS.white,
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZES.base,
  },
  sectionTitle: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZES.lg,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.xxxl,
  },
  emptyText: {
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
    marginTop: SPACING.md,
  },
  tripCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    padding: SPACING.base,
    marginBottom: SPACING.md,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
    ...SHADOWS.subtle,
  },
  tripCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  tripDate: {
    fontFamily: FONTS.semiBold,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textPrimary,
  },
  tripTime: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  tripMetrics: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: SPACING.sm,
    borderRadius: RADIUS.sm,
  },
  tripMetricText: {
    fontFamily: FONTS.semiBold,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginRight: SPACING.md,
  },
  expandedContent: {
    marginTop: SPACING.sm,
  },
  detailText: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  detailLabel: {
    fontFamily: FONTS.semiBold,
    color: COLORS.textPrimary,
  },
});
