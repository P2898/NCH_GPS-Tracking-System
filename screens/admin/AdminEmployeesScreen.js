import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, FONT_SIZES, SPACING, RADIUS, SHADOWS } from '../../constants/theme';
import { fetchAllTrips, fetchActiveLocations } from '../../services/googleSheetsService';
import { formatKM, formatEarnings } from '../../utils/formatters';

export default function AdminEmployeesScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [trips, setTrips] = useState([]);
  const [activeLocationIds, setActiveLocationIds] = useState(new Set());
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadData();
    const interval = setInterval(() => loadData(true), 30000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async (isSilent = false) => {
    try {
      if (!isSilent) setError(null);
      const [allTrips, activeLocs] = await Promise.all([
        fetchAllTrips(),
        fetchActiveLocations()
      ]);
      setTrips(allTrips);
      setActiveLocationIds(new Set(activeLocs.map(l => l.employeeId)));
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

  const employeeStats = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const statsMap = {};

    trips.forEach(t => {
      if (!statsMap[t.employeeId]) {
        statsMap[t.employeeId] = {
          employeeId: t.employeeId,
          employeeName: t.employeeName || 'Unknown',
          bikeNumber: t.bikeNumber || 'N/A',
          totalTrips: 0,
          totalKM: 0,
          totalEarnings: 0,
          isActive: false,
          trips: [],
        };
      }
      
      const emp = statsMap[t.employeeId];
      emp.trips.push(t);
      
      if (!t.inTime || t.inTime.toLowerCase() === 'active' || activeLocationIds.has(t.employeeId)) {
        emp.isActive = true;
      }

      if (t.month == currentMonth && t.year == currentYear) {
        emp.totalTrips++;
        emp.totalKM += parseFloat(t.distanceKM || 0);
        emp.totalEarnings += parseFloat(t.earnings || 0);
      }
    });

    return Object.values(statsMap);
  }, [trips]);

  const filteredEmployees = useMemo(() => {
    if (!searchQuery) return employeeStats;
    const lowerQ = searchQuery.toLowerCase();
    return employeeStats.filter(e => 
      e.employeeName.toLowerCase().includes(lowerQ) || 
      String(e.employeeId).toLowerCase().includes(lowerQ)
    );
  }, [employeeStats, searchQuery]);

  const renderEmployeeCard = ({ item }) => {
    const initials = item.employeeName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

    return (
      <TouchableOpacity 
        style={styles.card}
        activeOpacity={0.7}
        onPress={() => navigation.navigate('AdminEmployeeDetail', { employee: item })}
      >
        <View style={styles.cardHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={styles.infoContainer}>
            <Text style={styles.name}>{item.employeeName}</Text>
            <Text style={styles.subText}>{item.employeeId} • {item.bikeNumber}</Text>
          </View>
          <View style={[styles.statusBadge, item.isActive ? styles.statusActive : styles.statusIdle]}>
            <Text style={[styles.statusText, item.isActive ? styles.statusTextActive : styles.statusTextIdle]}>
              {item.isActive ? 'Active' : 'Idle'}
            </Text>
          </View>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{item.totalTrips}</Text>
            <Text style={styles.statLabel}>Trips</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{formatKM(item.totalKM).replace(' KM','')}</Text>
            <Text style={styles.statLabel}>KM</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>₹{item.totalEarnings.toFixed(0)}</Text>
            <Text style={styles.statLabel}>Earnings</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={20} color={COLORS.textMuted} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or ID..."
          placeholderTextColor={COLORS.placeholder}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

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
          data={filteredEmployees}
          keyExtractor={item => item.employeeId}
          renderItem={renderEmployeeCard}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={48} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>No employees found</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    margin: SPACING.base,
    paddingHorizontal: SPACING.base,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    height: 48,
  },
  searchIcon: {
    marginRight: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZES.base,
    color: COLORS.textPrimary,
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
    paddingHorizontal: SPACING.base,
    paddingBottom: SPACING.xxxl,
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
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.card,
    padding: SPACING.base,
    marginBottom: SPACING.base,
    ...SHADOWS.subtle,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.badge,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  avatarText: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZES.base,
    color: COLORS.primary,
  },
  infoContainer: {
    flex: 1,
  },
  name: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
  },
  subText: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.pill,
  },
  statusActive: {
    backgroundColor: 'rgba(46, 125, 50, 0.1)',
  },
  statusIdle: {
    backgroundColor: COLORS.background,
  },
  statusText: {
    fontFamily: FONTS.semiBold,
    fontSize: FONT_SIZES.xs,
  },
  statusTextActive: {
    color: COLORS.success,
  },
  statusTextIdle: {
    color: COLORS.textMuted,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.sm,
    justifyContent: 'space-evenly',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZES.base,
    color: COLORS.primaryDark,
  },
  statLabel: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },
  statDivider: {
    width: 1,
    height: '60%',
    backgroundColor: COLORS.border,
  },
});
