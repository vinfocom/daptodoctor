import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import type { DoctorTabParamList } from './types';
import AppointmentsScreen from '../screens/AppointmentsScreen';
import CalendarScreen from '../screens/CalendarScreen';
import ClinicsScreen from '../screens/ClinicsScreen';
import DashboardScreen from '../screens/DashboardScreen';
import PatientsScreen from '../screens/Patients';

const Tab = createBottomTabNavigator<DoctorTabParamList>();

export default function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#1d4ed8',
        tabBarInactiveTintColor: '#64748b',
      }}
    >
      <Tab.Screen
        name="Dashboard"
        options={{ title: 'Dashboard' }}
        component={DashboardScreen}
      />
      <Tab.Screen
        name="Appointments"
        options={{ title: 'Appointments' }}
        component={AppointmentsScreen}
      />
      <Tab.Screen
        name="Clinics"
        options={{ title: 'Clinics' }}
        component={ClinicsScreen}
      />
      <Tab.Screen
        name="Patients"
        options={{ title: 'Patients' }}
        component={PatientsScreen}
      />
      <Tab.Screen
        name="CalendarView"
        options={{ title: 'Trends' }}
        component={CalendarScreen}
      />
    </Tab.Navigator>
  );
}
