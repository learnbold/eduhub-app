import React, { useEffect, useState } from 'react';
import { ActivityIndicator, SafeAreaView, Text, View } from 'react-native';
import VideoPlayer from '../components/VideoPlayer';
import { getVideos } from '../services/api';

export default function PlayerScreen({ route }) {
  const { courseId } = route.params || {};
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadVideos = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await getVideos(courseId);
        const nextVideos = Array.isArray(response) ? response : response?.videos || [];
        setVideos(nextVideos);
      } catch {
        setError('Failed to load videos.');
      } finally {
        setLoading(false);
      }
    };

    if (courseId) {
      loadVideos();
    } else {
      setLoading(false);
      setError('Missing course ID.');
    }
  }, [courseId]);

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={{ flex: 1, padding: 16, gap: 12 }}>
        <Text style={{ fontSize: 22, fontWeight: '700' }}>Player Screen</Text>
        {loading ? <ActivityIndicator size="large" /> : null}
        {error ? <Text>{error}</Text> : null}
        {!loading ? <VideoPlayer video={videos[0]} /> : null}
      </View>
    </SafeAreaView>
  );
}
