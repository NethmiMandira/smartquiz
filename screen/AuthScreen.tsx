import React, { useLayoutEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import AntDesign from 'react-native-vector-icons/AntDesign';

const { width, height } = Dimensions.get('window');

export default function AuthScreen({ navigation }: any) {
  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  return (
    <View style={styles.container}>
      {/* Background Gradient Elements */}
      <View style={styles.backgroundCircle1} />
      <View style={styles.backgroundCircle2} />
      <View style={styles.backgroundCircle3} />

      {/* Header Bar with Back Button */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <AntDesign name="arrowleft" size={width * 0.06} color="#1E293B" />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>
            <Text style={styles.smart}>Smart</Text>
            <Text style={styles.quiz}>Quiz</Text>
          </Text>
          <Text style={styles.subtitle}>Choose an option to continue</Text>
        </View>

        <View style={styles.authOptions}>
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={styles.loginButton} 
              onPress={() => navigation.navigate('Login')}
            >
              <Text style={styles.buttonIcon}>🔑</Text>
              <Text style={styles.buttonText}>Login</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={styles.signupButton} 
              onPress={() => navigation.navigate('Signup')}
            >
              <Text style={styles.buttonIcon}>✨</Text>
              <Text style={styles.buttonText}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.decorationElements}>
          <View style={styles.decorationCircle1} />
          <View style={styles.decorationCircle2} />
        </View>
      </View>
    </View>
  );
}

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
  header: {
    width: '100%',
    height: height * 0.08,
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: height * 0.02,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: height * 0.08,
  },
  title: {
    fontSize: width * 0.13,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -1,
    marginBottom: height * 0.02,
  },
  smart: {
    color: '#7461EE', // Updated to match previous screen
  },
  quiz: {
    color: '#FF6B6B', // Updated to match previous screen
  },
  subtitle: {
    fontSize: width * 0.045,
    color: '#475569',
    textAlign: 'center',
    fontWeight: '400',
  },
  authOptions: {
    width: '100%',
    alignItems: 'center',
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: height * 0.03,
  },
  loginButton: {
    backgroundColor: '#7461EE', // Updated to match previous screen
    paddingVertical: 20,
    paddingHorizontal: 50,
    borderRadius: 16,
    width: '80%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7461EE',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  signupButton: {
    backgroundColor: '#FF6B6B', // Updated to match previous screen
    paddingVertical: 20,
    paddingHorizontal: 50,
    borderRadius: 16,
    width: '80%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: width * 0.05,
    fontWeight: '600',
  },
  buttonIcon: {
    fontSize: 20,
    marginRight: 8,
    color: '#FFFFFF',
  },
  decorationElements: {
    position: 'absolute',
    bottom: height * 0.05,
    width: '100%',
    alignItems: 'center',
  },
  decorationCircle1: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(116, 97, 238, 0.3)',
    marginBottom: 8,
  },
  decorationCircle2: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 107, 107, 0.3)',
  },
});