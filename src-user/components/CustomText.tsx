import React from 'react';
import { Text as RNText, TextProps, StyleSheet } from 'react-native';

interface CustomTextProps extends TextProps {
  weight?: 'regular' | 'medium' | 'semiBold' | 'bold';
}

const CustomText: React.FC<CustomTextProps> = ({ style, weight = 'regular', ...props }) => {
  const fontFamily = {
    regular: 'Prompt_400Regular',
    medium: 'Prompt_500Medium',
    semiBold: 'Prompt_600SemiBold',
    bold: 'Prompt_700Bold',
  }[weight];

  return <RNText style={[{ fontFamily }, style]} {...props} />;
};

export default CustomText;
