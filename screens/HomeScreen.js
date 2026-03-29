import React, { useEffect, useLayoutEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import CourseCard from '../components/CourseCard';
import { mockCourses } from '../data/mockCourses';
import { getCourses } from '../services/api';

export default function HomeScreen({ navigation }) {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [previewMessage, setPreviewMessage] = useState('');

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  useEffect(() => {
    const loadCourses = async () => {
      try {
        setLoading(true);
        setPreviewMessage('');

        const response = await getCourses();
        const nextCourses = Array.isArray(response) ? response : response?.courses || [];

        setCourses(nextCourses);
        if (!nextCourses.length) {
          setPreviewMessage('Catalog is empty right now. Showing sample courses for visual preview.');
        }
      } catch {
        setCourses([]);
        setPreviewMessage('Live courses are unavailable. Showing sample courses for visual preview.');
      } finally {
        setLoading(false);
      }
    };

    loadCourses();
  }, []);

  const displayCourses = courses.length ? courses : mockCourses;
  const isPreviewMode = Boolean(previewMessage) && !courses.length;

  const renderHeader = () => (
    <View style={styles.headerBlock}>
      <View style={styles.topBar}>
        <View>
          <Text style={styles.topBarTitle}>EduHub</Text>
          <Text style={styles.topBarSubtitle}>Premium mobile learning</Text>
        </View>
        <Pressable
          onPress={() => navigation.getParent('MainTabs')?.navigate('ProfileTab')}
          style={({ pressed }) => [styles.avatarButton, pressed ? styles.avatarButtonPressed : null]}
        >
          <Text style={styles.avatarButtonText}>P</Text>
        </Pressable>
      </View>

      <View style={styles.heroBackdrop} />
      <View style={styles.heroCard}>
        <Text style={styles.eyebrow}>Premium learning, curated for mobile</Text>
        <Text style={styles.brand}>EduHub</Text>
        <Text style={styles.subtitle}>Explore Courses</Text>
        <View style={styles.summaryRow}>
          <View style={styles.summaryPill}>
            <Text style={styles.summaryText}>{displayCourses.length} available now</Text>
          </View>
          <View style={[styles.summaryPill, styles.summaryPillMuted]}>
            <Text style={[styles.summaryText, styles.summaryTextMuted]}>Streamlined lessons</Text>
          </View>
        </View>
      </View>

      <View style={styles.searchShell}>
        <View style={styles.searchIcon}>
          <View style={styles.searchIconHandle} />
        </View>
        <TextInput
          editable={false}
          placeholder="Search courses..."
          placeholderTextColor="#64748B"
          style={styles.searchInput}
        />
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Browse All</Text>
        <Text style={styles.sectionMeta}>{displayCourses.length} titles</Text>
      </View>

      {isPreviewMode ? (
        <View style={styles.previewBanner}>
          <Text style={styles.previewBannerTitle}>Preview Mode</Text>
          <Text style={styles.previewBannerText}>{previewMessage}</Text>
        </View>
      ) : null}
    </View>
  );

  const renderState = (message, accentColor) => (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <View style={styles.screen}>
        {renderHeader()}
        <View style={styles.stateCard}>
          <View style={[styles.stateAccent, { backgroundColor: accentColor }]} />
          <Text style={styles.stateTitle}>{message}</Text>
          <Text style={styles.stateHint}>Pull new content from your backend when it becomes available.</Text>
        </View>
      </View>
    </SafeAreaView>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="light" />
        <View style={styles.loadingScreen}>
          <View style={styles.loadingHalo} />
          <ActivityIndicator color="#6366F1" size="large" />
          <Text style={styles.loadingText}>Loading courses</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!displayCourses.length) {
    return renderState('No courses available', '#22C55E');
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <View style={styles.screen}>
        <FlatList
          contentContainerStyle={styles.listContent}
          data={displayCourses}
          keyExtractor={(item, index) => item?.slug || `${item?.title || 'course'}-${index}`}
          renderItem={({ item }) => (
            <CourseCard
              course={item}
              onPress={() => navigation.navigate('Course', { slug: item.slug })}
            />
          )}
          ListHeaderComponent={renderHeader}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  screen: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  loadingScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F172A',
    gap: 14,
  },
  loadingHalo: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
  },
  loadingText: {
    color: '#94A3B8',
    fontSize: 15,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 28,
  },
  headerBlock: {
    marginBottom: 22,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  topBarTitle: {
    color: '#F8FAFC',
    fontSize: 24,
    fontWeight: '800',
  },
  topBarSubtitle: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
  avatarButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarButtonPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
  avatarButtonText: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '800',
  },
  heroBackdrop: {
    position: 'absolute',
    top: 26,
    right: -12,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(99, 102, 241, 0.14)',
  },
  heroCard: {
    backgroundColor: '#111C34',
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 22,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.12)',
    shadowColor: '#020617',
    shadowOpacity: 0.36,
    shadowRadius: 20,
    shadowOffset: {
      width: 0,
      height: 16,
    },
    elevation: 10,
  },
  eyebrow: {
    color: '#818CF8',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  brand: {
    color: '#F8FAFC',
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 6,
  },
  subtitle: {
    color: '#94A3B8',
    fontSize: 16,
    fontWeight: '600',
  },
  summaryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 18,
  },
  summaryPill: {
    backgroundColor: 'rgba(99, 102, 241, 0.16)',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  summaryPillMuted: {
    backgroundColor: 'rgba(148, 163, 184, 0.12)',
  },
  summaryText: {
    color: '#E0E7FF',
    fontSize: 12,
    fontWeight: '700',
  },
  summaryTextMuted: {
    color: '#CBD5E1',
  },
  searchShell: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 18,
    borderRadius: 18,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.16)',
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  searchIcon: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#64748B',
    marginRight: 12,
    position: 'relative',
  },
  searchIconHandle: {
    position: 'absolute',
    right: -5,
    bottom: -5,
    width: 7,
    height: 2,
    borderRadius: 999,
    backgroundColor: '#64748B',
    transform: [{ rotate: '45deg' }],
  },
  searchInput: {
    flex: 1,
    color: '#F8FAFC',
    fontSize: 15,
    paddingVertical: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  sectionTitle: {
    color: '#F8FAFC',
    fontSize: 21,
    fontWeight: '800',
  },
  sectionMeta: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
  },
  previewBanner: {
    marginTop: 16,
    borderRadius: 18,
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.18)',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  previewBannerTitle: {
    color: '#E0E7FF',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  previewBannerText: {
    color: '#CBD5E1',
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '600',
  },
  separator: {
    height: 16,
  },
  stateCard: {
    marginTop: 4,
    backgroundColor: '#1E293B',
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 22,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.14)',
  },
  stateAccent: {
    width: 44,
    height: 6,
    borderRadius: 999,
    marginBottom: 16,
  },
  stateTitle: {
    color: '#F8FAFC',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 8,
  },
  stateHint: {
    color: '#94A3B8',
    fontSize: 14,
    lineHeight: 22,
  },
});
