import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Button from '../components/ui/button';
import { RootStackParamList } from '../navigation/AppNavigator';
import colors from '../theme/colors';
import { setPendingBooking } from '../services/bookingStore';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const Booking2Screen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();

  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState(new Date());

  const [tempDate, setTempDate] = useState(new Date());
  const [tempTime, setTempTime] = useState(new Date());

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const handleNext = () => {
    const formattedDate = date.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const formattedTime = time.toLocaleTimeString('th-TH', {
      hour: '2-digit',
      minute: '2-digit',
    });

    setPendingBooking({
      date: formattedDate,
      time: formattedTime,
    });
    navigation.navigate('Booking3');
  };

  const formatDate = (date: Date) =>
    date.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

  const formatTime = (time: Date) =>
    time.toLocaleTimeString('th-TH', {
      hour: '2-digit',
      minute: '2-digit',
    });

  /** =========================
   * Date Picker
   * ========================= */
  const isSameDay = (d1: Date, d2: Date) => {
    return (
      d1.getDate() === d2.getDate() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getFullYear() === d2.getFullYear()
    );
  };

  const onChangeDate = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
      if (event.type === 'set' && selectedDate) {
        setDate(selectedDate);
      }
    } else if (selectedDate) {
      setTempDate(selectedDate);
    }
  };

  const confirmDateIOS = () => {
    setDate(tempDate);
    setShowDatePicker(false);
  };

  /** =========================
   * Time Picker
   * ========================= */
  const onChangeTime = (event: DateTimePickerEvent, selectedTime?: Date) => {
    const now = new Date();

    if (Platform.OS === 'android') {
      setShowTimePicker(false);

      if (event.type === 'set' && selectedTime) {
        // 👇 ถ้าเป็น "วันนี้" และเลือกเวลาย้อนหลัง
        if (isSameDay(date, now) && selectedTime < now) {
          alert('ไม่สามารถเลือกเวลาย้อนหลังได้');
          return;
        }

        setTime(selectedTime);
      }
    } else if (selectedTime) {
      // iOS (ยังไม่ commit)
      if (isSameDay(date, now) && selectedTime < now) {
        return; // ไม่ให้เลื่อนย้อนหลัง
      }
      setTempTime(selectedTime);
    }
  };

  const confirmTimeIOS = () => {
    setTime(tempTime);
    setShowTimePicker(false);
  };

  const steps = [
    { number: 1, active: true },
    { number: 2, active: true },
    { number: 3, active: false },
    { number: 4, active: false },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>จองบริการ</Text>
      </View>

      {/* Steps */}
      <View style={styles.stepsContainer}>
        {steps.map((step) => (
          <View key={step.number} style={[styles.step, step.active && styles.stepActive]}>
            <Text style={[styles.stepText, step.active && styles.stepTextActive]}>
              {step.number}
            </Text>
          </View>
        ))}
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.card}>
          <View style={styles.iconContainer}>
            <Ionicons name="calendar" size={40} color={colors.primary} />
          </View>

          <Text style={styles.title}>เลือกวันและเวลา</Text>
          <Text style={styles.subtitle}>กรุณาเลือกวันและเวลาที่ต้องการ</Text>

          <View style={styles.form}>
            {/* Date */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>วันที่</Text>
              <TouchableOpacity
                style={styles.pickerButton}
                onPress={() => {
                  setTempDate(date);
                  setShowDatePicker(true);
                }}
              >
                <Ionicons name="calendar-outline" size={20} color={colors.mutedForeground} />
                <Text style={styles.pickerText}>{formatDate(date)}</Text>
              </TouchableOpacity>
            </View>

            {/* Time */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>เวลา</Text>
              <TouchableOpacity
                style={styles.pickerButton}
                onPress={() => {
                  setTempTime(time);
                  setShowTimePicker(true);
                }}
              >
                <Ionicons name="time-outline" size={20} color={colors.mutedForeground} />
                <Text style={styles.pickerText}>{formatTime(time)}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <Button onPress={handleNext} style={styles.nextButton}>
            ต่อไป
          </Button>
        </View>
      </View>

      {/* Date Picker */}
      {showDatePicker && (
        <View style={styles.pickerWrapper}>
          <DateTimePicker
            value={Platform.OS === 'ios' ? tempDate : date}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={onChangeDate}
            minimumDate={new Date()} // 👈 เพิ่มตรงนี้
          />
          {Platform.OS === 'ios' && (
            <Button onPress={confirmDateIOS} style={styles.doneButton}>
              ตกลง
            </Button>
          )}
        </View>
      )}

      {/* Time Picker */}
      {showTimePicker && (
        <View style={styles.pickerWrapper}>
          <DateTimePicker
            value={Platform.OS === 'ios' ? tempTime : time}
            mode="time"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={onChangeTime}
          />
          {Platform.OS === 'ios' && (
            <Button onPress={confirmTimeIOS} style={styles.doneButton}>
              ตกลง
            </Button>
          )}
        </View>
      )}
    </SafeAreaView>
  );
};

export default Booking2Screen;

/* =========================
          Styles
========================= */
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
  },
  subtitle: {
    fontFamily: 'Prompt_400Regular',

    fontSize: 14,
    color: colors.mutedForeground,
    textAlign: 'center',
    marginBottom: 24,
  },
  form: {
    gap: 16,
  },
  inputContainer: {
    gap: 8,
  },
  label: {
    fontFamily: 'Prompt_500Medium',

    fontSize: 14,
    fontWeight: '500',
    color: colors.foreground,
  },
  pickerButton: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 16,
  },
  pickerText: {
    fontFamily: 'Prompt_400Regular',

    fontSize: 16,
    color: colors.foreground,
  },
  nextButton: {
    marginTop: 24,
  },
  pickerWrapper: {
    backgroundColor: colors.card,
    paddingBottom: 16,
  },
  doneButton: {
    marginHorizontal: 24,
    marginTop: 8,
  },
});
