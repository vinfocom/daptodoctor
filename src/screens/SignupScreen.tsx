import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Linking,
  Platform,
  ScrollView,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  ArrowLeft,
  ArrowRight,
  Calculator,
  Camera,
  Check,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  FileText,
  Lock,
  Mail,
  RefreshCw,
  ShieldCheck,
  Stethoscope,
  Upload,
  User,
  X,
} from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp, ZoomIn } from 'react-native-reanimated';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';

import {
  doctorSignup,
  getLoginChallenge,
  verifyLoginChallenge,
} from '../api/auth';
import { uploadDoctorSignupDocument } from '../api/uploads';
import type { DoctorRootStackParamList } from '../navigation/types';

type SignupScreenNavigationProp = NativeStackNavigationProp<DoctorRootStackParamList, 'Signup'>;

export default function SignupScreen() {
  const navigation = useNavigation<SignupScreenNavigationProp>();
  const allowedDocumentMimeTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [email, setEmail] = useState('');
  const [doctorName, setDoctorName] = useState('');
  const [phone, setPhone] = useState('');
  const [numClinics, setNumClinics] = useState(1);
  const [whatsappNumbers, setWhatsappNumbers] = useState<string[]>(['']);
  const [specialization, setSpecialization] = useState('');
  const [registrationNo, setRegistrationNo] = useState('');
  const [education, setEducation] = useState('');
  const [documentUrl, setDocumentUrl] = useState('');
  const [documentMimeType, setDocumentMimeType] = useState('');
  const [address, setAddress] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [panNumber, setPanNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadingDocumentSource, setUploadingDocumentSource] = useState<'camera' | 'file' | null>(null);
  const [challengeQuestion, setChallengeQuestion] = useState('');
  const [challengeId, setChallengeId] = useState('');
  const [challengeAnswer, setChallengeAnswer] = useState('');
  const [challengeVerificationToken, setChallengeVerificationToken] = useState('');
  const [challengeVerified, setChallengeVerified] = useState(false);
  const [challengeLoading, setChallengeLoading] = useState(false);
  const [verifyingChallenge, setVerifyingChallenge] = useState(false);
  const [challengeStatus, setChallengeStatus] = useState<'idle' | 'success'>('idle');
  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;
  const passwordsMismatch = confirmPassword.length > 0 && password !== confirmPassword;
  const hasWhatsappNumber = whatsappNumbers.some((value) => value.trim().length > 0);

  const canContinue = useMemo(
    () => Boolean(email.trim() && password && confirmPassword && challengeAnswer.trim() && passwordsMatch),
    [challengeAnswer, confirmPassword, email, password, passwordsMatch]
  );

  const canContinueStep2 = useMemo(() => Boolean(doctorName.trim() && phone.trim()), [doctorName, phone]);

  const canContinueStep3 = useMemo(() => hasWhatsappNumber, [hasWhatsappNumber]);

  const canContinueStep4 = useMemo(
    () =>
      Boolean(
        specialization.trim() &&
        registrationNo.trim() &&
        education.trim() &&
        documentUrl.trim()
      ),
    [
      documentUrl,
      education,
      registrationNo,
      specialization,
    ]
  );

  const canSubmit = useMemo(() => Boolean(address.trim()), [address]);

  const loadLoginChallenge = async (clearAnswer = true) => {
    setChallengeLoading(true);
    setChallengeVerified(false);
    setChallengeVerificationToken('');
    setChallengeStatus('idle');
    try {
      const challenge = await getLoginChallenge();
      setChallengeQuestion(challenge.question);
      setChallengeId(challenge.challengeId);
      if (clearAnswer) {
        setChallengeAnswer('');
      }
    } catch {
      setChallengeQuestion('');
      setChallengeId('');
    } finally {
      setChallengeLoading(false);
    }
  };

  const handleVerifyChallenge = async (answer: string) => {
    if (!challengeId || !answer.trim() || challengeVerified) return;

    setVerifyingChallenge(true);
    setChallengeVerified(false);
    setChallengeVerificationToken('');
    setChallengeStatus('idle');

    try {
      const response = await verifyLoginChallenge(challengeId, answer.trim());
      setChallengeVerificationToken(response?.verificationToken || '');
      setChallengeVerified(true);
      setChallengeStatus('success');
    } catch {
      setChallengeVerified(false);
    } finally {
      setVerifyingChallenge(false);
    }
  };

  useEffect(() => {
    void loadLoginChallenge();
  }, []);

  useEffect(() => {
    if (challengeVerified) {
      setChallengeVerified(false);
      setChallengeVerificationToken('');
      setChallengeStatus('idle');
    }
  }, [challengeAnswer]);

  useEffect(() => {
    if (!challengeAnswer.trim() || !challengeId || challengeLoading || challengeVerified) return;

    const timer = setTimeout(() => {
      void handleVerifyChallenge(challengeAnswer);
    }, 250);

    return () => clearTimeout(timer);
  }, [challengeAnswer, challengeId, challengeLoading, challengeVerified]);

  const handleContinue = () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter email address');
      return;
    }

    if (!password || password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Password and re-entered password must match');
      return;
    }

    if (!challengeId || !challengeVerified || !challengeVerificationToken) {
      Alert.alert('Verification Required', 'Please solve and verify the calculation before continuing.');
      return;
    }

    setStep(2);
  };

  const handleSignup = async () => {
    setLoading(true);
    try {
      if (!doctorName.trim()) {
        Alert.alert('Error', 'Please enter doctor name');
        return;
      }

      const primaryWhatsappNumber = whatsappNumbers.find((value) => value.trim())?.trim() || '';

      if (!primaryWhatsappNumber || !specialization.trim() || !registrationNo.trim() || !education.trim() || !documentUrl.trim() || !address.trim()) {
        Alert.alert('Error', 'Please fill all mandatory doctor details');
        return;
      }

      if (!password || password.length < 6) {
        Alert.alert('Error', 'Password must be at least 6 characters');
        return;
      }

      if (password !== confirmPassword) {
        Alert.alert('Error', 'Password and re-entered password must match');
        return;
      }

      if (!challengeId || !challengeVerified || !challengeVerificationToken) {
        Alert.alert('Verification Required', 'Please solve and verify the calculation before signing up.');
        return;
      }

      const response = await doctorSignup({
        email: email.trim(),
        password,
        confirmPassword,
        doctor_name: doctorName.trim(),
        phone: phone.trim(),
        num_clinics: numClinics,
        whatsapp_number: primaryWhatsappNumber,
        whatsapp_numbers: whatsappNumbers.map((value) => value.trim()).filter(Boolean),
        specialization: specialization.trim(),
        registration_no: registrationNo.trim(),
        education: education.trim(),
        document_url: documentUrl.trim(),
        address: address.trim(),
        gst_number: gstNumber.trim(),
        pan_number: panNumber.trim(),
        challengeId,
        challengeVerificationToken,
      });

      if (!response?.review_required) {
        Alert.alert('Error', 'Profile submission failed. Please try again.');
        return;
      }

      Alert.alert('Profile Submitted', 'We will review your profile.', [
        {
          text: 'OK',
          onPress: () => navigation.replace('Login'),
        },
      ]);
    } catch (error: any) {
      const status = error?.response?.status;
      let message = error?.response?.data?.error || 'Signup failed. Please try again.';

      if (status === 400) {
        setChallengeVerified(false);
        await loadLoginChallenge();
      } else if (status === 409) {
        message = error?.response?.data?.error || 'This email is already in use.';
      } else if (status === 500) {
        message = 'Server error. Please try again later.';
      } else if (!status) {
        message = 'Network error. Please check your internet connection.';
      }

      Alert.alert('Signup Failed', message);
    } finally {
      setLoading(false);
    }
  };

  const uploadSignupDocument = async (file: { uri: string; name: string; mimeType: string }) => {
    if (!challengeId || !challengeVerified || !challengeVerificationToken) {
      Alert.alert('Verification Required', 'Please verify the calculation before uploading a document.');
      return;
    }

    if (!allowedDocumentMimeTypes.includes(file.mimeType)) {
      Alert.alert('Unsupported File', 'Only PDF, JPG, PNG, and WEBP files are allowed.');
      return;
    }

    try {
      const uploaded = await uploadDoctorSignupDocument({
        uri: file.uri,
        name: file.name,
        mimeType: file.mimeType,
        challengeId,
        challengeVerificationToken,
      });
      setDocumentUrl(uploaded.url);
      setDocumentMimeType(uploaded.mimeType || file.mimeType);
    } catch (error: any) {
      Alert.alert('Upload Failed', error?.message || 'Unable to upload degree document.');
    } finally {
      setUploadingDocumentSource(null);
    }
  };

  const handleDocumentCamera = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission Required', 'Please allow camera access to capture your degree document.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.85,
    });

    if (result.canceled || !result.assets?.length) return;
    const asset = result.assets[0];
    setUploadingDocumentSource('camera');
    await uploadSignupDocument({
      uri: asset.uri,
      name: asset.fileName || `degree-${Date.now()}.jpg`,
      mimeType: asset.mimeType || 'image/jpeg',
    });
  };

  const handleDocumentFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: allowedDocumentMimeTypes,
      copyToCacheDirectory: true,
      multiple: false,
    });

    if (result.canceled || !result.assets?.length) return;
    const asset = result.assets[0];
    setUploadingDocumentSource('file');
    await uploadSignupDocument({
      uri: asset.uri,
      name: asset.name || `degree-${Date.now()}.pdf`,
      mimeType: asset.mimeType || 'application/pdf',
    });
  };

  const openUploadedDocument = async () => {
    if (!documentUrl) {
      Alert.alert('No Document', 'Please upload your education or degree proof first.');
      return;
    }

    const canOpen = await Linking.canOpenURL(documentUrl);
    if (!canOpen) {
      Alert.alert('Unable to Open', 'This uploaded document cannot be opened on your device.');
      return;
    }

    await Linking.openURL(documentUrl);
  };

  const clearUploadedDocument = () => {
    setDocumentUrl('');
    setDocumentMimeType('');
  };

  const renderInput = (
    label: string,
    value: string,
    onChangeText: (text: string) => void,
    placeholder: string,
    icon?: React.ReactNode,
    keyboardType: 'default' | 'email-address' | 'phone-pad' = 'default'
  ) => (
    <View className="mb-3">
      <Text className="text-base font-bold text-gray-700 mb-2 ml-1">{label}</Text>
      <View className="flex-row items-center bg-white rounded-2xl px-4 border-2 border-gray-200">
        {icon}
        <TextInput
          className="flex-1 px-3 text-base text-slate-800 py-4"
          placeholder={placeholder}
          placeholderTextColor="#9ca3af"
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          autoCapitalize="none"
        />
      </View>
    </View>
  );

  const renderContinueBackButtons = ({
    onBack,
    onContinue,
    continueDisabled,
    continueLabel = 'Continue',
    continueLoading = false,
  }: {
    onBack: () => void;
    onContinue: () => void;
    continueDisabled: boolean;
    continueLabel?: string;
    continueLoading?: boolean;
  }) => (
    <View className="flex-row items-center gap-3 mt-4">
      <TouchableOpacity
        onPress={onBack}
        activeOpacity={0.8}
        className="flex-1 rounded-2xl items-center justify-center py-3.5 bg-gray-100"
      >
        <Text className="text-gray-700 font-bold text-base">Back</Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={onContinue}
        disabled={continueDisabled}
        activeOpacity={0.8}
        className={`flex-1 rounded-2xl items-center justify-center py-3.5 ${
          continueDisabled ? 'bg-blue-300' : 'bg-blue-600'
        }`}
        style={{
          shadowColor: '#1d4ed8',
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.4,
          shadowRadius: 12,
          elevation: 8,
        }}
      >
        {continueLoading ? (
          <View className="flex-row items-center">
            <ActivityIndicator color="#fff" size="small" />
            <Text className="text-white font-bold ml-3 text-base">Creating...</Text>
          </View>
        ) : (
          <View className="flex-row items-center">
            <Text className="text-white font-extrabold mr-2 tracking-wide text-base">{continueLabel}</Text>
            <ArrowRight size={18} color="#fff" />
          </View>
        )}
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['bottom', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor="#1d4ed8" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 24 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          className="bg-gray-50"
        >
          <SafeAreaView edges={['top']} className="bg-blue-700">
            <Animated.View entering={FadeInDown.duration(600).springify()} className="bg-blue-700 px-6 pt-6 pb-10">
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                className="self-start w-10 h-10 rounded-full bg-white/15 items-center justify-center mb-4"
                activeOpacity={0.85}
              >
                <ArrowLeft size={20} color="#ffffff" />
              </TouchableOpacity>

              <View className="rounded-full bg-white items-center justify-center shadow-lg w-20 h-20 mb-4 self-center">
                <Stethoscope size={38} color="#1d4ed8" />
              </View>

              <Text className="text-white font-extrabold tracking-wide mb-1 text-center text-[30px]">
                Doctor Signup
              </Text>
              <Text className="text-blue-200 text-center text-sm">
                Create your doctor account and complete all mandatory profile details
              </Text>
            </Animated.View>
          </SafeAreaView>

          <Animated.View
            entering={FadeInUp.delay(200).duration(500)}
            className="bg-gray-50 px-6 pt-5 pb-4 -mt-6"
            style={{ borderTopLeftRadius: 36, borderTopRightRadius: 36 }}
          >
            <View className="items-center mb-4">
              <Text className="font-extrabold text-slate-800 mb-1 text-[28px]">Create Account</Text>
            </View>

            {step === 1 ? (
              <>
                {renderInput('Email Address', email, setEmail, 'doctor@example.com', <Mail size={20} color="#64748b" />, 'email-address')}

                <View className="mb-3">
                  <Text className="text-base font-bold text-gray-700 mb-2 ml-1">Password</Text>
                  <View className="flex-row items-center bg-white rounded-2xl px-4 border-2 border-gray-200">
                    <Lock size={20} color="#64748b" />
                    <TextInput
                      className="flex-1 px-3 text-base text-slate-800 py-4"
                      placeholder="Enter password"
                      placeholderTextColor="#9ca3af"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={!showPassword}
                    />
                    <TouchableOpacity onPress={() => setShowPassword((prev) => !prev)} className="p-2">
                      {showPassword ? <EyeOff size={22} color="#64748b" /> : <Eye size={22} color="#64748b" />}
                    </TouchableOpacity>
                  </View>
                </View>

                <View className="mb-3">
                  <Text className="text-base font-bold text-gray-700 mb-2 ml-1">Re-enter Password</Text>
                  <View
                    className={`flex-row items-center bg-white rounded-2xl px-4 border-2 ${
                      passwordsMatch ? 'border-emerald-400' : passwordsMismatch ? 'border-red-300' : 'border-gray-200'
                    }`}
                  >
                    <Lock size={20} color="#64748b" />
                    <TextInput
                      className="flex-1 px-3 text-base text-slate-800 py-4"
                      placeholder="Re-enter password"
                      placeholderTextColor="#9ca3af"
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      secureTextEntry={!showConfirmPassword}
                    />
                    <TouchableOpacity onPress={() => setShowConfirmPassword((prev) => !prev)} className="p-2">
                      {showConfirmPassword ? <EyeOff size={22} color="#64748b" /> : <Eye size={22} color="#64748b" />}
                    </TouchableOpacity>
                  </View>
                </View>

                <View className="mb-1">
                  <View className="flex-row items-center justify-between mb-2">
                    <Text className="text-base font-bold text-gray-700 ml-1">Quick Verification</Text>
                    <TouchableOpacity
                      onPress={() => {
                        void loadLoginChallenge();
                      }}
                      disabled={challengeLoading || verifyingChallenge}
                      className="flex-row items-center"
                    >
                      <RefreshCw size={14} color="#2563eb" />
                    </TouchableOpacity>
                  </View>

                  <View className="bg-white border border-blue-100 rounded-2xl px-4 py-2.5 mb-2">
                    <View className="flex-row items-center pl-3">
                      <Calculator size={22} color="#2563eb" />
                      <View className="flex-1 min-w-0 flex-row items-center flex-wrap ml-4">
                        {challengeLoading ? (
                          <Text className="text-slate-800 font-bold text-2xl mr-2 shrink">Loading...</Text>
                        ) : challengeQuestion ? (
                          <>
                            <Text className="text-slate-800 font-bold text-[28px] mr-2 shrink">
                              {challengeQuestion.replace('?', '')}
                            </Text>
                            <TextInput
                              className="bg-white text-center font-bold text-slate-800 ml-2 px-2 rounded-2xl border border-blue-200 shrink-0 text-2xl"
                              placeholder="?"
                              placeholderTextColor="#9ca3af"
                              value={challengeAnswer}
                              onChangeText={setChallengeAnswer}
                              keyboardType="number-pad"
                              maxLength={4}
                              editable={!challengeLoading && !challengeVerified}
                              style={{
                                width: 96,
                                height: 56,
                                textAlign: 'center',
                              }}
                            />
                          </>
                        ) : (
                          <Text className="text-slate-800 font-bold text-2xl mr-2 shrink">Unavailable</Text>
                        )}
                      </View>
                      <View className="ml-3 w-9 h-9 items-center justify-center shrink-0">
                        {verifyingChallenge ? (
                          <ActivityIndicator color="#2563eb" size="small" />
                        ) : challengeStatus === 'success' ? (
                          <Animated.View
                            entering={ZoomIn.duration(220)}
                            className="w-9 h-9 rounded-xl bg-emerald-500 items-center justify-center"
                          >
                            <Check size={18} color="#fff" />
                          </Animated.View>
                        ) : null}
                      </View>
                    </View>
                  </View>
                </View>

                {renderContinueBackButtons({
                  onBack: () => navigation.goBack(),
                  onContinue: handleContinue,
                  continueDisabled: loading || !canContinue,
                })}
              </>
            ) : step === 2 ? (
              <>
                {renderInput('Doctor Name', doctorName, setDoctorName, 'Dr. Your Name', <User size={20} color="#64748b" />)}
                {renderInput('Appointment Phone Number', phone, setPhone, '+91 9876543210', <User size={20} color="#64748b" />, 'phone-pad')}

                {renderContinueBackButtons({
                  onBack: () => setStep(1),
                  onContinue: () => setStep(3),
                  continueDisabled: !canContinueStep2,
                })}
              </>
            ) : step === 3 ? (
              <>
                <View className="mb-3">
                  <Text className="text-base font-bold text-gray-700 mb-2 ml-1">WhatsApp Number</Text>
                  {whatsappNumbers.map((value, index) => (
                    <View key={index} className="mb-2 flex-row items-center">
                      <View className="flex-1 flex-row items-center bg-white rounded-2xl px-4 border-2 border-gray-200">
                        <User size={20} color="#64748b" />
                        <TextInput
                          className="flex-1 px-3 text-base text-slate-800 py-4"
                          placeholder="+91 9876543210"
                          placeholderTextColor="#9ca3af"
                          value={value}
                          onChangeText={(text) => {
                            setWhatsappNumbers((prev) => prev.map((item, itemIndex) => (itemIndex === index ? text : item)));
                          }}
                          keyboardType="phone-pad"
                        />
                      </View>
                      {whatsappNumbers.length > 1 ? (
                        <TouchableOpacity
                          onPress={() => {
                            setWhatsappNumbers((prev) => prev.filter((_, itemIndex) => itemIndex !== index));
                          }}
                          className="ml-2 px-3 py-3 rounded-2xl bg-red-50"
                          activeOpacity={0.8}
                        >
                          <Text className="text-red-500 font-semibold">Remove</Text>
                        </TouchableOpacity>
                      ) : null}
                    </View>
                  ))}

                  <TouchableOpacity
                    onPress={() => setWhatsappNumbers((prev) => [...prev, ''])}
                    className="mt-2 self-start rounded-2xl bg-blue-50 px-4 py-2.5"
                    activeOpacity={0.8}
                  >
                    <Text className="text-blue-600 font-semibold">Add another WhatsApp number</Text>
                  </TouchableOpacity>
                </View>

                <View className="mb-3">
                  <View className="mb-2 ml-1 flex-row items-center justify-between">
                    <Text className="text-base font-bold text-gray-700">Number of Clinics</Text>
                    <Text className="text-[11px] text-gray-500">You can change it later.</Text>
                  </View>
                  <View className="flex-row items-center justify-between bg-white rounded-xl px-3.5 py-2 border-2 border-gray-200">
                    <View className="flex-1 pr-2">
                      <Text className="text-slate-800 text-lg font-bold">{numClinics}</Text>
                    </View>
                    <View className="rounded-xl overflow-hidden border border-gray-200">
                      <TouchableOpacity
                        onPress={() => setNumClinics((prev) => Math.min(prev + 1, 99))}
                        className="w-9 h-7 bg-gray-50 items-center justify-center"
                        activeOpacity={0.8}
                      >
                        <ChevronUp size={16} color="#475569" />
                      </TouchableOpacity>
                      <View className="h-px bg-gray-200" />
                      <TouchableOpacity
                        onPress={() => setNumClinics((prev) => Math.max(prev - 1, 0))}
                        className="w-9 h-7 bg-gray-50 items-center justify-center"
                        activeOpacity={0.8}
                      >
                        <ChevronDown size={16} color="#475569" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>

                {renderContinueBackButtons({
                  onBack: () => setStep(2),
                  onContinue: () => setStep(4),
                  continueDisabled: !canContinueStep3,
                })}
              </>
            ) : step === 4 ? (
              <>
                {renderInput('Specialization', specialization, setSpecialization, 'Cardiology')}
                {renderInput('Registration Number', registrationNo, setRegistrationNo, 'Medical registration number')}
                {renderInput('Education', education, setEducation, 'MBBS, MD')}

                <View className="mb-4 overflow-hidden rounded-[26px] border border-blue-100 bg-white">
                  <View className="bg-blue-600 px-4 py-3">
                    <Text className="text-white text-base font-extrabold">Education / Degree Proof</Text>
                    <Text className="mt-1 text-xs text-blue-100">
                      Upload a clear image or PDF of your degree certificate before continuing.
                    </Text>
                  </View>

                  <View className="px-4 py-4">
                    <View className="rounded-2xl border border-dashed border-blue-200 bg-blue-50 px-4 py-4">
                      <View className="flex-row items-start">
                        <View className="mr-3 mt-0.5 h-11 w-11 items-center justify-center rounded-2xl bg-white">
                          <FileText size={20} color="#2563eb" />
                        </View>
                        <View className="flex-1">
                          <Text className="text-base font-bold text-slate-800">
                            {documentUrl ? 'Document uploaded successfully' : 'Upload your supporting document'}
                          </Text>
                          <Text className="mt-1 text-xs leading-5 text-slate-500">
                            {documentUrl
                              ? 'Your education proof is attached and ready for submission.'
                              : 'Accepted formats: PDF, JPG, PNG, WEBP. Maximum size: 10 MB.'}
                          </Text>
                          {documentUrl ? (
                            <Text className="mt-2 text-[11px] font-semibold text-blue-700">
                              {documentMimeType ? documentMimeType.toUpperCase() : 'DOCUMENT READY'}
                            </Text>
                          ) : null}
                        </View>
                        {documentUrl ? (
                          <TouchableOpacity
                            onPress={clearUploadedDocument}
                            activeOpacity={0.85}
                            className="ml-3 h-8 w-8 items-center justify-center rounded-full bg-white"
                          >
                            <X size={14} color="#64748b" />
                          </TouchableOpacity>
                        ) : null}
                      </View>

                      <View className="mt-4 flex-row items-center gap-3">
                        <TouchableOpacity
                          onPress={() => {
                            void handleDocumentCamera();
                          }}
                          disabled={uploadingDocumentSource !== null}
                          activeOpacity={0.85}
                          className="flex-1 flex-row items-center justify-center rounded-2xl bg-white py-3"
                        >
                          {uploadingDocumentSource === 'camera' ? <ActivityIndicator size="small" color="#2563eb" /> : <Camera size={16} color="#2563eb" />}
                          <Text className="ml-2 text-sm font-bold text-blue-700">Camera</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={() => {
                            void handleDocumentFile();
                          }}
                          disabled={uploadingDocumentSource !== null}
                          activeOpacity={0.85}
                          className="flex-1 flex-row items-center justify-center rounded-2xl bg-blue-600 py-3"
                        >
                          {uploadingDocumentSource === 'file' ? <ActivityIndicator size="small" color="#ffffff" /> : <Upload size={16} color="#ffffff" />}
                          <Text className="ml-2 text-sm font-bold text-white">Files</Text>
                        </TouchableOpacity>
                      </View>

                      {documentUrl ? (
                        <TouchableOpacity
                          onPress={() => {
                            void openUploadedDocument();
                          }}
                          activeOpacity={0.85}
                          className="mt-3 items-center rounded-2xl border border-blue-200 bg-white py-3"
                        >
                          <Text className="text-sm font-semibold text-blue-700">Open uploaded document</Text>
                        </TouchableOpacity>
                      ) : null}
                    </View>
                  </View>
                </View>

                {renderContinueBackButtons({
                  onBack: () => setStep(3),
                  onContinue: () => setStep(5),
                  continueDisabled: !canContinueStep4,
                })}
              </>
            ) : (
              <>
                {renderInput('Address', address, setAddress, 'Clinic or residence address')}
                {renderInput('PAN Number (Optional)', panNumber, setPanNumber, 'ABCDE1234F')}

                {renderContinueBackButtons({
                  onBack: () => setStep(4),
                  onContinue: handleSignup,
                  continueDisabled: loading || !canSubmit,
                  continueLabel: 'Submit Your Profile',
                  continueLoading: loading,
                })}
              </>
            )}

            <TouchableOpacity onPress={() => navigation.replace('Login')} className="mt-4 self-center" activeOpacity={0.8}>
              <Text className="text-blue-600 font-semibold">Already have an account? Sign in</Text>
            </TouchableOpacity>

            <View className="px-4 mt-3">
              <View className="flex-row items-center justify-center">
                <ShieldCheck size={14} color="#9ca3af" />
                <Text className="text-xs text-gray-400 text-center ml-2">
                  Your session is encrypted and secure.
                </Text>
              </View>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
