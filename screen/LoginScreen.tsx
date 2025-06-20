import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, Dimensions } from 'react-native';
import auth from '@react-native-firebase/auth';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../type/navigation';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './FirebaseConfig';

const { width, height } = Dimensions.get('window');

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const ensureUserDataExists = async (user: any) => {
    try {
      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        // Create user document if it doesn't exist
        const displayName = user.displayName || user.email?.split('@')[0] || 'User';
        const nameParts = displayName.split(' ');
        
        await setDoc(userRef, {
          uid: user.uid,
          email: user.email,
          firstName: nameParts[0] || 'Unknown',
          lastName: nameParts.length > 1 ? nameParts.slice(1).join(' ') : 'User',
          displayName: displayName,
          createdAt: Date.now(),
          emailVerified: user.emailVerified
        });
        
        console.log('User data created for existing user:', user.uid);
      }
    } catch (error) {
      console.error('Error ensuring user data exists:', error);
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password.');
      return;
    }

    setIsLoading(true);
    try {
      const userCredential = await auth().signInWithEmailAndPassword(email, password);
      const user = userCredential.user;
      
      if (user.emailVerified) {
        // Ensure user data exists in Firestore
        await ensureUserDataExists(user);
        navigation.navigate('DashboardScreen');
      } else {
        Alert.alert('Email Not Verified', 'Please verify your email to log in.');
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Login Error:', error.message);
        Alert.alert('Error', error.message);
      } else {
        console.error('Unknown Error:', error);
        Alert.alert('Error', 'An unknown error occurred.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      Alert.alert('Email Required', 'Please enter your email address first.');
      return;
    }

    try {
      await auth().sendPasswordResetEmail(email);
      Alert.alert(
        'Password Reset Email Sent',
        `A password reset link has been sent to ${email}. Please check your email and follow the instructions to reset your password.`,
        [{ text: 'OK' }]
      );
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Password Reset Error:', error.message);
        Alert.alert('Error', 'Failed to send password reset email. Please check your email address and try again.');
      } else {
        console.error('Unknown Error:', error);
        Alert.alert('Error', 'An unknown error occurred.');
      }
    }
  };

  const navigateToSignUp = () => {
    navigation.navigate('Signup'); // Make sure this matches your navigation route name
  };

  return (
    <View style={styles.container}>
      {/* Background Gradient Elements */}
      <View style={styles.backgroundCircle1} />
      <View style={styles.backgroundCircle2} />
      <View style={styles.backgroundCircle3} />

      {/* Main Content */}
      <View style={styles.content}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>
            <Text style={styles.welcome}>Welcome</Text>
            <Text style={styles.back}> Back!</Text>
          </Text>
          <Text style={styles.subtitle}>Ready to continue your learning journey?</Text>
        </View>

        <View style={styles.formContainer}>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>📧</Text>
            <TextInput
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              style={styles.input}
              placeholderTextColor="#94A3B8"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            {email.length > 0 && (
              <TouchableOpacity
                style={styles.clearButton}
                onPress={() => setEmail('')}
                hitSlop={10}
              >
                <Text style={styles.clearButtonText}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>🔒</Text>
            <TextInput
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              style={styles.input}
              placeholderTextColor="#94A3B8"
              secureTextEntry
            />
            {password.length > 0 && (
              <TouchableOpacity
                style={styles.clearButton}
                onPress={() => setPassword('')}
                hitSlop={10}
              >
                <Text style={styles.clearButtonText}>✕</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Forgot Password Link */}
          <TouchableOpacity 
            style={styles.forgotPasswordContainer}
            onPress={handleForgotPassword}
          >
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.button, isLoading && styles.buttonDisabled]} 
            onPress={handleLogin}
            disabled={isLoading}
          >
            <Text style={styles.buttonIcon}>🔑</Text>
            <Text style={styles.buttonText}>
              {isLoading ? 'Logging In...' : 'Log In'}
            </Text>
          </TouchableOpacity>

          {/* Sign Up Link */}
          <View style={styles.signUpContainer}>
            <Text style={styles.signUpText}>Don't have an account? </Text>
            <TouchableOpacity onPress={navigateToSignUp}>
              <Text style={styles.signUpLink}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Decorative Elements */}
        <View style={styles.decorativeElements}>
          
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
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: height * 0.06,
  },
  title: {
    fontSize: width * 0.1,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -1,
    marginBottom: 12,
  },
  welcome: {
    color: '#7461EE',
  },
  back: {
    color: '#FF6B6B',
  },
  subtitle: {
    fontSize: width * 0.04,
    color: '#475569',
    textAlign: 'center',
    fontWeight: '400',
  },
  formContainer: {
    width: '100%',
    alignItems: 'center',
  },
  inputContainer: {
    width: '100%',
    marginBottom: 20,
    position: 'relative',
  },
  inputLabel: {
    position: 'absolute',
    left: 16,
    top: 15,
    fontSize: 18,
    zIndex: 1,
  },
  input: {
    height: 56,
    borderColor: 'rgba(116, 97, 238, 0.2)',
    borderWidth: 2,
    borderRadius: 16,
    paddingHorizontal: 50,
    backgroundColor: '#FFFFFF',
    fontSize: 16,
    color: '#1E293B',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  forgotPasswordContainer: {
    alignSelf: 'flex-end',
    marginBottom: 20,
    marginRight: 10,
  },
  forgotPasswordText: {
    color: '#7461EE',
    fontSize: 14,
    fontWeight: '500',
  },
  button: {
    backgroundColor: '#7461EE',
    paddingVertical: 18,
    paddingHorizontal: 40,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    width: '80%',
    shadowColor: '#7461EE',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  buttonDisabled: {
    backgroundColor: '#94A3B8',
    shadowOpacity: 0.1,
  },
  buttonIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: width * 0.045,
  },
  signUpContainer: {
    flexDirection: 'row',
    marginTop: 30,
    alignItems: 'center',
  },
  signUpText: {
    color: '#475569',
    fontSize: 16,
  },
  signUpLink: {
    color: '#7461EE',
    fontSize: 16,
    fontWeight: '600',
  },
  decorativeElements: {
    position: 'absolute',
    bottom: height * 0.08,
    width: '100%',
    alignItems: 'center',
  },
  clearButton: {
    position: 'absolute',
    right: 16,
    top: 10,
    zIndex: 2,
    padding: 4,
  },
  clearButtonText: {
    fontSize: 16,
    color: '#94A3B8',
  },
});

export default LoginScreen;