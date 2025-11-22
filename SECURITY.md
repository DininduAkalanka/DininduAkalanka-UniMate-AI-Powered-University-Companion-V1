# 🔒 Security Implementation Guide - UniMate

## Overview
This document outlines the security measures implemented in UniMate and provides guidance for maintaining security best practices.

## ✅ Implemented Security Features

### 1. API Key Management
- **Status**: ✅ Implemented
- **Changes Made**:
  - Removed all hardcoded API keys from source code
  - Environment variables loaded from `.env` file
  - `.env` added to `.gitignore` to prevent accidental commits
  - Created `.env.example` template for developers

**Action Required**:
```bash
# 1. Copy the example file
cp .env.example .env

# 2. Add your actual API keys to .env
# Never commit .env to version control!

# 3. Regenerate exposed keys:
# - Hugging Face: https://huggingface.co/settings/tokens
# - Firebase: https://console.firebase.google.com
```

**Files Modified**:
- `services/aiServiceEnhanced.ts` - Removed hardcoded API key
- `.gitignore` - Added .env protection
- `.env.example` - Created template

---

### 2. Firebase Security Rules
- **Status**: ✅ Implemented
- **Security Level**: Production-ready

**Features**:
- ✅ User authentication required for all operations
- ✅ Users can only access their own data
- ✅ Input validation (string lengths, data types)
- ✅ Rate limiting for chat messages (max 1 per 2 seconds)
- ✅ Schema validation for all documents
- ✅ Default deny-all policy

**Deploy Rules**:
```bash
# Using Firebase CLI
firebase deploy --only firestore:rules

# Or via Firebase Console:
# 1. Go to Firestore Database
# 2. Click "Rules" tab
# 3. Copy content from firestore.rules
# 4. Click "Publish"
```

**Testing Rules**:
```bash
firebase emulators:start --only firestore
```

---

### 3. Rate Limiting
- **Status**: ✅ Implemented
- **Type**: Client-side + Server-side validation

**Rate Limits Configured**:
| Feature | Limit | Window |
|---------|-------|--------|
| AI Chat Messages | 30 requests | 1 minute |
| API Requests | 100 requests | 1 minute |
| Task Creation | 50 requests | 1 hour |
| Course Creation | 20 requests | 1 hour |
| Auth Attempts | 5 requests | 15 minutes |

**Usage Example**:
```typescript
import { chatRateLimiter } from './utils/rateLimiter';

async function sendMessage(userId: string, message: string) {
  const result = await chatRateLimiter.checkLimit(userId);
  
  if (!result.allowed) {
    throw new Error(`Rate limit exceeded. Try again in ${result.retryAfter}s`);
  }
  
  // Process message
}
```

**Files Created**:
- `utils/rateLimiter.ts` - Rate limiting implementation

---

### 4. Error Tracking (Sentry)
- **Status**: ✅ Framework Implemented (Ready for Sentry installation)
- **Current State**: Logging-based fallback active

**Features**:
- ✅ Global error handler
- ✅ User context tracking
- ✅ Breadcrumb logging
- ✅ Performance metrics
- ✅ Network error tracking
- ✅ Error boundary support

**To Enable Full Sentry Integration**:

1. **Install Sentry**:
```bash
npm install @sentry/react-native
npx @sentry/wizard -i reactNative
```

2. **Get Sentry DSN**:
   - Sign up at https://sentry.io
   - Create new project (React Native)
   - Copy your DSN

3. **Add to .env**:
```env
EXPO_PUBLIC_SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
EXPO_PUBLIC_SENTRY_ENVIRONMENT=production
```

4. **Uncomment Code**:
   - Open `utils/errorTracking.ts`
   - Uncomment all Sentry-related code (marked with TODO)

**Usage**:
```typescript
import { errorTracker, trackUserAction } from './utils/errorTracking';

// Set user context
errorTracker.setUser({ userId: user.id, email: user.email });

// Track errors
try {
  // risky operation
} catch (error) {
  errorTracker.captureError(error, {
    screen: 'TaskScreen',
    action: 'create_task',
  });
}

// Track user actions
trackUserAction('task_created', 'TaskScreen', { taskId: '123' });
```

