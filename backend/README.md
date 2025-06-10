# CVPerfect Backend

The backend service for CVPerfect, an AI-powered resume optimization and career development platform.

## Features

- Resume Analysis and Enhancement using Google's Gemini AI
- User Authentication and Authorization
- Subscription Management with Stripe Integration
- Analytics and Insights
- LinkedIn Profile Integration
- Learning Path Generation
- Cover Letter Generation

## Tech Stack

- FastAPI
- PostgreSQL
- SQLAlchemy
- Google Gemini AI
- Stripe
- JWT Authentication

## Prerequisites

- Python 3.8+
- PostgreSQL
- Google Cloud Account (for Gemini AI)
- Stripe Account

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost/cvperfect

# Security
SECRET_KEY=your-secret-key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Google Gemini AI
GEMINI_API_KEY=your-gemini-api-key

# Stripe
STRIPE_SECRET_KEY=your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=your-stripe-webhook-secret
STRIPE_PRO_MONTHLY_PRICE_ID=your-stripe-price-id
STRIPE_PRO_YEARLY_PRICE_ID=your-stripe-price-id
STRIPE_ONE_TIME_PRICE_ID=your-stripe-price-id
```

## Setup

1. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Initialize the database:
```bash
alembic upgrade head
```

4. Run the development server:
```bash
uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000`. API documentation can be accessed at `http://localhost:8000/docs`.

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/token` - Login and get access token
- `GET /api/auth/me` - Get current user info
- `PUT /api/auth/me` - Update user info

### Resume Management
- `POST /api/resume/upload` - Upload a new resume
- `POST /api/resume/analyze/{resume_id}` - Analyze a resume
- `POST /api/resume/enhance/{resume_id}` - Enhance a resume
- `POST /api/resume/cover-letter/{resume_id}` - Generate a cover letter
- `POST /api/resume/learning-path/{resume_id}` - Generate a learning path
- `GET /api/resume/list` - List user's resumes
- `GET /api/resume/{resume_id}` - Get resume details
- `DELETE /api/resume/{resume_id}` - Delete a resume

### Billing
- `POST /api/billing/create-subscription` - Create a new subscription
- `POST /api/billing/webhook` - Handle Stripe webhooks
- `GET /api/billing/plans` - Get available subscription plans
- `GET /api/billing/current-subscription` - Get current subscription

### Analytics
- `GET /api/analytics/user-insights` - Get user insights
- `GET /api/analytics/global-analytics` - Get global analytics (admin only)
- `GET /api/analytics/resume-analytics/{resume_id}` - Get resume-specific analytics

## Testing

Run tests using pytest:
```bash
pytest
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 