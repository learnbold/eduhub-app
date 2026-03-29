import React, { useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

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

export default function CourseCard({ course, onPress }) {
  const [imageFailed, setImageFailed] = useState(false);

  const title = course?.title || 'Untitled course';
  const category = course?.category || 'General';
  const priceLabel = formatPrice(course);
  const isFree = priceLabel === 'Free';
  const thumbnail = !imageFailed && course?.thumbnail ? { uri: course.thumbnail } : null;

  return (
    <TouchableOpacity activeOpacity={0.92} onPress={onPress} style={styles.touchable}>
      <View style={styles.card}>
        <View style={styles.media}>
          {thumbnail ? (
            <Image
              onError={() => setImageFailed(true)}
              resizeMode="cover"
              source={thumbnail}
              style={styles.image}
            />
          ) : (
            <View style={styles.fallbackArt}>
              <View style={styles.fallbackGlow} />
              <Text style={styles.fallbackEyebrow}>{category}</Text>
              <Text numberOfLines={2} style={styles.fallbackTitle}>
                {title}
              </Text>
            </View>
          )}

          <View style={styles.imageShade} />

          <View style={styles.mediaTopRow}>
            <View style={styles.categoryBadge}>
              <Text numberOfLines={1} style={styles.categoryBadgeText}>
                {category}
              </Text>
            </View>

            <View style={[styles.priceBadge, isFree ? styles.freeBadge : styles.paidBadge]}>
              <Text style={styles.priceBadgeText}>{priceLabel}</Text>
            </View>
          </View>
        </View>

        <View style={styles.content}>
          <Text numberOfLines={2} style={styles.title}>
            {title}
          </Text>
          <Text numberOfLines={1} style={styles.categoryText}>
            {category}
          </Text>
          <View style={styles.footerRow}>
            <Text style={styles.footerText}>{isFree ? 'Start instantly' : 'Premium access'}</Text>
            <View style={styles.footerDot} />
            <Text style={styles.footerText}>Tap to view</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  touchable: {
    width: '100%',
  },
  card: {
    overflow: 'hidden',
    borderRadius: 20,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.12)',
    shadowColor: '#020617',
    shadowOpacity: 0.38,
    shadowRadius: 18,
    shadowOffset: {
      width: 0,
      height: 14,
    },
    elevation: 10,
  },
  media: {
    height: 204,
    backgroundColor: '#0F172A',
    justifyContent: 'space-between',
  },
  image: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  fallbackArt: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 18,
    paddingBottom: 18,
    backgroundColor: '#172554',
  },
  fallbackGlow: {
    position: 'absolute',
    top: 24,
    right: 20,
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(99, 102, 241, 0.34)',
  },
  fallbackEyebrow: {
    color: '#C7D2FE',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  fallbackTitle: {
    color: '#F8FAFC',
    fontSize: 24,
    fontWeight: '800',
    lineHeight: 30,
    maxWidth: '78%',
  },
  imageShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.26)',
  },
  mediaTopRow: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    backgroundColor: 'rgba(34, 197, 94, 0.92)',
  },
  paidBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.95)',
  },
  priceBadgeText: {
    color: '#020617',
    fontSize: 12,
    fontWeight: '800',
  },
  content: {
    paddingHorizontal: 18,
    paddingVertical: 18,
  },
  title: {
    color: '#F8FAFC',
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '800',
  },
  categoryText: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  footerText: {
    color: '#CBD5E1',
    fontSize: 12,
    fontWeight: '700',
  },
  footerDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#475569',
    marginHorizontal: 8,
  },
});
