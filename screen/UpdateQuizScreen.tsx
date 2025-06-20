import React, { useState, useLayoutEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { doc, setDoc } from 'firebase/firestore';
import { db } from './FirebaseConfig';
import auth from '@react-native-firebase/auth';
import { Picker } from '@react-native-picker/picker';
import { RootStackParamList } from '../type/navigation';

type UpdateQuizScreenRouteProp = RouteProp<RootStackParamList, 'UpdateQuiz'>;
type UpdateQuizScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'UpdateQuiz'
>;

interface Props {
  route: UpdateQuizScreenRouteProp;
  navigation: UpdateQuizScreenNavigationProp;
}

const timerOptions = [
  { label: 'No timer', value: 0 },
  { label: '10 minutes', value: 10 },
  { label: '15 minutes', value: 15 },
  { label: '20 minutes', value: 20 },
  { label: '30 minutes', value: 30 },
  { label: '45 minutes', value: 45 },
  { label: '60 minutes', value: 60 },
];

const UpdateQuizScreen: React.FC<Props> = ({ route, navigation }) => {
  const {
    quizId,
    subject: initialSubject,
    attempts: initialAttempts,
    questions: initialQuestions,
    score: initialScore,
    timer: initialTimer,
  } = route.params;

  const [subject, setSubject] = useState(initialSubject || '');
  const [attempts, setAttempts] = useState(initialAttempts?.toString() || '');
  const [questions, setQuestions] = useState(initialQuestions?.toString() || '');
  const [score, setScore] = useState(initialScore?.toString() || '');
  const [timer, setTimer] = useState(initialTimer || 0);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: 'Edit Quiz',
    });
  }, [navigation]);

  const user = auth().currentUser;
  const userId = user?.uid;

  const isFormValid =
    subject.trim() !== '' &&
    attempts !== '' &&
    questions !== '' &&
    score !== '' &&
    parseInt(attempts) > 0 &&
    parseInt(questions) > 0 &&
    parseInt(score) > 0;

  const onSave = async () => {
    if (!subject.trim()) {
      Alert.alert('Validation Error', 'Subject is required');
      return;
    }
    if (!attempts || parseInt(attempts) <= 0) {
      Alert.alert('Validation Error', 'Number of attempts must be greater than 0');
      return;
    }
    if (!questions || parseInt(questions) <= 0) {
      Alert.alert('Validation Error', 'Number of questions must be greater than 0');
      return;
    }
    if (!score || parseInt(score) <= 0) {
      Alert.alert('Validation Error', 'Score per question must be greater than 0');
      return;
    }
    if (!userId) {
      Alert.alert('Authentication Error', 'User not logged in');
      return;
    }

    try {
      const quizData = {
        subject: subject.trim(),
        attempts: parseInt(attempts),
        questions: parseInt(questions),
        score: parseInt(score),
        timer,
        userId,
        updatedAt: new Date(),
      };

      await setDoc(doc(db, 'quizzes', quizId), quizData, { merge: true });

      Alert.alert('Success', 'Quiz updated successfully', [
        {
          text: 'OK',
          onPress: () =>
            navigation.navigate('QuizDetails', {
              quizId,
              subject,
              quiz: {
                id: quizId,
                subject,
                attempts: parseInt(attempts),
                questions: parseInt(questions),
                score: parseInt(score),
                timer,
                published: true, // or false, depending on your logic
                addedQuestions: 0, // or the actual number if available
              },
            }),
        },
      ]);
    } catch (error) {
      console.error('Error updating quiz:', error);
      Alert.alert('Error', 'Failed to update quiz');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.select({ ios: 'padding', android: undefined })}
    >
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ flexGrow: 1 }}>
        <View style={styles.form}>
          <Text style={styles.label}>Subject Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter subject name"
            value={subject}
            onChangeText={setSubject}
            accessibilityLabel="Subject input"
            autoCapitalize="words"
          />

          <Text style={styles.label}>Number of Attempts</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter number of attempts"
            value={attempts}
            onChangeText={setAttempts}
            keyboardType="numeric"
            accessibilityLabel="Number of attempts input"
          />

          <Text style={styles.label}>Number of Questions</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter number of questions"
            value={questions}
            onChangeText={setQuestions}
            keyboardType="numeric"
            accessibilityLabel="Number of questions input"
          />

          <Text style={styles.label}>Score per Question</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter score per question"
            value={score}
            onChangeText={setScore}
            keyboardType="numeric"
            accessibilityLabel="Score per question input"
          />

          <Text style={styles.label}>Timer</Text>
          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={timer}
              onValueChange={(itemValue) => setTimer(itemValue)}
              style={styles.picker}
              accessibilityLabel="Timer picker"
            >
              {timerOptions.map((option) => (
                <Picker.Item key={option.value} label={option.label} value={option.value} />
              ))}
            </Picker>
          </View>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: isFormValid ? '#3b82f6' : '#999' }]}
            onPress={onSave}
            accessibilityLabel="Update quiz"
            disabled={!isFormValid}
          >
            <Text style={styles.buttonText}>Update Quiz</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f4f7',
  },
  form: {
    padding: 20,
    flexGrow: 1,
    justifyContent: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginVertical: 8,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#bbb',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: '#bbb',
    borderRadius: 8,
    marginVertical: 8,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  picker: {
    height: 50,
    width: '100%',
  },
  button: {
    marginTop: 30,
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 5,
  },
  buttonText: {
    fontSize: 18,
    color: '#000',
    fontWeight: '700',
  },
});

export default UpdateQuizScreen;
