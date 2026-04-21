import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import Button from './ui/button';
import colors from '../theme/colors';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const BookingCard: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>จองบริการรับ - ส่งผู้ป่วย</Text>
      <Text style={styles.subtitle}>เลือกสถานที่และเวลาที่คุณต้องการ</Text>
      <Button
        onPress={() => navigation.navigate('Booking1')}
        style={styles.button}
      >
        จองบริการตอนนี้
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    fontFamily: 'Prompt_700Bold',

    fontSize: 18,
    fontWeight: 'bold',
    color: colors.foreground,
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: 'Prompt_400Regular',

    fontSize: 14,
    color: colors.mutedForeground,
    marginBottom: 16,
  },
  button: {
    width: '100%',
  },
});

export default BookingCard;
