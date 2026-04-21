import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { RootStackParamList } from '../navigation/AppNavigator';
import Button from '../components/ui/button';
import colors from '../theme/colors';
import { auth, db } from '../firebase';
import { getPendingBooking, clearPendingBooking } from '../services/bookingStore';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

type PaymentMethod = 'cash' | 'card' | 'promptpay';

const PaymentScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('cash');
  const [loading, setLoading] = useState(false);

  const bookingData = getPendingBooking();
  const fare = bookingData.fare || 0;
  const distance = bookingData.distance || 0;

  const methods: { id: PaymentMethod; label: string; description: string; icon: string }[] = [
    { id: 'cash', label: 'ชำระเงินสดกับคนขับ', description: 'จ่ายเงินสดเมื่อให้บริการเสร็จสิ้น', icon: 'cash-outline' },
    { id: 'card', label: 'บัตรเครดิต/เดบิต', description: 'ผูกบัตรเพื่อชำระอัตโนมัติ', icon: 'card-outline' },
    { id: 'promptpay', label: 'พร้อมเพย์ / โอนเงิน', description: 'ชำระผ่าน Mobile Banking', icon: 'phone-portrait-outline' },
  ];

  const handleConfirmPayment = async () => {
    try {
      setLoading(true);

      const currentUser = auth.currentUser;
      if (!currentUser) {
        Alert.alert('ข้อผิดพลาด', 'กรุณาเข้าสู่ระบบก่อน');
        navigation.navigate('Login');
        return;
      }

      const bookingData = getPendingBooking();
      if (!bookingData) {
        Alert.alert('ข้อผิดพลาด', 'ไม่พบข้อมูลการจอง');
        return;
      }

      const now = new Date().toISOString();

      // บันทึกการจองลง Firestore
      const bookingRef = await db.collection('bookings').add({
        userId: currentUser.uid,
        fromAddress: bookingData.fromAddress || '',
        toAddress: bookingData.toAddress || '',
        dateBooking: bookingData.date || '',
        timeBooking: bookingData.time || '',
        passengerType: bookingData.passengerType || '',
        equipment: bookingData.equipment || [],
        distance: bookingData.distance || 0,
        fare: bookingData.fare || 0,
        paymentMethod: selectedMethod,
        status: 'pending',
        createdAt: now,
        updatedAt: now,
      });

      // บันทึกการชำระเงินลง Firestore
      await db.collection('payments').add({
        userId: currentUser.uid,
        bookingId: bookingRef.id,
        method: selectedMethod,
        amount: bookingData.fare || 0,
        status: 'pending',
        createdAt: now,
      });

      clearPendingBooking();

      // แสดง Toast notification
      Toast.show({
        type: 'success',
        text1: '🎉 จองบริการสำเร็จ!',
        text2: `วันที่: ${bookingData.date} | เวลา: ${bookingData.time}`,
        visibilityTime: 4000,
        position: 'top',
      });

      // รอให้ Toast แสดงแล้วค่อยกลับหน้า Home
      setTimeout(() => {
        navigation.navigate('MainTabs');
      }, 1500);
    } catch (error) {
      console.log('[BOOKING_ERROR]', error);
      Alert.alert('เกิดข้อผิดพลาด', 'ไม่สามารถบันทึกการจองได้ กรุณาลองใหม่อีกครั้ง');
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
        <Text style={styles.headerTitle}>เลือกวิธีชำระเงิน</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Text style={styles.title}>วิธีชำระเงิน</Text>
          <Text style={styles.subtitle}>เลือกวิธีที่คุณต้องการใช้ในการชำระค่าบริการ</Text>

          <View style={styles.methodsContainer}>
            {methods.map((method) => {
              const isSelected = selectedMethod === method.id;
              return (
                <TouchableOpacity
                  key={method.id}
                  style={[styles.methodItem, isSelected && styles.methodItemSelected]}
                  onPress={() => setSelectedMethod(method.id)}
                  activeOpacity={0.8}
                >
                  <View style={styles.methodIconContainer}>
                    <Ionicons
                      name={method.icon as keyof typeof Ionicons.glyphMap}
                      size={24}
                      color={isSelected ? colors.primary : colors.mutedForeground}
                    />
                  </View>
                  <View style={styles.methodInfo}>
                    <Text style={styles.methodLabel}>{method.label}</Text>
                    <Text style={styles.methodDescription}>{method.description}</Text>
                  </View>
                  {isSelected && (
                    <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.summaryContainer}>
            <Text style={styles.summaryTitle}>สรุปการชำระเงิน</Text>
            {distance > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>ระยะทาง</Text>
                <Text style={styles.summaryValue}>{distance.toFixed(1)} กม.</Text>
              </View>
            )}
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>ค่าบริการ (50 บาท/กม.)</Text>
              <Text style={styles.summaryValue}>฿{fare.toLocaleString()}</Text>
            </View>
            <View style={[styles.summaryRow, styles.summaryTotalRow]}>
              <Text style={styles.summaryTotalLabel}>ยอดรวมที่ต้องชำระ</Text>
              <Text style={styles.summaryTotalValue}>฿{fare.toLocaleString()}</Text>
            </View>
          </View>

          <Button onPress={handleConfirmPayment} style={styles.confirmButton} loading={loading}>
            ยืนยันการชำระเงิน
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
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 24,
    marginTop: 24,
    marginBottom: 32,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    fontFamily: 'Prompt_700Bold',

    fontSize: 20,
    fontWeight: 'bold',
    color: colors.foreground,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: 'Prompt_400Regular',

    fontSize: 14,
    color: colors.mutedForeground,
    marginBottom: 24,
  },
  methodsContainer: {
    gap: 12,
    marginBottom: 24,
  },
  methodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    gap: 12,
  },
  methodItemSelected: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}0D`,
  },
  methodIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodInfo: {
    flex: 1,
  },
  methodLabel: {
    fontFamily: 'Prompt_500Medium',

    fontSize: 16,
    fontWeight: '500',
    color: colors.foreground,
  },
  methodDescription: {
    fontFamily: 'Prompt_400Regular',

    fontSize: 12,
    color: colors.mutedForeground,
    marginTop: 2,
  },
  summaryContainer: {
    marginTop: 8,
    marginBottom: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 8,
  },
  summaryTitle: {
    fontFamily: 'Prompt_600SemiBold',

    fontSize: 14,
    fontWeight: '600',
    color: colors.foreground,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryLabel: {
    fontFamily: 'Prompt_400Regular',

    fontSize: 14,
    color: colors.mutedForeground,
  },
  summaryValue: {
    fontFamily: 'Prompt_500Medium',

    fontSize: 14,
    color: colors.foreground,
    fontWeight: '500',
  },
  summaryTotalRow: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 8,
    marginTop: 4,
  },
  summaryTotalLabel: {
    fontFamily: 'Prompt_600SemiBold',

    fontSize: 16,
    fontWeight: '600',
    color: colors.foreground,
  },
  summaryTotalValue: {
    fontFamily: 'Prompt_700Bold',

    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
  },
  confirmButton: {
    marginTop: 16,
    borderRadius: 8,
  },
});

export default PaymentScreen;
