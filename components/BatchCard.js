import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const formatBatchPrice = (price) => {
  if (Number(price || 0) === 0) {
    return 'Free';
  }

  return `INR ${Number(price || 0).toLocaleString()}`;
};

export default function BatchCard({ batch, onPress }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed ? styles.cardPressed : null]}>
      {batch?.thumbnail ? (
        <Image source={{ uri: batch.thumbnail }} style={styles.thumbnail} />
      ) : (
        <View style={styles.thumbnailFallback}>
          <Ionicons name="albums-outline" size={26} color="#E0E7FF" />
        </View>
      )}

      <View style={styles.content}>
        <View style={styles.topRow}>
          <View style={styles.copy}>
            <Text numberOfLines={2} style={styles.title}>
              {batch?.title || 'Untitled Batch'}
            </Text>
            <Text style={styles.price}>{formatBatchPrice(batch?.price)}</Text>
          </View>
          <View style={styles.pill}>
            <Text style={styles.pillText}>{batch?.studentCount || 0} students</Text>
          </View>
        </View>

        <Text numberOfLines={2} style={styles.description}>
          {batch?.description || 'Courses, videos, and students grouped into one monetizable access unit.'}
        </Text>

        <View style={styles.metaRow}>
          <View style={styles.metaTile}>
            <Text style={styles.metaLabel}>Courses</Text>
            <Text style={styles.metaValue}>{batch?.courseCount || 0}</Text>
          </View>
          <View style={styles.metaTile}>
            <Text style={styles.metaLabel}>Videos</Text>
            <Text style={styles.metaValue}>{batch?.videoCount || 0}</Text>
          </View>
          <View style={styles.metaTile}>
            <Text style={styles.metaLabel}>Notes</Text>
            <Text style={styles.metaValue}>{batch?.noteCount || 0}</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#172033',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.12)',
  },
  cardPressed: {
    opacity: 0.92,
  },
  thumbnail: {
    width: '100%',
    height: 150,
  },
  thumbnailFallback: {
    height: 150,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(99, 102, 241, 0.18)',
  },
  content: {
    padding: 16,
    gap: 12,
  },
  topRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  copy: {
    flex: 1,
    gap: 4,
  },
  title: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: '800',
  },
  price: {
    color: '#C7D2FE',
    fontSize: 13,
    fontWeight: '700',
  },
  pill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
    backgroundColor: 'rgba(34, 197, 94, 0.18)',
  },
  pillText: {
    color: '#86EFAC',
    fontSize: 11,
    fontWeight: '800',
  },
  description: {
    color: '#CBD5E1',
    fontSize: 13,
    lineHeight: 20,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 10,
  },
  metaTile: {
    flex: 1,
    borderRadius: 16,
    backgroundColor: '#111827',
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 4,
  },
  metaLabel: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  metaValue: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '800',
  },
});
