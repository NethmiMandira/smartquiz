"use client"

import type React from "react"
import { useEffect, useState, useCallback, useMemo } from "react"
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Dimensions, ScrollView, Alert } from "react-native"
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native"
import type { NavigationProp } from "@react-navigation/native"
import auth from "@react-native-firebase/auth"
import { collection, getDocs, query, where, doc, getDoc, orderBy } from "firebase/firestore"
import { db } from "./FirebaseConfig"
import type { RootStackParamList } from "../type/navigation"

const { width, height } = Dimensions.get("window")

interface StudentAttemptData {
  studentId: string
  firstName: string
  lastName: string
  email?: string
  score: number
  attemptNumber: number
  totalPossibleScore: number
  timestamp: number
  totalAttempts: number
  bestScore: number
  bestAttemptNumber: number
  bestScoreTimestamp: number // When the best score was achieved
  lastScore: number
  subject: string
  mentorName: string
  quizId: string
  averageScore: number
  completionRate: number
}

interface QuizData {
  subject: string
  mentorName: string
  questions: any[]
  attempts: number
  score: number
  totalPossibleScore: number
  numberOfQuestions: number
}

type StudentAttemptsScreenRouteProp = RouteProp<RootStackParamList, "StudentAttemptsScreen">

const StudentAttemptsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>()
  const route = useRoute<StudentAttemptsScreenRouteProp>()

  const routeParams = route.params as any
  const isFromMentor = routeParams?.quizId && routeParams?.subject
  const specificQuizId = routeParams?.quizId
  const specificSubject = routeParams?.subject

  const [loading, setLoading] = useState(true)
  const [studentAttempts, setStudentAttempts] = useState<StudentAttemptData[]>([])
  const [quizData, setQuizData] = useState<QuizData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [userCache, setUserCache] = useState<Map<string, { firstName: string; lastName: string; email?: string }>>(new Map())

  const user = auth().currentUser

  // FIXED SORTING with proper timestamp handling
  const sortedStudentAttempts = useMemo(() => {
    return [...studentAttempts].sort((a, b) => {
      console.log(`🔄 Comparing ${a.firstName} ${a.lastName} vs ${b.firstName} ${b.lastName}`)
      
      // 1st Priority: Best attempt number (fewer attempts = better ranking)
      if (a.bestAttemptNumber !== b.bestAttemptNumber) {
        console.log(`  ✅ Sorted by attempt number: ${a.bestAttemptNumber} vs ${b.bestAttemptNumber}`)
        return a.bestAttemptNumber - b.bestAttemptNumber
      }
      
      // 2nd Priority: Best score (higher score = better ranking)
      if (a.bestScore !== b.bestScore) {
        console.log(`  ✅ Sorted by best score: ${a.bestScore} vs ${b.bestScore}`)
        return b.bestScore - a.bestScore
      }
      
      // 🎯 TIE-BREAKING SCENARIOS (same attempt number + same score)
      console.log(`  🤝 TIE DETECTED: Both have attempt #${a.bestAttemptNumber} with score ${a.bestScore}`)
      
      // 3rd Priority: Timestamp (who achieved the best score first) - FIXED
      const timestampA = a.bestScoreTimestamp || 0
      const timestampB = b.bestScoreTimestamp || 0
      
      if (timestampA !== timestampB && timestampA > 0 && timestampB > 0) {
        const dateA = new Date(timestampA)
        const dateB = new Date(timestampB)
        console.log(`  ⏰ Tie-break by timestamp:`)
        console.log(`    Student A (${a.firstName}): ${dateA.toLocaleString()} (${timestampA})`)
        console.log(`    Student B (${b.firstName}): ${dateB.toLocaleString()} (${timestampB})`)
        console.log(`    Winner: ${timestampA < timestampB ? a.firstName : b.firstName} (earlier timestamp)`)
        return timestampA - timestampB // Earlier timestamp wins
      }
      
      // 4th Priority: Total attempts (fewer total attempts = better)
      if (a.totalAttempts !== b.totalAttempts) {
        console.log(`  🔢 Tie-break by total attempts: ${a.totalAttempts} vs ${b.totalAttempts}`)
        return a.totalAttempts - b.totalAttempts
      }
      
      // 5th Priority: Average score across all attempts (higher average = better)
      if (Math.abs(a.averageScore - b.averageScore) > 0.01) {
        console.log(`  📊 Tie-break by average score: ${a.averageScore.toFixed(2)} vs ${b.averageScore.toFixed(2)}`)
        return b.averageScore - a.averageScore
      }
      
      // 6th Priority: Alphabetical order by full name (consistent ordering)
      const nameA = `${a.firstName} ${a.lastName}`.toLowerCase()
      const nameB = `${b.firstName} ${b.lastName}`.toLowerCase()
      if (nameA !== nameB) {
        console.log(`  🔤 Tie-break by name: ${nameA} vs ${nameB}`)
        return nameA.localeCompare(nameB)
      }
      
      // 7th Priority: Student ID (final fallback for absolute consistency)
      console.log(`  🆔 Final tie-break by student ID: ${a.studentId} vs ${b.studentId}`)
      return a.studentId.localeCompare(b.studentId)
    })
  }, [studentAttempts])

  useEffect(() => {
    if (specificQuizId) {
      loadData()
    } else {
      setError("No quiz ID provided")
      setLoading(false)
    }
  }, [specificQuizId])

  const calculateTotalPossibleScore = useCallback((scorePerQuestion: number, numberOfQuestions: number): number => {
    if (!scorePerQuestion || !numberOfQuestions || isNaN(scorePerQuestion) || isNaN(numberOfQuestions)) {
      console.warn("Invalid parameters for total score calculation:", { scorePerQuestion, numberOfQuestions })
      return 0
    }
    return scorePerQuestion * numberOfQuestions
  }, [])

  const batchGetUserNames = async (studentIds: string[]): Promise<Map<string, { firstName: string; lastName: string; email?: string }>> => {
    const userMap = new Map<string, { firstName: string; lastName: string; email?: string }>()
    
    try {
      console.log("🔄 Batch fetching user data for", studentIds.length, "students")
      
      const uncachedIds = studentIds.filter(id => !userCache.has(id))
      
      if (uncachedIds.length === 0) {
        console.log("✅ All user data found in cache")
        return new Map([...userCache])
      }

      const usersSnapshot = await getDocs(collection(db, "users"))
      const usersData = new Map<string, any>()
      
      usersSnapshot.docs.forEach(doc => {
        const data = doc.data()
        if (data.uid && uncachedIds.includes(data.uid)) {
          usersData.set(data.uid, data)
        }
        if (uncachedIds.includes(doc.id)) {
          usersData.set(doc.id, data)
        }
      })

      for (const studentId of uncachedIds) {
        let userData = usersData.get(studentId)
        
        if (userData) {
          let firstName = "Unknown"
          let lastName = "Student"
          let email = userData.email

          if (userData.firstName && userData.lastName) {
            firstName = userData.firstName
            lastName = userData.lastName
          } else if (userData.displayName) {
            const nameParts = userData.displayName.trim().split(' ')
            firstName = nameParts[0] || "Unknown"
            lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : "Student"
          } else if (userData.name) {
            const nameParts = userData.name.trim().split(' ')
            firstName = nameParts[0] || "Unknown"
            lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : "Student"
          } else if (userData.email) {
            const emailName = userData.email.split('@')[0]
            const emailParts = emailName.split('.')
            firstName = emailParts[0] ? emailParts[0].charAt(0).toUpperCase() + emailParts[0].slice(1) : "Unknown"
            lastName = emailParts[1] ? emailParts[1].charAt(0).toUpperCase() + emailParts[1].slice(1) : "Student"
          }

          userMap.set(studentId, { firstName, lastName, email })
        } else {
          userMap.set(studentId, {
            firstName: "Student",
            lastName: `#${studentId.slice(-6)}`,
            email: undefined
          })
        }
      }

      setUserCache(prev => new Map([...prev, ...userMap]))
      
      console.log("✅ Batch user fetch completed:", userMap.size, "users processed")
      return new Map([...userCache, ...userMap])
      
    } catch (error) {
      console.error("❌ Error in batch user fetch:", error)
      
      studentIds.forEach(studentId => {
        if (!userMap.has(studentId)) {
          userMap.set(studentId, {
            firstName: "Student",
            lastName: `#${studentId.slice(-6)}`,
            email: undefined
          })
        }
      })
      
      return userMap
    }
  }

  const loadData = async () => {
    setLoading(true)
    setError(null)
    
    try {
      console.log("=== LOADING DATA (FIXED TIMESTAMPS) ===")
      console.log("Quiz ID:", specificQuizId)
      
      const quizDoc = await getDoc(doc(db, "quizzes", specificQuizId))
      let loadedQuizData: QuizData
      
      if (quizDoc.exists()) {
        const data = quizDoc.data()
        const scorePerQuestion = data.score && !isNaN(Number(data.score)) ? Number(data.score) : 1
        const attempts = data.attempts && !isNaN(Number(data.attempts)) ? Number(data.attempts) : 1
        
        let numberOfQuestions = 0
        if (Array.isArray(data.questions)) {
          numberOfQuestions = data.questions.length
        } else if (data.questions && !isNaN(Number(data.questions))) {
          numberOfQuestions = Number(data.questions)
        } else if (data.numberOfQuestions && !isNaN(Number(data.numberOfQuestions))) {
          numberOfQuestions = Number(data.numberOfQuestions)
        } else if (data.questionsCount && !isNaN(Number(data.questionsCount))) {
          numberOfQuestions = Number(data.questionsCount)
        } else if (data.questions && typeof data.questions === 'object') {
          numberOfQuestions = Object.keys(data.questions).length
        } else {
          numberOfQuestions = 1
        }
        
        const totalPossibleScore = calculateTotalPossibleScore(scorePerQuestion, numberOfQuestions)

        loadedQuizData = {
          subject: data.subject || specificSubject || "Quiz",
          mentorName: data.mentorName || "Mentor",
          questions: Array.isArray(data.questions) ? data.questions : [],
          attempts: attempts,
          score: scorePerQuestion,
          totalPossibleScore: totalPossibleScore,
          numberOfQuestions: numberOfQuestions
        }
      } else {
        loadedQuizData = {
          subject: specificSubject || "Quiz",
          mentorName: "Mentor",
          questions: [],
          attempts: 1,
          score: 1,
          totalPossibleScore: 1,
          numberOfQuestions: 1
        }
      }
      
      setQuizData(loadedQuizData)
      await fetchStudentAttemptsOptimized(loadedQuizData)
      
    } catch (error) {
      console.error("❌ Error loading data:", error)
      setError("Failed to load quiz data. Please try again.")
    }
    
    setLoading(false)
  }

  // FIXED: Proper timestamp handling
  const normalizeTimestamp = (timestamp: any): number => {
    if (!timestamp) return 0
    
    // Handle Firestore Timestamp objects
    if (timestamp && typeof timestamp === 'object' && timestamp.seconds) {
      return timestamp.seconds * 1000 + Math.floor(timestamp.nanoseconds / 1000000)
    }
    
    // Handle regular numbers (milliseconds)
    if (typeof timestamp === 'number') {
      // If timestamp is in seconds, convert to milliseconds
      if (timestamp < 10000000000) { // Less than year 2286 in seconds
        return timestamp * 1000
      }
      return timestamp
    }
    
    // Handle string timestamps
    if (typeof timestamp === 'string') {
      const parsed = Date.parse(timestamp)
      if (!isNaN(parsed)) {
        return parsed
      }
    }
    
    return 0
  }

  const fetchStudentAttemptsOptimized = async (currentQuizData: QuizData) => {
    try {
      console.log("=== FETCHING STUDENT ATTEMPTS (FIXED TIMESTAMPS) ===")

      const allStudentData: StudentAttemptData[] = []
      const studentIds = new Set<string>()

      if (isFromMentor && specificQuizId) {
        console.log("🔄 Checking new studentAttempts collection...")
        const attemptsSnapshot = await getDocs(
          query(collection(db, "quizzes", specificQuizId, "studentAttempts"), orderBy("timestamp", "desc"))
        )

        if (attemptsSnapshot.size > 0) {
          console.log("✅ Found", attemptsSnapshot.size, "attempts in new collection")
          
          const studentAttemptsMap = new Map<string, any[]>()

          attemptsSnapshot.docs.forEach(doc => {
            const attemptData = doc.data()
            const studentId = attemptData.studentId
            studentIds.add(studentId)

            if (!studentAttemptsMap.has(studentId)) {
              studentAttemptsMap.set(studentId, [])
            }

            // FIXED: Normalize timestamp properly
            const normalizedTimestamp = normalizeTimestamp(attemptData.timestamp)
            
            studentAttemptsMap.get(studentId)?.push({
              score: attemptData.score || 0,
              attemptNumber: attemptData.attemptNumber || 1,
              timestamp: normalizedTimestamp,
              ...attemptData,
            })
          })

          const userNamesMap = await batchGetUserNames(Array.from(studentIds))

          for (const [studentId, attempts] of studentAttemptsMap.entries()) {
            const userInfo = userNamesMap.get(studentId) || {
              firstName: "Student",
              lastName: `#${studentId.slice(-6)}`,
              email: undefined
            }

            const totalAttempts = attempts.length

            if (totalAttempts > 0) {
              let bestScore = 0
              let bestAttemptNumber = 1
              let bestScoreTimestamp = 0
              let lastScore = 0
              let totalScore = 0

              attempts.sort((a, b) => (a.attemptNumber || 0) - (b.attemptNumber || 0))

              console.log(`📊 Processing attempts for ${userInfo.firstName} ${userInfo.lastName}:`)
              
              attempts.forEach((attempt, index) => {
                totalScore += attempt.score
                lastScore = attempt.score
                
                console.log(`  Attempt ${attempt.attemptNumber || index + 1}: Score ${attempt.score}, Timestamp: ${new Date(attempt.timestamp).toLocaleString()}`)

                if (attempt.score > bestScore) {
                  bestScore = attempt.score
                  bestAttemptNumber = attempt.attemptNumber || index + 1
                  bestScoreTimestamp = attempt.timestamp
                  console.log(`    ⭐ NEW BEST SCORE: ${bestScore} on attempt ${bestAttemptNumber} at ${new Date(bestScoreTimestamp).toLocaleString()}`)
                }
              })

              const averageScore = totalScore / totalAttempts
              const totalPossibleScore = currentQuizData.totalPossibleScore
              const completionRate = totalPossibleScore > 0 ? (bestScore / totalPossibleScore) * 100 : 0

              console.log(`✅ Final data for ${userInfo.firstName}: Best ${bestScore} on attempt ${bestAttemptNumber} at ${new Date(bestScoreTimestamp).toLocaleString()}`)

              allStudentData.push({
                studentId,
                firstName: userInfo.firstName,
                lastName: userInfo.lastName,
                email: userInfo.email,
                score: bestScore,
                attemptNumber: bestAttemptNumber,
                totalPossibleScore,
                timestamp: bestScoreTimestamp,
                totalAttempts,
                bestScore,
                bestAttemptNumber,
                bestScoreTimestamp, // 🎯 Properly set timestamp
                lastScore,
                subject: specificSubject,
                mentorName: attempts[0].mentorName || currentQuizData.mentorName || "Mentor",
                quizId: specificQuizId,
                averageScore,
                completionRate
              })
            }
          }
        }
      }

      console.log("✅ Optimized fetch completed:", allStudentData.length, "students found")
      console.log("🕐 Timestamp summary:")
      allStudentData.forEach(student => {
        console.log(`  ${student.firstName} ${student.lastName}: ${new Date(student.bestScoreTimestamp).toLocaleString()} (${student.bestScoreTimestamp})`)
      })
      
      if (allStudentData.length === 0) {
        setError("No student attempts found for this quiz")
      }

      setStudentAttempts(allStudentData)
      
    } catch (error) {
      console.error("❌ Error fetching student attempts:", error)
      setError("Failed to load student attempts. Please try again.")
    }
  }

  const renderAttemptItem = useCallback(({ item, index }: { item: StudentAttemptData; index: number }) => {
    const isTopPerformer = index < 3
    const isTied = index > 0 && 
      sortedStudentAttempts[index - 1].bestAttemptNumber === item.bestAttemptNumber && 
      sortedStudentAttempts[index - 1].bestScore === item.bestScore

    // Format timestamp for display
    const formatTimestamp = (timestamp: number) => {
      if (!timestamp || timestamp === 0) return "No time data"
      const date = new Date(timestamp)
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      })
    }

    return (
      <View style={[styles.attemptCard, isTopPerformer && styles.topPerformerCard]}>
        <View style={styles.attemptHeader}>
          <View style={styles.studentRank}>
            <Text style={styles.rankNumber}>#{index + 1}</Text>
            {isTied && <Text style={styles.tiedIndicator}>🤝</Text>}
          </View>

          <View style={styles.attemptInfo}>
            <View style={styles.studentNameContainer}>
              <Text style={styles.studentFirstName}>{item.firstName}</Text>
              <Text style={styles.studentLastName}>{item.lastName}</Text>
              {isTied && <Text style={styles.tiedText}>(Tied)</Text>}
            </View>

            <View style={styles.scoreDetailsContainer}>
              <View style={styles.scoreDetail}>
                <Text style={styles.scoreLabel}>Best Score:</Text>
                <Text style={styles.scoreValue}>
                  {item.score}/{item.totalPossibleScore}
                </Text>
              </View>
              <View style={styles.scoreDetail}>
                <Text style={styles.scoreLabel}>Total Attempts:</Text>
                <Text style={styles.scoreValue}>{item.totalAttempts}</Text>
              </View>
              <View style={styles.scoreDetail}>
                
              </View>
            </View>

            <View style={styles.attemptDetailsContainer}>
              <Text style={styles.attemptNumberLabel}>
                Best: Attempt #{item.bestAttemptNumber}
              </Text>
              <Text style={styles.timestampLabel}>
                {formatTimestamp(item.bestScoreTimestamp)}
              </Text>
            </View>
          </View>

          <View style={styles.scoreContainer}>
            <View style={styles.scoreBadge}>
              <Text style={styles.scoreText}>
                {item.score}
              </Text>
            </View>
            <Text style={styles.attemptBadge}>
              #{item.bestAttemptNumber}
            </Text>
            {isTopPerformer && (
              <Text style={styles.topPerformerBadge}>
                {index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉"}
              </Text>
            )}
          </View>
        </View>
      </View>
    )
  }, [sortedStudentAttempts])

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>📊</Text>
      <Text style={styles.emptyTitle}>No Quiz Attempts</Text>
      <Text style={styles.emptyText}>
        No students have attempted this quiz yet. Students need to take the quiz first for data to appear here.
      </Text>
    </View>
  )

  const renderErrorState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>⚠️</Text>
      <Text style={styles.emptyTitle}>Error Loading Data</Text>
      <Text style={styles.emptyText}>{error}</Text>
    </View>
  )

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.backgroundContainer}>
          <View style={styles.backgroundCircle1} />
          <View style={styles.backgroundCircle2} />
          <View style={styles.backgroundCircle3} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7461EE" />
          <Text style={styles.loadingText}>Loading student rankings...</Text>
        </View>
      </View>
    )
  }

  const totalStudents = sortedStudentAttempts.length

  return (
    <View style={styles.container}>
      <View style={styles.backgroundContainer}>
        <View style={styles.backgroundCircle1} />
        <View style={styles.backgroundCircle2} />
        <View style={styles.backgroundCircle3} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>
            <Text style={styles.student}>Student</Text>
            <Text style={styles.attempts}> Rankings</Text>
          </Text>
          <Text style={styles.quizName}>{quizData?.subject || "Quiz"}</Text>
          <Text style={styles.subtitle}></Text>
          {quizData && (
            <Text style={styles.calculationInfo}>
             
            </Text>
          )}
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>👥</Text>
            <Text style={styles.statValue}>{totalStudents}</Text>
            <Text style={styles.statLabel}>Students</Text>
          </View>
        </View>

        <View style={styles.content}>
          <View style={styles.contentHeader}>
            <Text style={styles.contentTitle}>Student Rankings</Text>
            <Text style={styles.contentSubtitle}>
            
            </Text>
          </View>
          
          {error ? (
            renderErrorState()
          ) : sortedStudentAttempts.length === 0 ? (
            renderEmptyState()
          ) : (
            <FlatList
              data={sortedStudentAttempts}
              keyExtractor={(item, index) => `${item.studentId}-${item.quizId}-${index}`}
              renderItem={renderAttemptItem}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
              removeClippedSubviews={true}
              maxToRenderPerBatch={10}
              windowSize={10}
            />
          )}
        </View>
      </ScrollView>
    </View>
  )
}

