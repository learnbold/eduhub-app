import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { CommonActions } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';

const goToMainApp = (navigation) => {
  navigation.dispatch(
    CommonActions.reset({
      index: 0,
      routes: [
        {
          name: 'MainTabs',
          state: {
            routes: [
              {
                name: 'HomeTab',
              },
            ],
          },
        },
      ],
    })
  );
};

export default function LoginScreen({ navigation }) {
  const { isAuthenticated, login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      goToMainApp(navigation);
    }
  }, [isAuthenticated, navigation]);

  const formValid = useMemo(
    () => email.trim().length > 0 && password.trim().length > 0,
    [email, password]
  );

  const handleSubmit = async () => {
    if (!formValid || submitting) {
      if (!formValid) {
        setError('Enter your email and password to continue.');
      }
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      Keyboard.dismiss();
      await login({
        email: email.trim(),
        password,
      });
      goToMainApp(navigation);
    } catch (submitError) {
      setError(
        submitError?.response?.data?.message ||
          submitError?.message ||
          'Unable to sign in right now. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardView}
        >
          <ScrollView
            bounces={false}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.glow} />
            <View style={styles.header}>
              <Text style={styles.eyebrow}>EduHub</Text>
              <Text style={styles.title}>Welcome Back</Text>
              <Text style={styles.subtitle}>Continue learning</Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Sign in</Text>
              <Text style={styles.cardSubtitle}>
                Pick up where you left off with your saved courses and playback progress.
              </Text>

              <View style={styles.form}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Email</Text>
                  <TextInput
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="email-address"
                    onChangeText={setEmail}
                    placeholder="Enter your email"
                    placeholderTextColor="#64748B"
                    selectionColor="#6366F1"
                    style={styles.input}
                    value={email}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Password</Text>
                  <TextInput
                    autoCapitalize="none"
                    autoCorrect={false}
                    onChangeText={setPassword}
                    placeholder="Enter your password"
                    placeholderTextColor="#64748B"
                    secureTextEntry
                    selectionColor="#6366F1"
                    style={styles.input}
                    value={password}
                  />
                </View>
              </View>

              <Pressable
                disabled={submitting}
                onPress={handleSubmit}
                style={({ pressed }) => [
                  styles.primaryButton,
                  pressed && !submitting ? styles.buttonPressed : null,
                  submitting ? styles.buttonDisabled : null,
                ]}
              >
                {submitting ? (
                  <ActivityIndicator color="#F8FAFC" />
                ) : (
                  <Text style={styles.primaryButtonText}>Login</Text>
                )}
              </Pressable>

              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              <Pressable
                onPress={() => navigation.navigate('Register')}
                style={({ pressed }) => [
                  styles.switchLink,
                  pressed ? styles.switchLinkPressed : null,
                ]}
              >
                <Text style={styles.switchText}>
                  Don&apos;t have an account? <Text style={styles.switchTextAccent}>Register</Text>
                </Text>
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 18,
    paddingVertical: 28,
    backgroundColor: '#0F172A',
  },
  glow: {
    position: 'absolute',
    top: 96,
    right: -32,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(99, 102, 241, 0.16)',
  },
  header: {
    marginBottom: 22,
  },
  eyebrow: {
    color: '#818CF8',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  title: {
    color: '#F8FAFC',
    fontSize: 34,
    fontWeight: '800',
    marginBottom: 6,
  },
  subtitle: {
    color: '#94A3B8',
    fontSize: 16,
    fontWeight: '600',
  },
  card: {
    borderRadius: 28,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.12)',
    paddingHorizontal: 20,
    paddingVertical: 22,
    shadowColor: '#020617',
    shadowOpacity: 0.34,
    shadowRadius: 18,
    shadowOffset: {
      width: 0,
      height: 14,
    },
    elevation: 10,
  },
  cardTitle: {
    color: '#F8FAFC',
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 8,
  },
  cardSubtitle: {
    color: '#94A3B8',
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 20,
  },
  form: {
    gap: 14,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    color: '#CBD5E1',
    fontSize: 13,
    fontWeight: '700',
  },
  input: {
    minHeight: 54,
    borderRadius: 14,
    backgroundColor: '#111C34',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.14)',
    paddingHorizontal: 16,
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '600',
  },
  primaryButton: {
    minHeight: 54,
    borderRadius: 16,
    backgroundColor: '#6366F1',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  buttonPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.99 }],
  },
  buttonDisabled: {
    opacity: 0.74,
  },
  primaryButtonText: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '800',
  },
  errorText: {
    color: '#FCA5A5',
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 20,
    marginTop: 14,
  },
  switchLink: {
    marginTop: 18,
    alignSelf: 'center',
    paddingVertical: 6,
  },
  switchLinkPressed: {
    opacity: 0.8,
  },
  switchText: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '600',
  },
  switchTextAccent: {
    color: '#F8FAFC',
    fontWeight: '800',
  },
});
