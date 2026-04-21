import { Ionicons } from '@expo/vector-icons';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../components/ui/button';
import { auth, db } from '../firebase';
import { RootStackParamList } from '../navigation/AppNavigator';
import colors from '../theme/colors';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type RouteProps = RouteProp<RootStackParamList, 'BookingDetail'>;

interface DetailBooking {
  id: string;
  dateBooking: string;
  timeBooking: string;
  from: string;
  to: string;
  passengerType: string;
  equipment: string[];
  paymentMethod: string;
  status: string;
  createdAt: string;
  riderId?: string;
  riderName?: string;
  riderPhone?: string;
}

const BookingDetailScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const { id } = route.params;
  const [booking, setBooking] = useState<DetailBooking | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.log('[BOOKING_DETAIL_USER_NOT_LOGGED_IN]');
      setBooking(null);
      setLoading(false);
      return;
    }

    const unsubscribe = db.collection('bookings').doc(id)
      .onSnapshot(doc => {
        if (!doc.exists) {
          console.log('[BOOKING_DETAIL_NOT_FOUND]');
          setBooking(null);
          setLoading(false);
          return;
        }

        const b = doc.data();
        const mapped: DetailBooking = {
          id: doc.id,
          dateBooking: b?.dateBooking || '',
          timeBooking: b?.timeBooking || '',
          from: b?.fromAddress || '',
          to: b?.toAddress || '',
          passengerType: b?.passengerType || '',
          equipment: b?.equipment || [],
          paymentMethod: b?.paymentMethod || 'cash',
          status: b?.status || 'pending',
          createdAt: b?.createdAt || '',
          riderId: b?.riderId,
          riderName: b?.riderName || 'กำลังจัดหาคนขับ...',
          riderPhone: b?.riderPhone,
        };
        setBooking(mapped);
        setLoading(false);
      }, (e) => {
        console.log('[BOOKING_DETAIL_EXCEPTION]', e);
        setBooking(null);
        setLoading(false);
      });

    return () => unsubscribe();
  }, [id]);

  if (loading) {
    return (
      <View style={styles.notFoundContainer}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!booking) {
    return (
      <View style={styles.notFoundContainer}>
        <Text style={styles.notFoundText}>ไม่พบข้อมูลการจอง</Text>
      </View>
    );
  }

  const statusText: Record<string, string> = {
    completed: 'เสร็จสิ้น',
    cancelled: 'ยกเลิก',
    pending: 'รอดำเนินการ',
  };

  const statusColor: Record<string, string> = {
    completed: colors.primary,
    cancelled: colors.destructive,
    pending: colors.accent,
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>รายละเอียดการจอง</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* สถานะการจอง */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>สถานะการจอง</Text>
            <Text style={[styles.status, { color: statusColor[booking.status] }]}>
              {statusText[booking.status]}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="time" size={20} color={colors.primary} />
            <View>
              <Text style={styles.infoLabel}>วันที่และเวลา</Text>
              <Text style={styles.infoValue}>
                {booking.dateBooking} {booking.timeBooking}
              </Text>
            </View>
          </View>
        </View>

        {/* ข้อมูลเส้นทาง */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>ข้อมูลเส้นทาง</Text>
          <View style={styles.routeContainer}>
            <View style={styles.routePoint}>
              <View style={[styles.routeDot, { backgroundColor: colors.primary }]} />
              <View style={styles.routeLine} />
            </View>
            <View style={styles.routeInfo}>
              <Text style={styles.infoLabel}>ต้นทาง</Text>
              <Text style={styles.infoValue}>{booking.from}</Text>
            </View>
          </View>
          <View style={styles.routeContainer}>
            <View style={styles.routePoint}>
              <View style={[styles.routeDot, { backgroundColor: colors.destructive }]} />
            </View>
            <View style={styles.routeInfo}>
              <Text style={styles.infoLabel}>ปลายทาง</Text>
              <Text style={styles.infoValue}>{booking.to}</Text>
            </View>
          </View>
        </View>

        {/* ข้อมูลการจอง */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>ข้อมูลการจอง</Text>
          <View style={styles.detailRow}>
            <Ionicons name="document-text" size={20} color={colors.primary} />
            <View style={styles.detailInfo}>
              <Text style={styles.infoLabel}>รหัสการจอง</Text>
              <Text style={styles.infoValue}>{booking.id.substring(0, 8).toUpperCase()}</Text>
            </View>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="person" size={20} color={colors.primary} />
            <View style={styles.detailInfo}>
              <Text style={styles.infoLabel}>ประเภทผู้โดยสาร</Text>
              <Text style={styles.infoValue}>{booking.passengerType || '-'}</Text>
            </View>
          </View>
          {booking.equipment && booking.equipment.length > 0 && (
            <View style={styles.detailRow}>
              <Ionicons name="medkit" size={20} color={colors.primary} />
              <View style={styles.detailInfo}>
                <Text style={styles.infoLabel}>อุปกรณ์เสริม</Text>
                <Text style={styles.infoValue}>{booking.equipment.join(', ')}</Text>
              </View>
            </View>
          )}
          <View style={styles.detailRow}>
            <Ionicons name="card" size={20} color={colors.primary} />
            <View style={styles.detailInfo}>
              <Text style={styles.infoLabel}>วิธีชำระเงิน</Text>
              <Text style={styles.infoValue}>
                {booking.paymentMethod === 'cash' ? 'เงินสด' : 
                 booking.paymentMethod === 'card' ? 'บัตรเครดิต/เดบิต' : 
                 booking.paymentMethod === 'promptpay' ? 'พร้อมเพย์' : 'เงินสด'}
              </Text>
            </View>
          </View>
        </View>

        {/* ข้อมูลคนขับ */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>ข้อมูลคนขับ</Text>
          <View style={styles.caregiverContainer}>
            <View style={styles.caregiverAvatar}>
              <Ionicons name="car" size={32} color={colors.primary} />
            </View>
            <View style={styles.caregiverInfo}>
              <Text style={styles.caregiverName}>{booking.riderName}</Text>
              {booking.riderId && (
                <Text style={styles.riderId}>รหัส: {booking.riderId}</Text>
              )}
            </View>
          </View>
          {booking.riderPhone && (
            <Button variant="outline" style={styles.contactButton}>
              <View style={styles.contactButtonContent}>
                <Ionicons name="call" size={16} color={colors.primary} />
                <Text style={styles.contactButtonText}>ติดต่อคนขับ</Text>
              </View>
            </Button>
          )}
        </View>

        {booking.status === 'completed' && (
          <View style={styles.rebookContainer}>
            <Button style={styles.rebookButton}>จองอีกครั้ง</Button>
          </View>
        )}
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
    padding: 16,
  },
  notFoundContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  notFoundText: {
    fontFamily: 'Prompt_400Regular',

    fontSize: 14,
    color: colors.mutedForeground,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 1,
  },
  cardTitle: {
    fontFamily: 'Prompt_700Bold',

    fontSize: 18,
    fontWeight: 'bold',
    color: colors.foreground,
    marginBottom: 10,
  },
  status: {
    fontFamily: 'Prompt_600SemiBold',

    fontSize: 14,
    fontWeight: '600',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoLabel: {
    fontFamily: 'Prompt_400Regular',

    fontSize: 12,
    color: colors.mutedForeground,
  },
  infoValue: {
    fontFamily: 'Prompt_500Medium',

    fontSize: 14,
    fontWeight: '500',
    color: colors.foreground,
  },
  routeContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  routePoint: {
    alignItems: 'center',
    marginRight: 12,
  },
  routeDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  routeLine: {
    width: 2,
    height: 48,
    backgroundColor: colors.border,
    marginTop: 4,
  },
  routeInfo: {
    flex: 1,
  },
  caregiverContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  caregiverAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  caregiverInfo: {
    flex: 1,
  },
  caregiverName: {
    fontFamily: 'Prompt_600SemiBold',

    fontSize: 14,
    fontWeight: '600',
    color: colors.foreground,
  },
  riderId: {
    fontFamily: 'Prompt_400Regular',

    fontSize: 12,
    color: colors.mutedForeground,
    marginTop: 2,
  },
  ratingRow: {
    flexDirection: 'row',
    marginTop: 4,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 16,
  },
  detailInfo: {
    flex: 1,
  },
  contactButton: {
    borderColor: colors.primary,
  },
  contactButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  contactButtonText: {
    color: colors.primary,
    fontWeight: '500',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  priceLabel: {
    fontFamily: 'Prompt_400Regular',

    fontSize: 14,
    color: colors.mutedForeground,
  },
  priceValue: {
    fontFamily: 'Prompt_500Medium',

    fontSize: 14,
    fontWeight: '500',
    color: colors.foreground,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 8,
    marginTop: 8,
  },
  totalLabel: {
    fontFamily: 'Prompt_600SemiBold',

    fontSize: 16,
    fontWeight: '600',
    color: colors.foreground,
  },
  totalValue: {
    fontFamily: 'Prompt_700Bold',

    fontSize: 20,
    fontWeight: 'bold',
    color: colors.accent,
  },
  rebookContainer: {
    marginBottom: 100,
  },
  rebookButton: {
    height: 48,
  },
});

export default BookingDetailScreen;
