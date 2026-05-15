// screens/NewTripScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { showAlert } from '../utils/crossPlatform';

import CustomerCheckbox from '../components/CustomerCheckbox';
import ThemeToggle from '../components/ThemeToggle';
import { getTodaysCustomers } from '../services/customerService';
import { COLORS, FONTS, FONT_SIZES, SPACING, RADIUS, SHADOWS } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';

export default function NewTripScreen({ route, navigation, user }) {
  const [customers, setCustomers] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);

  const onTripStart = route?.params?.onTripStart;

  useFocusEffect(
    useCallback(() => {
      setSelected(new Set());
      setSearch('');
      loadCustomers();
    }, [])
  );

  async function loadCustomers() {
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const list = await getTodaysCustomers(user?.employeeId || 'DEMO', today);
      setCustomers(list);
      setFiltered(list);
    } catch (e) {
      showAlert('Error', 'Could not load customers. Using cached list.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!search.trim()) {
      setFiltered(customers);
    } else {
      const q = search.toLowerCase();
      setFiltered(
        customers.filter(
          (c) =>
            c.companyName.toLowerCase().includes(q) ||
            c.city.toLowerCase().includes(q) ||
            c.jobNo.toLowerCase().includes(q)
        )
      );
    }
  }, [search, customers]);

  function toggleCustomer(id) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAll() {
    setSelected(new Set(customers.map((c) => c.id)));
  }

  function clearAll() {
    setSelected(new Set());
  }

  async function handleStartTrip() {
    if (selected.size === 0) {
      showAlert(
        'No Customers Selected',
        'Please select at least one customer before starting your trip.'
      );
      return;
    }

    if (starting) return;
    setStarting(true);

    try {
      const selectedNames = customers
        .filter((c) => selected.has(c.id))
        .map((c) => c.companyName);

      if (onTripStart) {
        await onTripStart(selectedNames);
        navigation.goBack();
      }
    } catch (e) {
      showAlert('Error', 'Could not start trip. Please try again.');
    } finally {
      setStarting(false);
    }
  }

  const selectedCount = selected.size;
  const allSelected = customers.length > 0 && selected.size === customers.length;

  const { isDark, colors } = useTheme();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primaryDark }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Select Customers</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{selectedCount}</Text>
          </View>
          <ThemeToggle />
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={18} color={COLORS.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by company, city, job no..."
            placeholderTextColor={COLORS.placeholder}
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
            autoCorrect={false}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color={COLORS.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Select All / Clear All */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={allSelected ? clearAll : selectAll}
          >
            <Ionicons
              name={allSelected ? 'checkbox' : 'checkbox-outline'}
              size={16}
              color={COLORS.primary}
            />
            <Text style={styles.actionBtnText}>
              {allSelected ? 'Clear All' : 'Select All'}
            </Text>
          </TouchableOpacity>
          {selectedCount > 0 && (
            <TouchableOpacity style={styles.actionBtn} onPress={clearAll}>
              <Ionicons name="close-circle-outline" size={16} color={COLORS.danger} />
              <Text style={[styles.actionBtnText, { color: COLORS.danger }]}>
                Clear ({selectedCount})
              </Text>
            </TouchableOpacity>
          )}
          <Text style={styles.resultCount}>
            {filtered.length} of {customers.length} shown
          </Text>
        </View>
      </View>

      {/* Customer List */}
      {loading ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading today's deliveries...</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <CustomerCheckbox
              customer={item}
              selected={selected.has(item.id)}
              onToggle={toggleCustomer}
            />
          )}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="search-outline" size={48} color={COLORS.border} />
              <Text style={styles.emptyTitle}>No customers found</Text>
              <Text style={styles.emptySubtitle}>Try a different search term</Text>
            </View>
          }
        />
      )}

      {/* Start Trip Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.startBtn, (selected.size === 0 || starting) && styles.startBtnDisabled]}
          activeOpacity={0.85}
          onPress={handleStartTrip}
          disabled={selected.size === 0 || starting}
        >
          {starting ? (
            <ActivityIndicator color={COLORS.white} size="small" />
          ) : (
            <>
              <Ionicons name="navigate" size={22} color={COLORS.white} />
              <Text style={styles.startBtnText}>
                Start Trip{selectedCount > 0 ? ` (${selectedCount} customers)` : ''}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  header: {
    backgroundColor: COLORS.primaryDark,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.base,
    paddingTop: Platform.OS === 'android' ? 20 : 8,
    paddingBottom: SPACING.md,
  },
  backBtn: {
    padding: SPACING.xs,
    marginRight: SPACING.sm,
  },
  headerTitle: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZES.lg,
    color: COLORS.white,
    flex: 1,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  countBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: RADIUS.pill,
    minWidth: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.sm,
  },
  countText: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZES.sm,
    color: COLORS.white,
  },

  searchContainer: {
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBackground,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZES.base,
    color: COLORS.textPrimary,
    paddingVertical: SPACING.md,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.badge,
    borderRadius: RADIUS.pill,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
  },
  actionBtnText: {
    fontFamily: FONTS.semiBold,
    fontSize: FONT_SIZES.xs,
    color: COLORS.primary,
  },
  resultCount: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginLeft: 'auto',
  },

  listContent: {
    padding: SPACING.base,
    paddingBottom: SPACING.xxxl,
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
    alignItems: 'center',
    paddingTop: SPACING.xxxl,
    gap: SPACING.sm,
  },
  emptyTitle: {
    fontFamily: FONTS.semiBold,
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  emptySubtitle: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },

  footer: {
    padding: SPACING.base,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    ...SHADOWS.card,
  },
  startBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.danger,
    borderRadius: RADIUS.pill,
    paddingVertical: SPACING.base,
    gap: SPACING.sm,
    ...SHADOWS.card,
  },
  startBtnDisabled: {
    opacity: 0.45,
  },
  startBtnText: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZES.md,
    color: COLORS.white,
  },
});
