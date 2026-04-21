import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../theme/colors';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 48;
const CARD_MARGIN = 8;

interface Promotion {
  id: string;
  title: string;
  description: string;
  discount: string;
  color: string;
  icon: string;
}

const promotions: Promotion[] = [
  {
    id: '1',
    title: 'ส่วนลด 20%',
    description: 'สำหรับผู้ใช้งานครั้งแรก',
    discount: '20%',
    color: '#FF6B6B',
    icon: 'gift',
  },
  {
    id: '2',
    title: 'ฟรีค่าบริการ',
    description: 'เมื่อจองมากกว่า 5 ครั้ง',
    discount: 'FREE',
    color: '#4ECDC4',
    icon: 'star',
  },
  {
    id: '3',
    title: 'ลด 100 บาท',
    description: 'สำหรับการเดินทางระยะไกล',
    discount: '฿100',
    color: '#95E1D3',
    icon: 'car',
  },
  {
    id: '4',
    title: 'ส่วนลด 15%',
    description: 'ใช้บริการในวันหยุด',
    discount: '15%',
    color: '#F38181',
    icon: 'calendar',
  },
];

const PromotionCarousel: React.FC = () => {
  const scrollViewRef = useRef<ScrollView>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % promotions.length;
        scrollViewRef.current?.scrollTo({
          x: nextIndex * (CARD_WIDTH + CARD_MARGIN * 2),
          animated: true,
        });
        return nextIndex;
      });
    }, 3000); // เลื่อนทุก 3 วินาที

    return () => clearInterval(interval);
  }, []);

  const handleScroll = (event: any) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / (CARD_WIDTH + CARD_MARGIN * 2));
    setCurrentIndex(index);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>โปรโมชั่นพิเศษ</Text>
        <TouchableOpacity>
          <Text style={styles.seeAll}>ดูทั้งหมด</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled={false}
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        decelerationRate="fast"
        snapToInterval={CARD_WIDTH + CARD_MARGIN * 2}
        contentContainerStyle={styles.scrollContent}
      >
        {promotions.map((promo) => (
          <TouchableOpacity
            key={promo.id}
            style={[styles.card, { backgroundColor: promo.color }]}
            activeOpacity={0.9}
          >
            <View style={styles.cardContent}>
              <View style={styles.iconContainer}>
                <Ionicons name={promo.icon as any} size={32} color={colors.white} />
              </View>
              <View style={styles.textContainer}>
                <Text style={styles.cardTitle}>{promo.title}</Text>
                <Text style={styles.cardDescription}>{promo.description}</Text>
              </View>
              <View style={styles.discountBadge}>
                <Text style={styles.discountText}>{promo.discount}</Text>
                <Text style={styles.offText}>OFF</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.pagination}>
        {promotions.map((_, index) => (
          <View
            key={index}
            style={[
              styles.paginationDot,
              index === currentIndex && styles.paginationDotActive,
            ]}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  title: {
    fontFamily: 'Prompt_700Bold',

    fontSize: 18,
    fontWeight: 'bold',
    color: colors.foreground,
  },
  seeAll: {
    fontFamily: 'Prompt_500Medium',

    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
  },
  scrollContent: {
    paddingHorizontal: 24,
    gap: CARD_MARGIN * 2,
  },
  card: {
    width: CARD_WIDTH,
    borderRadius: 16,
    padding: 20,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
  },
  cardTitle: {
    fontFamily: 'Prompt_700Bold',

    fontSize: 18,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 4,
  },
  cardDescription: {
    fontFamily: 'Prompt_400Regular',

    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  discountBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: 'center',
  },
  discountText: {
    fontFamily: 'Prompt_700Bold',

    fontSize: 18,
    fontWeight: 'bold',
    color: colors.white,
  },
  offText: {
    fontFamily: 'Prompt_600SemiBold',

    fontSize: 10,
    color: colors.white,
    fontWeight: '600',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    gap: 6,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
  },
  paginationDotActive: {
    width: 24,
    backgroundColor: colors.primary,
  },
});

export default PromotionCarousel;
