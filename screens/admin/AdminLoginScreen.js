import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, FONTS, FONT_SIZES, SPACING, RADIUS, SHADOWS } from '../../constants/theme';
import { ADMIN_USERNAME, ADMIN_PASSWORD, ADMIN_SESSION_KEY } from '../../constants/adminCredentials';

export default function AdminLoginScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [focusedInput, setFocusedInput] = useState(null);

  const handleLogin = async () => {
    setError('');
    if (!username || !password) {
      setError('Please enter both username and password');
      return;
    }

    setLoading(true);

    // Simulate small network delay for UX
    await new Promise(resolve => setTimeout(resolve, 800));

    if (username.trim() === ADMIN_USERNAME && password.trim() === ADMIN_PASSWORD) {
      try {
        const sessionData = {
          isAdmin: true,
          loginTime: Date.now(),
        };
        await AsyncStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(sessionData));
        navigation.replace('AdminDashboard');
      } catch (e) {
        setError('Failed to save session');
      }
    } else {
      setError('Invalid username or password');
    }
    
    setLoading(false);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : null}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          
          {/* Top Section */}
          <View style={styles.topSection}>
            <TouchableOpacity 
              style={styles.backButton} 
              onPress={() => navigation.goBack()}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={24} color={COLORS.white} />
              <Text style={styles.backButtonText}>Back to Employee Login</Text>
            </TouchableOpacity>

            <View style={styles.logoContainer}>
              <Text style={styles.logoText}>NCH <Text style={{fontWeight: '300'}}>GROUP</Text></Text>
            </View>
            <Text style={styles.title}>Admin Portal</Text>
            <Text style={styles.subtitle}>NCH GPS Tracker</Text>
          </View>

          {/* Bottom Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Sign In</Text>

            {/* Error Message */}
            {error ? (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={20} color={COLORS.danger} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* Username Input */}
            <View 
              style={[
                styles.inputContainer, 
                focusedInput === 'username' && styles.inputContainerFocused
              ]}
            >
              <Ionicons 
                name="person-outline" 
                size={20} 
                color={focusedInput === 'username' ? COLORS.primary : COLORS.textSecondary} 
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Admin Username"
                placeholderTextColor={COLORS.placeholder}
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                autoCorrect={false}
                onFocus={() => setFocusedInput('username')}
                onBlur={() => setFocusedInput(null)}
              />
            </View>

            {/* Password Input */}
            <View 
              style={[
                styles.inputContainer, 
                focusedInput === 'password' && styles.inputContainerFocused
              ]}
            >
              <Ionicons 
                name="lock-closed-outline" 
                size={20} 
                color={focusedInput === 'password' ? COLORS.primary : COLORS.textSecondary} 
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor={COLORS.placeholder}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                onFocus={() => setFocusedInput('password')}
                onBlur={() => setFocusedInput(null)}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                <Ionicons 
                  name={showPassword ? "eye-outline" : "eye-off-outline"} 
                  size={20} 
                  color={COLORS.textSecondary} 
                />
              </TouchableOpacity>
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
                <Text style={styles.loginBtnText}>Sign In</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.primary,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  topSection: {
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xxxl,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    top: SPACING.base,
    left: SPACING.base,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 10,
  },
  backButtonText: {
    color: COLORS.white,
    fontFamily: FONTS.semiBold,
    fontSize: FONT_SIZES.sm,
    marginLeft: SPACING.xs,
  },
  logoContainer: {
    marginTop: SPACING.xxxl,
    marginBottom: SPACING.base,
  },
  logoText: {
    color: COLORS.white,
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZES.xxl,
    letterSpacing: 2,
  },
  title: {
    color: COLORS.white,
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZES.xxxl,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZES.base,
  },
  card: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: SPACING.xl,
    ...SHADOWS.strong,
  },
  cardTitle: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZES.xxl,
    color: COLORS.primary,
    marginBottom: SPACING.xl,
    marginTop: SPACING.sm,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.lg,
    paddingHorizontal: SPACING.base,
    height: 56,
  },
  inputContainerFocused: {
    borderColor: COLORS.primary,
    borderWidth: 2,
  },
  inputIcon: {
    marginRight: SPACING.md,
  },
  input: {
    flex: 1,
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZES.base,
    color: COLORS.textPrimary,
    height: '100%',
  },
  eyeIcon: {
    padding: SPACING.xs,
  },
  loginBtn: {
    backgroundColor: COLORS.primary,
    height: 56,
    borderRadius: RADIUS.pill,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.lg,
    ...SHADOWS.card,
  },
  loginBtnDisabled: {
    opacity: 0.7,
  },
  loginBtnText: {
    color: COLORS.white,
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZES.md,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.badgeDangerBg,
    padding: SPACING.sm,
    borderRadius: RADIUS.sm,
    marginBottom: SPACING.lg,
  },
  errorText: {
    color: COLORS.danger,
    fontFamily: FONTS.semiBold,
    fontSize: FONT_SIZES.sm,
    marginLeft: SPACING.sm,
  },
});
