import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function MyCoursesScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        bounces={false}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.screen}>
          <View style={styles.topBar}>
            <View>
              <Text style={styles.brand}>Sparklass</Text>
              <Text style={styles.subtitle}>My Courses</Text>
            </View>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Soon</Text>
            </View>
          </View>

          <View style={styles.heroCard}>
            <Text style={styles.eyebrow}>Learning dashboard</Text>
            <Text style={styles.title}>Your enrolled courses will appear here.</Text>
            <Text style={styles.description}>
              Track progress, revisit lessons, and jump back into playback from one polished place.
            </Text>

            <Pressable
              onPress={() => navigation.navigate('HomeTab')}
              style={({ pressed }) => [styles.button, pressed ? styles.buttonPressed : null]}
            >
              <Text style={styles.buttonText}>Explore catalog</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  scrollContent: {
    flexGrow: 1,
  },
  screen: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 28,
    minHeight: '100%',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  brand: {
    color: '#F8FAFC',
    fontSize: 24,
    fontWeight: '800',
  },
  subtitle: {
    color: '#94A3B8',
    fontSize: 15,
    fontWeight: '600',
    marginTop: 4,
  },
  badge: {
    borderRadius: 999,
    backgroundColor: 'rgba(99, 102, 241, 0.14)',
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  badgeText: {
    color: '#C7D2FE',
    fontSize: 12,
    fontWeight: '800',
  },
  heroCard: {
    marginTop: 12,
    borderRadius: 28,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.12)',
    paddingHorizontal: 20,
    paddingVertical: 22,
  },
  eyebrow: {
    color: '#818CF8',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  title: {
    color: '#F8FAFC',
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '800',
    marginBottom: 12,
  },
  description: {
    color: '#CBD5E1',
    fontSize: 15,
    lineHeight: 24,
  },
  button: {
    marginTop: 22,
    minHeight: 52,
    borderRadius: 16,
    backgroundColor: '#6366F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPressed: {
    opacity: 0.88,
  },
  buttonText: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '800',
  },
});
