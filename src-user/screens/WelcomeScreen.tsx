import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../navigation/AppNavigator';
import Button from '../components/ui/button';
import colors from '../theme/colors';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const WelcomeScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>welcome</Text>
      </View>

      <View style={styles.buttonContainer}>
        <Button
          variant="outline"
          onPress={() => navigation.navigate('Login')}
          style={styles.button}
        >
          <View style={styles.buttonContent}>
            <Text style={styles.buttonText}>เข้าสู่ระบบ</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.primary} />
          </View>
        </Button>

        <Button
          onPress={() => navigation.navigate('SignUp')}
          style={styles.button}
        >
          <View style={styles.buttonContent}>
            <Text style={styles.buttonTextWhite}>ลงทะเบียน</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.white} />
          </View>
        </Button>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray50,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 44,
  },
  content: {
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    fontFamily: 'Prompt_500Medium',

    fontSize: 24,
    fontWeight: '500',
    color: colors.gray800,
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 320,
    gap: 16,
  },
  button: {
    width: '100%',
    height: 52,
    borderRadius: 8,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    
  },
  buttonText: {
    fontFamily: 'Prompt_400Regular',

    fontSize: 16,
    color: colors.primary,
  },
  buttonTextWhite: {
    fontFamily: 'Prompt_400Regular',

    fontSize: 16,
    color: colors.white,
  },
});

export default WelcomeScreen;
