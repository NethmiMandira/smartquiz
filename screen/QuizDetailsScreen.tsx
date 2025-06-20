"use client"

import { useEffect, useState } from "react"
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  Alert,
  Dimensions,
} from "react-native"
import { type RouteProp, useNavigation, useRoute, useIsFocused } from "@react-navigation/native"
import type { StackNavigationProp } from "@react-navigation/stack"
import type { RootStackParamList } from "../type/navigation"

import { doc, getDoc, collection, getDocs, updateDoc, query, where } from "firebase/firestore"
import { db } from "./FirebaseConfig"
import Clipboard from "@react-native-clipboard/clipboard"

const { width, height } = Dimensions.get("window")

type QuizDetailsScreenRouteProp = RouteProp<RootStackParamList, "QuizDetails">
type QuizDetailsScreenNavigationProp = StackNavigationProp<RootStackParamList, "QuizDetails">

interface StudentAttempt {
  studentId: string
  firstName: string
  lastName: string
  score: number
  attemptNumber: number
  timestamp: number
}

const QuizDetailsScreen = () => {
  const route = useRoute<QuizDetailsScreenRouteProp>()
  const navigation = useNavigation<QuizDetailsScreenNavigationProp>()
  const isFocused = useIsFocused()

  const { quizId, subject, quiz } = route.params

  const [quizData, setQuizData] = useState<typeof quiz | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [studentAttempts, setStudentAttempts] = useState<StudentAttempt[]>([])
  const [totalStudents, setTotalStudents] = useState(0)

  const fetchQuizDetails = async () => {
    try {
      const docRef = doc(db, "quizzes", quizId)
      const docSnap = await getDoc(docRef)

      if (docSnap.exists()) {
        setQuizData(docSnap.data() as typeof quiz)
      } else {
        setError("Quiz not found.")
      }
    } catch (error) {
      setError("Failed to fetch quiz details.")
      console.error("Error fetching quiz details:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAddedQuestions = async () => {
    try {
      const questionsRef = collection(db, "quizzes", quizId, "questions")
      const snapshot = await getDocs(questionsRef)
      return snapshot.size
    } catch (error) {
      console.error("Error fetching added questions:", error)
      return 0
    }
  }

  const fetchStudentAttempts = async () => {
    try {
      const attemptsRef = collection(db, "quizzes", quizId, "studentAttempts")
      const snapshot = await getDocs(attemptsRef)
      const allAttempts: StudentAttempt[] = []

      // Fetch all attempts with student details
      for (const attemptDoc of snapshot.docs) {
        const attemptData = attemptDoc.data()

        // Get student info from the users collection
        const studentQuery = query(collection(db, "users"), where("uid", "==", attemptData.studentId))
        const studentSnapshot = await getDocs(studentQuery)

        let firstName = "Unknown"
        let lastName = "Student"

        if (!studentSnapshot.empty) {
          const studentData = studentSnapshot.docs[0].data()
          firstName = studentData.firstName || studentData.displayName?.split(" ")[0] || "Unknown"
          lastName = studentData.lastName || studentData.displayName?.split(" ").slice(1).join(" ") || "Student"
        }

        allAttempts.push({
          studentId: attemptData.studentId,
          firstName,
          lastName,
          score: attemptData.score || 0,
          attemptNumber: attemptData.attemptNumber || 1,
          timestamp: attemptData.timestamp || Date.now(),
        })
      }

      // Group by student and get best attempt for each
      const studentBestAttempts = new Map<string, StudentAttempt>()

      allAttempts.forEach((attempt) => {
        const existing = studentBestAttempts.get(attempt.studentId)
        if (!existing || attempt.score > existing.score) {
          studentBestAttempts.set(attempt.studentId, attempt)
        }
      })

      const bestAttemptsArray = Array.from(studentBestAttempts.values())
      setStudentAttempts(bestAttemptsArray)
      setTotalStudents(bestAttemptsArray.length)
    } catch (error) {
      console.error("Error fetching student attempts:", error)
      setStudentAttempts([])
      setTotalStudents(0)
    }
  }

  useEffect(() => {
    if (isFocused) {
      const loadQuizData = async () => {
        setLoading(true)
        const quizObj = quiz
        const addedQuestions = await fetchAddedQuestions()

        // Fetch student attempts if quiz is published
        if (quizObj.published) {
          await fetchStudentAttempts()
        }

        setQuizData({ ...quizObj, addedQuestions })
        setLoading(false)
      }
      loadQuizData()
    }
  }, [isFocused])

  const handleEditQuiz = () => {
    if (!quizData) return

    navigation.navigate("CreateQuiz", {
      quizId,
      subject,
      attempts: quizData.attempts,
      questions: quizData.questions,
      score: quizData.score,
      timer: quizData.timer,
      isEdit: true,
    })
  }

  const handlePublishQuiz = async () => {
    if (!quizData) return
    try {
      await updateDoc(doc(db, "quizzes", quizId), { published: true })
      Alert.alert("Success", "Quiz published successfully!")
      setQuizData({ ...quizData, published: true })
      // Fetch student attempts after publishing
      await fetchStudentAttempts()
    } catch (error) {
      Alert.alert("Error", "Failed to publish quiz.")
      console.error("Error publishing quiz:", error)
    }
  }

  const handleCopyQuizId = () => {
    Clipboard.setString(quizId)
    Alert.alert("Copied", "Quiz ID copied to clipboard!")
  }

  const handleViewStudentAttempts = () => {
    if (!quizData?.published) {
      Alert.alert("Quiz Not Published", "This quiz must be published to view student attempts.")
      return
    }

    navigation.navigate("StudentAttemptsScreen", {
      quizId,
      subject,
      studentAttempts,
    })
  }

  const canAddQuestion =
    quizData && typeof quizData.addedQuestions === "number" && typeof quizData.questions === "number"
      ? quizData.addedQuestions < quizData.questions
      : false

  const canPublishQuiz =
    quizData &&
    typeof quizData.addedQuestions === "number" &&
    typeof quizData.questions === "number" &&
    quizData.addedQuestions === quizData.questions &&
    !quizData.published

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
          <Text style={styles.loadingText}>Loading quiz details...</Text>
        </View>
      </View>
    )
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.backgroundContainer}>
          <View style={styles.backgroundCircle1} />
          <View style={styles.backgroundCircle2} />
          <View style={styles.backgroundCircle3} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </View>
    )
  }

  if (!quizData) {
    return (
      <View style={styles.container}>
        <View style={styles.backgroundContainer}>
          <View style={styles.backgroundCircle1} />
          <View style={styles.backgroundCircle2} />
          <View style={styles.backgroundCircle3} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>📝</Text>
          <Text style={styles.errorText}>No quiz data available.</Text>
        </View>
      </View>
    )
  }

  const addedQuestions = quizData.addedQuestions ?? 0
  const totalQuestions = quizData.questions ?? 0
  const remainingQuestions =
    typeof addedQuestions === "number" && typeof totalQuestions === "number"
      ? Math.max(totalQuestions - addedQuestions, 0)
      : "N/A"

  const progressPercentage = totalQuestions > 0 ? (addedQuestions / totalQuestions) * 100 : 0

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
            <Text style={styles.details}> Details</Text>
          </Text>
        </View>

        {/* Quiz Info Card */}
        <View style={styles.quizInfoCard}>
          <View style={styles.quizHeader}>
            <View style={styles.subjectContainer}>
              <Text style={styles.subjectLabel}>Subject</Text>
              <Text style={styles.subject}>{subject}</Text>
            </View>
            <View style={styles.statusBadge}>
              <Text style={styles.statusIcon}>{quizData.published ? "✅" : "⏳"}</Text>
            </View>
          </View>

          <View style={styles.quizIdContainer}>
            <Text style={styles.quizIdLabel}>Quiz ID</Text>
            <View style={styles.quizIdRow}>
              <Text style={styles.quizId}>{quizId}</Text>
              <TouchableOpacity onPress={handleCopyQuizId} style={styles.copyButton}>
                <Text style={styles.copyIcon}>📋</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <Text style={styles.progressLabel}>Question Progress</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progressPercentage}%` }]} />
            </View>
            <Text style={styles.progressText}>
              {addedQuestions} of {totalQuestions} questions added
            </Text>
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>🎯</Text>
            <Text style={styles.statValue}>{quizData.attempts ?? "N/A"}</Text>
            <Text style={styles.statLabel}>Attempts</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statIcon}>📝</Text>
            <Text style={styles.statValue}>{quizData.questions ?? "N/A"}</Text>
            <Text style={styles.statLabel}>Questions</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statIcon}>⭐</Text>
            <Text style={styles.statValue}>{quizData.score ?? "N/A"}</Text>
            <Text style={styles.statLabel}>Points/Q</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statIcon}>⏱️</Text>
            <Text style={styles.statValue}>{quizData.timer ?? "N/A"}</Text>
            <Text style={styles.statLabel}>Timer (min)</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity 
            style={[styles.primaryButton, quizData.published && styles.disabledButton]} 
            onPress={handleEditQuiz}
            disabled={quizData.published}
          >
            <Text style={styles.buttonIcon}>✏️</Text>
            <Text style={[styles.buttonText, quizData.published && styles.disabledButtonText]}>
              {quizData.published ? "Edit Quiz (Disabled)" : "Edit Quiz"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.secondaryButton, !canAddQuestion && styles.disabledButton]}
            onPress={() => {
              if (canAddQuestion) {
                navigation.navigate("Question", {
                  quizId,
                  subject,
                })
              } else {
                Alert.alert("Limit Reached", "You cannot add more questions to this quiz.")
              }
            }}
            disabled={!canAddQuestion}
          >
            <Text style={styles.buttonIcon}>➕</Text>
            <Text style={[!canAddQuestion ? styles.disabledButtonText : styles.secondaryButtonText]}>Add Question</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.viewQuestionsButton}
            onPress={() =>
              navigation.navigate("QuestionList", {
                quizId,
                subject,
              })
            }
          >
            <Text style={styles.viewButtonIcon}>📋</Text>
            <Text style={styles.viewButtonText}>View Questions</Text>
          </TouchableOpacity>

          {/* View Student Attempts Button */}
          <TouchableOpacity
            style={[styles.viewAttemptsButton, !quizData.published && styles.disabledButton]}
            onPress={handleViewStudentAttempts}
            disabled={!quizData.published}
          >
            <Text style={styles.buttonIcon}>👥</Text>
            <Text style={[quizData.published ? styles.viewAttemptsButtonText : styles.disabledButtonText]}>
              {quizData.published ? `View Student Attempts (${totalStudents})` : "View Student Attempts (Disabled)"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.publishButton, !canPublishQuiz && styles.disabledButton]}
            onPress={handlePublishQuiz}
            disabled={!canPublishQuiz}
          >
            <Text style={styles.buttonIcon}>🚀</Text>
            <Text style={[styles.buttonText, !canPublishQuiz && styles.disabledButtonText]}>
              {quizData.published ? "Quiz Published" : "Publish Quiz"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Student Attempts Preview for Published Quizzes */}
        {quizData.published && totalStudents > 0 && (
          <View style={styles.attemptsPreviewCard}>
            <View style={styles.previewHeader}>
              <Text style={styles.previewTitle}>Recent Student Attempts</Text>
              <TouchableOpacity onPress={handleViewStudentAttempts}>
                <Text style={styles.viewAllText}>View All →</Text>
              </TouchableOpacity>
            </View>
            {studentAttempts.slice(0, 3).map((attempt, index) => (
              <View key={attempt.studentId} style={styles.attemptPreviewItem}>
                <View style={styles.studentInfo}>
                  <Text style={styles.studentName}>
                    {attempt.firstName} {attempt.lastName}
                  </Text>
                  <Text style={styles.attemptInfo}>
                    Attempt #{attempt.attemptNumber} • Score: {attempt.score}
                  </Text>
                </View>
                <Text style={styles.attemptDate}>{new Date(attempt.timestamp).toLocaleDateString()}</Text>
              </View>
            ))}
          </View>
        )}
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
  header: {
    paddingHorizontal: 20,
    paddingTop: height * 0.06,
    paddingBottom: 20,
  },
  title: {
    fontSize: width * 0.08,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  quiz: {
    color: "#7461EE",
  },
  details: {
    color: "#FF6B6B",
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
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
    paddingHorizontal: 40,
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  errorText: {
    color: "#EF4444",
    fontSize: 18,
    textAlign: "center",
    fontWeight: "600",
  },
  quizInfoCard: {
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
  quizHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  subjectContainer: {
    flex: 1,
  },
  subjectLabel: {
    fontSize: 14,
    color: "#64748B",
    fontWeight: "500",
    marginBottom: 4,
  },
  subject: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1E293B",
  },
  statusBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(52, 211, 153, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  statusIcon: {
    fontSize: 20,
  },
  quizIdContainer: {
    marginBottom: 20,
  },
  quizIdLabel: {
    fontSize: 14,
    color: "#64748B",
    fontWeight: "500",
    marginBottom: 8,
  },
  quizIdRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    padding: 12,
    borderRadius: 12,
  },
  quizId: {
    flex: 1,
    fontSize: 14,
    fontFamily: "monospace",
    color: "#1E293B",
    fontWeight: "600",
  },
  copyButton: {
    padding: 4,
  },
  copyIcon: {
    fontSize: 18,
  },
  progressContainer: {
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    color: "#64748B",
    fontWeight: "500",
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: "#E2E8F0",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 8,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#7461EE",
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "500",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  statCard: {
    width: (width - 60) / 2,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    margin: 5,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "500",
    textAlign: "center",
  },
  actionsContainer: {
    paddingHorizontal: 20,
  },
  primaryButton: {
    backgroundColor: "#7461EE",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: "#7461EE",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  secondaryButton: {
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: "#7461EE",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  publishButton: {
    backgroundColor: "#34D399",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: "#34D399",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  viewAttemptsButton: {
    backgroundColor: "#FF6B6B",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: "#FF6B6B",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  disabledButton: {
    backgroundColor: "#E2E8F0",
    borderColor: "#E2E8F0",
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  viewAttemptsButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  disabledButtonText: {
    color: "#94A3B8",
  },
  viewQuestionsButton: {
    backgroundColor: "#FF6B6B",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: "#FF6B6B",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  viewButtonIcon: {
    fontSize: 18,
    marginRight: 8,
    color: "#FFFFFF",
  },
  viewButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#7461EE",
  },
  attemptsPreviewCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    borderWidth: 1,
    borderColor: "rgba(255, 107, 107, 0.1)",
  },
  previewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1E293B",
  },
  viewAllText: {
    fontSize: 14,
    color: "#FF6B6B",
    fontWeight: "600",
  },
  attemptPreviewItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1E293B",
    marginBottom: 2,
  },
  attemptInfo: {
    fontSize: 12,
    color: "#64748B",
  },
  attemptDate: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "500",
  },
})

export default QuizDetailsScreen