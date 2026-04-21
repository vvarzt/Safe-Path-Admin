import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, Keyboard, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

let MapView: any = null;
let Marker: any = null;

// Basic Region type used when react-native-maps types are not available
type Region = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};

try {
  const maps = require('react-native-maps');
  MapView = maps.default ?? maps;
  Marker = maps.Marker;
} catch (e) {
  console.log('[MAPS] Native module not available', e);
}

import * as ExpoLocation from 'expo-location';
import hospitalData from '../../hospital-data.json';
import Button from '../components/ui/button';
import { RootStackParamList } from '../navigation/AppNavigator';
import { clearPendingBooking, setPendingBooking } from '../services/bookingStore';
import colors from '../theme/colors';
import { calculateDistanceAndFare } from '../utils/distanceCalculator';



type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

type HospitalData = {
  name: string;
  fullName?: string;
  address: string;
  lat: number;
  lng: number;
  type?: string;
};

type Hospital = HospitalData & {
  id: string;
};

const hospitals: Hospital[] = (hospitalData as HospitalData[]).map((hospital, index) => ({
  id: `${hospital.name}-${hospital.lat}-${hospital.lng}-${index}`,
  ...hospital,
}));

// ฟังก์ชันค้นหาโรงพยาบาลจาก Backend API (serverhospital.js)
const searchHospitalsFromBackend = async (query: string): Promise<Hospital[]> => {
  if (!query.trim()) return [];

  try {
    const response = await fetch(
      `http://192.168.1.51:3000/api/search-hospitals?q=${encodeURIComponent(query)}`
    );

    const data = await response.json();

    return data.map((item: any) => ({
      id: item.id,
      name: item.name,
      fullName: item.name,
      address: item.address,
      lat: item.lat,
      lng: item.lng,
      type: 'hospital',
    }));
  } catch (error) {
    console.log('Backend API error:', error);
    return [];
  }
};


type GeoLocation = {
  lat: number;
  lng: number;
  address?: string;
};

const { width } = Dimensions.get('window');

const getDistance = (
  from: { latitude: number; longitude: number },
  to: { latitude: number; longitude: number }
) => {
  const R = 6371; // รัศมีโลก (km)

  const dLat = (to.latitude - from.latitude) * Math.PI / 180;
  const dLon = (to.longitude - from.longitude) * Math.PI / 180;

  const lat1 = from.latitude * Math.PI / 180;
  const lat2 = to.latitude * Math.PI / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // km
};

