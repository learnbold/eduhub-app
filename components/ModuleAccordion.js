import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import LessonItem from './LessonItem';

export default function ModuleAccordion({
  module,
  lessons,
  expanded,
  loadingLessons,
  onToggle,
  onAddLesson,
  onUploadLessonVideo,
}) {
  return (
    <View style={styles.card}>
      <Pressable onPress={onToggle} style={({ pressed }) => [styles.header, pressed ? styles.pressed : null]}>
        <View style={styles.headerCopy}>
          <Text style={styles.eyebrow}>Module {Number(module?.position || 0) + 1}</Text>
          <Text numberOfLines={2} style={styles.title}>
            {module?.title || 'Untitled module'}
          </Text>
          {module?.description ? (
            <Text numberOfLines={2} style={styles.description}>
              {module.description}
            </Text>
          ) : null}
        </View>

        <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={20} color="#94A3B8" />
      </Pressable>

      {expanded ? (
        <View style={styles.body}>
          <Pressable onPress={onAddLesson} style={({ pressed }) => [styles.addButton, pressed ? styles.pressed : null]}>
            <Ionicons name="add-circle-outline" size={16} color="#E0E7FF" />
            <Text style={styles.addButtonText}>Add Lesson</Text>
          </Pressable>

          {loadingLessons ? (
            <View style={styles.state}>
              <ActivityIndicator color="#818CF8" />
              <Text style={styles.stateText}>Loading lessons...</Text>
            </View>
          ) : lessons?.length ? (
            <View style={styles.lessonStack}>
              {lessons.map((lesson) => (
                <LessonItem
                  key={lesson._id}
                  lesson={lesson}
                  onUploadVideo={() => onUploadLessonVideo?.(lesson)}
                />
              ))}
            </View>
          ) : (
            <View style={styles.state}>
              <Text style={styles.stateText}>No lessons yet. Add the first lesson to shape this module.</Text>
            </View>
          )}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#172033',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.12)',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
  },
  headerCopy: {
    flex: 1,
    gap: 4,
  },
  eyebrow: {
    color: '#818CF8',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  title: {
    color: '#F8FAFC',
    fontSize: 17,
    fontWeight: '800',
  },
  description: {
    color: '#94A3B8',
    fontSize: 13,
    lineHeight: 20,
  },
  body: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(148, 163, 184, 0.08)',
    padding: 16,
    gap: 14,
  },
  addButton: {
    minHeight: 42,
    borderRadius: 14,
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  addButtonText: {
    color: '#E0E7FF',
    fontSize: 14,
    fontWeight: '700',
  },
  lessonStack: {
    gap: 10,
  },
  state: {
    borderRadius: 14,
    backgroundColor: '#111827',
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  stateText: {
    color: '#94A3B8',
    fontSize: 13,
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.92,
  },
});
