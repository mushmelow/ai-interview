# Frontend Structure

This document explains the frontend folder structure and architecture.

## 📁 Folder Structure

```
src/
├── components/           # Reusable UI components
│   ├── common/          # Common components (Button, Input, etc.)
│   │   └── LanguageSelector.js
│   ├── layout/          # Layout components (Header, Sidebar, etc.)
│   │   └── Header.js
│   ├── features/        # Feature-specific components
│   │   ├── ConsentFlow.js
│   │   └── ConsentStatus.js
│   └── index.js         # Barrel exports
├── pages/               # Page components (routes)
│   └── Dashboard.js
├── hooks/               # Custom React hooks
│   └── useConsent.js
├── services/            # API services and external integrations
│   └── ConsentService.js
├── utils/               # Utility functions
│   └── helpers.js
├── constants/           # App constants
│   └── index.js
├── types/               # TypeScript type definitions (future)
├── contexts/            # React contexts (future)
├── styles/              # Global styles and themes
│   └── theme.js
├── assets/              # Static assets (future)
├── App.js               # Main App component
└── index.js             # Entry point
```

## 🏗️ Architecture Principles

### 1. **Component Organization**
- **Common**: Reusable UI components (buttons, inputs, etc.)
- **Layout**: Layout-specific components (header, sidebar, etc.)
- **Features**: Feature-specific components (consent flow, interview, etc.)

### 2. **Separation of Concerns**
- **Pages**: Route-level components
- **Components**: Reusable UI components
- **Hooks**: Custom logic and state management
- **Services**: API calls and external integrations
- **Utils**: Pure utility functions
- **Constants**: Application constants

### 3. **Import Strategy**
- Use barrel exports (`index.js`) for clean imports
- Absolute imports for better maintainability
- Group related imports together

## 📦 Key Files

### Components
- `Header.js` - Main navigation header
- `LanguageSelector.js` - Language switching component
- `ConsentFlow.js` - GDPR consent modal
- `ConsentStatus.js` - Consent status display

### Services
- `ConsentService.js` - Handles all consent-related API calls

### Hooks
- `useConsent.js` - Custom hook for consent management

### Utils
- `helpers.js` - Utility functions for dates, storage, validation, etc.

### Constants
- `index.js` - Application constants (API endpoints, storage keys, etc.)

## 🚀 Usage Examples

### Importing Components
```javascript
// Clean imports using barrel exports
import { Header, ConsentFlow, ConsentStatus } from './components';

// Or direct imports
import Header from './components/layout/Header';
```

### Using Custom Hooks
```javascript
import { useConsent } from './hooks/useConsent';

const MyComponent = () => {
  const { consentStatus, submitConsent, loading } = useConsent();
  // ...
};
```

### Using Services
```javascript
import { ConsentService } from './services/ConsentService';

const consentService = new ConsentService();
await consentService.submitConsent(consents);
```

### Using Utils
```javascript
import { formatDate, storage, validateEmail } from './utils/helpers';

const date = formatDate(new Date());
storage.set('key', value);
const isValid = validateEmail(email);
```

## 🔄 Future Enhancements

1. **TypeScript**: Add type definitions in `types/` folder
2. **Contexts**: Add React contexts for global state
3. **Assets**: Add static assets (images, icons, etc.)
4. **Tests**: Add test files alongside components
5. **Storybook**: Add component documentation

## 📋 Best Practices

1. **Naming**: Use PascalCase for components, camelCase for utilities
2. **Exports**: Use named exports for better tree-shaking
3. **Imports**: Group imports (React, third-party, local)
4. **Components**: Keep components small and focused
5. **Hooks**: Extract reusable logic into custom hooks
6. **Services**: Keep API logic separate from components




