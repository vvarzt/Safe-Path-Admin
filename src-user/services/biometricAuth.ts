import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

const BIOMETRIC_ENABLED_KEY = 'biometric_enabled';
const USER_EMAIL_KEY = 'user_email';
const USER_UID_KEY = 'user_uid';

// ตรวจสอบว่าอุปกรณ์รองรับ biometric หรือไม่
export const isBiometricSupported = async (): Promise<boolean> => {
  try {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    return compatible;
  } catch (error) {
    console.log('[BIOMETRIC_CHECK_ERROR]', error);
    return false;
  }
};

// ตรวจสอบว่ามีการลงทะเบียน biometric หรือไม่
export const isBiometricEnrolled = async (): Promise<boolean> => {
  try {
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    return enrolled;
  } catch (error) {
    console.log('[BIOMETRIC_ENROLLED_ERROR]', error);
    return false;
  }
};

// ตรวจสอบประเภทของ biometric ที่รองรับ
export const getBiometricType = async (): Promise<string> => {
  try {
    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
    
    if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
      return 'Face ID';
    } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
      return 'Touch ID';
    } else if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
      return 'Iris';
    }
    
    return 'Biometric';
  } catch (error) {
    console.log('[BIOMETRIC_TYPE_ERROR]', error);
    return 'Biometric';
  }
};

// เปิดใช้งาน biometric authentication
export const enableBiometric = async (email: string, uid: string): Promise<boolean> => {
  try {
    await SecureStore.setItemAsync(BIOMETRIC_ENABLED_KEY, 'true');
    await SecureStore.setItemAsync(USER_EMAIL_KEY, email);
    await SecureStore.setItemAsync(USER_UID_KEY, uid);
    return true;
  } catch (error) {
    console.log('[ENABLE_BIOMETRIC_ERROR]', error);
    return false;
  }
};

// ปิดใช้งาน biometric authentication
export const disableBiometric = async (): Promise<boolean> => {
  try {
    await SecureStore.deleteItemAsync(BIOMETRIC_ENABLED_KEY);
    await SecureStore.deleteItemAsync(USER_EMAIL_KEY);
    await SecureStore.deleteItemAsync(USER_UID_KEY);
    return true;
  } catch (error) {
    console.log('[DISABLE_BIOMETRIC_ERROR]', error);
    return false;
  }
};

// ตรวจสอบว่าเปิดใช้งาน biometric หรือไม่
export const isBiometricEnabled = async (): Promise<boolean> => {
  try {
    const enabled = await SecureStore.getItemAsync(BIOMETRIC_ENABLED_KEY);
    return enabled === 'true';
  } catch (error) {
    console.log('[CHECK_BIOMETRIC_ERROR]', error);
    return false;
  }
};

// ดึง email ที่บันทึกไว้
export const getSavedEmail = async (): Promise<string | null> => {
  try {
    const email = await SecureStore.getItemAsync(USER_EMAIL_KEY);
    return email;
  } catch (error) {
    console.log('[GET_EMAIL_ERROR]', error);
    return null;
  }
};

// ดึง UID ที่บันทึกไว้
export const getSavedUID = async (): Promise<string | null> => {
  try {
    const uid = await SecureStore.getItemAsync(USER_UID_KEY);
    return uid;
  } catch (error) {
    console.log('[GET_UID_ERROR]', error);
    return null;
  }
};

// ทำการ authenticate ด้วย biometric
export const authenticateWithBiometric = async (): Promise<{
  success: boolean;
  email: string | null;
  uid: string | null;
}> => {
  try {
    // ตรวจสอบว่าเปิดใช้งานหรือไม่
    const enabled = await isBiometricEnabled();
    if (!enabled) {
      return { success: false, email: null, uid: null };
    }

    // ดึง email และ UID ที่บันทึกไว้
    const email = await getSavedEmail();
    const uid = await getSavedUID();
    if (!email || !uid) {
      return { success: false, email: null, uid: null };
    }

    // ทำการ authenticate
    const biometricType = await getBiometricType();
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: `ใช้ ${biometricType} เพื่อเข้าสู่ระบบ`,
      fallbackLabel: 'ใช้รหัสผ่าน',
      cancelLabel: 'ยกเลิก',
    });

    if (result.success) {
      return { success: true, email, uid };
    }

    return { success: false, email: null, uid: null };
  } catch (error) {
    console.log('[BIOMETRIC_AUTH_ERROR]', error);
    return { success: false, email: null, uid: null };
  }
};
