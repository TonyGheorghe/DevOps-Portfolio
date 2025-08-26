// src/components/common/DarkModeSystem.tsx - Enhanced Dark Mode Implementation
import React, { useState, useContext, createContext, useEffect } from 'react';
import { Moon, Sun, Monitor, Palette } from 'lucide-react';

// ===========================================
// DARK MODE TYPES & CONTEXT
// ===========================================

type ThemeMode = 'light' | 'dark' | 'system';
type ContrastLevel = 'normal' | 'high';

interface DarkModeSettings {
  mode: ThemeMode;
  contrast: ContrastLevel;
  autoSwitch: boolean;
  switchTime: { start: string; end: string };
}

interface DarkModeContextType {
  settings: DarkModeSettings;
  currentTheme: 'light' | 'dark';
  updateSettings: (settings: Partial<DarkModeSettings>) => void;
  toggleMode: () => void;
  resetSettings: () => void;
}

const defaultSettings: DarkModeSettings = {
  mode: 'system',
  contrast: 'normal',
  autoSwitch: false,
  switchTime: { start: '20:00', end: '07:00' }
};

const DarkModeContext = createContext<DarkModeContextType | null>(null);

export const useDarkMode = () => {
  const context = useContext(DarkModeContext);
  if (!context) {
    throw new Error('useDarkMode must be used within DarkModeProvider');
  }
  return context;
};

// ===========================================
// DARK MODE PROVIDER
// ===========================================

