"use client"

import type React from "react"
import { useEffect, useState, useLayoutEffect } from "react"
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  BackHandler,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  ScrollView,
} from "react-native"
import auth from "@react-native-firebase/auth"
import { collection, getDocs, query, where, doc, deleteDoc } from "firebase/firestore"
import { db } from "./FirebaseConfig"
import { useNavigation, type NavigationProp } from "@react-navigation/native"
import type { RootStackParamList } from "../type/navigation"
import { GestureHandlerRootView, Swipeable } from "react-native-gesture-handler"

const { width, height } = Dimensions.get("window")

interface StudentAttempt {
  studentId: string
  firstName: string
  lastName: string
  score: number
  attemptNumber: number
  timestamp: number
}

interface Quiz {
  id: string
  subject: string
  attempts?: number
  questions?: number
  score?: number
  timer?: number
  userId?: string
  published?: boolean | string | number
  studentScores?: {
    attempts: number
    score: number
  }[]
  studentAttempts?: StudentAttempt[]
  totalStudents?: number
}

const MentorDashboard: React.FC = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>()
  const [firstName, setFirstName] = useState<string>("Guest")
  const [lastName, setLastName] = useState<string>("")
  const [publishedQuizzes, setPublishedQuizzes] = useState<Quiz[]>([])
  const [unpublishedQuizzes, setUnpublishedQuizzes] = useState<Quiz[]>([])
  const [activeTab, setActiveTab] = useState<"published" | "unpublished">("published")
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const user = auth().currentUser
  const userId = user?.uid

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    })
  }, [navigation])

  function isPublished(value: unknown): boolean {
    if (typeof value === "boolean") return value
    if (typeof value === "string") return value.toLowerCase() === "true"
    if (typeof value === "number") return value === 1
    return false
  }

  const fetchStudentAttempts = async (quizId: string): Promise<StudentAttempt[]> => {
    try {
      // Fetch all student attempts for this quiz
      const attemptsSnapshot = await getDocs(collection(db, "quizzes", quizId, "studentAttempts"))
      const allAttempts: StudentAttempt[] = []

      for (const attemptDoc of attemptsSnapshot.docs) {
        const attemptData = attemptDoc.data()

        // Get student info from the users collection
        const studentDoc = await getDocs(query(collection(db, "users"), where("uid", "==", attemptData.studentId)))
        let firstName = "Unknown"
        let lastName = "Student"

        if (!studentDoc.empty) {
          const studentData = studentDoc.docs[0].data()
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

      return Array.from(studentBestAttempts.values())
    } catch (error) {
      console.error("Error fetching student attempts:", error)
      return []
    }
  }

  const fetchQuizzes = async () => {
    if (!userId) return
    setLoading(true)
    try {
      const q = query(collection(db, "quizzes"), where("userId", "==", userId))
      const snapshot = await getDocs(q)

      const allQuizzes: Quiz[] = await Promise.all(
        snapshot.docs.map(async (docSnap) => {
          const data = docSnap.data() as Omit<Quiz, "id" | "studentScores" | "studentAttempts" | "totalStudents">
          const quizId = docSnap.id

          const attemptsSnapshot = await getDocs(collection(db, "quizzes", quizId, "studentAttempts"))
          const studentScores = attemptsSnapshot.docs.map((doc) => {
            const d = doc.data()
            return {
              attempts: d.attempts ?? 0,
              score: d.score ?? 0,
            }
          })

          // Fetch detailed student attempts for published quizzes
          let studentAttempts: StudentAttempt[] = []
          let totalStudents = 0

          if (isPublished(data.published)) {
            studentAttempts = await fetchStudentAttempts(quizId)
            totalStudents = studentAttempts.length
          }

          return {
            id: quizId,
            ...data,
            published: isPublished(data.published),
            studentScores,
            studentAttempts,
            totalStudents,
          }
        }),
      )

      setPublishedQuizzes(allQuizzes.filter((q) => q.published === true))
      setUnpublishedQuizzes(allQuizzes.filter((q) => q.published === false))
    } catch (error) {
      console.error("Error fetching quizzes:", error)
    }
    setLoading(false)
  }

  useEffect(() => {
    if (user?.displayName) {
      const names = user.displayName.split(" ")
      setFirstName(names[0])
      setLastName(names.slice(1).join(" "))
    }
    fetchQuizzes()
  }, [userId])

  const handleQuizPress = (quiz: Quiz) => {
    navigation.navigate("QuizDetails", {
      quizId: quiz.id,
      subject: quiz.subject,
      quiz: {
        id: quiz.id,
        subject: quiz.subject,
        attempts: quiz.attempts,
        questions: quiz.questions,
        score: quiz.score,
        timer: quiz.timer,
        published: quiz.published === true,
        addedQuestions: 0,
      },
    })
  }

  const handleViewStudentAttempts = (quiz: Quiz) => {
    if (!quiz.published) {
      Alert.alert("Quiz Not Published", "This quiz must be published to view student attempts.")
      return
    }

    navigation.navigate("StudentAttemptsScreen", {
      quizId: quiz.id,
      subject: quiz.subject,
      studentAttempts: quiz.studentAttempts || [],
    })
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await fetchQuizzes()
    setRefreshing(false)
  }

  const deleteQuiz = async (quizId: string) => {
    Alert.alert(
      "Delete Quiz",
      "Are you sure you want to delete this quiz? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteDoc(doc(db, "quizzes", quizId))
              await fetchQuizzes()
              Alert.alert("Success", "Quiz deleted successfully!")
            } catch (error) {
              console.error("Error deleting quiz:", error)
              Alert.alert("Error", "Failed to delete quiz.")
            }
          },
        },
      ],
      { cancelable: true },
    )
  }

  const renderRightActions = (quizId: string) => (
    <View style={styles.rightActionWrapper}>
      <TouchableOpacity onPress={() => deleteQuiz(quizId)} style={styles.deleteButton}>
        <Text style={styles.deleteIcon}>🗑️</Text>
      </TouchableOpacity>
    </View>
  )

  const renderQuizCard = ({ item, index }: { item: Quiz; index: number }) => {
    if (typeof item !== "object" || !item) return null

    const isPublishedQuiz = item.published === true

    return (
      <Swipeable renderRightActions={() => renderRightActions(item.id)} overshootRight={false}>
        <TouchableOpacity
          onPress={() => handleQuizPress(item)}
          style={[styles.quizCard, isPublishedQuiz ? styles.publishedCard : styles.unpublishedCard]}
        >
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleContainer}>
              <Text style={styles.quizSubject}>{item.subject}</Text>
              <View style={[styles.statusBadge, isPublishedQuiz ? styles.publishedBadge : styles.unpublishedBadge]}>
                <Text style={styles.statusText}>{isPublishedQuiz ? "✅" : "⏳"}</Text>
              </View>
            </View>
            <Text style={styles.mentorName}>
              By {firstName} {lastName}
            </Text>
          </View>

          <View style={styles.cardStats}>
            <View style={styles.statItem}>
              <Text style={styles.statIcon}>📝</Text>
              <Text style={styles.statText}>{item.questions || 0} Questions</Text>
            </View>
            {item.timer ? (
              <View style={styles.statItem}>
                <Text style={styles.statIcon}>⏱️</Text>
                <Text style={styles.statText}>{item.timer}s per Q</Text>
              </View>
            ) : null}
          </View>
        </TouchableOpacity>
      </Swipeable>
    )
  }

  const currentQuizzes = (activeTab === "published" ? publishedQuizzes : unpublishedQuizzes).filter(
    (q) => typeof q === "object" && q !== null && typeof q.id === "string" && typeof q.subject === "string",
  )

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
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
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTop}>
              <View style={styles.titleContainer}>
                <Text style={styles.title}>
                  <Text style={styles.mentor}>Mentor</Text>
                  <Text style={styles.dashboard}> Dashboard</Text>
                </Text>
                <Text style={styles.subtitle}>Manage your quizzes</Text>
              </View>
            </View>
          </View>

          {/* Tab Bar */}
          <View style={styles.tabContainer}>
            <View style={styles.tabBar}>
              <TouchableOpacity
                style={[styles.tabButton, activeTab === "published" && styles.activeTab]}
                onPress={() => setActiveTab("published")}
              >
                <Text style={[styles.tabText, activeTab === "published" && styles.activeTabText]}>📚 Published</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tabButton, activeTab === "unpublished" && styles.activeTab]}
                onPress={() => setActiveTab("unpublished")}
              >
                <Text style={[styles.tabText, activeTab === "unpublished" && styles.activeTabText]}>📝 Drafts</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Content */}
          <View style={styles.content}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#7461EE" />
                <Text style={styles.loadingText}>Loading quizzes...</Text>
              </View>
            ) : currentQuizzes.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>{activeTab === "published" ? "📚" : "📝"}</Text>
                <Text style={styles.emptyTitle}>
                  {activeTab === "published" ? "No Published Quizzes" : "No Draft Quizzes"}
                </Text>
                <Text style={styles.emptyText}>
                  {activeTab === "published"
                    ? "Publish your quizzes to make them available to students!"
                    : "Create your first quiz to get started!"}
                </Text>
              </View>
            ) : (
              <FlatList
                data={currentQuizzes}
                keyExtractor={(item) => item.id}
                renderItem={renderQuizCard}
                scrollEnabled={false}
                showsVerticalScrollIndicator={false}
              />
            )}
          </View>
        </ScrollView>

        {/* Create Quiz Button */}
        <TouchableOpacity
          style={styles.createButton}
          onPress={() =>
            navigation.navigate("CreateQuiz", {
              quizId: "new",
              subject: "",
              isEdit: false,
            })
          }
        >
          <View style={styles.createButtonContent}>
            <Text style={styles.createButtonIcon}>📝</Text>
            <Text style={styles.createButtonText}>Create Quiz</Text>
          </View>
        </TouchableOpacity>
      </View>
    </GestureHandlerRootView>
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
  header: {
    paddingHorizontal: 20,
    paddingTop: height * 0.06,
    paddingBottom: 20,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: width * 0.08,
    fontWeight: "800",
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  mentor: {
    color: "#7461EE",
  },
  dashboard: {
    color: "#FF6B6B",
  },
  subtitle: {
    fontSize: width * 0.04,
    color: "#64748B",
    fontWeight: "500",
  },
  tabContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 12,
  },
  activeTab: {
    backgroundColor: "#7461EE",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748B",
  },
  activeTabText: {
    color: "#FFFFFF",
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  loadingContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    color: "#7461EE",
    fontSize: 16,
    fontWeight: "500",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  quizCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  publishedCard: {
    borderWidth: 1,
    borderColor: "rgba(52, 211, 153, 0.2)",
  },
  unpublishedCard: {
    borderWidth: 1,
    borderColor: "rgba(255, 107, 107, 0.2)",
  },
  cardHeader: {
    marginBottom: 12,
  },
  cardTitleContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  quizSubject: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1E293B",
    flex: 1,
  },
  statusBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  publishedBadge: {
    backgroundColor: "rgba(52, 211, 153, 0.1)",
  },
  unpublishedBadge: {
    backgroundColor: "rgba(255, 107, 107, 0.1)",
  },
  statusText: {
    fontSize: 16,
  },
  mentorName: {
    fontSize: 14,
    color: "#64748B",
    fontWeight: "500",
  },
  cardStats: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 12,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
    marginBottom: 4,
  },
  statIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  statText: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "500",
  },
  rightActionWrapper: {
    justifyContent: "center",
    alignItems: "flex-end",
    marginBottom: 16,
  },
  deleteButton: {
    backgroundColor: "#EF4444",
    justifyContent: "center",
    alignItems: "center",
    width: 70,
    height: "100%",
    borderTopRightRadius: 20,
    borderBottomRightRadius: 20,
  },
  deleteIcon: {
    fontSize: 24,
  },
  createButton: {
    position: "absolute",
    right: 20,
    bottom: 30,
    backgroundColor: "#7461EE",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 25,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#7461EE",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  createButtonContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  createButtonIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  createButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
})

export default MentorDashboard