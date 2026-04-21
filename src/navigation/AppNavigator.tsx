import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import colors from '../theme/colors';

// Screens
import Booking1Screen from '../screens/Booking1Screen';
import Booking2Screen from '../screens/Booking2Screen';
import Booking3Screen from '../screens/Booking3Screen';
import Booking4Screen from '../screens/Booking4Screen';
import BookingDetailScreen from '../screens/BookingDetailScreen';
import BookingHistoryScreen from '../screens/BookingHistoryScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import HistoryScreen from '../screens/HistoryScreen';
import HomeScreen from '../screens/HomeScreen';
import LoginScreen from '../screens/LoginScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import PaymentScreen from '../screens/PaymentScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SettingsScreen from '../screens/SettingsScreen';
import SignUp2Screen from '../screens/SignUp2Screen';

import SignUp4Screen from '../screens/SignUp4Screen';
import SignUpPinScreen from '../screens/SignUpPinScreen';
import SignUpScreen from '../screens/SignUpScreen';
import WelcomeScreen from '../screens/WelcomeScreen';

export type RootStackParamList = {
  Welcome: undefined;
  Login: undefined;
  SignUp: undefined;
  SignUp2: undefined;
  SignUp4: undefined;
  SignUpPin: { mode?: 'set' | 'verify' };
  MainTabs: undefined;
  Notifications: undefined;
  EditProfile: undefined;
  BookingDetail: { id: string };
  BookingHistory: undefined;
  Booking1: undefined;
  Booking2: { fromLocation?: any; toLocation?: any; fromAddress?: string; toAddress?: string };
  Booking3: undefined;
  Booking4: undefined;
  Payment: undefined;
};

export type TabParamList = {
  Home: undefined;
  History: undefined;
  Profile: undefined;
  Settings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

function BottomTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          height: 72,
          paddingBottom: 14,
          paddingTop: 10,
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home';

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'History') {
            iconName = focused ? 'time' : 'time-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          } else if (route.name === 'Settings') {
            iconName = focused ? 'settings' : 'settings-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarLabel: 'หน้าหลัก' }} />
      <Tab.Screen name="History" component={HistoryScreen} options={{ tabBarLabel: 'ประวัติ' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarLabel: 'โปรไฟล์' }} />
      <Tab.Screen name="Settings" component={SettingsScreen} options={{ tabBarLabel: 'ตั้งค่า' }} />
    </Tab.Navigator>
  );
}

export default function AppNavigator({ initialRoute = 'Welcome' }: { initialRoute?: keyof RootStackParamList }) {
  return (
    <Stack.Navigator initialRouteName={initialRoute}>
      <Stack.Screen name="Welcome" component={WelcomeScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
      <Stack.Screen name="SignUp" component={SignUpScreen} options={{ headerShown: false }} />
      <Stack.Screen name="SignUp2" component={SignUp2Screen} options={{ headerShown: false }} />
      <Stack.Screen name="SignUp4" component={SignUp4Screen} options={{ headerShown: false }} />
      <Stack.Screen name="SignUpPin" component={SignUpPinScreen} options={{ headerShown: false }} />
      <Stack.Screen name="MainTabs" component={BottomTabs} options={{ headerShown: false }} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ headerShown: false }} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ headerShown: false }} />
      <Stack.Screen name="BookingDetail" component={BookingDetailScreen} options={{ headerShown: false }} />
      <Stack.Screen name="BookingHistory" component={BookingHistoryScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Booking1" component={Booking1Screen} options={{ headerShown: false }} />
      <Stack.Screen name="Booking2" component={Booking2Screen} options={{ headerShown: false }} />
      <Stack.Screen name="Booking3" component={Booking3Screen} options={{ headerShown: false }} />
      <Stack.Screen name="Booking4" component={Booking4Screen} options={{ headerShown: false }} />
      <Stack.Screen name="Payment" component={PaymentScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}
