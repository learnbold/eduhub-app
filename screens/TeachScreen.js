import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function TeachScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.screen}>
        <View style={styles.header}>
          <Text style={styles.brand}>Sparklass</Text>
          <Text style={styles.subtitle}>Teacher Dashboard</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.eyebrow}>Manage Content</Text>
          <Text style={styles.title}>Update your Hub on the go.</Text>
          <Text style={styles.description}>
            Manage courses, upload lessons, and view analytics directly from your mobile dashboard.
          </Text>
        </View>
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
    paddingHorizontal: 18,
    paddingTop: 12,
  },
  header: {
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
  card: {
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
});
