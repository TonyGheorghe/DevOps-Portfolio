// src/components/common/AccessibilitySystem.tsx - Complete A11y Support
import React, { useState, useRef, useEffect, useContext, createContext } from 'react';
import { 
  Eye, EyeOff, Type, Minus, Plus, RotateCcw, 
  Volume2, VolumeX, Settings, Check, X,
  Keyboard, Focus, Users, Contrast
} from 'lucide-react';

// ===========================================
// ACCESSIBILITY CONTEXT
// ===========================================

interface AccessibilitySettings {
  fontSize: number;
  contrast: 'normal' | 'high' | 'dark';
  animations: boolean;
  sounds: boolean;
  keyboardNavigation: boolean;
  screenReader: boolean;
  focusVisible: boolean;
}

interface AccessibilityContextType {
  settings: AccessibilitySettings;
  updateSettings: (settings: Partial<AccessibilitySettings>) => void;
  resetSettings: () => void;
  announceToScreenReader: (message: string) => void;
}

const defaultSettings: AccessibilitySettings = {
  fontSize: 16,
  contrast: 'normal',
  animations: true,
  sounds: true,
  keyboardNavigation: true,
  screenReader: false,
  focusVisible: true,
};

const AccessibilityContext = createContext<AccessibilityContextType | null>(null);

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within AccessibilityProvider');
  }
  return context;
};

// ===========================================
// ACCESSIBILITY PROVIDER
// ===========================================

export const AccessibilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<AccessibilitySettings>(() => {
    try {
      const saved = localStorage.getItem('accessibility-settings');
      return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
    } catch {
      return defaultSettings;
    }
  });

  const announcementRef = useRef<HTMLDivElement>(null);

  // Apply settings to document
  useEffect(() => {
    // Font size
    document.documentElement.style.fontSize = `${settings.fontSize}px`;
    
    // Contrast
    document.documentElement.setAttribute('data-contrast', settings.contrast);
    
    // Animations
    if (!settings.animations) {
      document.documentElement.style.setProperty('--animation-duration', '0s');
      document.documentElement.style.setProperty('--transition-duration', '0s');
    } else {
      document.documentElement.style.removeProperty('--animation-duration');
      document.documentElement.style.removeProperty('--transition-duration');
    }
    
    // Focus visible
    if (settings.focusVisible) {
      document.documentElement.classList.add('focus-visible');
    } else {
      document.documentElement.classList.remove('focus-visible');
    }

    // Save to localStorage
    localStorage.setItem('accessibility-settings', JSON.stringify(settings));
  }, [settings]);

  const updateSettings = (newSettings: Partial<AccessibilitySettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
  };

  const announceToScreenReader = (message: string) => {
    if (announcementRef.current) {
      announcementRef.current.textContent = message;
      setTimeout(() => {
        if (announcementRef.current) {
          announcementRef.current.textContent = '';
        }
      }, 1000);
    }
  };

  return (
    <AccessibilityContext.Provider value={{
      settings,
      updateSettings,
      resetSettings,
      announceToScreenReader
    }}>
      {children}
      
      {/* Screen Reader Announcements */}
      <div
        ref={announcementRef}
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      />
      
      {/* Global CSS for accessibility */}
      <style dangerouslySetInnerHTML={{
        __html: `
          /* High contrast mode */
          [data-contrast="high"] {
            --bg-primary: #ffffff;
            --bg-secondary: #f8f9fa;
            --text-primary: #000000;
            --text-secondary: #212529;
            --border-color: #000000;
            --focus-color: #0066cc;
          }
          
          [data-contrast="dark"] {
            --bg-primary: #1a1a1a;
            --bg-secondary: #2d2d2d;
            --text-primary: #ffffff;
            --text-secondary: #e0e0e0;
            --border-color: #ffffff;
            --focus-color: #66b3ff;
          }
          
          /* Focus indicators */
          .focus-visible *:focus-visible {
            outline: 2px solid var(--focus-color, #0066cc) !important;
            outline-offset: 2px !important;
          }
          
          /* Reduced motion */
          @media (prefers-reduced-motion: reduce) {
            * {
              animation-duration: 0.01ms !important;
              animation-iteration-count: 1 !important;
              transition-duration: 0.01ms !important;
              scroll-behavior: auto !important;
            }
          }
          
          /* Screen reader only class */
          .sr-only {
            position: absolute;
            width: 1px;
            height: 1px;
            padding: 0;
            margin: -1px;
            overflow: hidden;
            clip: rect(0, 0, 0, 0);
            white-space: nowrap;
            border: 0;
          }
          
          /* Skip link */
          .skip-link {
            position: absolute;
            top: -40px;
            left: 6px;
            background: #000;
            color: #fff;
            padding: 8px;
            text-decoration: none;
            z-index: 1000;
          }
          
          .skip-link:focus {
            top: 6px;
          }
        `
      }} />
    </AccessibilityContext.Provider>
  );
};

