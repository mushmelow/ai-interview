# AI Interview Platform

A comprehensive AI-powered interview application with multi-language support (English/French), GDPR compliance, and advanced analytics.

## Features

### Core Features
- **Multi-language Support**: English and French interfaces
- **GDPR Compliance**: Full consent management and data retention policies
- **AI-Powered Analysis**: Speech-to-text, sentiment analysis, emotion detection
- **Real-time Interview**: WebRTC-based video/audio recording
- **Comprehensive Dashboard**: Interview management and analytics

### Technical Stack

#### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **i18next** for internationalization
- **React Router** for navigation
- **Socket.io Client** for real-time communication
- **WebRTC** for media handling

#### Backend
- **Node.js** with Express
- **TypeScript** for type safety
- **Socket.io** for real-time communication
- **PostgreSQL** for data storage
- **Redis** for session management
- **Winston** for logging
- **JWT** for authentication

#### AI Services
- **OpenAI Whisper** for speech-to-text
- **OpenAI GPT-4** for NLP analysis
- **MediaPipe** for facial emotion detection
- **Custom Python services** for data aggregation

## Project Structure

```
ai-interview/
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── i18n/           # Internationalization
│   │   └── ...
│   └── package.json
├── backend/                 # Node.js backend API
│   ├── src/
│   │   ├── routes/         # API routes
│   │   ├── middleware/     # Express middleware
│   │   ├── utils/          # Utility functions
│   │   └── ...
│   └── package.json
└── README.md
```

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- PostgreSQL (for production)
- Redis (for sessions)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ai-interview
   ```

2. **Install dependencies**
   ```bash
   npm run install:all
   ```

3. **Environment Setup**
   
   Backend environment variables:
   ```bash
   cd backend
   cp env.example .env
   # Edit .env with your configuration
   ```

4. **Start Development Servers**
   ```bash
   npm run dev
   ```

   This will start:
   - Frontend on http://localhost:3000
   - Backend on http://localhost:5000

### Environment Variables

#### Backend (.env)
```env
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
DATABASE_URL=postgresql://username:password@localhost:5432/ai_interview_db
JWT_SECRET=your-super-secret-jwt-key-here
OPENAI_API_KEY=your-openai-api-key-here
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
REDIS_URL=redis://localhost:6379
```

## GDPR Compliance

### Data Retention Policy
- **Raw video/audio recordings**: 30 days
- **Transcribed text**: 90 days  
- **AI analysis results**: 1 year
- **Anonymized analytics**: Indefinite

### Consent Management
- Explicit consent for each data type
- Consent withdrawal capability
- Audit trail for all consent actions
- Data deletion on request

### Privacy Features
- Data encryption at rest
- Secure data transmission
- IP address masking in logs
- User data export functionality

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Consent Management
- `POST /api/consent` - Record user consent
- `GET /api/consent/:userId` - Get user consent
- `DELETE /api/consent/:userId` - Withdraw consent
- `GET /api/consent/audit/:userId` - Consent audit trail

### Interview Management
- `POST /api/interview` - Create interview
- `GET /api/interview/:id` - Get interview details
- `PUT /api/interview/:id/start` - Start interview
- `PUT /api/interview/:id/complete` - Complete interview
- `GET /api/interview/user/:userId` - Get user interviews

## Development

### Available Scripts

#### Root Level
- `npm run dev` - Start both frontend and backend
- `npm run install:all` - Install all dependencies

#### Frontend
- `npm run start` - Start development server
- `npm run build` - Build for production
- `npm run test` - Run tests

#### Backend
- `npm run dev` - Start with nodemon
- `npm run build` - Compile TypeScript
- `npm run start` - Start production server

### Code Style
- TypeScript strict mode enabled
- ESLint configuration included
- Prettier formatting (recommended)

## Deployment

### Frontend (Vercel)
1. Connect repository to Vercel
2. Set build command: `cd frontend && npm run build`
3. Set output directory: `frontend/build`

### Backend (Railway/Render)
1. Connect repository
2. Set build command: `cd backend && npm run build`
3. Set start command: `cd backend && npm start`
4. Configure environment variables

### Database
- PostgreSQL for production data
- Redis for session storage
- AWS S3 for file storage

## Security

### Implemented Security Measures
- Helmet.js for security headers
- CORS configuration
- Rate limiting
- Input validation
- JWT authentication
- Password hashing (bcrypt)
- SQL injection prevention
- XSS protection

### Recommended Additional Security
- HTTPS enforcement
- API key rotation
- Database connection pooling
- Regular security audits
- Dependency vulnerability scanning

## Monitoring & Logging

### Logging
- Winston logger with multiple transports
- Structured logging with metadata
- Error tracking and alerting
- Performance monitoring

### Health Checks
- `/health` endpoint for monitoring
- Database connectivity checks
- External service status

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For support and questions:
- Create an issue in the repository
- Contact the development team

---

**Note**: This is a comprehensive AI interview platform. Ensure you have proper consent mechanisms and comply with local data protection laws before deploying to production.

