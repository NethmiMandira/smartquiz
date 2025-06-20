import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Alert,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import auth from '@react-native-firebase/auth';
import { RootStackParamList } from '../type/navigation';

const { width, height } = Dimensions.get('window');

// Navigation types
type EmailVerificationScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'EmailVerification'
>;
type EmailVerificationScreenRouteProp = RouteProp<RootStackParamList, 'EmailVerification'>;

const EmailVerificationScreen: React.FC = () => {
  const navigation = useNavigation<EmailVerificationScreenNavigationProp>();
  const route = useRoute<EmailVerificationScreenRouteProp>();
  const { email } = route.params;

  const [isSending, setIsSending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const checkEmailVerification = async () => {
    const user = auth().currentUser;
    if (user) {
      await user.reload();
      if (user.emailVerified) {
        Alert.alert('Success', 'Email verified successfully!', [
          {
            text: 'Continue',
            onPress: () => {
              navigation.reset({
                index: 0,
                routes: [{ name: 'DashboardScreen' }],
              });
            },
          },
        ]);
      }
    }
  };

  const resendVerificationEmail = async () => {
    setIsSending(true);
    try {
      const user = auth().currentUser;
      if (user && !user.emailVerified) {
        await user.sendEmailVerification();
        Alert.alert(
          'Email Sent', 
          'A new verification email has been sent to your inbox. Please check your email and spam folder.',
          [{ text: 'OK' }]
        );
        setResendCooldown(3600); // 60 minutes = 3600 seconds
      } else {
        Alert.alert('Already Verified', 'Your email is already verified.');
      }
    } catch (error: any) {
      console.error('Resend Error:', error);
      Alert.alert('Error', error.message || 'Failed to send verification email.');
    } finally {
      setIsSending(false);
    }
  };

  // Format time display (MM:SS)
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Periodically check for verification
  useEffect(() => {
    const verificationInterval = setInterval(checkEmailVerification, 10000); // every 10 sec
    return () => clearInterval(verificationInterval);
  }, []);

  // Countdown timer for resend cooldown
  useEffect(() => {
    if (resendCooldown <= 0) return;

    const timer = setInterval(() => {
      setResendCooldown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [resendCooldown]);

  return (
    <View style={styles.container}>
      {/* Background Elements */}
      <View style={styles.backgroundContainer}>
        <View style={styles.backgroundCircle1} />
        <View style={styles.backgroundCircle2} />
        <View style={styles.backgroundCircle3} />
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        {/* Email Icon */}
        <View style={styles.iconContainer}>
          <Text style={styles.emailIcon}>📧</Text>
        </View>

        {/* Title */}
        <Text style={styles.title}>
          <Text style={styles.verify}>Verify</Text>
          <Text style={styles.email}> Your Email</Text>
        </Text>

        {/* Subtitle */}
        <Text style={styles.subtitle}>
          A verification link has been sent to:
        </Text>

        {/* Email Address */}
        <View style={styles.emailContainer}>
          <Text style={styles.emailAddress}>{email}</Text>
        </View>

        {/* Instructions */}
        <Text style={styles.instructions}>
          Please check your inbox and spam folder, then click the verification link to continue.
        </Text>

        {/* Status Indicator */}
        <View style={styles.statusContainer}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>Checking verification status...</Text>
        </View>

        {/* Resend Button */}
        <View style={styles.buttonContainer}>
          {isSending ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#7461EE" />
              <Text style={styles.loadingText}>Sending email...</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={[
                styles.resendButton,
                resendCooldown > 0 ? styles.buttonDisabled : styles.buttonActive,
              ]}
              onPress={resendVerificationEmail}
              disabled={resendCooldown > 0}
            >
              <Text style={[
                styles.buttonText,
                resendCooldown > 0 ? styles.buttonTextDisabled : styles.buttonTextActive
              ]}>
                {resendCooldown > 0
                  ? `Resend available in ${formatTime(resendCooldown)}`
                  : 'Resend Verification Email'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Timer Display */}
        {resendCooldown > 0 && (
          <View style={styles.timerContainer}>
            <Text style={styles.timerIcon}>⏱️</Text>
            <Text style={styles.timerText}>
              You can request a new verification email in {formatTime(resendCooldown)}
            </Text>
          </View>
        )}

        {/* Help Text */}
        <View style={styles.helpContainer}>
          <Text style={styles.helpText}>
            Didn't receive the email? Check your spam folder or try resending after the timer expires.
          </Text>
        </View>
      </View>
    </View>
  );
};

export default EmailVerificationScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFF',
  },
  backgroundContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  backgroundCircle1: {
    position: 'absolute',
    top: -100,
    right: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(116, 97, 238, 0.1)',
  },
  backgroundCircle2: {
    position: 'absolute',
    top: height * 0.3,
    left: -80,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255, 107, 107, 0.08)',
  },
  backgroundCircle3: {
    position: 'absolute',
    bottom: 100,
    right: -60,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(52, 211, 153, 0.1)',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: height * 0.1,
    alignItems: 'center',
    zIndex: 1,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(116, 97, 238, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emailIcon: {
    fontSize: 40,
  },
  title: {
    fontSize: width * 0.07,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: 16,
  },
  verify: {
    color: '#7461EE',
  },
  email: {
    color: '#FF6B6B',
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 12,
    fontWeight: '500',
  },
  emailContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(116, 97, 238, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  emailAddress: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    textAlign: 'center',
  },
  instructions: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
    paddingHorizontal: 12,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(52, 211, 153, 0.1)',
    borderRadius: 20,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#34D399',
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    color: '#059669',
    fontWeight: '500',
  },
  buttonContainer: {
    width: '100%',
    marginBottom: 20,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    backgroundColor: 'rgba(116, 97, 238, 0.1)',
    borderRadius: 12,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#7461EE',
    fontWeight: '600',
  },
  resendButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  buttonActive: {
    backgroundColor: '#7461EE',
  },
  buttonDisabled: {
    backgroundColor: '#E2E8F0',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  buttonTextActive: {
    color: '#FFFFFF',
  },
  buttonTextDisabled: {
    color: '#94A3B8',
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 20,
  },
  timerIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  timerText: {
    fontSize: 14,
    color: '#DC2626',
    fontWeight: '500',
    textAlign: 'center',
    flex: 1,
  },
  helpContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.2)',
  },
  helpText: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
  },
});