import type { NavigatorScreenParams } from '@react-navigation/native';

export type DoctorTabParamList = {
  Dashboard: undefined;
  Appointments:
    | {
        openCreate?: boolean;
        prefillPatientPhone?: string;
        prefillPatientName?: string;
        prefillKey?: string;
      }
    | undefined;
  Clinics: undefined;
  Patients: undefined;
  CalendarView: undefined;
};

export type MainTabParamList = DoctorTabParamList;

export type DoctorRootStackParamList = {
  Login: undefined;
  Signup: undefined;
  DoctorMain: NavigatorScreenParams<DoctorTabParamList> | undefined;
  Chat: {
    patientId: number;
    doctorId: number;
    patientName: string;
    profilePicUrl?: string | null;
  };
  Profile: undefined;
  StaffList: undefined;
  StaffForm: {
    mode: 'create' | 'edit';
    staff?: {
      staff_id: number;
      name: string | null;
      email: string | null;
      role: string | null;
      status: string | null;
      valid_from: string | null;
      valid_to: string | null;
      clinic_id: number | null;
      clinic_name?: string | null;
      doctor_whatsapp_number?: string | null;
    };
  };
  PatientDetails: { patientId: number };
  DoctorAnnouncements: undefined;
};

export type RootStackParamList = DoctorRootStackParamList;
