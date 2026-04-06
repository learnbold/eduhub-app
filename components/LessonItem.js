import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function LessonItem({ lesson, onUploadVideo }) {
  const hasVideo = Boolean(lesson?.video?.url || lesson?.videoId || lesson?.videoUrl);

  return (
    <View style={styles.card}>
      <View style={styles.content}>
        <View style={styles.headerRow}>
          <Text numberOfLines={2} style={styles.title}>
            {lesson?.title || 'Untitled lesson'}
          </Text>

          {lesson?.isPreview ? (
            <View style={styles.previewPill}>
              <Text style={styles.previewText}>Preview</Text>
            </View>
          ) : null}
        </View>

        <Text style={styles.meta}>
          {lesson?.duration ? `${lesson.duration}s` : 'Duration pending'} - {hasVideo ? 'Video attached' : 'No video yet'}
        </Text>
      </View>

      <Pressable onPress={onUploadVideo} style={({ pressed }) => [styles.uploadButton, pressed ? styles.pressed : null]}>
        <Ionicons name={hasVideo ? 'refresh-outline' : 'cloud-upload-outline'} size={18} color="#C7D2FE" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#111827',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.08)',
    padding: 14,
  },
  content: {
    flex: 1,
    gap: 4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    flex: 1,
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '700',
  },
  meta: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  previewPill: {
    borderRadius: 999,
    backgroundColor: 'rgba(99, 102, 241, 0.18)',
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  previewText: {
    color: '#C7D2FE',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  uploadButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
  },
  pressed: {
    opacity: 0.9,
  },
});
