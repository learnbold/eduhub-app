import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import VideoPlayer from '../components/VideoPlayer';
import { getVideos, getModulesByCourse, getLessonsByModule } from '../services/api';

export default function PlayerScreen({ navigation, route }) {
  const { courseId } = route.params || {};
  const [data, setData] = useState([]);
  const [videos, setVideos] = useState([]);
  const [allLessons, setAllLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentLesson, setCurrentLesson] = useState(null);

  useEffect(() => {
    const loadContent = async () => {
      try {
        setLoading(true);
        setError('');

        const [modulesRes, videosRes] = await Promise.all([
          getModulesByCourse(courseId).catch(() => []),
          getVideos(courseId).catch(() => []),
        ]);

        const modulesArr = Array.isArray(modulesRes) ? modulesRes : [];
        const videosArr = Array.isArray(videosRes) ? videosRes : videosRes?.videos || [];
        setVideos(videosArr);

        const modulesWithLessons = await Promise.all(
          modulesArr.map(async (mod) => {
            const lessonsRes = await getLessonsByModule(mod._id).catch(() => []);
            const lessonsArr = Array.isArray(lessonsRes) ? lessonsRes : [];
            return {
              ...mod,
              lessons: lessonsArr.sort((a, b) => a.position - b.position),
            };
          })
        );

        const sortedModules = modulesWithLessons.sort((a, b) => a.position - b.position);
        setData(sortedModules);

        const extractedLessons = sortedModules.flatMap(m => m.lessons);
        setAllLessons(extractedLessons);

        if (extractedLessons.length > 0) {
          setCurrentLesson(extractedLessons[0]);
        }
      } catch (err) {
        console.log('Player screen load error:', err?.response || err);
        setError('Failed to load course content.');
      } finally {
        setLoading(false);
      }
    };

    if (courseId) {
      loadContent();
    } else {
      setLoading(false);
      setError('Missing course ID.');
    }
  }, [courseId]);

  const handleLessonPress = (lesson) => {
    setCurrentLesson(lesson);
  };

  const currentIndex = allLessons.findIndex(l => l._id === currentLesson?._id);
  
  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentLesson(allLessons[currentIndex - 1]);
    }
  };

  const handleNext = () => {
    if (currentIndex < allLessons.length - 1) {
      setCurrentLesson(allLessons[currentIndex + 1]);
    }
  };

  const getResolvedVideo = () => {
    if (!currentLesson) return null;
    
    // First try lesson.video object
    if (currentLesson.video) {
      return currentLesson.video;
    }

    // Try finding by ID
    const vidId = typeof currentLesson.videoId === 'string' 
      ? currentLesson.videoId 
      : currentLesson.videoId?._id;

    if (vidId) {
      const found = videos.find(v => v._id === vidId);
      if (found) return found;
    }

    // Fallback to legacy URL
    if (currentLesson.videoUrl || currentLesson.hlsUrl) {
      return {
        url: currentLesson.videoUrl || currentLesson.hlsUrl,
        videoUrl: currentLesson.videoUrl,
        hlsUrl: currentLesson.hlsUrl
      };
    }

    return null;
  };

  const activeVideo = getResolvedVideo();

  const renderModule = ({ item }) => (
    <View style={styles.moduleCard}>
      <Text style={styles.moduleTitle}>{item.title}</Text>
      <View style={styles.lessonsContainer}>
        {item.lessons.map((lesson, idx) => {
          const isActive = currentLesson?._id === lesson._id;
          return (
            <Pressable
              key={lesson._id || idx}
              style={[styles.lessonRow, isActive && styles.lessonRowActive]}
              onPress={() => handleLessonPress(lesson)}
            >
              <Ionicons 
                name={isActive ? "play-circle" : "play-circle-outline"} 
                size={20} 
                color={isActive ? "#818CF8" : "#64748B"} 
              />
              <Text style={[styles.lessonTitle, isActive && styles.lessonTitleActive]}>
                {lesson.title}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#F8FAFC" />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {currentLesson ? currentLesson.title : 'Course Player'}
        </Text>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color="#6366F1" size="large" />
          <Text style={styles.loadingText}>Loading course content</Text>
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <View style={styles.container}>
          <View style={styles.videoWrapper}>
            {activeVideo ? (
              <VideoPlayer videoDetails={activeVideo} />
            ) : (
              <View style={styles.noVideo}>
                <Ionicons name="videocam-off-outline" size={32} color="#64748B" />
                <Text style={styles.noVideoText}>No video available for this lesson</Text>
              </View>
            )}
          </View>

          <View style={styles.navControls}>
            <Pressable 
              onPress={handlePrev} 
              disabled={currentIndex <= 0}
              style={[styles.navButton, currentIndex <= 0 && styles.navButtonDisabled]}
            >
              <Ionicons name="play-skip-back" size={20} color={currentIndex <= 0 ? "#475569" : "#F8FAFC"} />
              <Text style={[styles.navButtonText, currentIndex <= 0 && styles.navButtonTextDisabled]}>Prev</Text>
            </Pressable>
            <Text style={styles.progressText}>
              {currentIndex + 1} / {allLessons.length}
            </Text>
            <Pressable 
              onPress={handleNext} 
              disabled={currentIndex >= allLessons.length - 1}
              style={[styles.navButton, currentIndex >= allLessons.length - 1 && styles.navButtonDisabled]}
            >
              <Text style={[styles.navButtonText, currentIndex >= allLessons.length - 1 && styles.navButtonTextDisabled]}>Next</Text>
              <Ionicons name="play-skip-forward" size={20} color={currentIndex >= allLessons.length - 1 ? "#475569" : "#F8FAFC"} />
            </Pressable>
          </View>

          <FlatList
            data={data}
            keyExtractor={item => item._id}
            renderItem={renderModule}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(148, 163, 184, 0.1)',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    flex: 1,
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: '700',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#94A3B8',
    fontSize: 15,
  },
  errorText: {
    color: '#FCA5A5',
    fontSize: 16,
  },
  container: {
    flex: 1,
  },
  videoWrapper: {
    backgroundColor: '#020617',
    aspectRatio: 16 / 9,
    width: '100%',
  },
  noVideo: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    gap: 12,
  },
  noVideoText: {
    color: '#94A3B8',
    fontSize: 14,
  },
  navControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#111C34',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(148, 163, 184, 0.1)',
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
  },
  navButtonDisabled: {
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
  },
  navButtonText: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '600',
  },
  navButtonTextDisabled: {
    color: '#475569',
  },
  progressText: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  moduleCard: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.1)',
  },
  moduleTitle: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '700',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#111C34',
  },
  lessonsContainer: {
    paddingVertical: 8,
  },
  lessonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  lessonRowActive: {
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
  },
  lessonTitle: {
    color: '#CBD5E1',
    fontSize: 14,
    flex: 1,
  },
  lessonTitleActive: {
    color: '#818CF8',
    fontWeight: '600',
  },
});
