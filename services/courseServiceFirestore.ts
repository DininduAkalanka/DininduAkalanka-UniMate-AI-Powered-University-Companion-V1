import {
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    orderBy,
    query,
    setDoc,
    Timestamp,
    updateDoc,
    where,
} from 'firebase/firestore';
import { db } from '../firebase/firebaseint';
import { Course } from '../types';

const COURSES_COLLECTION = 'courses';

/**
 * Create a new course in Firestore
 */
export const createCourse = async (
  course: Omit<Course, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Course> => {
  const courseRef = doc(collection(db, COURSES_COLLECTION));
  const now = Timestamp.now();

  const newCourse: Course = {
    ...course,
    id: courseRef.id,
    createdAt: now.toDate(),
    updatedAt: now.toDate(),
  };

  await setDoc(courseRef, {
    userId: newCourse.userId,
    code: newCourse.code,
    name: newCourse.name,
    credits: newCourse.credits || null,
    instructor: newCourse.instructor || null,
    color: newCourse.color || null,
    difficulty: newCourse.difficulty || null,
    createdAt: now,
    updatedAt: now,
  });

  return newCourse;
};

/**
 * Get all courses for a user
 */
export const getCourses = async (userId: string): Promise<Course[]> => {
  const q = query(
    collection(db, COURSES_COLLECTION),
    where('userId', '==', userId),
    orderBy('name', 'asc')
  );

  const querySnapshot = await getDocs(q);
  const courses: Course[] = [];

  querySnapshot.forEach((docSnap) => {
    const data = docSnap.data();
    courses.push({
      id: docSnap.id,
      userId: data.userId,
      code: data.code,
      name: data.name,
      credits: data.credits,
      instructor: data.instructor,
      color: data.color,
      difficulty: data.difficulty as 1 | 2 | 3 | 4 | 5 | undefined,
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt.toDate(),
    });
  });

  return courses;
};

/**
 * Get course by ID
 */
export const getCourseById = async (id: string): Promise<Course | null> => {
  const courseDoc = await getDoc(doc(db, COURSES_COLLECTION, id));

  if (!courseDoc.exists()) {
    return null;
  }

  const data = courseDoc.data();
  return {
    id: courseDoc.id,
    userId: data.userId,
    code: data.code,
    name: data.name,
    credits: data.credits,
    instructor: data.instructor,
    color: data.color,
    difficulty: data.difficulty as 1 | 2 | 3 | 4 | 5 | undefined,
    createdAt: data.createdAt.toDate(),
    updatedAt: data.updatedAt.toDate(),
  };
};

/**
 * Update course
 */
export const updateCourse = async (
  id: string,
  updates: Partial<Course>
): Promise<void> => {
  const courseRef = doc(db, COURSES_COLLECTION, id);
  const updateData: any = {
    ...updates,
    updatedAt: Timestamp.now(),
  };

  delete updateData.id;
  delete updateData.createdAt;

  await updateDoc(courseRef, updateData);
};

/**
 * Delete course
 */
export const deleteCourse = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, COURSES_COLLECTION, id));
};

/**
 * Get course statistics
 */
export const getCourseStats = async (
  courseId: string
): Promise<{
  totalTasks: number;
  completedTasks: number;
  totalStudyHours: number;
  averageEffectiveness: number;
}> => {
  // Get tasks for this course
  const tasksQuery = query(
    collection(db, 'tasks'),
    where('courseId', '==', courseId)
  );
  const tasksSnapshot = await getDocs(tasksQuery);

  let totalTasks = 0;
  let completedTasks = 0;

  tasksSnapshot.forEach((doc) => {
    totalTasks++;
    if (doc.data().status === 'completed') {
      completedTasks++;
    }
  });

  // Get study sessions for this course
  const sessionsQuery = query(
    collection(db, 'study_sessions'),
    where('courseId', '==', courseId)
  );
  const sessionsSnapshot = await getDocs(sessionsQuery);

  let totalMinutes = 0;
  let totalEffectiveness = 0;
  let effectivenessCount = 0;

  sessionsSnapshot.forEach((doc) => {
    const data = doc.data();
    totalMinutes += data.duration || 0;
    if (data.effectiveness) {
      totalEffectiveness += data.effectiveness;
      effectivenessCount++;
    }
  });

  return {
    totalTasks,
    completedTasks,
    totalStudyHours: totalMinutes / 60,
    averageEffectiveness:
      effectivenessCount > 0 ? totalEffectiveness / effectivenessCount : 0,
  };
};

export default {
  createCourse,
  getCourses,
  getCourseById,
  updateCourse,
  deleteCourse,
  getCourseStats,
};
