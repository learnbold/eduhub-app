import React, { useEffect, useLayoutEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import EnrollCard from '../components/EnrollCard';
import { useAuth } from '../context/AuthContext';
import { mockCourses } from '../data/mockCourses';
import { enroll, getCourse } from '../services/api';

const formatPrice = (course) => {
  if (course?.isFree || Number(course?.price) === 0) {
    return 'Free';
  }

  const price = Number(course?.price);

  if (Number.isFinite(price)) {
    return `$${price % 1 === 0 ? price.toFixed(0) : price.toFixed(2)}`;
  }

  return course?.price ? String(course.price) : 'Premium';
};

export default function CourseScreen({ navigation, route }) {
  const { slug } = route.params || {};
  const { token, isHydrating } = useAuth();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const [isMockPreview, setIsMockPreview] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  useEffect(() => {
    const loadCourse = async () => {
      try {
        setLoading(true);
        setError('');
        setActionError('');
        setIsMockPreview(false);
        setCourse(null);
        setImageFailed(false);
        const response = await getCourse(slug);
        if (response) {
          setCourse(response);
          return;
        }

        const mockCourse = mockCourses.find((item) => item.slug === slug);

        if (mockCourse) {
          setCourse(mockCourse);
          setIsMockPreview(true);
          return;
        }

        setError('Failed to load course');
      } catch (fetchError) {
        console.log('Course screen load error:', fetchError?.response || fetchError);
        const mockCourse = mockCourses.find((item) => item.slug === slug);

        if (mockCourse) {
          setCourse(mockCourse);
          setIsMockPreview(true);
          return;
        }

        setError('Failed to load course');
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      loadCourse();
      return;
    }

    setLoading(false);
    setError('Failed to load course');
  }, [slug]);

  const handleEnroll = async () => {
    if (!course?._id) {
      return;
    }

    if (isMockPreview) {
      setActionError('Preview mode uses sample data only. Connect live course data to enroll.');
      return;
    }

    if (!token) {
      navigation.navigate('Login');
      return;
    }

    try {
      setIsEnrolling(true);
      setActionError('');
      await enroll(course._id);
      navigation.navigate('Player', { courseId: course._id });
    } catch (enrollError) {
      console.log('Enroll error:', enrollError?.response || enrollError);
      setActionError(enrollError?.message || 'Unable to enroll right now. Please try again.');
    } finally {
      setIsEnrolling(false);
    }
  };

  const priceLabel = formatPrice(course);
  const thumbnail = !imageFailed && course?.thumbnail ? { uri: course.thumbnail } : null;

  if (loading || isHydrating) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="light" />
        <View style={styles.loadingScreen}>
          <View style={styles.loadingGlow} />
          <ActivityIndicator color="#6366F1" size="large" />
          <Text style={styles.loadingText}>Preparing your course</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !course) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="light" />
        <View style={styles.errorScreen}>
          <View style={styles.errorCard}>
            <View style={styles.errorAccent} />
            <Text style={styles.errorTitle}>{error || 'Failed to load course'}</Text>
            <Text style={styles.errorText}>
              Refresh the app or check your connection, then try opening the course again.
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <View style={styles.screen}>
        <ScrollView
          bounces={false}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.hero}>
            {thumbnail ? (
              <Image
                onError={() => setImageFailed(true)}
                resizeMode="cover"
                source={thumbnail}
                style={styles.heroImage}
              />
            ) : (
              <View style={styles.heroFallback}>
                <View style={styles.heroGlow} />
                <Text style={styles.heroFallbackLabel}>{course.category || 'Featured Course'}</Text>
                <Text numberOfLines={3} style={styles.heroFallbackTitle}>
                  {course.title}
                </Text>
              </View>
            )}

            <View style={styles.heroOverlay} />

            <View style={styles.heroTopRow}>
              <View style={styles.categoryBadge}>
                <Text numberOfLines={1} style={styles.categoryBadgeText}>
                  {course.category || 'General'}
                </Text>
              </View>
              <View
                style={[
                  styles.priceBadge,
                  priceLabel === 'Free' ? styles.freeBadge : styles.paidBadge,
                ]}
              >
                <Text style={styles.priceBadgeText}>{priceLabel}</Text>
              </View>
            </View>

            <View style={styles.heroContent}>
              <Text numberOfLines={3} style={styles.heroTitle}>
                {course.title}
              </Text>
              <Text style={styles.heroMeta}>
                {priceLabel === 'Free' ? 'Free access available now' : 'Unlock premium access today'}
              </Text>
            </View>
          </View>

          <View style={styles.contentCard}>
            <Text style={styles.sectionEyebrow}>About this course</Text>
            <Text style={styles.description}>
              {course.description || 'No course description has been provided yet.'}
            </Text>

            <View style={styles.infoGrid}>
              <View style={styles.infoTile}>
                <Text style={styles.infoLabel}>Category</Text>
                <Text style={styles.infoValue}>{course.category || 'General'}</Text>
              </View>
              <View style={styles.infoTile}>
                <Text style={styles.infoLabel}>Access</Text>
                <Text style={styles.infoValue}>{priceLabel}</Text>
              </View>
            </View>

            <View style={styles.valueCard}>
              <Text style={styles.valueTitle}>Why learners enroll</Text>
              <Text style={styles.valueText}>
                Focused lessons, clean playback, and a streamlined mobile flow designed to get
                learners into content fast.
              </Text>
            </View>

            {isMockPreview ? (
              <View style={styles.previewBanner}>
                <Text style={styles.previewBannerTitle}>Preview Mode</Text>
                <Text style={styles.previewBannerText}>
                  This course is coming from optional mock data so you can visualize the mobile
                  experience before live catalog data is available.
                </Text>
              </View>
            ) : null}

            {actionError ? <Text style={styles.actionError}>{actionError}</Text> : null}
          </View>
        </ScrollView>

        <EnrollCard
          isAuthenticated={Boolean(token)}
          isEnrolling={isEnrolling}
          isFree={Boolean(course.isFree || Number(course.price) === 0)}
          onLogin={() => navigation.navigate('Login')}
          onPress={handleEnroll}
          priceLabel={priceLabel}
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
  loadingGlow: {
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
  errorScreen: {
    flex: 1,
    paddingHorizontal: 18,
    justifyContent: 'center',
  },
  errorCard: {
    borderRadius: 24,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.14)',
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  errorAccent: {
    width: 46,
    height: 6,
    borderRadius: 999,
    backgroundColor: '#F59E0B',
    marginBottom: 16,
  },
  errorTitle: {
    color: '#F8FAFC',
    fontSize: 22,
    fontWeight: '800',
  },
  errorText: {
    color: '#94A3B8',
    fontSize: 14,
    lineHeight: 22,
    marginTop: 10,
  },
  scrollContent: {
    padding: 18,
    paddingBottom: 180,
  },
  hero: {
    height: 360,
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: '#172554',
    marginBottom: 18,
    shadowColor: '#020617',
    shadowOpacity: 0.4,
    shadowRadius: 22,
    shadowOffset: {
      width: 0,
      height: 16,
    },
    elevation: 12,
  },
  heroImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  heroFallback: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingBottom: 28,
    backgroundColor: '#172554',
  },
  heroGlow: {
    position: 'absolute',
    top: 30,
    right: 18,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(99, 102, 241, 0.35)',
  },
  heroFallbackLabel: {
    color: '#C7D2FE',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.9,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  heroFallbackTitle: {
    color: '#F8FAFC',
    fontSize: 30,
    fontWeight: '800',
    lineHeight: 38,
    maxWidth: '82%',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.34)',
  },
  heroTopRow: {
    position: 'absolute',
    top: 18,
    left: 18,
    right: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryBadge: {
    maxWidth: '62%',
    borderRadius: 999,
    backgroundColor: 'rgba(15, 23, 42, 0.72)',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  categoryBadgeText: {
    color: '#E2E8F0',
    fontSize: 12,
    fontWeight: '700',
  },
  priceBadge: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  freeBadge: {
    backgroundColor: 'rgba(34, 197, 94, 0.94)',
  },
  paidBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.96)',
  },
  priceBadgeText: {
    color: '#020617',
    fontSize: 12,
    fontWeight: '800',
  },
  heroContent: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 24,
  },
  heroTitle: {
    color: '#F8FAFC',
    fontSize: 30,
    lineHeight: 38,
    fontWeight: '800',
    marginBottom: 10,
  },
  heroMeta: {
    color: '#CBD5E1',
    fontSize: 14,
    fontWeight: '600',
  },
  contentCard: {
    borderRadius: 24,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.12)',
    paddingHorizontal: 18,
    paddingVertical: 20,
  },
  sectionEyebrow: {
    color: '#818CF8',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  description: {
    color: '#E2E8F0',
    fontSize: 15,
    lineHeight: 24,
  },
  infoGrid: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  infoTile: {
    flex: 1,
    borderRadius: 18,
    backgroundColor: '#111C34',
    paddingHorizontal: 14,
    paddingVertical: 16,
  },
  infoLabel: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  infoValue: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '700',
  },
  valueCard: {
    marginTop: 18,
    borderRadius: 20,
    backgroundColor: 'rgba(99, 102, 241, 0.10)',
    paddingHorizontal: 16,
    paddingVertical: 18,
  },
  valueTitle: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 8,
  },
  valueText: {
    color: '#CBD5E1',
    fontSize: 14,
    lineHeight: 22,
  },
  previewBanner: {
    marginTop: 18,
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
  actionError: {
    color: '#FCA5A5',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 18,
  },
});
