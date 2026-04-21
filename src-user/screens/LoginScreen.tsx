import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as SecureStore from 'expo-secure-store';
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
import Input from '../components/ui/input';
import { auth, db } from '../firebase';
import { RootStackParamList } from '../navigation/AppNavigator';
import { setAuthToken } from '../services/authStore';
import colors from '../theme/colors';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

let GoogleSignin: any = null;
let statusCodes: any = null;

// Temporarily disabled to avoid Google Sign-In runtime errors.
// To re-enable, restore the require block below and the related code.
//// try {
////   const googleSignInModule = require('@react-native-google-signin/google-signin');
////   GoogleSignin = googleSignInModule.GoogleSignin;
////   statusCodes = googleSignInModule.statusCodes;
//// } catch (e) {
////   console.log('[GOOGLE_SIGNIN] Native module not available in Expo Go');
//// }


const LoginScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleAvailable, setGoogleAvailable] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);

  useEffect(() => {
    // Google Sign-In disabled for now to prevent errors.
  }, []);

  const handleSubmit = async () => {
    if (!formData.email || !formData.password) {
      Alert.alert('กรุณากรอกข้อมูล', 'กรุณากรอกอีเมลและรหัสผ่าน');
      return;
    }

    if (loading) return;

    try {
      setLoading(true);

      console.log('[FIREBASE_LOGIN_SUBMIT]', {
        email: formData.email,
        time: new Date().toISOString(),
      });

      // เข้าสู่ระบบด้วย Firebase Authentication
      const userCredential = await auth.signInWithEmailAndPassword(formData.email, formData.password);
      const user = userCredential.user;

      // ตรวจสอบข้อมูล user จากฐานข้อมูล
      const userDoc = await db.collection('users').doc(user!.uid).get();
      if (!userDoc.exists) {
        throw new Error('USER_NOT_FOUND');
      }

      const userData = userDoc.data();
      if (userData?.statusApp !== 'user') {
        throw new Error('INVALID_USER_STATUS');
      }

      // เก็บ UID เป็น session token
      setAuthToken(user!.uid);

      // จัดการ Remember Me
      if (rememberMe) {
        await SecureStore.setItemAsync('rememberMe', 'true');
      } else {
        await SecureStore.deleteItemAsync('rememberMe');
      }

      console.log('[FIREBASE_LOGIN_SUCCESS]', {
        email: formData.email,
        uid: user!.uid,
        time: new Date().toISOString(),
      });

      Alert.alert('เข้าสู่ระบบสำเร็จ', '', [
        {
          text: 'ตกลง',
          onPress: () => navigation.navigate('SignUpPin', { mode: 'verify' }),
        },
      ]);
    } catch (error: any) {
      console.log('[FIREBASE_LOGIN_ERROR]', {
        email: formData.email,
        error: error.code,
        time: new Date().toISOString(),
      });

      let errorMessage = 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง';

      if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
        errorMessage = 'อีเมลหรือรหัสผ่านไม่ถูกต้อง\nกรุณาตรวจสอบข้อมูลและลองใหม่อีกครั้ง';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'รูปแบบอีเมลไม่ถูกต้อง';
      } else if (error.code === 'auth/user-disabled') {
        errorMessage = 'บัญชีนี้ถูกระงับการใช้งาน';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'มีการพยายามเข้าสู่ระบบมากเกินไป กรุณารอสักครู่';
      } else if (error.message === 'USER_NOT_FOUND') {
        errorMessage = 'ไม่พบข้อมูลผู้ใช้ในฐานข้อมูล';
      } else if (error.message === 'INVALID_USER_STATUS') {
        errorMessage = 'บัญชีผู้ใช้ไม่ได้รับอนุญาตให้เข้าสู่ระบบ';
      }

      Alert.alert('เข้าสู่ระบบไม่สำเร็จ', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    // Temporarily disabled to avoid errors
    Alert.alert('ปิดใช้งานชั่วคราว', 'การเข้าสู่ระบบด้วย Google ถูกปิดใช้งานชั่วคราว โปรดใช้การเข้าสู่ระบบด้วยอีเมลและรหัสผ่าน');
    return;
  };

  const handleForgotPassword = () => {
    Alert.prompt(
      'ลืมรหัสผ่าน',
      'กรุณากรอกอีเมลของคุณเพื่อรับลิงก์รีเซ็ตรหัสผ่าน',
      [
        {
          text: 'ยกเลิก',
          style: 'cancel',
        },
        {
          text: 'ส่ง',
          onPress: (email?: string) => {
            if (!email) {
              Alert.alert('ข้อผิดพลาด', 'กรุณากรอกอีเมล');
              return;
            }
            auth.sendPasswordResetEmail(email).then(() => {
              Alert.alert('สำเร็จ', 'ส่งลิงก์รีเซ็ตรหัสผ่านไปยังอีเมลของคุณแล้ว');
            }).catch((error) => {
              if (error.code === 'auth/user-not-found') {
                Alert.alert('ข้อผิดพลาด', 'ไม่พบอีเมลนี้ในระบบ');
              } else {
                Alert.alert('ข้อผิดพลาด', 'ไม่สามารถส่งอีเมลได้ กรุณาลองใหม่อีกครั้ง');
              }
            });
          },
        },
      ],
      'plain-text'
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>เข้าสู่ระบบ</Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>เข้าสู่ระบบบัญชีของคุณ</Text>
            <Text style={styles.subtitle}>กรอกข้อมูลเพื่อเข้าสู่ระบบ</Text>
          </View>

          <View style={styles.form}>
            <Input
              label="อีเมล"
              placeholder="กรอกอีเมลของคุณ"
              value={formData.email}
              onChangeText={(text) => setFormData({ ...formData, email: text })}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <View style={styles.passwordInputWrapper}>
              <Input
                label="รหัสผ่าน"
                placeholder="กรอกรหัสผ่านของคุณ"
                value={formData.password}
                onChangeText={(text) => setFormData({ ...formData, password: text })}
                secureTextEntry={!passwordVisible}
                style={styles.passwordInput}
              />
              <TouchableOpacity
                style={styles.passwordToggle}
                onPress={() => setPasswordVisible(!passwordVisible)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={passwordVisible ? 'eye' : 'eye-off'}
                  size={20}
                  color={colors.mutedForeground}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.rememberMeContainer}>
              <TouchableOpacity
                onPress={() => setRememberMe(!rememberMe)}
                style={styles.checkbox}
              >
                <Ionicons
                  name={rememberMe ? 'checkbox' : 'square-outline'}
                  size={20}
                  color={rememberMe ? colors.primary : colors.gray400}
                />
              </TouchableOpacity>
              <Text style={styles.rememberMeText}>จดจำฉัน</Text>
              <View style={styles.spacer} />
              <TouchableOpacity style={styles.forgotPassword} onPress={handleForgotPassword}>
                <Text style={styles.forgotPasswordText}>ลืมรหัสผ่าน</Text>
              </TouchableOpacity>
            </View>

            <Button onPress={handleSubmit} style={styles.submitButton} loading={loading} disabled={loading}>
              เข้าสู่ระบบ
            </Button>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>หรือ</Text>
              <View style={styles.dividerLine} />
            </View>



            <View style={styles.signupContainer}>
              <Text style={styles.signupText}>ยังไม่มีบัญชี? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
                <Text style={styles.signupLink}>ลงทะเบียน</Text>
              </TouchableOpacity>
            </View>
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
  },
  titleContainer: {
    marginBottom: 32,
  },
  title: {
    fontFamily: 'Prompt_700Bold',
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.gray800,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: 'Prompt_400Regular',
    fontSize: 14,
    color: colors.gray500,
  },
  passwordInputWrapper: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 48,
  },
  passwordToggle: {
    position: 'absolute',
    right: 10,
    top: '50%',
    transform: [{ translateY: -10 }], // ครึ่งหนึ่งของ height (32/2)
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  form: {
    gap: 8,
  },
  rememberMeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  checkbox: {
    marginRight: 8,
  },
  rememberMeText: {
    fontFamily: 'Prompt_400Regular',
    fontSize: 14,
    color: colors.gray600,
  },
  spacer: {
    flex: 1,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
  },
  forgotPasswordText: {
    fontFamily: 'Prompt_400Regular',
    fontSize: 14,
    color: colors.primary,
  },
  submitButton: {
    marginTop: 8,
    borderRadius: 8,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.gray300,
  },
  dividerText: {
    fontFamily: 'Prompt_400Regular',
    paddingHorizontal: 16,
    color: colors.gray500,
    fontSize: 14,
  },
  googleButton: {
    borderRadius: 8,
    borderColor: colors.gray300,
  },
  googleButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  googleButtonText: {
    fontFamily: 'Prompt_400Regular',
    fontSize: 16,
    color: colors.gray700,
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
    marginBottom: 32,
  },
  signupText: {
    fontFamily: 'Prompt_400Regular',
    fontSize: 14,
    color: colors.gray600,
  },
  signupLink: {
    fontFamily: 'Prompt_500Medium',
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
  },
});

export default LoginScreen;
