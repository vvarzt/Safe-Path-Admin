import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ProfileInfo from '../components/ProfileInfo';
import WaveHeader from '../components/WaveHeader';
import { auth, db } from '../firebase';
import colors from '../theme/colors';

interface ProfileData {
  fullName?: string;
  email?: string;
  phone?: string;
  birthDate?: string;
  gender?: string;
  address?: string;
  profileImage?: string;
}

const ProfileScreen: React.FC = () => {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.log('[PROFILE_USER_NOT_LOGGED_IN]');
      setProfile(null);
      setLoading(false);
      return;
    }

    const unsubscribe = db.collection('users').doc(currentUser.uid)
      .onSnapshot(userDoc => {
        if (userDoc.exists) {
          const userData = userDoc.data();
          setProfile({
            fullName: userData?.fullName || '',
            email: userData?.email || currentUser.email || '',
            phone: userData?.phone || '',
            birthDate: userData?.birthDate || '',
            gender: userData?.gender || '',
            address: userData?.address || '',
            profileImage: userData?.profileImage,
          });
        } else {
          console.log('[PROFILE_DOC_NOT_FOUND]');
          setProfile(null);
        }
        setLoading(false);
      }, e => {
        console.log('[PROFILE_LOAD_EXCEPTION]', e);
        setProfile(null);
        setLoading(false);
      });

    return () => unsubscribe();
  }, []);

  const displayName = profile?.fullName ||  'ผู้ใช้ใหม่';

  return (
    <View style={styles.container}>
      <WaveHeader height={210}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerContent}>
            {profile?.profileImage ? (
              <Image source={{ uri: profile.profileImage }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Text style={styles.avatarText}>{displayName.charAt(0).toUpperCase()}</Text>
              </View>
            )}
          </View>
        </SafeAreaView>
      </WaveHeader>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.nameContainer}>
          <View style={styles.nameBadge}>
            {loading ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.name}>{displayName}</Text>
            )}
          </View>
        </View>

        <ProfileInfo />
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
    alignItems: 'center',
    paddingTop: 16,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.62)',
  },
  avatarPlaceholder: {
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: 'Prompt_700Bold',
    fontSize: 36,
    fontWeight: 'bold',
    color: colors.primary,
  },
  content: {
    flex: 1,
    marginTop: -24,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  nameContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  nameBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  name: {
    fontFamily: 'Prompt_700Bold',
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.white,
  },
});

export default ProfileScreen;
