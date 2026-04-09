import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import ChatScreen from '../screens/ChatScreen';
import DoctorAnnouncementsScreen from '../screens/DoctorAnnouncementsScreen';
import PatientDetailsScreen from '../screens/PatientDetails';
import ProfileScreen from '../screens/ProfileScreen';
import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';
import StaffFormScreen from '../screens/StaffFormScreen';
import StaffListScreen from '../screens/StaffListScreen';
import TabNavigator from './TabNavigator';
import type { DoctorRootStackParamList } from './types';

const Stack = createNativeStackNavigator<DoctorRootStackParamList>();

export default function AppNavigator({
  initialRouteName,
}: {
  initialRouteName: keyof DoctorRootStackParamList;
}) {
  return (
    <Stack.Navigator
      initialRouteName={initialRouteName}
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        gestureEnabled: true,
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} options={{ animation: 'fade' }} />
      <Stack.Screen name="Signup" component={SignupScreen} options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="DoctorMain" component={TabNavigator} options={{ animation: 'fade' }} />
      <Stack.Screen name="Chat" component={ChatScreen} options={{ animation: 'slide_from_right' }} />
      <Stack.Screen
        name="Profile"
        options={{ animation: 'slide_from_right' }}
        component={ProfileScreen}
      />
      <Stack.Screen name="StaffList" component={StaffListScreen} options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="StaffForm" component={StaffFormScreen} options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="PatientDetails" component={PatientDetailsScreen} options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="DoctorAnnouncements" component={DoctorAnnouncementsScreen} options={{ animation: 'slide_from_right' }} />
    </Stack.Navigator>
  );
}
