// App.js — NCH GPS Tracker
// Navigation root, font loading, session restoration, background task registration



import React, { useState, useEffect, useCallback } from 'react';
import { View, ActivityIndicator, StyleSheet, Platform, Text, TouchableOpacity } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
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
import AdminLoginScreen from './screens/admin/AdminLoginScreen';
import AdminOverviewScreen from './screens/admin/AdminOverviewScreen';
import AdminTripsScreen from './screens/admin/AdminTripsScreen';
import AdminEmployeesScreen from './screens/admin/AdminEmployeesScreen';
import AdminEmployeeDetailScreen from './screens/admin/AdminEmployeeDetailScreen';
import AdminSettingsScreen from './screens/admin/AdminSettingsScreen';

import { getUserSession, getActiveTrip } from './utils/storage';
import { ADMIN_SESSION_KEY, ADMIN_SESSION_DURATION } from './constants/adminCredentials';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { syncPendingTrips } from './services/googleSheetsService';
import { showToast } from './utils/crossPlatform';
import { COLORS, FONTS, FONT_SIZES, SPACING } from './constants/theme';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { loadGlobalRate } from './utils/formatters';

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
  const insets = useSafeAreaInsets();
  const baseHeight = Platform.OS === 'ios' ? 88 : 70;
  const basePadding = Platform.OS === 'ios' ? 30 : 12;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.tabBarBackground,
          borderTopWidth: 0,
          height: baseHeight + insets.bottom,
          paddingBottom: basePadding + insets.bottom,
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

// ─── Admin Tab Navigator ────────────────────────────────────────────────────────
function AdminTabs({ navigation }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const baseHeight = Platform.OS === 'ios' ? 88 : 70;
  const basePadding = Platform.OS === 'ios' ? 30 : 12;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: true,
        headerStyle: {
          backgroundColor: COLORS.primary,
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTitleStyle: {
          color: COLORS.white,
          fontFamily: FONTS.bold,
          fontSize: FONT_SIZES.lg,
        },
        headerTintColor: COLORS.white,
        headerRight: () => (
          <TouchableOpacity 
            style={{ marginRight: 16 }}
            onPress={async () => {
              await AsyncStorage.removeItem(ADMIN_SESSION_KEY);
              navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
            }}
          >
            <Text style={{ color: COLORS.white, fontFamily: FONTS.semiBold, fontSize: 14 }}>Logout</Text>
          </TouchableOpacity>
        ),
        tabBarStyle: {
          backgroundColor: COLORS.primary,
          borderTopWidth: 0,
          height: baseHeight + insets.bottom,
          paddingBottom: basePadding + insets.bottom,
          paddingTop: 8,
          elevation: 12,
          shadowColor: COLORS.primaryDark,
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.25,
          shadowRadius: 12,
        },
        tabBarActiveTintColor: COLORS.white,
        tabBarInactiveTintColor: COLORS.tabInactiveIcon,
        tabBarLabelStyle: styles.tabLabel,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'AdminOverview') iconName = focused ? 'stats-chart' : 'stats-chart-outline';
          else if (route.name === 'AdminTrips') iconName = focused ? 'map' : 'map-outline';
          else if (route.name === 'AdminEmployees') iconName = focused ? 'people' : 'people-outline';
          else if (route.name === 'AdminSettings') iconName = focused ? 'settings' : 'settings-outline';

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="AdminOverview" component={AdminOverviewScreen} options={{ tabBarLabel: 'Overview', title: 'Overview' }} />
      <Tab.Screen name="AdminTrips" component={AdminTripsScreen} options={{ tabBarLabel: 'Trips', title: 'All Trips' }} />
      <Tab.Screen name="AdminEmployees" component={AdminEmployeesScreen} options={{ tabBarLabel: 'Employees', title: 'Field Staff' }} />
      <Tab.Screen name="AdminSettings" component={AdminSettingsScreen} options={{ tabBarLabel: 'Settings', title: 'Settings' }} />
    </Tab.Navigator>
  );
}

// ─── Root App Component ───────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
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
        // Check admin session first
        const adminDataRaw = await AsyncStorage.getItem(ADMIN_SESSION_KEY);
        if (adminDataRaw) {
          const adminData = JSON.parse(adminDataRaw);
          if (adminData.isAdmin && Date.now() - adminData.loginTime < ADMIN_SESSION_DURATION) {
            setIsAdmin(true);
          } else {
            // Admin session expired
            await AsyncStorage.removeItem(ADMIN_SESSION_KEY);
          }
        }

        const savedUser = await getUserSession();
        if (savedUser) {
          setUser(savedUser);
        }
        
        await loadGlobalRate(); // load custom rate from admin
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
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            {isAdmin ? (
              <>
                <Stack.Screen name="AdminDashboard" component={AdminTabs} />
                <Stack.Screen 
                  name="AdminEmployeeDetail" 
                  component={AdminEmployeeDetailScreen} 
                  options={{ 
                    headerShown: true, 
                    title: 'Employee Details',
                    headerStyle: { backgroundColor: COLORS.primary },
                    headerTintColor: COLORS.white,
                    headerTitleStyle: { fontFamily: FONTS.bold }
                  }} 
                />
              </>
            ) : user ? (
              <Stack.Screen name="MainTabs">
                {(props) => (
                  <MainTabs
                    {...props}
                    user={user}
                    onLogout={() => setUser(null)}
                  />
                )}
              </Stack.Screen>
            ) : (
              <>
                <Stack.Screen name="Login">
                  {(props) => <LoginScreen {...props} onLogin={(u) => setUser(u)} />}
                </Stack.Screen>
                <Stack.Screen name="AdminLogin" component={AdminLoginScreen} />
                <Stack.Screen name="AdminDashboard" component={AdminTabs} />
                <Stack.Screen 
                  name="AdminEmployeeDetail" 
                  component={AdminEmployeeDetailScreen} 
                  options={{ 
                    headerShown: true, 
                    title: 'Employee Details',
                    headerStyle: { backgroundColor: COLORS.primary },
                    headerTintColor: COLORS.white,
                    headerTitleStyle: { fontFamily: FONTS.bold }
                  }} 
                />
              </>
            )}
          </Stack.Navigator>
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
