# Arhivare Web App - React Frontend

🚀 **Modern React frontend for Romanian archival funds search application**

A comprehensive React application with TypeScript, Tailwind CSS, and advanced features including user management, dark mode, and accessibility support.

## 📋 Table of Contents

- [🎯 Features](#-features)
- [🏗️ Architecture](#️-architecture)
- [🚀 Quick Start](#-quick-start)
- [📱 Main Components](#-main-components)
- [🎨 Implemented Systems](#-implemented-systems)
- [🔐 Authentication & Authorization](#-authentication--authorization)
- [🌓 Dark Mode](#-dark-mode)
- [♿ Accessibility](#-accessibility)
- [📱 Responsive Design](#-responsive-design)
- [🔧 Development](#-development)
- [🏗️ Build & Deploy](#️-build--deploy)
- [📚 API Integration](#-api-integration)
- [🧪 Testing](#-testing)

## 🎯 Features

### ✨ Core Functionality
- **🔍 Public search** for archival funds with pagination and filters
- **👥 User management** with roles (admin, audit, client)
- **📊 Specialized dashboards** for each user type
- **🏢 Fund management** with automatic assignment and intelligent reassignment
- **🌓 Complete dark mode** with system detection
- **♿ Full accessibility** support (WCAG 2.1 AA compliant)
- **🌐 Network handling** with offline support and retry mechanisms
- **🎨 Loading states** and error boundaries throughout the app

### 🛡️ User Roles & Permissions

#### 🔧 Administrator (`admin`)
- Full CRUD operations on all funds
- User management (create, edit, delete users)
- Fund assignment to clients
- Access to all dashboards and statistics
- System administration features

#### 👁️ Auditor (`audit`) 
- Read-only access to all funds
- User list viewing (no modifications)
- Export capabilities and reporting
- Monitoring dashboard with analytics

#### 🏢 Client (`client`)
- Management of assigned funds only
- Can create new funds
- Company profile management
- View only assigned funds in personal dashboard

### 🎨 UI/UX Features
- **Responsive design** - Works on all device sizes
- **Dark/Light theme** with system preference detection
- **Smooth animations** and transitions
- **Loading skeletons** for better perceived performance
- **Toast notifications** for user feedback
- **Form validation** with real-time feedback
- **Duplicate detection** for fund creation

## 🏗️ Architecture

### 📁 Project Structure
```
src/
├── components/           # React components
│   ├── common/          # Reusable components
│   │   ├── AccessibilitySystem.tsx
│   │   ├── DarkModeSystem.tsx
│   │   ├── ErrorBoundary.tsx
│   │   ├── LoadingStates.tsx
│   │   └── NetworkHandling.tsx
│   ├── forms/           # Form components
│   │   ├── FondForm.tsx
│   │   └── UserForm.tsx
│   ├── pages/           # Page components
│   │   ├── UserProfile.tsx
│   │   └── UsersPage.tsx
│   ├── AdminDashboard.tsx
│   ├── AuditDashboard.tsx
│   ├── AuthSystem.tsx
│   ├── ClientDashboard.tsx
│   ├── HomePage.tsx
│   └── ReassignmentModal.tsx
├── services/            # API services
├── types/              # TypeScript definitions
├── App.tsx             # Main app component
├── index.tsx          # Entry point
└── index.css          # Global styles
```

### 🔧 Tech Stack
- **React 18** with hooks and functional components
- **TypeScript** for type safety
- **Tailwind CSS** for styling with dark mode support
- **React Router** for client-side routing
- **React Hook Form** for form management
- **Yup** for form validation
- **Lucide React** for consistent iconography

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Backend API running on port 8000 (default)

### Installation & Setup

1. **Clone and navigate to frontend**
```bash
cd arhivare-web-app/react-frontend
```

2. **Install dependencies**
```bash
npm install
```

3. **Environment configuration**
```bash
# Create .env.local file
echo "REACT_APP_API_URL=http://localhost:8000" > .env.local
```

4. **Start development server**
```bash
npm start
```

The app will be available at [http://localhost:3000](http://localhost:3000)

### 🐳 Docker Development

**Development mode with hot reload:**
```bash
docker build -f Dockerfile.dev -t arhivare-frontend-dev .
docker run -p 3000:3000 -v $(pwd)/src:/app/src arhivare-frontend-dev
```

**Production build:**
```bash
npm run build
# Serve build folder with your preferred static server
```

## 📱 Main Components

### 🏠 HomePage
- **Public search interface** for archival funds
- **Pagination** and filtering capabilities  
- **User authentication** integration
- **Role-based navigation** menu

### 🔐 AuthSystem
- **JWT-based authentication** with localStorage persistence
- **Protected routes** with role-based access control
- **Auto-redirect** based on user role
- **Session management** and logout functionality

### 📊 Dashboard Components

#### AdminDashboard
- **Complete CRUD** operations for funds
- **User assignment** to funds with intelligent suggestions
- **Bulk operations** and advanced filtering
- **Statistics** and fund management overview

#### AuditDashboard  
- **Read-only access** to all system data
- **Export functionality** for reporting
- **Analytics** and monitoring capabilities
- **Recent activity** tracking

#### ClientDashboard
- **Personal fund management** for assigned funds
- **Company profile** editing
- **Fund creation** with duplicate detection
- **Assignment status** tracking

### 📝 Forms

#### FondForm
- **Smart duplicate detection** during fund creation
- **Real-time validation** with user-friendly messages
- **Owner assignment** (admin only)
- **Company name normalization**

#### UserForm  
- **Role-based field visibility** (company name for clients)
- **Password strength** validation and generation
- **Username uniqueness** checking
- **Security best practices**

## 🎨 Implemented Systems

### 🌓 Dark Mode System (`DarkModeSystem.tsx`)
- **Three modes**: Light, Dark, System preference
- **Persistent settings** in localStorage
- **System preference detection** and automatic switching
- **Tailwind CSS integration** with `class` strategy
- **Theme debugging** in development mode

```typescript
// Usage
import { useDarkMode, DarkModeToggle } from './common/DarkModeSystem';

const { currentTheme, toggleMode } = useDarkMode();
```

### ♿ Accessibility System (`AccessibilitySystem.tsx`)
- **WCAG 2.1 AA compliance** throughout the app
- **Customizable settings**: font size, contrast, animations
- **Screen reader support** with announcements
- **Keyboard navigation** with focus management
- **Skip links** for better navigation
- **Accessible forms** and modals

```typescript
// Usage  
import { useAccessibility, AccessibleButton } from './common/AccessibilitySystem';

const { announceToScreenReader } = useAccessibility();
```

### 🛡️ Error Boundary System (`ErrorBoundary.tsx`)
- **Multiple boundary types** for different contexts
- **Automatic error reporting** and logging
- **User-friendly fallbacks** with recovery options
- **Development debugging** with detailed error info

```typescript
// Usage
<DashboardErrorBoundary>
  <AdminDashboard />
</DashboardErrorBoundary>
```

### 🔄 Loading States (`LoadingStates.tsx`)
- **Consistent loading indicators** across the app
- **Skeleton screens** for better perceived performance
- **Loading buttons** with disabled states
- **Page-level loading** components

### 🌐 Network Handling (`NetworkHandling.tsx`)
- **Offline/online detection** with user notifications
- **Request retry mechanisms** with exponential backoff
- **Network speed detection** for adaptive loading
- **Failed request recovery**

## 🔐 Authentication & Authorization

### JWT Token Management
- **Automatic token refresh** (when supported by backend)
- **Secure storage** in localStorage with fallback handling
- **Route protection** based on authentication status
- **Role-based access** control throughout the app

### Protected Routes
```typescript
<ProtectedRoute requiredRole="admin">
  <AdminDashboard />
</ProtectedRoute>
```

### User Roles
- **admin**: Full system access
- **audit**: Read-only access with export capabilities  
- **client**: Personal fund management only

## 🌓 Dark Mode

### Implementation Details
- **Tailwind CSS** `class` strategy for theme switching
- **System preference** detection and automatic switching
- **Manual override** capability
- **Persistent user choice** across sessions

### CSS Structure
```css
/* Light mode (default) */
.bg-white { background-color: #ffffff; }

/* Dark mode */
.dark .bg-white { background-color: #1f2937; }
```

## ♿ Accessibility

### Features Implemented
- **Semantic HTML** throughout all components
- **ARIA labels** and descriptions
- **Keyboard navigation** support
- **Focus management** in modals and forms
- **Screen reader** announcements
- **Color contrast** compliance
- **Font size** adjustment
- **Reduced motion** support

### Testing
- Use screen reader to test navigation
- Test keyboard-only navigation (Tab, Shift+Tab, Enter, Escape)
- Verify color contrast ratios
- Check focus indicators visibility

## 📱 Responsive Design

### Breakpoints (Tailwind CSS)
- **sm**: 640px and up (tablet)
- **md**: 768px and up (desktop)  
- **lg**: 1024px and up (large desktop)
- **xl**: 1280px and up (extra large)

### Mobile-First Approach
- Base styles target mobile devices
- Progressive enhancement for larger screens
- Touch-friendly interface elements
- Optimized loading for slower connections

## 🔧 Development

### Available Scripts

```bash
# Development server with hot reload
npm start

# Production build
npm run build

# Run tests
npm test

# Theme-specific builds
npm run build:light    # Light theme default
npm run build:dark     # Dark theme default  
npm run build:auto     # System preference default
```

### Development Tools
- **React Developer Tools** - Component inspection
- **Tailwind CSS IntelliSense** - CSS class completion
- **TypeScript** strict mode enabled
- **ESLint** for code quality

### Code Style Guidelines
- **Functional components** with hooks
- **TypeScript interfaces** for all props
- **Consistent naming**: camelCase for variables, PascalCase for components
- **Error boundaries** around major component trees
- **Loading states** for all async operations

### Environment Variables
```bash
REACT_APP_API_URL=http://localhost:8000        # Backend API URL
REACT_APP_DEFAULT_THEME=system                 # Default theme
NODE_ENV=development                           # Environment mode
```

## 🏗️ Build & Deploy

### Production Build
```bash
# Create optimized build
npm run build

# Build artifacts in ./build/ folder
# Serve with any static file server
```

### Docker Production
```bash
# Multi-stage build for production
docker build -t arhivare-frontend .
docker run -p 80:80 arhivare-frontend
```

### Deployment Checklist
- [ ] Update `REACT_APP_API_URL` for production backend
- [ ] Enable HTTPS for production
- [ ] Configure proper Content Security Policy
- [ ] Set up error monitoring (Sentry, etc.)
- [ ] Enable service worker for offline capability
- [ ] Configure analytics if needed

## 📚 API Integration

### Base Configuration
```typescript
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
```

### Authentication Headers
```typescript
const getAuthHeaders = () => {
  const token = localStorage.getItem('auth_token');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};
```

### Main API Endpoints
- `GET /search` - Public fund search
- `POST /auth/login` - User authentication
- `GET /fonds/` - Get funds (authenticated)
- `POST /fonds/` - Create fund (admin only)
- `PUT /fonds/:id` - Update fund (admin only)
- `DELETE /fonds/:id` - Delete fund (admin only)
- `GET /users/` - Get users (admin/audit)
- `POST /users/` - Create user (admin only)

## 🧪 Testing

### Test Structure
```bash
src/
├── components/
│   └── __tests__/      # Component tests
├── services/
│   └── __tests__/      # API service tests
└── App.test.tsx        # Main app tests
```

### Running Tests
```bash
# Run all tests
npm test

# Run tests with coverage
npm test -- --coverage

# Run tests in CI mode
npm test -- --ci --watchAll=false
```

### Test Guidelines
- **Component testing** with React Testing Library
- **User interaction** testing over implementation details
- **Accessibility** testing with screen readers
- **API integration** testing with mock services

## 🚀 Performance Optimization

### Implemented Optimizations
- **Code splitting** with React.lazy()
- **Image optimization** with smart loading
- **Bundle analysis** with webpack-bundle-analyzer
- **Memoization** for expensive calculations
- **Virtual scrolling** for large lists (when applicable)

### Performance Monitoring
```bash
# Analyze bundle size
npm run build
npx webpack-bundle-analyzer build/static/js/*.js
```

## 🔍 Troubleshooting

### Common Issues

#### Dark Mode Not Working
- Check Tailwind config has `darkMode: 'class'`
- Verify HTML class is being set correctly
- Check CSS purging isn't removing dark: classes

#### Authentication Issues  
- Verify API_URL environment variable
- Check localStorage for auth_token
- Confirm backend CORS settings

#### Build Failures
- Clear node_modules and reinstall
- Check TypeScript errors in console
- Verify all imports are correct

### Debug Tools
- React DevTools for component inspection
- Network tab for API call debugging
- Console for error messages and warnings
- Lighthouse for performance auditing

---

## 📞 Support

For questions or issues:
1. Check the troubleshooting section above
2. Review component documentation in source files
3. Check the backend API documentation
4. Create an issue in the project repository

---

**Built with ❤️ using React, TypeScript, and Tailwind CSS**
