// src/components/common/LanguageSystem.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Globe } from 'lucide-react';

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
    'nav.admin.dashboard.description': 'Management fonduri arhivistice cu assignment manual și auto-reassignment',
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
    'action.retry': 'Încearcă din nou',

    // Common Terms
    'common.active': 'Activ',
    'common.inactive': 'Inactiv',
    'common.read_only': 'Read-Only',
    'common.view_only': 'Doar vizualizare',

    // Navigation
    'nav.search': 'Căutare',
    'nav.users': 'Utilizatori',
    'nav.dashboard': 'Dashboard',
    'nav.dashboard.description': 'Vizualizare fonduri',

    // Admin Dashboard
    'admin.loading.dashboard': 'Se încarcă dashboard-ul...',
    'admin.notice.audit_access_title': 'Acces Audit (Read-Only)',
    'admin.notice.audit_access_description': 'Poți vizualiza toate fondurile și exporta date, dar nu poți face modificări.',
    'admin.notice.assignment_title': 'Owner Assignment & Auto-Reassignment',
    'admin.notice.assignment_description': 'Poți assigna manual fonduri către clienți și sistemul detectează automat necesitatea de reassignment.',
    'admin.auto_assignment_exact_matches': 'Auto-assignment pentru match-uri exacte',
    'admin.check_all': 'Verifică Toate',

    // Stats
    'admin.stats.total_fonds': 'Total Fonduri',
    'admin.stats.active_fonds': 'Fonduri Active',
    'admin.stats.assigned': 'Assignate',
    'admin.stats.unassigned': 'Neasignate',
    'admin.stats.click_to_add': 'Click pentru adăugare',
    'admin.stats.visible_public': 'Vizibile public',
    'admin.stats.have_owner': 'Au owner',
    'admin.stats.no_owner': 'Fără owner',
    'admin.stats.manage': 'Gestionează',
    'admin.stats.click_to_manage': 'Click pentru management',
    'admin.stats.click_to_view': 'Click pentru vizualizare',

    // Search & Filters
    'admin.search.placeholder': 'Caută fonduri...',
    'admin.filters.show_inactive': 'Arată inactive',
    'admin.filters.owner': 'Owner',
    'admin.filters.all': 'Toate',
    'admin.filters.assigned': 'Assignate',
    'admin.filters.unassigned': 'Neasignate',
    'admin.filters.of': 'din',
    'admin.filters.fonds': 'fonduri',

    // Table Headers
    'admin.table.company': 'Companie',
    'admin.table.archive_holder': 'Deținător Arhivă',
    'admin.table.contact': 'Contact',
    'admin.table.status_owner': 'Status / Owner',
    'admin.table.actions': 'Acțiuni',
    'admin.table.no_fonds_found': 'Niciun fond găsit',
    'admin.table.try_modify_filters': 'Încearcă să modifici filtrele',
    'admin.table.loading_fonds': 'Fondurile se încarcă...',
    'admin.table.unassigned': 'Neasignat',
    'admin.table.unassigned_option': '-- Neasignat --',
    'admin.table.assign_to': '-- Assignează către --',

    // Actions
    'admin.actions.add_fond': 'Adaugă Fond',
    'admin.actions.edit': 'Editează',
    'admin.actions.delete': 'Șterge',
    'admin.actions.edit_fond': 'editarea fondului',

    // Pagination
    'admin.pagination.showing': 'Afișând',
    'admin.pagination.of': 'din',
    'admin.pagination.fonds': 'fonduri',
    'admin.pagination.filtered_by': 'Filtrate după',
    'admin.pagination.owner': 'Owner',
    'admin.pagination.unknown': 'Necunoscut',

    // Error Messages
    'admin.error.loading_fonds': 'Eroare la încărcarea fondurilor',
    'admin.error.loading_fonds_generic': 'Eroare la încărcarea fondurilor',
    'admin.error.no_create_permission': 'Nu ai permisiuni pentru a crea fonduri',
    'admin.error.no_edit_permission': 'Nu ai permisiuni pentru a modifica fonduri',
    'admin.error.no_delete_permission': 'Nu ai permisiuni pentru a șterge fonduri',
    'admin.error.no_assignment_permission': 'Nu ai permisiuni pentru a modifica assignment-urile',
    'admin.error.no_permission_prefix': 'Nu ai permisiuni pentru a',
    'admin.error.read_only_access': 'Contul tău are acces doar în modul vizualizare',
    'admin.error.creating_fond': 'Eroare la crearea fondului',
    'admin.error.creating_fond_generic': 'Eroare la crearea fondului',
    'admin.error.updating_fond': 'Eroare la actualizarea fondului',
    'admin.error.updating_fond_generic': 'Eroare la actualizarea fondului',
    'admin.error.deleting_fond': 'Eroare la ștergerea fondului',
    'admin.error.deleting_fond_generic': 'Eroare la ștergerea fondului',
    'admin.error.updating_assignment': 'Eroare la actualizarea assignment-ului',
    'admin.error.updating_assignment_generic': 'Eroare la actualizarea assignment-ului',
    'admin.error.confirming_reassignment': 'Eroare la confirmarea reassignment-ului',
    'admin.error.confirming_reassignment_generic': 'Eroare la confirmarea reassignment-ului',
    'admin.error.bulk_check_reassignments': 'Eroare la verificarea reassignment-urilor în masă',
    'admin.error.bulk_check_reassignments_generic': 'Eroare la verificarea reassignment-urilor',

    // Success Messages
    'admin.success.fond_created': 'Fondul a fost creat cu succes',
    'admin.success.fond_updated': 'Fondul a fost actualizat cu succes',
    'admin.success.fond_deleted': 'Fondul a fost șters cu succes',
    'admin.success.assigned_to': 'Assignat către',
    'admin.success.assignment_removed': 'Assignment eliminat',
    'admin.success.auto_reassignment_applied': 'Reassignment automat aplicat',
    'admin.success.fond_assigned_to': 'Fond assignat către',
    'admin.success.bulk_check_complete': 'Verificare completă',
    'admin.success.fonds_need_manual_reassignment': 'fonduri au nevoie de reassignment manual',
    'admin.success.automatic_reassignments_applied': 'reassignment-uri automate aplicate',

    // Confirmations
    'admin.confirm.delete_fond': 'Ești sigur că vrei să ștergi fondul',

    // Misc
    'admin.unknown_user': 'utilizator necunoscut'
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
    'nav.admin.dashboard.description': 'Archival funds management with manual assignment and auto-reassignment',
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
    'action.retry': 'Try again',

    // Common Terms
    'common.active': 'Active',
    'common.inactive': 'Inactive',
    'common.read_only': 'Read-Only',
    'common.view_only': 'View only',

    // Navigation
    'nav.search': 'Search',
    'nav.users': 'Users',
    'nav.dashboard': 'Dashboard',
    'nav.dashboard.description': 'View funds',

    // Admin Dashboard
    'admin.loading.dashboard': 'Loading dashboard...',
    'admin.notice.audit_access_title': 'Audit Access (Read-Only)',
    'admin.notice.audit_access_description': 'You can view all funds and export data, but cannot make changes.',
    'admin.notice.assignment_title': 'Owner Assignment & Auto-Reassignment',
    'admin.notice.assignment_description': 'You can manually assign funds to clients and the system automatically detects reassignment needs.',
    'admin.auto_assignment_exact_matches': 'Auto-assignment for exact matches',
    'admin.check_all': 'Check All',

    // Stats
    'admin.stats.total_fonds': 'Total Funds',
    'admin.stats.active_fonds': 'Active Funds',
    'admin.stats.assigned': 'Assigned',
    'admin.stats.unassigned': 'Unassigned',
    'admin.stats.click_to_add': 'Click to add',
    'admin.stats.visible_public': 'Publicly visible',
    'admin.stats.have_owner': 'Have owner',
    'admin.stats.no_owner': 'No owner',
    'admin.stats.manage': 'Manage',
    'admin.stats.click_to_manage': 'Click to manage',
    'admin.stats.click_to_view': 'Click to view',

    // Search & Filters
    'admin.search.placeholder': 'Search funds...',
    'admin.filters.show_inactive': 'Show inactive',
    'admin.filters.owner': 'Owner',
    'admin.filters.all': 'All',
    'admin.filters.assigned': 'Assigned',
    'admin.filters.unassigned': 'Unassigned',
    'admin.filters.of': 'of',
    'admin.filters.fonds': 'funds',

    // Table Headers
    'admin.table.company': 'Company',
    'admin.table.archive_holder': 'Archive Holder',
    'admin.table.contact': 'Contact',
    'admin.table.status_owner': 'Status / Owner',
    'admin.table.actions': 'Actions',
    'admin.table.no_fonds_found': 'No funds found',
    'admin.table.try_modify_filters': 'Try modifying filters',
    'admin.table.loading_fonds': 'Loading funds...',
    'admin.table.unassigned': 'Unassigned',
    'admin.table.unassigned_option': '-- Unassigned --',
    'admin.table.assign_to': '-- Assign to --',

    // Actions
    'admin.actions.add_fond': 'Add Fund',
    'admin.actions.edit': 'Edit',
    'admin.actions.delete': 'Delete',
    'admin.actions.edit_fond': 'edit fund',

    // Pagination
    'admin.pagination.showing': 'Showing',
    'admin.pagination.of': 'of',
    'admin.pagination.fonds': 'funds',
    'admin.pagination.filtered_by': 'Filtered by',
    'admin.pagination.owner': 'Owner',
    'admin.pagination.unknown': 'Unknown',

    // Error Messages
    'admin.error.loading_fonds': 'Error loading funds',
    'admin.error.loading_fonds_generic': 'Error loading funds',
    'admin.error.no_create_permission': 'You don\'t have permission to create funds',
    'admin.error.no_edit_permission': 'You don\'t have permission to edit funds',
    'admin.error.no_delete_permission': 'You don\'t have permission to delete funds',
    'admin.error.no_assignment_permission': 'You don\'t have permission to modify assignments',
    'admin.error.no_permission_prefix': 'You don\'t have permission to',
    'admin.error.read_only_access': 'Your account has read-only access',
    'admin.error.creating_fond': 'Error creating fund',
    'admin.error.creating_fond_generic': 'Error creating fund',
    'admin.error.updating_fond': 'Error updating fund',
    'admin.error.updating_fond_generic': 'Error updating fund',
    'admin.error.deleting_fond': 'Error deleting fund',
    'admin.error.deleting_fond_generic': 'Error deleting fund',
    'admin.error.updating_assignment': 'Error updating assignment',
    'admin.error.updating_assignment_generic': 'Error updating assignment',
    'admin.error.confirming_reassignment': 'Error confirming reassignment',
    'admin.error.confirming_reassignment_generic': 'Error confirming reassignment',
    'admin.error.bulk_check_reassignments': 'Error checking bulk reassignments',
    'admin.error.bulk_check_reassignments_generic': 'Error checking reassignments',

    // Success Messages
    'admin.success.fond_created': 'Fund created successfully',
    'admin.success.fond_updated': 'Fund updated successfully',
    'admin.success.fond_deleted': 'Fund deleted successfully',
    'admin.success.assigned_to': 'Assigned to',
    'admin.success.assignment_removed': 'Assignment removed',
    'admin.success.auto_reassignment_applied': 'Auto-reassignment applied',
    'admin.success.fond_assigned_to': 'Fund assigned to',
    'admin.success.bulk_check_complete': 'Check complete',
    'admin.success.fonds_need_manual_reassignment': 'funds need manual reassignment',
    'admin.success.automatic_reassignments_applied': 'automatic reassignments applied',

    // Confirmations
    'admin.confirm.delete_fond': 'Are you sure you want to delete the fund',

    // Misc
    'admin.unknown_user': 'unknown user'
  }
};

export default LanguageProvider;
