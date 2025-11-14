import {
    createUserWithEmailAndPassword,
    User as FirebaseUser,
    onAuthStateChanged,
    sendPasswordResetEmail,
    signInWithEmailAndPassword,
    signOut,
    updateProfile,
} from 'firebase/auth';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { auth, db } from '../firebase/firebaseint';
import { User } from '../types';

const USERS_COLLECTION = 'users';

/**
 * Sign up a new user
 */
export const signUp = async (
  email: string,
  password: string,
  name: string
): Promise<User> => {
  try {
    // Create Firebase Auth user
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );

    // Update profile with display name
    await updateProfile(userCredential.user, { displayName: name });

    // Create user document in Firestore
    const user: User = {
      id: userCredential.user.uid,
      email,
      name,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await setDoc(doc(db, USERS_COLLECTION, user.id), {
      email: user.email,
      name: user.name,
      studentId: null,
      university: null,
      department: null,
      year: null,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    return user;
  } catch (error: any) {
    console.error('Sign up error:', error);
    
    // Handle specific Firebase Auth errors
    if (error?.code === 'auth/configuration-not-found') {
      throw new Error(
        'Firebase Authentication is not configured.\n\n' +
        'Please enable Email/Password authentication:\n' +
        '1. Go to Firebase Console\n' +
        '2. Select project: unimate-5d2cd\n' +
        '3. Click Authentication → Sign-in method\n' +
        '4. Enable Email/Password provider'
      );
    }
    
    // Handle Firestore permission errors
    if (error?.code === 'permission-denied' || 
        error?.message?.includes('Missing or insufficient permissions')) {
      throw new Error(
        'Firestore permissions not configured.\n\n' +
        'Please update Firestore rules:\n' +
        '1. Go to Firebase Console\n' +
        '2. Firestore Database → Rules\n' +
        '3. Use the rules from FIREBASE_AUTH_SETUP.md\n' +
        '4. Click Publish'
      );
    }
    
    throw new Error(error.message || 'Failed to sign up');
  }
};

/**
 * Sign in existing user
 */
export const signIn = async (
  email: string,
  password: string
): Promise<User> => {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );

    // Get user data from Firestore
    const userDoc = await getDoc(
      doc(db, USERS_COLLECTION, userCredential.user.uid)
    );

    if (!userDoc.exists()) {
      throw new Error('User data not found');
    }

    const userData = userDoc.data();
    return {
      id: userCredential.user.uid,
      email: userData.email,
      name: userData.name,
      studentId: userData.studentId,
      university: userData.university,
      department: userData.department,
      year: userData.year,
      createdAt: userData.createdAt.toDate(),
      updatedAt: userData.updatedAt.toDate(),
    };
  } catch (error: any) {
    console.error('Sign in error:', error);
    
    // Handle specific Firebase Auth errors
    if (error?.code === 'auth/configuration-not-found') {
      throw new Error(
        'Firebase Authentication is not configured.\n\n' +
        'Please enable Email/Password authentication:\n' +
        '1. Go to Firebase Console\n' +
        '2. Select project: unimate-5d2cd\n' +
        '3. Click Authentication → Sign-in method\n' +
        '4. Enable Email/Password provider'
      );
    }
    
    throw new Error(error.message || 'Failed to sign in');
  }
};

/**
 * Sign out current user
 */
export const signOutUser = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (error: any) {
    console.error('Sign out error:', error);
    throw new Error(error.message || 'Failed to sign out');
  }
};

/**
 * Get current user
 */
export const getCurrentUser = async (): Promise<User | null> => {
  const firebaseUser = auth.currentUser;

  if (!firebaseUser) {
    return null;
  }

  const userDoc = await getDoc(doc(db, USERS_COLLECTION, firebaseUser.uid));

  if (!userDoc.exists()) {
    return null;
  }

  const userData = userDoc.data();
  return {
    id: firebaseUser.uid,
    email: userData.email,
    name: userData.name,
    studentId: userData.studentId,
    university: userData.university,
    department: userData.department,
    year: userData.year,
    createdAt: userData.createdAt.toDate(),
    updatedAt: userData.updatedAt.toDate(),
  };
};

/**
 * Listen to auth state changes
 */
export const onAuthStateChange = (
  callback: (user: FirebaseUser | null) => void
) => {
  return onAuthStateChanged(auth, callback);
};

/**
 * Send password reset email
 */
export const resetPassword = async (email: string): Promise<void> => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error: any) {
    console.error('Password reset error:', error);
    throw new Error(error.message || 'Failed to send password reset email');
  }
};

/**
 * Update user profile
 */
export const updateUserProfile = async (
  userId: string,
  updates: Partial<User>
): Promise<void> => {
  try {
    const userRef = doc(db, USERS_COLLECTION, userId);
    const updateData: any = {
      ...updates,
      updatedAt: Timestamp.now(),
    };

    // Remove fields that shouldn't be updated
    delete updateData.id;
    delete updateData.email;
    delete updateData.createdAt;

    await setDoc(userRef, updateData, { merge: true });

    // Update Firebase Auth display name if name changed
    if (updates.name && auth.currentUser) {
      await updateProfile(auth.currentUser, { displayName: updates.name });
    }
  } catch (error: any) {
    console.error('Update profile error:', error);
    throw new Error(error.message || 'Failed to update profile');
  }
};

/**
 * Get user by ID
 */
export const getUserById = async (userId: string): Promise<User | null> => {
  try {
    const userDoc = await getDoc(doc(db, USERS_COLLECTION, userId));

    if (!userDoc.exists()) {
      return null;
    }

    const userData = userDoc.data();
    return {
      id: userId,
      email: userData.email,
      name: userData.name,
      studentId: userData.studentId,
      university: userData.university,
      department: userData.department,
      year: userData.year,
      createdAt: userData.createdAt.toDate(),
      updatedAt: userData.updatedAt.toDate(),
    };
  } catch (error: any) {
    console.error('Get user error:', error);
    return null;
  }
};

export default {
  signUp,
  signIn,
  signOutUser,
  getCurrentUser,
  onAuthStateChange,
  resetPassword,
  updateUserProfile,
  getUserById,
};