const Booking1Screen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const mapRef = useRef<any>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const [fromAddress, setFromAddress] = useState('');
  const [toAddress, setToAddress] = useState('');
  const [fromLocation, setFromLocation] = useState<GeoLocation | null>(null);
  const [toLocation, setToLocation] = useState<GeoLocation | null>(null);
  const [currentLocation, setCurrentLocation] = useState<GeoLocation | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [searchingHospitals, setSearchingHospitals] = useState(false);
  const [fromSuggestions, setFromSuggestions] = useState<Hospital[]>([]);
  const [toSuggestions, setToSuggestions] = useState<Hospital[]>([]);
  const [showFromSuggestions, setShowFromSuggestions] = useState(false);
  const [showToSuggestions, setShowToSuggestions] = useState(false);
  const [distance, setDistance] = useState<number>(0);
  const [fare, setFare] = useState<number>(0);
  const [region, setRegion] = useState<Region>({
    latitude: 13.7563,
    longitude: 100.5018,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });

  useEffect(() => {
    clearPendingBooking();
    getCurrentLocation();
  }, []);

  useEffect(() => {
    if (showFromSuggestions || showToSuggestions) {
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({ y: width * 0.72 + 100, animated: true });
      }, 100);
    }
  }, [showFromSuggestions, showToSuggestions]);

  const getCurrentLocation = async () => {
    try {
      setLoadingLocation(true);

      // ขอ permission
      const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('ไม่ได้รับอนุญาต', 'กรุณาอนุญาตให้แอปเข้าถึงตำแหน่งของคุณ');
        return;
      }

      // ดึงตำแหน่งปัจจุบัน
      const location = await ExpoLocation.getCurrentPositionAsync({
        accuracy: ExpoLocation.Accuracy.Balanced,
      });

      const currentLoc: GeoLocation = {
        lat: location.coords.latitude,
        lng: location.coords.longitude,
      };

      setCurrentLocation(currentLoc);

      // อัปเดตแมพให้แสดงตำแหน่งปัจจุบัน
      const newRegion = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
      setRegion(newRegion);
      mapRef.current?.animateToRegion(newRegion, 1000);

      // ดึงชื่อสถานที่จากพิกัด
      const addresses = await ExpoLocation.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (addresses.length > 0) {
        const addr = addresses[0];
        const addressString = `${addr.street || ''} ${addr.district || ''} ${addr.city || ''} ${addr.region || ''}`.trim();
        currentLoc.address = addressString;
      }

      setCurrentLocation(currentLoc);
    } catch (error) {
      console.log('[LOCATION_ERROR]', error);
      Alert.alert('ข้อผิดพลาด', 'ไม่สามารถดึงตำแหน่งปัจจุบันได้');
    } finally {
      setLoadingLocation(false);
    }
  };

  const useCurrentLocationAsOrigin = () => {
    if (!currentLocation) {
      Alert.alert('ไม่พบตำแหน่ง', 'กรุณารอสักครู่แล้วลองใหม่อีกครั้ง');
      return;
    }
    setFromLocation(currentLocation);
    setFromAddress(currentLocation.address || 'ตำแหน่งปัจจุบัน');
    setShowFromSuggestions(false);
    Alert.alert('สำเร็จ', 'ใช้ตำแหน่งปัจจุบันเป็นต้นทางแล้ว');
  };


  const searchHospitals = async (query: string, isOrigin: boolean) => {
    if (query.length < 1) {
      if (isOrigin) {
        setFromSuggestions([]);
        setShowFromSuggestions(false);
      } else {
        setToSuggestions([]);
        setShowToSuggestions(false);
      }
      return;
    }

    setSearchingHospitals(true);

    try {
      // เรียก Backend API
      const apiResults = await searchHospitalsFromBackend(query);

      // รวมกับข้อมูล local ถ้าต้องการ
      const localResults = hospitals.filter((hospital) =>
        hospital.name.toLowerCase().includes(query.toLowerCase()) ||
        hospital.fullName?.toLowerCase().includes(query.toLowerCase()) ||
        hospital.address.toLowerCase().includes(query.toLowerCase())
      );

      // รวมผลลัพธ์และเอาเฉพาะไม่ซ้ำ
      const allResults = [...apiResults, ...localResults];
      const uniqueResults = allResults.filter(
        (hospital, index, self) =>
          index === self.findIndex((h) => h.name === hospital.name && h.address === hospital.address)
      ).slice(0, 10); // จำกัด 10 รายการ

      if (isOrigin) {
        setFromSuggestions(uniqueResults);
        setShowFromSuggestions(uniqueResults.length > 0);
      } else {
        setToSuggestions(uniqueResults);
        setShowToSuggestions(uniqueResults.length > 0);
      }
    } catch (error) {
      console.log('Search hospitals error:', error);
      // Fallback ใช้ข้อมูล local
      const localResults = hospitals.filter((hospital) =>
        hospital.name.toLowerCase().includes(query.toLowerCase()) ||
        hospital.fullName?.toLowerCase().includes(query.toLowerCase()) ||
        hospital.address.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 10);

      if (isOrigin) {
        setFromSuggestions(localResults);
        setShowFromSuggestions(localResults.length > 0);
      } else {
        setToSuggestions(localResults);
        setShowToSuggestions(localResults.length > 0);
      }
    } finally {
      setSearchingHospitals(false);
    }
  };

  // เลือกโรงพยาบาล
  const selectHospital = (hospital: Hospital, isOrigin: boolean) => {
    const location: GeoLocation = {
      lat: hospital.lat,
      lng: hospital.lng,
      address: `${hospital.name}, ${hospital.address}`,
    };

    if (isOrigin) {
      setFromLocation(location);
      setFromAddress(`${hospital.name}, ${hospital.address}`);
      setShowFromSuggestions(false);
    } else {
      setToLocation(location);
      setToAddress(`${hospital.name}, ${hospital.address}`);
      setShowToSuggestions(false);
    }
  };

  const handleFromAddressChange = (text: string) => {
    setFromAddress(text);
    searchHospitals(text, true);
  };

  const handleToAddressChange = (text: string) => {
    setToAddress(text);
    searchHospitals(text, false);
  };


  // คำนวณระยะทางและค่าโดยสารเมื่อมีทั้งต้นทางและปลายทาง
  useEffect(() => {
    if (fromLocation && toLocation) {
      const result = calculateDistanceAndFare(
        fromLocation.lat,
        fromLocation.lng,
        toLocation.lat,
        toLocation.lng
      );
      setDistance(result.distance);
      setFare(result.fare);
    } else {
      setDistance(0);
      setFare(0);
    }
  }, [fromLocation, toLocation]);

  const handleNext = () => {
    if (!fromAddress || !toAddress) {
      Alert.alert('แจ้งเตือน', 'กรุณาระบุสถานที่ต้นทางและปลายทาง');
      return;
    }
    if (!fromLocation || !toLocation) {
      Alert.alert('แจ้งเตือน', 'กรุณาเลือกสถานที่จาก dropdown');
      return;
    }

    const bookingData = {
      fromAddress,
      toAddress,
      fromLocation,
      toLocation,
      distance,
      fare,
    };

    // ✅ Log ข้อมูลการจอง
    console.log('[BOOKING_DATA]', bookingData);

    setPendingBooking(bookingData);
    navigation.navigate('Booking2' as any);
  };

  const steps = [
    { number: 1, active: true },
    { number: 2, active: false },
    { number: 3, active: false },
    { number: 4, active: false },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.navigate('MainTabs')}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>จองบริการ</Text>
      </View>

      <View style={styles.stepsContainer}>
        {steps.map((step, index) => (
          <View
            key={step.number}
            style={[styles.step, step.active && styles.stepActive]}
          >
            <Text style={[styles.stepText, step.active && styles.stepTextActive]}>
              {step.number}
            </Text>
          </View>
        ))}
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined} // 👈 เปลี่ยนตรงนี้
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            ref={scrollViewRef}
            style={styles.scrollView}
            contentContainerStyle={styles.contentScroll}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
          >
            <View style={styles.mapContainer}>
              {MapView ? (
                <MapView
                  ref={mapRef}
                  style={styles.map}
                  region={region}
                  onRegionChangeComplete={setRegion}
                >
                  {currentLocation && Marker && (
                    <Marker
                      coordinate={{
                        latitude: currentLocation.lat,
                        longitude: currentLocation.lng,
                      }}
                      title="ตำแหน่งปัจจุบัน"
                      description={currentLocation.address}
                      pinColor="blue"
                    />
                  )}
                  {fromLocation && Marker && (
                    <Marker
                      coordinate={{
                        latitude: fromLocation.lat,
                        longitude: fromLocation.lng,
                      }}
                      title="ต้นทาง"
                      pinColor={colors.primary}
                    />
                  )}
                  {toLocation && Marker && (
                    <Marker
                      coordinate={{
                        latitude: toLocation.lat,
                        longitude: toLocation.lng,
                      }}
                      title="ปลายทาง"
                      pinColor={colors.destructive}
                    />
                  )}
                </MapView>
              ) : (
                <View style={styles.mapPlaceholder}>
                  <Text style={styles.mapPlaceholderText}>แผนที่ถูกปิดใช้งานชั่วคราว (native module ไม่พร้อมใช้งาน)</Text>
                </View>
              )}
            </View>

            <View style={styles.formCard}>
              <View style={styles.inputContainer}>
                <View style={[styles.inputRow, { zIndex: 2 }]}>
                  <View style={[styles.dot, { backgroundColor: colors.primary }]} />
                  <View style={styles.inputWrapper}>
                    <View style={styles.labelRow}>
                      <Text style={styles.inputLabel}>ต้นทาง (รับผู้โดยสาร)</Text>
                      <TouchableOpacity
                        onPress={useCurrentLocationAsOrigin}
                        style={styles.locationButton}
                        disabled={loadingLocation}
                      >
                        {loadingLocation ? (
                          <ActivityIndicator size="small" color={colors.primary} />
                        ) : (
                          <>
                            <Ionicons name="locate" size={16} color={colors.primary} />
                            <Text style={styles.locationButtonText}>ใช้ตำแหน่งปัจจุบัน</Text>
                          </>
                        )}
                      </TouchableOpacity>
                    </View>
                    <View>
                      <TextInput
                        placeholder="พิมพ์ชื่อโรงพยาบาล"
                        value={fromAddress}
                        onChangeText={handleFromAddressChange}
                        onFocus={() => {
                          setTimeout(() => {
                            scrollViewRef.current?.scrollTo({ y: width * 0.75, animated: true });
                          }, 300);
                        }}
                        style={styles.textInput}
                      />
                      {showFromSuggestions && (
                        <ScrollView style={styles.suggestionsContainer} keyboardShouldPersistTaps="handled">
                          {searchingHospitals ? (
                            <View style={styles.loadingContainer}>
                              <ActivityIndicator size="small" color={colors.primary} />
                              <Text style={styles.loadingText}>กำลังค้นหา...</Text>
                            </View>
                          ) : (
                            <View style={styles.suggestionsList}>
                              {fromSuggestions.map((item) => (
                                <TouchableOpacity
                                  key={item.id}
                                  style={styles.suggestionItem}
                                  onPress={() => selectHospital(item, true)}
                                >
                                  <Ionicons name="medical" size={20} color={colors.primary} />
                                  <View style={styles.suggestionTextContainer}>
                                    <Text style={styles.suggestionMainText}>{item.name}</Text>
                                    <Text style={styles.suggestionSecondaryText}>{item.address}</Text>
                                  </View>
                                </TouchableOpacity>
                              ))}
                            </View>
                          )}
                        </ScrollView>
                      )}
                    </View>
                    <Text style={styles.helperText}>💡 กดปุ่ม "ใช้ตำแหน่งปัจจุบัน" หรือพิมพ์ชื่อโรงพยาบาล</Text>
                  </View>
                </View>

                <View style={[styles.inputRow, { zIndex: 1 }]}>
                  <View style={[styles.dot, { backgroundColor: colors.destructive }]} />
                  <View style={styles.inputWrapper}>
                    <Text style={styles.inputLabel}>ปลายทาง (ส่งผู้โดยสาร)</Text>
                    <View>
                      <TextInput
                        placeholder="พิมพ์ชื่อโรงพยาบาล"
                        value={toAddress}
                        onChangeText={handleToAddressChange}
                        onFocus={() => {
                          setTimeout(() => {
                            scrollViewRef.current?.scrollTo({ y: width * 0.9, animated: true });
                          }, 300);
                        }}
                        style={styles.textInput}
                      />
                      {showToSuggestions && (
                        <ScrollView style={styles.suggestionsContainer} keyboardShouldPersistTaps="handled">
                          {searchingHospitals ? (
                            <View style={styles.loadingContainer}>
                              <ActivityIndicator size="small" color={colors.primary} />
                              <Text style={styles.loadingText}>กำลังค้นหา...</Text>
                            </View>
                          ) : (
                            <View style={styles.suggestionsList}>
                              {toSuggestions.map((item) => (
                                <TouchableOpacity
                                  key={item.id}
                                  style={styles.suggestionItem}
                                  onPress={() => selectHospital(item, false)}
                                >
                                  <Ionicons name="medical" size={20} color={colors.primary} />
                                  <View style={styles.suggestionTextContainer}>
                                    <Text style={styles.suggestionMainText}>{item.name}</Text>
                                    <Text style={styles.suggestionSecondaryText}>{item.address}</Text>
                                  </View>
                                </TouchableOpacity>
                              ))}
                            </View>
                          )}
                        </ScrollView>
                      )}
                    </View>
                    <Text style={styles.helperText}>💡 พิมพ์ชื่อโรงพยาบาล</Text>
                  </View>
                </View>
              </View>

              {distance > 0 && fare > 0 && (
                <View style={styles.fareContainer}>
                  <View style={styles.fareRow}>
                    <Ionicons name="navigate" size={20} color={colors.primary} />
                    <Text style={styles.fareLabel}>ระยะทาง:</Text>
                    <Text style={styles.fareValue}>{distance.toFixed(1)} กม.</Text>
                  </View>
                  <View style={styles.fareRow}>
                    <Ionicons name="cash" size={20} color={colors.primary} />
                    <Text style={styles.fareLabel}>ค่าโดยสาร:</Text>
                    <Text style={styles.fareValue}>{fare.toLocaleString()} บาท</Text>
                  </View>
                  <View style={styles.fareNote}>
                    <Text style={styles.fareNoteText}>💡 คิดค่าโดยสาร 50 บาท/กิโลเมตร</Text>
                  </View>
                </View>
              )}

              <Button onPress={handleNext} style={styles.nextButton}>
                ต่อไป
              </Button>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
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
  stepsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  step: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepActive: {
    backgroundColor: colors.primary,
  },
  stepText: {
    fontFamily: 'Prompt_600SemiBold',

    fontSize: 16,
    fontWeight: '600',
    color: colors.mutedForeground,
  },
  stepTextActive: {
    color: colors.white,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  contentScroll: {
    flexGrow: 1,
    paddingBottom: 150, // เพิ่มจาก 30 → 150
    paddingHorizontal: 24,
  },
  mapContainer: {
    height: width * 0.72,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 20,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  formCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  inputContainer: {
    gap: 32,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 32,
  },
  inputWrapper: {
    flex: 1,
    position: 'relative',
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  inputLabel: {
    fontFamily: 'Prompt_500Medium',

    fontSize: 14,
    fontWeight: '500',
    color: colors.foreground,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: colors.primary + '15',
  },
  locationButtonText: {
    fontFamily: 'Prompt_500Medium',

    fontSize: 12,
    color: colors.primary,
    fontWeight: '500',
  },
  helperText: {
    fontFamily: 'Prompt_400Regular',

    fontSize: 12,
    color: colors.mutedForeground,
    marginTop: 4,
  },
  input: {
    marginBottom: 0,
  },
  textInput: {
    fontFamily: 'Prompt_400Regular',
    height: 48,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    color: colors.foreground,
    backgroundColor: colors.card,
  },
  suggestionsContainer: {
    position: 'absolute',
    top: 56,
    left: 0,
    right: 0,
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    maxHeight: 240,
    paddingVertical: 8,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 10,
    zIndex: 1000,
  },
  suggestionsList: {
    flex: 1,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  loadingText: {
    fontFamily: 'Prompt_400Regular',
    fontSize: 12,
    color: colors.mutedForeground,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  suggestionTextContainer: {
    flex: 1,
  },
  suggestionMainText: {
    fontFamily: 'Prompt_500Medium',
    fontSize: 14,
    color: colors.foreground,
    marginBottom: 2,
  },
  suggestionSecondaryText: {
    fontFamily: 'Prompt_400Regular',
    fontSize: 12,
    color: colors.mutedForeground,
  },
  fareContainer: {
    marginTop: 24,
    padding: 16,
    backgroundColor: colors.primary + '10',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary + '30',
  },
  fareRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  fareLabel: {
    fontFamily: 'Prompt_500Medium',
    fontSize: 14,
    color: colors.foreground,
    flex: 1,
  },
  fareValue: {
    fontFamily: 'Prompt_700Bold',
    fontSize: 16,
    color: colors.primary,
  },
  fareNote: {
    marginTop: 4,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  fareNoteText: {
    fontFamily: 'Prompt_400Regular',
    fontSize: 12,
    color: colors.mutedForeground,
    textAlign: 'center',
  },
  mapPlaceholder: {
    height: 200,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  mapPlaceholderText: {
    fontFamily: 'Prompt_400Regular',
    fontSize: 14,
    color: colors.mutedForeground,
    textAlign: 'center',
  },
  nextButton: {
    marginTop: 24,
  },
});

export default Booking1Screen;
