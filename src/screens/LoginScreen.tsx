import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { login, saveDoctorPushToken } from '../api/auth';
import { setAuthSession, type AppRole } from '../api/token';
import { useAuthSession } from '../context/AuthSessionContext';
import { registerForPushNotificationsAsync } from '../hooks/usePushNotifications';
import type { DoctorRootStackParamList } from '../navigation/types';

type LoginScreenNavigationProp = NativeStackNavigationProp<DoctorRootStackParamList, 'Login'>;

async function registerDoctorPushToken(authToken?: string) {
  try {
    const pushToken = await registerForPushNotificationsAsync();
    if (!pushToken?.data) {
      return;
    }
    await saveDoctorPushToken(pushToken.data, authToken);
  } catch (error) {
    if (__DEV__) {
      console.warn('[push] doctor login flow failed to sync push token', error);
    }
  }
}

export default function LoginScreen() {
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const { refreshSession } = useAuthSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Missing fields', 'Please enter email and password.');
      return;
    }

    setLoading(true);
    try {
      const response = await login(email.trim(), password);
      const userRole = response?.user?.role as AppRole | undefined;
      if (!response?.token || (userRole !== 'DOCTOR' && userRole !== 'CLINIC_STAFF')) {
        Alert.alert('Login failed', 'This app supports only doctor and clinic staff accounts.');
        return;
      }

      await setAuthSession(response.token, userRole);
      if (userRole === 'DOCTOR') {
        await registerDoctorPushToken(response.token);
      }
      await refreshSession();
      navigation.replace('DoctorMain');
    } catch (error: any) {
      const status = error?.response?.status;
      let message = error?.response?.data?.error || 'Login failed. Please try again.';

      if (status === 400 || status === 401 || status === 404) {
        message = 'Invalid email or password.';
      } else if (status === 500) {
        message = 'Server error. Please try again later.';
      } else if (!status) {
        message = 'Network error. Please check your internet connection.';
      }

      Alert.alert('Login failed', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.brand}>Dapto Doctor</Text>
          <Text style={styles.subtitle}>Doctor and clinic staff portal</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>Sign in</Text>
          <Text style={styles.description}>
            This shell accepts only doctor and clinic staff accounts. Patient login stays out of this app.
          </Text>

          <TextInput
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="doctor@example.com"
            placeholderTextColor="#94a3b8"
            style={styles.input}
            value={email}
            onChangeText={setEmail}
          />

          <TextInput
            placeholder="Password"
            placeholderTextColor="#94a3b8"
            secureTextEntry
            style={styles.input}
            value={password}
            onChangeText={setPassword}
          />

          <Pressable disabled={loading} onPress={handleLogin} style={({ pressed }) => [styles.button, pressed && !loading ? styles.buttonPressed : null]}>
            {loading ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.buttonText}>Continue to doctor app</Text>}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#eff6ff',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    gap: 24,
  },
  header: {
    gap: 6,
  },
  brand: {
    color: '#1d4ed8',
    fontSize: 16,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  subtitle: {
    color: '#0f172a',
    fontSize: 28,
    fontWeight: '800',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    gap: 14,
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0f172a',
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    color: '#475569',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#0f172a',
    backgroundColor: '#ffffff',
  },
  button: {
    backgroundColor: '#1d4ed8',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
});
