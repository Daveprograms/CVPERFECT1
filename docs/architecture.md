# CVPerfect Architecture Documentation

## Overview

CVPerfect is a production-ready AI-powered resume enhancement platform built with modern web technologies and best practices. The system follows a clean architecture pattern with clear separation of concerns between frontend, backend, ML services, and infrastructure.

## System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│    Frontend     │    │     Backend     │    │   ML Services   │
│   (Next.js)     │◄──►│   (FastAPI)     │◄──►│   (Python)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│     NGINX       │    │   PostgreSQL    │    │   Gemini AI     │
│  (Reverse Proxy) │    │   (Database)    │    │   (External)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Technology Stack

### Frontend
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Custom components with shadcn/ui
- **State Management**: React Context + Custom Hooks
- **Authentication**: JWT with custom auth provider
- **HTTP Client**: Fetch API with custom service layer

### Backend
- **Framework**: FastAPI
- **Language**: Python 3.11
- **Database**: PostgreSQL with SQLAlchemy ORM
- **Authentication**: JWT with Passlib
- **Task Queue**: Celery with Redis
- **File Processing**: PyPDF2, python-docx
- **AI Integration**: Google Gemini API

### ML Layer
- **NLP**: Custom text processing with TF-IDF
- **AI Analysis**: Google Gemini Pro
- **Question Generation**: AI-powered exam generation
- **Resume Parsing**: Custom text extraction and analysis

### Infrastructure
- **Containerization**: Docker with multi-stage builds
- **Reverse Proxy**: NGINX
- **Caching**: Redis
- **CI/CD**: GitHub Actions
- **Deployment**: Docker Compose (local), AWS/DigitalOcean (production)

## Directory Structure

```
cvperfect/
├── frontend/                 # Next.js application
│   ├── app/                 # App router pages
│   ├── components/          # Reusable UI components
│   ├── hooks/              # Custom React hooks
│   ├── services/           # API service layer
│   ├── types/              # TypeScript type definitions
│   ├── context/            # React context providers
│   ├── styles/             # Global styles and Tailwind config
│   └── utils/              # Frontend utilities
│
├── backend/                  # FastAPI backend
│   ├── app/
│   │   ├── api/            # API route handlers
│   │   ├── core/           # Core configuration and security
│   │   ├── models/         # SQLAlchemy database models
│   │   ├── schemas/        # Pydantic request/response schemas
│   │   ├── services/       # Business logic layer
│   │   ├── workers/        # Celery background tasks
│   │   └── utils/          # Backend utilities
│   └── tests/              # Backend tests
│
├── ml/                       # Machine learning services
│   ├── nlp/                # Natural language processing
│   ├── ranking/            # Job ranking algorithms
│   ├── exam_generator/     # Practice exam generation
│   ├── utils/              # ML utilities
│   └── notebooks/          # Jupyter notebooks
│
├── infra/                    # Infrastructure as code
│   ├── docker/             # Docker configurations
│   ├── nginx/              # NGINX configurations
│   ├── deployment/         # Deployment scripts
│   └── monitoring/         # Monitoring configurations
│
├── shared/                   # Cross-layer shared code
│   └── constants/          # Shared constants and types
│
├── .github/                  # CI/CD workflows
│   └── workflows/
│
└── docs/                     # Documentation
```

## Core Features

### 1. Resume Analysis
- **AI-Powered Analysis**: Uses Google Gemini AI for comprehensive resume evaluation
- **ATS Scoring**: Applicant Tracking System compatibility assessment
- **Keyword Extraction**: TF-IDF based keyword analysis
- **Structured Feedback**: Categorized improvement suggestions

### 2. AI Assistant Features
- **Cover Letter Generation**: Job-specific cover letter creation
- **Learning Path Generation**: Personalized skill development recommendations
- **Practice Exams**: Custom interview question generation based on resume gaps

### 3. User Management
- **Authentication**: JWT-based authentication with refresh tokens
- **Subscription Management**: Stripe integration for premium features
- **File Management**: Resume upload, versioning, and download

