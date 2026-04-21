// Helper function to easily add Prompt font to any text style
export const withPromptFont = (style: any = {}, weight: 'regular' | 'medium' | 'semiBold' | 'bold' = 'regular') => {
  const fontFamily = {
    regular: 'Prompt_400Regular',
    medium: 'Prompt_500Medium',
    semiBold: 'Prompt_600SemiBold',
    bold: 'Prompt_700Bold',
  }[weight];

  return {
    ...style,
    fontFamily,
  };
};

// Export font families for direct use
export const fonts = {
  regular: 'Prompt_400Regular',
  medium: 'Prompt_500Medium',
  semiBold: 'Prompt_600SemiBold',
  bold: 'Prompt_700Bold',
};

export default fonts;
