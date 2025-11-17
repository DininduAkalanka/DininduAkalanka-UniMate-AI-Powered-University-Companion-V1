<div align="center">

# 🎓 UniMate

### Your AI-Powered University Companion

[![React Native](https://img.shields.io/badge/React%20Native-0.81.5-blue.svg)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-~54.0.23-000020.svg)](https://expo.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![Firebase](https://img.shields.io/badge/Firebase-12.5.0-orange.svg)](https://firebase.google.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

*A modern, feature-rich mobile application designed to revolutionize the way university students manage their academic journey.*

[Features](#-features) • [Installation](#-installation) • [Documentation](#-documentation) • [Contributing](#-contributing)

</div>

---

## 📖 Overview

UniMate is a comprehensive cross-platform mobile application that empowers university students to take control of their academic life. Built with cutting-edge technologies including React Native, Expo, and Firebase, UniMate seamlessly integrates task management, course tracking, intelligent study planning, and AI-powered assistance to create an all-in-one solution for modern students.

### 🎯 Why UniMate?

- **Centralized Academic Management**: All your courses, tasks, and schedules in one place
- **AI-Powered Intelligence**: Get instant help and smart predictions powered by advanced AI
- **Cross-Platform**: Works seamlessly on iOS, Android, and Web
- **Real-time Sync**: Your data is always up-to-date across all devices
- **Intuitive Design**: Beautiful, modern UI with smooth animations and gestures

## ✨ Features

<table>
<tr>
<td width="50%">

### 🎯 Academic Management

- **📊 Smart Dashboard**
  - Real-time overview of academic progress
  - Quick stats and performance metrics
  - Upcoming deadlines at a glance

- **✅ Task Management**
  - Create and organize assignments
  - Set priorities and due dates
  - Track completion status
  - Link tasks to specific courses

- **📚 Course Management**
  - Add unlimited courses
  - Store course materials and resources
  - Track course schedules
  - View course-specific tasks

- **📅 Interactive Timetable**
  - Visual calendar interface
  - Class schedule management
  - Study session planning
  - Color-coded organization

</td>
<td width="50%">

### 🤖 AI-Powered Intelligence

- **💬 AI Chat Assistant**
  - Natural language conversations
  - Instant academic help
  - Context-aware responses
  - 24/7 availability

- **🎯 Smart Predictions**
  - Performance insights
  - Study recommendations
  - Goal tracking assistance
  - Personalized suggestions

- **⚡ Quick Actions**
  - Pre-defined query templates
  - One-tap common questions
  - Streamlined interactions

### 🔐 Security & Sync

- **🔒 Secure Authentication**
  - Firebase-powered security
  - Email/password authentication
  
- **☁️ Cloud Sync**
  - Real-time data synchronization
  - Cross-device accessibility
  - Automatic backups

</td>
</tr>
</table>

## 🛠️ Tech Stack

<table>
<tr>
<td>

**Frontend**
- React Native `0.81.5`
- Expo SDK `~54.0.23`
- TypeScript `5.x`
- Expo Router `~6.0.14`

</td>
<td>

**Backend & Services**
- Firebase Authentication
- Cloud Firestore
- Hugging Face AI API
- Axios `1.13.2`

</td>
</tr>
<tr>
<td>

**UI/UX Libraries**
- React Native Reanimated `~4.1.1`
- Moti `0.30.0` (Animations)
- Expo Linear Gradient
- Expo Blur Effects
- React Native Gesture Handler

</td>
<td>

**Specialized Components**
- React Native Gifted Chat `2.8.1`
- React Native Calendars `1.1313.0`
- Expo Image Picker
- Expo Document Picker
- React Native Keyboard Controller

</td>
</tr>
</table>

## 📋 Prerequisites

Ensure you have the following installed on your development machine:

| Requirement | Version | Purpose |
|------------|---------|---------|
| **Node.js** | v18+ | Runtime environment |
| **npm/yarn** | Latest | Package management |
| **Expo CLI** | Latest | Development tools |
| **Git** | Latest | Version control |

**Additional Requirements:**
- 📱 **Expo Go** app (for physical device testing)
- 🔥 **Firebase Account** (for backend services)
- 🤖 **Hugging Face API Key** (for AI features)

## 🚀 Installation

### Step 1️⃣: Clone the Repository

```bash
# Clone via HTTPS
git clone https://github.com/DininduAkalanka/UniMate-AI-Powered-University-Companion.git

# Or clone via SSH
git clone git@github.com:DininduAkalanka/UniMate-AI-Powered-University-Companion.git

# Navigate to project directory
cd UniMate-AI-Powered-University-Companion
```

### Step 2️⃣: Install Dependencies

```bash
# Using npm
npm install

# Or using yarn
yarn install
```

### Step 3️⃣: Environment Configuration

#### 🔥 Firebase Setup

1. Visit [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select existing one
3. Enable **Authentication** → Email/Password provider
4. Create a **Firestore Database** in production mode
5. Copy your Firebase configuration

Create/Update `firebase/firebaseint.ts`:

```typescript
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
```

#### 🤖 Hugging Face API Setup

1. Create account at [Hugging Face](https://huggingface.co/)
2. Generate API token from [Settings → Access Tokens](https://huggingface.co/settings/tokens)

Update `constants/config.ts`:

```typescript
export const HUGGING_FACE_API = {
  apiKey: 'YOUR_HUGGING_FACE_API_KEY',
  baseUrl: 'https://api-inference.huggingface.co/models',
};
```

#### 🔒 Deploy Firestore Security Rules

```bash
# Install Firebase CLI (if not installed)
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase in your project
firebase init firestore

# Deploy security rules
firebase deploy --only firestore:rules
```

### Step 4️⃣: Run the Application

```bash
# Start Expo development server
npm start

# Run on Android emulator/device
npm run android

# Run on iOS simulator (macOS only)
npm run ios

# Run in web browser
npm run web
```

### Step 5️⃣: Access the App

- **Physical Device**: Scan QR code with Expo Go app
- **Android Emulator**: Press `a` in terminal
- **iOS Simulator**: Press `i` in terminal (macOS only)
- **Web Browser**: Press `w` in terminal

## 📁 Project Structure

```
unimatemobile/
│
├── 📱 app/                          # Application Screens (Expo Router)
│   ├── _layout.tsx                  # Root layout configuration
│   ├── index.tsx                    # Authentication (Login/Signup)
│   ├── home.tsx                     # Main dashboard
│   ├── chat.tsx                     # AI chat interface
│   ├── tasks.tsx                    # Task list view
│   ├── planner.tsx                  # Study planner
│   ├── timetable.tsx                # Schedule calendar
│   ├── courses/
│   │   └── add.tsx                  # Add new course
│   └── tasks/
│       ├── [id].tsx                 # Task detail view
│       └── add.tsx                  # Add new task
│
├── 🧩 components/                   # Reusable Components
│   ├── Dashboard.tsx                # Dashboard container
│   ├── chat/                        # Chat components
│   │   ├── ChatBubble.tsx
│   │   ├── ChatInput.tsx
│   │   ├── EmptyState.tsx
│   │   ├── QuickActions.tsx
│   │   └── ScrollToBottomButton.tsx
│   └── ui/                          # UI components
│       ├── AnimatedCard.tsx
│       ├── CourseCard.tsx
│       ├── GlassCard.tsx
│       ├── Skeleton.tsx
│       ├── StatCard.tsx
│       └── TaskCard.tsx
│
├── 🔧 services/                     # Business Logic & API Integration
│   ├── aiService.ts                 # AI/ML service (Hugging Face)
│   ├── aiServiceEnhanced.ts         # Enhanced AI features
│   ├── authService.ts               # Authentication service
│   ├── courseServiceFirestore.ts    # Course CRUD operations
│   ├── studyServiceFirestore.ts     # Study session management
│   ├── taskServiceFirestore.ts      # Task CRUD operations
│   └── predictionService.ts         # AI prediction service
│
├── 🎨 constants/                    # Configuration & Constants
│   ├── config.ts                    # App configuration
│   ├── designSystem.ts              # Design tokens
│   └── illustrations.ts             # Illustration assets
│
├── 🔥 firebase/                     # Firebase Configuration
│   └── firebaseint.ts               # Firebase initialization
│
├── 📘 types/                        # TypeScript Definitions
│   └── index.ts                     # Type definitions
│
├── 🖼️ assets/                       # Static Assets
│   └── images/                      # Image resources
│
├── ⚙️ Configuration Files
│   ├── app.json                     # Expo configuration
│   ├── package.json                 # Dependencies
│   ├── tsconfig.json                # TypeScript config
│   ├── eslint.config.js             # ESLint rules
│   ├── firestore.rules              # Firestore security rules
│   └── expo-env.d.ts                # Expo type definitions
│
└── 📄 README.md                     # Documentation (You are here!)
```

## 📚 Documentation

### Key Components Overview

#### 🏠 Dashboard Component
The central hub of the application displaying:
- **Course Overview**: Active courses with visual cards
- **Task Summary**: Upcoming assignments and deadlines
- **Study Statistics**: Progress tracking and analytics
- **Quick Navigation**: Fast access to all features
- **Performance Metrics**: Academic progress indicators

#### 💬 AI Chat Assistant
An intelligent conversational interface featuring:
- **Natural Language Processing**: Understand student queries contextually
- **Real-time Responses**: Instant answers powered by Hugging Face models
- **Quick Actions**: Pre-built prompts for common academic questions
- **Chat History**: Persistent conversation storage
- **Context Awareness**: Remembers conversation context

#### ✅ Task Management System
Comprehensive task tracking with:
- **Create & Organize**: Add tasks with detailed information
- **Priority Levels**: Set importance (High/Medium/Low)
- **Due Date Tracking**: Calendar-based deadline management
- **Course Integration**: Link tasks to specific courses
- **Status Tracking**: Mark tasks as pending/in-progress/completed
- **Filtering & Sorting**: Organize tasks by various criteria

#### 📚 Course Management
Robust course tracking featuring:
- **Course Creation**: Add courses with schedules and details
- **Material Storage**: Store course-related documents
- **Schedule Management**: Track class timings
- **Course Analytics**: View course-specific progress
- **Task Association**: See all tasks related to a course

#### 📅 Timetable & Planner
Visual scheduling tools including:
- **Interactive Calendar**: Drag-and-drop interface
- **Color Coding**: Visual organization by course
- **Study Sessions**: Plan dedicated study time
- **Reminders**: Get notified about upcoming classes
- **Weekly/Monthly Views**: Flexible calendar perspectives

### 🔐 Security Features

UniMate implements robust security measures:

| Feature | Implementation |
|---------|---------------|
| **Authentication** | Firebase Authentication with email/password |
| **Data Encryption** | HTTPS for all API communications |
| **User Privacy** | Isolated user data in Firestore |
| **API Security** | Environment variables for sensitive keys |
| **Authorization** | Firebase Security Rules for data access |
| **Session Management** | Secure token-based sessions |

### 🎨 Design Philosophy

UniMate follows modern design principles:

- **Material Design**: Consistent with platform guidelines
- **Glassmorphism**: Modern frosted glass effects
- **Smooth Animations**: Powered by Reanimated and Moti
- **Responsive Layouts**: Adapts to all screen sizes
- **Dark Mode Ready**: Automatic theme switching support
- **Accessibility**: WCAG compliant UI components

## 🤝 Contributing

We welcome contributions from the community! Here's how you can help make UniMate better:

### 🌟 Ways to Contribute

- 🐛 **Report Bugs**: Submit detailed bug reports
- 💡 **Suggest Features**: Share your ideas for new features
- 📝 **Improve Documentation**: Help us make docs clearer
- 🔧 **Submit Pull Requests**: Contribute code improvements
- ⭐ **Star the Project**: Show your support!

### 📋 Contribution Process

1. **Fork the Repository**
   ```bash
   # Click the 'Fork' button on GitHub
   ```

2. **Clone Your Fork**
   ```bash
   git clone https://github.com/YOUR_USERNAME/UniMate-AI-Powered-University-Companion.git
   cd UniMate-AI-Powered-University-Companion
   ```

3. **Create a Feature Branch**
   ```bash
   git checkout -b feature/amazing-feature
   # or
   git checkout -b fix/bug-fix
   ```

4. **Make Your Changes**
   - Write clean, documented code
   - Follow existing code style
   - Add tests if applicable
   - Update documentation

5. **Commit Your Changes**
   ```bash
   git add .
   git commit -m "feat: add amazing feature"
   ```
   
   **Commit Message Convention:**
   - `feat:` New feature
   - `fix:` Bug fix
   - `docs:` Documentation changes
   - `style:` Code style changes
   - `refactor:` Code refactoring
   - `test:` Test additions/changes
   - `chore:` Maintenance tasks

6. **Push to Your Fork**
   ```bash
   git push origin feature/amazing-feature
   ```

7. **Open a Pull Request**
   - Go to the original repository
   - Click "New Pull Request"
   - Select your branch
   - Describe your changes in detail
   - Link any related issues

### 📏 Code Style Guidelines

- Use **TypeScript** for type safety
- Follow **ESLint** configuration
- Use **meaningful variable names**
- Add **JSDoc comments** for functions
- Keep functions **small and focused**
- Write **self-documenting code**

### 🧪 Testing

Before submitting a PR:
```bash
# Run linter
npm run lint

# Test on multiple platforms
npm run android
npm run ios
npm run web
```

## 🐛 Bug Reports

Found a bug? Help us fix it!

**Please include:**
- 📱 Device/Platform (iOS/Android/Web)
- 📋 Steps to reproduce
- 🤔 Expected behavior
- 😞 Actual behavior
- 📸 Screenshots (if applicable)
- 📝 Error messages/logs

[Report a Bug](https://github.com/DininduAkalanka/UniMate-AI-Powered-University-Companion/issues/new)

## 🚀 Roadmap

### 🎯 Upcoming Features

- [ ] **Push Notifications** - Real-time alerts for deadlines and events
- [ ] **Offline Mode** - Access your data without internet connection
- [ ] **Study Groups** - Collaborate with classmates
- [ ] **Grade Calculator** - Track and predict your GPA
- [ ] **Document Scanner** - Scan and store lecture notes
- [ ] **Voice Commands** - Control app with voice
- [ ] **Study Analytics** - Detailed performance insights
- [ ] **Integration with LMS** - Connect with Moodle, Canvas, etc.
- [ ] **Pomodoro Timer** - Built-in productivity timer
- [ ] **Multi-language Support** - Internationalization

### 🔄 Version History

#### v1.0.0 (Current)
- ✅ User authentication system
- ✅ Task management
- ✅ Course management
- ✅ AI chat assistant
- ✅ Interactive timetable
- ✅ Study planner
- ✅ Dashboard with analytics

## 📊 Performance

UniMate is optimized for performance:

- ⚡ **Fast Startup**: < 2 seconds load time
- 📦 **Small Bundle Size**: Optimized asset delivery
- 🔄 **Smooth Animations**: 60 FPS on most devices
- 💾 **Efficient Caching**: Reduced data usage
- 🔋 **Battery Friendly**: Optimized background processes

## 🌐 Browser Support

Web version supports:
- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Mobile browsers

## 📱 Platform Support

| Platform | Status | Min Version |
|----------|--------|-------------|
| **Android** | ✅ Supported | Android 5.0+ |
| **iOS** | ✅ Supported | iOS 13.0+ |
| **Web** | ✅ Supported | Modern Browsers |

## 🔧 Troubleshooting

### Common Issues

<details>
<summary><b>App won't start / Build errors</b></summary>

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm start -- --clear
```
</details>

<details>
<summary><b>Firebase configuration errors</b></summary>

- Verify Firebase config in `firebase/firebaseint.ts`
- Check Firebase console for correct project settings
- Ensure Firestore and Authentication are enabled
</details>

<details>
<summary><b>AI chat not responding</b></summary>

- Verify Hugging Face API key in `constants/config.ts`
- Check internet connection
- Ensure API quota is not exceeded
</details>

<details>
<summary><b>Expo Go connection issues</b></summary>

```bash
# Make sure devices are on same network
# Restart Expo dev server
npm start -- --clear

# Try tunnel mode
npm start -- --tunnel
```
</details>

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

```
MIT License

Copyright (c) 2025 UniMate

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
```

