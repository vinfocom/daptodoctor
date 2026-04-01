import React from 'react';

import { getMe, saveDoctorPushToken, type AuthMeUser } from '../api/auth';
import { getRole, getToken, removeToken, type AppRole } from '../api/token';
import { registerForPushNotificationsAsync } from '../hooks/usePushNotifications';

type SessionState = {
  role: AppRole | null;
  staff_role: string | null;
  staff_clinic_id: number | null;
  staff_doctor_id: number | null;
  name: string | null;
  email: string | null;
  user: AuthMeUser | null;
  isLoading: boolean;
  pushTokenSyncStatus: 'idle' | 'syncing' | 'success' | 'error';
  pushTokenSyncMessage: string | null;
  refreshSession: () => Promise<void>;
  syncPushToken: () => Promise<{ ok: boolean; message: string }>;
  clearSession: () => Promise<void>;
};

type SessionUserState = Pick<
  SessionState,
  'role' | 'staff_role' | 'staff_clinic_id' | 'staff_doctor_id' | 'name' | 'email' | 'user'
>;

const AuthSessionContext = React.createContext<SessionState | undefined>(undefined);

function mapUserToSession(user: AuthMeUser | null): SessionUserState {
  return {
    role: user?.role ?? null,
    staff_role: user?.staff_role ?? null,
    staff_clinic_id: user?.staff_clinic_id ?? null,
    staff_doctor_id: user?.staff_doctor_id ?? null,
    name: user?.name ?? null,
    email: user?.email ?? null,
    user,
  };
}

export function AuthSessionProvider({
  children,
  initialRole,
}: {
  children: React.ReactNode;
  initialRole?: AppRole | null;
}) {
  const [session, setSession] = React.useState<SessionUserState>({
    role: initialRole ?? null,
    staff_role: null,
    staff_clinic_id: null,
    staff_doctor_id: null,
    name: null,
    email: null,
    user: null,
  });
  const [isLoading, setIsLoading] = React.useState(true);
  const [pushTokenSyncStatus, setPushTokenSyncStatus] = React.useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [pushTokenSyncMessage, setPushTokenSyncMessage] = React.useState<string | null>(null);

  const clearSession = React.useCallback(async () => {
    await removeToken();
    setSession({
      role: null,
      staff_role: null,
      staff_clinic_id: null,
      staff_doctor_id: null,
      name: null,
      email: null,
      user: null,
    });
    setPushTokenSyncStatus('idle');
    setPushTokenSyncMessage(null);
  }, []);

  const syncPushToken = React.useCallback(async () => {
    const token = await getToken();
    const storedRole = await getRole();

    if (!token || !storedRole) {
      setPushTokenSyncStatus('error');
      setPushTokenSyncMessage('No active session found');
      return { ok: false, message: 'No active session found' };
    }

    if (storedRole === 'CLINIC_STAFF') {
      setPushTokenSyncStatus('idle');
      setPushTokenSyncMessage('Clinic staff push sync is not used');
      return { ok: true, message: 'Clinic staff push sync is not used' };
    }

    setPushTokenSyncStatus('syncing');
    setPushTokenSyncMessage('Requesting notification permission');

    try {
      const pushToken = await registerForPushNotificationsAsync();
      if (!pushToken?.data) {
        setPushTokenSyncStatus('error');
        setPushTokenSyncMessage('Push token was not generated on this device');
        return { ok: false, message: 'Push token was not generated on this device' };
      }

      setPushTokenSyncMessage('Saving token to backend');
      await saveDoctorPushToken(pushToken.data, token);
      setPushTokenSyncStatus('success');
      setPushTokenSyncMessage('Push token synced successfully');
      return { ok: true, message: 'Push token synced successfully' };
    } catch (error) {
      const maybeError = error as { response?: { data?: { error?: string } }; message?: string };
      const detail =
        maybeError?.response?.data?.error ||
        maybeError?.message ||
        'Failed to sync push token';
      setPushTokenSyncStatus('error');
      setPushTokenSyncMessage(detail);
      return { ok: false, message: detail };
    }
  }, []);

  const refreshSession = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const token = await getToken();
      const storedRole = await getRole();

      if (!token || !storedRole || (storedRole !== 'DOCTOR' && storedRole !== 'CLINIC_STAFF')) {
        await clearSession();
        return;
      }

      const response = await getMe();
      if (response.user.role !== 'DOCTOR' && response.user.role !== 'CLINIC_STAFF') {
        await clearSession();
        return;
      }

      setSession(mapUserToSession(response.user));
      if (response.user.role === 'DOCTOR') {
        await syncPushToken();
      }
    } catch {
      await clearSession();
    } finally {
      setIsLoading(false);
    }
  }, [clearSession, syncPushToken]);

  React.useEffect(() => {
    refreshSession().catch(() => {
      void clearSession();
      setIsLoading(false);
    });
  }, [clearSession, refreshSession]);

  const value = React.useMemo(
    () => ({
      ...session,
      isLoading,
      pushTokenSyncStatus,
      pushTokenSyncMessage,
      refreshSession,
      syncPushToken,
      clearSession,
    }),
    [clearSession, isLoading, pushTokenSyncMessage, pushTokenSyncStatus, refreshSession, session, syncPushToken]
  );

  return <AuthSessionContext.Provider value={value}>{children}</AuthSessionContext.Provider>;
}

export function useAuthSession() {
  const context = React.useContext(AuthSessionContext);
  if (!context) {
    throw new Error('useAuthSession must be used within an AuthSessionProvider');
  }
  return context;
}
