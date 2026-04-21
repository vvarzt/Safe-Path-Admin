import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../components/ui/button';
import Input from '../components/ui/input';
import { RootStackParamList } from '../navigation/AppNavigator';
import { setPendingProfile } from '../services/signupStore';
import colors from '../theme/colors';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const SignUpScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    fullName: '',
    idCard: '',
    phone: '',
    birthDate: '',
    gender: '',
    occupation: '',
    address: '',
  });

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handlePhoneChange = (value: string) => {
    const sanitized = value.replace(/[^0-9]/g, '');
    if (sanitized !== formData.phone) {
      setOtpSent(false);
      setOtpVerified(false);
      setOtp('');
      setOtpInput('');
      setOtpError('');
    }
    handleChange('phone', sanitized);
  };

  const openImageOptions = () => {
    Alert.alert('เลือกรูปโปรไฟล์', undefined, [
      {
        text: 'ถ่ายรูป',
        onPress: takePhoto,
      },
      {
        text: 'เลือกจากคลัง',
        onPress: selectFromGallery,
      },
      {
        text: 'ยกเลิก',
        style: 'cancel',
      },
    ]);
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('ข้อผิดพลาด', 'ต้องอนุญาตให้เข้าถึงกล้อง');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled && result.assets.length > 0) {
        setProfileImage(result.assets[0].uri);
      }
    } catch (error) {
      console.log('[CAMERA_ERROR]', error);
      Alert.alert('ข้อผิดพลาด', 'ไม่สามารถเปิดกล้องได้');
    }
  };

  const selectFromGallery = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('ข้อผิดพลาด', 'ต้องอนุญาตให้เข้าถึงคลังภาพ');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled && result.assets.length > 0) {
        setProfileImage(result.assets[0].uri);
      }
    } catch (error) {
      console.log('[IMAGE_PICK_ERROR]', error);
      Alert.alert('ข้อผิดพลาด', 'ไม่สามารถเลือกภาพจากคลังได้');
    }
  };

  const formatDate = (date: Date) => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const onChangeBirthDate = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (event.type === 'set' && selectedDate) {
      handleChange('birthDate', formatDate(selectedDate));
    }
  };

  const confirmDateSelection = () => {
    setShowDatePicker(false);
  };

  const sendOtp = () => {
    if (!/^[0-9]{10}$/.test(formData.phone)) {
      Alert.alert('เบอร์โทรไม่ถูกต้อง', 'กรุณากรอกเบอร์โทร 10 หลักก่อนส่ง OTP');
      return;
    }

    const generatedCode = Math.floor(100000 + Math.random() * 900000).toString();
    setOtp(generatedCode);
    setOtpSent(true);
    setOtpVerified(false);
    setOtpInput('');
    setOtpError('');

    Alert.alert('ส่งรหัส OTP แล้ว', `รหัส OTP ของคุณคือ ${generatedCode}`);
  };

  const verifyOtp = () => {
    if (otpInput !== otp) {
      setOtpError('รหัส OTP ไม่ถูกต้อง');
      return;
    }

    setOtpVerified(true);
    setOtpError('');
    Alert.alert('ยืนยันแล้ว', 'เบอร์โทรของคุณได้รับการยืนยัน');
  };

  const validateForm = () => {
    const {
      email,
      fullName,
      idCard,
      phone,
      birthDate,
      gender,
    } = formData;

    if (!email || !fullName || !idCard || !phone || !birthDate || !gender) {
      Alert.alert('กรุณากรอกข้อมูล', 'โปรดกรอกข้อมูลที่จำเป็นทั้งหมด');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('อีเมลไม่ถูกต้อง', 'โปรดตรวจสอบรูปแบบอีเมล');
      return false;
    }

    if (!/^\d{13}$/.test(idCard)) {
      Alert.alert('เลขบัตรประชาชนไม่ถูกต้อง', 'เลขบัตรประชาชนต้องเป็นตัวเลข 13 หลัก');
      return false;
    }

    if (!/^\d{10}$/.test(phone)) {
      Alert.alert('เบอร์โทรไม่ถูกต้อง', 'เบอร์โทรต้องเป็นตัวเลข 10 หลัก');
      return false;
    }

    if (!otpVerified) {
      Alert.alert('ยืนยันเบอร์โทร', 'โปรดยืนยันรหัส OTP ที่ส่งไปยังเบอร์โทรของคุณ');
      return false;
    }

    return true;
  };

  const handleSubmit = () => {
    if (!validateForm()) {
      return;
    }

    setPendingProfile({
      ...formData,
      profileImage: profileImage || undefined,
      phoneVerified: otpVerified,
      statusApp: 'user',
    });
    navigation.navigate('SignUp2');
  };

  const getPickerDate = () => {
    const parts = formData.birthDate.split('/');
    if (parts.length === 3) {
      const day = Number(parts[0]);
      const month = Number(parts[1]);
      const year = Number(parts[2]);
      if (!Number.isNaN(day) && !Number.isNaN(month) && !Number.isNaN(year)) {
        return new Date(year, month - 1, day);
      }
    }
    return new Date();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>สร้างบัญชี</Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
        style={styles.keyboardView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 80}
      >
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
          scrollEventThrottle={16}
        >
          <View style={styles.titleContainer}>
            <Text style={styles.title}>สร้างบัญชีใหม่</Text>
            <Text style={styles.subtitle}>เพิ่มรูปโปรไฟล์แล้วกรอกข้อมูลส่วนตัวให้ครบถ้วน</Text>
          </View>

          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              {profileImage ? (
                <Image source={{ uri: profileImage }} style={styles.avatarImage} />
              ) : (
                <Ionicons name="person" size={48} color={colors.gray400} />
              )}
            </View>
            <TouchableOpacity style={styles.cameraButton} onPress={openImageOptions}>
              <Ionicons name="camera" size={18} color={colors.white} />
            </TouchableOpacity>
          </View>

          <View style={styles.form}>
            <Input
              label="อีเมล"
              placeholder="กรอกอีเมลของคุณ"
              value={formData.email}
              onChangeText={(text) => handleChange('email', text)}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Input
              label="ชื่อ-นามสกุล"
              placeholder="กรอกชื่อ-นามสกุลของคุณ"
              value={formData.fullName}
              onChangeText={(text) => handleChange('fullName', text)}
            />

            <Input
              label="เลขบัตรประชาชน"
              placeholder="ตัวเลข 13 หลัก"
              value={formData.idCard}
              onChangeText={(text) => handleChange('idCard', text)}
              keyboardType="numeric"
              maxLength={13}
            />

            <Input
              label="เบอร์โทร"
              placeholder="ตัวเลข 10 หลัก"
              value={formData.phone}
              onChangeText={handlePhoneChange}
              keyboardType="phone-pad"
              maxLength={10}
            />

            {formData.phone.length === 10 && !otpSent && (
              <Button onPress={sendOtp} style={styles.otpButton}>
                ส่งรหัส OTP
              </Button>
            )}

            {otpSent && !otpVerified && (
              <>
                <Input
                  label="รหัส OTP"
                  placeholder="กรอกรหัส OTP"
                  value={otpInput}
                  onChangeText={(text) => {
                    setOtpInput(text.replace(/[^0-9]/g, ''));
                    setOtpError('');
                  }}
                  keyboardType="numeric"
                  maxLength={6}
                />
                {otpError ? <Text style={styles.otpError}>{otpError}</Text> : null}
                <Button onPress={verifyOtp} style={styles.otpButton}>
                  ยืนยัน OTP
                </Button>
              </>
            )}

            {otpVerified && (
              <Text style={styles.otpSuccess}>ยืนยันเบอร์โทรเรียบร้อยแล้ว</Text>
            )}

            <Input
              label="วัน/เดือน/ปีเกิด"
              placeholder="เลือกวัน/เดือน/ปีเกิด"
              value={formData.birthDate}
              editable={false}
              onTouchStart={() => setShowDatePicker(true)}
            />

            {showDatePicker && (
              <>
                <DateTimePicker
                  value={getPickerDate()}
                  mode="date"
                  display="inline"
                  maximumDate={new Date()}
                  onChange={onChangeBirthDate}
                />
                <Button onPress={confirmDateSelection} style={styles.dateConfirmButton}>
                  ตกลง
                </Button>
              </>
            )}

            <View style={styles.genderContainer}>
              <Text style={styles.genderLabel}>เพศ</Text>
              <View style={styles.genderOptions}>
                <TouchableOpacity
                  style={[
                    styles.genderOption,
                    formData.gender === 'male' && styles.genderOptionSelected,
                  ]}
                  onPress={() => handleChange('gender', 'male')}
                >
                  <View style={[styles.radio, formData.gender === 'male' && styles.radioSelected]}>
                    {formData.gender === 'male' && <View style={styles.radioInner} />}
                  </View>
                  <Text style={styles.genderText}>ชาย</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.genderOption,
                    formData.gender === 'female' && styles.genderOptionSelected,
                  ]}
                  onPress={() => handleChange('gender', 'female')}
                >
                  <View style={[styles.radio, formData.gender === 'female' && styles.radioSelected]}>
                    {formData.gender === 'female' && <View style={styles.radioInner} />}
                  </View>
                  <Text style={styles.genderText}>หญิง</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.genderOption,
                    formData.gender === 'other' && styles.genderOptionSelected,
                  ]}
                  onPress={() => handleChange('gender', 'other')}
                >
                  <View style={[styles.radio, formData.gender === 'other' && styles.radioSelected]}>
                    {formData.gender === 'other' && <View style={styles.radioInner} />}
                  </View>
                  <Text style={styles.genderText}>อื่นๆ</Text>
                </TouchableOpacity>
              </View>
            </View>

            <Input
              label="อาชีพ"
              placeholder="กรอกอาชีพของคุณ"
              value={formData.occupation}
              onChangeText={(text) => handleChange('occupation', text)}
            />

            <Input
              label="ที่อยู่ปัจจุบัน"
              placeholder="กรอกที่อยู่ปัจจุบัน"
              value={formData.address}
              onChangeText={(text) => handleChange('address', text)}
            />

            <Text style={styles.disclaimer}>
              เลขบัตรประชาชนต้องเป็นตัวเลข 13 หลัก และเบอร์โทรต้องเป็นตัวเลข 10 หลัก
            </Text>

            <Button onPress={handleSubmit} style={styles.submitButton}>
              ถัดไป
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontFamily: 'Prompt_600SemiBold',
    fontSize: 20,
    fontWeight: '600',
    color: colors.white,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 100,
  },
  titleContainer: {
    marginBottom: 24,
  },
  title: {
    fontFamily: 'Prompt_700Bold',
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.gray800,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: 'Prompt_400Regular',
    fontSize: 14,
    color: colors.gray600,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.gray200,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: '35%',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  form: {
    gap: 12,
  },
  genderContainer: {
    marginBottom: 16,
  },
  genderLabel: {
    fontFamily: 'Prompt_500Medium',
    fontSize: 14,
    fontWeight: '500',
    color: colors.foreground,
    marginBottom: 8,
  },
  genderOptions: {
    flexDirection: 'row',
    gap: 24,
  },
  genderOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  genderOptionSelected: {},
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.gray300,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: colors.primary,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  genderText: {
    fontFamily: 'Prompt_400Regular',
    fontSize: 16,
    color: colors.foreground,
  },
  otpButton: {
    borderRadius: 8,
    marginTop: 8,
  },
  otpError: {
    fontFamily: 'Prompt_400Regular',
    fontSize: 14,
    color: colors.destructive,
    marginTop: 8,
    marginBottom: 8,
  },
  otpSuccess: {
    fontFamily: 'Prompt_400Regular',
    fontSize: 14,
    color: colors.primary,
    marginTop: 8,
    marginBottom: 8,
  },
  disclaimer: {
    fontFamily: 'Prompt_400Regular',
    fontSize: 14,
    color: colors.gray600,
    marginTop: 8,
    marginBottom: 15,
  },
  submitButton: {
    borderRadius: 8,
    marginBottom: 20,
  },
  dateConfirmButton: {
    borderRadius: 8,
    marginTop: 8,
    marginBottom: 8,
  },
});

export default SignUpScreen;
