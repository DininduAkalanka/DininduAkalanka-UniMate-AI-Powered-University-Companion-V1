import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../../constants/config';
import { ILLUSTRATIONS } from '../../../constants/illustrations';
import { indexTask } from '../../../services/ai/ragIndexer';
import { getCurrentUser } from '../../../services/authService';
import { getCourses } from '../../../services/courseServiceFirestore';
import { createTask } from '../../../services/taskServiceFirestore';
import { Course, TaskPriority, TaskStatus, TaskType } from '../../../types';

export default function AddTaskScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);

  // Form fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [courseId, setCourseId] = useState('');
  const [type, setType] = useState<TaskType>(TaskType.ASSIGNMENT);
  const [priority, setPriority] = useState<TaskPriority>(TaskPriority.MEDIUM);
  const [dueDate, setDueDate] = useState(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)); // 1 week from now
  const [estimatedHours, setEstimatedHours] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    initialize();
  }, []);

  // Set courseId when courses are loaded or params change
  useEffect(() => {
    if (courses.length > 0) {
      if (params.courseId && typeof params.courseId === 'string') {
        setCourseId(params.courseId);
      } else if (!courseId) {
        setCourseId(courses[0].id);
      }
    }
  }, [courses, params.courseId]);

  // Reset form when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (courses.length > 0) {
        setTitle('');
        setDescription('');
        setType(TaskType.ASSIGNMENT);
        setPriority(TaskPriority.MEDIUM);
        setDueDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
        setEstimatedHours('');
        // Preserve courseId from params
        if (params.courseId && typeof params.courseId === 'string') {
          setCourseId(params.courseId);
        }
      }
    }, [courses.length, params.courseId])
  );



  const initialize = async () => {
    try {
      const user = await getCurrentUser();
      if (!user) {
        router.replace('/');
        return;
      }
      setUserId(user.id);
      
      const coursesData = await getCourses(user.id);
      setCourses(coursesData);
      
      // Pre-select course if passed via params
      if (params.courseId && typeof params.courseId === 'string') {
        setCourseId(params.courseId);
      } else if (coursesData.length > 0) {
        setCourseId(coursesData[0].id);
      }
    } catch (error) {
      console.error('Initialization error:', error);
      Alert.alert('Error', 'Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!userId) return;

    // Validation
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a task title');
      return;
    }

    if (!courseId) {
      Alert.alert('Error', 'Please select a course');
      return;
    }

    setSaving(true);
    try {
      const newTask = await createTask({
        userId,
        courseId,
        title: title.trim(),
        description: description.trim() || undefined,
        type,
        priority,
        status: TaskStatus.TODO,
        dueDate,
        estimatedHours: estimatedHours ? parseFloat(estimatedHours) : undefined,
      });

      // Auto-index for RAG
      try {
        await indexTask(newTask);
        console.log('✅ Task indexed for RAG:', newTask.title);
      } catch (indexError) {
        console.warn('⚠️ Failed to index task for RAG:', indexError);
        // Don't fail the entire operation if indexing fails
      }

      // Clear form fields
      setTitle('');
      setDescription('');
      setType(TaskType.ASSIGNMENT);
      setPriority(TaskPriority.MEDIUM);
      setDueDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
      setEstimatedHours('');

      Alert.alert('Success', 'Task created successfully', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      console.error('Create task error:', error);
      Alert.alert('Error', 'Failed to create task');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (courses.length === 0) {
    return (
      <View style={styles.container}>
        <StatusBar style="light" />
        <LinearGradient colors={[COLORS.primary, COLORS.secondary]} style={styles.header}>
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Add Task</Text>
            <View style={{ width: 40 }} />
          </View>
        </LinearGradient>

        <View style={styles.emptyState}>
          <Image 
            source={ILLUSTRATIONS.courses}
            style={styles.emptyImage}
            contentFit="contain"
          />
          <Text style={styles.emptyText}>No courses yet!</Text>
          <Text style={styles.emptySubtext}>
            You need to add courses before creating tasks
          </Text>
          <TouchableOpacity
            style={styles.addCourseButton}
            onPress={() => router.push('/courses/add' as any)}
          >
            <LinearGradient
              colors={[COLORS.primary, COLORS.secondary]}
              style={styles.addCourseGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Ionicons name="add" size={20} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.addCourseButtonText}>Add Course First</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <StatusBar style="light" />
        
        <View style={styles.headerWrapper}>
          <Image 
            source={ILLUSTRATIONS.heroStudy3}
            style={styles.headerBackgroundImage}
            contentFit="cover"
          />
          <LinearGradient 
            colors={['rgba(88,86,214,0.9)', 'rgba(108,99,255,0.9)']} 
            style={styles.header}
          >
            <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add Task</Text>
          <View style={{ width: 40 }} />
            </View>
          </LinearGradient>
        </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled
      >
        {/* Title */}
        <View style={styles.section}>
          <Text style={styles.label}>Title *</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="create-outline" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="e.g., Math Assignment 1"
              placeholderTextColor="#999"
              value={title}
              onChangeText={setTitle}
              editable={!saving}
              autoCapitalize="sentences"
              returnKeyType="next"
              blurOnSubmit={false}
            />
          </View>
        </View>
        

        {/* Course */}
        <View style={styles.section}>
          <Text style={styles.label}>Course *</Text>
          <View style={styles.pickerWrapper}>
            <Ionicons name="book-outline" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={courseId}
                onValueChange={(value) => setCourseId(value)}
                enabled={!saving}
                style={styles.picker}
                mode="dropdown"
              >
                {courses.map(course => (
                  <Picker.Item
                    key={course.id}
                    label={`${course.code} - ${course.name}`}
                    value={course.id}
                  />
                ))}
              </Picker>
            </View>
          </View>
        </View>

        {/* Type */}
        <View style={styles.section}>
          <Text style={styles.label}>Type</Text>
          <View style={styles.pickerWrapper}>
            <Ionicons name="list-outline" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={type}
                onValueChange={(itemValue) => setType(itemValue as TaskType)}
                enabled={!saving}
                style={styles.picker}
                mode="dropdown"
              >
                <Picker.Item label="Assignment" value={TaskType.ASSIGNMENT} />
                <Picker.Item label="Exam" value={TaskType.EXAM} />
                <Picker.Item label="Quiz" value={TaskType.QUIZ} />
                <Picker.Item label="Project" value={TaskType.PROJECT} />
                <Picker.Item label="Study" value={TaskType.STUDY} />
                <Picker.Item label="Other" value={TaskType.OTHER} />
              </Picker>
            </View>
          </View>
        </View>

        {/* Priority */}
        <View style={styles.section}>
          <Text style={styles.label}>Priority</Text>
          <View style={styles.priorityButtons}>
            {[TaskPriority.LOW, TaskPriority.MEDIUM, TaskPriority.HIGH].map(p => (
              <TouchableOpacity
                key={p}
                style={[
                  styles.priorityButton,
                  priority === p && styles.priorityButtonActive,
                  { borderColor: p === TaskPriority.HIGH ? COLORS.error : p === TaskPriority.MEDIUM ? COLORS.warning : COLORS.success }
                ]}
                onPress={() => setPriority(p)}
                disabled={saving}
              >
                <Text style={[
                  styles.priorityButtonText,
                  priority === p && styles.priorityButtonTextActive
                ]}>
                  {p}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Due Date */}
        <View style={styles.section}>
          <Text style={styles.label}>Due Date</Text>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowDatePicker(true)}
            disabled={saving}
          >
            <Ionicons name="calendar-outline" size={20} color={COLORS.primary} />
            <Text style={styles.dateText}>
              {dueDate.toLocaleDateString('en-US', {
                weekday: 'short',
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </Text>
          </TouchableOpacity>
          
          {showDatePicker && (
            <DateTimePicker
              value={dueDate}
              mode="date"
              display="default"
              onChange={(event, selectedDate) => {
                setShowDatePicker(Platform.OS === 'ios');
                if (selectedDate) setDueDate(selectedDate);
              }}
              minimumDate={new Date()}
            />
          )}
        </View>

        {/* Estimated Hours */}
        <View style={styles.section}>
          <Text style={styles.label}>Estimated Hours (Optional)</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="time-outline" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="e.g., 5"
              placeholderTextColor="#999"
              value={estimatedHours}
              onChangeText={setEstimatedHours}
              keyboardType="numeric"
              editable={!saving}
              returnKeyType="next"
            />
          </View>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.label}>Description (Optional)</Text>
          <View style={[styles.inputWrapper, styles.textAreaWrapper]}>
            <Ionicons name="document-text-outline" size={20} color={COLORS.textSecondary} style={[styles.inputIcon, styles.textAreaIcon]} />
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Add notes or details about this task..."
              placeholderTextColor="#999"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              editable={!saving}
              autoCapitalize="sentences"
              returnKeyType="done"
            />
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          <LinearGradient
            colors={saving ? [COLORS.textSecondary, COLORS.textSecondary] : [COLORS.primary, COLORS.secondary]}
            style={styles.saveButtonGradient}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="checkmark-circle-outline" size={24} color="#fff" />
                <Text style={styles.saveButtonText}>Create Task</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.primary,
  },
  headerWrapper: {
    position: 'relative',
    overflow: 'hidden',
  },
  headerBackgroundImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 10 : 40,
    paddingBottom: 20,
    paddingHorizontal: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 20,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#e8e8e8',
    paddingHorizontal: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    minHeight: 52,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 0,
    fontSize: 15,
    color: COLORS.text,
    fontWeight: '500',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
    paddingTop: 14,
    paddingBottom: 14,
  },
  textAreaWrapper: {
    alignItems: 'flex-start',
    minHeight: 100,
  },
  textAreaIcon: {
    marginTop: 14,
    alignSelf: 'flex-start',
  },
  pickerWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#e8e8e8',
    paddingLeft: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    overflow: Platform.OS === 'android' ? 'hidden' : 'visible',
     minHeight: Platform.OS === 'ios' ? 44 : undefined,
  },
  pickerContainer: {
    flex: 1,
    justifyContent: 'center',
    borderRadius: 12,
    overflow: Platform.OS === 'android' ? 'hidden' : 'visible',
  },
  picker: {
    height: Platform.OS === 'ios' ? 44 : 50,
    width: '100%',
    color: COLORS.text,
    backgroundColor: 'transparent',
  },
  priorityButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  priorityButton: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: 'center',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  priorityButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  priorityButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  priorityButtonTextActive: {
    color: '#fff',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#e8e8e8',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    minHeight: 52,
  },
  dateText: {
    fontSize: 15,
    color: COLORS.text,
    fontWeight: '500',
    marginLeft: 10,
  },
  saveButton: {
    marginTop: 8,
    marginBottom: 32,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonGradient: {
    flexDirection: 'row',
    paddingVertical: 15,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: 'bold',
    marginLeft: 8,
    letterSpacing: 0.5,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyImage: {
    width: 220,
    height: 220,
  },
  emptyText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: 24,
  },
  emptySubtext: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 32,
  },
  addCourseButton: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  addCourseGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  addCourseButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
