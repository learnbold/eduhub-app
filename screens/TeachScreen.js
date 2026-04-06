import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { useAuth } from '../context/AuthContext';
import ModuleAccordion from '../components/ModuleAccordion';
import TeacherCourseCard from '../components/TeacherCourseCard';
import UploadButton from '../components/UploadButton';
import {
  addHubAdmin,
  addHubTeacher,
  attachLessonVideo,
  createCourse,
  createLesson,
  createModule,
  createVideo,
  fetchHubActivity,
  fetchHubTeam,
  fetchManagedHubVideos,
  getHubCourses,
  getLessonsByModule,
  getModulesByCourse,
  getMyHub,
  getVideoFileType,
  processVideo,
  publishCourse,
  requestVideoUploadUrl,
  updateCourse,
  updateHubSettings,
  uploadVideoFile,
} from '../services/api';

const DASHBOARD_TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'courses', label: 'Courses' },
  { id: 'content', label: 'Content' },
  { id: 'videos', label: 'Videos' },
  { id: 'team', label: 'Team' },
  { id: 'settings', label: 'Settings' },
];

const initialCourseForm = {
  title: '',
  description: '',
  thumbnail: '',
  price: '0',
  category: '',
};

const initialModuleForm = {
  title: '',
  description: '',
};

const initialLessonForm = {
  title: '',
  duration: '',
  isPreview: false,
};

const initialVideoForm = {
  title: '',
  description: '',
  videoType: 'course',
  courseId: '',
  lessonId: '',
  file: null,
};

const initialSettingsForm = {
  name: '',
  slug: '',
  description: '',
  logo: '',
  banner: '',
  primaryColor: '#0f172a',
  secondaryColor: '#f59e0b',
};

const initialMemberForm = {
  email: '',
  role: 'teacher',
};

const inferMemberRole = (hub, user) => {
  if (!hub || !user) {
    return '';
  }

  if (hub.ownerId && hub.ownerId === user._id) {
    return 'owner';
  }

  const matchesUser = (member) =>
    member?._id === user?._id ||
    (member?.email && user?.email && member.email.toLowerCase() === user.email.toLowerCase());

  if (Array.isArray(hub.admins) && hub.admins.some(matchesUser)) {
    return 'admin';
  }

  return user?.role === 'admin' ? 'admin' : 'teacher';
};

const formatTimestamp = (timestamp) => {
  if (!timestamp) {
    return 'Recently';
  }

  try {
    return new Date(timestamp).toLocaleString();
  } catch {
    return 'Recently';
  }
};

const getCourseStatus = (course) => {
  if (course?.status === 'archived') {
    return 'Archived';
  }

  if (course?.status === 'published' || course?.isPublished) {
    return 'Published';
  }

  return 'Draft';
};

