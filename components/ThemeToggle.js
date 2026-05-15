// components/ThemeToggle.js
// Small icon button for dark/light mode — drop into any header

import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

export default function ThemeToggle({ size = 20 }) {
  const { isDark, toggleTheme } = useTheme();

  return (
    <TouchableOpacity
      style={[styles.btn, { backgroundColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.2)' }]}
      onPress={toggleTheme}
      activeOpacity={0.7}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      <Ionicons
        name={isDark ? 'sunny' : 'moon'}
        size={size}
        color="#FFFFFF"
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
