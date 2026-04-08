import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import BatchCard from '../components/BatchCard';
import TeacherCourseCard from '../components/TeacherCourseCard';
import UploadButton from '../components/UploadButton';
import { useAuth } from '../context/AuthContext';
import {
  addCourseToBatch,
  createBatch,
  fetchManagedHubBatches,
  fetchManagedHubVideos,
  getHubCourses,
  getMyHub,
} from '../services/api';

const DASHBOARD_TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'batches', label: 'Batches' },
  { id: 'courses', label: 'Courses' },
  { id: 'videos', label: 'Videos' },
  { id: 'students', label: 'Students' },
  { id: 'settings', label: 'Settings' },
];

const initialBatchForm = {
  title: '',
  description: '',
  price: '0',
  thumbnail: '',
  startDate: '',
  endDate: '',
};

export default function TeachDashboardScreen({ navigation }) {
  const { becomeTeacher, isAuthenticated, isHydrating, user } = useAuth();
  const hasDashboardAccess = user?.role === 'teacher' || user?.role === 'admin';

  const [activeTab, setActiveTab] = useState('overview');
  const [workspaceLoading, setWorkspaceLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [hub, setHub] = useState(null);
  const [batches, setBatches] = useState([]);
  const [courses, setCourses] = useState([]);
  const [videos, setVideos] = useState([]);
  const [batchModalVisible, setBatchModalVisible] = useState(false);
  const [courseBatchModalVisible, setCourseBatchModalVisible] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [creatingBatch, setCreatingBatch] = useState(false);
  const [attachingCourseToBatch, setAttachingCourseToBatch] = useState(false);
  const [batchForm, setBatchForm] = useState(initialBatchForm);

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
      const [nextBatches, nextCourses, nextVideos] = await Promise.all([
        fetchManagedHubBatches(hubData._id).catch(() => []),
        getHubCourses(hubData._id).catch(() => []),
        fetchManagedHubVideos(hubData._id).catch(() => []),
      ]);

      setHub(hubData);
      setBatches(Array.isArray(nextBatches) ? nextBatches : []);
      setCourses(Array.isArray(nextCourses) ? nextCourses : []);
      setVideos(Array.isArray(nextVideos) ? nextVideos : []);
      setError('');
      if (!silent) {
        setSuccess('');
      }
    } catch (loadError) {
      console.log('Teach dashboard load error:', loadError?.response || loadError);
      setError(loadError?.message || 'Unable to load your teacher hub right now.');
      setHub(null);
      setBatches([]);
      setCourses([]);
      setVideos([]);
    } finally {
      setWorkspaceLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadWorkspace();
  }, [hasDashboardAccess]);

  const batchStudentCount = useMemo(
    () => batches.reduce((count, batch) => count + Number(batch.studentCount || 0), 0),
    [batches]
  );

  const closeBatchModal = () => {
    setBatchModalVisible(false);
    setBatchForm(initialBatchForm);
  };

  const closeCourseBatchModal = () => {
    setCourseBatchModalVisible(false);
    setSelectedCourse(null);
  };

  const getAvailableBatchesForCourse = (course) =>
    batches.filter((batch) => !(course?.batchSummaries || []).some((summary) => summary._id === batch._id));

  const showUpgradeShell = !isHydrating && (!isAuthenticated || !hasDashboardAccess);

  if (isHydrating || workspaceLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="light" />
        <View style={styles.loadingState}>
          <ActivityIndicator color="#818CF8" size="large" />
          <Text style={styles.loadingText}>Preparing your batch workspace</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (showUpgradeShell) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="light" />
        <View style={styles.accessShell}>
          <View style={styles.accessCard}>
            <Text style={styles.accessEyebrow}>Teach on Sparklass</Text>
            <Text style={styles.accessTitle}>Batch-first teaching starts here.</Text>
            <Text style={styles.accessText}>
              Create hubs, package courses into batches, and manage student access from one clean
              teaching workspace.
            </Text>

            {!isAuthenticated ? (
              <UploadButton label="Login to Teach" icon="log-in-outline" onPress={() => navigation.navigate('Login')} />
            ) : (
              <UploadButton
                label="Become a Teacher"
                icon="school-outline"
                onPress={async () => {
                  try {
                    await becomeTeacher();
                    await loadWorkspace();
                  } catch (upgradeError) {
                    setError(upgradeError?.message || 'Unable to upgrade this account right now.');
                  }
                }}
              />
            )}

            {error ? <Text style={styles.errorText}>{error}</Text> : null}
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const renderOverview = () => (
    <View style={styles.sectionStack}>
      <View style={styles.heroCard}>
        <Text style={styles.heroEyebrow}>Teacher Hub</Text>
        <Text style={styles.heroTitle}>{hub?.name || 'Your Hub'}</Text>
        <Text style={styles.heroDescription}>
          Batches are now the primary teaching product. Courses and videos stay reusable beneath
          them, and student access flows through the batch layer first.
        </Text>

        <View style={styles.inlineButtons}>
          <UploadButton label="Create Batch" icon="add-circle-outline" onPress={() => setBatchModalVisible(true)} />
          <Pressable
            onPress={() => setActiveTab('courses')}
            style={({ pressed }) => [styles.secondaryButton, pressed ? styles.buttonPressed : null]}
          >
            <Text style={styles.secondaryButtonText}>View Courses</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.statsGrid}>
        {[
          { label: 'Batches', value: batches.length },
          { label: 'Courses', value: courses.length },
          { label: 'Videos', value: videos.length },
          { label: 'Students', value: batchStudentCount },
        ].map((item) => (
          <View key={item.label} style={styles.statCard}>
            <Text style={styles.statValue}>{item.value}</Text>
            <Text style={styles.statLabel}>{item.label}</Text>
          </View>
        ))}
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionEyebrow}>Batch momentum</Text>
        <Text style={styles.sectionTitle}>Your newest teaching offers</Text>
        {batches.length ? (
          <View style={styles.stack}>
            {batches.slice(0, 2).map((batch) => (
              <BatchCard
                key={batch._id}
                batch={batch}
                onPress={() => navigation.navigate('TeachBatch', { batchId: batch._id })}
              />
            ))}
          </View>
        ) : (
          <Text style={styles.emptyText}>
            No batches yet. Create the first one to package your reusable courses and videos.
          </Text>
        )}
      </View>
    </View>
  );

  const renderBatches = () => (
    <View style={styles.sectionStack}>
      <View style={styles.listHeader}>
        <View>
          <Text style={styles.sectionEyebrow}>Batches</Text>
          <Text style={styles.sectionTitle}>Primary teaching offers</Text>
        </View>
        <UploadButton label="New Batch" icon="add-outline" onPress={() => setBatchModalVisible(true)} />
      </View>

      {batches.length ? (
        batches.map((batch) => (
          <BatchCard
            key={batch._id}
            batch={batch}
            onPress={() => navigation.navigate('TeachBatch', { batchId: batch._id })}
          />
        ))
      ) : (
        <View style={styles.sectionCard}>
          <Text style={styles.emptyText}>
            Create your first batch to bundle course access, standalone videos, and future notes.
          </Text>
        </View>
      )}
    </View>
  );

  const renderCourses = () => (
    <View style={styles.sectionStack}>
      <View style={styles.sectionCard}>
        <Text style={styles.sectionEyebrow}>Courses</Text>
        <Text style={styles.sectionTitle}>Reusable content blocks</Text>
        <Text style={styles.emptyText}>
          Courses still power modules and lessons, but they now plug into batches instead of acting
          as the only sellable unit.
        </Text>
      </View>

      {courses.length ? (
        courses.map((course) => (
          <TeacherCourseCard
            key={course._id}
            course={course}
            onPress={() => {}}
            onEdit={() => {}}
            onPublish={() => {}}
            onAddToBatch={() => {
              setError('');
              setSuccess('');
              setSelectedCourse(course);
              setCourseBatchModalVisible(true);
            }}
            addToBatchDisabled={getAvailableBatchesForCourse(course).length === 0}
            addToBatchLabel={
              getAvailableBatchesForCourse(course).length === 0 ? 'In Every Batch' : 'Add to Batch'
            }
          />
        ))
      ) : (
        <View style={styles.sectionCard}>
          <Text style={styles.emptyText}>No courses created yet.</Text>
        </View>
      )}
    </View>
  );

  const renderVideos = () => (
    <View style={styles.sectionStack}>
      <View style={styles.sectionCard}>
        <Text style={styles.sectionEyebrow}>Videos</Text>
        <Text style={styles.sectionTitle}>Batch-ready media</Text>
      </View>

      {videos.length ? (
        videos.map((video) => (
          <View key={video._id} style={styles.videoCard}>
            <View style={styles.videoHeader}>
              <View style={styles.copyBlock}>
                <Text style={styles.videoTitle}>{video.title}</Text>
                <Text style={styles.videoMeta}>
                  {video.videoType} - {video.courseId?.title || 'Standalone'} - {video.status}
                </Text>
              </View>
              <View style={styles.inlineBadge}>
                <Text style={styles.inlineBadgeText}>{video.batchCount || 0} batches</Text>
              </View>
            </View>
          </View>
        ))
      ) : (
        <View style={styles.sectionCard}>
          <Text style={styles.emptyText}>No videos uploaded yet.</Text>
        </View>
      )}
    </View>
  );

  const renderStudents = () => (
    <View style={styles.sectionStack}>
      <View style={styles.sectionCard}>
        <Text style={styles.sectionEyebrow}>Students</Text>
        <Text style={styles.sectionTitle}>Batch enrollment view</Text>
        <Text style={styles.emptyText}>
          Student access is now controlled by batch enrollment. Track student counts per batch here.
        </Text>
      </View>

      {batches.length ? (
        batches.map((batch) => (
          <View key={batch._id} style={styles.memberCard}>
            <Text style={styles.memberName}>{batch.title}</Text>
            <Text style={styles.memberMeta}>
              {batch.studentCount || 0} students - {batch.courseCount || 0} courses - {batch.videoCount || 0} videos
            </Text>
          </View>
        ))
      ) : (
        <View style={styles.sectionCard}>
          <Text style={styles.emptyText}>Student activity will appear once batches start enrolling learners.</Text>
        </View>
      )}
    </View>
  );

  const renderSettings = () => (
    <View style={styles.sectionStack}>
      <View style={styles.sectionCard}>
        <Text style={styles.sectionEyebrow}>Settings</Text>
        <Text style={styles.sectionTitle}>Hub identity</Text>
        <Text style={styles.emptyText}>{hub?.description || 'No hub description added yet.'}</Text>

        <View style={styles.settingsRow}>
          <View style={styles.settingTile}>
            <Text style={styles.settingLabel}>Primary Color</Text>
            <Text style={styles.settingValue}>{hub?.primaryColor || '#0f172a'}</Text>
          </View>
          <View style={styles.settingTile}>
            <Text style={styles.settingLabel}>Secondary Color</Text>
            <Text style={styles.settingValue}>{hub?.secondaryColor || '#f59e0b'}</Text>
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <View style={styles.screen}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => loadWorkspace({ silent: true })} />
          }
        >
          <View style={styles.headerBlock}>
            <View style={styles.copyBlock}>
              <Text style={styles.headerEyebrow}>Teach</Text>
              <Text style={styles.headerTitle}>Batch-first dashboard</Text>
              <Text style={styles.headerSubtitle}>
                Organize {hub?.name || 'your hub'} around batches, while keeping courses and videos reusable underneath.
              </Text>
            </View>

            <Pressable
              onPress={() => loadWorkspace({ silent: true })}
              style={({ pressed }) => [styles.refreshButton, pressed ? styles.buttonPressed : null]}
            >
              <Ionicons name="refresh-outline" size={22} color="#E2E8F0" />
            </Pressable>
          </View>

          {error ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>{error}</Text>
            </View>
          ) : null}
          {success ? (
            <View style={styles.successBanner}>
              <Text style={styles.successBannerText}>{success}</Text>
            </View>
          ) : null}

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsRow}>
            {DASHBOARD_TABS.map((tab) => {
              const selected = activeTab === tab.id;
              return (
                <Pressable
                  key={tab.id}
                  onPress={() => setActiveTab(tab.id)}
                  style={({ pressed }) => [
                    styles.tabChip,
                    selected ? styles.tabChipActive : null,
                    pressed ? styles.buttonPressed : null,
                  ]}
                >
                  <Text style={[styles.tabChipText, selected ? styles.tabChipTextActive : null]}>{tab.label}</Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {activeTab === 'overview' ? renderOverview() : null}
          {activeTab === 'batches' ? renderBatches() : null}
          {activeTab === 'courses' ? renderCourses() : null}
          {activeTab === 'videos' ? renderVideos() : null}
          {activeTab === 'students' ? renderStudents() : null}
          {activeTab === 'settings' ? renderSettings() : null}
        </ScrollView>
      </View>

      <Modal animationType="slide" transparent visible={batchModalVisible}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Create Batch</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              <TextInput
                value={batchForm.title}
                onChangeText={(value) => setBatchForm((current) => ({ ...current, title: value }))}
                placeholder="Batch title"
                placeholderTextColor="#64748B"
                style={styles.input}
              />
              <TextInput
                value={batchForm.description}
                onChangeText={(value) => setBatchForm((current) => ({ ...current, description: value }))}
                placeholder="Description"
                placeholderTextColor="#64748B"
                multiline
                style={[styles.input, styles.textarea]}
              />
              <TextInput
                value={batchForm.price}
                onChangeText={(value) => setBatchForm((current) => ({ ...current, price: value }))}
                placeholder="Price"
                placeholderTextColor="#64748B"
                keyboardType="numeric"
                style={styles.input}
              />
              <TextInput
                value={batchForm.thumbnail}
                onChangeText={(value) => setBatchForm((current) => ({ ...current, thumbnail: value }))}
                placeholder="Thumbnail URL"
                placeholderTextColor="#64748B"
                style={styles.input}
              />
              <TextInput
                value={batchForm.startDate}
                onChangeText={(value) => setBatchForm((current) => ({ ...current, startDate: value }))}
                placeholder="Start Date (YYYY-MM-DD)"
                placeholderTextColor="#64748B"
                style={styles.input}
              />
              <TextInput
                value={batchForm.endDate}
                onChangeText={(value) => setBatchForm((current) => ({ ...current, endDate: value }))}
                placeholder="End Date (YYYY-MM-DD)"
                placeholderTextColor="#64748B"
                style={styles.input}
              />
            </ScrollView>

            <View style={styles.modalActions}>
              <Pressable
                onPress={closeBatchModal}
                style={({ pressed }) => [styles.modalGhostButton, pressed ? styles.buttonPressed : null]}
              >
                <Text style={styles.modalGhostText}>Cancel</Text>
              </Pressable>
              <UploadButton
                label={creatingBatch ? 'Saving...' : 'Save Batch'}
                icon="albums-outline"
                disabled={creatingBatch}
                onPress={async () => {
                  if (!hub?._id || !batchForm.title.trim()) {
                    return;
                  }

                  try {
                    setCreatingBatch(true);
                    const nextBatch = await createBatch({
                      hubId: hub._id,
                      title: batchForm.title.trim(),
                      description: batchForm.description.trim(),
                      price: Number(batchForm.price || 0),
                      thumbnail: batchForm.thumbnail.trim(),
                      startDate: batchForm.startDate.trim() || null,
                      endDate: batchForm.endDate.trim() || null,
                    });

                    setBatches((current) => [nextBatch, ...current]);
                    closeBatchModal();
                    setActiveTab('batches');
                  } catch (createError) {
                    setError(createError?.message || 'Unable to create the batch right now.');
                  } finally {
                    setCreatingBatch(false);
                  }
                }}
              />
            </View>
          </View>
        </View>
      </Modal>

      <Modal animationType="slide" transparent visible={courseBatchModalVisible}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Add Course to Batch</Text>
            <Text style={styles.emptyText}>
              {selectedCourse?.title || 'This course'} can be reused across multiple batches. Pick where it should
              unlock next.
            </Text>

            <ScrollView showsVerticalScrollIndicator={false}>
              {getAvailableBatchesForCourse(selectedCourse).length ? (
                getAvailableBatchesForCourse(selectedCourse).map((batch) => (
                  <Pressable
                    key={batch._id}
                    onPress={async () => {
                      if (!selectedCourse?._id || attachingCourseToBatch) {
                        return;
                      }

                      try {
                        setAttachingCourseToBatch(true);
                        setError('');
                        setSuccess('');
                        await addCourseToBatch(batch._id, selectedCourse._id);
                        await loadWorkspace({ silent: true });
                        closeCourseBatchModal();
                        setSuccess(`"${selectedCourse.title}" was added to "${batch.title}".`);
                      } catch (attachError) {
                        setError(attachError?.message || 'Unable to add this course to the selected batch.');
                      } finally {
                        setAttachingCourseToBatch(false);
                      }
                    }}
                    style={({ pressed }) => [
                      styles.selectionCard,
                      pressed ? styles.buttonPressed : null,
                    ]}
                  >
                    <View style={styles.copyBlock}>
                      <Text style={styles.memberName}>{batch.title}</Text>
                      <Text style={styles.memberMeta}>
                        {batch.courseCount || 0} courses - {batch.videoCount || 0} videos - {batch.studentCount || 0} students
                      </Text>
                    </View>
                    <Ionicons name="add-circle-outline" size={22} color="#E0E7FF" />
                  </Pressable>
                ))
              ) : (
                <View style={styles.sectionCard}>
                  <Text style={styles.emptyText}>This course is already attached to every available batch.</Text>
                </View>
              )}
            </ScrollView>

            <View style={styles.modalActions}>
              <Pressable
                onPress={closeCourseBatchModal}
                style={({ pressed }) => [styles.modalGhostButton, pressed ? styles.buttonPressed : null]}
              >
                <Text style={styles.modalGhostText}>Close</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0B1120' },
  screen: { flex: 1, backgroundColor: '#0B1120' },
  scrollContent: { paddingHorizontal: 18, paddingTop: 12, paddingBottom: 28, gap: 16 },
  headerBlock: { flexDirection: 'row', justifyContent: 'space-between', gap: 16, marginBottom: 6 },
  copyBlock: { flex: 1, gap: 6 },
  headerEyebrow: { color: '#818CF8', fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
  headerTitle: { color: '#F8FAFC', fontSize: 28, fontWeight: '800' },
  headerSubtitle: { color: '#94A3B8', fontSize: 14, lineHeight: 21 },
  refreshButton: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#172033', borderWidth: 1, borderColor: 'rgba(148, 163, 184, 0.12)', alignItems: 'center', justifyContent: 'center' },
  tabsRow: { gap: 10, paddingBottom: 8 },
  tabChip: { minHeight: 42, paddingHorizontal: 16, borderRadius: 14, backgroundColor: '#172033', borderWidth: 1, borderColor: 'rgba(148, 163, 184, 0.12)', alignItems: 'center', justifyContent: 'center' },
  tabChipActive: { backgroundColor: '#6366F1', borderColor: '#6366F1' },
  tabChipText: { color: '#CBD5E1', fontSize: 13, fontWeight: '800' },
  tabChipTextActive: { color: '#F8FAFC' },
  sectionStack: { gap: 14 },
  heroCard: { borderRadius: 24, backgroundColor: '#172033', borderWidth: 1, borderColor: 'rgba(148, 163, 184, 0.12)', padding: 18, gap: 14 },
  heroEyebrow: { color: '#818CF8', fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
  heroTitle: { color: '#F8FAFC', fontSize: 24, fontWeight: '800' },
  heroDescription: { color: '#CBD5E1', fontSize: 14, lineHeight: 22 },
  inlineButtons: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  secondaryButton: { minHeight: 48, borderRadius: 16, paddingHorizontal: 16, backgroundColor: '#111827', borderWidth: 1, borderColor: 'rgba(148, 163, 184, 0.12)', alignItems: 'center', justifyContent: 'center' },
  secondaryButtonText: { color: '#E2E8F0', fontSize: 14, fontWeight: '700' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  statCard: { width: '48%', minHeight: 110, borderRadius: 20, backgroundColor: '#172033', borderWidth: 1, borderColor: 'rgba(148, 163, 184, 0.12)', padding: 16, gap: 10 },
  statValue: { color: '#F8FAFC', fontSize: 28, fontWeight: '800' },
  statLabel: { color: '#94A3B8', fontSize: 13, fontWeight: '700' },
  sectionCard: { borderRadius: 22, backgroundColor: '#172033', borderWidth: 1, borderColor: 'rgba(148, 163, 184, 0.12)', padding: 18, gap: 12 },
  sectionEyebrow: { color: '#818CF8', fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
  sectionTitle: { color: '#F8FAFC', fontSize: 22, fontWeight: '800' },
  listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  stack: { gap: 14 },
  videoCard: { borderRadius: 20, backgroundColor: '#172033', borderWidth: 1, borderColor: 'rgba(148, 163, 184, 0.12)', padding: 16, gap: 10 },
  videoHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  videoTitle: { color: '#F8FAFC', fontSize: 16, fontWeight: '800' },
  videoMeta: { color: '#94A3B8', fontSize: 12, lineHeight: 18 },
  inlineBadge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 7, backgroundColor: 'rgba(99, 102, 241, 0.18)' },
  inlineBadgeText: { color: '#E0E7FF', fontSize: 11, fontWeight: '800' },
  memberCard: { borderRadius: 18, backgroundColor: '#172033', borderWidth: 1, borderColor: 'rgba(148, 163, 184, 0.12)', padding: 16, gap: 6 },
  memberName: { color: '#F8FAFC', fontSize: 16, fontWeight: '800' },
  memberMeta: { color: '#94A3B8', fontSize: 13, lineHeight: 20 },
  settingsRow: { flexDirection: 'row', gap: 12 },
  settingTile: { flex: 1, borderRadius: 16, backgroundColor: '#111827', padding: 14, gap: 6 },
  settingLabel: { color: '#94A3B8', fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
  settingValue: { color: '#F8FAFC', fontSize: 14, fontWeight: '700' },
  errorBanner: { borderRadius: 16, backgroundColor: 'rgba(239, 68, 68, 0.14)', borderWidth: 1, borderColor: 'rgba(248, 113, 113, 0.28)', padding: 14 },
  errorBannerText: { color: '#FECACA', fontSize: 13, fontWeight: '700' },
  successBanner: { borderRadius: 16, backgroundColor: 'rgba(34, 197, 94, 0.14)', borderWidth: 1, borderColor: 'rgba(134, 239, 172, 0.28)', padding: 14 },
  successBannerText: { color: '#BBF7D0', fontSize: 13, fontWeight: '700' },
  emptyText: { color: '#94A3B8', fontSize: 14, lineHeight: 22 },
  accessShell: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18 },
  accessCard: { width: '100%', borderRadius: 28, backgroundColor: '#172033', borderWidth: 1, borderColor: 'rgba(148, 163, 184, 0.12)', padding: 22, gap: 14 },
  accessEyebrow: { color: '#818CF8', fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
  accessTitle: { color: '#F8FAFC', fontSize: 28, fontWeight: '800', lineHeight: 34 },
  accessText: { color: '#CBD5E1', fontSize: 15, lineHeight: 24 },
  errorText: { color: '#FCA5A5', fontSize: 13, fontWeight: '700' },
  loadingState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 },
  loadingText: { color: '#94A3B8', fontSize: 15, fontWeight: '700' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(2, 6, 23, 0.82)', justifyContent: 'center', padding: 18 },
  modalCard: { maxHeight: '88%', borderRadius: 28, backgroundColor: '#172033', borderWidth: 1, borderColor: 'rgba(148, 163, 184, 0.14)', padding: 18, gap: 14 },
  modalTitle: { color: '#F8FAFC', fontSize: 22, fontWeight: '800' },
  modalActions: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginTop: 6 },
  modalGhostButton: { minHeight: 48, minWidth: 90, borderRadius: 16, backgroundColor: '#111827', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  modalGhostText: { color: '#CBD5E1', fontSize: 14, fontWeight: '700' },
  selectionCard: { borderRadius: 18, backgroundColor: '#111827', borderWidth: 1, borderColor: 'rgba(148, 163, 184, 0.12)', padding: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 12 },
  input: { minHeight: 50, borderRadius: 16, backgroundColor: '#111827', borderWidth: 1, borderColor: 'rgba(148, 163, 184, 0.12)', paddingHorizontal: 16, color: '#F8FAFC', fontSize: 15, fontWeight: '600', marginBottom: 12 },
  textarea: { minHeight: 96, paddingTop: 14, textAlignVertical: 'top' },
  buttonPressed: { opacity: 0.92 },
});
