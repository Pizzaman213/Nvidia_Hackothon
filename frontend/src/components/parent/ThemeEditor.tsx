import React, { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { ThemeType } from '../../types';
import { getThemeColors, getThemeFromGender } from '../../utils/theme';

interface ThemeEditorProps {
  currentChild?: {
    id: string;
    name: string;
    age: number;
    gender?: 'boy' | 'girl' | null;
  };
}

export const ThemeEditor: React.FC<ThemeEditorProps> = ({ currentChild }) => {
  const { childTheme, childColors, setChildTheme, setCustomColors, parentTheme, setParentTheme, savePreferences } = useTheme();
  const [previewTheme, setPreviewTheme] = useState<ThemeType>(childTheme);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const themes: { value: ThemeType; label: string; description: string }[] = [
    { value: 'boy', label: 'Boy Theme', description: 'Blue and sky colors with playful energy' },
    { value: 'girl', label: 'Girl Theme', description: 'Pink and purple colors with warmth' },
    { value: 'neutral', label: 'Neutral Theme', description: 'Balanced colors for everyone' },
    { value: 'teen', label: 'Teen Theme', description: 'Modern dark theme with neon accents (10+)' },
  ];

  const handleThemeChange = (theme: ThemeType) => {
    setPreviewTheme(theme);
    setChildTheme(theme);
  };

  const handleSavePreferences = async () => {
    setIsSaving(true);
    setSaveMessage(null);
    try {
      await savePreferences();
      setSaveMessage({ type: 'success', text: 'Theme preferences saved successfully!' });
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error) {
      setSaveMessage({ type: 'error', text: 'Failed to save preferences. Changes saved locally only.' });
      setTimeout(() => setSaveMessage(null), 5000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetToDefault = () => {
    if (currentChild) {
      const defaultTheme = getThemeFromGender(currentChild.gender, currentChild.age);
      setPreviewTheme(defaultTheme);
      setChildTheme(defaultTheme);
    } else {
      setPreviewTheme('neutral');
      setChildTheme('neutral');
    }
  };

  const previewColors = getThemeColors(previewTheme);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-dark rounded-2xl p-6 border border-neon-cyan/20">
        <h2 className="text-2xl font-geometric font-bold text-white mb-2">Theme Editor</h2>
        <p className="text-gray-300">
          Customize the visual appearance for {currentChild ? currentChild.name : 'your child'}'s interface
        </p>
      </div>

      {/* Child Theme Selection */}
      <div className="glass-dark rounded-2xl p-6 border border-neon-cyan/20">
        <h3 className="text-xl font-geometric font-bold text-white mb-4">Child Interface Theme</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {themes.map((theme) => {
            const colors = getThemeColors(theme.value);
            const isSelected = previewTheme === theme.value;
            const isTeen = theme.value === 'teen';
            const isAgeAppropriate = !isTeen || (currentChild && currentChild.age >= 10);

            return (
              <button
                key={theme.value}
                onClick={() => isAgeAppropriate && handleThemeChange(theme.value)}
                disabled={!isAgeAppropriate}
                className={`relative p-4 rounded-xl border-2 transition-all ${
                  isSelected
                    ? 'border-neon-cyan bg-neon-cyan/10 shadow-lg shadow-neon-cyan/20'
                    : 'border-gray-700 bg-dark-3 hover:border-gray-600'
                } ${!isAgeAppropriate ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                {/* Color Preview */}
                <div className="flex gap-2 mb-3">
                  <div
                    className="w-12 h-12 rounded-lg"
                    style={{ backgroundColor: colors.primary }}
                  />
                  <div
                    className="w-12 h-12 rounded-lg"
                    style={{ backgroundColor: colors.secondary }}
                  />
                  <div
                    className="w-12 h-12 rounded-lg"
                    style={{ backgroundColor: colors.accent }}
                  />
                </div>

                {/* Theme Info */}
                <h4 className="text-lg font-bold text-white text-left mb-1">{theme.label}</h4>
                <p className="text-sm text-gray-400 text-left">{theme.description}</p>

                {/* Age restriction notice */}
                {!isAgeAppropriate && (
                  <div className="mt-2 text-xs text-yellow-400">
                    Only available for ages 10+
                  </div>
                )}

                {/* Selected indicator */}
                {isSelected && (
                  <div className="absolute top-2 right-2 w-6 h-6 bg-neon-cyan rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-dark" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Preview Card */}
        <div className="border border-gray-700 rounded-xl p-6" style={{ backgroundColor: previewColors.background }}>
          <h4 className="text-lg font-bold mb-4" style={{ color: previewColors.textPrimary }}>
            Preview
          </h4>
          <div className="space-y-3">
            <button
              className="px-6 py-3 rounded-xl font-bold text-white"
              style={{ backgroundColor: previewColors.primary }}
            >
              Primary Button
            </button>
            <button
              className="px-6 py-3 rounded-xl font-bold text-white"
              style={{ backgroundColor: previewColors.secondary }}
            >
              Secondary Button
            </button>
            <button
              className="px-6 py-3 rounded-xl font-bold text-white"
              style={{ backgroundColor: previewColors.accent }}
            >
              Accent Button
            </button>
          </div>
        </div>

        {/* Reset Button */}
        {currentChild && (
          <div className="mt-4">
            <button
              onClick={handleResetToDefault}
              className="px-4 py-2 bg-dark-2 hover:bg-dark-3 text-gray-300 rounded-lg border border-gray-700 transition-colors"
            >
              Reset to Default for {currentChild.name}
            </button>
          </div>
        )}
      </div>

      {/* Parent Dashboard Theme */}
      <div className="glass-dark rounded-2xl p-6 border border-neon-cyan/20">
        <h3 className="text-xl font-geometric font-bold text-white mb-4">Parent Dashboard Theme</h3>

        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => setParentTheme('dark')}
            className={`p-4 rounded-xl border-2 transition-all ${
              parentTheme === 'dark'
                ? 'border-neon-cyan bg-neon-cyan/10'
                : 'border-gray-700 bg-dark-3 hover:border-gray-600'
            }`}
          >
            <div className="w-full h-24 bg-gradient-to-br from-dark to-dark-2 rounded-lg mb-3 flex items-center justify-center">
              <span className="text-neon-cyan font-bold">Dark Mode</span>
            </div>
            <h4 className="text-white font-bold">Dark Theme</h4>
            <p className="text-sm text-gray-400">Modern dark interface (Current)</p>
          </button>

          <button
            onClick={() => setParentTheme('light')}
            className={`p-4 rounded-xl border-2 transition-all ${
              parentTheme === 'light'
                ? 'border-neon-cyan bg-neon-cyan/10'
                : 'border-gray-700 bg-dark-3 hover:border-gray-600'
            }`}
          >
            <div className="w-full h-24 bg-gradient-to-br from-gray-100 to-gray-300 rounded-lg mb-3 flex items-center justify-center">
              <span className="text-gray-800 font-bold">Light Mode</span>
            </div>
            <h4 className="text-white font-bold">Light Theme</h4>
            <p className="text-sm text-gray-400">Clean light interface</p>
          </button>
        </div>

        {parentTheme === 'light' && (
          <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <p className="text-blue-400 text-sm">
              <strong>Note:</strong> Light theme is now active! Your dashboard will display with a clean, bright interface. Changes are automatically saved.
            </p>
          </div>
        )}
      </div>

      {/* Advanced Settings (Future) */}
      <div className="glass-dark rounded-2xl p-6 border border-gray-700 opacity-60">
        <h3 className="text-xl font-geometric font-bold text-white mb-4">
          Advanced Customization
          <span className="ml-2 text-xs bg-gray-700 px-2 py-1 rounded-full">Coming Soon</span>
        </h3>
        <div className="space-y-3 text-gray-400">
          <div className="flex items-center justify-between">
            <span>Custom Color Picker</span>
            <div className="w-24 h-8 bg-dark-2 rounded border border-gray-700"></div>
          </div>
          <div className="flex items-center justify-between">
            <span>Animation Speed</span>
            <div className="w-32 h-2 bg-dark-2 rounded-full"></div>
          </div>
          <div className="flex items-center justify-between">
            <span>Font Size</span>
            <div className="w-32 h-2 bg-dark-2 rounded-full"></div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleSavePreferences}
          disabled={isSaving}
          className="px-8 py-3 bg-neon-cyan hover:bg-neon-cyan/80 text-dark font-bold rounded-xl transition-all hover:shadow-lg hover:shadow-neon-cyan/30 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? 'Saving...' : 'Save Theme Preferences'}
        </button>

        {saveMessage && (
          <div
            className={`px-4 py-2 rounded-lg ${
              saveMessage.type === 'success'
                ? 'bg-terminal-green/10 text-terminal-green border border-terminal-green/30'
                : 'bg-red-500/10 text-red-400 border border-red-500/30'
            }`}
          >
            {saveMessage.text}
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="glass-dark rounded-xl p-4 border border-neon-purple/20">
        <div className="flex gap-3">
          <div className="text-neon-purple text-2xl">ℹ️</div>
          <div>
            <h4 className="text-white font-bold mb-1">Theme Tips</h4>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>• Themes are automatically selected based on age and gender by default</li>
              <li>• Teen theme (10+) features a modern dark interface with neon accents</li>
              <li>• Changes are saved locally and synced to your account</li>
              <li>• Each child can have their own theme preference</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
