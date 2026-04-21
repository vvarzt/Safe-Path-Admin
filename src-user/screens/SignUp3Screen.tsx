import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RootStackParamList } from '../navigation/AppNavigator';
import Input from '../components/ui/input';
import Button from '../components/ui/button';
import colors from '../theme/colors';
import { getPendingProfile, setPendingProfile } from '../services/signupStore';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const SignUp3Screen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [formData, setFormData] = useState({
    occupation: '',
    address: '',
    subDistrict: '',
    district: '',
  });

  const handleSubmit = () => {
    const current = getPendingProfile() || {};
    const fullAddress = [formData.address, formData.subDistrict, formData.district]
      .filter(Boolean)
      .join(' ');

    setPendingProfile({
      ...current,
      address: fullAddress,
    });

    // นำทางไปหน้าตั้งรหัสผ่าน
    navigation.navigate('SignUp4' as any);
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
            <Text style={styles.title}>โปรดกรอกข้อมูลเพื่อสร้างบัญชี</Text>
          </View>

          <View style={styles.form}>
            <Input
              label="อาชีพ"
              placeholder="กรอกอาชีพของคุณ"
              value={formData.occupation}
              onChangeText={(text) => setFormData({ ...formData, occupation: text })}
            />

            <Input
              label="ที่อยู่ปัจจุบัน"
              placeholder="กรอกที่อยู่ปัจจุบันของคุณ"
              value={formData.address}
              onChangeText={(text) => setFormData({ ...formData, address: text })}
            />

            <Input
              label="ตำบล/แขวง"
              placeholder="กรอกตำบล/แขวงของคุณ"
              value={formData.subDistrict}
              onChangeText={(text) => setFormData({ ...formData, subDistrict: text })}
            />

            <Input
              label="อำเภอ/เขต"
              placeholder="กรอกอำเภอ/เขตของคุณ"
              value={formData.district}
              onChangeText={(text) => setFormData({ ...formData, district: text })}
            />

            <Button onPress={handleSubmit} style={styles.submitButton}>
              ต่อไป
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
  },
  titleContainer: {
    marginBottom: 32,
  },
  title: {
    fontFamily: 'Prompt_700Bold',

    fontSize: 20,
    fontWeight: 'bold',
    color: colors.gray800,
  },
  form: {
    gap: 8,
  },
  submitButton: {
    marginTop: 16,
    borderRadius: 8,
  },
});

export default SignUp3Screen;
