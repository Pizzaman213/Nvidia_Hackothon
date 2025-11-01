import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ThemeType, ColorScheme, ThemePreference, ParentThemePreference, ThemeContextType } from '../types';
import { getThemeColors } from '../utils/theme';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
  parentId?: string;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children, parentId }) => {
  const [childTheme, setChildThemeState] = useState<ThemeType>('neutral');
  const [childColors, setChildColors] = useState<ColorScheme>(getThemeColors('neutral'));
  const [parentTheme, setParentThemeState] = useState<'dark' | 'light'>('dark');
  const [preferences, setPreferences] = useState<ThemePreference | null>(null);
  const [parentPreferences, setParentPreferences] = useState<ParentThemePreference | null>(null);

  // Load preferences from localStorage and backend on mount
  useEffect(() => {
    loadPreferencesFromStorage();
    if (parentId) {
      loadPreferencesFromBackend(parentId);
    }
  }, [parentId]);

  // Update colors when theme changes
  useEffect(() => {
    const baseColors = getThemeColors(childTheme);
    const customColors = preferences?.customColors || {};
    setChildColors({ ...baseColors, ...customColors });
  }, [childTheme, preferences]);

  const loadPreferencesFromStorage = () => {
    try {
      const storedPrefs = localStorage.getItem('childThemePreference');
      if (storedPrefs) {
        const prefs: ThemePreference = JSON.parse(storedPrefs);
        setPreferences(prefs);
        setChildThemeState(prefs.theme);
      }

      const storedParentPrefs = localStorage.getItem('parentThemePreference');
      if (storedParentPrefs) {
        const parentPrefs: ParentThemePreference = JSON.parse(storedParentPrefs);
        setParentPreferences(parentPrefs);
        setParentThemeState(parentPrefs.mode);
      }
    } catch (error) {
      console.error('Error loading theme preferences from localStorage:', error);
    }
  };

  const loadPreferencesFromBackend = async (pId: string) => {
    try {
      // Try to load parent theme preferences from backend
      // Note: You'll need to implement this endpoint
      const response = await axios.get(`${API_BASE_URL}/api/settings/${pId}/theme`);
      if (response.data) {
        setParentPreferences(response.data.parentPreferences);
        if (response.data.parentPreferences) {
          setParentThemeState(response.data.parentPreferences.mode);
        }
      }
    } catch (error) {
      console.log('Could not load theme preferences from backend (may not be implemented yet)');
    }
  };

  const setChildTheme = (theme: ThemeType) => {
    setChildThemeState(theme);
    const newPrefs: ThemePreference = {
      ...preferences,
      theme,
      autoTheme: false,
      lastModified: new Date().toISOString(),
    };
    setPreferences(newPrefs);
    localStorage.setItem('childThemePreference', JSON.stringify(newPrefs));
  };

  const setCustomColors = (colors: Partial<ColorScheme>) => {
    const newPrefs: ThemePreference = {
      ...preferences,
      theme: preferences?.theme || childTheme,
      customColors: { ...(preferences?.customColors || {}), ...colors },
      autoTheme: false,
      lastModified: new Date().toISOString(),
    };
    setPreferences(newPrefs);
    localStorage.setItem('childThemePreference', JSON.stringify(newPrefs));
  };

  const setParentTheme = (mode: 'dark' | 'light') => {
    setParentThemeState(mode);
    const newPrefs: ParentThemePreference = {
      parentId: parentId || '',
      mode,
      preferences: parentPreferences?.preferences || {
        animations: true,
        compactMode: false,
        highContrast: false,
      },
    };
    setParentPreferences(newPrefs);
    localStorage.setItem('parentThemePreference', JSON.stringify(newPrefs));
  };

  const savePreferences = async () => {
    try {
      if (parentId && parentPreferences) {
        // Save to backend
        // Note: You'll need to implement this endpoint
        await axios.put(`${API_BASE_URL}/api/settings/${parentId}/theme`, {
          parentPreferences,
          childPreferences: preferences,
        });
      }

      // Always save to localStorage as backup
      if (preferences) {
        localStorage.setItem('childThemePreference', JSON.stringify(preferences));
      }
      if (parentPreferences) {
        localStorage.setItem('parentThemePreference', JSON.stringify(parentPreferences));
      }
    } catch (error) {
      console.error('Error saving theme preferences:', error);
      throw error;
    }
  };

  const loadPreferences = async (childId?: string) => {
    if (childId) {
      try {
        // Load child-specific theme preferences from backend
        // Note: You'll need to implement this endpoint
        const response = await axios.get(`${API_BASE_URL}/api/children/${childId}/theme`);
        if (response.data) {
          setPreferences(response.data);
          setChildThemeState(response.data.theme);
        }
      } catch (error) {
        console.log('Could not load child theme preferences from backend');
      }
    }
  };

  const value: ThemeContextType = {
    childTheme,
    childColors,
    setChildTheme,
    setCustomColors,
    parentTheme,
    setParentTheme,
    preferences,
    parentPreferences,
    savePreferences,
    loadPreferences,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
