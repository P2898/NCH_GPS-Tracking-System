// constants/theme.js
// NCH GPS Tracker — Central Design System
// Supports Light and Dark mode palettes

const LIGHT_COLORS = {
  // Brand
  primary: '#333788',
  primaryDark: '#252a6b',
  primaryLight: '#4a50b5',

  // Accent / White
  accent: '#FFFFFF',
  white: '#FFFFFF',

  // Semantic
  success: '#2E7D32',
  danger: '#C62828',

  // Background
  background: '#F4F4FB',
  cardBackground: '#FFFFFF',

  // Bottom Tab
  tabBarBackground: '#333788',
  tabActiveIcon: '#FFFFFF',
  tabInactiveIcon: '#9fa5e0',

  // Text
  textPrimary: '#1a1a2e',
  textSecondary: '#5c5f8a',
  textOnPrimary: '#FFFFFF',
  textMuted: '#9fa5e0',

  // Borders / Dividers
  border: '#e0e1f5',
  divider: '#e0e1f5',

  // Badges / Highlights
  badge: '#eef0ff',
  badgeText: '#333788',
  badgeDangerBg: '#ffeef0',
  badgeDangerText: '#C62828',

  // Notification
  notificationBg: '#333788',
  notificationText: '#FFFFFF',

  // Summary cards
  summaryCardBg: '#333788',
  summaryCardText: '#FFFFFF',
  summaryCardSubLabel: '#c5c7ef',

  // Chart
  chartBarFill: '#333788',
  chartBarTrack: '#e0e1f5',
  chartLabel: '#5c5f8a',

  // Input
  inputBorder: '#e0e1f5',
  inputFocusBorder: '#333788',
  inputBackground: '#F4F4FB',
  placeholder: '#9fa5e0',

  // Overlay / Shadow
  shadowColor: '#333788',

  // Trip card accent
  tripCardBorder: '#333788',

  // Transparent
  transparent: 'transparent',
};

const DARK_COLORS = {
  // Brand
  primary: '#5c63d6',
  primaryDark: '#1a1a2e',
  primaryLight: '#7b82e8',

  // Accent / White
  accent: '#1e1e3a',
  white: '#FFFFFF',

  // Semantic
  success: '#4CAF50',
  danger: '#EF5350',

  // Background
  background: '#0d0d1a',
  cardBackground: '#1a1a2e',

  // Bottom Tab
  tabBarBackground: '#1a1a2e',
  tabActiveIcon: '#7b82e8',
  tabInactiveIcon: '#4a4a6a',

  // Text
  textPrimary: '#e8e8f4',
  textSecondary: '#9898b8',
  textOnPrimary: '#FFFFFF',
  textMuted: '#5c5c7a',

  // Borders / Dividers
  border: '#2a2a45',
  divider: '#2a2a45',

  // Badges / Highlights
  badge: '#252550',
  badgeText: '#7b82e8',
  badgeDangerBg: '#3a1a1a',
  badgeDangerText: '#EF5350',

  // Notification
  notificationBg: '#1a1a2e',
  notificationText: '#FFFFFF',

  // Summary cards
  summaryCardBg: '#252550',
  summaryCardText: '#FFFFFF',
  summaryCardSubLabel: '#7b82e8',

  // Chart
  chartBarFill: '#5c63d6',
  chartBarTrack: '#2a2a45',
  chartLabel: '#9898b8',

  // Input
  inputBorder: '#2a2a45',
  inputFocusBorder: '#5c63d6',
  inputBackground: '#151530',
  placeholder: '#5c5c7a',

  // Overlay / Shadow
  shadowColor: '#000000',

  // Trip card accent
  tripCardBorder: '#5c63d6',

  // Transparent
  transparent: 'transparent',
};

// Default export (light mode) — overridden at runtime by ThemeContext
export let COLORS = { ...LIGHT_COLORS };

export function getColors(isDark) {
  return isDark ? DARK_COLORS : LIGHT_COLORS;
}

export { LIGHT_COLORS, DARK_COLORS };

export const FONTS = {
  regular: 'Poppins_400Regular',
  semiBold: 'Poppins_600SemiBold',
  bold: 'Poppins_700Bold',
};

export const FONT_SIZES = {
  xs: 10,
  sm: 12,
  base: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 30,
  display: 36,
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40,
  section: 48,
};

export const RADIUS = {
  sm: 8,
  md: 12,
  card: 16,
  lg: 20,
  pill: 999,
};

export function getShadows(isDark) {
  const shadowColor = isDark ? '#000000' : '#333788';
  return {
    card: {
      shadowColor,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.3 : 0.10,
      shadowRadius: 8,
      elevation: 4,
    },
    strong: {
      shadowColor,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: isDark ? 0.4 : 0.15,
      shadowRadius: 12,
      elevation: 8,
    },
    subtle: {
      shadowColor,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: isDark ? 0.2 : 0.06,
      shadowRadius: 4,
      elevation: 2,
    },
  };
}

export const SHADOWS = getShadows(false);

export const HEADER_STYLE = {
  backgroundColor: LIGHT_COLORS.primaryDark,
  elevation: 0,
  shadowOpacity: 0,
};

export const HEADER_TITLE_STYLE = {
  color: LIGHT_COLORS.white,
  fontFamily: FONTS.bold,
  fontSize: FONT_SIZES.lg,
};

export default {
  COLORS,
  LIGHT_COLORS,
  DARK_COLORS,
  getColors,
  getShadows,
  FONTS,
  FONT_SIZES,
  SPACING,
  RADIUS,
  SHADOWS,
  HEADER_STYLE,
  HEADER_TITLE_STYLE,
};
