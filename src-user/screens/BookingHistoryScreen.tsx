import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RootStackParamList } from '../navigation/AppNavigator';
import colors from '../theme/colors';
import { auth, db } from '../firebase';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface Booking {
  id: string;
  date: string;
  time: string;
  fromAddress: string;
  toAddress: string;
  status: string;
  passengerType?: string;
  createdAt: string;
}

const BookingHistoryScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        console.log('[BOOKING_HISTORY_USER_NOT_LOGGED_IN]');
        setBookings([]);
        setLoading(false);
        return;
      }

      const bookingsSnapshot = await db.collection('bookings')
        .where('userId', '==', currentUser.uid)
        .orderBy('createdAt', 'desc')
        .get();

      const bookingsList: Booking[] = bookingsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      } as Booking));

      setBookings(bookingsList);
    } catch (error) {
      console.log('[BOOKING_HISTORY_LOAD_ERROR]', error);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return colors.accent;
      case 'pending':
        return colors.primary;
      case 'cancelled':
        return colors.destructive;
      default:
        return colors.mutedForeground;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'เสร็จสิ้น';
      case 'pending':
        return 'รอยืนยัน';
      case 'cancelled':
        return 'ยกเลิก';
      default:
        return status;
    }
  };

  const renderBookingItem = ({ item }: { item: Booking }) => (
    <TouchableOpacity 
      style={styles.bookingCard} 
      activeOpacity={0.7}
      onPress={() => navigation.navigate('BookingDetail', { id: item.id })}
    >
      <View style={styles.bookingHeader}>
        <View style={styles.dateContainer}>
          <Ionicons name="calendar" size={16} color={colors.primary} />
          <Text style={styles.dateText}>{item.date}</Text>
          <Text style={styles.timeText}>| {item.time}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(item.status)}1A` }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {getStatusText(item.status)}
          </Text>
        </View>
      </View>

      <View style={styles.locationContainer}>
        <View style={styles.locationRow}>
          <View style={[styles.locationDot, { backgroundColor: colors.primary }]} />
          <View style={styles.locationTextContainer}>
            <Text style={styles.locationLabel}>ต้นทาง</Text>
            <Text style={styles.locationText} numberOfLines={2}>{item.fromAddress}</Text>
          </View>
        </View>

        <View style={styles.locationLine} />

        <View style={styles.locationRow}>
          <View style={[styles.locationDot, { backgroundColor: colors.destructive }]} />
          <View style={styles.locationTextContainer}>
            <Text style={styles.locationLabel}>ปลายทาง</Text>
            <Text style={styles.locationText} numberOfLines={2}>{item.toAddress}</Text>
          </View>
        </View>
      </View>

      {item.passengerType && (
        <View style={styles.passengerInfo}>
          <Ionicons name="person" size={14} color={colors.mutedForeground} />
          <Text style={styles.passengerText}>{item.passengerType}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>การเดินทางทั้งหมด</Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>กำลังโหลดข้อมูล...</Text>
        </View>
      ) : bookings.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="car-outline" size={64} color={colors.mutedForeground} />
          <Text style={styles.emptyTitle}>ยังไม่มีประวัติการเดินทาง</Text>
          <Text style={styles.emptyText}>เริ่มจองบริการเพื่อดูประวัติการเดินทางของคุณ</Text>
        </View>
      ) : (
        <FlatList
          data={bookings}
          renderItem={renderBookingItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontFamily: 'Prompt_400Regular',

    fontSize: 16,
    color: colors.mutedForeground,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 16,
  },
  emptyTitle: {
    fontFamily: 'Prompt_700Bold',

    fontSize: 20,
    fontWeight: 'bold',
    color: colors.foreground,
  },
  emptyText: {
    fontFamily: 'Prompt_400Regular',

    fontSize: 14,
    color: colors.mutedForeground,
    textAlign: 'center',
  },
  listContainer: {
    padding: 16,
    gap: 12,
  },
  bookingCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateText: {
    fontFamily: 'Prompt_600SemiBold',

    fontSize: 14,
    fontWeight: '600',
    color: colors.foreground,
  },
  timeText: {
    fontFamily: 'Prompt_400Regular',

    fontSize: 14,
    color: colors.mutedForeground,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontFamily: 'Prompt_500Medium',

    fontSize: 12,
    fontWeight: '500',
  },
  locationContainer: {
    gap: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  locationDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 4,
  },
  locationLine: {
    width: 2,
    height: 16,
    backgroundColor: colors.border,
    marginLeft: 5,
  },
  locationTextContainer: {
    flex: 1,
  },
  locationLabel: {
    fontFamily: 'Prompt_400Regular',

    fontSize: 12,
    color: colors.mutedForeground,
    marginBottom: 2,
  },
  locationText: {
    fontFamily: 'Prompt_500Medium',

    fontSize: 14,
    color: colors.foreground,
    fontWeight: '500',
  },
  passengerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  passengerText: {
    fontFamily: 'Prompt_400Regular',

    fontSize: 12,
    color: colors.mutedForeground,
  },
});

export default BookingHistoryScreen;
