// screens/LoginScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { saveUserSession } from '../utils/storage';
import { COLORS, FONTS, FONT_SIZES, SPACING, RADIUS, SHADOWS } from '../constants/theme';

export default function LoginScreen({ onLogin }) {
  const [name, setName] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [bikeNumber, setBikeNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [nameFocused, setNameFocused] = useState(false);
  const [idFocused, setIdFocused] = useState(false);
  const [bikeFocused, setBikeFocused] = useState(false);
  const [errors, setErrors] = useState({});

  function validate() {
    const errs = {};
    if (!name.trim()) errs.name = 'Employee name is required';
    if (!employeeId.trim()) errs.employeeId = 'Employee ID is required';
    else if (!/^[A-Za-z0-9\-_]+$/.test(employeeId.trim()))
      errs.employeeId = 'Invalid employee ID format';
    if (!bikeNumber.trim()) errs.bikeNumber = 'Bike number is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleLogin() {
    if (!validate()) return;
    setLoading(true);
    try {
      const user = {
        name: name.trim(),
        employeeId: employeeId.trim().toUpperCase(),
        bikeNumber: bikeNumber.trim().toUpperCase(),
        designation: 'Field Executive',
        loginTime: new Date().toISOString(),
      };
      await saveUserSession(user);
      onLogin(user);
    } catch (e) {
      Alert.alert('Login Failed', 'Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar style="light" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          bounces={false}
        >
          {/* Top Brand Section */}
          <View style={styles.topSection}>
            <View style={styles.logoContainer}>
              <Image 
                source={require('../assets/logo.jpg')} 
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.appName}>NCH GPS Tracker</Text>
            <Text style={styles.tagline}>Field Staff Management System</Text>

            <View style={styles.infoChips}>
              <View style={styles.chip}>
                <Ionicons name="location" size={11} color={COLORS.white} />
                <Text style={styles.chipText}>Real-time Tracking</Text>
              </View>
              <View style={styles.chip}>
                <Ionicons name="cash" size={11} color={COLORS.white} />
                <Text style={styles.chipText}>Earnings Tracker</Text>
              </View>
            </View>
          </View>

          {/* Login Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Welcome Back</Text>
            <Text style={styles.cardSubtitle}>Sign in to start your shift</Text>

            {/* Name Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Employee Name</Text>
              <View
                style={[
                  styles.inputWrap,
                  nameFocused && styles.inputWrapFocused,
                  errors.name && styles.inputWrapError,
                ]}
              >
                <Ionicons
                  name="person-outline"
                  size={18}
                  color={nameFocused ? COLORS.primary : COLORS.textSecondary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your full name"
                  placeholderTextColor={COLORS.placeholder}
                  value={name}
                  onChangeText={(v) => { setName(v); setErrors((e) => ({ ...e, name: null })); }}
                  onFocus={() => setNameFocused(true)}
                  onBlur={() => setNameFocused(false)}
                  autoCapitalize="words"
                  returnKeyType="next"
                />
              </View>
              {errors.name ? <Text style={styles.errorText}>{errors.name}</Text> : null}
            </View>

            {/* Employee ID Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Employee ID</Text>
              <View
                style={[
                  styles.inputWrap,
                  idFocused && styles.inputWrapFocused,
                  errors.employeeId && styles.inputWrapError,
                ]}
              >
                <Ionicons
                  name="id-card-outline"
                  size={18}
                  color={idFocused ? COLORS.primary : COLORS.textSecondary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="e.g. NCH-001"
                  placeholderTextColor={COLORS.placeholder}
                  value={employeeId}
                  onChangeText={(v) => { setEmployeeId(v); setErrors((e) => ({ ...e, employeeId: null })); }}
                  onFocus={() => setIdFocused(true)}
                  onBlur={() => setIdFocused(false)}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  returnKeyType="next"
                />
              </View>
              {errors.employeeId ? <Text style={styles.errorText}>{errors.employeeId}</Text> : null}
            </View>

            {/* Bike Number Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Bike Number</Text>
              <View
                style={[
                  styles.inputWrap,
                  bikeFocused && styles.inputWrapFocused,
                  errors.bikeNumber && styles.inputWrapError,
                ]}
              >
                <Ionicons
                  name="bicycle-outline"
                  size={18}
                  color={bikeFocused ? COLORS.primary : COLORS.textSecondary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="e.g. KA-01-EF-1234"
                  placeholderTextColor={COLORS.placeholder}
                  value={bikeNumber}
                  onChangeText={(v) => { setBikeNumber(v); setErrors((e) => ({ ...e, bikeNumber: null })); }}
                  onFocus={() => setBikeFocused(true)}
                  onBlur={() => setBikeFocused(false)}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                />
              </View>
              {errors.bikeNumber ? <Text style={styles.errorText}>{errors.bikeNumber}</Text> : null}
            </View>

            {/* Login Button */}
            <TouchableOpacity
              style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
              activeOpacity={0.85}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.white} size="small" />
              ) : (
                <>
                  <Ionicons name="log-in-outline" size={20} color={COLORS.white} />
                  <Text style={styles.loginBtnText}>Start My Shift</Text>
                </>
              )}
            </TouchableOpacity>

            <Text style={styles.disclaimer}>
              Your session is stored locally on this device. No internet required.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.primary },
  flex: { flex: 1 },
  scrollContent: { flexGrow: 1 },

  topSection: {
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.xxxl,
    paddingHorizontal: SPACING.xl,
  },
  logoContainer: {
    width: 140,
    height: 60,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.base,
    padding: SPACING.xs,
    ...SHADOWS.subtle,
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  appName: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZES.xxl,
    color: COLORS.white,
    textAlign: 'center',
  },
  tagline: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZES.sm,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 4,
    marginBottom: SPACING.base,
    textAlign: 'center',
  },
  infoChips: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: RADIUS.pill,
    paddingHorizontal: SPACING.md,
    paddingVertical: 5,
    gap: 4,
  },
  chipText: {
    fontFamily: FONTS.semiBold,
    fontSize: FONT_SIZES.xs,
    color: COLORS.white,
  },

  card: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: SPACING.xl,
    paddingTop: SPACING.xxl,
    flex: 1,
    minHeight: 460,
  },
  cardTitle: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZES.xxl,
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  cardSubtitle: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZES.base,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xl,
  },

  inputGroup: {
    marginBottom: SPACING.base,
  },
  inputLabel: {
    fontFamily: FONTS.semiBold,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.inputBackground,
    paddingHorizontal: SPACING.md,
  },
  inputWrapFocused: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.white,
  },
  inputWrapError: {
    borderColor: COLORS.danger,
  },
  inputIcon: {
    marginRight: SPACING.sm,
  },
  input: {
    flex: 1,
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZES.base,
    color: COLORS.textPrimary,
    paddingVertical: SPACING.md,
  },
  errorText: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZES.xs,
    color: COLORS.danger,
    marginTop: 4,
    marginLeft: 2,
  },

  loginBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.pill,
    paddingVertical: SPACING.base,
    marginTop: SPACING.base,
    gap: SPACING.sm,
    ...SHADOWS.card,
  },
  loginBtnDisabled: {
    opacity: 0.7,
  },
  loginBtnText: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZES.md,
    color: COLORS.white,
  },
  disclaimer: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.base,
    lineHeight: 18,
  },
});
