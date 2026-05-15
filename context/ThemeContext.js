// context/ThemeContext.js
import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getColors, getShadows } from '../constants/theme';

const THEME_KEY = '@nch_theme_mode';

const ThemeContext = createContext({
  isDark: false,
  colors: getColors(false),
  shadows: getShadows(false),
  toggleTheme: () => {},
});

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    loadTheme();
  }, []);

  async function loadTheme() {
    try {
      const saved = await AsyncStorage.getItem(THEME_KEY);
      if (saved === 'dark') setIsDark(true);
    } catch (e) {
      // default to light
    }
  }

  async function toggleTheme() {
    const next = !isDark;
    setIsDark(next);
    try {
      await AsyncStorage.setItem(THEME_KEY, next ? 'dark' : 'light');
    } catch (e) {
      console.warn('[Theme] Save error:', e);
    }
  }

  const colors = getColors(isDark);
  const shadows = getShadows(isDark);

  return (
    <ThemeContext.Provider value={{ isDark, colors, shadows, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

export default ThemeContext;
