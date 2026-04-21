import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import colors from '../theme/colors';

interface WaveHeaderProps {
  children?: React.ReactNode;
  height?: number;
}

const { width } = Dimensions.get('window');

const WaveHeader: React.FC<WaveHeaderProps> = ({ children, height = 180 }) => {
  return (
    <View style={[styles.container, { height }]}>
      <View style={styles.content}>{children}</View>
      <Svg
        width={width}
        height={60}
        viewBox="0 0 1440 120"
        style={styles.wave}
        preserveAspectRatio="none"
      >
        <Path
          d="M0 120L60 110C120 100 240 80 360 75C480 70 600 80 720 85C840 90 960 90 1080 85C1200 80 1320 70 1380 65L1440 60V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z"
          fill={colors.background}
        />
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.primary,
    overflow: 'hidden',
  },
  content: {
    flex: 1,
    zIndex: 1,
  },
  wave: {
    position: 'absolute',
    bottom: 0,
    left: 0,
  },
});

export default WaveHeader;
