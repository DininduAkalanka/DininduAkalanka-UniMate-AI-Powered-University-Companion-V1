# 🚀 Quick Start - Security Setup

## 1️⃣ Initial Setup (5 minutes)

### Windows:
```powershell
# Run setup script
.\scripts\setup-security.bat

# Or use npm
npm run security:setup
```

### Mac/Linux:
```bash
# Make script executable
chmod +x scripts/setup-security.sh

# Run setup
./scripts/setup-security.sh
```

### Manual Setup:
```bash
# Copy template
cp .env.example .env

# Edit with your editor
code .env  # VS Code
nano .env  # Terminal
```

---

## 2️⃣ Get Your API Keys

### Hugging Face (Required for AI features)
1. Go to: https://huggingface.co/settings/tokens
2. Click "New token"
3. Name it "UniMate"
4. Copy the token (starts with `hf_`)
5. Paste in `.env`:
   ```
   EXPO_PUBLIC_HUGGING_FACE_API_KEY=hf_your_token_here
   ```

### Firebase (Required)
1. Go to: https://console.firebase.google.com
2. Select your project (or create new)
3. Click ⚙️ (Settings) → Project settings
4. Scroll to "Your apps" → Web app
5. Copy all values to `.env`:
   ```
   EXPO_PUBLIC_FIREBASE_API_KEY=AIza...
   EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-app.firebaseapp.com
   EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
   EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-app.appspot.com
   EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
   EXPO_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
   ```

### Sentry (Optional - for production monitoring)
1. Go to: https://sentry.io
2. Create account/login
3. Create new project → React Native
4. Copy DSN
5. Add to `.env`:
   ```
   EXPO_PUBLIC_SENTRY_DSN=https://abc123@sentry.io/456789
   ```

---

## 3️⃣ Deploy Firebase Security Rules

### Using Firebase CLI (Recommended):
```bash
# Install Firebase CLI (if not installed)
npm install -g firebase-tools

# Login
firebase login

# Deploy rules
firebase deploy --only firestore:rules
```

### Using Firebase Console:
1. Go to https://console.firebase.google.com
2. Select your project
3. Firestore Database → Rules
4. Copy content from `firestore.rules`
5. Click "Publish"

---

## 4️⃣ Verify Everything Works

```bash
# Check for exposed secrets
npm run security:check

# Start the app
npm start
```

### Test Checklist:
- [ ] App starts without errors
- [ ] Can create account / login
- [ ] AI chat responds
- [ ] Can create tasks/courses
- [ ] Firebase data saves correctly
- [ ] No console errors about missing keys

---

## 🆘 Common Issues

### "API key not configured"
**Solution**: Check `.env` file has correct key format
```bash
# Make sure it looks like this:
EXPO_PUBLIC_HUGGING_FACE_API_KEY=hf_abcd1234...
# NOT like this:
EXPO_PUBLIC_HUGGING_FACE_API_KEY=your_key_here
```

### "Firebase permission denied"
**Solution**: Deploy Firebase rules
```bash
firebase deploy --only firestore:rules
```

### "Module not found: @sentry/react-native"
**Solution**: Sentry is optional. Either:
1. Install it: `npm install @sentry/react-native`
2. Or ignore (app works without it)

### ".env not found"
**Solution**: Create it from template
```bash
cp .env.example .env
```

---

## ⚠️ Security Reminders

### ✅ DO:
- Keep `.env` file secret
- Use `.env.example` as template
- Rotate keys after exposure
- Deploy Firebase rules

### ❌ DON'T:
- Commit `.env` to git
- Share API keys publicly
- Use exposed keys in production
- Skip Firebase rules deployment

---

## 🔗 Important Links

| Service | Purpose | Link |
|---------|---------|------|
| Hugging Face | AI API keys | https://huggingface.co/settings/tokens |
| Firebase Console | Project config | https://console.firebase.google.com |
| Sentry | Error tracking | https://sentry.io |
| Full Security Guide | Complete docs | See `SECURITY.md` |
| Audit Summary | What was done | See `SECURITY_AUDIT_SUMMARY.md` |

---

## 📞 Need Help?

1. Read `SECURITY.md` for detailed guide
2. Check `SECURITY_AUDIT_SUMMARY.md` for what was implemented
3. Review error messages carefully
4. Check Firebase console for quota/errors

---

**Setup Time**: ~5 minutes
**Difficulty**: Easy
**Status**: Production ready after setup ✅
