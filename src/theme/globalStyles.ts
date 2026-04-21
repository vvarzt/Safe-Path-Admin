import { StyleSheet } from 'react-native';
import typography from './typography';

// Global text styles with Prompt font
export const globalTextStyles = StyleSheet.create({
  regular: {
    fontFamily: typography.fontFamily.regular,
  },
  medium: {
    fontFamily: typography.fontFamily.medium,
  },
  semiBold: {
    fontFamily: typography.fontFamily.semiBold,
  },
  bold: {
    fontFamily: typography.fontFamily.bold,
  },
});

// Helper function to apply default font to Text components
export const defaultTextStyle = {
  fontFamily: typography.fontFamily.regular,
};

export default globalTextStyles;
