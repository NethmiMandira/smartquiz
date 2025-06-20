import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList, Quiz } from '../type/navigation';
import { NavigationProp } from '@react-navigation/native';
import { db } from './FirebaseConfig';
import { collection, getDocs, query, where } from 'firebase/firestore';

type QuizListScreenNavigationProp = NavigationProp<RootStackParamList, 'QuizList'>;

const QuizListScreen = () => {
  const navigation = useNavigation<QuizListScreenNavigationProp>();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        const quizRef = collection(db, 'quizzes');
        const q = query(quizRef, where('published', '==', true));
        const querySnapshot = await getDocs(q);

        const fetchedQuizzes: Quiz[] = [];
        querySnapshot.forEach((doc) => {
  const data = doc.data();
  fetchedQuizzes.push({
    id: doc.id,
    subject: data.subject || '',
    attempts: data.attempts || 0,
    questions: data.questions || 0,
    score: data.score || 0,
    timer: data.timer || 0,
    published: data.published ?? true,
  });
});


        setQuizzes(fetchedQuizzes);
      } catch (error) {
        console.error('Error fetching quizzes:', error);
        Alert.alert('Error', 'Failed to fetch quizzes.');
      } finally {
        setLoading(false);
      }
    };

    fetchQuizzes();
  }, []);

  const onQuizPress = (quiz: Quiz) => {
    navigation.navigate('QuizDetails', {
      quizId: quiz.id,
      subject: quiz.subject,
      quiz,
    });
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007ACC" />
      </View>
    );
  }

  if (quizzes.length === 0) {
    return (
      <View style={styles.centered}>
        <Text>No published quizzes found.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={quizzes}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.quizCard} onPress={() => onQuizPress(item)}>
            <Text style={styles.subject}>{item.subject}</Text>
            <Text>Attempts: {item.attempts}</Text>
            <Text>Questions: {item.questions}</Text>
            <Text>Score per Question: {item.score}</Text>
            <Text>Timer: {item.timer} minutes</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quizCard: {
    backgroundColor: '#e6f0ff',
    padding: 20,
    borderRadius: 8,
    marginBottom: 15,
  },
  subject: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 6,
    color: '#004080',
  },
});

export default QuizListScreen;
