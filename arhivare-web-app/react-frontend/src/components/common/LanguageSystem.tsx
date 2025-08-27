// src/components/common/LanguageSystem.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Globe, Languages } from 'lucide-react';

// Supported languages
export type SupportedLanguage = 'ro' | 'en';

interface LanguageContextType {
  currentLanguage: SupportedLanguage;
  changeLanguage: (language: SupportedLanguage) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Language toggle component
interface LanguageToggleProps {
  size?: 'sm' | 'md' | 'lg';
}

export const LanguageToggle: React.FC<LanguageToggleProps> = ({ size = 'md' }) => {
  const { currentLanguage, changeLanguage } = useLanguage();
  
  const sizeClasses = {
    sm: 'h-8 w-8 text-sm',
    md: 'h-10 w-10 text-base',
    lg: 'h-12 w-12 text-lg'
  };

  const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  };

  const handleToggle = () => {
    changeLanguage(currentLanguage === 'ro' ? 'en' : 'ro');
  };

  return (
    <button
      onClick={handleToggle}
      className={`
        ${sizeClasses[size]}
        flex items-center justify-center
        bg-white dark:bg-gray-800 
        border-2 border-gray-200 dark:border-gray-600
        rounded-lg 
        hover:bg-gray-50 dark:hover:bg-gray-700 
        hover:border-blue-300 dark:hover:border-blue-500
        transition-all duration-200
        group
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900
      `}
      title={currentLanguage === 'ro' ? 'Switch to English' : 'Comută la română'}
    >
      <div className="flex items-center space-x-1">
        <Globe className={`${iconSizes[size]} text-gray-600 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400`} />
        <span className="font-semibold text-gray-700 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 uppercase">
          {currentLanguage === 'ro' ? 'EN' : 'RO'}
        </span>
      </div>
    </button>
  );
};

// Language provider component
interface LanguageProviderProps {
  children: React.ReactNode;
  defaultLanguage?: SupportedLanguage;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ 
  children, 
  defaultLanguage = 'ro' 
}) => {
  const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguage>(() => {
    // Check localStorage first
    const savedLanguage = localStorage.getItem('preferred-language') as SupportedLanguage;
    if (savedLanguage && ['ro', 'en'].includes(savedLanguage)) {
      return savedLanguage;
    }
    
    // Check browser language preference
    const browserLanguage = navigator.language.toLowerCase();
    if (browserLanguage.startsWith('ro')) {
      return 'ro';
    } else if (browserLanguage.startsWith('en')) {
      return 'en';
    }
    
    return defaultLanguage;
  });

  const changeLanguage = (language: SupportedLanguage) => {
    setCurrentLanguage(language);
    localStorage.setItem('preferred-language', language);
    
    // Update document language attribute
    document.documentElement.lang = language;
    
    // Debug logging in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`🌍 Language changed to: ${language}`);
    }
  };

  const t = (key: string): string => {
    return translations[currentLanguage][key] || key;
  };

  // Set initial document language
  useEffect(() => {
    document.documentElement.lang = currentLanguage;
  }, [currentLanguage]);

  const contextValue: LanguageContextType = {
    currentLanguage,
    changeLanguage,
    t
  };

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
};

// Hook to use language context
export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

