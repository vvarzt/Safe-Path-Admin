import React from 'react';
import { Text as RNText, TextProps as RNTextProps, StyleSheet } from 'react-native';
import { fonts } from '../../theme/fonts';

interface TextProps extends RNTextProps {
  weight?: 'regular' | 'medium' | 'semiBold' | 'bold';
}

export const Text: React.FC<TextProps> = ({ style, weight = 'regular', ...props }) => {
  const fontFamily = fonts[weight];
  return <RNText style={[styles.text, { fontFamily }, style]} {...props} />;
};

const styles = StyleSheet.create({
  text: {
    fontFamily: fonts.regular,
  },
});

export default Text;
