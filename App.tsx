import './src/global.css';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import type * as NotificationsType from 'expo-notifications';
import Constants from 'expo-constants';

import { getMe } from './src/api/auth';
import {
  getDoctorUnreadPatientIdFromNotification,
  parseDoctorNotificationTarget,
} from './src/api/notifications';
import { getRole, getToken, removeToken, type AppRole } from './src/api/token';
import { AuthSessionProvider } from './src/context/AuthSessionContext';
import { markDoctorPatientChatUnread } from './src/lib/mobileNotificationState';
import AppNavigator from './src/navigation';
import type { DoctorRootStackParamList } from './src/navigation/types';

const isExpoGo = Constants.appOwnership === 'expo';
const Notifications: typeof NotificationsType | null = isExpoGo
  ? null
  : require('expo-notifications');

if (Notifications) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

const navigationRef = createNavigationContainerRef<DoctorRootStackParamList>();

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [initialRouteName, setInitialRouteName] = useState<keyof DoctorRootStackParamList>('Login');
  const [bootRole, setBootRole] = useState<AppRole | null>(null);
  const [pendingNotificationData, setPendingNotificationData] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    const bootstrapAsync = async () => {
      let token: string | null = null;
      let role: AppRole | null = null;

      try {
        token = await getToken();
        role = await getRole();

        if (token && (role === 'DOCTOR' || role === 'CLINIC_STAFF')) {
          const response = await getMe();
          const liveRole = response?.user?.role as AppRole | undefined;
          if (liveRole === 'DOCTOR' || liveRole === 'CLINIC_STAFF') {
            role = liveRole;
            setInitialRouteName('DoctorMain');
          } else {
            token = null;
            role = null;
            await removeToken();
          }
        } else {
          token = null;
          role = null;
        }
      } catch {
        token = null;
        role = null;
        await removeToken();
      }

      if (!token || !role) {
        setInitialRouteName('Login');
      }
      setBootRole(role);
      setIsLoading(false);
    };

    bootstrapAsync().catch(() => {
      setInitialRouteName('Login');
      setBootRole(null);
      setIsLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!Notifications || !bootRole) return;

    const openDoctorNotification = (data?: Record<string, unknown> | null) => {
      const target = parseDoctorNotificationTarget(data);
      if (!target) return;

      if (!navigationRef.isReady()) {
        setPendingNotificationData(data || null);
        return;
      }

      if (target.kind === 'announcement') {
        navigationRef.navigate('DoctorAnnouncements');
        setPendingNotificationData(null);
        return;
      }

      navigationRef.navigate('Chat', {
        patientId: target.patientId,
        doctorId: target.doctorId,
        patientName: target.patientName,
      });
      setPendingNotificationData(null);
    };

    Notifications.getLastNotificationResponseAsync()
      .then((response) => {
        openDoctorNotification(response?.notification.request.content.data as Record<string, unknown> | undefined);
      })
      .catch(() => undefined);

    const receiveSubscription = Notifications.addNotificationReceivedListener((notification) => {
      const data = notification.request.content.data as Record<string, unknown> | undefined;
      const unreadPatientId = getDoctorUnreadPatientIdFromNotification(data);
      if (unreadPatientId) {
        markDoctorPatientChatUnread(unreadPatientId);
      }
    });

    const responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
      openDoctorNotification(response.notification.request.content.data as Record<string, unknown> | undefined);
    });

    return () => {
      receiveSubscription.remove();
      responseSubscription.remove();
    };
  }, [bootRole]);

  useEffect(() => {
    if (!bootRole || !pendingNotificationData || !navigationRef.isReady()) return;

    const target = parseDoctorNotificationTarget(pendingNotificationData);
    if (!target) return;

    if (target.kind === 'announcement') {
      navigationRef.navigate('DoctorAnnouncements');
      setPendingNotificationData(null);
      return;
    }

    navigationRef.navigate('Chat', {
      patientId: target.patientId,
      doctorId: target.doctorId,
      patientName: target.patientName,
    });
    setPendingNotificationData(null);
  }, [bootRole, pendingNotificationData]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#1d4ed8" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthSessionProvider initialRole={bootRole}>
        <NavigationContainer ref={navigationRef}>
          <AppNavigator initialRouteName={initialRouteName} />
        </NavigationContainer>
      </AuthSessionProvider>
    </GestureHandlerRootView>
  );
}
