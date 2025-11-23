/**
 * Study Session Context
 * Global state management for active study sessions
 * Allows any screen to access/update current study session
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

const STUDY_SESSION_KEY = '@study_session_state';

export interface StudySessionState {
  isActive: boolean;
  isRunning: boolean;
  isPaused: boolean;
  elapsedSeconds: number;
  targetSeconds: number;
  selectedCourse: string;
  selectedTask: string | null;
  topic: string;
  targetDuration: string;
  notes: string;
  effectiveness: 1 | 2 | 3 | 4 | 5 | null;
  startTime: Date | null;
}

interface StudySessionContextType {
  state: StudySessionState;
  actions: {
    startSession: (courseId: string, targetMinutes?: number) => void;
    pauseSession: () => void;
    resumeSession: () => void;
    stopSession: () => void;
    discardSession: () => void;
    updateSessionData: (data: Partial<StudySessionState>) => void;
    saveToStorage: () => Promise<void>;
    restoreFromStorage: () => Promise<void>;
  };
}

const initialState: StudySessionState = {
  isActive: false,
  isRunning: false,
  isPaused: false,
  elapsedSeconds: 0,
  targetSeconds: 0,
  selectedCourse: '',
  selectedTask: null,
  topic: '',
  targetDuration: '',
  notes: '',
  effectiveness: null,
  startTime: null,
};

const StudySessionContext = createContext<StudySessionContextType | undefined>(undefined);

export const StudySessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<StudySessionState>(initialState);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<Date | null>(null);

  // Format time helper
  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Save state to AsyncStorage
  const saveToStorage = useCallback(async () => {
    try {
      if (!state.isActive && state.elapsedSeconds === 0) {
        console.log('[StudyContext] No active session to save');
        return;
      }

      const dataToSave = {
        ...state,
        startTime: startTimeRef.current?.toISOString(),
        savedAt: new Date().toISOString(),
      };

      await AsyncStorage.setItem(STUDY_SESSION_KEY, JSON.stringify(dataToSave));
      console.log('[StudyContext] 💾 State saved:', {
        isRunning: state.isRunning,
        elapsed: formatTime(state.elapsedSeconds),
      });
    } catch (error) {
      console.error('[StudyContext] ❌ Failed to save:', error);
    }
  }, [state]);

  // Restore state from AsyncStorage
  const restoreFromStorage = useCallback(async () => {
    try {
      const saved = await AsyncStorage.getItem(STUDY_SESSION_KEY);
      
      if (!saved) {
        console.log('[StudyContext] No saved session found');
        return;
      }

      const restoredState = JSON.parse(saved);
      
      console.log('[StudyContext] 📦 Restoring session:', {
        course: restoredState.selectedCourse,
        isRunning: restoredState.isRunning,
        isPaused: restoredState.isPaused,
      });

      // Calculate elapsed time if timer was running
      if (restoredState.isRunning && !restoredState.isPaused) {
        const savedStartTime = restoredState.startTime 
          ? new Date(restoredState.startTime) 
          : new Date();
        const now = new Date();
        const elapsedSinceStart = Math.floor((now.getTime() - savedStartTime.getTime()) / 1000);
        
        restoredState.elapsedSeconds = elapsedSinceStart;
        startTimeRef.current = savedStartTime;

        // Restart timer
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
          setState(prev => ({
            ...prev,
            elapsedSeconds: prev.elapsedSeconds + 1,
          }));
        }, 1000) as any;
      } else if (restoredState.startTime) {
        startTimeRef.current = new Date(restoredState.startTime);
      }

      setState({
        ...restoredState,
        startTime: startTimeRef.current,
      });

      console.log('[StudyContext] ✅ Session restored');
    } catch (error) {
      console.error('[StudyContext] ❌ Failed to restore:', error);
    }
  }, []);

  // Start a new session
  const startSession = useCallback((courseId: string, targetMinutes: number = 0) => {
    console.log('[StudyContext] 🚀 Starting session:', courseId);
    
    const startTime = new Date();
    startTimeRef.current = startTime;

    setState(prev => ({
      ...prev,
      isActive: true,
      isRunning: true,
      isPaused: false,
      selectedCourse: courseId,
      targetSeconds: targetMinutes * 60,
      startTime,
      elapsedSeconds: 0,
    }));

    // Start timer interval
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setState(prev => ({
        ...prev,
        elapsedSeconds: prev.elapsedSeconds + 1,
      }));
    }, 1000) as any;
  }, []);

  // Pause session
  const pauseSession = useCallback(() => {
    console.log('[StudyContext] ⏸️  Pausing session');
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    setState(prev => ({
      ...prev,
      isRunning: true,
      isPaused: true,
    }));
  }, []);

  // Resume session
  const resumeSession = useCallback(() => {
    console.log('[StudyContext] ▶️  Resuming session');

    setState(prev => ({
      ...prev,
      isRunning: true,
      isPaused: false,
    }));

    // Restart timer
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setState(prev => ({
        ...prev,
        elapsedSeconds: prev.elapsedSeconds + 1,
      }));
    }, 1000) as any;
  }, []);

  // Stop session (for completion/save)
  const stopSession = useCallback(() => {
    console.log('[StudyContext] ⏹️  Stopping session');

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    setState(prev => ({
      ...prev,
      isRunning: false,
      isPaused: false,
    }));
  }, []);

  // Discard session completely
  const discardSession = useCallback(async () => {
    console.log('[StudyContext] 🗑️  Discarding session');

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    startTimeRef.current = null;
    setState(initialState);

    try {
      await AsyncStorage.removeItem(STUDY_SESSION_KEY);
      console.log('[StudyContext] ✅ Session cleared');
    } catch (error) {
      console.error('[StudyContext] ❌ Failed to clear:', error);
    }
  }, []);

  // Update session data (for form fields, notes, etc.)
  const updateSessionData = useCallback((data: Partial<StudySessionState>) => {
    setState(prev => ({
      ...prev,
      ...data,
    }));
  }, []);

  // Auto-save on state changes
  useEffect(() => {
    if (state.isActive) {
      saveToStorage();
    }
  }, [state.elapsedSeconds]); // Save every second when active

  // Handle app state changes (background/foreground)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'background') {
        console.log('[StudyContext] App backgrounded, saving...');
        saveToStorage();
      } else if (nextAppState === 'active') {
        console.log('[StudyContext] App foregrounded, restoring...');
        restoreFromStorage();
      }
    });

    return () => subscription.remove();
  }, [saveToStorage, restoreFromStorage]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // Restore on mount
  useEffect(() => {
    restoreFromStorage();
  }, []);

  const contextValue: StudySessionContextType = {
    state,
    actions: {
      startSession,
      pauseSession,
      resumeSession,
      stopSession,
      discardSession,
      updateSessionData,
      saveToStorage,
      restoreFromStorage,
    },
  };

  return (
    <StudySessionContext.Provider value={contextValue}>
      {children}
    </StudySessionContext.Provider>
  );
};

/**
 * Custom hook to use study session context
 */
export const useStudySession = () => {
  const context = useContext(StudySessionContext);
  
  if (!context) {
    throw new Error('useStudySession must be used within StudySessionProvider');
  }
  
  return context;
};

/**
 * Hook to get just the active session status (for UI indicators)
 */
export const useIsStudying = () => {
  const { state } = useStudySession();
  return {
    isStudying: state.isActive && state.isRunning,
    isPaused: state.isPaused,
    elapsedTime: state.elapsedSeconds,
  };
};
