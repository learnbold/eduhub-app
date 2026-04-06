import React, { useEffect, useState } from 'react';
import { 
  ActivityIndicator, 
  Alert,
  FlatList, 
  Modal, 
  Pressable, 
  StyleSheet, 
  Text, 
  TextInput, 
  View 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { 
  getMyHub, 
  getHubCourses, 
  createCourse, 
  getModulesByCourse,
  createModule,
  getLessonsByModule,
  createLesson,
  getVideoFileType,
  requestVideoUploadUrl,
  createVideo,
  processVideo,
  uploadVideoFile,
} from '../services/api';

export default function TeachScreen() {
  const [hub, setHub] = useState(null);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modals state
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [managingCourse, setManagingCourse] = useState(null);
  
  const [showModuleModal, setShowModuleModal] = useState(false);
  const [managingModule, setManagingModule] = useState(null);
  const [modules, setModules] = useState([]);
  
  const [showLessonModal, setShowLessonModal] = useState(false);
  const [lessons, setLessons] = useState([]);
  
  // Forms
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  
  useEffect(() => {
    loadDashboard();
  }, []);

  const handleScreenError = (titleText, error, fallbackMessage) => {
    console.log(`${titleText} error:`, error?.response || error);
    Alert.alert(titleText, error?.message || fallbackMessage);
  };

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const hubData = await getMyHub();
      setHub(hubData);
      if (hubData?._id) {
        const coursesData = await getHubCourses(hubData._id);
        setCourses(Array.isArray(coursesData) ? coursesData : []);
      }
    } catch (error) {
      handleScreenError('Dashboard unavailable', error, 'Unable to load your teacher dashboard right now.');
      setHub(null);
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCourse = async () => {
    if (!title || !hub?._id) return;
    try {
      await createCourse({
        title,
        description,
        category: '',
        hubId: hub._id,
        price: 0,
        isFree: true,
        thumbnail: '',
        level: 'beginner',
        tags: [],
      });
      setShowCourseModal(false);
      setTitle('');
      setDescription('');
      await loadDashboard();
    } catch (error) {
      handleScreenError('Course not created', error, 'Unable to create the course right now.');
    }
  };

  const openManageCourse = async (course) => {
    setManagingCourse(course);
    setModules([]);
    try {
      const res = await getModulesByCourse(course._id);
      setModules(Array.isArray(res) ? res : []);
    } catch (e) {
      handleScreenError('Modules unavailable', e, 'Unable to load modules for this course.');
    }
  };

  const handleCreateModule = async () => {
    if (!title || !managingCourse?._id) return;
    try {
      await createModule({ title, description, courseId: managingCourse._id });
      setTitle('');
      setDescription('');
      setShowModuleModal(false);
      await openManageCourse(managingCourse);
    } catch (e) {
      handleScreenError('Module not created', e, 'Unable to create the module right now.');
    }
  };

  const openManageModule = async (mod) => {
    setManagingModule(mod);
    setLessons([]);
    try {
      const res = await getLessonsByModule(mod._id);
      setLessons(Array.isArray(res) ? res : []);
    } catch (e) {
      handleScreenError('Lessons unavailable', e, 'Unable to load lessons for this module.');
    }
  };

  const handleCreateLesson = async () => {
    if (!title || !managingModule?._id) return;
    try {
      await createLesson({ 
        title, 
        moduleId: managingModule._id, 
        courseId: managingCourse._id,
        videoUrl: '',
        isPreview: false,
      });
      setTitle('');
      setShowLessonModal(false);
      await openManageModule(managingModule);
    } catch (e) {
      handleScreenError('Lesson not created', e, 'Unable to create the lesson right now.');
    }
  };

  const handleUploadVideo = async (lesson) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: 'video/*' });
      if (result.canceled || !result.assets[0] || !hub?._id || !managingCourse?._id) return;
      const file = result.assets[0];
      const fileType = getVideoFileType(file);

      const uploadData = await requestVideoUploadUrl({
        courseId: managingCourse._id,
        hubId: hub._id,
        fileType,
        videoType: 'course',
      });

      const localFileResponse = await fetch(file.uri);
      const fileBlob = await localFileResponse.blob();

      await uploadVideoFile(uploadData.uploadUrl, fileBlob, file.mimeType || `video/${fileType}`);

      const videoRes = await createVideo({
        title: lesson.title || file.name?.replace(/\.[^.]+$/, '') || 'Lesson video',
        description: '',
        hubId: hub._id,
        courseId: managingCourse._id,
        lessonId: lesson._id,
        videoUrl: uploadData.fileUrl,
        videoType: 'course',
      });

      await processVideo(videoRes._id);
      await openManageModule(managingModule);
      Alert.alert('Upload started', 'Video uploaded successfully. Processing has started.');
    } catch (e) {
      handleScreenError('Video upload failed', e, 'Unable to upload and process the video right now.');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#6366F1" />
        </View>
      </SafeAreaView>
    );
  }

  // If a module is being managed
  if (managingModule) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Pressable onPress={() => setManagingModule(null)} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#F8FAFC" />
          </Pressable>
          <Text style={styles.headerTitle} numberOfLines={1}>{managingModule.title}</Text>
        </View>
        <View style={styles.content}>
          <Pressable style={styles.addButton} onPress={() => setShowLessonModal(true)}>
            <Ionicons name="add" size={20} color="#fff" />
            <Text style={styles.addButtonText}>Add Lesson</Text>
          </Pressable>
          <FlatList
            data={lessons}
            keyExtractor={item => item._id}
            renderItem={({ item }) => (
              <View style={styles.listItem}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.listItemTitle}>{item.title}</Text>
                  <Text style={styles.listItemSub}>
                    {item.videoId || item.videoUrl ? 'Video Attached' : 'No Video'}
                  </Text>
                </View>
                <Pressable style={styles.actionBtn} onPress={() => handleUploadVideo(item)}>
                  <Ionicons name="cloud-upload-outline" size={18} color="#6366F1" />
                </Pressable>
              </View>
            )}
          />
        </View>

        {/* Modal for creating Lesson */}
        <Modal visible={showLessonModal} animationType="slide" transparent>
          <View style={styles.modalBg}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>New Lesson</Text>
              <TextInput
                style={styles.input}
                placeholder="Lesson Title"
                placeholderTextColor="#64748B"
                value={title}
                onChangeText={setTitle}
              />
              <View style={styles.modalActions}>
                <Pressable style={styles.modalCancel} onPress={() => setShowLessonModal(false)}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </Pressable>
                <Pressable style={styles.modalSubmit} onPress={handleCreateLesson}>
                  <Text style={styles.submitText}>Create</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    );
  }

  // If a course is being managed
  if (managingCourse) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Pressable onPress={() => setManagingCourse(null)} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#F8FAFC" />
          </Pressable>
          <Text style={styles.headerTitle} numberOfLines={1}>{managingCourse.title}</Text>
        </View>
        <View style={styles.content}>
          <Pressable style={styles.addButton} onPress={() => setShowModuleModal(true)}>
            <Ionicons name="add" size={20} color="#fff" />
            <Text style={styles.addButtonText}>Add Module</Text>
          </Pressable>
          <FlatList
            data={modules}
            keyExtractor={item => item._id}
            renderItem={({ item }) => (
              <Pressable style={styles.listItem} onPress={() => openManageModule(item)}>
                <Text style={styles.listItemTitle}>{item.title}</Text>
                <Ionicons name="chevron-forward" size={20} color="#64748B" />
              </Pressable>
            )}
          />
        </View>

        {/* Modal for creating Module */}
        <Modal visible={showModuleModal} animationType="slide" transparent>
          <View style={styles.modalBg}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>New Module</Text>
              <TextInput
                style={styles.input}
                placeholder="Module Title"
                placeholderTextColor="#64748B"
                value={title}
                onChangeText={setTitle}
              />
              <View style={styles.modalActions}>
                <Pressable style={styles.modalCancel} onPress={() => setShowModuleModal(false)}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </Pressable>
                <Pressable style={styles.modalSubmit} onPress={handleCreateModule}>
                  <Text style={styles.submitText}>Create</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    );
  }

  // Main Dashboard
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <View style={styles.screen}>
        <View style={styles.headerBlock}>
          <Text style={styles.brand}>Sparklass</Text>
          <Text style={styles.subtitle}>Teacher Dashboard</Text>
        </View>

        <Pressable style={styles.addButtonMain} onPress={() => setShowCourseModal(true)}>
          <Ionicons name="add-circle-outline" size={24} color="#fff" />
          <Text style={styles.addButtonText}>Create New Course</Text>
        </Pressable>

        <Text style={styles.sectionTitle}>Your Courses ({courses.length})</Text>
        <FlatList
          data={courses}
          keyExtractor={item => item._id}
          contentContainerStyle={{ paddingBottom: 60 }}
          renderItem={({ item }) => (
            <Pressable style={styles.courseCard} onPress={() => openManageCourse(item)}>
              <Text style={styles.courseTitle}>{item.title}</Text>
              <Text style={styles.courseCategory}>{item.category || 'General'}</Text>
            </Pressable>
          )}
        />
      </View>

      {/* Modal for Creating Course */}
      <Modal visible={showCourseModal} animationType="slide" transparent>
        <View style={styles.modalBg}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Create Course</Text>
            <TextInput
              style={styles.input}
              placeholder="Course Title"
              placeholderTextColor="#64748B"
              value={title}
              onChangeText={setTitle}
            />
            <TextInput
              style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
              placeholder="Description"
              placeholderTextColor="#64748B"
              multiline
              value={description}
              onChangeText={setDescription}
            />
            <View style={styles.modalActions}>
              <Pressable style={styles.modalCancel} onPress={() => { setShowCourseModal(false); setTitle(''); setDescription(''); }}>
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.modalSubmit} onPress={handleCreateCourse}>
                <Text style={styles.submitText}>Save Course</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0F172A' },
  screen: { flex: 1, paddingHorizontal: 18, paddingTop: 12 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerBlock: { marginBottom: 24 },
  brand: { color: '#F8FAFC', fontSize: 26, fontWeight: '800' },
  subtitle: { color: '#818CF8', fontSize: 15, fontWeight: '600', marginTop: 4 },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(148, 163, 184, 0.1)' },
  backBtn: { marginRight: 12 },
  headerTitle: { color: '#F8FAFC', fontSize: 20, fontWeight: '700', flex: 1 },
  content: { flex: 1, padding: 16 },
  sectionTitle: { color: '#94A3B8', fontSize: 13, fontWeight: '700', textTransform: 'uppercase', marginBottom: 12, marginTop: 24 },
  addButtonMain: { backgroundColor: '#6366F1', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 16, gap: 8 },
  addButton: { backgroundColor: '#1E293B', flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 12, gap: 8, marginBottom: 16 },
  addButtonText: { color: '#F8FAFC', fontSize: 16, fontWeight: '600' },
  courseCard: { backgroundColor: '#1E293B', borderRadius: 18, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(148, 163, 184, 0.12)' },
  courseTitle: { color: '#F8FAFC', fontSize: 18, fontWeight: '700', marginBottom: 8 },
  courseCategory: { color: '#94A3B8', fontSize: 14 },
  listItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111C34', borderRadius: 12, padding: 16, marginBottom: 12 },
  listItemTitle: { flex: 1, color: '#F8FAFC', fontSize: 16, fontWeight: '600' },
  listItemSub: { color: '#94A3B8', fontSize: 12, marginTop: 4 },
  actionBtn: { padding: 8, backgroundColor: 'rgba(99, 102, 241, 0.1)', borderRadius: 8 },
  modalBg: { flex: 1, backgroundColor: 'rgba(2, 6, 23, 0.8)', justifyContent: 'center', padding: 20 },
  modalCard: { backgroundColor: '#1E293B', borderRadius: 24, padding: 24, borderWidth: 1, borderColor: 'rgba(148, 163, 184, 0.2)' },
  modalTitle: { color: '#F8FAFC', fontSize: 20, fontWeight: '800', marginBottom: 20 },
  input: { backgroundColor: '#111C34', color: '#F8FAFC', borderRadius: 12, padding: 16, fontSize: 16, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(148, 163, 184, 0.1)' },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 8 },
  modalCancel: { paddingVertical: 12, paddingHorizontal: 16 },
  cancelText: { color: '#94A3B8', fontSize: 16, fontWeight: '600' },
  modalSubmit: { backgroundColor: '#6366F1', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 12 },
  submitText: { color: '#F8FAFC', fontSize: 16, fontWeight: '700' },
});