// Styles remain the same as previous version...
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
  loadingContainer: {
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
    alignItems: "center",
  },
  title: {
    fontSize: width * 0.08,
    fontWeight: "800",
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  student: {
    color: "#7461EE",
  },
  attempts: {
    color: "#FF6B6B",
  },
  quizName: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 4,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#64748B",
    fontWeight: "500",
    marginBottom: 8,
  },
  calculationInfo: {
    fontSize: 12,
    color: "#7461EE",
    fontWeight: "500",
    textAlign: "center",
    backgroundColor: "rgba(116, 97, 238, 0.1)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statsContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginBottom: 20,
    justifyContent: "center",
  },
  statCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    minWidth: 120,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: "rgba(116, 97, 238, 0.1)",
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
  content: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  contentHeader: {
    marginBottom: 16,
  },
  contentTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 4,
  },
  contentSubtitle: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "500",
    lineHeight: 16,
  },
  attemptCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: "rgba(116, 97, 238, 0.05)",
  },
  topPerformerCard: {
    borderWidth: 2,
    borderColor: "#FFD700",
    backgroundColor: "rgba(255, 215, 0, 0.02)",
  },
  attemptHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  studentRank: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#7461EE",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
    marginTop: 4,
    position: "relative",
  },
  rankNumber: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  tiedIndicator: {
    position: "absolute",
    top: -8,
    right: -8,
    fontSize: 12,
    backgroundColor: "#FF6B6B",
    borderRadius: 8,
    paddingHorizontal: 2,
  },
  attemptInfo: {
    flex: 1,
  },
  studentNameContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  studentFirstName: {
    fontSize: 18,
    color: "#1E293B",
    fontWeight: "700",
    marginRight: 6,
  },
  studentLastName: {
    fontSize: 18,
    color: "#1E293B",
    fontWeight: "700",
  },
  tiedText: {
    fontSize: 12,
    color: "#FF6B6B",
    fontWeight: "600",
    marginLeft: 8,
    backgroundColor: "rgba(255, 107, 107, 0.1)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  scoreDetailsContainer: {
    marginBottom: 8,
  },
  scoreDetail: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 2,
  },
  scoreLabel: {
    fontSize: 14,
    color: "#64748B",
    fontWeight: "500",
    marginRight: 6,
    minWidth: 100,
  },
  scoreValue: {
    fontSize: 14,
    color: "#7461EE",
    fontWeight: "700",
  },
  attemptDetailsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  attemptNumberLabel: {
    fontSize: 12,
    color: "#34D399",
    fontWeight: "600",
  },
  timestampLabel: {
    fontSize: 10,
    color: "#94A3B8",
    fontWeight: "500",
  },
  scoreContainer: {
    alignItems: "center",
  },
  scoreBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 4,
    backgroundColor: "rgba(116, 97, 238, 0.1)",
  },
  scoreText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#7461EE",
  },
  attemptBadge: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FF6B6B",
    backgroundColor: "rgba(255, 107, 107, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginBottom: 4,
  },
  topPerformerBadge: {
    fontSize: 20,
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
})

export default StudentAttemptsScreen