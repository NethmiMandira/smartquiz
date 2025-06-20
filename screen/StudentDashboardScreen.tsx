import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Dimensions,
  ScrollView,
} from 'react-native';
import auth from '@react-native-firebase/auth';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
} from 'firebase/firestore';
import { db } from './FirebaseConfig';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { RootStackParamList } from '../type/navigation';

const { width, height } = Dimensions.get('window');

interface Quiz {
  id: string;
  subject: string;
  attempts?: number;
  score?: number;
  timer?: number;
  published: boolean;
  questions: any[];
  userId: string;
  mentorName: string;
}

const StudentDashboardScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [quizIdInput, setQuizIdInput] = useState('');
  const [searchedQuiz, setSearchedQuiz] = useState<Quiz | null>(null);
  const [enrolledQuizzes, setEnrolledQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(false);

  const user = auth().currentUser;
  const studentId = user?.uid;

  const searchQuiz = async () => {
    if (!quizIdInput.trim()) return;
    setLoading(true);
    try {
      const quizRef = doc(db, 'quizzes', quizIdInput.trim());
      const quizSnap = await getDoc(quizRef);

      if (!quizSnap.exists()) {
        Alert.alert('Quiz not found');
        setSearchedQuiz(null);
        return;
      }

      const data = quizSnap.data();
      if (
        data.published !== true &&
        data.published !== 'true' &&
        data.published !== 1
      ) {
        Alert.alert('Quiz is not published');
        setSearchedQuiz(null);
        return;
      }

      const mentorName = user?.displayName || 'Mentor';

      const questionsSnap = await getDocs(collection(db, 'quizzes', quizIdInput.trim(), 'questions'));
      const questions = questionsSnap.docs.map(doc => doc.data());

      setSearchedQuiz({
        id: quizSnap.id,
        subject: data.subject,
        attempts: data.attempts,
        score: data.score,
        timer: data.timer,
        published: true,
        questions,
        userId: data.userId,
        mentorName: data.mentorName || mentorName,
      });
    } catch (error) {
      Alert.alert('Error', 'Something went wrong while searching.');
      console.error(error);
    }
    setLoading(false);
  };

  const enrollInQuiz = async (quiz: Quiz) => {
    if (!studentId) return;
    try {
      const studentRef = doc(db, 'students', studentId, 'enrolledQuizzes', quiz.id);
      await setDoc(studentRef, {
        quizId: quiz.id,
        subject: quiz.subject,
        userId: quiz.userId,
        mentorName: quiz.mentorName,
      });
      Alert.alert('Success', 'Enrolled in quiz!');
      setSearchedQuiz(null);
      setQuizIdInput('');
      await fetchEnrolledQuizzes();
    } catch (error) {
      console.error('Error enrolling:', error);
      Alert.alert('Failed to enroll');
    }
  };

  const deleteEnrolledQuiz = async (quizId: string) => {
    if (!studentId) return;
    try {
      await deleteDoc(doc(db, 'students', studentId, 'enrolledQuizzes', quizId));
      Alert.alert('Deleted', 'Quiz enrollment removed.');
      await fetchEnrolledQuizzes();
    } catch (error) {
      console.error('Error deleting enrolled quiz:', error);
      Alert.alert('Failed to delete enrollment');
    }
  };

  const fetchEnrolledQuizzes = async () => {
    if (!studentId) return;
    try {
      const snapshot = await getDocs(collection(db, 'students', studentId, 'enrolledQuizzes'));
      const quizzes: Quiz[] = [];

      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        const quizRef = doc(db, 'quizzes', data.quizId);
        const quizDoc = await getDoc(quizRef);
        if (quizDoc.exists()) {
          const quizData = quizDoc.data();

          const questionsSnap = await getDocs(collection(db, 'quizzes', data.quizId, 'questions'));
          const questions = questionsSnap.docs.map(doc => {
            const q = doc.data() || {};
            return {
              ...q,
              options: Array.isArray(q.options) ? q.options : [],
              correctOption: typeof q.correctOption === 'number' ? q.correctOption : 1,
              question: q.question || '',
            };
          });

          quizzes.push({
            id: quizDoc.id,
            subject: quizData.subject,
            attempts: quizData.attempts,
            score: quizData.score,
            timer: quizData.timer,
            published: true,
            questions,
            userId: quizData.userId,
            mentorName: data.mentorName,
          });
        }
      }

      setEnrolledQuizzes(quizzes);
    } catch (error) {
      console.error('Error fetching enrolled quizzes:', error);
    }
  };

  useEffect(() => {
    fetchEnrolledQuizzes();
  }, [studentId]);

  const handleQuizPress = (quiz: Quiz) => {
    navigation.navigate('TakeQuiz', {
      quizId: quiz.id,
      subject: quiz.subject,
      questions: quiz.questions,
      studentId: studentId ?? '',
      allowedAttempts: quiz.attempts ?? 1,
      currentAttempts: 0,
      perQuestionTimer: quiz.timer,
      mentorName: quiz.mentorName,
      score: quiz.score,
    });
  };

  const clearSearch = () => {
    setQuizIdInput('');
    setSearchedQuiz(null);
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
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>
            <Text style={styles.student}>Student</Text>
            <Text style={styles.dashboard}> Dashboard</Text>
          </Text>
        </View>

        {/* Search Section */}
        <View style={styles.searchSection}>
          <Text style={styles.sectionTitle}>🔍 Find Quiz</Text>
          <View style={styles.searchContainer}>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>🆔</Text>
              <TextInput
                placeholder="Enter Quiz ID"
                value={quizIdInput}
                onChangeText={setQuizIdInput}
                style={styles.input}
                placeholderTextColor="#94A3B8"
              />
              {quizIdInput.length > 0 && (
                <TouchableOpacity style={styles.clearButton} onPress={clearSearch}>
                  <Text style={styles.clearIcon}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity style={styles.searchButton} onPress={searchQuiz}>
              <Text style={styles.searchButtonText}>Search</Text>
            </TouchableOpacity>
          </View>

          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#7461EE" />
              <Text style={styles.loadingText}>Searching...</Text>
            </View>
          )}

          {searchedQuiz && (
            <View style={styles.searchResultCard}>
              <View style={styles.quizHeader}>
                <Text style={styles.quizSubject}>{searchedQuiz.subject}</Text>
                <View style={styles.quizBadge}>
                  <Text style={styles.badgeText}>📚</Text>
                </View>
              </View>
              <Text style={styles.mentorName}>By {searchedQuiz.mentorName}</Text>
              <View style={styles.quizStats}>
                <View style={styles.statItem}>
                  <Text style={styles.statIcon}>📝</Text>
                  <Text style={styles.statText}>{searchedQuiz.questions?.length || 0} Questions</Text>
                </View>
                {searchedQuiz.timer && (
                  <View style={styles.statItem}>
                    <Text style={styles.statIcon}>⏱️</Text>
                    <Text style={styles.statText}>{searchedQuiz.timer}s per Q</Text>
                  </View>
                )}
              </View>
              <TouchableOpacity
                style={styles.enrollButton}
                onPress={() => enrollInQuiz(searchedQuiz)}
              >
                <Text style={styles.enrollButtonText}>✨ Enroll Now</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Enrolled Quizzes Section */}
        <View style={styles.enrolledSection}>
          <Text style={styles.sectionTitle}>📚 My Quizzes</Text>
          {enrolledQuizzes.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📖</Text>
              <Text style={styles.emptyTitle}>No Quizzes Yet</Text>
              <Text style={styles.emptyText}>Search and enroll in quizzes to get started!</Text>
            </View>
          ) : (
            <FlatList
              data={enrolledQuizzes}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <View style={styles.enrolledQuizCard}>
                  <TouchableOpacity
                    onPress={() => handleQuizPress(item)}
                    style={styles.quizCardContent}
                  >
                    <View style={styles.quizHeader}>
                      <Text style={styles.quizSubject}>{item.subject}</Text>
                      <View style={styles.playButton}>
                        
                      </View>
                    </View>
                    <Text style={styles.mentorName}>By {item.mentorName}</Text>
                    <View style={styles.quizStats}>
                      <View style={styles.statItem}>
                        <Text style={styles.statIcon}>📝</Text>
                        <Text style={styles.statText}>{item.questions?.length || 0} Questions</Text>
                      </View>
                      {item.attempts && (
                        <View style={styles.statItem}>
                          <Text style={styles.statIcon}>🎯</Text>
                          <Text style={styles.statText}>{item.attempts} Attempts</Text>
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() =>
                      Alert.alert(
                        'Remove Quiz',
                        'Are you sure you want to remove this quiz from your enrolled list?',
                        [
                          { text: 'Cancel', style: 'cancel' },
                          { text: 'Remove', style: 'destructive', onPress: () => deleteEnrolledQuiz(item.id) },
                        ]
                      )
                    }
                  >
                    <Text style={styles.deleteIcon}>🗑️</Text>
                  </TouchableOpacity>
                </View>
              )}
            />
          )}
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
  scrollView: {
    flex: 1,
    zIndex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: height * 0.06,
    paddingBottom: 20,
  },
  title: {
    fontSize: width * 0.08,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  student: {
    color: '#7461EE',
  },
  dashboard: {
    color: '#FF6B6B',
  },
  searchSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: width * 0.05,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 16,
  },
  searchContainer: {
    marginBottom: 16,
  },
  inputContainer: {
    position: 'relative',
    marginBottom: 12,
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
  searchButton: {
    backgroundColor: '#7461EE',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#7461EE',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  searchButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  loadingText: {
    marginLeft: 8,
    color: '#7461EE',
    fontSize: 14,
    fontWeight: '500',
  },
  searchResultCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#7461EE',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(116, 97, 238, 0.1)',
  },
  enrolledSection: {
    paddingHorizontal: 20,
  },
  enrolledQuizCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    borderWidth: 1,
    borderColor: 'rgba(116, 97, 238, 0.05)',
  },
  quizCardContent: {
    flex: 1,
  },
  quizHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  quizSubject: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    flex: 1,
  },
  quizBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(116, 97, 238, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 16,
  },
  playButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
   
    justifyContent: 'center',
    alignItems: 'center',
  },
  playIcon: {
    fontSize: 14,
  },
  mentorName: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 12,
    fontWeight: '500',
  },
  quizStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 4,
  },
  statIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  statText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  enrollButton: {
    backgroundColor: '#FF6B6B',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  enrollButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteIcon: {
    fontSize: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default StudentDashboardScreen;