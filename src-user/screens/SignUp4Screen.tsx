import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import {
  Alert,
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
import { auth, db } from '../firebase';
import { RootStackParamList } from '../navigation/AppNavigator';
import { setAuthToken } from '../services/authStore';
import { getPendingProfile } from '../services/signupStore';
import colors from '../theme/colors';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const SignUp4Screen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [loading, setLoading] = useState(false);
  const [pendingProfile, setPendingProfileState] = useState(getPendingProfile());

  useEffect(() => {
    const profile = getPendingProfile();
    if (!profile || !profile.password) {
      navigation.navigate('SignUp');
      return;
    }
    setPendingProfileState(profile);
  }, [navigation]);

  const handleSubmit = async () => {
    if (!pendingProfile || !pendingProfile.password) {
      Alert.alert('ข้อผิดพลาด', 'ไม่พบข้อมูลการสมัคร กรุณาเริ่มใหม่');
      navigation.navigate('SignUp');
      return;
    }

    setLoading(true);

    try {
      // สร้างบัญชีด้วย Firebase Authentication
      const userCredential = await auth.createUserWithEmailAndPassword(pendingProfile.email || '', pendingProfile.password);
      const user = userCredential.user;

      // บันทึกข้อมูลผู้ใช้ลง Firestore
      await db.collection('users').doc(user!.uid).set({
        email: pendingProfile.email || '',
        fullName: pendingProfile.fullName || '',
        idCard: pendingProfile.idCard || '',
        phone: pendingProfile.phone || '',
        birthDate: pendingProfile.birthDate || '',
        gender: pendingProfile.gender || '',
        occupation: pendingProfile.occupation || '',
        address: pendingProfile.address || '',
        profileImage: pendingProfile.profileImage || '',
        statusApp: pendingProfile.statusApp || 'user',
        createdAt: new Date().toISOString(),
      });

      // เก็บ UID เป็น token สำหรับ session
      setAuthToken(user!.uid);

      Alert.alert('สำเร็จ', 'สร้างบัญชีเรียบร้อยแล้ว', [
        {
          text: 'ตกลง',
          onPress: () => navigation.navigate('SignUpPin', { mode: 'set' })
        },
      ]);
    } catch (error: any) {
      console.log('[FIREBASE_SIGNUP_ERROR]', error);
      let errorMessage = 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง';
      
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'อีเมลนี้ถูกใช้งานแล้ว';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'รูปแบบอีเมลไม่ถูกต้อง';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'รหัสผ่านไม่ปลอดภัยเพียงพอ';
      }
      
      Alert.alert('ไม่สามารถสร้างบัญชีได้', errorMessage);
    } finally {
      setLoading(false);
    }
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
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>ยืนยันข้อมูลและสร้างบัญชี</Text>
            <Text style={styles.subtitle}>กรุณาตรวจสอบข้อมูลก่อนสร้างบัญชี</Text>
          </View>

          <View style={styles.form}>
            {pendingProfile ? (
              <View style={styles.profileInfo}>
                <Text style={styles.infoLabel}>อีเมล</Text>
                <Text style={styles.infoValue}>{pendingProfile.email}</Text>
                <Text style={styles.infoLabel}>ชื่อ-นามสกุล</Text>
                <Text style={styles.infoValue}>{pendingProfile.fullName}</Text>
                <Text style={styles.infoLabel}>เลขบัตรประชาชน</Text>
                <Text style={styles.infoValue}>{pendingProfile.idCard}</Text>
                <Text style={styles.infoLabel}>เบอร์โทร</Text>
                <Text style={styles.infoValue}>{pendingProfile.phone}</Text>
                <Text style={styles.infoLabel}>วันเกิด</Text>
                <Text style={styles.infoValue}>{pendingProfile.birthDate}</Text>
                <Text style={styles.infoLabel}>เพศ</Text>
                <Text style={styles.infoValue}>
                  {pendingProfile.gender === 'male' ? 'ชาย' : 
                   pendingProfile.gender === 'female' ? 'หญิง' : 
                   pendingProfile.gender === 'other' ? 'อื่นๆ' : ''}
                </Text>
                <Text style={styles.infoLabel}>อาชีพ</Text>
                <Text style={styles.infoValue}>{pendingProfile.occupation || '-'}</Text>
                <Text style={styles.infoLabel}>ที่อยู่</Text>
                <Text style={styles.infoValue}>{pendingProfile.address || '-'}</Text>
                
              </View>
            ) : null}

            <Text style={styles.disclaimer}>
              กรุณาตรวจสอบข้อมูลและกดปุ่มด้านล่างเพื่อสร้างบัญชีและตั้ง PIN
            </Text>

            <Button onPress={handleSubmit} style={styles.submitButton} loading={loading} disabled={loading}>
              ยืนยันและสร้างบัญชี
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
    paddingTop: 20,
    paddingBottom: 32,
  },
  titleContainer: {
    marginBottom: 15,
  },
  title: {
    fontFamily: 'Prompt_700Bold',

    fontSize: 24,
    fontWeight: 'bold',
    color: colors.gray800,
    marginBottom: 1,
  },
  subtitle: {
    fontFamily: 'Prompt_400Regular',

    fontSize: 14,
    color: colors.gray500,
  },
  form: {
    gap: 8,
  },
  disclaimer: {
    fontFamily: 'Prompt_400Regular',
    fontSize: 14,
    color: colors.gray600,
    marginTop: 8,
    marginBottom: 12,
  },
  submitButton: {
    borderRadius: 8,
    marginBottom: 40,
  },
  profileInfo: {
    marginBottom: 15,
    padding: 5,
    backgroundColor: colors.card,
    borderRadius: 12,
  },
  infoLabel: {
    fontFamily: 'Prompt_500Medium',
    fontSize: 14,
    color: colors.foreground,
    marginBottom: 4,
  },
  infoValue: {
    fontFamily: 'Prompt_400Regular',
    fontSize: 16,
    color: colors.gray800,
    marginBottom: 12,
  },
});

export default SignUp4Screen;