export const DarkModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<DarkModeSettings>(() => {
    try {
      const saved = localStorage.getItem('dark-mode-settings');
      return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
    } catch {
      return defaultSettings;
    }
  });

  const [currentTheme, setCurrentTheme] = useState<'light' | 'dark'>('light');

  // Detect system theme preference
  const getSystemTheme = (): 'light' | 'dark' => {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  };

  // Check if it's within auto-switch time range
  const isWithinAutoSwitchTime = (): boolean => {
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    const [startHour, startMin] = settings.switchTime.start.split(':').map(Number);
    const [endHour, endMin] = settings.switchTime.end.split(':').map(Number);
    
    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;

    if (startTime <= endTime) {
      return currentTime >= startTime && currentTime <= endTime;
    } else {
      // Crosses midnight
      return currentTime >= startTime || currentTime <= endTime;
    }
  };

  // Determine current theme based on settings
  const determineCurrentTheme = (): 'light' | 'dark' => {
    if (settings.autoSwitch && isWithinAutoSwitchTime()) {
      return 'dark';
    }

    switch (settings.mode) {
      case 'dark':
        return 'dark';
      case 'light':
        return 'light';
      case 'system':
        return getSystemTheme();
      default:
        return 'light';
    }
  };

  // Apply theme to document
  useEffect(() => {
    const theme = determineCurrentTheme();
    setCurrentTheme(theme);

    // Update document classes
    const root = document.documentElement;
    
    // Remove existing theme classes
    root.classList.remove('light', 'dark', 'high-contrast');
    
    // Apply new theme
    root.classList.add(theme);
    
    // Apply contrast level
    if (settings.contrast === 'high') {
      root.classList.add('high-contrast');
    }
    
    // Update data attributes for existing accessibility system
    root.setAttribute('data-theme', theme);
    root.setAttribute('data-contrast', settings.contrast === 'high' ? 'high' : 'normal');
    
    // Update meta theme-color
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
      metaTheme.setAttribute('content', theme === 'dark' ? '#1a1a1a' : '#ffffff');
    }

    // Save settings
    localStorage.setItem('dark-mode-settings', JSON.stringify(settings));
  }, [settings]);

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (settings.mode === 'system') {
        setCurrentTheme(getSystemTheme());
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [settings.mode]);

  // Auto-switch timer
  useEffect(() => {
    if (!settings.autoSwitch) return;

    const checkAutoSwitch = () => {
      const newTheme = determineCurrentTheme();
      if (newTheme !== currentTheme) {
        setCurrentTheme(newTheme);
      }
    };

    const interval = setInterval(checkAutoSwitch, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [settings.autoSwitch, settings.switchTime, currentTheme]);

  const updateSettings = (newSettings: Partial<DarkModeSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const toggleMode = () => {
    const modes: ThemeMode[] = ['light', 'dark', 'system'];
    const currentIndex = modes.indexOf(settings.mode);
    const nextIndex = (currentIndex + 1) % modes.length;
    updateSettings({ mode: modes[nextIndex] });
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
  };

  return (
    <DarkModeContext.Provider value={{
      settings,
      currentTheme,
      updateSettings,
      toggleMode,
      resetSettings
    }}>
      {children}
    </DarkModeContext.Provider>
  );
};

// ===========================================
// DARK MODE TOGGLE BUTTON
// ===========================================

export const DarkModeToggle: React.FC<{
  className?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}> = ({ 
  className = '', 
  showLabel = false,
  size = 'md' 
}) => {
  const { settings, currentTheme, toggleMode } = useDarkMode();

  const sizeClasses = {
    sm: 'h-8 w-8 p-1.5',
    md: 'h-10 w-10 p-2',
    lg: 'h-12 w-12 p-2.5'
  };

  const getIcon = () => {
    switch (settings.mode) {
      case 'light':
        return <Sun className="h-full w-full" />;
      case 'dark':
        return <Moon className="h-full w-full" />;
      case 'system':
        return <Monitor className="h-full w-full" />;
      default:
        return <Sun className="h-full w-full" />;
    }
  };

  const getLabel = () => {
    switch (settings.mode) {
      case 'light':
        return 'Mod luminos';
      case 'dark':
        return 'Mod întunecat';
      case 'system':
        return 'Detectare automată';
      default:
        return 'Temă';
    }
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <button
        onClick={toggleMode}
        className={`
          ${sizeClasses[size]}
          rounded-lg transition-all duration-300 ease-in-out
          ${currentTheme === 'dark' 
            ? 'bg-gray-800 text-yellow-400 hover:bg-gray-700' 
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }
          ${settings.mode === 'system' 
            ? 'ring-2 ring-blue-500 ring-opacity-50' 
            : ''
          }
          hover:scale-110 active:scale-95
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        `}
        title={getLabel()}
        aria-label={`Schimbă tema: ${getLabel()}`}
      >
        {getIcon()}
      </button>
      
      {showLabel && (
        <span className={`text-sm font-medium ${
          currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'
        }`}>
          {getLabel()}
        </span>
      )}
    </div>
  );
};

// ===========================================
// DARK MODE SETTINGS PANEL
// ===========================================

export const DarkModeSettings: React.FC<{
  isOpen: boolean;
  onClose: () => void;
}> = ({ isOpen, onClose }) => {
  const { settings, updateSettings, resetSettings } = useDarkMode();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <Palette className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Setări Temă
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              ✕
            </button>
          </div>

          <div className="space-y-6">
            {/* Theme Mode */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Modul temă
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: 'light' as ThemeMode, label: 'Luminos', icon: Sun },
                  { value: 'dark' as ThemeMode, label: 'Întunecat', icon: Moon },
                  { value: 'system' as ThemeMode, label: 'System', icon: Monitor }
                ].map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    onClick={() => updateSettings({ mode: value })}
                    className={`
                      p-3 rounded-lg border-2 transition-colors text-center
                      ${settings.mode === value
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                      }
                    `}
                  >
                    <Icon className="h-6 w-6 mx-auto mb-2 text-gray-600 dark:text-gray-400" />
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {label}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Contrast Level */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Nivel contrast
              </label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: 'normal' as ContrastLevel, label: 'Normal' },
                  { value: 'high' as ContrastLevel, label: 'Înalt' }
                ].map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => updateSettings({ contrast: value })}
                    className={`
                      p-3 rounded-lg border-2 transition-colors text-center
                      ${settings.contrast === value
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                      }
                    `}
                  >
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {label}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Auto Switch */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Comutare automată
                </label>
                <button
                  onClick={() => updateSettings({ autoSwitch: !settings.autoSwitch })}
                  className={`
                    relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                    ${settings.autoSwitch ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'}
                  `}
                >
                  <span
                    className={`
                      inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                      ${settings.autoSwitch ? 'translate-x-6' : 'translate-x-1'}
                    `}
                  />
                </button>
              </div>
              
              {settings.autoSwitch && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                      Începe tema întunecată
                    </label>
                    <input
                      type="time"
                      value={settings.switchTime.start}
                      onChange={(e) => updateSettings({
                        switchTime: { ...settings.switchTime, start: e.target.value }
                      })}
                      className="w-full px-2 py-1 text-sm border rounded dark:bg-gray-700 dark:border-gray-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                      Termină tema întunecată
                    </label>
                    <input
                      type="time"
                      value={settings.switchTime.end}
                      onChange={(e) => updateSettings({
                        switchTime: { ...settings.switchTime, end: e.target.value }
                      })}
                      className="w-full px-2 py-1 text-sm border rounded dark:bg-gray-700 dark:border-gray-600"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex space-x-3 pt-4 border-t dark:border-gray-600">
              <button
                onClick={resetSettings}
                className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Resetează
              </button>
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Aplică
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ===========================================
// THEME DETECTOR COMPONENT
// ===========================================

export const ThemeDetector: React.FC = () => {
  const { currentTheme, settings } = useDarkMode();

  return (
    <div className="fixed bottom-20 left-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3 text-xs border dark:border-gray-600 z-30">
      <div className="font-medium text-gray-900 dark:text-gray-100">
        Temă activă: {currentTheme === 'dark' ? 'Întunecată' : 'Luminoasă'}
      </div>
      <div className="text-gray-600 dark:text-gray-400">
        Mod: {settings.mode} | Contrast: {settings.contrast}
      </div>
      {settings.autoSwitch && (
        <div className="text-blue-600 dark:text-blue-400">
          Auto: {settings.switchTime.start} - {settings.switchTime.end}
        </div>
      )}
    </div>
  );
};
