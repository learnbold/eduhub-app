import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const getStatusLabel = (course) => {
  if (course?.status === 'archived') {
    return 'Archived';
  }

  if (course?.status === 'published' || course?.isPublished) {
    return 'Published';
  }

  return 'Draft';
};

export default function TeacherCourseCard({ course, onPress, onEdit, onPublish }) {
  const statusLabel = getStatusLabel(course);
  const isPublished = statusLabel === 'Published';

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed ? styles.cardPressed : null]}>
      <View style={styles.mediaShell}>
        {course?.thumbnail ? (
          <Image source={{ uri: course.thumbnail }} style={styles.thumbnail} />
        ) : (
          <View style={styles.thumbnailFallback}>
            <Ionicons name="layers-outline" size={26} color="#C7D2FE" />
          </View>
        )}
      </View>

      <View style={styles.content}>
        <View style={styles.topRow}>
          <View style={styles.titleBlock}>
            <Text numberOfLines={2} style={styles.title}>
              {course?.title || 'Untitled Course'}
            </Text>
            <Text style={styles.meta}>
              {course?.category || 'Uncategorized'} - {course?.isFree ? 'Free' : `INR ${course?.price || 0}`}
            </Text>
          </View>

          <View style={[styles.statusPill, isPublished ? styles.statusPublished : styles.statusDraft]}>
            <Text style={[styles.statusText, isPublished ? styles.statusTextPublished : null]}>
              {statusLabel}
            </Text>
          </View>
        </View>

        <Text numberOfLines={2} style={styles.description}>
          {course?.description || 'Add a richer description so learners understand the value of this course.'}
        </Text>

        <View style={styles.actions}>
          <Pressable onPress={onEdit} style={({ pressed }) => [styles.secondaryAction, pressed ? styles.actionPressed : null]}>
            <Ionicons name="create-outline" size={16} color="#E2E8F0" />
            <Text style={styles.secondaryActionText}>Edit</Text>
          </Pressable>

          <Pressable
            disabled={isPublished}
            onPress={onPublish}
            style={({ pressed }) => [
              styles.primaryAction,
              isPublished ? styles.primaryActionDisabled : null,
              pressed && !isPublished ? styles.actionPressed : null,
            ]}
          >
            <Ionicons name={isPublished ? 'checkmark-circle-outline' : 'rocket-outline'} size={16} color="#F8FAFC" />
            <Text style={styles.primaryActionText}>{isPublished ? 'Live' : 'Publish'}</Text>
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#172033',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.12)',
    overflow: 'hidden',
  },
  cardPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.995 }],
  },
  mediaShell: {
    height: 156,
    backgroundColor: '#0F172A',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  thumbnailFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(99, 102, 241, 0.14)',
  },
  content: {
    padding: 16,
    gap: 12,
  },
  topRow: {
    flexDirection: 'row',
    gap: 12,
  },
  titleBlock: {
    flex: 1,
    gap: 4,
  },
  title: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: '800',
  },
  meta: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
  },
  statusPill: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  statusDraft: {
    backgroundColor: 'rgba(245, 158, 11, 0.18)',
  },
  statusPublished: {
    backgroundColor: 'rgba(34, 197, 94, 0.18)',
  },
  statusText: {
    color: '#FDE68A',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  statusTextPublished: {
    color: '#86EFAC',
  },
  description: {
    color: '#CBD5E1',
    fontSize: 13,
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  secondaryAction: {
    flex: 1,
    minHeight: 42,
    borderRadius: 14,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.12)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  secondaryActionText: {
    color: '#E2E8F0',
    fontSize: 14,
    fontWeight: '700',
  },
  primaryAction: {
    flex: 1,
    minHeight: 42,
    borderRadius: 14,
    backgroundColor: '#6366F1',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryActionDisabled: {
    opacity: 0.72,
  },
  primaryActionText: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '800',
  },
  actionPressed: {
    opacity: 0.9,
  },
});
