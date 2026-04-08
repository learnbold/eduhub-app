import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import {
  addCourseToBatch,
  addVideoToBatch,
  fetchManagedBatchById,
  fetchManagedHubVideos,
  getHubCourses,
  getMyHub,
} from '../services/api';

const DETAIL_TABS = [
  { id: 'courses', label: 'Courses' },
  { id: 'videos', label: 'Videos' },
  { id: 'students', label: 'Students' },
  { id: 'notes', label: 'Notes' },
];

const formatBatchPrice = (price) => {
  if (Number(price || 0) === 0) {
    return 'Free';
  }

  return `INR ${Number(price || 0).toLocaleString()}`;
};

export default function TeachBatchScreen({ navigation, route }) {
  const { batchId } = route.params || {};
  const [hub, setHub] = useState(null);
  const [batch, setBatch] = useState(null);
  const [hubCourses, setHubCourses] = useState([]);
  const [hubVideos, setHubVideos] = useState([]);
  const [activeTab, setActiveTab] = useState('courses');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [busyId, setBusyId] = useState('');

  const loadBatchWorkspace = async ({ silent = false } = {}) => {
    if (!batchId) {
      setLoading(false);
      return;
    }

    try {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const hubData = await getMyHub();
      const [nextBatch, nextCourses, nextVideos] = await Promise.all([
        fetchManagedBatchById(batchId),
        getHubCourses(hubData._id).catch(() => []),
        fetchManagedHubVideos(hubData._id).catch(() => []),
      ]);

      setHub(hubData);
      setBatch(nextBatch);
      setHubCourses(Array.isArray(nextCourses) ? nextCourses : []);
      setHubVideos(Array.isArray(nextVideos) ? nextVideos : []);
      setError('');
    } catch (loadError) {
      console.log('Teach batch load error:', loadError?.response || loadError);
      setError(loadError?.message || 'Unable to load this batch right now.');
      setBatch(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadBatchWorkspace();
  }, [batchId]);

  const attachedCourseIds = useMemo(() => new Set(batch?.courses?.map((course) => course._id) || []), [batch?.courses]);
  const attachedVideoIds = useMemo(() => new Set(batch?.videos?.map((video) => video._id) || []), [batch?.videos]);
  const availableCourses = hubCourses.filter((course) => !attachedCourseIds.has(course._id));
  const availableVideos = hubVideos.filter((video) => !attachedVideoIds.has(video._id));

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="light" />
        <View style={styles.loadingState}>
          <ActivityIndicator color="#818CF8" size="large" />
          <Text style={styles.loadingText}>Loading batch workspace</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!batch) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="light" />
        <View style={styles.loadingState}>
          <Text style={styles.errorText}>{error || 'Batch not found.'}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const renderAttachList = (items, itemType) => {
    if (!items.length) {
      return (
        <View style={styles.sectionCard}>
          <Text style={styles.emptyText}>No additional {itemType} available to add right now.</Text>
        </View>
      );
    }

    return (
      <View style={styles.stack}>
        {items.map((item) => (
          <View key={item._id} style={styles.attachRow}>
            <View style={styles.copyBlock}>
              <Text style={styles.attachTitle}>{item.title}</Text>
              <Text style={styles.attachMeta}>
                {itemType === 'courses'
                  ? `${item.batchCount || 0} existing batch links`
                  : `${item.videoType} - ${item.status}`}
              </Text>
            </View>
            <Pressable
              onPress={async () => {
                try {
                  setBusyId(item._id);
                  setSuccess('');
                  setError('');

                  if (itemType === 'courses') {
                    await addCourseToBatch(batch._id, item._id);
                  } else {
                    await addVideoToBatch(batch._id, item._id);
                  }

                  await loadBatchWorkspace({ silent: true });
                  setSuccess(`${item.title} added to the batch.`);
                } catch (attachError) {
                  setError(attachError?.message || `Unable to add this ${itemType.slice(0, -1)} right now.`);
                } finally {
                  setBusyId('');
                }
              }}
              style={({ pressed }) => [styles.addButton, pressed ? styles.buttonPressed : null]}
            >
              <Text style={styles.addButtonText}>{busyId === item._id ? 'Adding...' : 'Add'}</Text>
            </Pressable>
          </View>
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <View style={styles.screen}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => loadBatchWorkspace({ silent: true })} />
          }
        >
          <View style={styles.topBar}>
            <Pressable
              onPress={() => navigation.goBack()}
              style={({ pressed }) => [styles.backButton, pressed ? styles.buttonPressed : null]}
            >
              <Ionicons name="arrow-back" size={20} color="#F8FAFC" />
            </Pressable>
            <View style={styles.copyBlock}>
              <Text style={styles.eyebrow}>Batch Detail</Text>
              <Text style={styles.title}>{batch.title}</Text>
              <Text style={styles.subtitle}>{hub?.name || 'Teacher Hub'}</Text>
            </View>
          </View>

          <View style={styles.heroCard}>
            <Text style={styles.heroPrice}>{formatBatchPrice(batch.price)}</Text>
            <Text style={styles.heroMetaText}>
              {batch.isPublished ? 'Published batch' : 'Draft batch'} - {batch.subscriptionType || 'one_time'}
            </Text>
            <Text style={styles.heroDescription}>
              {batch.description || 'A bundled access experience for courses, standalone videos, and future notes.'}
            </Text>

            <View style={styles.statsRow}>
              {[
                { label: 'Courses', value: batch.courseCount || 0 },
                { label: 'Videos', value: batch.videoCount || 0 },
                { label: 'Students', value: batch.studentCount || 0 },
              ].map((item) => (
                <View key={item.label} style={styles.statTile}>
                  <Text style={styles.statValue}>{item.value}</Text>
                  <Text style={styles.statLabel}>{item.label}</Text>
                </View>
              ))}
            </View>
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
            {DETAIL_TABS.map((tab) => {
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

          {activeTab === 'courses' ? (
            <View style={styles.stack}>
              <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>Included courses</Text>
                <Text style={styles.emptyText}>
                  These courses unlock automatically when a learner joins this batch.
                </Text>
              </View>

              {batch.courses.length ? (
                batch.courses.map((course) => (
                  <View key={course._id} style={styles.itemCard}>
                    <Text style={styles.itemTitle}>{course.title}</Text>
                    <Text style={styles.itemMeta}>
                      {course.category || 'Uncategorized'} - {course.isPublished ? 'Published' : 'Draft'}
                    </Text>
                  </View>
                ))
              ) : (
                <View style={styles.sectionCard}>
                  <Text style={styles.emptyText}>No courses attached yet.</Text>
                </View>
              )}

              {renderAttachList(availableCourses, 'courses')}
            </View>
          ) : null}

          {activeTab === 'videos' ? (
            <View style={styles.stack}>
              <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>Included videos</Text>
                <Text style={styles.emptyText}>
                  Add standalone or course-linked videos that should unlock with this batch.
                </Text>
              </View>

              {batch.videos.length ? (
                batch.videos.map((video) => (
                  <View key={video._id} style={styles.itemCard}>
                    <Text style={styles.itemTitle}>{video.title}</Text>
                    <Text style={styles.itemMeta}>
                      {video.videoType} - {video.courseId?.title || 'Standalone'} - {video.status}
                    </Text>
                  </View>
                ))
              ) : (
                <View style={styles.sectionCard}>
                  <Text style={styles.emptyText}>No videos attached yet.</Text>
                </View>
              )}

              {renderAttachList(availableVideos, 'videos')}
            </View>
          ) : null}

          {activeTab === 'students' ? (
            <View style={styles.stack}>
              <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>Enrolled students</Text>
                <Text style={styles.emptyText}>
                  Batch enrollment unlocks all bundled content for these learners.
                </Text>
              </View>

              {batch.students.length ? (
                batch.students.map((student) => (
                  <View key={student._id} style={styles.itemCard}>
                    <Text style={styles.itemTitle}>{student.displayName}</Text>
                    <Text style={styles.itemMeta}>{student.email || 'No email available'}</Text>
                    <Text style={styles.itemMeta}>
                      {student.enrollmentStatus || 'active'}
                      {student.joinedAt ? ` - Joined ${new Date(student.joinedAt).toLocaleDateString()}` : ''}
                    </Text>
                  </View>
                ))
              ) : (
                <View style={styles.sectionCard}>
                  <Text style={styles.emptyText}>No students enrolled yet.</Text>
                </View>
              )}
            </View>
          ) : null}

          {activeTab === 'notes' ? (
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Notes placeholder</Text>
              <Text style={styles.emptyText}>
                This tab is reserved for future notes, cohort resources, subscriptions, and live class assets.
              </Text>
            </View>
          ) : null}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0B1120' },
  screen: { flex: 1, backgroundColor: '#0B1120' },
  scrollContent: { paddingHorizontal: 18, paddingTop: 12, paddingBottom: 28, gap: 16 },
  loadingState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, paddingHorizontal: 18 },
  loadingText: { color: '#94A3B8', fontSize: 15, fontWeight: '700' },
  errorText: { color: '#FCA5A5', fontSize: 14, fontWeight: '700', textAlign: 'center' },
  topBar: { flexDirection: 'row', gap: 14, alignItems: 'flex-start' },
  backButton: { width: 42, height: 42, borderRadius: 14, backgroundColor: '#172033', borderWidth: 1, borderColor: 'rgba(148, 163, 184, 0.12)', alignItems: 'center', justifyContent: 'center' },
  copyBlock: { flex: 1, gap: 4 },
  eyebrow: { color: '#818CF8', fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
  title: { color: '#F8FAFC', fontSize: 26, fontWeight: '800' },
  subtitle: { color: '#94A3B8', fontSize: 14, fontWeight: '600' },
  heroCard: { borderRadius: 24, backgroundColor: '#172033', borderWidth: 1, borderColor: 'rgba(148, 163, 184, 0.12)', padding: 18, gap: 14 },
  heroPrice: { color: '#C7D2FE', fontSize: 16, fontWeight: '800' },
  heroMetaText: { color: '#94A3B8', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 },
  heroDescription: { color: '#CBD5E1', fontSize: 14, lineHeight: 22 },
  statsRow: { flexDirection: 'row', gap: 10 },
  statTile: { flex: 1, borderRadius: 18, backgroundColor: '#111827', padding: 14, gap: 4 },
  statValue: { color: '#F8FAFC', fontSize: 20, fontWeight: '800' },
  statLabel: { color: '#94A3B8', fontSize: 12, fontWeight: '700' },
  errorBanner: { borderRadius: 16, backgroundColor: 'rgba(239, 68, 68, 0.14)', borderWidth: 1, borderColor: 'rgba(248, 113, 113, 0.28)', padding: 14 },
  errorBannerText: { color: '#FECACA', fontSize: 13, fontWeight: '700' },
  successBanner: { borderRadius: 16, backgroundColor: 'rgba(34, 197, 94, 0.14)', borderWidth: 1, borderColor: 'rgba(134, 239, 172, 0.28)', padding: 14 },
  successBannerText: { color: '#BBF7D0', fontSize: 13, fontWeight: '700' },
  tabsRow: { gap: 10, paddingBottom: 4 },
  tabChip: { minHeight: 42, paddingHorizontal: 16, borderRadius: 14, backgroundColor: '#172033', borderWidth: 1, borderColor: 'rgba(148, 163, 184, 0.12)', alignItems: 'center', justifyContent: 'center' },
  tabChipActive: { backgroundColor: '#6366F1', borderColor: '#6366F1' },
  tabChipText: { color: '#CBD5E1', fontSize: 13, fontWeight: '800' },
  tabChipTextActive: { color: '#F8FAFC' },
  stack: { gap: 12 },
  sectionCard: { borderRadius: 22, backgroundColor: '#172033', borderWidth: 1, borderColor: 'rgba(148, 163, 184, 0.12)', padding: 18, gap: 10 },
  sectionTitle: { color: '#F8FAFC', fontSize: 22, fontWeight: '800' },
  emptyText: { color: '#94A3B8', fontSize: 14, lineHeight: 22 },
  itemCard: { borderRadius: 18, backgroundColor: '#172033', borderWidth: 1, borderColor: 'rgba(148, 163, 184, 0.12)', padding: 16, gap: 6 },
  itemTitle: { color: '#F8FAFC', fontSize: 16, fontWeight: '800' },
  itemMeta: { color: '#94A3B8', fontSize: 13, lineHeight: 20 },
  attachRow: { borderRadius: 18, backgroundColor: '#172033', borderWidth: 1, borderColor: 'rgba(148, 163, 184, 0.12)', padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  attachTitle: { color: '#F8FAFC', fontSize: 15, fontWeight: '800' },
  attachMeta: { color: '#94A3B8', fontSize: 12, lineHeight: 18 },
  addButton: { minHeight: 40, paddingHorizontal: 14, borderRadius: 14, backgroundColor: '#6366F1', alignItems: 'center', justifyContent: 'center' },
  addButtonText: { color: '#F8FAFC', fontSize: 13, fontWeight: '800' },
  buttonPressed: { opacity: 0.92 },
});
