import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ServiceHistoryItem from '../components/ServiceHistoryItem';
import { auth, db } from '../firebase';
import { RootStackParamList } from '../navigation/AppNavigator';
import colors from '../theme/colors';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type TabType = 'all' | 'pending' | 'completed' | 'cancelled';

interface HistoryBooking {
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

const HistoryScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [history, setHistory] = useState<HistoryBooking[]>([]);
  const [loading, setLoading] = useState(false);
  const [counts, setCounts] = useState({ all: 0, pending: 0, completed: 0, cancelled: 0 });

  const tabs: { key: TabType; label: string }[] = [
    { key: 'all', label: `ทั้งหมด(${counts.all})` },
    { key: 'pending', label: `กำลังดำเนินการ(${counts.pending})` },
    { key: 'completed', label: `เสร็จสิ้น(${counts.completed})` },
    { key: 'cancelled', label: `ยกเลิก(${counts.cancelled})` },
  ];

  const tabColors: Record<TabType, string> = {
    all: colors.primary,
    pending: colors.warning,
    completed: colors.success,
    cancelled: colors.destructive,
  };

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.log('[HISTORY_USER_NOT_LOGGED_IN]');
      setHistory([]);
      return;
    }

    setLoading(true);
    const unsubscribe = db.collection('bookings')
      .where('userId', '==', currentUser.uid)
      .onSnapshot(snapshot => {
        const bookings = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            date: data.dateBooking || '',
            time: data.timeBooking || '',
            from: data.fromAddress || '',
            to: data.toAddress || '',
            caregiver: data.caregiverStatus || 'pending',
            price: data.fare || 0,
            status: data.status || 'pending',
            rating: 0,
          };
        });

        // เรียงตามวันที่และเวลาที่ใกล้ถึง (ascending)
        const sorted = bookings.sort((a, b) => {
          const dateA = new Date(`${a.date}T${a.time}`);
          const dateB = new Date(`${b.date}T${b.time}`);
          return dateA.getTime() - dateB.getTime();
        });

        setHistory(sorted);

        // คำนวณจำนวนสำหรับแต่ละสถานะ
        const allCount = sorted.length;
        const pendingCount = sorted.filter(b => b.status === 'pending').length;
        const completedCount = sorted.filter(b => b.status === 'completed').length;
        const cancelledCount = sorted.filter(b => b.status === 'cancelled').length;
        setCounts({ all: allCount, pending: pendingCount, completed: completedCount, cancelled: cancelledCount });

        setLoading(false);
      }, (e) => {
        console.log('[HISTORY_LOAD_EXCEPTION]', e);
        setHistory([]);
        setLoading(false);
      });

    return () => unsubscribe();
  }, []);

  const filteredHistory = history.filter((booking) => {
    if (activeTab === 'all') return true;
    return booking.status === activeTab;
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.navigate('MainTabs', { screen: 'Home' } as any)}
        >
          <Ionicons name="arrow-back" size={20} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>ประวัติการใช้บริการ</Text>
      </View>

      <View style={styles.tabContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tab,
              activeTab === tab.key && { backgroundColor: tabColors[tab.key] }
            ]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === tab.key && styles.tabTextActive
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredHistory}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <ServiceHistoryItem booking={item} index={index} />
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {loading ? 'กำลังโหลดประวัติการใช้บริการ...' : 'ไม่พบประวัติการใช้บริการ'}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: colors.card,
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: 'Prompt_700Bold',

    fontSize: 20,
    fontWeight: 'bold',
    color: colors.foreground,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingVertical: 12,
    backgroundColor: colors.card,
    gap: 6,
  },

  tab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: colors.secondary,
    flexShrink: 0,
  },
  tabActive: {
    backgroundColor: colors.primary,
  },
  tabText: {
    fontFamily: 'Prompt_400Regular',

    fontSize: 12,
    fontWeight: '500',
    color: colors.mutedForeground,
  },
  tabTextActive: {
    color: colors.white,
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontFamily: 'Prompt_400Regular',

    fontSize: 14,
    color: colors.mutedForeground,
  },
});

export default HistoryScreen;
