import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BookingCard from '../components/BookingCard';
import PromotionCarousel from '../components/PromotionCarousel';
import StatCards from '../components/StatCards';
import UpcomingBooking from '../components/UpcomingBooking';
import WaveHeader from '../components/WaveHeader';
import { auth, db } from '../firebase';
import { RootStackParamList } from '../navigation/AppNavigator';
import colors from '../theme/colors';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface HomeUser {
  fullName: string;
  profileImage?: string;
}

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [user, setUser] = useState<HomeUser | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.log('[HOME_USER_NOT_LOGGED_IN]');
      setUser(null);
      setLoadingUser(false);
      return;
    }

    const userUnsub = db.collection('users').doc(currentUser.uid)
      .onSnapshot(userDoc => {
        if (userDoc.exists) {
          const userData = userDoc.data();
          setUser({
            fullName: userData?.fullName ,
            profileImage: userData?.profileImage,
          });
        } else {
          console.log('[HOME_USER_DOC_NOT_FOUND]');
          setUser(null);
        }
        setLoadingUser(false);
      }, (e) => {
        console.log('[HOME_USER_LOAD_EXCEPTION]', e);
        setUser(null);
        setLoadingUser(false);
      });

    const notifUnsub = db.collection('notifications')
      .where('userId', '==', currentUser.uid)
      .onSnapshot(snapshot => {
        const unread = snapshot.docs.filter(doc => !doc.data().read).length;
        setUnreadCount(unread);
      }, (e) => {
        console.log('[HOME_NOTIFICATIONS_LOAD_EXCEPTION]', e);
      });

    return () => {
      userUnsub();
      notifUnsub();
    };
  }, []);

  const displayName = user?.fullName ?? '';

  return (
    <View style={styles.container}>
      <WaveHeader height={180}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerContent}>
            <View style={styles.userInfo}>
              <TouchableOpacity onPress={() => navigation.navigate('MainTabs', { screen: 'Profile' } as any)}>
                {user?.profileImage ? (
                  <Image source={{ uri: user.profileImage }} style={styles.avatar} />
                ) : (
                  <View style={[styles.avatar, styles.avatarPlaceholder]}>
                    <Text style={styles.avatarText}>{displayName.charAt(0).toUpperCase()}</Text>
                  </View>
                )}
              </TouchableOpacity>
              <View style={styles.greeting}>
                <Text style={styles.greetingText}>สวัสดี</Text>
                {loadingUser ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <Text style={styles.fullname}>{displayName} !</Text>
                )}
                <Text style={styles.welcomeBack}>ยินดีต้อนรับกลับมา</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.notificationButton}
              onPress={() => navigation.navigate('Notifications')}
            >
              <Ionicons name="notifications" size={20} color={colors.white} />
              {unreadCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </WaveHeader>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <BookingCard />
        <PromotionCarousel />
        <UpcomingBooking />
        <StatCards />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  avatarPlaceholder: {
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: 'Prompt_700Bold',
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
  },
  greeting: {
    gap: 2,
  },
  greetingText: {
    fontFamily: 'Prompt_400Regular',
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  fullname: {
    fontFamily: 'Prompt_700Bold',
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.white,
  },
  welcomeBack: {
    fontFamily: 'Prompt_400Regular',
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.76)',
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.destructive,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontFamily: 'Prompt_700Bold',
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.white,
  },
  content: {
    flex: 1,
    marginTop: -24,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
});

export default HomeScreen;
