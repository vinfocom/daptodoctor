import client from './client';

export interface IncomingNotificationMessage {
    senderName: string;
    senderRole: 'DOCTOR' | 'PATIENT';
    preview: string;
    isAnnouncement?: boolean;
    createdAt: string;
    patientId: number;
    doctorId: number;
}

export interface ChatNotificationsResponse {
    count: number;
    announcementCount: number;
    latestAt: string | null;
    latestMessage?: IncomingNotificationMessage | null;
    uniqueSenders?: { patientId: number; patientName: string; doctorId: number }[];
}

export type DoctorNotificationTarget =
    | { kind: 'announcement' }
    | { kind: 'chat'; patientId: number; doctorId: number; patientName: string };

export const parseDoctorNotificationTarget = (
    data?: Record<string, unknown> | null
): DoctorNotificationTarget | null => {
    if (!data) return null;

    if (data.type === 'announcement') {
        return { kind: 'announcement' };
    }

    if (data.type !== 'chat') {
        return null;
    }

    const patientId = Number(data.patientId);
    const doctorId = Number(data.doctorId);

    if (!Number.isFinite(patientId) || !Number.isFinite(doctorId)) {
        return null;
    }

    const patientName =
        String(data.patientName || data.senderName || data.patient_name || 'Unknown Patient').trim() ||
        'Unknown Patient';

    return {
        kind: 'chat',
        patientId,
        doctorId,
        patientName,
    };
};

export const getDoctorUnreadPatientIdFromNotification = (
    data?: Record<string, unknown> | null
) => {
    const target = parseDoctorNotificationTarget(data);
    return target?.kind === 'chat' ? target.patientId : null;
};

export const getChatNotifications = async (since: string): Promise<ChatNotificationsResponse> => {
    const response = await client.get(`/chat/notifications?since=${encodeURIComponent(since)}`);
    return response.data;
};