// Translations object
const translations: Record<SupportedLanguage, Record<string, string>> = {
  ro: {
    // Header & Navigation
    'app.title': 'Arhivare Web App',
    'app.subtitle': 'Căutare fonduri arhivistice româneşti',
    'auth.login': 'Conectare',
    'auth.logout': 'Deconectare',
    'auth.logout.description': 'Închide sesiunea',
    'nav.hello': 'Bună',
    'nav.admin.dashboard': 'Dashboard Admin',
    'nav.admin.dashboard.description': 'Management fonduri arhivistice',
    'nav.audit.dashboard': 'Dashboard Audit',
    'nav.audit.dashboard.description': 'Monitorizare și rapoarte (read-only)',
    'nav.client.dashboard': 'Zona Client',
    'nav.client.my-fonds': 'Fondurile Mele',
    'nav.client.my-fonds.description': 'Gestionează fondurile tale arhivistice',
    'nav.users.management': 'Management Utilizatori',
    'nav.users.management.description': 'Gestionează conturile utilizatorilor',
    'nav.users.view': 'Vizualizare Utilizatori',
    'nav.users.view.description': 'Vezi lista utilizatorilor (read-only)',
    'nav.profile': 'Profil',
    'nav.profile.description': 'Setări cont și parolă',
    'nav.my.profile': 'Profilul Meu',
    'nav.my.profile.description': 'Actualizează datele companiei și parola',
    'nav.menu': 'Meniu',

    // Homepage - Main Content
    'homepage.title': 'Găsește arhiva companiei tale',
    'homepage.subtitle': 'Căută în baza noastră de date pentru a găsi informațiile de contact ale instituției responsabile care deține arhiva unei companii româneşti.',
    'search.placeholder': 'Ex: Tractorul Brașov, Steagul Roșu...',
    'search.button': 'Caută',
    'search.button.loading': 'Caută...',
    'search.suggestions': 'Sugestii:',
    
    // Search Results
    'results.showing': 'Afișând rezultatele',
    'results.of': 'din',
    'results.for': 'pentru',
    'results.found.singular': '1 rezultat găsit',
    'results.found.plural': 'rezultate găsite',
    'results.none.title': 'Niciun rezultat găsit',
    'results.none.message': 'Nu am găsit nicio companie care să corespundă cu căutarea',
    'results.none.suggestions': 'Sugestii:',
    'results.none.suggestions.list': '• Verifică ortografia\n• Încearcă termeni mai generali\n• Caută doar numele companiei',
    'results.holder': 'Deținător arhivă',
    'results.searching': 'Se caută în baza de date...',

    // Pagination
    'pagination.previous': 'Anterior',
    'pagination.next': 'Următor',

    // Footer
    'footer.copyright': '© 2025 Arhivare Web App - Tony Gheorghe',
    'footer.description': 'Aplicație pentru căutarea fondurilor arhivistice româneşti',

    // Error Messages
    'error.search.min_length': 'Căutarea trebuie să conțină cel puțin 2 caractere',
    'error.search.failed': 'Eroare de căutare:',
    'error.search.generic': 'A apărut o eroare la căutare',
    'error.network': 'Eroare de rețea. Verifică conexiunea.',
    'error.server': 'Eroare de server. Încearcă din nou.',
    
    // Loading States
    'loading.search': 'Se caută...',
    'loading.general': 'Se încarcă...',

    // Common Actions
    'action.cancel': 'Anulează',
    'action.save': 'Salvează',
    'action.edit': 'Editează',
    'action.delete': 'Șterge',
    'action.add': 'Adaugă',
    'action.create': 'Creează',
    'action.update': 'Actualizează',
    'action.close': 'Închide',
    'action.back': 'Înapoi',
    'action.continue': 'Continuă',
    'action.confirm': 'Confirmă',
    'action.retry': 'Încearcă din nou'
  },
  
  en: {
    // Header & Navigation
    'app.title': 'Archive Web App',
    'app.subtitle': 'Search Romanian archival funds',
    'auth.login': 'Login',
    'auth.logout': 'Logout',
    'auth.logout.description': 'End session',
    'nav.hello': 'Hello',
    'nav.admin.dashboard': 'Admin Dashboard',
    'nav.admin.dashboard.description': 'Archival funds management',
    'nav.audit.dashboard': 'Audit Dashboard',
    'nav.audit.dashboard.description': 'Monitoring and reports (read-only)',
    'nav.client.dashboard': 'Client Area',
    'nav.client.my-fonds': 'My Funds',
    'nav.client.my-fonds.description': 'Manage your archival funds',
    'nav.users.management': 'User Management',
    'nav.users.management.description': 'Manage user accounts',
    'nav.users.view': 'View Users',
    'nav.users.view.description': 'View users list (read-only)',
    'nav.profile': 'Profile',
    'nav.profile.description': 'Account and password settings',
    'nav.my.profile': 'My Profile',
    'nav.my.profile.description': 'Update company data and password',
    'nav.menu': 'Menu',

    // Homepage - Main Content
    'homepage.title': 'Find your company\'s archive',
    'homepage.subtitle': 'Search our database to find the contact information of the responsible institution that holds a Romanian company\'s archive.',
    'search.placeholder': 'Ex: Tractorul Brasov, Steagul Rosu...',
    'search.button': 'Search',
    'search.button.loading': 'Searching...',
    'search.suggestions': 'Suggestions:',
    
    // Search Results
    'results.showing': 'Showing results',
    'results.of': 'of',
    'results.for': 'for',
    'results.found.singular': '1 result found',
    'results.found.plural': 'results found',
    'results.none.title': 'No results found',
    'results.none.message': 'We couldn\'t find any company matching your search for',
    'results.none.suggestions': 'Suggestions:',
    'results.none.suggestions.list': '• Check spelling\n• Try more general terms\n• Search only company name',
    'results.holder': 'Archive holder',
    'results.searching': 'Searching database...',

    // Pagination
    'pagination.previous': 'Previous',
    'pagination.next': 'Next',

    // Footer
    'footer.copyright': '© 2025 Archive Web App - Tony Gheorghe',
    'footer.description': 'Application for searching Romanian archival funds',

    // Error Messages
    'error.search.min_length': 'Search must contain at least 2 characters',
    'error.search.failed': 'Search error:',
    'error.search.generic': 'An error occurred during search',
    'error.network': 'Network error. Check your connection.',
    'error.server': 'Server error. Please try again.',
    
    // Loading States
    'loading.search': 'Searching...',
    'loading.general': 'Loading...',

    // Common Actions
    'action.cancel': 'Cancel',
    'action.save': 'Save',
    'action.edit': 'Edit',
    'action.delete': 'Delete',
    'action.add': 'Add',
    'action.create': 'Create',
    'action.update': 'Update',
    'action.close': 'Close',
    'action.back': 'Back',
    'action.continue': 'Continue',
    'action.confirm': 'Confirm',
    'action.retry': 'Try again'
  }
};

export default LanguageProvider;
