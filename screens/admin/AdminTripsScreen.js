import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Platform,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { COLORS, FONTS, FONT_SIZES, SPACING, RADIUS, SHADOWS } from '../../constants/theme';
import { fetchAllTrips } from '../../services/googleSheetsService';
import { formatKM, formatEarnings, formatDuration, getMonthName } from '../../utils/formatters';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function AdminTripsScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [trips, setTrips] = useState([]);
  const [error, setError] = useState(null);
  
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedEmployee, setSelectedEmployee] = useState('All');
  const [expandedTrip, setExpandedTrip] = useState(null);

  useEffect(() => {
    loadData();
    const interval = setInterval(() => loadData(true), 30000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async (isSilent = false) => {
    try {
      if (!isSilent) setError(null);
      const allTrips = await fetchAllTrips();
      allTrips.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
      setTrips(allTrips);
    } catch (e) {
      if (!isSilent) setError('Could not load data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const employees = useMemo(() => {
    const ids = new Set();
    const list = [{ id: 'All', name: 'All Employees' }];
    trips.forEach(t => {
      if (!ids.has(t.employeeId)) {
        ids.add(t.employeeId);
        list.push({ id: t.employeeId, name: t.employeeName });
      }
    });
    return list;
  }, [trips]);

  const filteredTrips = useMemo(() => {
    return trips.filter(t => {
      const isMonthMatch = (t.month - 1) === selectedMonth;
      const isEmployeeMatch = selectedEmployee === 'All' || t.employeeId === selectedEmployee;
      return isMonthMatch && isEmployeeMatch;
    });
  }, [trips, selectedMonth, selectedEmployee]);

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
            <h1>NCH GPS Tracker — Trip Report</h1>
            <p>Generated on: ${new Date().toLocaleString()}</p>
            <p>Report Period: ${MONTHS[selectedMonth]} ${new Date().getFullYear()}</p>
            <p>Employee: ${employees.find(e => e.id === selectedEmployee)?.name}</p>
            
            <table>
              <tr>
                <th>No.</th>
                <th>Date</th>
                <th>Employee</th>
                <th>Bike</th>
                <th>OUT</th>
                <th>IN</th>
                <th>KM</th>
                <th>Earnings</th>
              </tr>
              ${filteredTrips.map((t, i) => `
                <tr>
                  <td>${i + 1}</td>
                  <td>${t.date}</td>
                  <td>${t.employeeName}</td>
                  <td>${t.bikeNumber}</td>
                  <td>${t.outTime}</td>
                  <td>${t.inTime}</td>
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

  const renderTripCard = ({ item }) => {
    const isExpanded = expandedTrip === item.id;
    return (
      <TouchableOpacity 
        style={styles.tripCard}
        onPress={() => setExpandedTrip(isExpanded ? null : item.id)}
        activeOpacity={0.7}
      >
        <View style={styles.tripCardHeader}>
          <Text style={styles.tripName}>{item.employeeName || 'Unknown'}</Text>
          <Text style={styles.tripDate}>{item.date}</Text>
        </View>
        <Text style={styles.tripSub}>{item.employeeId} • {item.bikeNumber}</Text>
        
        <View style={styles.tripRow}>
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
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>All Trips</Text>
        <TouchableOpacity style={styles.exportBtn} onPress={exportPDF}>
          <Ionicons name="document-text" size={16} color={COLORS.white} />
          <Text style={styles.exportText}>Export PDF</Text>
        </TouchableOpacity>
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.monthScroll}>
          {MONTHS.map((m, i) => (
            <TouchableOpacity 
              key={m}
              style={[styles.monthChip, selectedMonth === i && styles.monthChipActive]}
              onPress={() => setSelectedMonth(i)}
            >
              <Text style={[styles.monthText, selectedMonth === i && styles.monthTextActive]}>{m}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.empScroll}>
          {employees.map(emp => (
            <TouchableOpacity 
              key={emp.id}
              style={[styles.empChip, selectedEmployee === emp.id && styles.empChipActive]}
              onPress={() => setSelectedEmployee(emp.id)}
            >
              <Text style={[styles.empText, selectedEmployee === emp.id && styles.empTextActive]}>{emp.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Content */}
      {loading && !refreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <FlatList
          data={filteredTrips}
          keyExtractor={(item, idx) => item.id || `trip-${idx}`}
          renderItem={renderTripCard}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="document-outline" size={48} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>No trips found for these filters</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.base,
    backgroundColor: COLORS.white,
    ...SHADOWS.subtle,
  },
  headerTitle: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZES.lg,
    color: COLORS.primary,
  },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.pill,
  },
  exportText: {
    color: COLORS.white,
    fontFamily: FONTS.semiBold,
    fontSize: FONT_SIZES.sm,
    marginLeft: SPACING.xs,
  },
  filtersContainer: {
    backgroundColor: COLORS.white,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  monthScroll: {
    paddingHorizontal: SPACING.base,
    marginBottom: SPACING.sm,
  },
  empScroll: {
    paddingHorizontal: SPACING.base,
  },
  monthChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: COLORS.primary,
    marginRight: SPACING.sm,
  },
  monthChipActive: {
    backgroundColor: COLORS.primary,
  },
  monthText: {
    fontFamily: FONTS.semiBold,
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
  },
  monthTextActive: {
    color: COLORS.white,
  },
  empChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.background,
    marginRight: SPACING.sm,
  },
  empChipActive: {
    backgroundColor: COLORS.primaryDark,
  },
  empText: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  empTextActive: {
    color: COLORS.white,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontFamily: FONTS.regular,
    color: COLORS.danger,
  },
  listContent: {
    padding: SPACING.base,
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
  },
  tripName: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZES.base,
    color: COLORS.textPrimary,
  },
  tripDate: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
  },
  tripSub: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  tripRow: {
    marginBottom: SPACING.sm,
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
  divider: {
    height: 1,
    backgroundColor: COLORS.divider,
    marginVertical: SPACING.sm,
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
