import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RootStackParamList } from '../navigation/AppNavigator';
import Button from '../components/ui/button';
import colors from '../theme/colors';
import { getPendingBooking } from '../services/bookingStore';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const Booking4Screen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [bookingData, setBookingData] = useState(getPendingBooking());

  useEffect(() => {
    setBookingData(getPendingBooking());
  }, []);

  const handleConfirm = () => {
    navigation.navigate('Payment');
  };

  const steps = [
    { number: 1, active: true },
    { number: 2, active: true },
    { number: 3, active: true },
    { number: 4, active: true },
  ];

  const passengerTypeLabel: Record<string, string> = {
    elderly: 'ผู้สูงอายุ',
    patient: 'ผู้ป่วย',
    disabled: 'ผู้พิการ',
  };

  const summaryItems = [
    { label: 'จาก :', value: bookingData.fromAddress || '-' },
    { label: 'ถึง :', value: bookingData.toAddress || '-' },
    { label: 'วันที่ :', value: bookingData.date || '-' },
    { label: 'เวลา :', value: bookingData.time || '-' },
    { label: 'ผู้โดยสาร :', value: passengerTypeLabel[bookingData.passengerType || ''] || '-' },
    { label: 'อุปกรณ์ :', value: bookingData.equipment?.join(', ') || '-' },
  ];

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
            <Ionicons name="layers" size={40} color={colors.primary} />
          </View>

          <Text style={styles.title}>เลือกประเภทบริการ</Text>
          <Text style={styles.subtitle}>ระบุรุ่นและรายการที่ต้องการ</Text>

          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>สรุปการจอง</Text>
            {summaryItems.map((item, index) => (
              <View key={index} style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>{item.label}</Text>
                <Text style={styles.summaryValue}>{item.value}</Text>
              </View>
            ))}
          </View>

          <Button onPress={handleConfirm} style={styles.confirmButton}>
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
    backgroundColor: colors.gray50,
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
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: 24,
    marginBottom: 100,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.teal100,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 16,
  },
  title: {
    fontFamily: 'Prompt_700Bold',

    fontSize: 20,
    fontWeight: 'bold',
    color: colors.gray800,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: 'Prompt_400Regular',

    fontSize: 14,
    color: colors.gray500,
    textAlign: 'center',
    marginBottom: 24,
  },
  summaryCard: {
    backgroundColor: colors.gray50,
    borderRadius: 8,
    padding: 16,
    gap: 8,
  },
  summaryTitle: {
    fontFamily: 'Prompt_600SemiBold',

    fontSize: 16,
    fontWeight: '600',
    color: colors.gray800,
    marginBottom: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryLabel: {
    fontFamily: 'Prompt_400Regular',

    fontSize: 14,
    color: colors.gray600,
  },
  summaryValue: {
    fontFamily: 'Prompt_500Medium',

    fontSize: 14,
    fontWeight: '500',
    color: colors.gray800,
  },
  confirmButton: {
    marginTop: 24,
    borderRadius: 8,
  },
});

export default Booking4Screen;