// ===========================================
// ACCESSIBLE COMPONENTS
// ===========================================

// Skip Navigation Link
export const SkipLink: React.FC = () => (
  <a 
    href="#main-content" 
    className="skip-link"
    onClick={(e) => {
      e.preventDefault();
      const mainContent = document.getElementById('main-content');
      if (mainContent) {
        mainContent.focus();
        mainContent.scrollIntoView();
      }
    }}
  >
    Sari la conținutul principal
  </a>
);

// Accessible Button
interface AccessibleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  loadingText?: string;
  ariaLabel?: string;
  ariaDescribedBy?: string;
}

export const AccessibleButton: React.FC<AccessibleButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  loadingText = 'Se încarcă...',
  ariaLabel,
  ariaDescribedBy,
  disabled,
  className = '',
  ...props
}) => {
  const { announceToScreenReader } = useAccessibility();

  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500'
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (props.onClick && !disabled && !isLoading) {
      announceToScreenReader('Buton apăsat');
      props.onClick(e);
    }
  };

  return (
    <button
      {...props}
      onClick={handleClick}
      disabled={disabled || isLoading}
      aria-label={ariaLabel || (typeof children === 'string' ? children : undefined)}
      aria-describedby={ariaDescribedBy}
      aria-busy={isLoading}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
    >
      {isLoading ? (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
          <span>{loadingText}</span>
          <span className="sr-only">Se încarcă</span>
        </>
      ) : (
        children
      )}
    </button>
  );
};

// Accessible Input Field
interface AccessibleInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  showLabel?: boolean;
}

