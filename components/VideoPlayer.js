import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

export default function VideoPlayer({ videoDetails }) {
  const videoRef = useRef(null);
  const [videoModule, setVideoModule] = useState(null);
  const [moduleError, setModuleError] = useState('');

  useEffect(() => {
    let isMounted = true;

    const loadVideoModule = async () => {
      try {
        const expoAv = await import('expo-av');

        if (!isMounted) {
          return;
        }

        if (!expoAv?.Video) {
          throw new Error('expo-av loaded without a Video export.');
        }

        setVideoModule(expoAv);
        setModuleError('');
      } catch (error) {
        if (!isMounted) {
          return;
        }

        const message = error?.message || 'Video playback is not available in this build.';
        console.warn('expo-av not available:', message);
        setVideoModule(null);
        setModuleError(message);
      }
    };

    loadVideoModule();

    return () => {
      isMounted = false;
    };
  }, []);

  if (!videoDetails) return null;

  // Prefer video.url or video.hlsUrl, fallback to videoUrl (legacy)
  const videoUrl = videoDetails.url || videoDetails.hlsUrl || videoDetails.videoUrl;
  const VideoComponent = videoModule?.Video;
  const resizeMode = videoModule?.ResizeMode?.CONTAIN;

  return (
    <View style={styles.container}>
      {!videoUrl ? null : VideoComponent ? (
        <VideoComponent
          ref={videoRef}
          style={styles.video}
          source={{ uri: videoUrl }}
          useNativeControls
          resizeMode={resizeMode}
          isLooping={false}
          shouldPlay
        />
      ) : moduleError ? (
        <View style={styles.fallback}>
          <Text style={styles.fallbackTitle}>Video playback unavailable</Text>
          <Text style={styles.fallbackText}>
            {moduleError}
          </Text>
        </View>
      ) : (
        <View style={styles.loadingState}>
          <ActivityIndicator color="#CBD5E1" />
          <Text style={styles.loadingText}>Loading video player...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000',
    borderRadius: 8,
    overflow: 'hidden',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  loadingState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loadingText: {
    color: '#CBD5E1',
    fontSize: 13,
  },
  fallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    gap: 8,
    backgroundColor: '#111827',
  },
  fallbackTitle: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
  fallbackText: {
    color: '#94A3B8',
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
  },
});
