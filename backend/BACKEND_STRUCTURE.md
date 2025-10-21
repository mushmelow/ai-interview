# Backend Architecture

This document explains the backend folder structure and architecture.

## 📁 Current Structure

```
backend/src/
├── config/              # Configuration files
│   └── index.js         # Main configuration
├── controllers/         # Request handlers (business logic)
│   └── ConsentController.js
├── models/              # Data models
│   └── index.js         # User, Consent, Interview models
├── services/            # Business logic services
│   └── ConsentService.js
├── routes/              # API route definitions
│   ├── consent.js       # Consent routes
│   ├── interview.js     # Interview routes
│   └── auth.js          # Authentication routes
├── middleware/          # Express middleware
│   └── errorHandler.js  # Error handling middleware
├── validators/          # Input validation
│   └── index.js         # Validation functions
├── utils/               # Utility functions
│   └── logger.js        # Winston logger
├── constants/           # Application constants
│   └── index.js         # API endpoints, status codes, etc.
├── types/               # TypeScript definitions (future)
├── app.js               # Main application file
├── server.ts            # TypeScript server (legacy)
├── simple-server.ts     # Simple server (legacy)
├── working-server.js    # Working server with consent API
└── structured-server.js # Current structured server
```

## 🏗️ Architecture Principles

### 1. **Layered Architecture**
- **Routes**: Define API endpoints and HTTP methods
- **Controllers**: Handle HTTP requests and responses
- **Services**: Business logic and data operations
- **Models**: Data structure definitions
- **Middleware**: Cross-cutting concerns (auth, logging, etc.)

### 2. **Separation of Concerns**
- **Configuration**: Environment-specific settings
- **Validation**: Input validation and sanitization
- **Error Handling**: Centralized error management
- **Logging**: Structured logging with Winston
- **Constants**: Application constants and enums

### 3. **Best Practices**
- **Single Responsibility**: Each module has one clear purpose
- **Dependency Injection**: Services injected into controllers
- **Error Handling**: Consistent error responses
- **Validation**: Input validation at route level
- **Logging**: Structured logging for debugging

## 📦 Key Components

### Configuration (`config/index.js`)
```javascript
const config = {
  server: { port: 5000, env: 'development' },
  database: { url: 'postgresql://...' },
  jwt: { secret: '...', expiresIn: '7d' },
  // ... other configurations
};
```

### Models (`models/index.js`)
```javascript
class Consent {
  constructor(data) { /* ... */ }
  toJSON() { /* ... */ }
  isValid() { /* ... */ }
}
```

### Controllers (`controllers/ConsentController.js`)
```javascript
class ConsentController {
  async createConsent(req, res) { /* ... */ }
  async getConsent(req, res) { /* ... */ }
  async withdrawConsent(req, res) { /* ... */ }
}
```

### Services (`services/ConsentService.js`)
```javascript
class ConsentService {
  async createConsent(consent) { /* ... */ }
  async getConsentByUserId(userId) { /* ... */ }
  async withdrawConsent(userId) { /* ... */ }
}
```

### Routes (`routes/consent.js`)
```javascript
router.post('/', validateRequest(validateConsentData), (req, res) => {
  consentController.createConsent(req, res);
});
```

## 🔄 Data Flow

```
HTTP Request → Route → Controller → Service → Model → Response
     ↓           ↓         ↓          ↓        ↓        ↓
  Validation → Business → Data     → Storage → JSON → HTTP
             Logic      Operations
```

## 🚀 API Endpoints

### Consent Management
- `POST /api/consent` - Create consent record
- `GET /api/consent/:userId` - Get user consent
- `DELETE /api/consent/:userId` - Withdraw consent
- `GET /api/consent/audit/:userId` - Get consent audit trail

### System
- `GET /health` - Health check
- `GET /api/test` - Test endpoint

## 🔒 Security Features

1. **CORS Configuration**: Cross-origin request handling
2. **Rate Limiting**: Prevent abuse with express-rate-limit
3. **Input Validation**: Validate all incoming data
4. **Error Handling**: Secure error responses
5. **Logging**: Audit trail for all actions
6. **GDPR Compliance**: Data retention and consent management

## 📊 Current Status

### ✅ Working Features
- **Consent API**: Full CRUD operations
- **Health Checks**: System monitoring
- **Error Handling**: Consistent error responses
- **Logging**: Structured logging
- **Validation**: Input validation
- **CORS**: Cross-origin support

### 🔄 Future Enhancements

1. **Database Integration**: Replace in-memory storage with PostgreSQL
2. **Authentication**: JWT-based authentication
3. **File Upload**: Video/audio file handling
4. **AI Integration**: OpenAI API integration
5. **Real-time**: WebSocket support
6. **Testing**: Unit and integration tests
7. **Documentation**: API documentation with Swagger

## 🛠️ Development

### Running the Server
```bash
# Development (with nodemon)
npm run dev

# Production
npm start

# TypeScript (legacy)
npm run dev:ts
```

### Environment Variables
```env
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3005
JWT_SECRET=your-secret-key
DATABASE_URL=postgresql://...
OPENAI_API_KEY=your-openai-key
```

## 📋 Best Practices

1. **Error Handling**: Use try-catch blocks and proper HTTP status codes
2. **Validation**: Validate all inputs at the route level
3. **Logging**: Log important events and errors
4. **Security**: Never expose sensitive data in responses
5. **Performance**: Use appropriate HTTP status codes
6. **Documentation**: Document all API endpoints
7. **Testing**: Write tests for all critical functionality




