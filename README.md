# CVPerfect - AI-Powered Resume Enhancement Platform

CVPerfect is a full-stack application that helps users enhance their resumes using AI technology. The platform provides resume analysis, scoring, and personalized feedback to help users improve their job applications.

## Features

- Resume analysis and enhancement using Google Gemini AI
- Resume scoring and feedback
- Learning plan generation
- PDF and DOCX downloads
- Resume history tracking
- Subscription-based access
- AI chat assistant
- LinkedIn profile optimization
- Developer access codes

## Tech Stack

### Frontend
- Next.js 14
- TypeScript
- TailwindCSS
- Framer Motion
- NextAuth.js
- Stripe.js

### Backend
- Python FastAPI
- PostgreSQL
- SQLAlchemy
- Google Generative AI
- Stripe API

## Prerequisites

- Node.js 18+
- Python 3.9+
- PostgreSQL
- Stripe account
- Google AI API key

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Authentication
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret

# Backend API
BACKEND_URL=http://localhost:8000

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your-stripe-publishable-key
STRIPE_SECRET_KEY=your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=your-stripe-webhook-secret

# Google AI
GOOGLE_AI_API_KEY=your-google-ai-api-key

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/cvperfect

# Email
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-smtp-user
SMTP_PASSWORD=your-smtp-password
SMTP_FROM=noreply@cvperfect.com
```

## Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/cvperfect.git
cd cvperfect
```

2. Install frontend dependencies:
```bash
cd frontend
npm install
```

3. Install backend dependencies:
```bash
cd ../backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

4. Set up the database:
```bash
# Create a PostgreSQL database named 'cvperfect'
createdb cvperfect

# Run migrations
alembic upgrade head
```

5. Start the development servers:

Frontend:
```bash
cd frontend
npm run dev
```

Backend:
```bash
cd backend
uvicorn app.main:app --reload
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend: http://localhost:8000
- API Documentation: http://localhost:8000/docs

## Stripe Setup

1. Create a Stripe account and get your API keys
2. Create three products in Stripe:
   - Basic Plan ($9.99/month)
   - Professional Plan ($19.99/month)
   - Enterprise Plan ($49.99/month)
3. Update the price IDs in the frontend code

## Google AI Setup

1. Get a Google AI API key from the Google Cloud Console
2. Enable the Generative AI API
3. Add the API key to your environment variables

## Deployment

### Frontend
1. Build the Next.js application:
```bash
cd frontend
npm run build
```

2. Deploy to your preferred hosting platform (Vercel, Netlify, etc.)

### Backend
1. Set up a production server (e.g., DigitalOcean, AWS)
2. Install dependencies and set up the database
3. Use a production-grade ASGI server like Gunicorn:
```bash
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📧 Contact

David - [@yourtwitter](https://twitter.com/yourtwitter)

Project Link: [https://github.com/yourusername/cvperfect](https://github.com/yourusername/cvperfect) 