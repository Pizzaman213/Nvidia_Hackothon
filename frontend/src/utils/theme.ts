// ============================================================================
// Theme Utilities - Boy/Girl/Neutral/Teen Color Schemes
// ============================================================================

export type ThemeType = 'boy' | 'girl' | 'neutral' | 'teen';

export interface ColorScheme {
  primary: string;
  primaryHover: string;
  secondary: string;
  accent: string;
  background: string;
  backgroundGradient: string;
  text?: string;
  textSecondary?: string;
}

export const colorSchemes: Record<ThemeType, ColorScheme> = {
  boy: {
    primary: 'bg-blue-500',
    primaryHover: 'hover:bg-blue-600',
    secondary: 'bg-sky-400',
    accent: 'bg-indigo-400',
    background: 'bg-blue-50',
    backgroundGradient: 'bg-gradient-to-br from-blue-100 via-sky-100 to-indigo-100',
  },
  girl: {
    primary: 'bg-pink-500',
    primaryHover: 'hover:bg-pink-600',
    secondary: 'bg-rose-400',
    accent: 'bg-purple-400',
    background: 'bg-pink-50',
    backgroundGradient: 'bg-gradient-to-br from-pink-100 via-rose-100 to-purple-100',
  },
  neutral: {
    primary: 'bg-child-primary',
    primaryHover: 'hover:bg-pink-500',
    secondary: 'bg-purple-400',
    accent: 'bg-yellow-400',
    background: 'bg-child-bg',
    backgroundGradient: 'bg-gradient-to-br from-child-bg via-pink-100 to-purple-100',
  },
  teen: {
    primary: 'bg-cyber-cyan',
    primaryHover: 'hover:bg-cyan-400',
    secondary: 'bg-cyber-purple',
    accent: 'bg-cyber-mint',
    background: 'bg-cyber-dark',
    backgroundGradient: 'bg-gradient-to-br from-cyber-darker via-cyber-dark to-cyber-navy',
    text: 'text-white',
    textSecondary: 'text-gray-300',
  },
};

export const textColorSchemes: Record<ThemeType, { primary: string; secondary: string }> = {
  boy: {
    primary: 'text-blue-600',
    secondary: 'text-sky-600',
  },
  girl: {
    primary: 'text-pink-600',
    secondary: 'text-rose-600',
  },
  neutral: {
    primary: 'text-child-primary',
    secondary: 'text-purple-600',
  },
  teen: {
    primary: 'text-cyber-cyan',
    secondary: 'text-cyber-mint',
  },
};

export const borderColorSchemes: Record<ThemeType, { primary: string; secondary: string }> = {
  boy: {
    primary: 'border-blue-500',
    secondary: 'border-sky-400',
  },
  girl: {
    primary: 'border-pink-500',
    secondary: 'border-rose-400',
  },
  neutral: {
    primary: 'border-child-primary',
    secondary: 'border-purple-400',
  },
  teen: {
    primary: 'border-cyber-cyan',
    secondary: 'border-cyber-purple',
  },
};

/**
 * Get theme type from gender preference and age
 */
export function getThemeFromGender(gender?: 'boy' | 'girl' | null, age?: number): ThemeType {
  // Use teen theme for ages 10 and above
  if (age && age >= 10) return 'teen';

  if (gender === 'boy') return 'boy';
  if (gender === 'girl') return 'girl';
  return 'neutral';
}

/**
 * Get color scheme for a theme
 */
export function getColorScheme(theme: ThemeType): ColorScheme {
  return colorSchemes[theme];
}

/**
 * Helper to build className with theme colors
 */
export function themeClass(
  theme: ThemeType,
  type: 'primary' | 'secondary' | 'accent' | 'background' | 'backgroundGradient'
): string {
  return colorSchemes[theme][type];
}

/**
 * Get button className with theme
 */
export function getButtonClass(theme: ThemeType, variant: 'primary' | 'secondary' = 'primary'): string {
  const scheme = colorSchemes[theme];

  if (variant === 'primary') {
    return `${scheme.primary} ${scheme.primaryHover} text-white`;
  } else {
    return `${scheme.secondary} hover:opacity-90 text-white`;
  }
}

/**
 * Get activity card colors based on theme
 */
export function getActivityCardColor(theme: ThemeType, activityIndex: number): string {
  const boyColors = ['bg-blue-400', 'bg-sky-400', 'bg-indigo-400', 'bg-cyan-400'];
  const girlColors = ['bg-pink-400', 'bg-rose-400', 'bg-purple-400', 'bg-fuchsia-400'];
  const neutralColors = ['bg-pink-400', 'bg-purple-400', 'bg-yellow-400', 'bg-green-400'];
  const teenColors = ['bg-cyber-cyan', 'bg-cyber-purple', 'bg-cyber-mint', 'bg-cyber-pink'];

  if (theme === 'boy') {
    return boyColors[activityIndex % boyColors.length];
  } else if (theme === 'girl') {
    return girlColors[activityIndex % girlColors.length];
  } else if (theme === 'teen') {
    return teenColors[activityIndex % teenColors.length];
  } else {
    return neutralColors[activityIndex % neutralColors.length];
  }
}

/**
 * Check if theme is teen/modern
 */
export function isTeenTheme(theme: ThemeType): boolean {
  return theme === 'teen';
}

/**
 * Get theme colors - returns the raw color values without Tailwind classes
 * Useful for inline styles or CSS-in-JS
 */
export function getThemeColors(theme: ThemeType): {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
  textPrimary: string;
  textSecondary: string;
} {
  const colorMap: Record<ThemeType, ReturnType<typeof getThemeColors>> = {
    boy: {
      primary: '#3b82f6',     // blue-500
      secondary: '#38bdf8',   // sky-400
      accent: '#818cf8',      // indigo-400
      background: '#eff6ff',  // blue-50
      text: '#1e40af',        // blue-800
      textPrimary: '#1e40af', // blue-800
      textSecondary: '#1e3a8a', // blue-900
    },
    girl: {
      primary: '#ec4899',     // pink-500
      secondary: '#fb7185',   // rose-400
      accent: '#c084fc',      // purple-400
      background: '#fdf2f8',  // pink-50
      text: '#9f1239',        // rose-800
      textPrimary: '#9f1239', // rose-800
      textSecondary: '#881337', // rose-900
    },
    neutral: {
      primary: '#d946ef',     // fuchsia-500
      secondary: '#c084fc',   // purple-400
      accent: '#fbbf24',      // yellow-400
      background: '#fdf4ff',  // fuchsia-50
      text: '#86198f',        // fuchsia-800
      textPrimary: '#86198f', // fuchsia-800
      textSecondary: '#701a75', // fuchsia-900
    },
    teen: {
      primary: '#06b6d4',     // cyan-500
      secondary: '#a855f7',   // purple-500
      accent: '#34d399',      // emerald-400
      background: '#0f172a',  // slate-900
      text: '#e0f2fe',        // sky-100
      textPrimary: '#e0f2fe', // sky-100
      textSecondary: '#bae6fd', // sky-200
    },
  };

  return colorMap[theme];
}
