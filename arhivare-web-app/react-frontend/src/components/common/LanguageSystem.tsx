// src/components/common/LanguageSystem.tsx - COMPLETE i18n IMPLEMENTATION
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Globe } from 'lucide-react';

// ===========================================
// TYPES & INTERFACES
// ===========================================

export type SupportedLanguage = 'ro' | 'en';

interface LanguageContextType {
  currentLanguage: SupportedLanguage;
  changeLanguage: (language: SupportedLanguage) => void;
  t: (key: string, params?: Record<string, string>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// ===========================================
// LANGUAGE TOGGLE COMPONENT - ENHANCED
// ===========================================

interface LanguageToggleProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showLabel?: boolean;
}

export const LanguageToggle: React.FC<LanguageToggleProps> = ({ 
  size = 'md', 
  className = '',
  showLabel = false 
}) => {
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

  const getLanguageLabel = () => {
    return currentLanguage === 'ro' ? 'Română' : 'English';
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
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
      
      {showLabel && (
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {getLanguageLabel()}
        </span>
      )}
    </div>
  );
};

// ===========================================
// LANGUAGE PROVIDER COMPONENT - ENHANCED
// ===========================================

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

  // Translation function with parameter support
  const t = (key: string, params?: Record<string, string>): string => {
    let translation = translations[currentLanguage][key] || key;
    
    // Replace parameters if provided
    if (params) {
      Object.entries(params).forEach(([paramKey, paramValue]) => {
        translation = translation.replace(`{{${paramKey}}}`, paramValue);
      });
    }
    
    return translation;
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

//Translations object
const translations: Record<SupportedLanguage, Record<string, string>> = {
  ro: {

     // Header & Navigation
    'app.title': 'Arhivare Web App',
    'app.subtitle': 'Căutare fonduri arhivistice româneşti',
    'auth.login': 'Conectare',
    'auth.logout': 'Deconectare',
    'auth.logout.description': 'Închide sesiunea',
    'auth.back.search': 'Înapoi la căutare',
    'auth.title': 'Autentificare',
    'auth.description': 'Introdu datele de autentificare pentru a accesa zona de administrare',
    'auth.demo.accounts': 'Conturi demo disponibile',
    'auth.demo.admin': 'Admin (full access)',
    'auth.demo.audit': 'Audit (read-only)',
    'auth.demo.client': 'Client (manage own funds)',
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
    'admin.unknown_user': 'utilizator necunoscut',

    // Audit Dashboard
    'audit.loading.dashboard': 'Se încarcă dashboard-ul audit...',
    'audit.role_display': 'Audit (Read-Only)',
    'audit.role_name': 'Audit',
    'audit.actions.refresh': 'Refresh',
    'audit.actions.export': 'Export',
    'audit.actions.export_data': 'Export Date',
    'audit.actions.refresh_data': 'Refresh Date',
    
    // Audit Stats
    'audit.stats.total_fonds': 'Total Fonduri',
    'audit.stats.assigned_fonds': 'Fonduri Assignate',
    'audit.stats.unassigned_fonds': 'Fonduri Neasignate',
    'audit.stats.active_clients': 'Clienți Activi',
    'audit.stats.of_total': 'din total',
    'audit.stats.available_for_assignment': 'Disponibile pentru assignment',
    'audit.stats.with_assigned_fonds': 'Cu fonduri assignate',
    
    // Recent Assignments
    'audit.recent_assignments.title': 'Assignment-uri Recente',
    'audit.recent_assignments.none': 'Nu există assignment-uri recente',
    'audit.period.last_day': 'Ultima zi',
    'audit.period.last_week': 'Ultima săptămână',
    'audit.period.last_month': 'Ultima lună',
    
    // Client Distribution
    'audit.client_distribution.title': 'Distribuția pe Clienți',
    'audit.client_distribution.none': 'Nu există clienți cu fonduri assignate',
    'audit.client_distribution.fond': 'fond',
    'audit.client_distribution.fonds': 'fonduri',
    
    // Table
    'audit.table.all_fonds': 'Toate Fondurile',
    'audit.table.company': 'Companie',
    'audit.table.archive_holder': 'Deținător Arhivă',
    'audit.table.status_owner': 'Status / Owner',
    'audit.table.contact': 'Contact',
    'audit.table.last_update': 'Ultima Actualizare',
    'audit.table.actions': 'Acțiuni',
    'audit.table.no_fonds_found': 'Niciun fond găsit',
    'audit.table.try_modify_search': 'Încearcă să modifici căutarea',
    'audit.table.loading_fonds': 'Fondurile se încarcă...',
    'audit.table.assigned': 'Assignat',
    'audit.table.unassigned': 'Neasignat',
    'audit.table.view_read_only': 'Vizualizează (Read-Only)',
    
    // Search & Filters
    'audit.search.placeholder': 'Caută fonduri...',
    'audit.filters.show_inactive': 'Arată inactive',
    
    // Summary
    'audit.summary.audit_access': 'Acces Audit',
    'audit.summary.quick_actions': 'Acțiuni Rapide',
    'audit.summary.system_info': 'Informații Sistem',
    'audit.summary.view_all_fonds': 'Vizualizare toate fondurile',
    'audit.summary.export_data_stats': 'Export date și statistici',
    'audit.summary.reports_analytics': 'Rapoarte și analize',
    'audit.summary.no_modifications': 'Fără modificări (Read-Only)',
    'audit.summary.role': 'Rol',
    'audit.summary.user': 'Utilizator',
    'audit.summary.visible_fonds': 'Fonduri vizibile',
    'audit.summary.last_update': 'Ultima actualizare',
    
    // Error Messages
    'audit.error.failed_to_load_data': 'Eșec la încărcarea datelor',
    'audit.error.loading_data': 'Eroare la încărcarea datelor',
    'audit.error.export_failed': 'Export eșuat',
    'audit.error.failed_to_export_data': 'Eșec la exportarea datelor',

    // Client Dashboard
    'client.loading.fonds': 'Se încarcă fondurile tale...',
    'client.role_name': 'Client',
    'client.header.description': 'Management fonduri assignate',
    
    // Client Stats
    'client.stats.total_fonds': 'Fonduri Totale',
    'client.stats.inactive_fonds': 'Fonduri Inactive',
    'client.stats.data_completion': 'Completare Date',
    'client.stats.click_to_add': 'Click pentru adăugare',
    'client.stats.not_public_visible': 'Nu sunt vizibile public',
    'client.stats.completion_rate': 'Rate de completare',
    
    // Client Info
    'client.info.title': 'Informații Client',
    'client.info.username': 'Nume utilizator',
    'client.info.role': 'Rol',
    'client.info.last_update': 'Ultima actualizare',
    
    // Client Actions
    'client.actions.add_fond': 'Adaugă Fond',
    'client.actions.edit': 'Editează',
    'client.actions.delete': 'Șterge',
    
    // Client Search & Filters
    'client.search.placeholder': 'Caută în fondurile tale...',
    'client.filters.show_inactive': 'Arată inactive',
    
    // Client Table
    'client.table.your_fonds': 'Fondurile Tale',
    'client.table.company': 'Companie',
    'client.table.archive_holder': 'Deținător Arhivă',
    'client.table.contact': 'Contact',
    'client.table.status': 'Status',
    'client.table.actions': 'Acțiuni',
    'client.table.no_fonds_assigned': 'Nu ai încă fonduri assignate',
    'client.table.no_fonds_found': 'Niciun fond găsit',
    'client.table.contact_admin_or_add': 'Contactează administratorul pentru a-ți fi assignate fonduri sau adaugă unul nou.',
    'client.table.try_modify_search': 'Încearcă să modifici căutarea',
    'client.table.loading_fonds': 'Fondurile se încarcă...',
    'client.table.add_first_fond': 'Adaugă primul fond',
    
    // Client Help
    'client.help.available_actions': 'Acțiuni Disponibile',
    'client.help.completion_tips': 'Sfaturi pentru Completare',
    'client.help.view_edit_own_fonds': 'Vizualizare și editare fonduri proprii',
    'client.help.add_new_fonds': 'Adăugare fonduri noi',
    'client.help.delete_own_fonds': 'Ștergere fonduri (proprii)',
    'client.help.search_public_fonds': 'Căutare în fondurile publice',
    'client.help.company_name': 'Numele companiei',
    'client.help.company_name_tip': 'Folosește denumirea oficială',
    'client.help.archive_holder': 'Deținător arhivă',
    'client.help.archive_holder_tip': 'Instituția care păstrează documentele',
    'client.help.contact': 'Contact',
    'client.help.contact_tip': 'Adaugă email și telefon pentru ușurință în comunicare',
    'client.help.address': 'Adresa',
    'client.help.address_tip': 'Adresa completă ajută la localizare',
    'client.help.notes': 'Note',
    'client.help.notes_tip': 'Informații suplimentare despre fond',
    
    // Client Pagination
    'client.pagination.showing': 'Afișând',
    'client.pagination.of': 'din',
    'client.pagination.fonds': 'fonduri',
    'client.pagination.filtered_by': 'Filtrate după',
    
    // Client Error Messages
    'client.error.failed_to_load_data': 'Eșec la încărcarea datelor',
    'client.error.loading_fonds': 'Eroare la încărcarea fondurilor',
    'client.error.creating_fond': 'Eroare la crearea fondului',
    'client.error.creating_fond_generic': 'Eroare la crearea fondului',
    'client.error.updating_fond': 'Eroare la actualizarea fondului',
    'client.error.updating_fond_generic': 'Eroare la actualizarea fondului',
    'client.error.deleting_fond': 'Eroare la ștergerea fondului',
    'client.error.deleting_fond_generic': 'Eroare la ștergerea fondului',
    
    // Client Success Messages
    'client.success.fond_created': 'Fondul a fost creat cu succes',
    'client.success.fond_updated': 'Fondul a fost actualizat cu succes',
    'client.success.fond_deleted': 'Fondul a fost șters cu succes',
    
    // Client Confirmations
    'client.confirm.delete_fond': 'Ești sigur că vrei să ștergi fondul',

    // ========== COMMON TERMS ==========
    'common.loading': 'Se încarcă...',
    'common.error': 'Eroare',
    'common.success': 'Succes',
    'common.cancel': 'Anulează',
    'common.save': 'Salvează',
    'common.edit': 'Editează',
    'common.delete': 'Șterge',
    'common.add': 'Adaugă',
    'common.create': 'Creează',
    'common.update': 'Actualizează',
    'common.close': 'Închide',
    'common.back': 'Înapoi',
    'common.continue': 'Continuă',
    'common.confirm': 'Confirmă',
    'common.retry': 'Încearcă din nou',
    'common.yes': 'Da',
    'common.no': 'Nu',
    'common.optional': 'Opțional',
    'common.required': 'Obligatoriu',
    'common.search': 'Caută',
    'common.filter': 'Filtrează',
    'common.sort': 'Sortează',
    'common.export': 'Export',
    'common.import': 'Import',
    'common.refresh': 'Reîmprospătează',

    // ========== APP HEADER & NAVIGATION ==========
    'nav.home': 'Acasă',
    'nav.settings': 'Setări',
    'nav.help': 'Ajutor',
    'nav.logout': 'Deconectare',
    
    // ========== AUTHENTICATION ==========
    'auth.username': 'Nume utilizator',
    'auth.password': 'Parolă',
    'auth.login.button': 'Conectează-te',
    'auth.login.loading': 'Se conectează...',
    'auth.login.failed': 'Conectarea a eșuat',
    'auth.login.invalid': 'Nume utilizator sau parolă incorectă',
    'auth.required': 'Trebuie să te autentifici pentru a accesa această pagină',
    'auth.session.expired': 'Sesiunea a expirat. Te rugăm să te reconectezi.',
    
    // ========== HOMEPAGE & SEARCH ==========
    'search.min.length': 'Căutarea trebuie să conțină cel puțin 2 caractere',
    'search.no.results': 'Niciun rezultat găsit',
    'search.results.count': '{{count}} rezultate găsite',
    'search.error': 'Eroare la căutare: {{error}}',
    
    // ========== FOND MANAGEMENT ==========
    'fond.title': 'Fond Arhivistic',
    'fond.company.name': 'Numele companiei',
    'fond.company.name.placeholder': 'ex: Tractorul Brașov SA',
    'fond.holder.name': 'Deținător arhivă',
    'fond.holder.name.placeholder': 'ex: Arhiva Națională Brașov',
    'fond.address': 'Adresă',
    'fond.address.placeholder': 'ex: Str. Industriei 15, Brașov, 500269',
    'fond.email': 'Email',
    'fond.email.placeholder': 'contact@arhiva.ro',
    'fond.phone': 'Telefon',
    'fond.phone.placeholder': '+40 268 123 456',
    'fond.notes': 'Note',
    'fond.notes.placeholder': 'Informații suplimentare despre fond...',
    'fond.source.url': 'URL sursă',
    'fond.source.url.placeholder': 'https://arhiva.ro/fonduri/tractorul',
    'fond.status.active': 'Fond activ (vizibil în căutarea publică)',
    'fond.owner.assignment': 'Assignment Proprietar',
    'fond.owner.assign.to': 'Assignează către client',
    'fond.owner.unassigned': '-- Neasignat --',
    'fond.owner.selected': 'Selectat: {{username}}',
    'fond.owner.info': 'Fondul va fi vizibil și editabil doar de utilizatorul selectat',

    // Form modes
    'fond.form.create': 'Fond Nou',
    'fond.form.edit': 'Editare Fond',
    'fond.form.create.button': 'Creează',
    'fond.form.update.button': 'Actualizează',
    'fond.form.saving': 'Se salvează...',

    // Validation messages
    'fond.validation.company.required': 'Numele companiei este obligatoriu',
    'fond.validation.company.min': 'Numele trebuie să aibă cel puțin 2 caractere',
    'fond.validation.company.max': 'Numele poate avea maxim 255 caractere',
    'fond.validation.company.duplicate': 'Această companie poate să existe deja în baza de date',
    'fond.validation.holder.required': 'Deținătorul arhivei este obligatoriu',
    'fond.validation.holder.min': 'Numele deținătorului trebuie să aibă cel puțin 2 caractere',
    'fond.validation.holder.max': 'Numele poate avea maxim 255 caractere',
    'fond.validation.email.invalid': 'Adresa de email nu este validă',
    'fond.validation.phone.invalid': 'Numărul de telefon conține caractere invalide',
    'fond.validation.url.invalid': 'URL-ul nu este valid',

    // Duplicate detection
    'fond.duplicate.warning': 'Companii similare detectate',
    'fond.duplicate.message': 'Am găsit companii cu nume similar. Vrei să selectezi una existentă?',
    'fond.duplicate.select.tip': 'Click pe o sugestie pentru a o selecta',
    'fond.duplicate.suggestions': 'Companii similare găsite: {{companies}}',

    // Success/Error messages
    'fond.success.created': 'Fondul a fost creat cu succes',
    'fond.success.updated': 'Fondul a fost actualizat cu succes',
    'fond.success.deleted': 'Fondul a fost șters cu succes',
    'fond.error.create': 'Eroare la crearea fondului',
    'fond.error.update': 'Eroare la actualizarea fondului',
    'fond.error.delete': 'Eroare la ștergerea fondului',
    'fond.error.load': 'Eroare la încărcarea fondurilor',

    // ========== USER MANAGEMENT ==========
    'user.title': 'Utilizator',
    'user.username': 'Nume utilizator',
    'user.username.placeholder': 'ex: admin, john.doe',
    'user.username.help': 'Doar litere, cifre, underscore, cratimă și punct',
    'user.password': 'Parolă',
    'user.password.current': 'Parola actuală',
    'user.password.new': 'Parola nouă',
    'user.password.confirm': 'Confirmă parola nouă',
    'user.password.placeholder.new': 'Introdu parola nouă',
    'user.password.placeholder.current': 'Introdu parola actuală',
    'user.password.placeholder.confirm': 'Confirmă parola nouă',
    'user.password.placeholder.keep': 'Lasă gol pentru a păstra parola actuală',
    'user.password.generate': 'Generează',
    'user.password.strength.weak': 'Slabă',
    'user.password.strength.medium': 'Medie',
    'user.password.strength.strong': 'Puternică',
    'user.role': 'Rol',
    'user.role.admin': 'Administrator',
    'user.role.audit': 'Audit',
    'user.role.client': 'Client',
    'user.role.admin.desc': 'Acces complet la sistem',
    'user.role.audit.desc': 'Vizualizare și rapoarte (read-only)',
    'user.role.client.desc': 'Management fonduri proprii',
    'user.company.name': 'Numele companiei',
    'user.company.name.placeholder': 'ex: Tractorul Brașov Heritage SRL',
    'user.company.name.help': 'Numele companiei pentru care gestionează fondurile',
    'user.contact.email': 'Email contact',
    'user.contact.email.placeholder': 'ex: contact@companie.ro',
    'user.contact.email.recommended': '(recomandat)',
    'user.notes': 'Note administrative',
    'user.notes.placeholder': 'Note despre utilizator...',

    // Form modes
    'user.form.create': 'Utilizator Nou',
    'user.form.edit': 'Editare Utilizator',
    'user.form.create.button': 'Creează',
    'user.form.update.button': 'Actualizează',
    'user.form.saving': 'Se salvează...',

    // Edit mode info
    'user.edit.info': 'Editare utilizator',
    'user.edit.password.tip': 'Lasă parola goală pentru a păstra parola actuală',

    // Password security
    'user.password.security.title': 'Sfaturi pentru o parolă sigură',
    'user.password.security.length': '• Folosește cel puțin 8 caractere',
    'user.password.security.mix': '• Combină litere mari și mici, cifre și simboluri',
    'user.password.security.personal': '• Nu folosi informații personale',
    'user.password.security.reuse': '• Nu reutiliza parole de la alte conturi',

    // Role warnings
    'user.role.admin.warning': 'Atenție: Rol Administrator',
    'user.role.admin.warning.desc': 'Administratorii au acces complet la toate datele și funcționalitățile aplicației, inclusiv managementul utilizatorilor și fondurilor.',
    'user.role.client.info': 'Informații Client',
    'user.role.client.info.desc': 'Clienții pot gestiona doar fondurile care le sunt assignate de administrator. Numele companiei este obligatoriu pentru identificarea fondurilor.',

    // Validation messages
    'user.validation.username.required': 'Username-ul este obligatoriu',
    'user.validation.username.min': 'Username-ul trebuie să aibă cel puțin 3 caractere',
    'user.validation.username.max': 'Username-ul poate avea maxim 64 caractere',
    'user.validation.username.pattern': 'Username-ul poate conține doar litere, cifre, underscore, cratimă și punct',
    'user.validation.username.exists': 'Acest username este deja folosit',
    'user.validation.password.required': 'Parola este obligatorie',
    'user.validation.password.min': 'Parola trebuie să aibă cel puțin 8 caractere',
    'user.validation.password.pattern': 'Parola trebuie să conțină cel puțin o literă mică, o literă mare și o cifră',
    'user.validation.password.match': 'Parolele nu se potrivesc',
    'user.validation.password.different': 'Parola nouă trebuie să fie diferită de cea actuală',
    'user.validation.role.required': 'Rolul este obligatoriu',
    'user.validation.role.invalid': 'Rolul selectat nu este valid',
    'user.validation.company.required.client': 'Numele companiei este obligatoriu pentru clienți',
    'user.validation.company.max': 'Numele companiei poate avea maxim 255 caractere',
    'user.validation.email.invalid': 'Adresa de email nu este validă',

    // Success/Error messages
    'user.success.created': 'Utilizatorul "{{username}}" ({{role}}) a fost creat cu succes!',
    'user.success.updated': 'Utilizatorul "{{username}}" a fost actualizat cu succes!',
    'user.success.deleted': 'Utilizatorul "{{username}}" a fost șters cu succes!',
    'user.success.password.changed': 'Parola a fost schimbată cu succes!',
    'user.error.create': 'Eroare la crearea utilizatorului',
    'user.error.update': 'Eroare la actualizarea utilizatorului',
    'user.error.delete': 'Eroare la ștergerea utilizatorului',
    'user.error.load': 'Eroare la încărcarea utilizatorilor',
    'user.error.password.change': 'A apărut o eroare la schimbarea parolei',
    'user.error.password.current.wrong': 'Parola actuală este incorectă',
    'user.error.no.permission.create': 'Nu ai permisiuni pentru a crea utilizatori',
    'user.error.no.permission.edit': 'Nu ai permisiuni pentru a modifica utilizatori',
    'user.error.no.permission.delete': 'Nu ai permisiuni pentru a șterge utilizatori',
    'user.error.cannot.delete.self': 'Nu te poți șterge pe tine însuți!',

    // ========== DASHBOARD TERMS ==========
    'dashboard.admin': 'Dashboard Administrator',
    'dashboard.audit': 'Dashboard Audit',
    'dashboard.client': 'Dashboard Client',
    'dashboard.loading': 'Se încarcă dashboard-ul...',
    'dashboard.stats': 'Statistici',
    'dashboard.recent.activity': 'Activitate recentă',
    'dashboard.quick.actions': 'Acțiuni rapide',

    // ========== ERRORS & MESSAGES ==========
    'error.generic': 'A apărut o eroare neașteptată',
    'error.unauthorized': 'Nu ai autorizație pentru această acțiune',
    'error.forbidden': 'Acces interzis',
    'error.not.found': 'Resursa nu a fost găsită',
    'error.validation': 'Eroare de validare',
    'error.duplicate': 'Intrarea există already',

    'success.operation': 'Operația a fost completată cu succes',
    'success.save': 'Salvat cu succes',
    'success.update': 'Actualizat cu succes',
    'success.delete': 'Șters cu succes',
    'success.create': 'Creat cu succes',

    // ========== CONFIRMATIONS ==========
    'confirm.delete': 'Ești sigur că vrei să ștergi {{item}}?',
    'confirm.delete.warning': 'Această acțiune este ireversibilă!',
    'confirm.unsaved.changes': 'Ai modificări nesalvate. Vrei să continui?',
    'confirm.logout': 'Ești sigur că vrei să te deconectezi?',

    // ========== LOADING STATES ==========
    'loading.please.wait': 'Te rugăm să aștepți...',
    'loading.data': 'Se încarcă datele...',
    'loading.saving': 'Se salvează...',
    'loading.deleting': 'Se șterge...',
    'loading.updating': 'Se actualizează...',
    'loading.creating': 'Se creează...',
    'loading.processing': 'Se procesează...',

    // ========== PERMISSIONS & ACCESS ==========
    'permission.denied': 'Nu ai permisiuni pentru această acțiune',
    'permission.read.only': 'Acces doar pentru citire',
    'permission.admin.required': 'Este necesară autorizația de administrator',
    'access.unauthorized': 'Acces neautorizat',
    'access.login.required': 'Este necesară autentificarea',

    // ========== DATE & TIME ==========
    'date.today': 'Azi',
    'date.yesterday': 'Ieri',
    'date.last.week': 'Săptămâna trecută',
    'date.last.month': 'Luna trecută',
    'time.now': 'Acum',
    'time.minutes.ago': '{{minutes}} minute în urmă',
    'time.hours.ago': '{{hours}} ore în urmă',
    'time.days.ago': '{{days}} zile în urmă',

    // ========== FOOTER ==========
    'footer.privacy': 'Politica de confidențialitate',
    'footer.terms': 'Termeni și condiții',
    'footer.contact': 'Contact',
  },

  en: {

     // Header & Navigation
    'app.title': 'Archive Web App',
    'app.subtitle': 'Search Romanian archival funds',
    'auth.login': 'Login',
    'auth.logout': 'Logout',
    'auth.logout.description': 'End session',
    'auth.back.search': 'Back to search',
    'auth.title': 'Authentication',
    'auth.description': 'Enter your credentials to access the account area', 
    'auth.demo.accounts': 'Demo accounts available',
    'auth.demo.admin': 'Admin (full access)',
    'auth.demo.audit': 'Audit (read-only)',
    'auth.demo.client': 'Client (manage own funds)',
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

    // Error Messages
    'error.search.min_length': 'Search must contain at least 2 characters',
    'error.search.failed': 'Search error:',
    'error.search.generic': 'An error occurred during search',
    
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
    'admin.unknown_user': 'unknown user',

    // Audit Dashboard
    'audit.loading.dashboard': 'Loading audit dashboard...',
    'audit.role_display': 'Audit (Read-Only)',
    'audit.role_name': 'Audit',
    'audit.actions.refresh': 'Refresh',
    'audit.actions.export': 'Export',
    'audit.actions.export_data': 'Export Data',
    'audit.actions.refresh_data': 'Refresh Data',
    
    // Audit Stats
    'audit.stats.total_fonds': 'Total Funds',
    'audit.stats.assigned_fonds': 'Assigned Funds',
    'audit.stats.unassigned_fonds': 'Unassigned Funds',
    'audit.stats.active_clients': 'Active Clients',
    'audit.stats.of_total': 'of total',
    'audit.stats.available_for_assignment': 'Available for assignment',
    'audit.stats.with_assigned_fonds': 'With assigned funds',
    
    // Recent Assignments
    'audit.recent_assignments.title': 'Recent Assignments',
    'audit.recent_assignments.none': 'No recent assignments',
    'audit.period.last_day': 'Last day',
    'audit.period.last_week': 'Last week',
    'audit.period.last_month': 'Last month',
    
    // Client Distribution
    'audit.client_distribution.title': 'Client Distribution',
    'audit.client_distribution.none': 'No clients with assigned funds',
    'audit.client_distribution.fond': 'fund',
    'audit.client_distribution.fonds': 'funds',
    
    // Table
    'audit.table.all_fonds': 'All Funds',
    'audit.table.company': 'Company',
    'audit.table.archive_holder': 'Archive Holder',
    'audit.table.status_owner': 'Status / Owner',
    'audit.table.contact': 'Contact',
    'audit.table.last_update': 'Last Update',
    'audit.table.actions': 'Actions',
    'audit.table.no_fonds_found': 'No funds found',
    'audit.table.try_modify_search': 'Try modifying the search',
    'audit.table.loading_fonds': 'Loading funds...',
    'audit.table.assigned': 'Assigned',
    'audit.table.unassigned': 'Unassigned',
    'audit.table.view_read_only': 'View (Read-Only)',
    
    // Search & Filters
    'audit.search.placeholder': 'Search funds...',
    'audit.filters.show_inactive': 'Show inactive',
    
    // Summary
    'audit.summary.audit_access': 'Audit Access',
    'audit.summary.quick_actions': 'Quick Actions',
    'audit.summary.system_info': 'System Information',
    'audit.summary.view_all_fonds': 'View all funds',
    'audit.summary.export_data_stats': 'Export data and statistics',
    'audit.summary.reports_analytics': 'Reports and analytics',
    'audit.summary.no_modifications': 'No modifications (Read-Only)',
    'audit.summary.role': 'Role',
    'audit.summary.user': 'User',
    'audit.summary.visible_fonds': 'Visible funds',
    'audit.summary.last_update': 'Last update',
    
    // Error Messages
    'audit.error.failed_to_load_data': 'Failed to load data',
    'audit.error.loading_data': 'Error loading data',
    'audit.error.export_failed': 'Export failed',
    'audit.error.failed_to_export_data': 'Failed to export data',

    // ========== COMMON TERMS ==========
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.success': 'Success',
    'common.cancel': 'Cancel',
    'common.save': 'Save',
    'common.edit': 'Edit',
    'common.delete': 'Delete',
    'common.add': 'Add',
    'common.create': 'Create',
    'common.update': 'Update',
    'common.close': 'Close',
    'common.back': 'Back',
    'common.continue': 'Continue',
    'common.confirm': 'Confirm',
    'common.retry': 'Retry',
    'common.yes': 'Yes',
    'common.no': 'No',
    'common.optional': 'Optional',
    'common.required': 'Required',
    'common.search': 'Search',
    'common.filter': 'Filter',
    'common.sort': 'Sort',
    'common.export': 'Export',
    'common.import': 'Import',
    'common.refresh': 'Refresh',

    // ========== APP HEADER & NAVIGATION ==========
    'nav.home': 'Home',
    'nav.settings': 'Settings',
    'nav.help': 'Help',
    'nav.logout': 'Logout',

    // ========== AUTHENTICATION ==========
    'auth.username': 'Username',
    'auth.password': 'Password',
    'auth.login.button': 'Sign In',
    'auth.login.loading': 'Signing in...',
    'auth.login.failed': 'Login failed',
    'auth.login.invalid': 'Invalid username or password',
    'auth.required': 'You must be authenticated to access this page',
    'auth.session.expired': 'Session expired. Please sign in again.',

    // ========== HOMEPAGE & SEARCH ==========
    'search.button': 'Search',
    'search.button.loading': 'Searching...',
    'search.min.length': 'Search must contain at least 2 characters',
    'search.no.results': 'No results found',
    'search.results.count': '{{count}} results found',
    'search.error': 'Search error: {{error}}',

    // ========== FOND MANAGEMENT ==========
    'fond.title': 'Archival Fund',
    'fond.company.name': 'Company name',
    'fond.company.name.placeholder': 'ex: Tractorul Brasov SA',
    'fond.holder.name': 'Archive holder',
    'fond.holder.name.placeholder': 'ex: National Archives Brasov',
    'fond.address': 'Address',
    'fond.address.placeholder': 'ex: Industrial Street 15, Brasov, 500269',
    'fond.email': 'Email',
    'fond.email.placeholder': 'contact@archive.ro',
    'fond.phone': 'Phone',
    'fond.phone.placeholder': '+40 268 123 456',
    'fond.notes': 'Notes',
    'fond.notes.placeholder': 'Additional information about the fund...',
    'fond.source.url': 'Source URL',
    'fond.source.url.placeholder': 'https://archive.ro/funds/tractorul',
    'fond.status.active': 'Active fund (visible in public search)',
    'fond.owner.assignment': 'Owner Assignment',
    'fond.owner.assign.to': 'Assign to client',
    'fond.owner.unassigned': '-- Unassigned --',
    'fond.owner.selected': 'Selected: {{username}}',
    'fond.owner.info': 'Fund will be visible and editable only by the selected user',

    // Form modes
    'fond.form.create': 'New Fund',
    'fond.form.edit': 'Edit Fund',
    'fond.form.create.button': 'Create',
    'fond.form.update.button': 'Update',
    'fond.form.saving': 'Saving...',

    // Validation messages
    'fond.validation.company.required': 'Company name is required',
    'fond.validation.company.min': 'Name must have at least 2 characters',
    'fond.validation.company.max': 'Name can have maximum 255 characters',
    'fond.validation.company.duplicate': 'This company may already exist in the database',
    'fond.validation.holder.required': 'Archive holder is required',
    'fond.validation.holder.min': 'Holder name must have at least 2 characters',
    'fond.validation.holder.max': 'Name can have maximum 255 characters',
    'fond.validation.email.invalid': 'Email address is not valid',
    'fond.validation.phone.invalid': 'Phone number contains invalid characters',
    'fond.validation.url.invalid': 'URL is not valid',

    // Duplicate detection
    'fond.duplicate.warning': 'Similar companies detected',
    'fond.duplicate.message': 'We found companies with similar names. Do you want to select an existing one?',
    'fond.duplicate.select.tip': 'Click on a suggestion to select it',
    'fond.duplicate.suggestions': 'Similar companies found: {{companies}}',

    // Success/Error messages
    'fond.success.created': 'Fund created successfully',
    'fond.success.updated': 'Fund updated successfully',
    'fond.success.deleted': 'Fund deleted successfully',
    'fond.error.create': 'Error creating fund',
    'fond.error.update': 'Error updating fund',
    'fond.error.delete': 'Error deleting fund',
    'fond.error.load': 'Error loading funds',

    // ========== USER MANAGEMENT ==========
    'user.title': 'User',
    'user.username': 'Username',
    'user.username.placeholder': 'ex: admin, john.doe',
    'user.username.help': 'Only letters, numbers, underscore, hyphen and dot',
    'user.password': 'Password',
    'user.password.current': 'Current password',
    'user.password.new': 'New password',
    'user.password.confirm': 'Confirm new password',
    'user.password.placeholder.new': 'Enter new password',
    'user.password.placeholder.current': 'Enter current password',
    'user.password.placeholder.confirm': 'Confirm new password',
    'user.password.placeholder.keep': 'Leave empty to keep current password',
    'user.password.generate': 'Generate',
    'user.password.strength.weak': 'Weak',
    'user.password.strength.medium': 'Medium',
    'user.password.strength.strong': 'Strong',
    'user.role': 'Role',
    'user.role.admin': 'Administrator',
    'user.role.audit': 'Audit',
    'user.role.client': 'Client',
    'user.role.admin.desc': 'Full system access',
    'user.role.audit.desc': 'View and reports (read-only)',
    'user.role.client.desc': 'Own funds management',
    'user.company.name': 'Company name',
    'user.company.name.placeholder': 'ex: Tractorul Brasov Heritage SRL',
    'user.company.name.help': 'Company name for which they manage funds',
    'user.contact.email': 'Contact email',
    'user.contact.email.placeholder': 'ex: contact@company.ro',
    'user.contact.email.recommended': '(recommended)',
    'user.notes': 'Administrative notes',
    'user.notes.placeholder': 'Notes about user...',

    // Form modes
    'user.form.create': 'New User',
    'user.form.edit': 'Edit User',
    'user.form.create.button': 'Create',
    'user.form.update.button': 'Update',
    'user.form.saving': 'Saving...',

    // Edit mode info
    'user.edit.info': 'Edit user',
    'user.edit.password.tip': 'Leave password empty to keep current password',

    // Password security
    'user.password.security.title': 'Tips for a secure password',
    'user.password.security.length': '• Use at least 8 characters',
    'user.password.security.mix': '• Combine uppercase and lowercase letters, numbers and symbols',
    'user.password.security.personal': '• Don\'t use personal information',
    'user.password.security.reuse': '• Don\'t reuse passwords from other accounts',

    // Role warnings
    'user.role.admin.warning': 'Warning: Administrator Role',
    'user.role.admin.warning.desc': 'Administrators have full access to all application data and functionality, including user and fund management.',
    'user.role.client.info': 'Client Information',
    'user.role.client.info.desc': 'Clients can only manage funds assigned to them by an administrator. Company name is required for fund identification.',

    // Validation messages
    'user.validation.username.required': 'Username is required',
    'user.validation.username.min': 'Username must have at least 3 characters',
    'user.validation.username.max': 'Username can have maximum 64 characters',
    'user.validation.username.pattern': 'Username can only contain letters, numbers, underscore, hyphen and dot',
    'user.validation.username.exists': 'This username is already taken',
    'user.validation.password.required': 'Password is required',
    'user.validation.password.min': 'Password must have at least 8 characters',
    'user.validation.password.pattern': 'Password must contain at least one lowercase letter, one uppercase letter and one digit',
    'user.validation.password.match': 'Passwords don\'t match',
    'user.validation.password.different': 'New password must be different from current',
    'user.validation.role.required': 'Role is required',
    'user.validation.role.invalid': 'Selected role is not valid',
    'user.validation.company.required.client': 'Company name is required for clients',
    'user.validation.company.max': 'Company name can have maximum 255 characters',
    'user.validation.email.invalid': 'Email address is not valid',

    // Success/Error messages
    'user.success.created': 'User "{{username}}" ({{role}}) created successfully!',
    'user.success.updated': 'User "{{username}}" updated successfully!',
    'user.success.deleted': 'User "{{username}}" deleted successfully!',
    'user.success.password.changed': 'Password changed successfully!',
    'user.error.create': 'Error creating user',
    'user.error.update': 'Error updating user',
    'user.error.delete': 'Error deleting user',
    'user.error.load': 'Error loading users',
    'user.error.password.change': 'Error occurred while changing password',
    'user.error.password.current.wrong': 'Current password is incorrect',
    'user.error.no.permission.create': 'You don\'t have permission to create users',
    'user.error.no.permission.edit': 'You don\'t have permission to edit users',
    'user.error.no.permission.delete': 'You don\'t have permission to delete users',
    'user.error.cannot.delete.self': 'You cannot delete yourself!',

    // ========== DASHBOARD TERMS ==========
    'dashboard.admin': 'Administrator Dashboard',
    'dashboard.audit': 'Audit Dashboard',
    'dashboard.client': 'Client Dashboard',
    'dashboard.loading': 'Loading dashboard...',
    'dashboard.stats': 'Statistics',
    'dashboard.recent.activity': 'Recent activity',
    'dashboard.quick.actions': 'Quick actions',

    // ========== ERRORS & MESSAGES ==========
    'error.generic': 'An unexpected error occurred',
    'error.network': 'Network error. Check your connection.',
    'error.server': 'Server error. Please try again.',
    'error.unauthorized': 'You are not authorized for this action',
    'error.forbidden': 'Access denied',
    'error.not.found': 'Resource not found',
    'error.validation': 'Validation error',
    'error.duplicate': 'Entry already exists',

    'success.operation': 'Operation completed successfully',
    'success.save': 'Saved successfully',
    'success.update': 'Updated successfully',
    'success.delete': 'Deleted successfully',
    'success.create': 'Created successfully',

        // Client Dashboard
    'client.loading.fonds': 'Loading your funds...',
    'client.role_name': 'Client',
    'client.header.description': 'Assigned funds management',
    
    // Client Stats
    'client.stats.total_fonds': 'Total Funds',
    'client.stats.inactive_fonds': 'Inactive Funds',
    'client.stats.data_completion': 'Data Completion',
    'client.stats.click_to_add': 'Click to add',
    'client.stats.not_public_visible': 'Not publicly visible',
    'client.stats.completion_rate': 'Completion rate',
    
    // Client Info
    'client.info.title': 'Client Information',
    'client.info.username': 'Username',
    'client.info.role': 'Role',
    'client.info.last_update': 'Last update',
    
    // Client Actions
    'client.actions.add_fond': 'Add Fund',
    'client.actions.edit': 'Edit',
    'client.actions.delete': 'Delete',
    
    // Client Search & Filters
    'client.search.placeholder': 'Search in your funds...',
    'client.filters.show_inactive': 'Show inactive',
    
    // Client Table
    'client.table.your_fonds': 'Your Funds',
    'client.table.company': 'Company',
    'client.table.archive_holder': 'Archive Holder',
    'client.table.contact': 'Contact',
    'client.table.status': 'Status',
    'client.table.actions': 'Actions',
    'client.table.no_fonds_assigned': 'You don\'t have any assigned funds yet',
    'client.table.no_fonds_found': 'No funds found',
    'client.table.contact_admin_or_add': 'Contact administrator to get assigned funds or add a new one.',
    'client.table.try_modify_search': 'Try modifying the search',
    'client.table.loading_fonds': 'Loading funds...',
    'client.table.add_first_fond': 'Add first fund',
    
    // Client Help
    'client.help.available_actions': 'Available Actions',
    'client.help.completion_tips': 'Completion Tips',
    'client.help.view_edit_own_fonds': 'View and edit own funds',
    'client.help.add_new_fonds': 'Add new funds',
    'client.help.delete_own_fonds': 'Delete funds (own)',
    'client.help.search_public_fonds': 'Search public funds',
    'client.help.company_name': 'Company name',
    'client.help.company_name_tip': 'Use official denomination',
    'client.help.archive_holder': 'Archive holder',
    'client.help.archive_holder_tip': 'Institution that keeps the documents',
    'client.help.contact': 'Contact',
    'client.help.contact_tip': 'Add email and phone for easy communication',
    'client.help.address': 'Address',
    'client.help.address_tip': 'Complete address helps with location',
    'client.help.notes': 'Notes',
    'client.help.notes_tip': 'Additional information about fund',
    
    // Client Pagination
    'client.pagination.showing': 'Showing',
    'client.pagination.of': 'of',
    'client.pagination.fonds': 'funds',
    'client.pagination.filtered_by': 'Filtered by',
    
    // Client Error Messages
    'client.error.failed_to_load_data': 'Failed to load data',
    'client.error.loading_fonds': 'Error loading funds',
    'client.error.creating_fond': 'Error creating fund',
    'client.error.creating_fond_generic': 'Error creating fund',
    'client.error.updating_fond': 'Error updating fund',
    'client.error.updating_fond_generic': 'Error updating fund',
    'client.error.deleting_fond': 'Error deleting fund',
    'client.error.deleting_fond_generic': 'Error deleting fund',
    
    // Client Success Messages
    'client.success.fond_created': 'Fund created successfully',
    'client.success.fond_updated': 'Fund updated successfully',
    'client.success.fond_deleted': 'Fund deleted successfully',
    
    // Client Confirmations
    'client.confirm.delete_fond': 'Are you sure you want to delete the fund',

    // ========== CONFIRMATIONS ==========
    'confirm.delete': 'Are you sure you want to delete {{item}}?',
    'confirm.delete.warning': 'This action is irreversible!',
    'confirm.unsaved.changes': 'You have unsaved changes. Do you want to continue?',
    'confirm.logout': 'Are you sure you want to logout?',

    // ========== LOADING STATES ==========
    'loading.please.wait': 'Please wait...',
    'loading.data': 'Loading data...',
    'loading.saving': 'Saving...',
    'loading.deleting': 'Deleting...',
    'loading.updating': 'Updating...',
    'loading.creating': 'Creating...',
    'loading.processing': 'Processing...',

    // ========== PERMISSIONS & ACCESS ==========
    'permission.denied': 'You don\'t have permission for this action',
    'permission.read.only': 'Read-only access',
    'permission.admin.required': 'Administrator authorization required',
    'access.unauthorized': 'Unauthorized access',
    'access.login.required': 'Authentication required',

    // ========== DATE & TIME ==========
    'date.today': 'Today',
    'date.yesterday': 'Yesterday',
    'date.last.week': 'Last week',
    'date.last.month': 'Last month',
    'time.now': 'Now',
    'time.minutes.ago': '{{minutes}} minutes ago',
    'time.hours.ago': '{{hours}} hours ago',
    'time.days.ago': '{{days}} days ago',

    // ========== FOOTER ==========
    'footer.copyright': '© 2025 Archive Web App - Tony Gheorghe',
    'footer.description': 'Application for searching Romanian archival funds',
    'footer.privacy': 'Privacy Policy',
    'footer.terms': 'Terms and Conditions',
    'footer.contact': 'Contact',
  }
};

export default LanguageProvider;