**Files Created**:
- `utils/errorTracking.ts` - Error tracking framework

---

## 🚨 Critical Security Checklist

### Before Production Deployment

- [ ] **Rotate all API keys** (old keys were exposed in git)
  - [ ] Hugging Face API key
  - [ ] Firebase API key
  - [ ] Any other service keys

- [ ] **Deploy Firebase Security Rules**
  ```bash
  firebase deploy --only firestore:rules
  ```

- [ ] **Enable Firebase App Check** (Recommended)
  - Go to Firebase Console → App Check
  - Register your app
  - Add App Check enforcement

- [ ] **Set up Sentry** (Production monitoring)
  - Install @sentry/react-native
  - Configure DSN in .env
  - Test error reporting

- [ ] **Review Firebase Authentication**
  - Enable email verification
  - Set up password policies
  - Configure OAuth providers properly

- [ ] **Enable HTTPS only** (Firebase hosting)
  - Configure in Firebase Console

- [ ] **Set up monitoring alerts**
  - Sentry alerts for critical errors
  - Firebase monitoring for performance
  - Firestore quota alerts

---

## 🔐 Security Best Practices

### Environment Variables
```bash
# ✅ DO
EXPO_PUBLIC_API_KEY=your_key_here

# ❌ DON'T
const API_KEY = 'hardcoded_key_123';
```

### User Data Protection
```typescript
// ✅ DO - Validate and sanitize input
if (data.name.length > 100) {
  throw new Error('Name too long');
}

// ❌ DON'T - Trust user input blindly
await saveUser(rawUserData);
```

### Error Messages
```typescript
// ✅ DO - Generic error messages to users
throw new Error('Unable to process request');

// ❌ DON'T - Expose internals
throw new Error(`Database error: ${dbError.stack}`);
```

### Rate Limiting
```typescript
// ✅ DO - Implement rate limiting
const result = await rateLimiter.checkLimit(userId);
if (!result.allowed) {
  return error('Too many requests');
}

// ❌ DON'T - Allow unlimited requests
await processRequest(data);
```

---

## 📋 Security Testing Checklist

### Authentication
- [ ] Cannot access other users' data
- [ ] Invalid tokens are rejected
- [ ] Password reset works securely
- [ ] Session timeout works

### Authorization
- [ ] Users can only read their own data
- [ ] Users can only modify their own data
- [ ] Admin operations require admin role
- [ ] Firestore rules block unauthorized access

### Rate Limiting
- [ ] Chat rate limiting works (30/min)
- [ ] API rate limiting works (100/min)
- [ ] Auth rate limiting works (5/15min)
- [ ] Proper error messages shown

### Data Validation
- [ ] Input length validation works
- [ ] Type validation works
- [ ] Enum validation works
- [ ] Date validation works

### Error Handling
- [ ] Errors are logged properly
- [ ] Sensitive data not in logs
- [ ] User-friendly error messages
- [ ] Sentry tracking works (if enabled)

---

## 🛠️ Maintenance

### Regular Security Tasks

**Weekly**:
- Review Sentry error reports
- Check rate limiting effectiveness
- Monitor Firebase usage quotas

**Monthly**:
- Review Firebase Security Rules
- Update dependencies for security patches
- Audit API key usage
- Review user access logs

**Quarterly**:
- Rotate API keys
- Security audit of new features
- Review and update security rules
- Penetration testing (if applicable)

---

## 🔗 Resources

### Documentation
- [Firebase Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Sentry React Native](https://docs.sentry.io/platforms/react-native/)
- [OWASP Mobile Security](https://owasp.org/www-project-mobile-security/)

### Tools
- [Firebase Emulator](https://firebase.google.com/docs/emulator-suite)
- [Sentry Dashboard](https://sentry.io)
- [Security Headers Checker](https://securityheaders.com)

---

## 📞 Support

For security concerns or questions:
1. Review this documentation
2. Check Firebase/Sentry documentation
3. Consult with security team
4. Never commit sensitive data to git

---

**Last Updated**: November 22, 2025
**Version**: 1.0.0
**Status**: Production Ready (with Sentry pending)