export const AccessibleInput: React.FC<AccessibleInputProps> = ({
  label,
  error,
  hint,
  required = false,
  showLabel = true,
  id,
  className = '',
  ...props
}) => {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
  const errorId = error ? `${inputId}-error` : undefined;
  const hintId = hint ? `${inputId}-hint` : undefined;
  const describedBy = [errorId, hintId].filter(Boolean).join(' ') || undefined;

  return (
    <div className="space-y-1">
      <label 
        htmlFor={inputId}
        className={`block text-sm font-medium text-gray-700 ${!showLabel ? 'sr-only' : ''}`}
      >
        {label}
        {required && <span className="text-red-500 ml-1" aria-label="obligatoriu">*</span>}
      </label>
      
      {hint && (
        <p id={hintId} className="text-sm text-gray-500">
          {hint}
        </p>
      )}
      
      <input
        {...props}
        id={inputId}
        required={required}
        aria-required={required}
        aria-invalid={!!error}
        aria-describedby={describedBy}
        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors ${
          error ? 'border-red-300' : 'border-gray-300'
        } ${className}`}
      />
      
      {error && (
        <p id={errorId} className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};

// Accessible Modal
interface AccessibleModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const AccessibleModal: React.FC<AccessibleModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md'
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const { announceToScreenReader } = useAccessibility();

  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement;
      announceToScreenReader(`Modal deschis: ${title}`);
      
      // Focus pe primul element focusabil
      setTimeout(() => {
        const firstFocusable = modalRef.current?.querySelector(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        ) as HTMLElement;
        firstFocusable?.focus();
      }, 100);
      
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
    } else {
      // Restore focus
      previousFocusRef.current?.focus();
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, title, announceToScreenReader]);

  // Handle Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  // Focus trap
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Tab') {
      const focusableElements = modalRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      
      if (focusableElements && focusableElements.length > 0) {
        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    }
  };

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl'
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      onKeyDown={handleKeyDown}
    >
      <div
        ref={modalRef}
        className={`bg-white rounded-lg shadow-xl w-full ${sizeClasses[size]} max-h-[90vh] overflow-y-auto`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 id="modal-title" className="text-lg font-semibold text-gray-900">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100 transition-colors"
            aria-label="Închide modalul"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

// Accessibility Settings Panel
export const AccessibilitySettings: React.FC = () => {
  const { settings, updateSettings, resetSettings } = useAccessibility();
  const [isOpen, setIsOpen] = useState(false);

  const handleFontSizeChange = (direction: 'increase' | 'decrease') => {
    const newSize = direction === 'increase' 
      ? Math.min(settings.fontSize + 2, 24)
      : Math.max(settings.fontSize - 2, 12);
    updateSettings({ fontSize: newSize });
  };

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 z-40"
        aria-label="Deschide setările de accesibilitate"
        title="Setări accesibilitate"
      >
        <Settings className="h-6 w-6" />
      </button>

      {/* Settings Panel */}
      <AccessibleModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Setări Accesibilitate"
        size="md"
      >
        <div className="space-y-6">
          {/* Font Size */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Mărimea fontului</h3>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => handleFontSizeChange('decrease')}
                disabled={settings.fontSize <= 12}
                className="p-2 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Micșorează fontul"
              >
                <Minus className="h-4 w-4" />
              </button>
              
              <span className="text-lg font-medium min-w-[3rem] text-center">
                {settings.fontSize}px
              </span>
              
              <button
                onClick={() => handleFontSizeChange('increase')}
                disabled={settings.fontSize >= 24}
                className="p-2 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Mărește fontul"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Contrast */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Contrast</h3>
            <div className="space-y-2">
              {[
                { value: 'normal', label: 'Normal', icon: Eye },
                { value: 'high', label: 'Contrast mare', icon: Contrast },
                { value: 'dark', label: 'Mod întunecat', icon: EyeOff }
              ].map(({ value, label, icon: Icon }) => (
                <label key={value} className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="contrast"
                    value={value}
                    checked={settings.contrast === value}
                    onChange={(e) => updateSettings({ contrast: e.target.value as any })}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <Icon className="h-5 w-5 text-gray-600" />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Toggle Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Preferințe</h3>
            
            {[
              {
                key: 'animations' as keyof AccessibilitySettings,
                label: 'Animații și tranziții',
                description: 'Activează/dezactivează animațiile pentru o experiență mai liniștită'
              },
              {
                key: 'sounds' as keyof AccessibilitySettings,
                label: 'Sunete de sistem',
                description: 'Sunete pentru feedback auditiv'
              },
              {
                key: 'keyboardNavigation' as keyof AccessibilitySettings,
                label: 'Navigare cu tastatura',
                description: 'Îmbunătățește suportul pentru navigarea cu tastatura'
              },
              {
                key: 'focusVisible' as keyof AccessibilitySettings,
                label: 'Indicatori de focus vizibili',
                description: 'Arată contururi clare pentru elementele active'
              }
            ].map(({ key, label, description }) => (
              <div key={key} className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  id={key}
                  checked={settings[key] as boolean}
                  onChange={(e) => updateSettings({ [key]: e.target.checked })}
                  className="mt-1 text-blue-600 focus:ring-blue-500 rounded"
                />
                <div className="flex-1">
                  <label htmlFor={key} className="font-medium text-gray-900 cursor-pointer">
                    {label}
                  </label>
                  <p className="text-sm text-gray-600">{description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Reset Button */}
          <div className="border-t pt-4">
            <button
              onClick={resetSettings}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Resetează toate setările</span>
            </button>
          </div>
        </div>
      </AccessibleModal>
    </>
  );
};

// Keyboard Navigation Helper
export const KeyboardNavigationHelper: React.FC = () => {
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Show help with F1 or Ctrl+?
      if (e.key === 'F1' || (e.ctrlKey && e.key === '?')) {
        e.preventDefault();
        setShowHelp(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const shortcuts = [
    { keys: 'Tab', description: 'Navighează la următorul element' },
    { keys: 'Shift + Tab', description: 'Navighează la elementul anterior' },
    { keys: 'Enter / Space', description: 'Activează butonul sau link-ul selectat' },
    { keys: 'Escape', description: 'Închide modalurile sau meniurile' },
    { keys: 'Arrow Keys', description: 'Navighează în liste și meniuri' },
    { keys: 'F1', description: 'Afișează acest ajutor' },
    { keys: 'Alt + S', description: 'Salt la conținutul principal' }
  ];

  return (
    <AccessibleModal
      isOpen={showHelp}
      onClose={() => setShowHelp(false)}
      title="Scurtături de Tastatură"
      size="lg"
    >
      <div className="space-y-4">
        <p className="text-gray-600">
          Folosește aceste scurtături pentru a naviga mai eficient prin aplicație:
        </p>
        
        <div className="space-y-3">
          {shortcuts.map(({ keys, description }, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="font-mono text-sm bg-white px-2 py-1 rounded border">
                {keys}
              </span>
              <span className="text-sm text-gray-700 flex-1 ml-4">
                {description}
              </span>
            </div>
          ))}
        </div>
        
        <div className="border-t pt-4">
          <p className="text-sm text-gray-500">
            💡 <strong>Sfat:</strong> Folosește Tab pentru a naviga prin toate elementele interactive ale paginii.
          </p>
        </div>
      </div>
    </AccessibleModal>
  );
};

// ===========================================
// ACCESSIBILITY DEMO
// ===========================================

export const AccessibilityDemo: React.FC = () => {
  const [inputValue, setInputValue] = useState('');
  const [inputError, setInputError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const { announceToScreenReader } = useAccessibility();

  const handleSubmit = () => {
    if (!inputValue.trim()) {
      setInputError('Acest câmp este obligatoriu');
      announceToScreenReader('Eroare de validare: câmpul este obligatoriu');
    } else {
      setInputError('');
      announceToScreenReader('Formular trimis cu succes');
      setShowModal(true);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      {/* Skip Link */}
      <SkipLink />
      
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Sistem de Accesibilitate Demo
        </h1>
        <p className="text-gray-600">
          Testează funcționalitățile de accesibilitate implementate
        </p>
      </div>

      <div id="main-content" tabIndex={-1} className="space-y-8">
        {/* Accessible Form */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Formular Accesibil</h2>
          <div className="space-y-4">
            <AccessibleInput
              label="Nume complet"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              error={inputError}
              hint="Introdu prenumele și numele"
              required
              placeholder="ex: Ion Popescu"
            />
            
            <div className="flex space-x-4">
              <AccessibleButton onClick={handleSubmit}>
                Trimite Formularul
              </AccessibleButton>
              
              <AccessibleButton 
                variant="secondary"
                onClick={() => {
                  setInputValue('');
                  setInputError('');
                  announceToScreenReader('Formular resetat');
                }}
              >
                Resetează
              </AccessibleButton>
            </div>
          </div>
        </div>

        {/* Button Variations */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Variații de Butoane</h2>
          <div className="flex flex-wrap gap-4">
            <AccessibleButton variant="primary">
              Primar
            </AccessibleButton>
            
            <AccessibleButton variant="secondary">
              Secundar
            </AccessibleButton>
            
            <AccessibleButton variant="danger">
              Periculos
            </AccessibleButton>
            
            <AccessibleButton 
              variant="primary"
              isLoading={true}
              loadingText="Se procesează..."
            >
              În procesare
            </AccessibleButton>
            
            <AccessibleButton disabled>
              Dezactivat
            </AccessibleButton>
          </div>
        </div>

        {/* Keyboard Navigation Test */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Test Navigare cu Tastatura</h2>
          <p className="text-gray-600 mb-4">
            Folosește Tab pentru a naviga prin aceste elemente:
          </p>
          
          <div className="space-x-2 space-y-2">
            {Array.from({ length: 6 }, (_, i) => (
              <button
                key={i}
                className="px-4 py-2 bg-blue-100 text-blue-800 rounded hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                onClick={() => announceToScreenReader(`Buton ${i + 1} apăsat`)}
              >
                Buton {i + 1}
              </button>
            ))}
          </div>
          
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
            <p className="text-sm text-yellow-800">
              <Keyboard className="h-4 w-4 inline mr-1" />
              <strong>Sfat:</strong> Apasă Tab pentru a trece la următorul element, 
              Shift+Tab pentru elementul anterior.
            </p>
          </div>
        </div>

        {/* ARIA Live Region Demo */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Anunțuri pentru Screen Reader</h2>
          <div className="space-y-4">
            <div className="flex space-x-4">
              <button
                onClick={() => announceToScreenReader('Acesta este un mesaj informativ')}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                Anunț Informativ
              </button>
              
              <button
                onClick={() => announceToScreenReader('Atenție! Această acțiune este importantă!')}
                className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                Anunț de Atenționare
              </button>
            </div>
            
            <p className="text-sm text-gray-600">
              Aceste mesaje vor fi citite de screen reader-ele, dar nu sunt vizibile pentru utilizatorii cu vedere normală.
            </p>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      <AccessibleModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Succes!"
      >
        <div className="text-center">
          <Check className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <p className="text-gray-600">
            Formularul a fost trimis cu succes!
          </p>
          <AccessibleButton 
            onClick={() => setShowModal(false)}
            className="mt-4"
          >
            OK
          </AccessibleButton>
        </div>
      </AccessibleModal>

      {/* Keyboard Helper */}
      <KeyboardNavigationHelper />
      
      {/* Accessibility Settings Panel */}
      <AccessibilitySettings />

      {/* Implementation Guide */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-blue-900 mb-4">
          💡 Implementare în aplicația ta
        </h2>
        <div className="space-y-3 text-blue-800 text-sm">
          <p><strong>1. Înfășoară aplicația:</strong> Adaugă <code>&lt;AccessibilityProvider&gt;</code> în App.tsx</p>
          <p><strong>2. Skip links:</strong> Pune <code>&lt;SkipLink /&gt;</code> la începutul fiecărei pagini</p>
          <p><strong>3. Înlocuiește componentele:</strong> Folosește <code>AccessibleButton</code> și <code>AccessibleInput</code></p>
          <p><strong>4. Modale:</strong> Folosește <code>&lt;AccessibleModal&gt;</code> pentru pop-up-uri</p>
          <p><strong>5. Setări:</strong> Adaugă <code>&lt;AccessibilitySettings /&gt;</code> în layout</p>
        </div>
      </div>
    </div>
  );
};
