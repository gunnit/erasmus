# PayPal Sandbox Integration Setup

## Setup Instructions

### 1. Backend Configuration

Add these environment variables to your `.env` file (backend):

```env
# PayPal Configuration
PAYPAL_CLIENT_ID=YOUR_SANDBOX_CLIENT_ID_HERE
PAYPAL_CLIENT_SECRET=YOUR_SANDBOX_CLIENT_SECRET_HERE
PAYPAL_MODE=sandbox
PAYPAL_WEBHOOK_ID=
```

### 2. Frontend Configuration

Add to your `.env` file (frontend):

```env
# PayPal Client ID (for frontend SDK)
REACT_APP_PAYPAL_CLIENT_ID=YOUR_SANDBOX_CLIENT_ID_HERE
```

### 3. Get Your PayPal Sandbox Credentials

1. Go to https://developer.paypal.com/
2. Log in with your PayPal account
3. Navigate to "Dashboard" > "My Apps & Credentials"
4. Click on "Sandbox" tab
5. Create a new app or use existing one
6. Copy the Client ID and Secret

### 4. Test Accounts

PayPal provides test accounts for sandbox:
- Business account (merchant)
- Personal account (buyer)

Find them at: Dashboard > Sandbox > Accounts

### 5. Run Database Migration

```bash
cd backend
python run_migration.py
```

Or on Render:
```bash
python -m alembic upgrade head
```

### 6. Test the Flow

1. **Start the application**:
   ```bash
   ./start.sh
   ```

2. **Create a user account**:
   - Register at `/register`
   - Login at `/login`

3. **Navigate to pricing**:
   - Go to `/pricing`
   - Select a plan (Starter or Professional)

4. **Complete payment**:
   - You'll be redirected to PayPal sandbox
   - Use sandbox buyer account to complete payment
   - You'll be redirected back to `/payment-success`

5. **Verify subscription**:
   - Check Dashboard for subscription status
   - Try creating a proposal
   - Verify proposal credits are deducted

## Pricing Structure

### Starter Plan - €49
- 3 complete proposals
- 30-day access
- All features included
- Perfect for individual applicants

### Professional Plan - €149
- 15 complete proposals
- 90-day access
- Priority generation
- Perfect for consultants/organizations

## API Endpoints

### Payment Endpoints
- `GET /api/payments/pricing-plans` - Get available plans
- `POST /api/payments/create-order` - Create PayPal order
- `POST /api/payments/capture-order` - Capture payment
- `GET /api/payments/subscription-status` - Check subscription
- `GET /api/payments/payment-history` - User's payment history

### Protected Generation Endpoints
All generation endpoints now require valid subscription:
- `/api/form/generate-answers`
- `/api/form/progressive/start-generation`
- `/api/form/simple/generate-section`
- `/api/form/single/generate-single-answer`

## Testing Tips

1. **Test without real money**: Always use sandbox mode for development
2. **Check subscription status**: Use the Dashboard to monitor subscription
3. **Test edge cases**:
   - Expired subscription
   - Used all proposal credits
   - Payment failures
   - Refunds

## Troubleshooting

### Common Issues

1. **"No active subscription" error**:
   - User hasn't purchased a plan
   - Subscription expired
   - All proposal credits used

2. **PayPal redirect not working**:
   - Check PAYPAL_CLIENT_ID is set correctly
   - Verify return URLs are correct
   - Check CORS settings

3. **Payment not captured**:
   - Check PayPal API credentials
   - Verify order was approved by user
   - Check network/firewall settings

4. **Database errors**:
   - Run migrations: `alembic upgrade head`
   - Check DATABASE_URL is correct
   - Verify PostgreSQL is running

## Production Deployment

Before going live:

1. **Switch to Live Mode**:
   ```env
   PAYPAL_MODE=live
   PAYPAL_CLIENT_ID=YOUR_LIVE_CLIENT_ID
   PAYPAL_CLIENT_SECRET=YOUR_LIVE_CLIENT_SECRET
   ```

2. **Update URLs**:
   - Change return URLs to production domain
   - Update CORS settings

3. **Security**:
   - Never commit credentials to git
   - Use environment variables
   - Enable webhook validation
   - Implement rate limiting

4. **Testing**:
   - Test with small real payment first
   - Verify email notifications work
   - Test refund process

## Support

For PayPal integration issues:
- PayPal Developer Support: https://developer.paypal.com/support/
- API Documentation: https://developer.paypal.com/docs/