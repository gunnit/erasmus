# Setup Guide - Get Your Grant Application

This guide provides detailed instructions for setting up the Get Your Grant application in both development and production environments.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Development Setup](#development-setup)
- [Backend Configuration](#backend-configuration)
- [Frontend Configuration](#frontend-configuration)
- [Database Setup](#database-setup)
- [OpenAI Configuration](#openai-configuration)
- [PayPal Configuration](#paypal-configuration)
- [Email Configuration](#email-configuration)
- [Production Setup](#production-setup)
- [Troubleshooting](#troubleshooting)

## Prerequisites

### System Requirements

- **Operating System**: Windows 10+, macOS 10.15+, or Linux (Ubuntu 18.04+)
- **Python**: 3.8 or higher
- **Node.js**: 16.0 or higher
- **npm**: 7.0 or higher
- **PostgreSQL**: 12.0 or higher
- **Git**: Latest version

### Required Accounts

1. **OpenAI Account**: For AI functionality
   - Sign up at [OpenAI Platform](https://platform.openai.com/)
   - Generate API key
   - Create an Assistant (optional, can be done programmatically)

2. **PayPal Developer Account**: For payment processing
   - Sign up at [PayPal Developer](https://developer.paypal.com/)
   - Create sandbox and live applications

3. **Email Service**: For notifications (Gmail SMTP used by default)
   - Gmail account with App Password enabled

## Development Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd projectschoolv2
```

### 2. Backend Setup (Django)

#### Navigate to Backend Directory
```bash
cd pschool-master
```

#### Create Virtual Environment
```bash
# Windows
python -m venv venv
venv\Scripts\activate

# macOS/Linux
python3 -m venv venv
source venv/bin/activate
```

#### Install Python Dependencies
```bash
pip install --upgrade pip
pip install -r requirements.txt
```

#### Environment Configuration
```bash
# Copy environment template
cp .env.sample .env

# Edit .env file with your configuration
# See Backend Configuration section below
```

#### Database Migration
```bash
python manage.py migrate
```

#### Create Superuser (Optional)
```bash
python manage.py createsuperuser
```

#### Start Development Server
```bash
python manage.py runserver
```

The backend will be available at `http://localhost:8000`

### 3. Frontend Setup (React)

#### Navigate to Frontend Directory
```bash
cd project-school-front-end-main/project-school-front-end-main
```

#### Install Node Dependencies
```bash
npm install
```

#### Start Development Server
```bash
npm run dev
```

The frontend will be available at `http://localhost:5173`

## Backend Configuration

### Environment Variables (.env)

Create a `.env` file in the `pschool-master` directory:

```env
# Django Configuration
SECRET_KEY=your-very-long-secret-key-here
DEBUG=True

# Database Configuration
PGNAME=getyourgrant_db
PGUSER=postgres
PGPASSWORD=your_password
PGHOST=localhost
PGPORT=5432

# OpenAI Configuration
OPENAI_API_KEY=sk-your-openai-api-key
ASSISTANT_ID=asst_your-assistant-id

# Email Configuration (Gmail SMTP)
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password

# PayPal Configuration
PAYPAL_CLIENT_ID=your-paypal-client-id
PAYPAL_SECRET=your-paypal-secret
PAYPAL_TEST=True  # Set to False for production
```

### Generating Secret Key

```python
# Run in Python shell
from django.core.management.utils import get_random_secret_key
print(get_random_secret_key())
```

## Frontend Configuration

### API Base URL

The frontend is configured to communicate with the backend. If you're running on different ports or domains, update the API configuration:

```typescript
// src/app/modules/api/config.ts
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://api.getyourgrant.eu' 
  : 'http://localhost:8000';
```

### Environment Variables

Create a `.env` file in the frontend directory if needed:

```env
VITE_API_BASE_URL=http://localhost:8000
```

## Database Setup

### PostgreSQL Installation

#### Windows
1. Download PostgreSQL from [official website](https://www.postgresql.org/download/windows/)
2. Run installer and follow setup wizard
3. Remember the password for the `postgres` user

#### macOS
```bash
# Using Homebrew
brew install postgresql
brew services start postgresql

# Create database user
createuser -s postgres
```

#### Linux (Ubuntu)
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Set password for postgres user
sudo -u postgres psql
\password postgres
\q
```

### Database Creation

```sql
-- Connect to PostgreSQL as postgres user
psql -U postgres -h localhost

-- Create database
CREATE DATABASE getyourgrant_db;

-- Create user (optional)
CREATE USER getyourgrant_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE getyourgrant_db TO getyourgrant_user;

-- Exit
\q
```

### Database Migration

```bash
cd pschool-master
python manage.py makemigrations
python manage.py migrate
```

## OpenAI Configuration

### 1. Get API Key

1. Visit [OpenAI Platform](https://platform.openai.com/)
2. Sign in or create account
3. Navigate to API Keys section
4. Create new secret key
5. Copy the key (starts with `sk-`)

### 2. Create Assistant (Optional)

You can create an assistant through the OpenAI dashboard or let the application create one automatically:

```python
# In Django shell (python manage.py shell)
from assistant.openai_methods import client

assistant = client.beta.assistants.create(
    name="Grant Application Assistant",
    instructions="You are a helpful assistant for creating EU grant applications...",
    model="gpt-4",
    tools=[{"type": "file_search"}]
)

print(f"Assistant ID: {assistant.id}")
```

### 3. Configure Vector Stores

Vector stores are created automatically for each user when they register.

## PayPal Configuration

### 1. Create PayPal App

1. Visit [PayPal Developer Dashboard](https://developer.paypal.com/)
2. Log in with your PayPal account
3. Create new app
4. Choose "Default Application" type
5. Select sandbox for development
6. Copy Client ID and Secret

### 2. Sandbox Testing

For development, use PayPal sandbox:
- Test buyer accounts: Available in sandbox dashboard
- Test credit cards: Use PayPal's test card numbers

### 3. Production Setup

For production:
1. Create live app in PayPal dashboard
2. Update `PAYPAL_TEST=False` in environment
3. Use live Client ID and Secret

## Email Configuration

### Gmail SMTP Setup

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate App Password**:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate password for "Mail"
3. **Update Environment Variables**:
   ```env
   EMAIL_HOST_USER=your-email@gmail.com
   EMAIL_HOST_PASSWORD=generated-app-password
   ```

### Alternative Email Providers

For other email providers, update `settings.py`:

```python
# For SendGrid
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.sendgrid.net'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = 'apikey'
EMAIL_HOST_PASSWORD = 'your-sendgrid-api-key'
```

## Production Setup

### Environment Variables

```env
# Production settings
DEBUG=False
SECRET_KEY=your-production-secret-key

# Database (use production database)
PGNAME=production_db_name
PGUSER=production_user
PGPASSWORD=strong_production_password
PGHOST=your-db-host
PGPORT=5432

# OpenAI (same as development)
OPENAI_API_KEY=sk-your-openai-api-key
ASSISTANT_ID=asst_your-assistant-id

# PayPal (live credentials)
PAYPAL_CLIENT_ID=live-client-id
PAYPAL_SECRET=live-secret
PAYPAL_TEST=False

# Email (production email service)
EMAIL_HOST_USER=noreply@yourdomain.com
EMAIL_HOST_PASSWORD=production-email-password
```

### Static Files

```bash
# Collect static files for production
python manage.py collectstatic --noinput
```

### Frontend Build

```bash
cd project-school-front-end-main/project-school-front-end-main
npm run build
```

### Security Checklist

- [ ] Set `DEBUG=False`
- [ ] Use strong `SECRET_KEY`
- [ ] Configure HTTPS
- [ ] Set proper `ALLOWED_HOSTS`
- [ ] Use environment variables for secrets
- [ ] Enable database connection encryption
- [ ] Configure proper CORS settings
- [ ] Set up monitoring and logging

## Troubleshooting

### Common Issues

#### 1. Database Connection Error

**Error**: `django.db.utils.OperationalError: could not connect to server`

**Solutions**:
- Verify PostgreSQL is running
- Check database credentials in `.env`
- Ensure database exists
- Check firewall settings

#### 2. OpenAI API Error

**Error**: `openai.error.AuthenticationError: Incorrect API key`

**Solutions**:
- Verify API key is correct
- Check API key has sufficient credits
- Ensure API key is properly set in environment

#### 3. PayPal Integration Error

**Error**: Payment creation fails

**Solutions**:
- Verify PayPal credentials
- Check sandbox vs live environment settings
- Ensure proper redirect URLs

#### 4. Frontend API Connection Error

**Error**: CORS or network errors

**Solutions**:
- Verify backend is running
- Check CORS settings in Django
- Ensure API URLs are correct
- Check browser console for detailed errors

#### 5. Email Sending Error

**Error**: `SMTPAuthenticationError`

**Solutions**:
- Verify Gmail app password
- Check 2FA is enabled
- Ensure correct SMTP settings

### Debug Mode

Enable debug logging:

```python
# In settings.py
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
        },
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': 'DEBUG',
        },
    },
}
```

### Performance Optimization

For production environments:

1. **Database Optimization**:
   - Add database indexes
   - Configure connection pooling
   - Enable query optimization

2. **Caching**:
   - Configure Redis for caching
   - Enable Django cache framework

3. **Static Files**:
   - Use CDN for static files
   - Enable gzip compression

### Health Checks

Create health check endpoints:

```python
# In views.py
def health_check(request):
    return JsonResponse({'status': 'healthy'})
```

## Next Steps

After successful setup:

1. **Test the Application**: Create a test user and try creating a proposal
2. **Configure Monitoring**: Set up logging and monitoring
3. **Backup Strategy**: Implement database backup procedures
4. **Documentation**: Review API documentation and user guides
5. **Security Review**: Conduct security assessment

For additional help, refer to:
- [API Documentation](API.md)
- [User Guide](USER_GUIDE.md)
- [Developer Guide](DEVELOPER_GUIDE.md)
