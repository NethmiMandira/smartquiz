import React, { useState } from 'react';
import { View, TextInput, Text, TouchableOpacity, Alert, StyleSheet, Dimensions, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../type/navigation';
import auth from '@react-native-firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { db } from './FirebaseConfig';

const { width, height } = Dimensions.get('window');

type SignupScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Signup'>;

const SignupScreen: React.FC = () => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [firstName, setFirstName] = useState<string>('');
  const [lastName, setLastName] = useState<string>('');
  const navigation = useNavigation<SignupScreenNavigationProp>();

  const handleSignup = async () => {
    if (!email || !password || !firstName || !lastName) {
      Alert.alert('Error', 'Please fill all fields.');
      return;
    }
    try {
      // Create user in Firebase Auth
      const userCredential = await auth().createUserWithEmailAndPassword(email, password);
      const user = userCredential.user;
      
      // Update Firebase Auth profile
      await user.updateProfile({
        displayName: `${firstName} ${lastName}`,
      });

      // Store user data in Firestore users collection
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: email.toLowerCase(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        displayName: `${firstName.trim()} ${lastName.trim()}`,
        createdAt: Date.now(),
        emailVerified: false
      });

      // Send email verification
      await user.sendEmailVerification();
      
      console.log('User created and data stored:', {
        uid: user.uid,
        email,
        firstName,
        lastName
      });
      
      navigation.navigate('EmailVerification', { email });
    } catch (error: any) {
      console.error('Signup error:', error);
      Alert.alert('Signup Error', error.message || 'An error occurred.');
    }
  };

  const clearField = (field: string) => {
    switch (field) {
      case 'firstName':
        setFirstName('');
        break;
      case 'lastName':
        setLastName('');
        break;
      case 'email':
        setEmail('');
        break;
      case 'password':
        setPassword('');
        break;
    }
  };

  const handleNavigateToLogin = () => {
    navigation.navigate('Login');
  };

  return (
    <View style={styles.container}>
      {/* Fixed Background Gradient Elements */}
      <View style={styles.backgroundContainer}>
        <View style={styles.backgroundCircle1} />
        <View style={styles.backgroundCircle2} />
        <View style={styles.backgroundCircle3} />
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Main Content */}
        <View style={styles.content}>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>
              <Text style={styles.create}>Create</Text>
              <Text style={styles.account}> Account</Text>
            </Text>
            <Text style={styles.subtitle}>Join SmartQuiz and start your learning adventure!</Text>
          </View>

          <View style={styles.formContainer}>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>👤</Text>
              <TextInput
                placeholder="First Name"
                value={firstName}
                onChangeText={setFirstName}
                style={styles.input}
                placeholderTextColor="#94A3B8"
              />
              {firstName.length > 0 && (
                <TouchableOpacity 
                  style={styles.clearButton} 
                  onPress={() => clearField('firstName')}
                >
                  <Text style={styles.clearIcon}>✕</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>👤</Text>
              <TextInput
                placeholder="Last Name"
                value={lastName}
                onChangeText={setLastName}
                style={styles.input}
                placeholderTextColor="#94A3B8"
              />
              {lastName.length > 0 && (
                <TouchableOpacity 
                  style={styles.clearButton} 
                  onPress={() => clearField('lastName')}
                >
                  <Text style={styles.clearIcon}>✕</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>📧</Text>
              <TextInput
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                style={styles.input}
                placeholderTextColor="#94A3B8"
              />
              {email.length > 0 && (
                <TouchableOpacity 
                  style={styles.clearButton} 
                  onPress={() => clearField('email')}
                >
                  <Text style={styles.clearIcon}>✕</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>🔒</Text>
              <TextInput
                placeholder="Password"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
                style={styles.input}
                placeholderTextColor="#94A3B8"
              />
              {password.length > 0 && (
                <TouchableOpacity 
                  style={styles.clearButton} 
                  onPress={() => clearField('password')}
                >
                  <Text style={styles.clearIcon}>✕</Text>
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity style={styles.button} onPress={handleSignup}>
              <Text style={styles.buttonIcon}>✨</Text>
              <Text style={styles.buttonText}>Sign Up</Text>
            </TouchableOpacity>

            {/* Login Link */}
            <View style={styles.loginLinkContainer}>
              <Text style={styles.loginPromptText}>Already have an account? </Text>
              <TouchableOpacity onPress={handleNavigateToLogin}>
                <Text style={styles.loginLinkText}>Log In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
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
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: height * 0.05,
    zIndex: 1,
  },
  content: {
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: height * 0.04,
  },
  title: {
    fontSize: width * 0.08,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  create: {
    color: '#7461EE',
  },
  account: {
    color: '#FF6B6B',
  },
  subtitle: {
    fontSize: width * 0.038,
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
    marginBottom: 16,
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
    height: 52,
    borderColor: 'rgba(116, 97, 238, 0.2)',
    borderWidth: 2,
    borderRadius: 16,
    paddingHorizontal: 50,
    paddingRight: 80,
    backgroundColor: '#FFFFFF',
    fontSize: 16,
    color: '#1E293B',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  clearButton: {
    position: 'absolute',
    right: 16,
    top: 15,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(148, 163, 184, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  clearIcon: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '600',
  },
  button: {
    backgroundColor: '#FF6B6B',
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    width: '80%',
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
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
  // NEW STYLES FOR LOGIN LINK
  loginLinkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    paddingVertical: 8,
  },
  loginPromptText: {
    fontSize: width * 0.038,
    color: '#64748B',
    fontWeight: '400',
  },
  loginLinkText: {
    fontSize: width * 0.038,
    color: '#7461EE',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});

export default SignupScreen;