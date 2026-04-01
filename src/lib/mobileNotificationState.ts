let doctorChatsReadAt = 0;
const doctorReadPatientIds = new Set<number>();
const doctorUnreadPatientIds = new Set<number>();
const doctorChatListeners = new Set<() => void>();

const emitDoctorChatChange = () => {
  doctorChatListeners.forEach((listener) => {
    try {
      listener();
    } catch {
      // ignore listener errors
    }
  });
};

export function markDoctorPatientChatUnread(patientId: number) {
  if (!patientId) return;
  doctorUnreadPatientIds.add(patientId);
  emitDoctorChatChange();
}

export function markDoctorPatientChatRead(patientId: number) {
  doctorChatsReadAt = Date.now();
  doctorReadPatientIds.add(patientId);
  doctorUnreadPatientIds.delete(patientId);
  emitDoctorChatChange();
}

export function markPatientDoctorChatRead(doctorId: number) {
  doctorChatsReadAt = Date.now();
  if (doctorId) {
    // Doctor app never tracks patient-side unread state, but keeping this
    // alias avoids mixed-screen compile failures while the chat UI is copied over.
  }
}

export function getDoctorChatsReadAt() {
  return doctorChatsReadAt;
}

export function consumeDoctorReadPatientIds() {
  const ids = Array.from(doctorReadPatientIds);
  doctorReadPatientIds.clear();
  return ids;
}

export function getDoctorUnreadPatientIdsSnapshot() {
  return Array.from(doctorUnreadPatientIds);
}

export function subscribeDoctorChatState(listener: () => void) {
  doctorChatListeners.add(listener);
  return () => {
    doctorChatListeners.delete(listener);
  };
}
