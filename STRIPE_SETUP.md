# Stripe Payment Integration Setup

## Required Environment Variables

Add these to your `.env` file in the backend directory:

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_...  # Your Stripe secret key
STRIPE_WEBHOOK_SECRET=whsec_...  # Your webhook endpoint secret

# Stripe Price IDs (create these in your Stripe dashboard)
STRIPE_BASIC_MONTHLY_PRICE_ID=price_...
STRIPE_PROFESSIONAL_MONTHLY_PRICE_ID=price_...
STRIPE_ENTERPRISE_MONTHLY_PRICE_ID=price_...
STRIPE_BASIC_YEARLY_PRICE_ID=price_...
STRIPE_PROFESSIONAL_YEARLY_PRICE_ID=price_...
STRIPE_ENTERPRISE_YEARLY_PRICE_ID=price_...

# Frontend URL for redirects
FRONTEND_URL=http://localhost:3000
```

## Stripe Dashboard Setup

### 1. Create Products and Prices

In your Stripe Dashboard, create the following products:

**Basic Plan**
- Product: "Basic Plan"
- Monthly Price: $9.99/month (recurring)
- Yearly Price: $99.99/year (recurring)

**Professional Plan**
- Product: "Professional Plan"  
- Monthly Price: $19.99/month (recurring)
- Yearly Price: $199.99/year (recurring)

**Enterprise Plan**
- Product: "Enterprise Plan"
- Monthly Price: $49.99/month (recurring)
- Yearly Price: $499.99/year (recurring)

### 2. Configure Webhooks

Add a webhook endpoint in Stripe Dashboard:
- URL: `https://yourdomain.com/billing/webhook`
- Events to send:
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.payment_succeeded`

### 3. Test Mode

For development, use test mode keys:
- Secret key starts with `sk_test_`
- Publishable key starts with `pk_test_`

## Frontend Environment Variables

Add to your frontend `.env.local`:

```bash
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
BACKEND_URL=http://localhost:8000
```

## Test Cards

Use these test card numbers in Stripe test mode:

- **Success**: 4242 4242 4242 4242
- **Declined**: 4000 0000 0000 0002
- **Requires Authentication**: 4000 0025 0000 3155

## API Endpoints

### Frontend Routes
- `POST /api/create-checkout-session` - Create Stripe checkout session
- `POST /api/cancel-subscription` - Cancel subscription

### Backend Routes
- `POST /billing/create-checkout-session` - Create checkout session
- `POST /billing/cancel-subscription` - Cancel subscription
- `POST /billing/webhook` - Handle Stripe webhooks

### Success/Cancel Pages
- `/billing/success` - Payment success page
- `/billing/cancel` - Payment cancelled page

## Testing the Integration

1. **Start both servers**:
   ```bash
   # Backend
   cd backend && python main.py
   
   # Frontend  
   cd frontend && npm run dev
   ```

2. **Test payment flow**:
   - Go to `/billing`
   - Click "Upgrade Now" on any plan
   - Complete checkout with test card
   - Verify success page and subscription status

3. **Test webhook** (optional):
   - Use Stripe CLI: `stripe listen --forward-to localhost:8000/billing/webhook`
   - Trigger test events from Stripe Dashboard

## Production Deployment

1. Replace test keys with live keys
2. Update webhook URL to production domain
3. Ensure HTTPS is enabled
4. Test with real payment methods

## Troubleshooting

- **Webhook errors**: Check webhook secret matches
- **Payment failures**: Verify price IDs are correct
- **Redirect issues**: Ensure FRONTEND_URL is set correctly
- **Authentication errors**: Check JWT token handling 