# 🚀 Pre-Deployment Security Checklist

Use this checklist before deploying to production or releasing to users.

## 🔴 CRITICAL - Must Complete

### API Keys & Secrets
- [ ] **Rotate ALL exposed API keys**
  - [ ] Hugging Face API key rotated (old one was `[REDACTED]`)
  - [ ] Firebase API keys rotated (old one was `[REDACTED]`)
  - [ ] All old keys revoked/deleted
  - [ ] New keys added to `.env`
  - [ ] `.env` is in `.gitignore`

- [ ] **No hardcoded secrets in code**
  ```bash
  # Run check:
  npm run security:check
  
  # Should output: "No hardcoded secrets found ✓"
  ```

### Firebase Security
- [ ] **Deploy production Firestore rules**
  ```bash
  firebase deploy --only firestore:rules
  ```
  
- [ ] **Test Firestore rules**
  - [ ] Users can only read their own data
  - [ ] Users cannot read other users' data
  - [ ] Rate limiting works (chat: 1 msg/2sec)
  - [ ] Input validation rejects invalid data

- [ ] **Enable Firebase App Check** (Recommended)
  - [ ] Registered app in Firebase console
  - [ ] App Check SDK integrated
  - [ ] Enforcement mode enabled

### Authentication
- [ ] **Firebase Auth properly configured**
  - [ ] Email/Password provider enabled
  - [ ] Email verification enabled
  - [ ] Password reset works
  - [ ] Account deletion works

---

## 🟡 HIGH PRIORITY - Strongly Recommended

### Rate Limiting
- [ ] **Test all rate limits**
  - [ ] AI Chat: 30 requests/minute
  - [ ] API: 100 requests/minute
  - [ ] Task creation: 50/hour
  - [ ] Course creation: 20/hour
  - [ ] Auth: 5 attempts/15min

- [ ] **Rate limit error messages are user-friendly**

### Error Tracking
- [ ] **Sentry configured** (if using)
  - [ ] Sentry DSN added to `.env`
  - [ ] `@sentry/react-native` installed
  - [ ] Error tracking code uncommented
  - [ ] Test error sent successfully
  - [ ] Alerts configured

- [ ] **OR** Alternative logging configured

### Data Protection
- [ ] **Sensitive data handling**
  - [ ] Passwords never logged
  - [ ] Email addresses protected
  - [ ] Personal data not in error logs
  - [ ] API keys not in logs

### Network Security
- [ ] **HTTPS only**
  - [ ] Firebase hosting uses HTTPS
  - [ ] API endpoints use HTTPS
  - [ ] No mixed content warnings

---

## 🟢 MEDIUM PRIORITY - Recommended

### Code Quality
- [ ] **Security scan completed**
  ```bash
  npm audit
  npm audit fix
  ```

- [ ] **Dependencies updated**
  - [ ] No critical vulnerabilities
  - [ ] All packages recent versions

### Performance
- [ ] **Rate limiting not too restrictive**
  - [ ] Users can complete normal tasks
  - [ ] Limits tested with real usage patterns

### Documentation
- [ ] **Security documentation reviewed**
  - [ ] SECURITY.md is accurate
  - [ ] QUICKSTART.md tested
  - [ ] .env.example up to date

### Testing
- [ ] **Security tests passed**
  - [ ] Authentication tests
  - [ ] Authorization tests
  - [ ] Rate limiting tests
  - [ ] Input validation tests

---

## 📋 Pre-Deployment Commands

Run these commands before deploying:

```bash
# 1. Check for secrets
npm run security:check

# 2. Run tests (if available)
npm test

# 3. Check for vulnerabilities
npm audit

# 4. Build the app
npm run build  # or expo build

# 5. Deploy Firebase rules
firebase deploy --only firestore:rules

# 6. Deploy Firebase functions (if any)
firebase deploy --only functions
```

---

## 🧪 Security Testing

### Manual Tests

1. **Authentication**
   - [ ] Create new account
   - [ ] Login with existing account
   - [ ] Wrong password rejected
   - [ ] Password reset works
   - [ ] Can't access app without login

2. **Authorization**
   - [ ] User A can't see User B's tasks
   - [ ] User A can't modify User B's courses
   - [ ] Can only delete own data

3. **Rate Limiting**
   - [ ] Send 30 chat messages quickly → blocked
   - [ ] Wait 1 minute → can send again
   - [ ] Error message is clear

4. **Input Validation**
   - [ ] Very long task title → rejected
   - [ ] Invalid email → rejected
   - [ ] Script in input → sanitized
   - [ ] SQL injection attempts → blocked

5. **Error Handling**
   - [ ] Errors don't expose sensitive info
   - [ ] User gets helpful messages
   - [ ] Errors logged (if Sentry enabled)

---

## 🎯 Production-Ready Criteria

Your app is production-ready when:

✅ All CRITICAL items completed
✅ All HIGH PRIORITY items completed
✅ Most MEDIUM PRIORITY items completed
✅ All manual tests passed
✅ No known security vulnerabilities
✅ Firebase rules deployed
✅ API keys rotated
✅ Documentation updated

---

## ⚠️ Known Risks (Document any remaining)

| Risk | Severity | Mitigation | Status |
|------|----------|------------|--------|
| Old API keys exposed in git | 🔴 Critical | Rotate all keys | [ ] TODO |
| No email verification | 🟡 Medium | Enable in Firebase | [ ] TODO |
| No 2FA | 🟢 Low | Future enhancement | Accepted |

---

## 📊 Security Metrics

Track these after deployment:

- **Authentication failures** per day
- **Rate limit hits** per hour
- **Errors tracked** (Sentry)
- **Failed authorization attempts**
- **API key rotations** completed

---

## 🚨 Emergency Contacts

In case of security incident:

1. **Disable Firebase Auth** (if compromised)
2. **Rotate all API keys immediately**
3. **Check Firebase logs** for suspicious activity
4. **Review Sentry errors** for attack patterns
5. **Update security rules** if needed

---

## 📅 Post-Deployment

### Within 24 hours:
- [ ] Monitor error rates
- [ ] Check Firebase quotas
- [ ] Verify rate limiting working
- [ ] Review Sentry dashboard

### Within 1 week:
- [ ] Analyze usage patterns
- [ ] Adjust rate limits if needed
- [ ] Fix any security issues found
- [ ] Update documentation

### Monthly:
- [ ] Rotate API keys
- [ ] Review Firebase rules
- [ ] Check for dependency updates
- [ ] Security audit of new features

---

**Checklist Version**: 1.0.0
**Last Updated**: November 22, 2025
**Next Review**: Before production deployment

---

## ✅ Sign-Off

When all checks are complete:

- [ ] Reviewed by: _______________
- [ ] Date: _______________
- [ ] Production deployment approved: ⬜ Yes ⬜ No
- [ ] Rollback plan documented: ⬜ Yes ⬜ No

---

**Remember**: Security is not a one-time task. Continue monitoring and updating!
