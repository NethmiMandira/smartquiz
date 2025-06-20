"use client"

import { useEffect, useState } from "react"
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Dimensions,
} from "react-native"
import { type RouteProp, useRoute, useNavigation } from "@react-navigation/native"
import type { RootStackParamList } from "../type/navigation"
import { db } from "./FirebaseConfig"
import { collection, getDocs, doc, deleteDoc } from "firebase/firestore"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { doc as firestoreDoc, getDoc } from "firebase/firestore"

const { width, height } = Dimensions.get("window")

type QuestionListRouteProp = RouteProp<RootStackParamList, "QuestionList">
type NavigationProp = NativeStackNavigationProp<RootStackParamList>

type QuestionData = {
  id: string
  question: string
  options: string[]
  correctOption: number
}

const QuestionListScreen = () => {
  const route = useRoute<QuestionListRouteProp>()
  const navigation = useNavigation<NavigationProp>()
  const { quizId, subject } = route.params

  const [questions, setQuestions] = useState<QuestionData[]>([])
  const [loading, setLoading] = useState(true)
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null)
  const [isPublished, setIsPublished] = useState<boolean>(false)
  const [maxQuestions, setMaxQuestions] = useState<number | null>(null) // <-- add this

  const fetchQuestions = async () => {
    try {
      setLoading(true)
      const questionRef = collection(db, "quizzes", quizId, "questions")
      const querySnapshot = await getDocs(questionRef)

      const questionList = querySnapshot.docs.map((doc) => {
        const data = doc.data()
        return {
          id: doc.id,
          question: data.question || "Untitled",
          options: data.options || [],
          correctOption: data.correctOption ?? -1,
        }
      })

      setQuestions(questionList)
    } catch (error) {
      console.error("Error fetching questions:", error)
      Alert.alert("Error", "Failed to load questions.")
    } finally {
      setLoading(false)
    }
  }

  // Fetch quiz published status and max questions
  const fetchQuizStatus = async () => {
    try {
      const quizDoc = await getDoc(firestoreDoc(db, "quizzes", quizId))
      if (quizDoc.exists()) {
        setIsPublished(!!quizDoc.data().published)
        setMaxQuestions(quizDoc.data().questions ?? null) // <-- fetch max questions
      }
    } catch (error) {
      console.error("Error fetching quiz status:", error)
    }
  }

  // Fetch questions on mount and on screen focus (to refresh after edits)
  useEffect(() => {
    fetchQuestions()
    fetchQuizStatus()

    const unsubscribeFocus = navigation.addListener("focus", () => {
      fetchQuestions()
      setMenuOpenId(null) // Close menu when screen is focused (e.g., after back)
    })

    return unsubscribeFocus
  }, [navigation])

  const handleDelete = async (id: string) => {
    Alert.alert("Confirm Delete", "Are you sure you want to delete this question?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteDoc(doc(db, "quizzes", quizId, "questions", id))
            Alert.alert("Deleted", "Question deleted successfully.")
            setMenuOpenId(null)
            fetchQuestions() // refresh list
          } catch (error) {
            console.error("Delete error:", error)
            Alert.alert("Error", "Failed to delete question.")
          }
        },
      },
    ])
  }

  const handleEdit = (question: QuestionData) => {
    navigation.navigate("UpdateQuestion", {
      quizId,
      questionId: question.id,
      question: question.question,
      options: question.options,
      correctOption: question.correctOption,
    })
  }

  // Add this computed variable:
  const canAddQuestion =
    !isPublished &&
    (maxQuestions === null || questions.length < maxQuestions)

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.backgroundContainer}>
          <View style={styles.backgroundCircle1} />
          <View style={styles.backgroundCircle2} />
          <View style={styles.backgroundCircle3} />
        </View>
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#7461EE" />
          <Text style={styles.loadingText}>Loading questions...</Text>
        </View>
      </View>
    )
  }

  if (questions.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.backgroundContainer}>
          <View style={styles.backgroundCircle1} />
          <View style={styles.backgroundCircle2} />
          <View style={styles.backgroundCircle3} />
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📝</Text>
          <Text style={styles.emptyTitle}>No Questions Yet</Text>
          <Text style={styles.emptyText}>Start building your quiz by adding some questions!</Text>
          <TouchableOpacity
            style={[
              styles.addButton,
              (!canAddQuestion || isPublished) && { opacity: 0.5 }
            ]}
            onPress={() => {
              if (!canAddQuestion) {
                Alert.alert("Limit Reached", "You cannot add more questions to this quiz.")
                return
              }
              navigation.navigate("Question", { quizId, subject })
            }}
            disabled={!canAddQuestion}
          >
            <Text style={styles.addButtonIcon}>➕</Text>
            <Text style={styles.addButtonText}>Add First Question</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.backgroundContainer}>
        <View style={styles.backgroundCircle1} />
        <View style={styles.backgroundCircle2} />
        <View style={styles.backgroundCircle3} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>
            <Text style={styles.quiz}>Quiz</Text>
            <Text style={styles.questions}> Questions</Text>
          </Text>
          <Text style={styles.subtitle}>
            {questions.length} question{questions.length !== 1 ? "s" : ""} for {subject}
          </Text>
        </View>

        {/* Questions List */}
        {questions.map((q, index) => (
          <View key={q.id} style={styles.questionCard}>
            <View style={styles.cardHeader}>
              <View style={styles.questionNumber}>
                <Text style={styles.questionNumberText}>{index + 1}</Text>
              </View>
              <Text style={styles.questionText}>{q.question}</Text>
              <TouchableOpacity
                onPress={() => setMenuOpenId(menuOpenId === q.id ? null : q.id)}
                style={styles.menuButton}
                accessibilityLabel="Open menu"
              >
                <Text style={styles.menuIcon}>⋯</Text>
              </TouchableOpacity>
            </View>

            {menuOpenId === q.id && !isPublished && (
              <View style={styles.menu}>
                <TouchableOpacity style={styles.menuItem} onPress={() => handleEdit(q)}>
                  <Text style={styles.editIcon}>✏️</Text>
                  <Text style={styles.menuItemText}>Edit</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.menuItem} onPress={() => handleDelete(q.id)}>
                  <Text style={styles.deleteIcon}>🗑️</Text>
                  <Text style={[styles.menuItemText, styles.deleteText]}>Delete</Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.optionsContainer}>
              {q.options.map((option, idx) => (
                <View key={idx} style={[styles.optionRow, idx === q.correctOption && styles.correctOptionRow]}>
                  <View style={[styles.optionBadge, idx === q.correctOption && styles.correctBadge]}>
                    <Text style={[styles.optionLetter, idx === q.correctOption && styles.correctLetter]}>
                      {String.fromCharCode(65 + idx)}
                    </Text>
                  </View>
                  <Text style={[styles.optionText, idx === q.correctOption && styles.correctOptionText]}>{option}</Text>
                  {idx === q.correctOption && <Text style={styles.correctIcon}>✓</Text>}
                </View>
              ))}
            </View>
          </View>
        ))}

        {/* Add Question Button */}
        <TouchableOpacity
          style={[
            styles.addQuestionButton,
            (!canAddQuestion || isPublished) && { opacity: 0.5 }
          ]}
          onPress={() => {
            if (!canAddQuestion) {
              Alert.alert("Limit Reached", "You cannot add more questions to this quiz.")
              return
            }
            navigation.navigate("Question", { quizId, subject })
          }}
          disabled={!canAddQuestion}
        >
          <Text style={styles.addQuestionIcon}>➕</Text>
          <Text style={styles.addQuestionText}>Add Another Question</Text>
        </TouchableOpacity>
      </ScrollView>
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
    top: height * 0.3,
    left: -80,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "rgba(255, 107, 107, 0.08)",
  },
  backgroundCircle3: {
    position: "absolute",
    bottom: 100,
    right: -60,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(52, 211, 153, 0.1)",
  },
  scrollView: {
    flex: 1,
    zIndex: 1,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  loadingText: {
    marginTop: 12,
    color: "#7461EE",
    fontSize: 16,
    fontWeight: "500",
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
  quiz: {
    color: "#7461EE",
  },
  questions: {
    color: "#FF6B6B",
  },
  subtitle: {
    fontSize: 16,
    color: "#64748B",
    fontWeight: "500",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
    zIndex: 1,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 8,
    textAlign: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#64748B",
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 24,
  },
  addButton: {
    backgroundColor: "#7461EE",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    shadowColor: "#7461EE",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  addButtonIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  addButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  questionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 16,
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
    alignItems: "flex-start",
    marginBottom: 16,
  },
  questionNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#7461EE",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    marginTop: 2,
  },
  questionNumberText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  questionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: "#1E293B",
    lineHeight: 24,
    paddingRight: 8,
  },
  menuButton: {
    padding: 4,
  },
  menuIcon: {
    fontSize: 20,
    color: "#64748B",
    fontWeight: "700",
  },
  menu: {
    position: "absolute",
    top: 50,
    right: 20,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingVertical: 8,
    width: 140,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 100,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  editIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  deleteIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  menuItemText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#1E293B",
  },
  deleteText: {
    color: "#EF4444",
  },
  optionsContainer: {
    marginTop: 8,
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: "#F8FAFC",
  },
  correctOptionRow: {
    backgroundColor: "rgba(52, 211, 153, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(52, 211, 153, 0.3)",
  },
  optionBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#E2E8F0",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  correctBadge: {
    backgroundColor: "#34D399",
  },
  optionLetter: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748B",
  },
  correctLetter: {
    color: "#FFFFFF",
  },
  optionText: {
    flex: 1,
    fontSize: 14,
    color: "#1E293B",
    fontWeight: "500",
  },
  correctOptionText: {
    color: "#059669",
    fontWeight: "600",
  },
  correctIcon: {
    fontSize: 16,
    color: "#34D399",
    fontWeight: "700",
  },
  addQuestionButton: {
    backgroundColor: "#FF6B6B",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 16,
    marginHorizontal: 20,
    marginTop: 8,
    shadowColor: "#FF6B6B",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  addQuestionIcon: {
    fontSize: 18,
    marginRight: 8,
    color: "#FFFFFF",
  },
  addQuestionText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
})

export default QuestionListScreen
