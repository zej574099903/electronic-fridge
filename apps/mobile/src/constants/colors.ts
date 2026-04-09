export const colors = {
  // Base
  background: '#F1F5F9',    // Very light steel blue
  surface: '#FFFFFF',       // Pure white
  surfaceAlt: '#F8FAFC',    // Subtle grey-blue
  surfaceGlass: 'rgba(255, 255, 255, 0.7)',

  // Brand
  primary: '#1E293B',       // Softened Slate-800
  secondary: '#0EA5E9',     // Sky Blue (Fresh)
  accent: '#F97316',        // Vibrant orange (freshness)
  accentAlt: '#10B981',     // Emerald green (health/success)
  arctic: {
    blue: '#E0F2FE',
    deep: '#0F172A',
    light: '#F0F9FF',
    gradient: ['#1E293B', '#1E293B', '#0F172A'] as const,
    glassLight: 'rgba(255, 255, 255, 0.15)',
    glassBorder: 'rgba(255, 255, 255, 0.08)',
  },

  // Text
  textPrimary: '#0F172A',   // Very deep navy
  textSecondary: '#475569', // Slate-600
  textMuted: '#94A3B8',    // Slate-400

  // Status
  border: '#E2E8F0',        // Slate-200
  danger: '#EF4444',        // Red-500
  warning: '#F59E0B',       // Amber-500
  success: '#22C55E',       // Green-500
};
