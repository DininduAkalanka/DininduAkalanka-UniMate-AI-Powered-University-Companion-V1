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
import { Task, TaskPriority, TaskStatus, TaskType } from '../types';

const TASKS_COLLECTION = 'tasks';

/**
 * Create a new task in Firestore
 */
export const createTask = async (
  task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Task> => {
  const taskRef = doc(collection(db, TASKS_COLLECTION));
  const now = Timestamp.now();

  const newTask: Task = {
    ...task,
    id: taskRef.id,
    createdAt: now.toDate(),
    updatedAt: now.toDate(),
  };

  await setDoc(taskRef, {
    userId: newTask.userId,
    courseId: newTask.courseId,
    title: newTask.title,
    description: newTask.description || null,
    type: newTask.type,
    priority: newTask.priority,
    status: newTask.status,
    dueDate: Timestamp.fromDate(task.dueDate),
    estimatedHours: newTask.estimatedHours || null,
    completedHours: newTask.completedHours || null,
    reminderDate: task.reminderDate
      ? Timestamp.fromDate(task.reminderDate)
      : null,
    createdAt: now,
    updatedAt: now,
  });

  return newTask;
};

/**
 * Get all tasks for a user
 */
export const getTasks = async (userId: string): Promise<Task[]> => {
  const q = query(
    collection(db, TASKS_COLLECTION),
    where('userId', '==', userId),
    orderBy('dueDate', 'asc')
  );

  const querySnapshot = await getDocs(q);
  const tasks: Task[] = [];

  querySnapshot.forEach((docSnap) => {
    const data = docSnap.data();
    tasks.push({
      id: docSnap.id,
      userId: data.userId,
      courseId: data.courseId,
      title: data.title,
      description: data.description,
      type: data.type as TaskType,
      priority: data.priority as TaskPriority,
      status: data.status as TaskStatus,
      dueDate: data.dueDate.toDate(),
      estimatedHours: data.estimatedHours,
      completedHours: data.completedHours,
      reminderDate: data.reminderDate ? data.reminderDate.toDate() : undefined,
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt.toDate(),
    });
  });

  return tasks;
};

/**
 * Get task by ID
 */
export const getTaskById = async (taskId: string): Promise<Task | null> => {
  const taskDoc = await getDoc(doc(db, TASKS_COLLECTION, taskId));

  if (!taskDoc.exists()) {
    return null;
  }

  const data = taskDoc.data();
  return {
    id: taskDoc.id,
    userId: data.userId,
    courseId: data.courseId,
    title: data.title,
    description: data.description,
    type: data.type as TaskType,
    priority: data.priority as TaskPriority,
    status: data.status as TaskStatus,
    dueDate: data.dueDate.toDate(),
    estimatedHours: data.estimatedHours,
    completedHours: data.completedHours,
    reminderDate: data.reminderDate ? data.reminderDate.toDate() : undefined,
    createdAt: data.createdAt.toDate(),
    updatedAt: data.updatedAt.toDate(),
  };
};

/**
 * Get tasks by status
 */
export const getTasksByStatus = async (
  userId: string,
  status: TaskStatus
): Promise<Task[]> => {
  const q = query(
    collection(db, TASKS_COLLECTION),
    where('userId', '==', userId),
    where('status', '==', status),
    orderBy('dueDate', 'asc')
  );

  const querySnapshot = await getDocs(q);
  const tasks: Task[] = [];

  querySnapshot.forEach((docSnap) => {
    const data = docSnap.data();
    tasks.push({
      id: docSnap.id,
      userId: data.userId,
      courseId: data.courseId,
      title: data.title,
      description: data.description,
      type: data.type as TaskType,
      priority: data.priority as TaskPriority,
      status: data.status as TaskStatus,
      dueDate: data.dueDate.toDate(),
      estimatedHours: data.estimatedHours,
      completedHours: data.completedHours,
      reminderDate: data.reminderDate ? data.reminderDate.toDate() : undefined,
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt.toDate(),
    });
  });

  return tasks;
};

/**
 * Get tasks by course
 */
export const getTasksByCourse = async (courseId: string): Promise<Task[]> => {
  const q = query(
    collection(db, TASKS_COLLECTION),
    where('courseId', '==', courseId),
    orderBy('dueDate', 'asc')
  );

  const querySnapshot = await getDocs(q);
  const tasks: Task[] = [];

  querySnapshot.forEach((docSnap) => {
    const data = docSnap.data();
    tasks.push({
      id: docSnap.id,
      userId: data.userId,
      courseId: data.courseId,
      title: data.title,
      description: data.description,
      type: data.type as TaskType,
      priority: data.priority as TaskPriority,
      status: data.status as TaskStatus,
      dueDate: data.dueDate.toDate(),
      estimatedHours: data.estimatedHours,
      completedHours: data.completedHours,
      reminderDate: data.reminderDate ? data.reminderDate.toDate() : undefined,
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt.toDate(),
    });
  });

  return tasks;
};

/**
 * Get upcoming tasks (next N days)
 */
export const getUpcomingTasks = async (
  userId: string,
  days: number = 7
): Promise<Task[]> => {
  const today = new Date();
  const futureDate = new Date(today);
  futureDate.setDate(today.getDate() + days);

  const q = query(
    collection(db, TASKS_COLLECTION),
    where('userId', '==', userId),
    where('dueDate', '>=', Timestamp.fromDate(today)),
    where('dueDate', '<=', Timestamp.fromDate(futureDate)),
    orderBy('dueDate', 'asc')
  );

  const querySnapshot = await getDocs(q);
  const tasks: Task[] = [];

  querySnapshot.forEach((docSnap) => {
    const data = docSnap.data();
    if (data.status !== TaskStatus.COMPLETED) {
      tasks.push({
        id: docSnap.id,
        userId: data.userId,
        courseId: data.courseId,
        title: data.title,
        description: data.description,
        type: data.type as TaskType,
        priority: data.priority as TaskPriority,
        status: data.status as TaskStatus,
        dueDate: data.dueDate.toDate(),
        estimatedHours: data.estimatedHours,
        completedHours: data.completedHours,
        reminderDate: data.reminderDate
          ? data.reminderDate.toDate()
          : undefined,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
      });
    }
  });

  return tasks;
};

/**
 * Get overdue tasks
 */
export const getOverdueTasks = async (userId: string): Promise<Task[]> => {
  const today = Timestamp.now();

  const q = query(
    collection(db, TASKS_COLLECTION),
    where('userId', '==', userId),
    where('dueDate', '<', today),
    orderBy('dueDate', 'asc')
  );

  const querySnapshot = await getDocs(q);
  const tasks: Task[] = [];

  querySnapshot.forEach((docSnap) => {
    const data = docSnap.data();
    if (data.status !== TaskStatus.COMPLETED) {
      tasks.push({
        id: docSnap.id,
        userId: data.userId,
        courseId: data.courseId,
        title: data.title,
        description: data.description,
        type: data.type as TaskType,
        priority: data.priority as TaskPriority,
        status: TaskStatus.OVERDUE,
        dueDate: data.dueDate.toDate(),
        estimatedHours: data.estimatedHours,
        completedHours: data.completedHours,
        reminderDate: data.reminderDate
          ? data.reminderDate.toDate()
          : undefined,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
      });
    }
  });

  return tasks;
};

/**
 * Update task
 */
export const updateTask = async (
  id: string,
  updates: Partial<Task>
): Promise<void> => {
  const taskRef = doc(db, TASKS_COLLECTION, id);
  const updateData: any = {
    ...updates,
    updatedAt: Timestamp.now(),
  };

  // Convert Date objects to Timestamps
  if (updates.dueDate) {
    updateData.dueDate = Timestamp.fromDate(updates.dueDate);
  }

  if (updates.reminderDate) {
    updateData.reminderDate = Timestamp.fromDate(updates.reminderDate);
  }

  // Remove fields that shouldn't be updated
  delete updateData.id;
  delete updateData.createdAt;

  await updateDoc(taskRef, updateData);
};

/**
 * Mark task as completed
 */
export const completeTask = async (id: string): Promise<void> => {
  await updateTask(id, { status: TaskStatus.COMPLETED });
};

/**
 * Delete task
 */
export const deleteTask = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, TASKS_COLLECTION, id));
};

/**
 * Get task statistics
 */
export const getTaskStats = async (
  userId: string
): Promise<{
  total: number;
  completed: number;
  inProgress: number;
  overdue: number;
  upcoming: number;
}> => {
  const tasks = await getTasks(userId);
  const today = new Date();
  const nextWeek = new Date();
  nextWeek.setDate(today.getDate() + 7);

  return {
    total: tasks.length,
    completed: tasks.filter((t) => t.status === TaskStatus.COMPLETED).length,
    inProgress: tasks.filter((t) => t.status === TaskStatus.IN_PROGRESS).length,
    overdue: tasks.filter(
      (t) => t.dueDate < today && t.status !== TaskStatus.COMPLETED
    ).length,
    upcoming: tasks.filter(
      (t) =>
        t.dueDate >= today &&
        t.dueDate <= nextWeek &&
        t.status !== TaskStatus.COMPLETED
    ).length,
  };
};

export default {
  createTask,
  getTasks,
  getTaskById,
  getTasksByStatus,
  getTasksByCourse,
  getUpcomingTasks,
  getOverdueTasks,
  updateTask,
  completeTask,
  deleteTask,
  getTaskStats,
};
