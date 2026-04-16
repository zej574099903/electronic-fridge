export const colors = {
  background: '#F3F7FB',
  backgroundElevated: '#FBFDFF',
  surface: '#FFFFFF',
  surfaceAlt: '#F7FAFD',
  surfaceSecondary: '#F7FAFD',
  surfaceTertiary: '#EEF4F8',
  border: '#D9E5EE',
  borderStrong: '#B9CCDA',

  textPrimary: '#163047',
  textSecondary: '#557086',
  textMuted: '#89A0B2',
  textOnDark: '#F7FBFF',

  primary: '#1F7A8C',
  primaryDeep: '#164E63',
  secondary: '#6FD6FF',
  accent: '#5BC0EB',

  success: '#2FA67A',
  warning: '#E7A73C',
  danger: '#DA6A5E',
  info: '#4F8DB8',

  fresh: '#E4F7F7',
  chilled: '#E9F4FF',
  frozen: '#EAF2FF',
  glow: 'rgba(95, 188, 221, 0.14)',
  shadow: 'rgba(22, 48, 71, 0.10)',

  gradient: {
    pageTop: '#ECF7FB',
    pageBottom: '#F7FBFE',
    heroStart: '#1E5F74',
    heroEnd: '#2D8DA1',
    cardGlow: ['rgba(111,214,255,0.18)', 'rgba(255,255,255,0)'] as const,
  },
};

export const radii = {
  sm: 14,
  md: 20,
  lg: 28,
  xl: 36,
  pill: 999,
};

export const spacing = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
};

export const shadows = {
  card: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 1,
    shadowRadius: 24,
    elevation: 6,
  },
  soft: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.65,
    shadowRadius: 16,
    elevation: 3,
  },
};
