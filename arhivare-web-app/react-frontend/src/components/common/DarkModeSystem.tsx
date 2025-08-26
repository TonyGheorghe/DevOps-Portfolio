// src/components/common/DarkModeSystem.tsx - ULTIMATE FIX
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
  mode: 'light', // 🔥 FORCE LIGHT as default
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
// 🔥 ULTIMATE DARK MODE PROVIDER
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
    if (typeof window === 'undefined') return 'light';
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

  // 🔥 ULTIMATE: Determine current theme based on settings
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

  // 🔥 NUCLEAR OPTION: Force apply theme with extreme prejudice
  const forceApplyTheme = (theme: 'light' | 'dark') => {
    const root = document.documentElement;
    
    console.log(`🔥 FORCE APPLYING THEME: ${theme}`);
    
    // 🔥 STEP 1: NUCLEAR CLEANUP - Remove ALL possible theme classes
    const allPossibleClasses = [
      'light', 'dark', 'theme-light', 'theme-dark', 
      'high-contrast', 'normal-contrast', 'auto-dark', 'auto-light',
      'bg-light', 'bg-dark', 'text-light', 'text-dark'
    ];
    
    allPossibleClasses.forEach(cls => {
      root.classList.remove(cls);
      document.body.classList.remove(cls);
    });
    
    // 🔥 STEP 2: Remove ALL data attributes
    ['data-theme', 'data-contrast', 'data-mode', 'data-color-scheme'].forEach(attr => {
      root.removeAttribute(attr);
      document.body.removeAttribute(attr);
    });
    
    // 🔥 STEP 3: FORCE ADD the correct theme class
    if (theme === 'dark') {
      root.classList.add('dark');
      document.body.classList.add('dark');
    } else {
      root.classList.add('light');
      document.body.classList.add('light');
    }
    
    // 🔥 STEP 4: Apply contrast
    if (settings.contrast === 'high') {
      root.classList.add('high-contrast');
    }
    
    // 🔥 STEP 5: Set data attributes for CSS targeting
    root.setAttribute('data-theme', theme);
    root.setAttribute('data-contrast', settings.contrast);
    document.body.setAttribute('data-theme', theme);
    
    // 🔥 STEP 6: FORCE CSS custom properties
    const cssVars = theme === 'dark' ? {
      '--tw-bg-opacity': '1',
      'color-scheme': 'dark',
      '--bg-primary': '#0f172a',
      '--text-primary': '#f1f5f9'
    } : {
      '--tw-bg-opacity': '1', 
      'color-scheme': 'light',
      '--bg-primary': '#ffffff',
      '--text-primary': '#1f2937'
    };
    
    Object.entries(cssVars).forEach(([prop, value]) => {
      root.style.setProperty(prop, value);
      document.body.style.setProperty(prop, value);
    });
    
    // 🔥 STEP 7: Update meta theme-color
    let metaTheme = document.querySelector('meta[name="theme-color"]');
    if (!metaTheme) {
      metaTheme = document.createElement('meta');
      metaTheme.setAttribute('name', 'theme-color');
      document.head.appendChild(metaTheme);
    }
    metaTheme.setAttribute('content', theme === 'dark' ? '#0f172a' : '#ffffff');
    
    // 🔥 STEP 8: Force a repaint/reflow
    root.style.display = 'none';
    root.offsetHeight; // trigger reflow
    root.style.display = '';
    
    // 🔥 STEP 9: Dispatch custom event for any other listeners
    window.dispatchEvent(new CustomEvent('theme-changed', { 
      detail: { theme, mode: settings.mode } 
    }));
    
    console.log(`✅ THEME APPLIED: ${theme}`);
    console.log(`📋 HTML Classes: ${root.className}`);
    console.log(`📋 Body Classes: ${document.body.className}`);
  };

  // 🔥 ULTIMATE: Apply theme to document with EXTREME FORCE
  useEffect(() => {
    const theme = determineCurrentTheme();
    setCurrentTheme(theme);
    
    // 🔥 Use setTimeout to ensure DOM is ready
    setTimeout(() => {
      forceApplyTheme(theme);
    }, 0);

    // Save settings to localStorage
    localStorage.setItem('dark-mode-settings', JSON.stringify(settings));

    console.log(`🎨 Theme determined: ${theme}, Mode: ${settings.mode}`);
  }, [settings]);

  // 🔥 FORCE INITIAL THEME on mount
  useEffect(() => {
    const theme = determineCurrentTheme();
    console.log(`🚀 Initial theme application: ${theme}`);
    forceApplyTheme(theme);
  }, []); // Run only once on mount

  // Listen for system theme changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (settings.mode === 'system') {
        const newTheme = getSystemTheme();
        console.log(`🔄 System theme changed to: ${newTheme}`);
        setCurrentTheme(newTheme);
        forceApplyTheme(newTheme);
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
        console.log(`⏰ Auto-switch: ${currentTheme} → ${newTheme}`);
        setCurrentTheme(newTheme);
        forceApplyTheme(newTheme);
      }
    };

    const interval = setInterval(checkAutoSwitch, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [settings.autoSwitch, settings.switchTime, currentTheme]);

  const updateSettings = (newSettings: Partial<DarkModeSettings>) => {
    console.log(`🔧 Updating settings:`, newSettings);
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const toggleMode = () => {
    const modes: ThemeMode[] = ['light', 'dark', 'system'];
    const currentIndex = modes.indexOf(settings.mode);
    const nextIndex = (currentIndex + 1) % modes.length;
    const nextMode = modes[nextIndex];
    
    console.log(`🔀 Toggle: ${settings.mode} → ${nextMode}`);
    updateSettings({ mode: nextMode });
  };

  const resetSettings = () => {
    console.log('🔄 Reset to default settings');
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
// 🔥 ENHANCED TOGGLE BUTTON
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

  // Enhanced styling based on ACTUAL theme
  const getButtonStyle = () => {
    if (currentTheme === 'dark') {
      return 'bg-gray-800 text-yellow-400 hover:bg-gray-700 border border-gray-600';
    } else {
      return 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300 shadow-sm';
    }
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <button
        onClick={toggleMode}
        className={`
          ${sizeClasses[size]}
          rounded-lg transition-all duration-300 ease-in-out
          ${getButtonStyle()}
          ${settings.mode === 'system' 
            ? 'ring-2 ring-blue-500 ring-opacity-50' 
            : ''
          }
          hover:scale-110 active:scale-95
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        `}
        title={`${getLabel()} (Activ: ${currentTheme})`}
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
// 🔥 ENHANCED DEBUG COMPONENT
// ===========================================

export const ThemeDebugger: React.FC = () => {
  const { settings, currentTheme } = useDarkMode();
  const [isExpanded, setIsExpanded] = useState(false);

  if (process.env.NODE_ENV !== 'development') return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 max-w-80">
      <div 
        className={`rounded-lg shadow-lg p-3 text-xs border transition-all cursor-pointer ${
          currentTheme === 'dark' 
            ? 'bg-gray-800 text-gray-100 border-gray-600' 
            : 'bg-white text-gray-900 border-gray-300'
        }`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="font-bold text-blue-600 dark:text-blue-400">🎨 Theme Debug</div>
          <div className={`px-2 py-1 rounded text-xs font-mono ${
            currentTheme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
          }`}>
            {currentTheme.toUpperCase()}
          </div>
        </div>
        
        {isExpanded && (
          <div className="mt-3 space-y-1">
            <div>Mode: <span className={`font-mono px-1 rounded ${
              currentTheme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
            }`}>{settings.mode}</span></div>
            
            <div>Active: <span className={`font-mono px-1 rounded ${
              currentTheme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
            }`}>{currentTheme}</span></div>
            
            <div>Contrast: <span className={`font-mono px-1 rounded ${
              currentTheme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
            }`}>{settings.contrast}</span></div>
            
            <div>Auto-switch: <span className={`font-mono px-1 rounded ${
              currentTheme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
            }`}>{settings.autoSwitch ? 'ON' : 'OFF'}</span></div>
            
            <div className="mt-2 pt-2 border-t border-gray-300 dark:border-gray-600">
              <div className="text-xs">HTML classes:</div>
              <div className={`font-mono text-xs break-all px-1 rounded mt-1 ${
                currentTheme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
              }`}>
                {document.documentElement.className || '(none)'}
              </div>
            </div>
          </div>
        )}
      </div>
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
  const { settings, updateSettings, resetSettings, currentTheme } = useDarkMode();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className={`rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto ${
        currentTheme === 'dark' ? 'bg-gray-800' : 'bg-white'
      }`}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <Palette className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              <h2 className={`text-xl font-semibold ${
                currentTheme === 'dark' ? 'text-gray-100' : 'text-gray-900'
              }`}>
                Setări Temă
              </h2>
            </div>
            <button
              onClick={onClose}
              className={`hover:text-gray-600 dark:hover:text-gray-300 ${
                currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-400'
              }`}
            >
              ✕
            </button>
          </div>

          {/* Current Status */}
          <div className={`mb-6 p-4 rounded-lg ${
            currentTheme === 'dark' ? 'bg-blue-900/20' : 'bg-blue-50'
          }`}>
            <h3 className={`text-sm font-medium mb-2 ${
              currentTheme === 'dark' ? 'text-blue-100' : 'text-blue-900'
            }`}>Status Actual</h3>
            <div className={`text-sm ${
              currentTheme === 'dark' ? 'text-blue-200' : 'text-blue-800'
            }`}>
              <div>Mod setat: <span className={`font-mono px-2 py-1 rounded ${
                currentTheme === 'dark' ? 'bg-blue-800' : 'bg-blue-100'
              }`}>{settings.mode}</span></div>
              <div className="mt-1">Tema activă: <span className={`font-mono px-2 py-1 rounded ${
                currentTheme === 'dark' ? 'bg-blue-800' : 'bg-blue-100'
              }`}>{currentTheme}</span></div>
            </div>
          </div>

          <div className="space-y-6">
            {/* Theme Mode */}
            <div>
              <label className={`block text-sm font-medium mb-3 ${
                currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}>
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
                        ? `border-blue-500 ${currentTheme === 'dark' ? 'bg-blue-900/20' : 'bg-blue-50'}`
                        : `${currentTheme === 'dark' 
                            ? 'border-gray-600 hover:border-gray-500' 
                            : 'border-gray-200 hover:border-gray-300'
                          }`
                      }
                    `}
                  >
                    <Icon className={`h-6 w-6 mx-auto mb-2 ${
                      currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    }`} />
                    <div className={`text-sm font-medium ${
                      currentTheme === 'dark' ? 'text-gray-100' : 'text-gray-900'
                    }`}>
                      {label}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className={`flex space-x-3 pt-4 border-t ${
              currentTheme === 'dark' ? 'border-gray-600' : 'border-gray-200'
            }`}>
              <button
                onClick={resetSettings}
                className={`flex-1 px-4 py-2 border rounded-lg transition-colors ${
                  currentTheme === 'dark' 
                    ? 'text-gray-300 border-gray-600 hover:bg-gray-700'
                    : 'text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
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
