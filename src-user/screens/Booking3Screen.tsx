import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RootStackParamList } from '../navigation/AppNavigator';
import Input from '../components/ui/input';
import Button from '../components/ui/button';
import colors from '../theme/colors';
import { setPendingBooking } from '../services/bookingStore';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface RadioOption {
  value: string;
  label: string;
}

const Booking3Screen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [passengerType, setPassengerType] = useState('elderly');
  const [accompaniedBy, setAccompaniedBy] = useState('wheelchair');
  const [otherAccompanied, setOtherAccompanied] = useState('');

  const handleNext = () => {
    const equipment = [accompaniedBy];
    if (otherAccompanied) {
      equipment.push(otherAccompanied);
    }
    
    setPendingBooking({
      passengerType,
      equipment,
    });
    navigation.navigate('Booking4');
  };

  const passengerOptions: RadioOption[] = [
    { value: 'elderly', label: 'เหตุผู้สูงอายุ' },
    { value: 'patient', label: 'เหตุผู้ป่วย' },
    { value: 'disabled', label: 'ไม่สะดวก' },
  ];

  const equipmentOptions: RadioOption[] = [
    { value: 'wheelchair', label: 'วีลแชร์' },
    { value: 'cane', label: 'ไม้เท้า' },
    { value: 'oxygen', label: 'ถังออกซิเจน' },
    { value: 'stretcher', label: 'เปล' },
  ];

  const steps = [
    { number: 1, active: true },
    { number: 2, active: true },
    { number: 3, active: true },
    { number: 4, active: false },
  ];

  const RadioButton = ({
    selected,
    onPress,
    label,
  }: {
    selected: boolean;
    onPress: () => void;
    label: string;
  }) => (
    <TouchableOpacity style={styles.radioOption} onPress={onPress}>
      <View style={[styles.radio, selected && styles.radioSelected]}>
        {selected && <View style={styles.radioInner} />}
      </View>
      <Text style={styles.radioLabel}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>จองบริการ</Text>
      </View>

      <View style={styles.stepsContainer}>
        {steps.map((step) => (
          <View
            key={step.number}
            style={[styles.step, step.active && styles.stepActive]}
          >
            <Text style={[styles.stepText, step.active && styles.stepTextActive]}>
              {step.number}
            </Text>
          </View>
        ))}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <View style={styles.iconContainer}>
            <Ionicons name="people" size={40} color={colors.primary} />
          </View>

          <Text style={styles.title}>เลือกผู้โดยสาร</Text>
          <Text style={styles.subtitle}>เลือกผู้โดยสาร และผู้ติดตามที่ต้องการ</Text>

          <View style={styles.form}>
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>เหตุผู้โดยสาร/คนป่วย</Text>
              {passengerOptions.map((option) => (
                <RadioButton
                  key={option.value}
                  selected={passengerType === option.value}
                  onPress={() => setPassengerType(option.value)}
                  label={option.label}
                />
              ))}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionLabel}>อุปกรณ์ช่วยเหลือที่ต้องการ</Text>
              {equipmentOptions.map((option) => (
                <RadioButton
                  key={option.value}
                  selected={accompaniedBy === option.value}
                  onPress={() => setAccompaniedBy(option.value)}
                  label={option.label}
                />
              ))}
            </View>

            <Input
              placeholder="อื่น ๆ โปรดระบุ"
              value={otherAccompanied}
              onChangeText={setOtherAccompanied}
            />
          </View>

          <Button onPress={handleNext} style={styles.nextButton}>
            ต่อไป
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
  stepsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  step: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepActive: {
    backgroundColor: colors.primary,
  },
  stepText: {
    fontFamily: 'Prompt_600SemiBold',

    fontSize: 16,
    fontWeight: '600',
    color: colors.mutedForeground,
  },
  stepTextActive: {
    color: colors.white,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 24,
    marginBottom: 100,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${colors.primary}1A`,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 16,
  },
  title: {
    fontFamily: 'Prompt_700Bold',

    fontSize: 20,
    fontWeight: 'bold',
    color: colors.foreground,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: 'Prompt_400Regular',

    fontSize: 14,
    color: colors.mutedForeground,
    textAlign: 'center',
    marginBottom: 24,
  },
  form: {
    gap: 24,
  },
  section: {
    gap: 8,
  },
  sectionLabel: {
    fontFamily: 'Prompt_500Medium',

    fontSize: 14,
    fontWeight: '500',
    color: colors.foreground,
    marginBottom: 8,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: colors.gray200,
    borderRadius: 8,
    gap: 12,
  },
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
  radioLabel: {
    fontFamily: 'Prompt_400Regular',

    fontSize: 14,
    color: colors.foreground,
  },
  nextButton: {
    marginTop: 24,
  },
});

export default Booking3Screen;
