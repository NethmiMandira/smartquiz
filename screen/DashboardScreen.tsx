import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Modal, BackHandler, ScrollView } from 'react-native';
import auth from '@react-native-firebase/auth';
import { useFocusEffect } from '@react-navigation/native';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './FirebaseConfig';

const { width, height } = Dimensions.get('window');

export default function DashboardScreen({ navigation }: any) {
  const user = auth().currentUser;
  const [firstName, setFirstName] = useState<string>('');
  const [menuVisible, setMenuVisible] = useState(false);

  // Load user name from Firestore or Auth
  const loadUserName = async () => {
    if (!user) return;

    try {
      // First try to get updated name from Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.firstName) {
          setFirstName(userData.firstName);
          return;
        }
      }
      
      // Fallback to Firebase Auth displayName
      if (user.displayName) {
        setFirstName(user.displayName.split(' ')[0] || '');
      }
    } catch (error) {
      console.error('Error loading user name:', error);
      // Fallback to Auth displayName on error
      if (user.displayName) {
        setFirstName(user.displayName.split(' ')[0] || '');
      }
    }
  };

  // Initial load
  useEffect(() => {
    loadUserName();
  }, [user]);

  // Reload name when screen comes into focus (when returning from Settings)
  useFocusEffect(
    React.useCallback(() => {
      loadUserName();
    }, [user])
  );

  // Listen for Firebase Auth profile changes
  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged((updatedUser) => {
      if (updatedUser && updatedUser.uid === user?.uid) {
        // User profile was updated, reload the name
        loadUserName();
      }
    });

    return unsubscribe;
  }, [user]);

  useEffect(() => {
    const backAction = () => {
      if (menuVisible) {
        setMenuVisible(false);
        return true;
      }
      return false;
    };
    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [menuVisible]);

  const handleStudentPress = () => {
    navigation.navigate('StudentDashboardScreen');
  };

  const handleMentorPress = () => {
    navigation.navigate('MentorDashboardScreen');
  };

  const closeMenu = () => {
    setMenuVisible(false);
  };

  const handleMenuOption = (option: string) => {
    closeMenu();
    if (option === 'Settings') {
      navigation.navigate('Settings');
    } else if (option === 'Logout') {
      auth().signOut().then(() => {
        navigation.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        });
      });
    }
  };

  return (
    <View style={styles.container}>
      {/* Enhanced Background Elements */}
      <View style={styles.backgroundContainer}>
        <View style={styles.backgroundCircle1} />
        <View style={styles.backgroundCircle2} />
        <View style={styles.backgroundCircle3} />
        <View style={styles.backgroundCircle4} />
      </View>

      {/* Header with Greeting and Menu Button on Same Line */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.greetingContainer}>
            <Text style={styles.greeting}>
              <Text style={styles.hi}>Welcome,</Text>
              <Text style={styles.name}> {firstName}!</Text>
            </Text>
            <Text style={styles.subGreeting}>Ready to continue learning?</Text>
          </View>
          <TouchableOpacity style={styles.menuButton} onPress={() => setMenuVisible(true)}>
            <Text style={styles.menuIcon}>☰</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Scrollable Main Content */}
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        {/* Enhanced Title Section */}
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Choose Your Role</Text>
          <Text style={styles.subtitle}>Select your learning path</Text>
        </View>

        {/* Enhanced Role Selection */}
        <View style={styles.roleContainer}>
          {/* Enhanced Student Card */}
          <TouchableOpacity style={styles.studentCard} onPress={handleStudentPress}>
            <View style={styles.cardHeader}>
              <View style={styles.cardIcon}>
                <Text style={styles.iconText}>🎓</Text>
              </View>
              <View style={styles.cardBadge}>
                <Text style={styles.badgeText}>LEARN</Text>
              </View>
            </View>
            <Text style={styles.cardTitle}>Student</Text>
            <Text style={styles.cardDescription}>Learn and practice with quizzes</Text>
            <View style={styles.cardFooter}>
              <Text style={styles.cardAction}>Get Started →</Text>
            </View>
          </TouchableOpacity>

          {/* Enhanced Mentor Card */}
          <TouchableOpacity style={styles.mentorCard} onPress={handleMentorPress}>
            <View style={styles.cardHeader}>
              <View style={styles.cardIcon}>
                <Text style={styles.iconText}>👨‍🏫</Text>
              </View>
              <View style={styles.cardBadge}>
                <Text style={styles.badgeText}>TEACH</Text>
              </View>
            </View>
            <Text style={styles.cardTitle}>Mentor</Text>
            <Text style={styles.cardDescription}>Create and manage quizzes</Text>
            <View style={styles.cardFooter}>
              <Text style={styles.cardAction}>Get Started →</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Enhanced Menu Modal */}
      <Modal visible={menuVisible} transparent animationType="slide">
        <View style={styles.modalBackground}>
          <TouchableOpacity style={styles.modalOverlay} onPress={closeMenu} activeOpacity={1} />
          <View style={styles.menuContainer}>
            <View style={styles.menuHeader}>
              <Text style={styles.menuHeaderText}>Smart Quiz</Text>
              <TouchableOpacity onPress={closeMenu} style={styles.closeButton}>
                <Text style={styles.closeIcon}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.menuItems}>
              <TouchableOpacity style={styles.menuItem} onPress={() => handleMenuOption('Settings')}>
                <View style={styles.menuItemIconContainer}>
                  <Text style={styles.menuItemIcon}>⚙️</Text>
                </View>
                <View style={styles.menuItemContent}>
                  <Text style={styles.menuText}>Settings</Text>
                  <Text style={styles.menuSubText}>Manage preferences</Text>
                </View>
                <Text style={styles.menuArrow}>›</Text>
              </TouchableOpacity>
              <View style={styles.menuDivider} />
              <TouchableOpacity style={styles.menuItem} onPress={() => handleMenuOption('Logout')}>
                <View style={styles.menuItemIconContainer}>
                  <Text style={styles.menuItemIcon}>🚪</Text>
                </View>
                <View style={styles.menuItemContent}>
                  <Text style={styles.menuText}>Sign Out</Text>
                  <Text style={styles.menuSubText}>See you later!</Text>
                </View>
                <Text style={styles.menuArrow}>›</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

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
    backgroundColor: 'rgba(116, 97, 238, 0.1)', // Changed from blue to purple
  },
  backgroundCircle2: {
    position: 'absolute',
    top: height * 0.3,
    left: -80,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255, 107, 107, 0.08)', // Changed from green to red
  },
  backgroundCircle3: {
    position: 'absolute',
    bottom: 100,
    right: -60,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(116, 97, 238, 0.08)', // Changed from purple to match primary purple
  },
  backgroundCircle4: {
    position: 'absolute',
    bottom: -40,
    left: -30,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 107, 107, 0.06)', // Changed from yellow to red
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: height * 0.06,
    paddingBottom: 20,
    zIndex: 1,
    backgroundColor: '#F8FAFF',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  greetingContainer: {
    flex: 1,
    alignItems: 'flex-start',
    paddingRight: 16,
  },
  greeting: {
    fontSize: width * 0.075,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  hi: {
    color: '#7461EE', // Changed from blue to purple
  },
  name: {
    color: '#FF6B6B', // Changed from green to red
  },
  subGreeting: {
    fontSize: width * 0.04,
    color: '#64748B',
    fontWeight: '500',
  },
  menuButton: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#7461EE', // Changed from blue to purple
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    marginTop: 8,
  },
  menuIcon: {
    fontSize: 20,
    color: '#7461EE', // Changed from blue to purple
  },
  scrollView: {
    flex: 1,
    zIndex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: height * 0.02,
    paddingBottom: 40,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: height * 0.05,
  },
  title: {
    fontSize: width * 0.065,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: -0.3,
    marginBottom: 8,
    color: '#1E293B',
  },
  subtitle: {
    fontSize: width * 0.04,
    color: '#64748B',
    textAlign: 'center',
    fontWeight: '500',
  },
  roleContainer: {
    alignItems: 'center',
    width: '100%',
  },
  studentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    width: '90%',
    marginBottom: 20,
    shadowColor: '#7461EE', // Changed from blue to purple
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(116, 97, 238, 0.1)', // Changed from blue to purple
  },
  mentorCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    width: '90%',
    shadowColor: '#FF6B6B', // Changed from green to red
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.1)', // Changed from green to red
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  cardIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: 'rgba(116, 97, 238, 0.1)', // Changed from blue to purple
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconText: {
    fontSize: 32,
  },
  cardBadge: {
    backgroundColor: 'rgba(116, 97, 238, 0.1)', // Changed from blue to purple
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#7461EE', // Changed from blue to purple
    letterSpacing: 0.5,
  },
  cardTitle: {
    fontSize: width * 0.055,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: width * 0.035,
    color: '#64748B',
    lineHeight: width * 0.05,
    fontWeight: '400',
    marginBottom: 16,
  },
  cardFooter: {
    alignItems: 'flex-end',
  },
  cardAction: {
    fontSize: width * 0.035,
    color: '#7461EE', // Changed from blue to purple
    fontWeight: '600',
  },
  extraContent: {
    alignItems: 'center',
    marginTop: 40,
    paddingVertical: 20,
  },
  extraText: {
    fontSize: width * 0.035,
    color: '#94A3B8',
    fontStyle: 'italic',
  },
  bottomSpacing: {
    height: 60,
  },
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalOverlay: {
    flex: 1,
  },
  menuContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingBottom: 40,
  },
  menuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(148, 163, 184, 0.1)',
  },
  menuHeaderText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1E293B',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(148, 163, 184, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeIcon: {
    fontSize: 16,
    color: '#64748B',
    fontWeight: '600',
  },
  userInfo: {
    alignItems: 'center',
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(148, 163, 184, 0.1)',
  },
  userAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#7461EE', // Changed from blue to purple
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  userInitial: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#64748B',
  },
  menuItems: {
    paddingTop: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  menuItemIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(116, 97, 238, 0.1)', // Changed from blue to purple
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuItemIcon: {
    fontSize: 18,
  },
  menuItemContent: {
    flex: 1,
  },
  menuText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 2,
  },
  menuSubText: {
    fontSize: 13,
    color: '#64748B',
  },
  menuArrow: {
    fontSize: 20,
    color: '#CBD5E1',
    fontWeight: '300',
  },
  menuDivider: {
    height: 1,
    backgroundColor: 'rgba(148, 163, 184, 0.1)',
    marginHorizontal: 24,
    marginVertical: 8,
  },
});