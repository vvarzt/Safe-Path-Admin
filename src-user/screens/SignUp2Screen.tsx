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
import Input from '../components/ui/input';
import { RootStackParamList } from '../navigation/AppNavigator';
import { getPendingProfile, setPendingProfile } from '../services/signupStore';
import colors from '../theme/colors';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const SignUp2Screen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [pendingProfile, setPendingProfileState] = useState(getPendingProfile());

  useEffect(() => {
    const profile = getPendingProfile();
    if (!profile) {
      navigation.navigate('SignUp');
      return;
    }
    setPendingProfileState(profile);
  }, [navigation]);

  const validatePasswords = () => {
    if (!password || !confirmPassword) {
      Alert.alert('กรุณากรอกข้อมูล', 'โปรดกรอกรหัสผ่านและยืนยันรหัสผ่าน');
      return false;
    }

    if (password.length < 6) {
      Alert.alert('รหัสผ่านสั้นเกินไป', 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
      return false;
    }

    if (password !== confirmPassword) {
      Alert.alert('รหัสผ่านไม่ตรงกัน', 'โปรดยืนยันรหัสผ่านให้ตรงกัน');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!pendingProfile) {
      Alert.alert('ข้อผิดพลาด', 'ไม่พบข้อมูลการสมัคร กรุณากรอกข้อมูลใหม่');
      navigation.navigate('SignUp');
      return;
    }

    if (!validatePasswords()) {
      return;
    }

    setLoading(true);

    try {
      // บันทึก password ไว้ใน pending profile
      setPendingProfile({
        ...pendingProfile,
        password: password,
      });

      // นำทางไปหน้าถัดไป
      navigation.navigate('SignUp4');
    } catch (error) {
      console.log('[PASSWORD_SETUP_ERROR]', error);
      Alert.alert('ข้อผิดพลาด', 'ไม่สามารถบันทึกรหัสผ่านได้');
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
        <Text style={styles.headerTitle}>ตั้งรหัสผ่าน</Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 40}
      >
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="interactive"
          scrollEventThrottle={16}
        >
          <View style={styles.titleContainer}>
            <Text style={styles.title}>กรอกรหัสผ่าน</Text>
            <Text style={styles.subtitle}>ตั้งรหัสผ่านเพื่อเข้าใช้งานบัญชีของคุณ</Text>
          </View>

          {pendingProfile ? (
            <View style={styles.profileInfo}>
              <Text style={styles.infoLabel}>อีเมล</Text>
              <Text style={styles.infoValue}>{pendingProfile.email}</Text>
              <Text style={styles.infoLabel}>เบอร์โทร</Text>
              <Text style={styles.infoValue}>{pendingProfile.phone}</Text>
            </View>
          ) : null}

          <View style={styles.form}>
            <View style={styles.passwordInputWrapper}>
              <Input
                label="รหัสผ่าน"
                placeholder="กำหนดรหัสผ่านอย่างน้อย 6 ตัวอักษร"
                value={password}
                onChangeText={setPassword}
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
            <View style={styles.passwordInputWrapper}>
              <Input
                label="ยืนยันรหัสผ่าน"
                placeholder="กรอกเพื่อยืนยันรหัสผ่าน"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!confirmPasswordVisible}
                style={styles.passwordInput}
              />
              <TouchableOpacity
                style={styles.passwordToggle}
                onPress={() => setConfirmPasswordVisible(!confirmPasswordVisible)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={confirmPasswordVisible ? 'eye' : 'eye-off'}
                  size={20}
                  color={colors.mutedForeground}
                />
              </TouchableOpacity>
            </View>
            <Text style={styles.disclaimer}>
              รหัสผ่านของคุณควรมีอย่างน้อย 6 ตัวอักษร
            </Text>
            <Button onPress={handleSubmit} style={styles.submitButton} loading={loading} disabled={loading}>
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
    paddingBottom: 24,
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
  profileInfo: {
    marginBottom: 24,
    padding: 16,
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
  form: {
    gap: 12,
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
    marginBottom: 8,
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
});

export default SignUp2Screen;
