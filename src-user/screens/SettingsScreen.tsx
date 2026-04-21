import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Linking } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RootStackParamList } from '../navigation/AppNavigator';
import Button from '../components/ui/button';
import colors from '../theme/colors';
import { clearAuthToken } from '../services/authStore';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface SettingItem {
  icon: string;
  label: string;
  onPress?: () => void;
}

interface SettingGroup {
  title: string;
  items: SettingItem[];
}

const SettingsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();

  const handleEditProfile = () => {
    navigation.navigate('EditProfile');
  };

  const handleNotifications = () => {
    navigation.navigate('Notifications');
  };

  const handlePrivacy = () => {
    Alert.alert('ความเป็นส่วนตัว', 'ข้อมูลของคุณได้รับการปกป้องด้วยมาตรฐานความปลอดภัยสูงสุด');
  };

  const handleLanguage = () => {
    Alert.alert('ภาษา', 'ปัจจุบันรองรับภาษาไทยเท่านั้น\nเร็วๆ นี้จะมีภาษาอังกฤษ');
  };

  const handleHelpCenter = () => {
    Alert.alert(
      'ศูนย์ช่วยเหลือ',
      'ติดต่อเรา:\n\nโทร: 02-123-4567\nอีเมล: support@safepath.com\nเวลาทำการ: จันทร์-ศุกร์ 9:00-18:00'
    );
  };

  const handleTerms = () => {
    Alert.alert(
      'เงื่อนไขการใช้งาน',
      'การใช้บริการนี้ถือว่าคุณยอมรับเงื่อนไขการใช้งานของเรา\n\n1. ผู้ใช้ต้องให้ข้อมูลที่ถูกต้อง\n2. ห้ามใช้บริการในทางที่ผิด\n3. บริษัทขอสงวนสิทธิ์ในการเปลี่ยนแปลงเงื่อนไข'
    );
  };

  const handlePrivacyPolicy = () => {
    Alert.alert(
      'นโยบายความเป็นส่วนตัว',
      'เราเก็บรักษาข้อมูลส่วนบุคคลของคุณอย่างปลอดภัย\n\n- ข้อมูลจะไม่ถูกแชร์กับบุคคลที่สาม\n- ใช้เพื่อการให้บริการเท่านั้น\n- คุณสามารถขอลบข้อมูลได้ตลอดเวลา'
    );
  };

  const settingGroups: SettingGroup[] = [
    {
      title: 'บัญชี',
      items: [
        { icon: '👤', label: 'ข้อมูลส่วนตัว', onPress: handleEditProfile },
        { icon: '🔔', label: 'การแจ้งเตือน', onPress: handleNotifications },
        { icon: '🔒', label: 'ความเป็นส่วนตัว', onPress: handlePrivacy },
      ],
    },
    {
      title: 'ทั่วไป',
      items: [
        { icon: '🌐', label: 'ภาษา', onPress: handleLanguage },
        { icon: '💬', label: 'ศูนย์ช่วยเหลือ', onPress: handleHelpCenter },
        { icon: '📑', label: 'เงื่อนไขการใช้งาน', onPress: handleTerms },
        { icon: '⚪', label: 'นโยบายความเป็นส่วนตัว', onPress: handlePrivacyPolicy },
      ],
    },
  ];

  const handleLogout = () => {
    Alert.alert(
      'ออกจากระบบ',
      'คุณต้องการออกจากระบบใช่หรือไม่?',
      [
        {
          text: 'ยกเลิก',
          style: 'cancel',
        },
        {
          text: 'ออกจากระบบ',
          style: 'destructive',
          onPress: () => {
            clearAuthToken();
            navigation.reset({
              index: 0,
              routes: [{ name: 'Welcome' }],
            });
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>การตั้งค่า</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {settingGroups.map((group, groupIndex) => (
          <View key={groupIndex} style={styles.group}>
            <Text style={styles.groupTitle}>{group.title}</Text>
            {group.items.map((item, itemIndex) => (
              <TouchableOpacity
                key={itemIndex}
                style={styles.settingItem}
                onPress={item.onPress}
              >
                <View style={styles.settingIconContainer}>
                  <Text style={styles.settingIcon}>{item.icon}</Text>
                </View>
                <Text style={styles.settingLabel}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}

        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>แพลตฟอร์มบริการรับ-ส่งผู้ป่วย</Text>
          <Text style={styles.versionText}>เวอร์ชัน 1.0.0</Text>
        </View>

        <View style={styles.logoutContainer}>
          <Button variant="destructive" onPress={handleLogout} style={styles.logoutButton}>
            ออกจากระบบ
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
    alignItems: 'center',
    paddingVertical: 20,
  },
  headerTitle: {
    fontFamily: 'Prompt_600SemiBold',

    fontSize: 18,
    fontWeight: '600',
    color: colors.white,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  group: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  groupTitle: {
    fontFamily: 'Prompt_600SemiBold',

    fontSize: 12,
    fontWeight: '600',
    color: colors.mutedForeground,
    marginBottom: 8,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  settingIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: `${colors.primary}1A`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingIcon: {
    fontFamily: 'Prompt_400Regular',

    fontSize: 12,
  },
  settingLabel: {
    fontFamily: 'Prompt_400Regular',

    fontSize: 14,
    color: colors.foreground,
  },
  versionContainer: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  versionText: {
    fontFamily: 'Prompt_400Regular',

    fontSize: 12,
    color: colors.mutedForeground,
  },
  logoutContainer: {
    marginBottom: 100,
  },
  logoutButton: {
    height: 48,
  },
});

export default SettingsScreen;
