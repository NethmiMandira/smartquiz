"use client"

import type React from "react"

import { useState, useLayoutEffect } from "react"
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
  Dimensions,
} from "react-native"
import type { RouteProp } from "@react-navigation/native"
import type { StackNavigationProp } from "@react-navigation/stack"
import { doc, getDoc, setDoc } from "firebase/firestore"
import { db } from "./FirebaseConfig"
import auth from "@react-native-firebase/auth"
import { Picker } from "@react-native-picker/picker"
import type { RootStackParamList } from "../type/navigation"

const { width, height } = Dimensions.get("window")

type QuizScreenRouteProp = RouteProp<RootStackParamList, "CreateQuiz" | "UpdateQuiz">
type QuizScreenNavigationProp = StackNavigationProp<RootStackParamList, "CreateQuiz" | "UpdateQuiz">

interface Props {
  route: QuizScreenRouteProp
  navigation: QuizScreenNavigationProp
}

const timerOptions = [
  { label: "No timer", value: 0 },
  { label: "10 minutes", value: 10 },
  { label: "15 minutes", value: 15 },
  { label: "20 minutes", value: 20 },
  { label: "30 minutes", value: 30 },
  { label: "45 minutes", value: 45 },
  { label: "60 minutes", value: 60 },
]

// New attempts options with maximum of 3
const attemptsOptions = [
  { label: "1 attempt", value: 1 },
  { label: "2 attempts", value: 2 },
  { label: "3 attempts", value: 3 },
]

const generateQuizId = (): string => {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
  let result = ""
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length))
  }
  return result
}

const checkQuizIdUnique = async (id: string): Promise<boolean> => {
  const docRef = doc(db, "quizzes", id)
  const docSnap = await getDoc(docRef)
  return !docSnap.exists()
}

