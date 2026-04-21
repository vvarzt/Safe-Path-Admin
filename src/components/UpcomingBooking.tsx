import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { auth, db } from '../firebase';
import colors from '../theme/colors';

interface Upcoming {
  id: string;
  dateBooking: string;
  timeBooking: string;
  from: string;
  to: string;
  distance: number;
  fare: number;
  paymentMethod: string;
  caregiverStatus: string;
  equipment: string[];
}

const statusLabels: Record<string, string> = {
  pending: 'กำลังดำเนินการ',
  confirmed: 'ยืนยันแล้ว',
  completed: 'สำเร็จแล้ว',
};

const statusColors: Record<string, string> = {
  pending: colors.warning,
  confirmed: colors.primary,
  completed: colors.success,
};

const thaiMonths: Record<string, number> = {
  'มกราคม': 1,
  'กุมภาพันธ์': 2,
  'มีนาคม': 3,
  'เมษายน': 4,
  'พฤษภาคม': 5,
  'มิถุนายน': 6,
  'กรกฎาคม': 7,
  'สิงหาคม': 8,
  'กันยายน': 9,
  'ตุลาคม': 10,
  'พฤศจิกายน': 11,
  'ธันวาคม': 12,
};

const parseDate = (dateStr: string, timeStr: string): Date => {
  if (!dateStr || !timeStr) return new Date(0);

  // Handle Thai format: "DD เดือน YYYY" e.g., "20 เมษายน 2569"
  if (dateStr.includes(' ')) {
    const parts = dateStr.split(' ');
    if (parts.length >= 3) {
      const day = parseInt(parts[0]);
      const monthName = parts[1];
      const yearStr = parts[2];
      const month = thaiMonths[monthName];
      let year = parseInt(yearStr);
      if (year > 2500) year -= 543; // Convert Buddhist year to Gregorian
      if (day && month && year) {
        const isoDate = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}T${timeStr}:00`;
        return new Date(isoDate);
      }
    }
  }

  // Fallback to DD/MM/YYYY format
  const [day, month, year] = dateStr.split('/');
  if (day && month && year) {
    const isoDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${timeStr}:00`;
    return new Date(isoDate);
  }

  return new Date(0);
};

interface BookingDocument {
  status?: string;
  createdAt?: string;
  dateBooking?: string;
  timeBooking?: string;
  fromAddress?: string;
  toAddress?: string;
  distance?: number;
  fare?: number;
  paymentMethod?: string;
  caregiverStatus?: string;
  equipment?: string[];
}

export const UpcomingBooking: React.FC = () => {
  const [upcomingList, setUpcomingList] = useState<Upcoming[]>([]);

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.log('[UPCOMING_USER_NOT_LOGGED_IN]');
      setUpcomingList([]);
      return;
    }

    const query = db.collection('bookings')
      .where('userId', '==', currentUser.uid);

    const unsubscribe = query.onSnapshot(snapshot => {
      if (snapshot.empty) {
        setUpcomingList([]);
        return;
      }

      const pendingBookings = snapshot.docs
        .map(doc => {
          const data = doc.data() as BookingDocument;
          return { id: doc.id, ...data };
        })
        .filter((booking) => booking.status === 'pending')
        .map(booking => ({
          id: booking.id,
          dateBooking: booking.dateBooking || '',
          timeBooking: booking.timeBooking ||'',
          from: booking.fromAddress || '',
          to: booking.toAddress || '',
          distance: booking.distance || 0,
          fare: booking.fare || 0,
          paymentMethod: booking.paymentMethod || 'ไม่ระบุ',
          caregiverStatus: booking.caregiverStatus || 'pending',
          equipment: booking.equipment || [],
        }))
        .sort((a, b) => {
          const dateA = parseDate(a.dateBooking, a.timeBooking);
          const dateB = parseDate(b.dateBooking, b.timeBooking);
          return dateA.getTime() - dateB.getTime();
        });

      console.log('[UPCOMING_BOOKINGS]', pendingBookings);
      setUpcomingList(pendingBookings);
    }, (e) => {
      console.log('[UPCOMING_LOAD_EXCEPTION]', e);
      setUpcomingList([]);
    });

    return () => unsubscribe();
  }, []);

  if (upcomingList.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.sectionTitle}>การจองที่กำลังจะมาถึง</Text>
        <Text style={styles.emptyText}>ยังไม่มีการจองที่กำลังจะมาถึง</Text>
      </View>
    );
  }

  const BookingCard = ({ booking, isSingleCard = false }: { booking: Upcoming; isSingleCard?: boolean }) => {
    const caregiverLabel = statusLabels[booking.caregiverStatus] || statusLabels.pending;
    const badgeColor = statusColors[booking.caregiverStatus] || statusColors.pending;

    const handleCardPress = () => {
      const bookingIdShort = booking.id.slice(0, 6);
      const equipmentLabel = booking.equipment.length > 0 ? booking.equipment.join(', ') : 'ไม่มี';
      Alert.alert(
        'รายละเอียดการจอง',
        `รหัสการจอง: ${bookingIdShort}\nวันที่: ${booking.dateBooking}\nเวลา: ${booking.timeBooking}\n\nจาก: ${booking.from}\n\nถึง: ${booking.to}\n\nระยะทาง: ${booking.distance.toFixed(1)} กม.\nค่าบริการ: ${booking.fare.toLocaleString()} บาท\nวิธีชำระเงิน: ${booking.paymentMethod}\nอุปกรณ์เสริม: ${equipmentLabel}\n\nสถานะคนขับ: ${caregiverLabel}`,
        [{ text: 'ตกลง' }]
      );
    };

    const handleDeleteBooking = () => {
      Alert.alert(
        'ยืนยันการยกเลิก',
        'คุณแน่ใจหรือไม่ ว่าต้องการยกเลิกรายการการจองบริการนี้?',
        [
          { text: 'ยกเลิก', style: 'cancel' },
          {
            text: 'ยกเลิกการจอง',
            style: 'destructive',
            onPress: async () => {
              try {
                await db.collection('bookings').doc(booking.id).update({ status: 'cancelled' });
                Alert.alert('ยกเลิกสำเร็จ', 'รายการการจองถูกยกเลิกแล้ว');
              } catch (error) {
                console.log('[CANCEL_BOOKING_ERROR]', error);
                Alert.alert('เกิดข้อผิดพลาด', 'ไม่สามารถยกเลิกการจองได้ กรุณาลองใหม่อีกครั้ง');
              }
            },
          },
        ],
      );
    };

    return (
      <TouchableOpacity
        style={[styles.card, isSingleCard && styles.cardSingle]}
        activeOpacity={0.7}
        onPress={handleCardPress}
      >
        <TouchableOpacity
          style={styles.trashButton}
          activeOpacity={0.7}
          onPress={(event) => {
            event.stopPropagation();
            handleDeleteBooking();
          }}
        >
          <Ionicons name="trash-outline" size={18} color={colors.destructive} />
        </TouchableOpacity>
        <View style={styles.rightBar} />
        <View style={styles.row}>
          <View style={styles.iconContainer}>
            <Ionicons name="time" size={25} color={colors.mutedForeground} />
          </View>
          <View style={styles.content}>
            <Text style={styles.dateTime}>
              {booking.dateBooking} | {booking.timeBooking}
            </Text>
            <Text style={styles.locationText}>
              <Text style={styles.labelBold}>จาก: </Text>
              {booking.from}
            </Text>
            <Text style={styles.locationSubText}>
              <Text style={styles.labelBold}>ถึง: </Text>
              {booking.to}
            </Text>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>ระยะทาง</Text>
              <Text style={styles.detailValue}>{booking.distance.toFixed(1)} กม.</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>ค่าบริการ</Text>
              <Text style={styles.detailValue}>{booking.fare.toLocaleString()} บาท</Text>
            </View>
          </View>
        </View>
        <View style={styles.footer}>
          <View style={styles.footerContent}>
            <View style={[styles.badge, { backgroundColor: `${badgeColor}1A` }]}>
              <Text style={[styles.badgeText, { color: badgeColor }]}>{caregiverLabel}</Text>
            </View>
            <Text style={styles.tapHint}>แตะเพื่อดูรายละเอียด</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>การจองที่กำลังจะมาถึง</Text>
      {upcomingList.length > 1 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          scrollEventThrottle={16}
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
        >
          {upcomingList.map((booking) => (
            <BookingCard key={booking.id} booking={booking} />
          ))}
        </ScrollView>
      ) : (
        <BookingCard booking={upcomingList[0]} isSingleCard={true} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
  },
  emptyText: {
    fontFamily: 'Prompt_400Regular',
    fontSize: 14,
    color: colors.mutedForeground,
  },
  sectionTitle: {
    fontFamily: 'Prompt_700Bold',
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.foreground,
    marginBottom: 12,
  },
  scrollContainer: {
    marginHorizontal: -16,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
    paddingRight: 24,
    borderColor: colors.border,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    width: 320,
    overflow: 'hidden',
  },
  rightBar: {
  position: 'absolute',
  right: 0,
  top: 0,
  bottom: 0,
  width: 10, // ปรับความหนาได้
  backgroundColor: colors.primary,
},
  cardSingle: {
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  iconContainer: {
    width: 30,
    height: 30,
    borderRadius: 18,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  dateTime: {
    fontFamily: 'Prompt_600SemiBold',
    fontSize: 15,
    fontWeight: '600',
    color: colors.foreground,
  },
  locationText: {
    fontFamily: 'Prompt_400Regular',
    fontSize: 13,
    lineHeight: 18,
    color: colors.mutedForeground,
    marginTop: 6,
  },
  locationSubText: {
    fontFamily: 'Prompt_400Regular',
    fontSize: 13,
    lineHeight: 18,
    color: colors.mutedForeground,
    marginTop: 6,
  },
  labelBold: {
    fontFamily: 'Prompt_700Bold',
    fontSize: 13,
    color: colors.foreground,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  detailLabel: {
    fontFamily: 'Prompt_400Regular',
    fontSize: 12,
    color: colors.mutedForeground,
  },
  detailValue: {
    fontFamily: 'Prompt_600SemiBold',
    fontSize: 14,
    color: colors.primary,
  },
  footer: {
    marginTop: 10,
    width: '100%',
  },
  footerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  trashButton: {
    position: 'absolute',
    top: 6,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    zIndex: 2,
  },
  badge: {
    backgroundColor: `${colors.primary}1A`,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
    alignSelf: 'flex-end',
  },
  badgeText: {
    fontFamily: 'Prompt_500Medium',
    fontSize: 12,
    fontWeight: '500',
    color: colors.primary,
  },
  tapHint: {
    fontFamily: 'Prompt_400Regular',
    fontSize: 11,
    color: colors.mutedForeground,
    marginTop: 6,
  },
});

export default UpcomingBooking;