### 4. Analytics
- **User Analytics**: Progress tracking and performance insights
- **Usage Metrics**: Feature usage and subscription analytics

## Data Flow

### Resume Upload & Analysis
```
1. User uploads resume file (Frontend)
2. File validation and storage (Backend)
3. Text extraction from PDF/DOCX (ML Layer)
4. AI analysis using Gemini API (ML Layer)
5. Results stored in database (Backend)
6. Structured feedback returned (Frontend)
```

### AI Feature Generation
```
1. User requests AI feature (Frontend)
2. Resume and job description sent (Backend)
3. AI processing with Gemini API (ML Layer)
4. Generated content returned (Backend)
5. Results displayed to user (Frontend)
```

## Security

### Authentication & Authorization
- JWT tokens with configurable expiration
- Refresh token rotation
- Password hashing with bcrypt
- Role-based access control

### Data Protection
- Environment-based configuration
- Secure file upload with validation
- HTTPS enforcement in production
- CORS protection
- Rate limiting

### Infrastructure Security
- Non-root Docker containers
- Security headers via NGINX
- Container image scanning
- Dependency vulnerability scanning

## Scalability

### Horizontal Scaling
- Stateless backend services
- Redis for session storage
- Load balancing with NGINX
- Container orchestration ready

### Performance Optimization
- Multi-stage Docker builds
- Static asset optimization
- Database query optimization
- Caching strategies with Redis

### Monitoring & Observability
- Health check endpoints
- Structured logging
- Error tracking
- Performance metrics

## Development Workflow

### Local Development
```bash
# Start all services
docker-compose up -d

# Run frontend in development mode
cd frontend && npm run dev

# Run backend with hot reload
cd backend && uvicorn main:app --reload
```

### Testing
```bash
# Frontend tests
cd frontend && npm run test

# Backend tests
cd backend && pytest

# Integration tests
docker-compose -f docker-compose.test.yml up
```

### Deployment
1. **Continuous Integration**: Automated testing on pull requests
2. **Security Scanning**: Vulnerability scanning with Trivy
3. **Container Building**: Multi-arch Docker image building
4. **Deployment**: Automated deployment to production environment
5. **Health Checks**: Post-deployment verification

## Configuration

### Environment Variables
- **Database**: `DATABASE_URL`, `REDIS_URL`
- **Authentication**: `SECRET_KEY`, `ACCESS_TOKEN_EXPIRE_MINUTES`
- **AI Services**: `GEMINI_API_KEY`
- **Payment**: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
- **External URLs**: `FRONTEND_URL`, `NEXT_PUBLIC_API_URL`

### Feature Flags
- Subscription enforcement
- Premium feature access
- Debug logging levels
- AI model selection

## API Documentation

The backend API follows RESTful conventions and is fully documented with OpenAPI/Swagger at `/docs` endpoint.

### Key Endpoints
- `POST /api/auth/login` - User authentication
- `POST /api/resume/upload` - Resume file upload
- `POST /api/resume/analyze/{id}` - Resume analysis
- `POST /api/resume/cover-letter/{id}` - Cover letter generation
- `GET /api/user/subscription` - Subscription status

## Future Enhancements

### Planned Features
1. **Job Scraping & Matching**: Integration with job boards
2. **One-Click Application**: Automated job applications
3. **Advanced Analytics**: ML-powered insights
4. **Mobile App**: React Native mobile application
5. **API Partnerships**: Integration with LinkedIn, Indeed

### Technical Improvements
1. **Kubernetes Deployment**: Container orchestration
2. **Microservices**: Service decomposition
3. **GraphQL API**: Alternative to REST
4. **Real-time Features**: WebSocket integration
5. **Advanced Caching**: CDN and edge caching

## Contributing

See `CONTRIBUTING.md` for development guidelines and contribution process.

## License

This project is licensed under the MIT License - see `LICENSE` file for details. 