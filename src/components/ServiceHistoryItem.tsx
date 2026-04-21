import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import colors from '../theme/colors';
import { RootStackParamList } from '../navigation/AppNavigator';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface Booking {
  id: string;
  date: string;
  time: string;
  from: string;
  to: string;
  caregiver: string;
  price: number;
  status: string;
  rating: number;
}

interface ServiceHistoryItemProps {
  booking: Booking;
  index: number;
}

const ServiceHistoryItem: React.FC<ServiceHistoryItemProps> = ({ booking, index }) => {
  const navigation = useNavigation<NavigationProp>();

  const statusColors: Record<string, string> = {
    completed: colors.primary,
    cancelled: colors.destructive,
    pending: colors.accent,
  };

  const borderColor = statusColors[booking.status] || colors.primary;

  return (
    <View style={[styles.container, { borderLeftColor: borderColor }]}>
      <View style={styles.header}>
        <Ionicons name="time" size={16} color={colors.primary} />
        <Text style={styles.dateTime}>
          {booking.date} {booking.time}
        </Text>
      </View>

      <View style={styles.locationContainer}>
        <View style={styles.locationRow}>
          <Ionicons name="location" size={16} color={colors.mutedForeground} />
          <Text style={styles.locationLabel}>ต้นทาง</Text>
          <Text style={styles.locationValue}>{booking.from}</Text>
        </View>
        <View style={styles.locationRow}>
          <Ionicons name="location" size={16} color={colors.mutedForeground} />
          <Text style={styles.locationLabel}>ปลายทาง</Text>
        </View>
        <Text style={styles.toLocation}>{booking.to}</Text>
      </View>

      <View style={styles.footer}>
        <View style={styles.caregiverContainer}>
          <Ionicons name="person" size={16} color={colors.mutedForeground} />
          <View>
            <Text style={styles.caregiverLabel}>ผู้ดูแล</Text>
            <Text style={styles.caregiverName}>{booking.caregiver}</Text>
          </View>
        </View>

        <View style={styles.priceContainer}>
          {booking.status === 'completed' && booking.rating > 0 && (
            <View style={styles.ratingRow}>
              {[...Array(5)].map((_, i) => (
                <Ionicons
                  key={i}
                  name="star"
                  size={12}
                  color={i < booking.rating ? colors.accent : colors.mutedForeground}
                />
              ))}
            </View>
          )}
          <Text style={styles.priceLabel}>ราคา</Text>
          <Text style={styles.priceValue}>฿{booking.price}</Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.detailButton}
        onPress={() => navigation.navigate('BookingDetail', { id: booking.id })}
      >
        <Text style={styles.detailButtonText}>ดูรายละเอียด</Text>
        <Ionicons name="chevron-forward" size={16} color={colors.primary} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  dateTime: {
    fontFamily: 'Prompt_600SemiBold',

    fontSize: 16,
    fontWeight: '600',
    color: colors.foreground,
  },
  locationContainer: {
    marginBottom: 12,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  locationLabel: {
    fontFamily: 'Prompt_400Regular',

    fontSize: 14,
    color: colors.mutedForeground,
  },
  locationValue: {
    fontFamily: 'Prompt_500Medium',

    fontSize: 14,
    fontWeight: '500',
    color: colors.foreground,
  },
  toLocation: {
    fontFamily: 'Prompt_500Medium',

    fontSize: 14,
    fontWeight: '500',
    color: colors.foreground,
    marginLeft: 24,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  caregiverContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  caregiverLabel: {
    fontFamily: 'Prompt_400Regular',

    fontSize: 12,
    color: colors.mutedForeground,
  },
  caregiverName: {
    fontFamily: 'Prompt_500Medium',

    fontSize: 14,
    fontWeight: '500',
    color: colors.foreground,
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  ratingRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  priceLabel: {
    fontFamily: 'Prompt_400Regular',

    fontSize: 12,
    color: colors.mutedForeground,
  },
  priceValue: {
    fontFamily: 'Prompt_700Bold',

    fontSize: 18,
    fontWeight: 'bold',
    color: colors.accent,
  },
  detailButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
    paddingVertical: 10,
    backgroundColor: `${colors.primary}1A`,
    borderRadius: 8,
  },
  detailButtonText: {
    fontFamily: 'Prompt_500Medium',

    fontSize: 14,
    fontWeight: '500',
    color: colors.primary,
  },
});

export default ServiceHistoryItem;
