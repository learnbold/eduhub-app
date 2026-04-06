import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';

export default function ProfileScreen({ navigation }) {
  const { isAuthenticated, logout, user } = useAuth();

  const handlePrimaryAction = async () => {
    if (isAuthenticated) {
      await logout();
      return;
    }

    navigation.navigate('Login');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.screen}>
        <View style={styles.header}>
          <View>
            <Text style={styles.brand}>Sparklass</Text>
            <Text style={styles.subtitle}>Profile</Text>
          </View>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'E'}
            </Text>
          </View>
        </View>

        <View style={styles.profileCard}>
          <Text style={styles.eyebrow}>Account</Text>
          <Text style={styles.title}>
            {isAuthenticated ? user?.name || user?.email || 'Signed in learner' : 'Guest learner'}
          </Text>
          <Text style={styles.description}>
            {isAuthenticated
              ? 'Your profile, preferences, and course history will continue to expand here.'
              : 'Sign in to unlock enrollments, playback, and your saved course library.'}
          </Text>

          <View style={styles.statusRow}>
            <View style={styles.statusChip}>
              <Text style={styles.statusChipText}>
                {isAuthenticated ? 'Authenticated' : 'Not signed in'}
              </Text>
            </View>
          </View>

          <Pressable
            onPress={handlePrimaryAction}
            style={({ pressed }) => [styles.primaryButton, pressed ? styles.buttonPressed : null]}
          >
            <Text style={styles.primaryButtonText}>
              {isAuthenticated ? 'Sign out' : 'Go to Login'}
            </Text>
          </Pressable>

          {!isAuthenticated ? (
            <Pressable
              onPress={() => navigation.navigate('Register')}
              style={({ pressed }) => [
                styles.secondaryButton,
                pressed ? styles.buttonPressed : null,
              ]}
            >
              <Text style={styles.secondaryButtonText}>Create account</Text>
            </Pressable>
          ) : null}
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
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '800',
  },
  profileCard: {
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
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '800',
    marginBottom: 12,
  },
  description: {
    color: '#CBD5E1',
    fontSize: 15,
    lineHeight: 24,
  },
  statusRow: {
    marginTop: 18,
    marginBottom: 16,
  },
  statusChip: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    backgroundColor: 'rgba(99, 102, 241, 0.14)',
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  statusChipText: {
    color: '#C7D2FE',
    fontSize: 12,
    fontWeight: '800',
  },
  primaryButton: {
    minHeight: 52,
    borderRadius: 16,
    backgroundColor: '#6366F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButton: {
    minHeight: 52,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.18)',
    backgroundColor: '#111C34',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  buttonPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.99 }],
  },
  primaryButtonText: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '800',
  },
  secondaryButtonText: {
    color: '#E2E8F0',
    fontSize: 16,
    fontWeight: '700',
  },
});