const CreateQuizScreen: React.FC<Props> = ({ route, navigation }) => {
  const {
    quizId,
    subject: initialSubject,
    attempts: initialAttempts,
    questions: initialQuestions,
    score: initialScore,
    timer: initialTimer,
    isEdit,
  } = route.params

  const [subject, setSubject] = useState(initialSubject || "")
  // Changed to number type and default to 1 if not provided or exceeds 3
  const [attempts, setAttempts] = useState<number>(
    initialAttempts && initialAttempts <= 3 ? initialAttempts : 1
  )
  const [questions, setQuestions] = useState<string>(initialQuestions?.toString() || "")
  const [score, setScore] = useState<string>(initialScore?.toString() || "")
  const [timer, setTimer] = useState<number>(initialTimer || 0)

  useLayoutEffect(() => {
    navigation.setOptions({
      title: isEdit ? "Edit Quiz" : "Create Quiz",
    })
  }, [navigation, isEdit])

  const user = auth().currentUser
  const userId = user?.uid
  const mentorName = user?.displayName || "Mentor"

  const isFormValid =
    subject.trim() !== "" &&
    attempts > 0 &&
    attempts <= 3 &&
    questions !== "" &&
    score !== "" &&
    Number.parseInt(questions) > 0 &&
    Number.parseInt(score) > 0

  const onSave = async () => {
    if (!subject.trim()) {
      Alert.alert("Validation Error", "Subject is required")
      return
    }
    if (attempts <= 0 || attempts > 3) {
      Alert.alert("Validation Error", "Number of attempts must be between 1 and 3")
      return
    }
    if (!questions || Number.parseInt(questions) <= 0) {
      Alert.alert("Validation Error", "Number of questions must be greater than 0")
      return
    }
    if (!score || Number.parseInt(score) <= 0) {
      Alert.alert("Validation Error", "Score per question must be greater than 0")
      return
    }
    if (!userId) {
      Alert.alert("Authentication Error", "User not logged in")
      return
    }

    try {
      const quizData = {
        subject: subject.trim(),
        attempts: attempts, // Now using number directly
        questions: Number.parseInt(questions),
        score: Number.parseInt(score),
        timer,
        userId,
        mentorName,
        createdAt: new Date(),
      }

      if (isEdit && quizId !== "new") {
        // Update quiz
        await setDoc(doc(db, "quizzes", quizId), quizData, { merge: true })
      } else {
        // Create quiz
        let newQuizId = generateQuizId()
        let isUnique = await checkQuizIdUnique(newQuizId)
        let tries = 0
        while (!isUnique && tries < 5) {
          newQuizId = generateQuizId()
          isUnique = await checkQuizIdUnique(newQuizId)
          tries++
        }
        if (!isUnique) {
          Alert.alert("Error", "Failed to generate unique Quiz ID. Please try again.")
          return
        }
        await setDoc(doc(db, "quizzes", newQuizId), quizData)
      }

      Alert.alert("Success", "Quiz saved successfully", [
        {
          text: "OK",
          onPress: () => navigation.navigate("MentorDashboardScreen"),
        },
      ])
    } catch (error) {
      console.error("Error saving quiz:", error)
      Alert.alert("Error", "Failed to save quiz")
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.backgroundContainer}>
        <View style={styles.backgroundCircle1} />
        <View style={styles.backgroundCircle2} />
        <View style={styles.backgroundCircle3} />
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.select({ ios: "padding", android: undefined })}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>
              <Text style={styles.create}>{isEdit ? "Edit" : "Create"}</Text>
              <Text style={styles.quiz}> Quiz</Text>
            </Text>
            <Text style={styles.subtitle}>
              {isEdit ? "Update your quiz settings" : "Set up your new quiz configuration"}
            </Text>
          </View>

          {/* Basic Info Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardIcon}>📚</Text>
              <Text style={styles.cardTitle}>Basic Information</Text>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Subject Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter subject name"
                placeholderTextColor="#94A3B8"
                value={subject}
                onChangeText={setSubject}
                accessibilityLabel="Subject input"
                autoCapitalize="words"
              />
            </View>
          </View>

          {/* Quiz Settings Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardIcon}>⚙️</Text>
              <Text style={styles.cardTitle}>Quiz Settings</Text>
            </View>

            {/* Updated Attempts Section with Picker */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Number of Attempts (Max: 3)</Text>
              <View style={styles.pickerWrapper}>
                <Picker
                  selectedValue={attempts}
                  onValueChange={(itemValue) => setAttempts(itemValue)}
                  style={styles.picker}
                  accessibilityLabel="Number of attempts picker"
                >
                  {attemptsOptions.map((option) => (
                    <Picker.Item key={option.value} label={option.label} value={option.value} />
                  ))}
                </Picker>
              </View>
              <Text style={styles.helperText}>
                Students can attempt this quiz up to {attempts} time{attempts > 1 ? 's' : ''}
              </Text>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Number of Questions</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter number of questions"
                placeholderTextColor="#94A3B8"
                value={questions}
                onChangeText={setQuestions}
                keyboardType="numeric"
                accessibilityLabel="Number of questions input"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Points per Question</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter score per question"
                placeholderTextColor="#94A3B8"
                value={score}
                onChangeText={setScore}
                keyboardType="numeric"
                accessibilityLabel="Score per question input"
              />
            </View>
          </View>

          {/* Timer Settings Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardIcon}>⏱️</Text>
              <Text style={styles.cardTitle}>Timer Settings</Text>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Quiz Timer</Text>
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
            </View>
          </View>

          {/* Create/Update Button */}
          <TouchableOpacity
            style={[styles.button, { backgroundColor: isFormValid ? "#7461EE" : "#E2E8F0" }]}
            onPress={onSave}
            accessibilityLabel="Save quiz"
            disabled={!isFormValid}
          >
            <Text style={styles.buttonIcon}>{isEdit ? "💾" : "✨"}</Text>
            <Text style={[styles.buttonText, { color: isFormValid ? "#FFFFFF" : "#94A3B8" }]}>
              {isEdit ? "Update Quiz" : "Create Quiz"}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFF",
  },
  backgroundContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  backgroundCircle1: {
    position: "absolute",
    top: -100,
    right: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "rgba(116, 97, 238, 0.1)",
  },
  backgroundCircle2: {
    position: "absolute",
    top: height * 0.4,
    left: -80,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "rgba(255, 107, 107, 0.08)",
  },
  backgroundCircle3: {
    position: "absolute",
    bottom: 150,
    right: -60,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(52, 211, 153, 0.1)",
  },
  keyboardContainer: {
    flex: 1,
    zIndex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: height * 0.06,
    paddingBottom: 20,
  },
  title: {
    fontSize: width * 0.08,
    fontWeight: "800",
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  create: {
    color: "#7461EE",
  },
  quiz: {
    color: "#FF6B6B",
  },
  subtitle: {
    fontSize: 16,
    color: "#64748B",
    fontWeight: "500",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 24,
    marginHorizontal: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    borderWidth: 1,
    borderColor: "rgba(116, 97, 238, 0.1)",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  cardIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1E293B",
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748B",
    marginBottom: 8,
  },
  input: {
    borderWidth: 2,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: "#1E293B",
    backgroundColor: "#F8FAFC",
    fontWeight: "500",
  },
  pickerWrapper: {
    borderWidth: 2,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    backgroundColor: "#F8FAFC",
    overflow: "hidden",
  },
  picker: {
    height: 50,
    width: "100%",
    color: "#1E293B",
  },
  // New helper text style
  helperText: {
    fontSize: 12,
    color: "#7461EE",
    marginTop: 4,
    fontWeight: "500",
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 20,
    paddingVertical: 18,
    borderRadius: 16,
    shadowColor: "#7461EE",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: "700",
  },
})

export default CreateQuizScreen