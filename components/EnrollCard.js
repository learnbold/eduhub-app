import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

export default function EnrollCard({
  isAuthenticated,
  isEnrolling,
  isFree,
  onLogin,
  onPress,
  priceLabel,
}) {
  const ctaLabel = isAuthenticated
    ? isFree
      ? 'Start Learning'
      : 'Enroll Now'
    : 'Login to enroll';

  return (
    <View style={styles.wrapper}>
      <View style={styles.card}>
        <View style={styles.copyBlock}>
          <Text style={styles.priceLabel}>{priceLabel}</Text>
          <Text style={styles.supportingText}>
            {isAuthenticated
              ? isFree
                ? 'Get immediate access on mobile.'
                : 'Secure your spot and keep learning.'
              : 'Sign in to unlock enrollment.'}
          </Text>
        </View>

        <Pressable
          disabled={isEnrolling}
          onPress={isAuthenticated ? onPress : onLogin}
          style={({ pressed }) => [
            styles.button,
            pressed && !isEnrolling ? styles.buttonPressed : null,
            isEnrolling ? styles.buttonDisabled : null,
          ]}
        >
          {isEnrolling ? (
            <ActivityIndicator color="#F8FAFC" />
          ) : (
            <Text style={styles.buttonText}>{ctaLabel}</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 18,
    paddingBottom: 18,
    backgroundColor: 'rgba(15, 23, 42, 0.92)',
  },
  card: {
    borderRadius: 24,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.14)',
    paddingHorizontal: 18,
    paddingVertical: 16,
    shadowColor: '#020617',
    shadowOpacity: 0.4,
    shadowRadius: 20,
    shadowOffset: {
      width: 0,
      height: 12,
    },
    elevation: 12,
  },
  copyBlock: {
    marginBottom: 14,
  },
  priceLabel: {
    color: '#F8FAFC',
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 6,
  },
  supportingText: {
    color: '#94A3B8',
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '600',
  },
  button: {
    minHeight: 54,
    borderRadius: 16,
    backgroundColor: '#6366F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.99 }],
  },
  buttonDisabled: {
    opacity: 0.72,
  },
  buttonText: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '800',
  },
});