export default function TeachScreen({ navigation }) {
  const { becomeTeacher, isAuthenticated, isHydrating, user } = useAuth();
  const hasDashboardAccess = user?.role === 'teacher' || user?.role === 'admin';

  const [activeTab, setActiveTab] = useState('overview');
  const [workspaceLoading, setWorkspaceLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hub, setHub] = useState(null);
  const [memberRole, setMemberRole] = useState('');
  const [courses, setCourses] = useState([]);
  const [videos, setVideos] = useState([]);
  const [team, setTeam] = useState({ owner: null, admins: [], teachers: [] });
  const [activity, setActivity] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [modulesByCourse, setModulesByCourse] = useState({});
  const [lessonsByModule, setLessonsByModule] = useState({});
  const [expandedModuleIds, setExpandedModuleIds] = useState({});
  const [loadingModules, setLoadingModules] = useState(false);
  const [loadingLessonsByModule, setLoadingLessonsByModule] = useState({});
  const [busyAction, setBusyAction] = useState('');

  const [courseModalVisible, setCourseModalVisible] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [courseForm, setCourseForm] = useState(initialCourseForm);

  const [moduleModalVisible, setModuleModalVisible] = useState(false);
  const [moduleForm, setModuleForm] = useState(initialModuleForm);

  const [lessonModalVisible, setLessonModalVisible] = useState(false);
  const [activeModule, setActiveModule] = useState(null);
  const [lessonForm, setLessonForm] = useState(initialLessonForm);

  const [videoModalVisible, setVideoModalVisible] = useState(false);
  const [videoForm, setVideoForm] = useState(initialVideoForm);

  const [memberModalVisible, setMemberModalVisible] = useState(false);
  const [memberForm, setMemberForm] = useState(initialMemberForm);

  const [settingsForm, setSettingsForm] = useState(initialSettingsForm);

  const selectedCourse = courses.find((course) => course._id === selectedCourseId) || null;
  const selectedCourseModules = modulesByCourse[selectedCourseId] || [];
  const uploadCourseId = videoForm.courseId || selectedCourseId || courses[0]?._id || '';
  const uploadModules = modulesByCourse[uploadCourseId] || [];
  const uploadLessonOptions = uploadModules.flatMap((moduleDoc) =>
    (lessonsByModule[moduleDoc._id] || []).map((lesson) => ({
      ...lesson,
      moduleTitle: moduleDoc.title,
    }))
  );
  const stats = {
    courses: courses.length,
    students: '--',
    videos: videos.length,
    teamMembers: 1 + (team.admins?.length || 0) + (team.teachers?.length || 0),
  };

  const setFieldValue = (setter, key, value) => {
    setter((current) => ({ ...current, [key]: value }));
  };

  const showError = (title, error, fallbackMessage) => {
    console.log(`${title}:`, error?.response || error);
    Alert.alert(title, error?.message || fallbackMessage);
  };

  const closeCourseModal = () => {
    setCourseModalVisible(false);
    setEditingCourse(null);
    setCourseForm(initialCourseForm);
  };

  const closeModuleModal = () => {
    setModuleModalVisible(false);
    setModuleForm(initialModuleForm);
  };

  const closeLessonModal = () => {
    setLessonModalVisible(false);
    setActiveModule(null);
    setLessonForm(initialLessonForm);
  };

  const closeVideoModal = () => {
    setVideoModalVisible(false);
    setVideoForm({ ...initialVideoForm, courseId: selectedCourseId || courses[0]?._id || '' });
  };

  const closeMemberModal = () => {
    setMemberModalVisible(false);
    setMemberForm(initialMemberForm);
  };

  const loadWorkspace = async ({ silent = false } = {}) => {
    if (!hasDashboardAccess) {
      setWorkspaceLoading(false);
      return;
    }

    try {
      if (silent) {
        setRefreshing(true);
      } else {
        setWorkspaceLoading(true);
      }

      const hubData = await getMyHub();
      const nextMemberRole = inferMemberRole(hubData, user);
      const [coursesData, videosData] = await Promise.all([
        getHubCourses(hubData._id),
        fetchManagedHubVideos(hubData._id).catch(() => []),
      ]);

      setHub(hubData);
      setMemberRole(nextMemberRole);
      setCourses(Array.isArray(coursesData) ? coursesData : []);
      setVideos(Array.isArray(videosData) ? videosData : []);
      setSelectedCourseId((currentId) => currentId || coursesData?.[0]?._id || '');
    } catch (error) {
      setHub(null);
      setCourses([]);
      setVideos([]);
      showError('Hub unavailable', error, 'Unable to load your teacher hub right now.');
    } finally {
      setWorkspaceLoading(false);
      setRefreshing(false);
    }
  };

  const loadTeam = async () => {
    if (!hub?._id) {
      return;
    }

    try {
      const nextTeam = await fetchHubTeam(hub._id);
      setTeam(nextTeam);
    } catch (error) {
      setTeam({
        owner: hub?.ownerProfile || null,
        admins: hub?.admins || [],
        teachers: hub?.teachers || [],
      });
      showError('Team unavailable', error, 'Unable to load hub team details right now.');
    }
  };

  const loadActivity = async () => {
    if (!hub?._id) {
      return;
    }

    try {
      const nextActivity = await fetchHubActivity(hub._id);
      setActivity(Array.isArray(nextActivity) ? nextActivity.slice(0, 5) : []);
    } catch (error) {
      setActivity([]);
      console.log('Hub activity error:', error?.response || error);
    }
  };

  const loadModulesForCourse = async (courseId, { withLessons = false } = {}) => {
    if (!courseId) {
      return;
    }

    try {
      setLoadingModules(true);
      const nextModules = await getModulesByCourse(courseId);
      setModulesByCourse((current) => ({ ...current, [courseId]: nextModules }));

      if (withLessons) {
        const lessonEntries = await Promise.all(
          nextModules.map(async (moduleDoc) => [moduleDoc._id, await getLessonsByModule(moduleDoc._id)])
        );

        setLessonsByModule((current) => {
          const nextState = { ...current };
          lessonEntries.forEach(([moduleId, lessons]) => {
            nextState[moduleId] = lessons;
          });
          return nextState;
        });
      }
    } catch (error) {
      showError('Content unavailable', error, 'Unable to load modules for this course right now.');
    } finally {
      setLoadingModules(false);
    }
  };

  const loadLessonsForModule = async (moduleId, { force = false } = {}) => {
    if (!moduleId || (lessonsByModule[moduleId] && !force)) {
      return;
    }

    try {
      setLoadingLessonsByModule((current) => ({ ...current, [moduleId]: true }));
      const nextLessons = await getLessonsByModule(moduleId);
      setLessonsByModule((current) => ({ ...current, [moduleId]: nextLessons }));
    } catch (error) {
      showError('Lessons unavailable', error, 'Unable to load lessons for this module right now.');
    } finally {
      setLoadingLessonsByModule((current) => ({ ...current, [moduleId]: false }));
    }
  };

  const refreshVideos = async () => {
    if (!hub?._id) {
      return;
    }

    try {
      const nextVideos = await fetchManagedHubVideos(hub._id);
      setVideos(Array.isArray(nextVideos) ? nextVideos : []);
    } catch (error) {
      showError('Videos unavailable', error, 'Unable to refresh hub videos right now.');
    }
  };

  const pickVideoFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: 'video/*' });
    if (result.canceled || !result.assets?.[0]) {
      return null;
    }
    return result.assets[0];
  };

  const runVideoUpload = async ({ courseId, description, file, lessonId, title, videoType }) => {
    if (!hub?._id || !file) {
      return;
    }

    const normalizedVideoType = videoType || 'course';
    const fileType = getVideoFileType(file);
    const fileResponse = await fetch(file.uri);
    const fileBlob = await fileResponse.blob();

    const uploadPayload = await requestVideoUploadUrl({
      courseId: normalizedVideoType === 'standalone' ? undefined : courseId,
      hubId: hub._id,
      fileType,
      videoType: normalizedVideoType,
    });

    await uploadVideoFile(uploadPayload.uploadUrl, fileBlob, file.mimeType || `video/${fileType}`);

    const createdVideo = await createVideo({
      title,
      description,
      courseId: normalizedVideoType === 'standalone' ? undefined : courseId,
      hubId: hub._id,
      videoUrl: uploadPayload.fileUrl,
      videoType: normalizedVideoType,
    });

    if (lessonId) {
      await attachLessonVideo(lessonId, createdVideo._id);
    }

    await processVideo(createdVideo._id);
    await refreshVideos();

    if (courseId) {
      await loadModulesForCourse(courseId, { withLessons: true });
    }
  };

  const handleBecomeTeacher = async () => {
    try {
      setBusyAction('become-teacher');
      await becomeTeacher();
      await loadWorkspace();
    } catch (error) {
      showError('Upgrade unavailable', error, 'Unable to upgrade this account to teacher right now.');
    } finally {
      setBusyAction('');
    }
  };

  const handleOpenCreateCourse = () => {
    setEditingCourse(null);
    setCourseForm(initialCourseForm);
    setCourseModalVisible(true);
  };

  const handleOpenEditCourse = (course) => {
    setEditingCourse(course);
    setCourseForm({
      title: course?.title || '',
      description: course?.description || '',
      thumbnail: course?.thumbnail || '',
      price: String(course?.price ?? 0),
      category: course?.category || '',
    });
    setCourseModalVisible(true);
  };

  const handleSubmitCourse = async () => {
    if (!hub?._id || !courseForm.title.trim()) {
      return;
    }

    try {
      setBusyAction('save-course');
      const payload = {
        title: courseForm.title.trim(),
        description: courseForm.description.trim(),
        category: courseForm.category.trim(),
        hubId: hub._id,
        price: Number(courseForm.price || 0),
        isFree: Number(courseForm.price || 0) === 0,
        thumbnail: courseForm.thumbnail.trim(),
        level: 'beginner',
        tags: [],
      };

      if (editingCourse?._id) {
        const updatedCourse = await updateCourse(editingCourse._id, payload);
        setCourses((current) => current.map((course) => (course._id === updatedCourse._id ? updatedCourse : course)));
      } else {
        const createdCourse = await createCourse(payload);
        setCourses((current) => [createdCourse, ...current]);
        setSelectedCourseId(createdCourse._id);
      }

      closeCourseModal();
    } catch (error) {
      showError('Course not saved', error, 'Unable to save the course right now.');
    } finally {
      setBusyAction('');
    }
  };

  const handlePublishCourse = async (course) => {
    if (!course?._id || getCourseStatus(course) === 'Published') {
      return;
    }

    try {
      setBusyAction(`publish-${course._id}`);
      const updatedCourse = await publishCourse(course._id);
      setCourses((current) => current.map((item) => (item._id === updatedCourse._id ? updatedCourse : item)));
      Alert.alert('Course published', `${updatedCourse.title} is now live.`);
    } catch (error) {
      showError('Publish failed', error, 'Unable to publish the course right now.');
    } finally {
      setBusyAction('');
    }
  };

  const handleOpenCreateModule = () => {
    if (!selectedCourseId) {
      Alert.alert('Select a course', 'Choose a course first so we know where to create the module.');
      return;
    }

    setModuleForm(initialModuleForm);
    setModuleModalVisible(true);
  };

  const handleSubmitModule = async () => {
    if (!selectedCourseId || !moduleForm.title.trim()) {
      return;
    }

    try {
      setBusyAction('save-module');
      const createdModule = await createModule({
        courseId: selectedCourseId,
        title: moduleForm.title.trim(),
        description: moduleForm.description.trim(),
      });

      setModulesByCourse((current) => ({
        ...current,
        [selectedCourseId]: [...(current[selectedCourseId] || []), createdModule].sort(
          (first, second) => first.position - second.position
        ),
      }));
      setExpandedModuleIds((current) => ({ ...current, [createdModule._id]: true }));
      closeModuleModal();
    } catch (error) {
      showError('Module not created', error, 'Unable to create the module right now.');
    } finally {
      setBusyAction('');
    }
  };

  const handleOpenCreateLesson = (moduleDoc) => {
    setActiveModule(moduleDoc);
    setLessonForm(initialLessonForm);
    setLessonModalVisible(true);
  };

  const handleSubmitLesson = async () => {
    if (!selectedCourseId || !activeModule?._id || !lessonForm.title.trim()) {
      return;
    }

    try {
      setBusyAction('save-lesson');
      const createdLesson = await createLesson({
        moduleId: activeModule._id,
        courseId: selectedCourseId,
        title: lessonForm.title.trim(),
        videoUrl: '',
        duration: lessonForm.duration === '' ? undefined : Number(lessonForm.duration),
        isPreview: Boolean(lessonForm.isPreview),
      });

      setLessonsByModule((current) => ({
        ...current,
        [activeModule._id]: [...(current[activeModule._id] || []), createdLesson].sort(
          (first, second) => first.position - second.position
        ),
      }));
      closeLessonModal();
    } catch (error) {
      showError('Lesson not created', error, 'Unable to create the lesson right now.');
    } finally {
      setBusyAction('');
    }
  };

  const handleToggleModule = async (moduleDoc) => {
    const nextExpanded = !expandedModuleIds[moduleDoc._id];
    setExpandedModuleIds((current) => ({ ...current, [moduleDoc._id]: nextExpanded }));
    if (nextExpanded) {
      await loadLessonsForModule(moduleDoc._id);
    }
  };

  const handleQuickLessonUpload = async (lesson) => {
    try {
      setBusyAction(`upload-${lesson._id}`);
      const file = await pickVideoFile();
      if (!file) {
        return;
      }

      await runVideoUpload({
        courseId: selectedCourseId,
        description: '',
        file,
        lessonId: lesson._id,
        title: lesson.title || file.name?.replace(/\.[^.]+$/, '') || 'Lesson video',
        videoType: 'course',
      });
      Alert.alert('Upload started', 'Video uploaded successfully. Processing has started.');
    } catch (error) {
      showError('Video upload failed', error, 'Unable to upload the lesson video right now.');
    } finally {
      setBusyAction('');
    }
  };

  const handleOpenVideoModal = async () => {
    const defaultCourseId = selectedCourseId || courses[0]?._id || '';
    setVideoForm({ ...initialVideoForm, courseId: defaultCourseId });
    setVideoModalVisible(true);

    if (defaultCourseId) {
      await loadModulesForCourse(defaultCourseId, { withLessons: true });
    }
  };

  const handlePickModalVideo = async () => {
    try {
      const file = await pickVideoFile();
      if (!file) {
        return;
      }

      setVideoForm((current) => ({
        ...current,
        file,
        title: current.title || file.name?.replace(/\.[^.]+$/, '') || '',
      }));
    } catch (error) {
      showError('File unavailable', error, 'Unable to read the selected video file right now.');
    }
  };

  const handleSubmitVideo = async () => {
    if (!videoForm.file || !videoForm.title.trim()) {
      return;
    }

    if (videoForm.videoType === 'course' && !uploadCourseId) {
      Alert.alert('Select a course', 'Choose a course before uploading a course video.');
      return;
    }

    try {
      setBusyAction('save-video');
      await runVideoUpload({
        courseId: videoForm.videoType === 'standalone' ? '' : uploadCourseId,
        description: videoForm.description.trim(),
        file: videoForm.file,
        lessonId: videoForm.videoType === 'course' ? videoForm.lessonId : '',
        title: videoForm.title.trim(),
        videoType: videoForm.videoType,
      });
      closeVideoModal();
      Alert.alert('Upload started', 'Video uploaded successfully. Processing has started.');
    } catch (error) {
      showError('Upload failed', error, 'Unable to upload this video right now.');
    } finally {
      setBusyAction('');
    }
  };

  const handleOpenMemberModal = (role) => {
    setMemberForm({ email: '', role });
    setMemberModalVisible(true);
  };

  const handleSubmitMember = async () => {
    if (!hub?._id || !memberForm.email.trim()) {
      return;
    }

    try {
      setBusyAction('save-member');
      if (memberForm.role === 'admin') {
        await addHubAdmin(hub._id, { email: memberForm.email.trim() });
      } else {
        await addHubTeacher(hub._id, { email: memberForm.email.trim() });
      }

      await loadTeam();
      closeMemberModal();
    } catch (error) {
      showError('Team update failed', error, 'Unable to update the team right now.');
    } finally {
      setBusyAction('');
    }
  };

  const handleSaveSettings = async () => {
    if (!hub?._id || !settingsForm.name.trim() || !settingsForm.slug.trim()) {
      return;
    }

    try {
      setBusyAction('save-settings');
      const response = await updateHubSettings(hub._id, {
        name: settingsForm.name.trim(),
        slug: settingsForm.slug.trim(),
        description: settingsForm.description.trim(),
        logo: settingsForm.logo.trim(),
        banner: settingsForm.banner.trim(),
        primaryColor: settingsForm.primaryColor.trim(),
        secondaryColor: settingsForm.secondaryColor.trim(),
      });
      setHub(response.hub);
      Alert.alert('Settings updated', 'Hub settings saved successfully.');
    } catch (error) {
      showError('Settings failed', error, 'Unable to update hub settings right now.');
    } finally {
      setBusyAction('');
    }
  };

  useEffect(() => {
    loadWorkspace();
  }, [hasDashboardAccess, user?._id]);

  useEffect(() => {
    if (!hub) {
      return;
    }

    setSettingsForm({
      name: hub.name || '',
      slug: hub.slug || '',
      description: hub.description || '',
      logo: hub.logo || '',
      banner: hub.banner || '',
      primaryColor: hub.primaryColor || '#0f172a',
      secondaryColor: hub.secondaryColor || '#f59e0b',
    });
    setTeam({
      owner: hub.ownerProfile || null,
      admins: hub.admins || [],
      teachers: hub.teachers || [],
    });
  }, [hub]);

  useEffect(() => {
    if (selectedCourseId && (activeTab === 'content' || activeTab === 'videos')) {
      loadModulesForCourse(selectedCourseId, { withLessons: activeTab === 'videos' });
    }
  }, [activeTab, selectedCourseId]);

  useEffect(() => {
    if (activeTab === 'overview' || activeTab === 'team') {
      loadTeam();
    }

    if (activeTab === 'overview') {
      loadActivity();
    }
  }, [activeTab, hub?._id]);

  if (isHydrating || workspaceLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="light" />
        <View style={styles.loadingState}>
          <ActivityIndicator color="#6366F1" size="large" />
          <Text style={styles.loadingText}>Preparing your hub workspace</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="light" />
        <View style={styles.accessShell}>
          <View style={styles.accessCard}>
            <Text style={styles.accessEyebrow}>Teach</Text>
            <Text style={styles.accessTitle}>Sign in to access your creator workspace</Text>
            <Text style={styles.accessText}>
              The mobile hub dashboard uses the same secured APIs as the web dashboard, so we need your account first.
            </Text>
            <Pressable onPress={() => navigation.navigate('Login')} style={({ pressed }) => [styles.primaryButton, pressed ? styles.buttonPressed : null]}>
              <Text style={styles.primaryButtonText}>Go to Login</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (!hasDashboardAccess) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="light" />
        <View style={styles.accessShell}>
          <View style={styles.accessCard}>
            <Text style={styles.accessEyebrow}>Creator Access</Text>
            <Text style={styles.accessTitle}>Become a teacher to unlock your hub dashboard</Text>
            <Text style={styles.accessText}>
              Create courses, organize modules and lessons, upload videos, and manage your branded teaching hub from mobile.
            </Text>
            <Pressable
              disabled={busyAction === 'become-teacher'}
              onPress={handleBecomeTeacher}
              style={({ pressed }) => [
                styles.primaryButton,
                busyAction === 'become-teacher' ? styles.buttonDisabled : null,
                pressed && busyAction !== 'become-teacher' ? styles.buttonPressed : null,
              ]}
            >
              <Text style={styles.primaryButtonText}>
                {busyAction === 'become-teacher' ? 'Upgrading...' : 'Become a Teacher'}
              </Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <View style={styles.screen}>
        <View style={styles.headerBlock}>
          <View>
            <Text style={styles.headerEyebrow}>Teach Workspace</Text>
            <Text style={styles.headerTitle}>{hub?.name || 'Teacher Hub'}</Text>
            <Text style={styles.headerSubtitle}>
              Full mobile dashboard for courses, content, videos, team, and settings.
            </Text>
          </View>

          <Pressable onPress={() => loadWorkspace({ silent: true })} style={({ pressed }) => [styles.refreshButton, pressed ? styles.buttonPressed : null]}>
            <Ionicons name="refresh-outline" size={20} color="#E2E8F0" />
          </Pressable>
        </View>

        <ScrollView horizontal contentContainerStyle={styles.tabsRow} showsHorizontalScrollIndicator={false}>
          {DASHBOARD_TABS.map((tab) => {
            const selected = activeTab === tab.id;
            return (
              <Pressable
                key={tab.id}
                onPress={() => setActiveTab(tab.id)}
                style={({ pressed }) => [styles.tabChip, selected ? styles.tabChipActive : null, pressed ? styles.buttonPressed : null]}
              >
                <Text style={[styles.tabChipText, selected ? styles.tabChipTextActive : null]}>{tab.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {refreshing ? (
          <View style={styles.refreshBanner}>
            <ActivityIndicator color="#C7D2FE" size="small" />
            <Text style={styles.refreshBannerText}>Refreshing workspace...</Text>
          </View>
        ) : null}

        {activeTab === 'overview' ? (
          <ScrollView contentContainerStyle={styles.tabContent} showsVerticalScrollIndicator={false}>
            <View style={styles.heroCard}>
              <View style={styles.heroHeader}>
                <View style={styles.heroCopy}>
                  <Text style={styles.heroEyebrow}>Hub Overview</Text>
                  <Text style={styles.heroTitle}>{hub?.name || 'Your Hub'}</Text>
                  <Text style={styles.heroDescription}>
                    {hub?.description || 'Operate your teaching hub with the same workflows you use on web, now optimized for mobile.'}
                  </Text>
                </View>
                {hub?.logo ? <Image source={{ uri: hub.logo }} style={styles.heroLogo} /> : null}
              </View>

              <View style={styles.brandRow}>
                <View style={[styles.colorChip, { backgroundColor: hub?.primaryColor || '#0f172a' }]} />
                <View style={[styles.colorChip, { backgroundColor: hub?.secondaryColor || '#f59e0b' }]} />
                <Text style={styles.brandMeta}>{memberRole || user?.role || 'teacher'}</Text>
              </View>
            </View>

            <View style={styles.statsGrid}>
              {[
                { label: 'Courses', value: stats.courses, icon: 'layers-outline' },
                { label: 'Students', value: stats.students, icon: 'people-outline' },
                { label: 'Videos', value: stats.videos, icon: 'videocam-outline' },
                { label: 'Team', value: stats.teamMembers, icon: 'people-circle-outline' },
              ].map((stat) => (
                <View key={stat.label} style={styles.statCard}>
                  <Ionicons name={stat.icon} size={18} color="#C7D2FE" />
                  <Text style={styles.statValue}>{stat.value}</Text>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                </View>
              ))}
            </View>

            <View style={styles.sectionCard}>
              <Text style={styles.sectionEyebrow}>Recent Activity</Text>
              <Text style={styles.sectionTitle}>Latest operational events</Text>
              {activity.length ? (
                <View style={styles.activityList}>
                  {activity.map((item, index) => (
                    <View key={`${item._id || item.action || 'activity'}-${index}`} style={styles.activityItem}>
                      <Text style={styles.activityTitle}>{String(item.action || 'Hub activity').replace(/_/g, ' ')}</Text>
                      <Text style={styles.activityMeta}>
                        {item.userId?.displayName || item.userId?.email || 'A team member'} - {formatTimestamp(item.timestamp || item.createdAt)}
                      </Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={styles.emptyText}>No recent activity yet. Course creation, uploads, and team changes will appear here.</Text>
              )}
            </View>
          </ScrollView>
        ) : null}

        {activeTab === 'courses' ? (
          <FlatList
            contentContainerStyle={styles.listContent}
            data={courses}
            keyExtractor={(item) => item._id}
            ListHeaderComponent={
              <View style={styles.listHeader}>
                <View>
                  <Text style={styles.sectionEyebrow}>Courses</Text>
                  <Text style={styles.sectionTitle}>Manage your catalog</Text>
                </View>
                <UploadButton icon="add-circle-outline" label="Create Course" onPress={handleOpenCreateCourse} />
              </View>
            }
            ListEmptyComponent={<Text style={styles.emptyText}>No courses yet. Create the first course to start building your hub catalog.</Text>}
            ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
            renderItem={({ item }) => (
              <TeacherCourseCard
                course={item}
                onEdit={() => handleOpenEditCourse(item)}
                onPress={() => {
                  setSelectedCourseId(item._id);
                  setActiveTab('content');
                }}
                onPublish={() => handlePublishCourse(item)}
              />
            )}
            showsVerticalScrollIndicator={false}
          />
        ) : null}

        {activeTab === 'content' ? (
          <FlatList
            contentContainerStyle={styles.listContent}
            data={selectedCourseModules}
            keyExtractor={(item) => item._id}
            ListHeaderComponent={
              <View style={styles.sectionStack}>
                <View style={styles.listHeader}>
                  <View>
                    <Text style={styles.sectionEyebrow}>Content</Text>
                    <Text style={styles.sectionTitle}>Modules and lessons</Text>
                  </View>
                  <UploadButton icon="add-circle-outline" label="Add Module" onPress={handleOpenCreateModule} />
                </View>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
                  {courses.map((course) => {
                    const selected = course._id === selectedCourseId;
                    return (
                      <Pressable
                        key={course._id}
                        onPress={() => setSelectedCourseId(course._id)}
                        style={({ pressed }) => [styles.filterChip, selected ? styles.filterChipActive : null, pressed ? styles.buttonPressed : null]}
                      >
                        <Text style={[styles.filterChipText, selected ? styles.filterChipTextActive : null]}>{course.title}</Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>
            }
            ListEmptyComponent={
              loadingModules ? (
                <View style={styles.inlineLoading}>
                  <ActivityIndicator color="#818CF8" />
                </View>
              ) : (
                <Text style={styles.emptyText}>
                  {selectedCourse ? 'No modules yet. Add the first module to structure this course.' : 'Select a course to manage its content.'}
                </Text>
              )
            }
            ItemSeparatorComponent={() => <View style={{ height: 14 }} />}
            renderItem={({ item }) => (
              <ModuleAccordion
                expanded={Boolean(expandedModuleIds[item._id])}
                lessons={lessonsByModule[item._id] || []}
                loadingLessons={Boolean(loadingLessonsByModule[item._id])}
                module={item}
                onAddLesson={() => handleOpenCreateLesson(item)}
                onToggle={() => handleToggleModule(item)}
                onUploadLessonVideo={handleQuickLessonUpload}
              />
            )}
            showsVerticalScrollIndicator={false}
          />
        ) : null}

        {activeTab === 'videos' ? (
          <FlatList
            contentContainerStyle={styles.listContent}
            data={videos}
            keyExtractor={(item) => item._id}
            ListHeaderComponent={
              <View style={styles.sectionStack}>
                <View style={styles.listHeader}>
                  <View>
                    <Text style={styles.sectionEyebrow}>Videos</Text>
                    <Text style={styles.sectionTitle}>Upload and manage video inventory</Text>
                  </View>
                  <UploadButton label="Upload Video" onPress={handleOpenVideoModal} />
                </View>
              </View>
            }
            ListEmptyComponent={<Text style={styles.emptyText}>No videos yet. Upload a course video or a standalone hub update.</Text>}
            ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
            renderItem={({ item }) => (
              <View style={styles.videoCard}>
                <View style={styles.videoHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.videoTitle}>{item.title || 'Untitled video'}</Text>
                    <Text style={styles.videoMeta}>
                      {item.videoType === 'standalone' ? 'Hub Update' : 'Course Video'} - {item.duration ? `${item.duration}s` : 'Duration pending'}
                    </Text>
                  </View>
                  <View style={[styles.statusPill, item.status === 'ready' ? styles.statusPublished : styles.statusDraft]}>
                    <Text style={[styles.statusText, item.status === 'ready' ? styles.statusTextPublished : null]}>{item.status || 'uploading'}</Text>
                  </View>
                </View>
                <Text style={styles.videoMeta}>{item.description || 'Processing and delivery are handled through the same video pipeline as web.'}</Text>
              </View>
            )}
            showsVerticalScrollIndicator={false}
          />
        ) : null}

        {activeTab === 'team' ? (
          <ScrollView contentContainerStyle={styles.tabContent} showsVerticalScrollIndicator={false}>
            <View style={styles.sectionCard}>
              <Text style={styles.sectionEyebrow}>Owner</Text>
              <Text style={styles.sectionTitle}>{team.owner?.displayName || hub?.name || 'Hub Owner'}</Text>
              <Text style={styles.emptyText}>{team.owner?.email || 'Owner account'}</Text>
            </View>

            <View style={styles.sectionCard}>
              <View style={styles.listHeader}>
                <View>
                  <Text style={styles.sectionEyebrow}>Team</Text>
                  <Text style={styles.sectionTitle}>Teachers and admins</Text>
                </View>
                {memberRole !== 'teacher' ? (
                  <View style={styles.inlineButtons}>
                    <Pressable onPress={() => handleOpenMemberModal('teacher')} style={({ pressed }) => [styles.inlineAction, pressed ? styles.buttonPressed : null]}>
                      <Text style={styles.inlineActionText}>Add Teacher</Text>
                    </Pressable>
                    {memberRole === 'owner' ? (
                      <Pressable onPress={() => handleOpenMemberModal('admin')} style={({ pressed }) => [styles.inlineAction, pressed ? styles.buttonPressed : null]}>
                        <Text style={styles.inlineActionText}>Add Admin</Text>
                      </Pressable>
                    ) : null}
                  </View>
                ) : null}
              </View>

              {memberRole === 'teacher' ? (
                <Text style={styles.emptyText}>Owner or admin access is required to add team members. You can still view the active roster below.</Text>
              ) : null}

              <View style={styles.memberSection}>
                <Text style={styles.memberSectionTitle}>Admins</Text>
                {(team.admins || []).length ? (
                  team.admins.map((member) => (
                    <View key={member._id} style={styles.memberCard}>
                      <Text style={styles.memberName}>{member.displayName}</Text>
                      <Text style={styles.memberMeta}>{member.email || 'Sparklass member'} - admin</Text>
                    </View>
                  ))
                ) : (
                  <Text style={styles.emptyText}>No admins added yet.</Text>
                )}
              </View>

              <View style={styles.memberSection}>
                <Text style={styles.memberSectionTitle}>Teachers</Text>
                {(team.teachers || []).length ? (
                  team.teachers.map((member) => (
                    <View key={member._id} style={styles.memberCard}>
                      <Text style={styles.memberName}>{member.displayName}</Text>
                      <Text style={styles.memberMeta}>{member.email || 'Sparklass member'} - teacher</Text>
                    </View>
                  ))
                ) : (
                  <Text style={styles.emptyText}>No teachers added yet.</Text>
                )}
              </View>
            </View>
          </ScrollView>
        ) : null}

        {activeTab === 'settings' ? (
          <ScrollView contentContainerStyle={styles.tabContent} showsVerticalScrollIndicator={false}>
            {memberRole === 'teacher' ? (
              <View style={styles.sectionCard}>
                <Text style={styles.sectionEyebrow}>Hub Settings</Text>
                <Text style={styles.sectionTitle}>Owner or admin access required</Text>
                <Text style={styles.emptyText}>Teachers can build content, but only owners and admins can edit hub identity and branding.</Text>
              </View>
            ) : (
              <View style={styles.sectionCard}>
                <Text style={styles.sectionEyebrow}>Settings</Text>
                <Text style={styles.sectionTitle}>Customize your hub identity</Text>
                <Text style={styles.emptyText}>These settings use the same update payload as the web dashboard.</Text>

                <View style={styles.formStack}>
                  <TextInput onChangeText={(value) => setFieldValue(setSettingsForm, 'name', value)} placeholder="Hub name" placeholderTextColor="#64748B" style={styles.input} value={settingsForm.name} />
                  <TextInput onChangeText={(value) => setFieldValue(setSettingsForm, 'slug', value)} placeholder="Hub slug" placeholderTextColor="#64748B" style={styles.input} value={settingsForm.slug} />
                  <TextInput multiline onChangeText={(value) => setFieldValue(setSettingsForm, 'description', value)} placeholder="Describe the teaching promise of this hub" placeholderTextColor="#64748B" style={[styles.input, styles.textarea]} value={settingsForm.description} />
                  <TextInput onChangeText={(value) => setFieldValue(setSettingsForm, 'logo', value)} placeholder="Logo URL" placeholderTextColor="#64748B" style={styles.input} value={settingsForm.logo} />
                  <TextInput onChangeText={(value) => setFieldValue(setSettingsForm, 'banner', value)} placeholder="Banner URL" placeholderTextColor="#64748B" style={styles.input} value={settingsForm.banner} />
                  <View style={styles.rowInputs}>
                    <TextInput onChangeText={(value) => setFieldValue(setSettingsForm, 'primaryColor', value)} placeholder="#0f172a" placeholderTextColor="#64748B" style={[styles.input, styles.rowInput]} value={settingsForm.primaryColor} />
                    <TextInput onChangeText={(value) => setFieldValue(setSettingsForm, 'secondaryColor', value)} placeholder="#f59e0b" placeholderTextColor="#64748B" style={[styles.input, styles.rowInput]} value={settingsForm.secondaryColor} />
                  </View>
                </View>

                <View style={styles.brandPreview}>
                  {settingsForm.logo ? <Image source={{ uri: settingsForm.logo }} style={styles.brandPreviewLogo} /> : null}
                  <View style={{ flex: 1 }}>
                    <Text style={styles.memberName}>{settingsForm.name || 'Hub Preview'}</Text>
                    <Text style={styles.emptyText}>{settingsForm.description || 'Branding preview will appear here.'}</Text>
                    <View style={styles.brandRow}>
                      <View style={[styles.colorChip, { backgroundColor: settingsForm.primaryColor || '#0f172a' }]} />
                      <View style={[styles.colorChip, { backgroundColor: settingsForm.secondaryColor || '#f59e0b' }]} />
                    </View>
                  </View>
                </View>

                <UploadButton icon="save-outline" label={busyAction === 'save-settings' ? 'Saving...' : 'Save Hub Settings'} onPress={handleSaveSettings} disabled={busyAction === 'save-settings'} />
              </View>
            )}
          </ScrollView>
        ) : null}
      </View>

      <Modal animationType="slide" transparent visible={courseModalVisible}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{editingCourse ? 'Edit Course' : 'Create Course'}</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              <TextInput onChangeText={(value) => setFieldValue(setCourseForm, 'title', value)} placeholder="Course title" placeholderTextColor="#64748B" style={styles.input} value={courseForm.title} />
              <TextInput onChangeText={(value) => setFieldValue(setCourseForm, 'category', value)} placeholder="Category" placeholderTextColor="#64748B" style={styles.input} value={courseForm.category} />
              <TextInput multiline onChangeText={(value) => setFieldValue(setCourseForm, 'description', value)} placeholder="Description" placeholderTextColor="#64748B" style={[styles.input, styles.textarea]} value={courseForm.description} />
              <TextInput onChangeText={(value) => setFieldValue(setCourseForm, 'thumbnail', value)} placeholder="Thumbnail URL" placeholderTextColor="#64748B" style={styles.input} value={courseForm.thumbnail} />
              <TextInput keyboardType="numeric" onChangeText={(value) => setFieldValue(setCourseForm, 'price', value)} placeholder="Price" placeholderTextColor="#64748B" style={styles.input} value={courseForm.price} />
            </ScrollView>
            <View style={styles.modalActions}>
              <Pressable onPress={closeCourseModal} style={({ pressed }) => [styles.modalGhostButton, pressed ? styles.buttonPressed : null]}>
                <Text style={styles.modalGhostText}>Cancel</Text>
              </Pressable>
              <UploadButton icon="save-outline" label={busyAction === 'save-course' ? 'Saving...' : editingCourse ? 'Save Course' : 'Create Course'} onPress={handleSubmitCourse} disabled={busyAction === 'save-course'} />
            </View>
          </View>
        </View>
      </Modal>

      <Modal animationType="slide" transparent visible={moduleModalVisible}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Add Module</Text>
            <TextInput onChangeText={(value) => setFieldValue(setModuleForm, 'title', value)} placeholder="Module title" placeholderTextColor="#64748B" style={styles.input} value={moduleForm.title} />
            <TextInput multiline onChangeText={(value) => setFieldValue(setModuleForm, 'description', value)} placeholder="Module description" placeholderTextColor="#64748B" style={[styles.input, styles.textarea]} value={moduleForm.description} />
            <View style={styles.modalActions}>
              <Pressable onPress={closeModuleModal} style={({ pressed }) => [styles.modalGhostButton, pressed ? styles.buttonPressed : null]}>
                <Text style={styles.modalGhostText}>Cancel</Text>
              </Pressable>
              <UploadButton icon="save-outline" label={busyAction === 'save-module' ? 'Saving...' : 'Create Module'} onPress={handleSubmitModule} disabled={busyAction === 'save-module'} />
            </View>
          </View>
        </View>
      </Modal>

      <Modal animationType="slide" transparent visible={lessonModalVisible}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Add Lesson</Text>
            <TextInput onChangeText={(value) => setFieldValue(setLessonForm, 'title', value)} placeholder="Lesson title" placeholderTextColor="#64748B" style={styles.input} value={lessonForm.title} />
            <TextInput keyboardType="numeric" onChangeText={(value) => setFieldValue(setLessonForm, 'duration', value)} placeholder="Duration in seconds" placeholderTextColor="#64748B" style={styles.input} value={lessonForm.duration} />
            <Pressable onPress={() => setFieldValue(setLessonForm, 'isPreview', !lessonForm.isPreview)} style={({ pressed }) => [styles.toggleRow, lessonForm.isPreview ? styles.toggleRowActive : null, pressed ? styles.buttonPressed : null]}>
              <Ionicons name={lessonForm.isPreview ? 'eye' : 'eye-off-outline'} size={18} color="#E0E7FF" />
              <Text style={styles.toggleText}>{lessonForm.isPreview ? 'Preview enabled' : 'Mark as preview lesson'}</Text>
            </Pressable>
            <View style={styles.modalActions}>
              <Pressable onPress={closeLessonModal} style={({ pressed }) => [styles.modalGhostButton, pressed ? styles.buttonPressed : null]}>
                <Text style={styles.modalGhostText}>Cancel</Text>
              </Pressable>
              <UploadButton icon="save-outline" label={busyAction === 'save-lesson' ? 'Saving...' : 'Create Lesson'} onPress={handleSubmitLesson} disabled={busyAction === 'save-lesson'} />
            </View>
          </View>
        </View>
      </Modal>

      <Modal animationType="slide" transparent visible={videoModalVisible}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Upload Video</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.segmentedRow}>
                {[
                  { id: 'course', label: 'Course Video' },
                  { id: 'standalone', label: 'Hub Update' },
                ].map((item) => {
                  const selected = videoForm.videoType === item.id;
                  return (
                    <Pressable
                      key={item.id}
                      onPress={() => setVideoForm((current) => ({ ...current, videoType: item.id, lessonId: item.id === 'standalone' ? '' : current.lessonId }))}
                      style={({ pressed }) => [styles.segmentButton, selected ? styles.segmentButtonActive : null, pressed ? styles.buttonPressed : null]}
                    >
                      <Text style={[styles.segmentButtonText, selected ? styles.segmentButtonTextActive : null]}>{item.label}</Text>
                    </Pressable>
                  );
                })}
              </View>

              <TextInput onChangeText={(value) => setFieldValue(setVideoForm, 'title', value)} placeholder="Video title" placeholderTextColor="#64748B" style={styles.input} value={videoForm.title} />
              <TextInput multiline onChangeText={(value) => setFieldValue(setVideoForm, 'description', value)} placeholder="Description" placeholderTextColor="#64748B" style={[styles.input, styles.textarea]} value={videoForm.description} />

              {videoForm.videoType === 'course' ? (
                <>
                  <Text style={styles.selectionLabel}>Choose a course</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
                    {courses.map((course) => {
                      const selected = uploadCourseId === course._id;
                      return (
                        <Pressable
                          key={course._id}
                          onPress={async () => {
                            setVideoForm((current) => ({ ...current, courseId: course._id, lessonId: '' }));
                            await loadModulesForCourse(course._id, { withLessons: true });
                          }}
                          style={({ pressed }) => [styles.filterChip, selected ? styles.filterChipActive : null, pressed ? styles.buttonPressed : null]}
                        >
                          <Text style={[styles.filterChipText, selected ? styles.filterChipTextActive : null]}>{course.title}</Text>
                        </Pressable>
                      );
                    })}
                  </ScrollView>

                  <Text style={styles.selectionLabel}>Attach to a lesson</Text>
                  {uploadLessonOptions.length ? (
                    <View style={styles.lessonChoiceStack}>
                      {uploadLessonOptions.map((lesson) => {
                        const selected = videoForm.lessonId === lesson._id;
                        return (
                          <Pressable key={lesson._id} onPress={() => setFieldValue(setVideoForm, 'lessonId', lesson._id)} style={({ pressed }) => [styles.lessonChoice, selected ? styles.lessonChoiceActive : null, pressed ? styles.buttonPressed : null]}>
                            <Text style={styles.lessonChoiceTitle}>{lesson.title}</Text>
                            <Text style={styles.lessonChoiceMeta}>{lesson.moduleTitle}</Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  ) : (
                    <Text style={styles.emptyText}>No lessons loaded yet. Create lessons in the Content tab first.</Text>
                  )}
                </>
              ) : null}

              <UploadButton icon="folder-open-outline" label={videoForm.file ? videoForm.file.name || 'Replace selected file' : 'Choose Video File'} onPress={handlePickModalVideo} />
            </ScrollView>
            <View style={styles.modalActions}>
              <Pressable onPress={closeVideoModal} style={({ pressed }) => [styles.modalGhostButton, pressed ? styles.buttonPressed : null]}>
                <Text style={styles.modalGhostText}>Cancel</Text>
              </Pressable>
              <UploadButton label={busyAction === 'save-video' ? 'Uploading...' : 'Start Upload'} onPress={handleSubmitVideo} disabled={busyAction === 'save-video'} />
            </View>
          </View>
        </View>
      </Modal>

      <Modal animationType="slide" transparent visible={memberModalVisible}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{memberForm.role === 'admin' ? 'Add Admin' : 'Add Teacher'}</Text>
            <TextInput autoCapitalize="none" keyboardType="email-address" onChangeText={(value) => setFieldValue(setMemberForm, 'email', value)} placeholder="member@example.com" placeholderTextColor="#64748B" style={styles.input} value={memberForm.email} />
            <View style={styles.modalActions}>
              <Pressable onPress={closeMemberModal} style={({ pressed }) => [styles.modalGhostButton, pressed ? styles.buttonPressed : null]}>
                <Text style={styles.modalGhostText}>Cancel</Text>
              </Pressable>
              <UploadButton icon="person-add-outline" label={busyAction === 'save-member' ? 'Saving...' : memberForm.role === 'admin' ? 'Add Admin' : 'Add Teacher'} onPress={handleSubmitMember} disabled={busyAction === 'save-member'} />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0B1120' },
  screen: { flex: 1, backgroundColor: '#0B1120', paddingHorizontal: 18, paddingTop: 12 },
  headerBlock: { flexDirection: 'row', justifyContent: 'space-between', gap: 16, marginBottom: 16 },
  headerEyebrow: { color: '#818CF8', fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  headerTitle: { color: '#F8FAFC', fontSize: 28, fontWeight: '800' },
  headerSubtitle: { color: '#94A3B8', fontSize: 14, lineHeight: 21, marginTop: 6, maxWidth: 280 },
  refreshButton: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#172033', borderWidth: 1, borderColor: 'rgba(148, 163, 184, 0.12)', alignItems: 'center', justifyContent: 'center' },
  tabsRow: { gap: 10, paddingBottom: 14 },
  tabChip: { minHeight: 42, paddingHorizontal: 16, borderRadius: 14, backgroundColor: '#172033', borderWidth: 1, borderColor: 'rgba(148, 163, 184, 0.12)', alignItems: 'center', justifyContent: 'center' },
  tabChipActive: { backgroundColor: '#6366F1', borderColor: '#6366F1' },
  tabChipText: { color: '#CBD5E1', fontSize: 13, fontWeight: '800' },
  tabChipTextActive: { color: '#F8FAFC' },
  refreshBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14, backgroundColor: 'rgba(99, 102, 241, 0.14)', marginBottom: 14 },
  refreshBannerText: { color: '#E0E7FF', fontSize: 13, fontWeight: '700' },
  tabContent: { paddingBottom: 36, gap: 16 },
  heroCard: { borderRadius: 24, backgroundColor: '#172033', borderWidth: 1, borderColor: 'rgba(148, 163, 184, 0.12)', padding: 18, gap: 14 },
  heroHeader: { flexDirection: 'row', gap: 16 },
  heroCopy: { flex: 1, gap: 6 },
  heroEyebrow: { color: '#818CF8', fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
  heroTitle: { color: '#F8FAFC', fontSize: 24, fontWeight: '800' },
  heroDescription: { color: '#CBD5E1', fontSize: 14, lineHeight: 22 },
  heroLogo: { width: 58, height: 58, borderRadius: 18 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  colorChip: { width: 26, height: 26, borderRadius: 13 },
  brandMeta: { color: '#E2E8F0', fontSize: 13, fontWeight: '700', textTransform: 'capitalize' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  statCard: { width: '48%', minHeight: 110, borderRadius: 20, backgroundColor: '#172033', borderWidth: 1, borderColor: 'rgba(148, 163, 184, 0.12)', padding: 16, gap: 10 },
  statValue: { color: '#F8FAFC', fontSize: 28, fontWeight: '800' },
  statLabel: { color: '#94A3B8', fontSize: 13, fontWeight: '700' },
  sectionCard: { borderRadius: 22, backgroundColor: '#172033', borderWidth: 1, borderColor: 'rgba(148, 163, 184, 0.12)', padding: 18, gap: 12 },
  sectionEyebrow: { color: '#818CF8', fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
  sectionTitle: { color: '#F8FAFC', fontSize: 22, fontWeight: '800' },
  activityList: { gap: 12 },
  activityItem: { borderRadius: 16, backgroundColor: '#111827', padding: 14, gap: 4 },
  activityTitle: { color: '#F8FAFC', fontSize: 14, fontWeight: '700', textTransform: 'capitalize' },
  activityMeta: { color: '#94A3B8', fontSize: 12 },
  emptyText: { color: '#94A3B8', fontSize: 14, lineHeight: 22 },
  listContent: { paddingBottom: 36 },
  listHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 16 },
  sectionStack: { gap: 14, marginBottom: 4 },
  filterRow: { gap: 10, paddingBottom: 6 },
  filterChip: { minHeight: 38, paddingHorizontal: 14, borderRadius: 12, backgroundColor: '#172033', borderWidth: 1, borderColor: 'rgba(148, 163, 184, 0.12)', alignItems: 'center', justifyContent: 'center' },
  filterChipActive: { backgroundColor: 'rgba(99, 102, 241, 0.18)', borderColor: '#818CF8' },
  filterChipText: { color: '#CBD5E1', fontSize: 13, fontWeight: '700' },
  filterChipTextActive: { color: '#F8FAFC' },
  inlineLoading: { paddingVertical: 24, alignItems: 'center', justifyContent: 'center' },
  videoCard: { borderRadius: 20, backgroundColor: '#172033', borderWidth: 1, borderColor: 'rgba(148, 163, 184, 0.12)', padding: 16, gap: 10 },
  videoHeader: { flexDirection: 'row', gap: 12 },
  videoTitle: { color: '#F8FAFC', fontSize: 16, fontWeight: '800' },
  videoMeta: { color: '#94A3B8', fontSize: 12, lineHeight: 18 },
  statusPill: { alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  statusDraft: { backgroundColor: 'rgba(245, 158, 11, 0.18)' },
  statusPublished: { backgroundColor: 'rgba(34, 197, 94, 0.18)' },
  statusText: { color: '#FDE68A', fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.6 },
  statusTextPublished: { color: '#86EFAC' },
  memberSection: { gap: 10 },
  memberSectionTitle: { color: '#E2E8F0', fontSize: 14, fontWeight: '800' },
  memberCard: { borderRadius: 16, backgroundColor: '#111827', padding: 14, gap: 4 },
  memberName: { color: '#F8FAFC', fontSize: 15, fontWeight: '800' },
  memberMeta: { color: '#94A3B8', fontSize: 12 },
  inlineButtons: { flexDirection: 'row', gap: 8 },
  inlineAction: { minHeight: 36, paddingHorizontal: 12, borderRadius: 12, backgroundColor: 'rgba(99, 102, 241, 0.14)', alignItems: 'center', justifyContent: 'center' },
  inlineActionText: { color: '#E0E7FF', fontSize: 12, fontWeight: '800' },
  formStack: { gap: 12 },
  input: { minHeight: 50, borderRadius: 16, backgroundColor: '#111827', borderWidth: 1, borderColor: 'rgba(148, 163, 184, 0.12)', paddingHorizontal: 16, color: '#F8FAFC', fontSize: 15, fontWeight: '600', marginBottom: 12 },
  textarea: { minHeight: 96, paddingTop: 14, textAlignVertical: 'top' },
  rowInputs: { flexDirection: 'row', gap: 12 },
  rowInput: { flex: 1 },
  brandPreview: { flexDirection: 'row', gap: 14, borderRadius: 18, backgroundColor: '#111827', padding: 14 },
  brandPreviewLogo: { width: 54, height: 54, borderRadius: 18 },
  accessShell: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18 },
  accessCard: { width: '100%', borderRadius: 28, backgroundColor: '#172033', borderWidth: 1, borderColor: 'rgba(148, 163, 184, 0.12)', padding: 22, gap: 14 },
  accessEyebrow: { color: '#818CF8', fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
  accessTitle: { color: '#F8FAFC', fontSize: 28, fontWeight: '800', lineHeight: 34 },
  accessText: { color: '#CBD5E1', fontSize: 15, lineHeight: 24 },
  primaryButton: { minHeight: 54, borderRadius: 18, backgroundColor: '#6366F1', alignItems: 'center', justifyContent: 'center' },
  primaryButtonText: { color: '#F8FAFC', fontSize: 16, fontWeight: '800' },
  buttonPressed: { opacity: 0.92 },
  buttonDisabled: { opacity: 0.64 },
  loadingState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 },
  loadingText: { color: '#94A3B8', fontSize: 15, fontWeight: '700' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(2, 6, 23, 0.82)', justifyContent: 'center', padding: 18 },
  modalCard: { maxHeight: '88%', borderRadius: 28, backgroundColor: '#172033', borderWidth: 1, borderColor: 'rgba(148, 163, 184, 0.14)', padding: 18, gap: 14 },
  modalTitle: { color: '#F8FAFC', fontSize: 22, fontWeight: '800' },
  modalActions: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginTop: 6 },
  modalGhostButton: { minHeight: 48, minWidth: 90, borderRadius: 16, backgroundColor: '#111827', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  modalGhostText: { color: '#CBD5E1', fontSize: 14, fontWeight: '700' },
  toggleRow: { minHeight: 50, borderRadius: 16, backgroundColor: '#111827', borderWidth: 1, borderColor: 'rgba(148, 163, 184, 0.12)', flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, marginBottom: 12 },
  toggleRowActive: { borderColor: '#818CF8', backgroundColor: 'rgba(99, 102, 241, 0.12)' },
  toggleText: { color: '#E2E8F0', fontSize: 14, fontWeight: '700' },
  segmentedRow: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  segmentButton: { flex: 1, minHeight: 42, borderRadius: 14, backgroundColor: '#111827', alignItems: 'center', justifyContent: 'center' },
  segmentButtonActive: { backgroundColor: '#6366F1' },
  segmentButtonText: { color: '#CBD5E1', fontSize: 13, fontWeight: '800' },
  segmentButtonTextActive: { color: '#F8FAFC' },
  selectionLabel: { color: '#CBD5E1', fontSize: 13, fontWeight: '800', marginBottom: 10, marginTop: 6 },
  lessonChoiceStack: { gap: 8, marginBottom: 14 },
  lessonChoice: { borderRadius: 14, backgroundColor: '#111827', borderWidth: 1, borderColor: 'rgba(148, 163, 184, 0.12)', padding: 12, gap: 4 },
  lessonChoiceActive: { borderColor: '#818CF8', backgroundColor: 'rgba(99, 102, 241, 0.12)' },
  lessonChoiceTitle: { color: '#F8FAFC', fontSize: 14, fontWeight: '700' },
  lessonChoiceMeta: { color: '#94A3B8', fontSize: 12 },
});
