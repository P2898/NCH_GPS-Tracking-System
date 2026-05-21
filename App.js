// App.js — NCH GPS Tracker
// Navigation root, font loading, session restoration, background task registration



import React, { useState, useEffect, useCallback } from 'react';
import { View, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming } from 'react-native-reanimated';

import {
  useFonts,
  Poppins_400Regular,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from '@expo-google-fonts/poppins';

import LoginScreen from './screens/LoginScreen';
import DashboardScreen from './screens/DashboardScreen';
import HistoryScreen from './screens/HistoryScreen';
import SummaryScreen from './screens/SummaryScreen';
import ProfileScreen from './screens/ProfileScreen';

import { getUserSession, getActiveTrip } from './utils/storage';
import { syncPendingTrips } from './services/googleSheetsService';
import { showToast } from './utils/crossPlatform';
import { COLORS, FONTS, FONT_SIZES, SPACING } from './constants/theme';
import { ThemeProvider, useTheme } from './context/ThemeContext';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

// ─── Pulsing dot for active trip tab indicator ────────────────────────────────
function PulsingDot() {
  const opacity = useSharedValue(1);

  useEffect(() => {
    opacity.value = withRepeat(withTiming(0.2, { duration: 700 }), -1, true);
  }, []);

  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={[
        {
          width: 7,
          height: 7,
          borderRadius: 3.5,
          backgroundColor: COLORS.white,
          position: 'absolute',
          top: 2,
          right: 2,
        },
        animStyle,
      ]}
    />
  );
}

// ─── Tab Navigator ────────────────────────────────────────────────────────────
function MainTabs({ user, onLogout, navigation }) {
  const [hasActiveTrip, setHasActiveTrip] = useState(false);

  useEffect(() => {
    checkActiveTrip();
    const interval = setInterval(checkActiveTrip, 5000);
    return () => clearInterval(interval);
  }, []);

  async function checkActiveTrip() {
    const trip = await getActiveTrip();
    setHasActiveTrip(!!trip);
  }

  const { isDark, colors } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.tabBarBackground,
          borderTopWidth: 0,
          height: Platform.OS === 'ios' ? 88 : 74,
          paddingBottom: Platform.OS === 'ios' ? 30 : 16,
          paddingTop: 8,
          elevation: 12,
          shadowColor: colors.primaryDark,
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.25,
          shadowRadius: 12,
        },
        tabBarActiveTintColor: colors.tabActiveIcon,
        tabBarInactiveTintColor: colors.tabInactiveIcon,
        tabBarLabelStyle: styles.tabLabel,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Dashboard') iconName = focused ? 'home' : 'home-outline';
          else if (route.name === 'History') iconName = focused ? 'document-text' : 'document-text-outline';
          else if (route.name === 'Summary') iconName = focused ? 'bar-chart' : 'bar-chart-outline';
          else if (route.name === 'Profile') iconName = focused ? 'person' : 'person-outline';

          return (
            <View style={{ position: 'relative' }}>
              <Ionicons name={iconName} size={size} color={color} />
              {route.name === 'Dashboard' && hasActiveTrip && <PulsingDot />}
            </View>
          );
        },
      })}
    >
      <Tab.Screen name="Dashboard" options={{ tabBarLabel: 'Home' }}>
        {(props) => (
          <DashboardScreen {...props} user={user} />
        )}
      </Tab.Screen>



      <Tab.Screen name="History" options={{ tabBarLabel: 'History' }}>
        {() => <HistoryScreen />}
      </Tab.Screen>

      <Tab.Screen name="Summary" options={{ tabBarLabel: 'Summary' }}>
        {() => <SummaryScreen user={user} />}
      </Tab.Screen>

      <Tab.Screen name="Profile" options={{ tabBarLabel: 'Profile' }}>
        {() => <ProfileScreen user={user} onLogout={onLogout} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

// ─── Root App Component ───────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(null);
  const [appReady, setAppReady] = useState(false);

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  // Request notification permissions on startup
  useEffect(() => {
    requestNotificationPermissions();
  }, []);

  async function requestNotificationPermissions() {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        console.warn('[App] Notification permission not granted');
      }
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('nch-gps-channel', {
          name: 'NCH GPS Tracking',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 0, 0, 0],
          lightColor: COLORS.primary,
          sound: null,
        });
      }
    } catch (e) {
      console.warn('[App] Notification setup error:', e.message);
    }
  }

  // Restore session on launch
  useEffect(() => {
    async function restoreSession() {
      try {
        const savedUser = await getUserSession();
        if (savedUser) {
          setUser(savedUser);
        }
      } catch (e) {
        console.error('[App] Session restore error:', e);
      } finally {
        setAppReady(true);
      }
    }
    restoreSession();
  }, []);

  // Background sync on launch
  useEffect(() => {
    async function runSync() {
      try {
        const count = await syncPendingTrips();
        if (count > 0) {
          showToast(`${count} trips synced to cloud ✅`);
        }
      } catch (e) {
        console.warn('[App] Sync error:', e);
      }
    }
    runSync();
  }, []);

  if (!fontsLoaded || !appReady) {
    return (
      <View style={styles.splashContainer}>
        <StatusBar style="light" />
        <View style={styles.splashLogo}>
          <Ionicons name="navigate-circle" size={64} color={COLORS.white} />
        </View>
        <ActivityIndicator color={COLORS.white} size="large" style={{ marginTop: SPACING.xl }} />
      </View>
    );
  }

  return (
    <ThemeProvider>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <NavigationContainer>
          {user ? (
            <Stack.Navigator screenOptions={{ headerShown: false }}>
              <Stack.Screen name="MainTabs">
                {(props) => (
                  <MainTabs
                    {...props}
                    user={user}
                    onLogout={() => setUser(null)}
                  />
                )}
              </Stack.Screen>
            </Stack.Navigator>
          ) : (
            <LoginScreen onLogin={(u) => setUser(u)} />
          )}
        </NavigationContainer>
      </SafeAreaProvider>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  splashLogo: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBar: {
    backgroundColor: COLORS.tabBarBackground,
    borderTopWidth: 0,
    height: Platform.OS === 'ios' ? 80 : 64,
    paddingBottom: Platform.OS === 'ios' ? 20 : 10,
    paddingTop: 8,
    elevation: 12,
    shadowColor: COLORS.primaryDark,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
  },
  tabLabel: {
    fontFamily: FONTS.semiBold,
    fontSize: FONT_SIZES.xs,
  },
});
