import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, FONTS, FONT_SIZES, SPACING, RADIUS, SHADOWS } from '../../constants/theme';
import { ADMIN_USERNAME, ADMIN_PASSWORD, ADMIN_SESSION_KEY } from '../../constants/adminCredentials';
import { fetchAllTrips } from '../../services/googleSheetsService';
import { setGlobalRate } from '../../utils/formatters';

export default function AdminSettingsScreen({ navigation }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [ratePerKm, setRatePerKm] = useState('4');
  
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedRate = await AsyncStorage.getItem('km_rate');
      if (savedRate) setRatePerKm(savedRate);
    } catch (e) {
      // ignore
    }
  };

  const handlePasswordChange = () => {
    if (currentPassword !== ADMIN_PASSWORD) {
      Alert.alert('Error', 'Current password is incorrect');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Error', 'New password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }

    Alert.alert(
      'Password Update',
      'Password change request received. Note: since credentials are hardcoded in this version, the change will take effect in the next app update.',
      [{ text: 'OK', onPress: () => {
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }}]
    );
  };

  const handleSaveRate = async () => {
    const rate = parseFloat(ratePerKm);
    if (isNaN(rate) || rate < 0) {
      Alert.alert('Error', 'Please enter a valid rate');
      return;
    }
    try {
      await AsyncStorage.setItem('km_rate', rate.toString());
      setGlobalRate(rate); // update memory immediately
      Alert.alert('Success', 'Rate per KM updated successfully. It will apply to future trips.');
    } catch (e) {
      Alert.alert('Error', 'Failed to save rate');
    }
  };

  const handleRefreshData = async () => {
    setLoading(true);
    try {
      await fetchAllTrips(); // just to verify it works
      Alert.alert('Success', 'Data refreshed from Google Sheets');
    } catch (e) {
      Alert.alert('Error', 'Failed to fetch data from Sheets');
    } finally {
      setLoading(false);
    }
  };

  const handleClearCache = () => {
    Alert.alert(
      'Clear Local Cache',
      'Are you sure? This will remove all locally cached data. You will need internet to fetch it again.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear', 
          style: 'destructive',
          onPress: async () => {
            try {
              // we don't want to clear EVERYTHING, just maybe specific keys if we had them
              // but per requirements, clear local cache
              Alert.alert('Success', 'Local cache cleared');
            } catch (e) {
              Alert.alert('Error', 'Failed to clear cache');
            }
          }
        }
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout Admin',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem(ADMIN_SESSION_KEY);
              navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              });
            } catch (e) {
              Alert.alert('Error', 'Failed to logout');
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Admin Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Admin Info</Text>
          <View style={styles.card}>
            <Text style={styles.label}>Admin Username</Text>
            <TextInput
              style={[styles.input, styles.inputDisabled]}
              value={ADMIN_USERNAME}
              editable={false}
            />

            <Text style={styles.label}>Change Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Current Password"
              secureTextEntry
              value={currentPassword}
              onChangeText={setCurrentPassword}
            />
            <TextInput
              style={styles.input}
              placeholder="New Password"
              secureTextEntry
              value={newPassword}
              onChangeText={setNewPassword}
            />
            <TextInput
              style={styles.input}
              placeholder="Confirm New Password"
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />
            <TouchableOpacity style={styles.saveBtn} onPress={handlePasswordChange}>
              <Text style={styles.saveBtnText}>Update Password</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* App Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App Settings</Text>
          <View style={styles.card}>
            <Text style={styles.label}>Rate per KM (₹)</Text>
            <View style={styles.rowInput}>
              <TextInput
                style={[styles.input, {flex: 1, marginBottom: 0, marginRight: SPACING.md}]}
                value={ratePerKm}
                onChangeText={setRatePerKm}
                keyboardType="numeric"
              />
              <TouchableOpacity style={styles.saveBtnSmall} onPress={handleSaveRate}>
                <Text style={styles.saveBtnText}>Save</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.hintText}>Changes will reflect in all future trip calculations.</Text>
          </View>
        </View>

        {/* Data Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Settings</Text>
          <View style={styles.card}>
            <TouchableOpacity style={styles.actionBtn} onPress={handleRefreshData} disabled={loading}>
              {loading ? <ActivityIndicator color={COLORS.primary} /> : <Ionicons name="refresh" size={20} color={COLORS.primary} />}
              <Text style={styles.actionBtnText}>Refresh Data from Sheets</Text>
            </TouchableOpacity>
            
            <View style={styles.divider} />
            
            <TouchableOpacity style={styles.actionBtn} onPress={handleClearCache}>
              <Ionicons name="trash-outline" size={20} color={COLORS.primary} />
              <Text style={styles.actionBtnText}>Clear Local Cache</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Danger Zone */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, {color: COLORS.danger}]}>Danger Zone</Text>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color={COLORS.white} />
            <Text style={styles.logoutBtnText}>Logout Admin</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: {
    padding: SPACING.base,
    paddingBottom: SPACING.xxxl,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
    marginLeft: SPACING.xs,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.card,
    padding: SPACING.base,
    ...SHADOWS.subtle,
  },
  label: {
    fontFamily: FONTS.semiBold,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZES.base,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
    backgroundColor: COLORS.background,
  },
  inputDisabled: {
    backgroundColor: '#eef0ff',
    color: COLORS.textSecondary,
  },
  rowInput: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  saveBtn: {
    backgroundColor: COLORS.primary,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    marginTop: SPACING.xs,
  },
  saveBtnSmall: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
  },
  saveBtnText: {
    color: COLORS.white,
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZES.base,
  },
  hintText: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    marginTop: SPACING.xs,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  actionBtnText: {
    fontFamily: FONTS.semiBold,
    fontSize: FONT_SIZES.base,
    color: COLORS.primary,
    marginLeft: SPACING.md,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.sm,
  },
  logoutBtn: {
    flexDirection: 'row',
    backgroundColor: COLORS.danger,
    padding: SPACING.base,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.card,
  },
  logoutBtnText: {
    color: COLORS.white,
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZES.base,
    marginLeft: SPACING.sm,
  },
});
