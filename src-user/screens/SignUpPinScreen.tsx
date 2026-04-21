import { Ionicons } from '@expo/vector-icons';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import CryptoJS from 'crypto-js';
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
import { db } from '../firebase';
import { RootStackParamList } from '../navigation/AppNavigator';
import { getAuthToken } from '../services/authStore';
import { clearPendingProfile, getPendingProfile, setPendingProfile } from '../services/signupStore';
import colors from '../theme/colors';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type RouteProps = RouteProp<RootStackParamList, 'SignUpPin'>;

const hashPin = (pin: string): string => {
  return CryptoJS.SHA256(pin).toString();
};

const SignUpPinScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const mode = route.params?.mode || 'set';
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [isConfirming, setIsConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pendingProfile, setPendingProfileState] = useState(getPendingProfile());

useEffect(() => {
  if (mode === 'set') {
    if (!isConfirming && pin.length >= 6) {
      setIsConfirming(true);
    }
  }
}, [pin, mode]);

useEffect(() => {
  if (mode === 'set') {
    if (isConfirming && confirmPin.length === pin.length) {
      handleSubmit();
    }
  } else if (mode === 'verify') {
    if (pin.length === 6) {
      handleVerify();
    }
  }
}, [confirmPin, pin, mode]);

  const handleKeyPress = (key: string) => {
    if (key === 'delete') {
      if (mode === 'set') {
        if (isConfirming) {
          setConfirmPin(confirmPin.slice(0, -1));
        } else {
          setPin(pin.slice(0, -1));
        }
      } else {
        setPin(pin.slice(0, -1));
      }
    } else if (key >= '0' && key <= '9') {
      if (mode === 'set') {
        if (isConfirming) {
          const newConfirmPin = confirmPin + key;
          if (newConfirmPin.length <= pin.length) {
            setConfirmPin(newConfirmPin);
          }
        } else {
          const newPin = pin + key;
          if (newPin.length <= 6) {
            setPin(newPin);
          }
        }
      } else {
        const newPin = pin + key;
        if (newPin.length <= 6) {
          setPin(newPin);
        }
      }
    }
  };

  const handleNext = () => {
    if (!isConfirming) {
      if (pin.length >= 4) {
        setIsConfirming(true);
      }
    } else {
      handleSubmit();
    }
  };

  const handleVerify = async () => {
    setLoading(true);

    try {
      const uid = getAuthToken();
      if (!uid) {
        Alert.alert('ข้อผิดพลาด', 'ไม่พบข้อมูลผู้ใช้');
        navigation.navigate('Login');
        return;
      }

      const userDoc = await db.collection('users').doc(uid).get();
      if (!userDoc.exists) {
        Alert.alert('ข้อผิดพลาด', 'ไม่พบข้อมูลผู้ใช้');
        navigation.navigate('Login');
        return;
      }

      const userData = userDoc.data();
      const storedHashedPin = userData?.pin;

      if (!storedHashedPin) {
        Alert.alert('ข้อผิดพลาด', 'ไม่พบรหัส PIN ที่ตั้งไว้');
        navigation.navigate('Login');
        return;
      }

      const enteredHashedPin = hashPin(pin);

      if (enteredHashedPin === storedHashedPin) {
        navigation.navigate('MainTabs');
      } else {
        Alert.alert('PIN ไม่ถูกต้อง', 'กรุณาตรวจสอบ PIN อีกครั้ง');
        setPin('');
      }
    } catch (error) {
      console.log('[PIN_VERIFY_ERROR]', error);
      Alert.alert('ข้อผิดพลาด', 'ไม่สามารถตรวจสอบ PIN ได้');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!validatePin()) {
      return;
    }

    setLoading(true);

    try {
      const uid = getAuthToken();
      if (!uid) {
        Alert.alert('ข้อผิดพลาด', 'ไม่พบข้อมูลผู้ใช้ กรุณาเข้าสู่ระบบใหม่');
        navigation.navigate('Login');
        return;
      }

      // Hash PIN ก่อนบันทึก
      const hashedPin = hashPin(pin);

      // บันทึก PIN ที่ hash แล้ว ไว้ใน pending profile
      const current = getPendingProfile() || {};
      setPendingProfile({
        ...current,
        pin: hashedPin,
      });

      // อัปเดต PIN ที่ hash แล้ว ใน Firestore
      await db.collection('users').doc(uid).update({
        pin: hashedPin,
        updatedAt: new Date().toISOString(),
      });

      clearPendingProfile();

      Alert.alert('สำเร็จ', 'ตั้ง PIN เรียบร้อยแล้ว', [
        {
          text: 'เข้าสู่ระบบ',
          onPress: () => navigation.navigate('MainTabs'),
        },
      ]);
    } catch (error) {
      console.log('[PIN_SETUP_ERROR]', error);
      Alert.alert('ข้อผิดพลาด', 'ไม่สามารถตั้ง PIN ได้');
    } finally {
      setLoading(false);
    }
  };

  const validatePin = () => {
    if (!pin || !confirmPin) {
      Alert.alert('กรุณากรอกข้อมูล', 'โปรดกรอก PIN และยืนยัน PIN');
      return false;
    }

    if (pin !== confirmPin) {
      Alert.alert('PIN ไม่ตรงกัน', 'โปรดยืนยัน PIN ให้ตรงกัน');
      return false;
    }

    if (pin.length < 4 || pin.length > 6) {
      Alert.alert('PIN ไม่ถูกต้อง', 'PIN ต้องมี 4-6 หลัก');
      return false;
    }

    return true;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
  {mode === 'set' && isConfirming && (
    <TouchableOpacity
      onPress={() => {
        setIsConfirming(false);
        setConfirmPin('');
      }}
      style={styles.backButton}
    >
      <Ionicons name="arrow-back" size={24} color={colors.white} />
    </TouchableOpacity>
  )}

  <Text style={styles.headerTitle}>{mode === 'verify' ? 'ใส่รหัส PIN' : 'สร้างรหัส PIN'}</Text>
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
          {/* <View style={styles.titleContainer}>
            <Text style={styles.title}>ตั้งรหัส PIN</Text>
            <Text style={styles.subtitle}>ตั้งรหัส PIN 4-6 หลักสำหรับความปลอดภัยเพิ่มเติม</Text>
          </View> */}

          <View style={styles.pinContainer}>
            <Text style={styles.pinTitle}>
              {mode === 'verify' ? 'ใส่รหัส PIN' : (isConfirming ? 'ยืนยันรหัส PIN' : 'ตั้งรหัส PIN')}
            </Text>
            <Text style={styles.pinSubtitle}>
              {mode === 'verify' ? 'กรอก PIN ที่เคยตั้งไว้' : (isConfirming ? 'กรอก PIN อีกครั้งเพื่อยืนยัน' : 'กรอก PIN 4-6 หลักสำหรับความปลอดภัย')}
            </Text>
            
            <View style={styles.pinDisplay}>
              {Array.from({ length: 6 }, (_, i) => (
                <View key={i} style={[
                  styles.pinDot,
                  (isConfirming ? confirmPin : pin).length > i && styles.pinDotFilled
                ]} />
              ))}
            </View>

            <View style={styles.keypad}>
              <View style={styles.keypadRow}>
                <TouchableOpacity
                  style={styles.keyButton}
                  onPress={() => handleKeyPress('1')}
                >
                  <Text style={styles.keyText}>1</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.keyButton}
                  onPress={() => handleKeyPress('2')}
                >
                  <Text style={styles.keyText}>2</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.keyButton}
                  onPress={() => handleKeyPress('3')}
                >
                  <Text style={styles.keyText}>3</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.keypadRow}>
                <TouchableOpacity
                  style={styles.keyButton}
                  onPress={() => handleKeyPress('4')}
                >
                  <Text style={styles.keyText}>4</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.keyButton}
                  onPress={() => handleKeyPress('5')}
                >
                  <Text style={styles.keyText}>5</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.keyButton}
                  onPress={() => handleKeyPress('6')}
                >
                  <Text style={styles.keyText}>6</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.keypadRow}>
                <TouchableOpacity
                  style={styles.keyButton}
                  onPress={() => handleKeyPress('7')}
                >
                  <Text style={styles.keyText}>7</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.keyButton}
                  onPress={() => handleKeyPress('8')}
                >
                  <Text style={styles.keyText}>8</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.keyButton}
                  onPress={() => handleKeyPress('9')}
                >
                  <Text style={styles.keyText}>9</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.keypadRow}>
                <View style={styles.keySpacer} />
                <TouchableOpacity
                  style={styles.keyButton}
                  onPress={() => handleKeyPress('0')}
                >
                  <Text style={styles.keyText}>0</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.keyButton}
                  onPress={() => handleKeyPress('delete')}
                >
                  <Ionicons name="backspace" size={24} color={colors.primary} />
                </TouchableOpacity>
              </View>
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
    flex: 1,
    textAlign: 'center',
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
    marginBottom: 20,
  },
  pinContainer: {
    gap: 12,
  },
  pinTitle: {
    fontFamily: 'Prompt_700Bold',
    fontSize: 18,
    color: colors.gray800,
    textAlign: 'center',
  },
  pinSubtitle: {
    fontFamily: 'Prompt_400Regular',
    fontSize: 14,
    color: colors.gray600,
    textAlign: 'center',
    marginBottom: 20,
  },
  pinDisplay: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 100,
  },
  pinDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.gray300,
    backgroundColor: colors.white,
  },
  pinDotFilled: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  keypad: {
    alignItems: 'center',
  },
  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginBottom: 20,
  },
  keyButton: {
    width: 80,
    height: 80,
    borderRadius: 50,
    backgroundColor: colors.gray100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyText: {
    fontFamily: 'Prompt_600SemiBold',
    fontSize: 30,
    color: colors.gray800,
  },
  keySpacer: {
    width: 72,
  },
});

export default SignUpPinScreen;