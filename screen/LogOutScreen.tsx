import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import auth from '@react-native-firebase/auth';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../type/navigation';

const { width, height } = Dimensions.get('window');

const LogoutScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [autoLogout, setAutoLogout] = useState(false);

  // Auto logout countdown
  useEffect(() => {
    if (autoLogout && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (autoLogout && countdown === 0) {
      handleLogout();
    }
  }, [countdown, autoLogout]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      // Sign out from Firebase
      await auth().signOut();
      
      // Navigate to login screen and reset navigation stack
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    } catch (error: any) {
      console.error('Logout Error:', error);
      Alert.alert('Error', 'Failed to logout. Please try again.');
      setIsLoggingOut(false);
    }
  };

  const handleCancelLogout = () => {
    navigation.goBack();
  };

  const handleAutoLogout = () => {
    setAutoLogout(true);
  };

  const cancelAutoLogout = () => {
    setAutoLogout(false);
    setCountdown(5);
  };

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
        {/* Logout Icon */}
        <View style={styles.iconContainer}>
          <Text style={styles.logoutIcon}>👋</Text>
        </View>

        {/* Title */}
        <Text style={styles.title}>
          <Text style={styles.see}>See</Text>
          <Text style={styles.you}> You Later!</Text>
        </Text>

        {/* Subtitle */}
        <Text style={styles.subtitle}>
          {autoLogout 
            ? `Logging out automatically in ${countdown} seconds...`
            : 'Are you sure you want to logout?'
          }
        </Text>

        {/* User Info */}
        <View style={styles.userInfoContainer}>
          <Text style={styles.userInfoText}>
            You are currently signed in as:
          </Text>
          <Text style={styles.userEmail}>
            {auth().currentUser?.email || 'Unknown User'}
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          {isLoggingOut ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#7461EE" />
              <Text style={styles.loadingText}>Signing out...</Text>
            </View>
          ) : autoLogout ? (
            <View style={styles.autoLogoutContainer}>
              <View style={styles.countdownContainer}>
                <Text style={styles.countdownNumber}>{countdown}</Text>
              </View>
              <TouchableOpacity
                style={styles.cancelAutoButton}
                onPress={cancelAutoLogout}
              >
                <Text style={styles.cancelAutoButtonText}>Cancel Auto Logout</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {/* Logout Button */}
              <TouchableOpacity
                style={styles.logoutButton}
                onPress={handleLogout}
              >
                <Text style={styles.logoutButtonIcon}>🚪</Text>
                <Text style={styles.logoutButtonText}>Logout Now</Text>
              </TouchableOpacity>

              {/* Auto Logout Button */}
              <TouchableOpacity
                style={styles.autoButton}
                onPress={handleAutoLogout}
              >
                <Text style={styles.autoButtonIcon}>⏱️</Text>
                <Text style={styles.autoButtonText}>Auto Logout (5s)</Text>
              </TouchableOpacity>

              {/* Cancel Button */}
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleCancelLogout}
              >
                <Text style={styles.cancelButtonIcon}>↩️</Text>
                <Text style={styles.cancelButtonText}>Stay Logged In</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Info Message */}
        <View style={styles.infoContainer}>
          <Text style={styles.infoText}>
            After logout, you'll need to sign in again to access your account and continue using the app.
          </Text>
        </View>
      </View>
    </View>
  );
};

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
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  logoutIcon: {
    fontSize: 40,
  },
  title: {
    fontSize: width * 0.08,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: 16,
  },
  see: {
    color: '#7461EE',
  },
  you: {
    color: '#FF6B6B',
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 24,
    fontWeight: '500',
  },
  userInfoContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: 'rgba(116, 97, 238, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    width: '100%',
  },
  userInfoText: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    textAlign: 'center',
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#7461EE',
    fontWeight: '600',
  },
  autoLogoutContainer: {
    alignItems: 'center',
    width: '100%',
  },
  countdownContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FF6B6B',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  countdownNumber: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  logoutButton: {
    backgroundColor: '#FF6B6B',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    width: '100%',
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  logoutButtonIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  autoButton: {
    backgroundColor: '#7461EE',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    width: '100%',
    shadowColor: '#7461EE',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  autoButtonIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  autoButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cancelButtonIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  cancelButtonText: {
    color: '#64748B',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelAutoButton: {
    backgroundColor: '#34D399',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  cancelAutoButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  infoContainer: {
    backgroundColor: 'rgba(116, 97, 238, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginTop: 32,
    width: '100%',
  },
  infoText: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default LogoutScreen;