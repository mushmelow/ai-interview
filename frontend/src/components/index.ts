// Components
export { default as Header } from './layout/Header';
export { default as LanguageSelector } from './common/LanguageSelector';
export { default as ConsentFlow } from './features/ConsentFlow';
export { default as ConsentStatus } from './features/ConsentStatus';
export { default as LoginForm } from './auth/LoginForm';
export { default as RegisterForm } from './auth/RegisterForm';
export { default as Interview } from './Interview';
export { default as QuestionGenerator } from './QuestionGenerator';
export { default as QuestionDisplay } from './QuestionDisplay';
export { default as VoiceInteraction } from './VoiceInteraction';

// Pages
export { default as Dashboard } from '../pages/Dashboard';
export { default as AuthPage } from '../pages/AuthPage';

// Services
export { default as ConsentService } from '../services/ConsentService';

// Hooks
export { useConsent } from '../hooks/useConsent';

// Utils
export * from '../utils/helpers';

// Constants
export * from '../constants';

// Styles
export { theme } from '../styles/theme';
