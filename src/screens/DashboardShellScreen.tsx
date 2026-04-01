import React from 'react';
import { Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useAuthSession } from '../context/AuthSessionContext';
import type { DoctorRootStackParamList } from '../navigation/types';
import PlaceholderScreen from './PlaceholderScreen';

type DashboardNavigationProp = NativeStackNavigationProp<DoctorRootStackParamList>;

export default function DashboardShellScreen() {
  const navigation = useNavigation<DashboardNavigationProp>();
  const { role, staff_role, clearSession } = useAuthSession();

  const handleLogout = async () => {
    try {
      await clearSession();
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    } catch {
      Alert.alert('Logout failed', 'Please try again.');
    }
  };

  const roleLabel =
    role === 'CLINIC_STAFF'
      ? `Clinic staff${staff_role ? ` | ${String(staff_role).replace(/_/g, ' ')}` : ''}`
      : 'Doctor';

  return (
    <PlaceholderScreen
      title="Dashboard"
      description={`Doctor-only dashboard shell is ready. Signed in as ${roleLabel}. Use logout here to validate session cleanup before feature migration.`}
      actions={[
        {
          label: 'Log out',
          onPress: handleLogout,
        },
      ]}
    />
  );
}
