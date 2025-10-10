# DEPLOYMENT CHECKLIST - Erasmus+ Grant Application System

## 🚨 PRE-DEPLOYMENT CRITICAL FIXES (30 minutes)

### ✅ 1. Database Upgrade (10 min) - **EXPIRES OCT 11!**
- [ ] Go to [Render Dashboard - erasmus-db](https://dashboard.render.com/d/dpg-d31ga1be5dus73atavj0-a)
- [ ] Click "Upgrade Plan"
- [ ] Select **"Basic"** ($7/month - 1GB RAM, 10GB storage)
- [ ] Confirm upgrade
- [ ] Verify database status shows "available"
- [ ] Test connection: `curl https://erasmus-backend.onrender.com/api/health/ready`

**Status:** ⏰ URGENT - Database expires Oct 11, 2025 at 17:21 UTC

---

### ✅ 2. Fix bcrypt Authentication (15 min) - **BLOCKING ALL USERS**
- [x] Update `requirements.txt`: `passlib[bcrypt]>=1.7.5` (COMPLETED)
- [ ] Commit changes:
  ```bash
  cd /mnt/c/Dev/gyg4
  git add backend/requirements.txt
  git commit -m "fix: Update passlib for bcrypt 4.0+ compatibility"
  git push origin main
  ```
- [ ] Wait for Render auto-deploy (2-3 minutes)
- [ ] Monitor deployment at [Backend Service](https://dashboard.render.com/web/srv-d31gaqje5dus73atbsg0)
- [ ] Verify deployment logs show "Build successful"
- [ ] Test authentication:
  ```bash
  # Test registration
  curl -X POST https://erasmus-backend.onrender.com/api/auth/register \
    -H "Content-Type: application/json" \
    -d '{
      "username": "test_deployment",
      "email": "test@deployment.com",
      "password": "TestPass123!",
      "full_name": "Test Deployment"
    }'

  # Should return 200 OK with user data (NOT 500 error)
  ```

**Status:** 🔴 CRITICAL - 100% of authentication broken

---

### ✅ 3. Change SECRET_KEY (5 min) - **SECURITY RISK**
- [ ] Generate secure key:
  ```bash
  python3 -c "import secrets; print(secrets.token_urlsafe(32))"
  ```
- [ ] Copy the generated key
- [ ] Go to [Backend Environment](https://dashboard.render.com/web/srv-d31gaqje5dus73atbsg0)
- [ ] Navigate to "Environment" tab
- [ ] Add/Update environment variable:
  - **Key:** `SECRET_KEY`
  - **Value:** `<paste_generated_key>`
- [ ] Click "Save Changes" (triggers automatic redeploy)
- [ ] Wait for deployment (2-3 min)
- [ ] Verify new tokens are issued:
  ```bash
  # Login and check JWT payload
  curl -X POST https://erasmus-backend.onrender.com/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"username":"test_deployment","password":"TestPass123!"}' \
    | jq -r '.access_token'
  ```

**Status:** 🔴 CRITICAL - JWT tokens can be forged

---

## ⚙️ ENVIRONMENT VARIABLES CONFIGURATION

### Required Variables (Render Dashboard → Environment)

**Backend Service:** [erasmus-backend](https://dashboard.render.com/web/srv-d31gaqje5dus73atbsg0)

#### Critical (Must Configure):
- [ ] `OPENAI_API_KEY` - OpenAI API key (already set, verify it's not placeholder)
- [ ] `SECRET_KEY` - JWT secret (change from default)
- [ ] `DATABASE_URL` - Auto-configured by Render ✅
- [ ] `DEBUG` - Set to `False` for production

#### Payment System (Required for payments):
- [ ] `PAYPAL_CLIENT_ID` - From [PayPal Developer Dashboard](https://developer.paypal.com/dashboard/)
- [ ] `PAYPAL_CLIENT_SECRET` - From PayPal Developer Dashboard
- [ ] `PAYPAL_MODE` - Set to `sandbox` for testing, `live` for production
- [ ] `PAYPAL_WEBHOOK_ID` - From PayPal webhook setup

#### Optional (Enhances features):
- [ ] `FIRECRAWL_API_KEY` - For partner web crawling ([Get key](https://firecrawl.dev))

---

## 🔍 POST-DEPLOYMENT VERIFICATION

### 1. Health Checks
```bash
# Basic health check
curl https://erasmus-backend.onrender.com/api/health/

# Comprehensive readiness check
curl https://erasmus-backend.onrender.com/api/health/ready | jq .

# Expected: all checks show "healthy" or "configured"
```

### 2. Authentication Flow
```bash
# Register new user
curl -X POST https://erasmus-backend.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "verify_user",
    "email": "verify@test.com",
    "password": "Verify123!",
    "full_name": "Verify Test"
  }'

# Login
curl -X POST https://erasmus-backend.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"verify_user","password":"Verify123!"}'

# Expected: Returns access_token (JWT)
```

### 3. Core API Endpoints
```bash
# Get JWT token from login response
TOKEN="<paste_token_here>"

# Test form questions
curl https://erasmus-backend.onrender.com/api/form/questions \
  -H "Authorization: Bearer $TOKEN"

# Test EU priorities
curl https://erasmus-backend.onrender.com/api/form/priorities \
  -H "Authorization: Bearer $TOKEN"

# Test public stats (no auth)
curl https://erasmus-backend.onrender.com/api/analytics/public-stats
```

### 4. Database Connectivity
```bash
# Health check includes database test
curl https://erasmus-backend.onrender.com/api/health/ready | jq '.checks.database'

# Expected: {"status":"healthy","message":"PostgreSQL connection successful"}
```

### 5. AI Generation (If OpenAI configured)
```bash
# Test with valid subscription user
# Create minimal test proposal
curl -X POST https://erasmus-backend.onrender.com/api/proposals/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test AI Generation",
    "project_idea": "Testing deployment",
    "priorities": ["Digital transformation"],
    "target_groups": ["Adult educators"],
    "partners": [],
    "status": "draft"
  }'
```

---

## 📊 MONITORING & LOGS

### Check Deployment Logs
1. Go to [Backend Logs](https://dashboard.render.com/web/srv-d31gaqje5dus73atbsg0/logs)
2. Look for:
   - ✅ "Build successful"
   - ✅ "Deploy live"
   - ❌ No bcrypt errors
   - ❌ No 500 errors on /auth/* endpoints

### Monitor Error Patterns
Search logs for:
```
- "bcrypt" (should have ZERO matches)
- "CREDIT_DEDUCTION" (verify credit system working)
- "CREDIT_CHECK" (track proposal credit usage)
- "ERROR" (general errors)
- "500" (server errors)
```

### Key Metrics to Track
- **Authentication Success Rate:** Should be ~100% after bcrypt fix
- **API Response Time:** Should be <500ms for most endpoints
- **Database Queries:** Should complete <100ms
- **AI Generation Time:** 30-120 seconds per proposal

---

## 🔧 TROUBLESHOOTING

### Issue: Authentication Still Failing (500 Error)
**Solutions:**
1. Check deployment logs for errors
2. Verify passlib version: `pip list | grep passlib` (should be >=1.7.5)
3. Clear Render build cache: Dashboard → Settings → "Clear build cache"
4. Manual redeploy: Dashboard → Manual Deploy → "Deploy latest commit"

### Issue: Database Connection Failed
**Solutions:**
1. Verify database is upgraded (not expired)
2. Check DATABASE_URL is set correctly
3. Restart database: Render Dashboard → erasmus-db → Suspend → Resume

### Issue: PayPal Payments Not Working
**Solutions:**
1. Verify all PayPal env vars are set (not empty strings)
2. Check PayPal mode matches environment (sandbox vs live)
3. Test webhook endpoint: `/api/webhooks/paypal-webhook`
4. Review PayPal logs in developer dashboard

### Issue: AI Generation Failing
**Solutions:**
1. Verify OPENAI_API_KEY is valid (not placeholder)
2. Check OpenAI API quota/billing
3. Test with smaller prompt
4. Check logs for specific OpenAI errors

### Issue: Credits Not Deducting
**Solutions:**
1. Check Render logs for `[CREDIT_CHECK]` and `[CREDIT_DEDUCTION]` messages
2. Verify proposal status changes to "complete"
3. Ensure user has active subscription
4. Check PayPal payment completed successfully

---

## 📈 SUCCESS CRITERIA

### ✅ Deployment Successful When:
- [ ] Database is upgraded and not expired
- [ ] bcrypt authentication works (no 500 errors)
- [ ] SECRET_KEY is changed from default
- [ ] Health check returns all green
- [ ] Users can register and login
- [ ] AI generation creates proposals
- [ ] Proposals save to database
- [ ] Credit deduction works (check logs)
- [ ] No critical errors in logs
- [ ] Frontend can communicate with backend

### 📊 Performance Benchmarks:
- Health check: <100ms
- Authentication: <500ms
- Form questions: <200ms
- AI generation: 30-120 seconds
- Database queries: <100ms

---

## 🚀 OPTIONAL ENHANCEMENTS (Post-Launch)

### Week 1:
- [ ] Enable monitoring (Sentry, DataDog, or similar)
- [ ] Set up automated backups (Render dashboard)
- [ ] Configure PayPal webhooks (production)
- [ ] Implement rate limiting
- [ ] Add structured logging

### Week 2:
- [ ] Load testing (simulate 50-100 concurrent users)
- [ ] Security audit (penetration testing)
- [ ] Performance optimization
- [ ] A/B testing for UX improvements
- [ ] Multi-language support (Italian)

### Week 3:
- [ ] Implement auto-renewal for subscriptions
- [ ] Add email notifications
- [ ] Create admin dashboard
- [ ] Advanced analytics
- [ ] API documentation (Swagger/OpenAPI)

---

## 📝 ROLLBACK PLAN

### If Deployment Fails:

1. **Immediate Rollback:**
   ```bash
   # Revert to previous commit
   git revert HEAD
   git push origin main
   # Render will auto-deploy previous version
   ```

2. **Database Rollback:**
   - If upgraded: Database remains upgraded (data safe)
   - If migrations failed: Restore from backup

3. **Environment Variables:**
   - Render keeps history: Environment → History → Restore previous

4. **Emergency Contacts:**
   - Render Support: https://render.com/docs/support
   - GitHub Issues: https://github.com/anthropics/claude-code/issues

---

## 🎯 DEPLOYMENT TIMELINE

**Total Time:** ~2.5 hours

| Task | Time | Cumulative | Priority |
|------|------|------------|----------|
| Database Upgrade | 10 min | 10 min | 🔴 CRITICAL |
| bcrypt Fix & Deploy | 15 min | 25 min | 🔴 CRITICAL |
| SECRET_KEY Change | 5 min | 30 min | 🔴 CRITICAL |
| PayPal Configuration | 1 hour | 1h 30min | 🟠 HIGH |
| Testing & Verification | 30 min | 2 hours | 🟠 HIGH |
| Monitoring Setup | 30 min | 2h 30min | 🟡 MEDIUM |

---

**Last Updated:** 2025-10-10
**Next Review:** After deployment completion
**Deployment Status:** 🔴 PENDING - Critical fixes required
