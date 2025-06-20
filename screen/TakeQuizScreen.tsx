"use client"

import { useState, useEffect } from "react"
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView, Dimensions } from "react-native"
import { type RouteProp, useRoute, useNavigation, useFocusEffect } from "@react-navigation/native"
import auth from "@react-native-firebase/auth"
import { db } from "./FirebaseConfig"
import { doc, getDoc, setDoc, collection, addDoc } from "firebase/firestore"
import type { RootStackParamList } from "../type/navigation"
import React from "react"
const { width, height } = Dimensions.get("window")

type TakeQuizRouteProp = RouteProp<RootStackParamList, "TakeQuiz">

const TakeQuizScreen: React.FC = () => {
  const route = useRoute<TakeQuizRouteProp>()
  const navigation = useNavigation()

  const { quizId, subject, questions, allowedAttempts = 1, score = 1, perQuestionTimer = 60, mentorName } = route.params

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedOptions, setSelectedOptions] = useState<number[]>([])
  const [timerCount, setTimerCount] = useState(perQuestionTimer && perQuestionTimer > 0 ? perQuestionTimer * 60 : 0)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [currentAttempts, setCurrentAttempts] = useState(0)
  const [quizStarted, setQuizStarted] = useState(false)
  const [bestScore, setBestScore] = useState<number | null>(null)
  const [bestAttemptNumber, setBestAttemptNumber] = useState<number | null>(null)
  const [lastScore, setLastScore] = useState<number | null>(null)
  const [allAttempts, setAllAttempts] = useState<{ score: number; timestamp: number }[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0) // Add this to force re-renders

  const user = auth().currentUser
  const studentId = user?.uid

  const currentQuestion = Array.isArray(questions) ? questions[currentQuestionIndex] : undefined

  useEffect(() => {
    if (quizStarted && perQuestionTimer && perQuestionTimer > 0 && timerCount > 0 && !isSubmitted) {
      const interval = setInterval(() => setTimerCount((prev) => prev - 1), 1000)
      return () => clearInterval(interval)
    } else if (quizStarted && perQuestionTimer && perQuestionTimer > 0 && timerCount === 0 && !isSubmitted) {
      handleSubmit()
    }
  }, [timerCount, isSubmitted, quizStarted, perQuestionTimer])

  // Use useFocusEffect to refresh data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      checkAttemptLimit()
    }, [])
  )

  const checkAttemptLimit = async () => {
    if (!studentId || !quizId) return
    
    setIsLoading(true)
    try {
      const attemptRef = doc(db, "students", studentId, "enrolledQuizzes", quizId)
      const attemptSnap = await getDoc(attemptRef)
      const data = attemptSnap.data()
      const usedAttempts = data?.attemptsUsed || 0
      const attempts = Array.isArray(data?.attempts) ? data.attempts : []

      setCurrentAttempts(usedAttempts)
      setAllAttempts(attempts)

      // Handle best score - check if it exists and is a number (including 0)
      let savedBestScore = null
      let savedBestAttemptNumber = null
      let savedLastScore = null

      if (data) {
        // Best Score handling
        if (data.hasOwnProperty('bestScore') && typeof data.bestScore === 'number') {
          savedBestScore = data.bestScore
          savedBestAttemptNumber = data.bestAttemptNumber || null
        }

        // Last Score handling - prioritize the stored lastScore field
        if (data.hasOwnProperty('lastScore') && typeof data.lastScore === 'number') {
          savedLastScore = data.lastScore
        } else if (attempts.length > 0) {
          // Fallback to last attempt if no stored lastScore
          const lastAttempt = attempts[attempts.length - 1]
          if (typeof lastAttempt?.score === 'number') {
            savedLastScore = lastAttempt.score
          }
        }
      }

      setBestScore(savedBestScore)
      setBestAttemptNumber(savedBestAttemptNumber)
      setLastScore(savedLastScore)

      // Force a re-render
      setRefreshKey(prev => prev + 1)

      console.log("Loaded data from Firebase:", {
        bestScore: savedBestScore,
        lastScore: savedLastScore,
        bestAttemptNumber: savedBestAttemptNumber,
        attempts: attempts.length,
        usedAttempts,
        rawData: data
      })
    } catch (error) {
      console.error("Error checking attempts:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleOptionSelect = (index: number) => {
    if (!quizStarted || isSubmitted) return
    const updatedSelections = [...selectedOptions]
    updatedSelections[currentQuestionIndex] = index
    setSelectedOptions(updatedSelections)
  }

  const handleNext = () => {
    if (!quizStarted || isSubmitted) return
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1)
    }
  }

  const handlePrevious = () => {
    if (!quizStarted || isSubmitted) return
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1)
    }
  }

  const calculateScore = () => {
    return questions.reduce((acc, question, index) => {
      const questionScore =
        question.scorePerQuestion !== undefined && !isNaN(Number(question.scorePerQuestion))
          ? Number(question.scorePerQuestion)
          : score

      const correctOptionIndex = typeof question.correctOption === "number" ? question.correctOption : 0

      return acc + (selectedOptions[index] === correctOptionIndex ? questionScore : 0)
    }, 0)
  }

  const resetQuizState = () => {
    setQuizStarted(false)
    setIsSubmitted(false)
    setSelectedOptions([])
    setCurrentQuestionIndex(0)
    if (perQuestionTimer && perQuestionTimer > 0) {
      setTimerCount(perQuestionTimer * 60)
    }
  }

  const updateLocalStateAfterSubmission = (totalScore: number, newAttemptNumber: number, newBestScore: number, newBestAttemptNumber: number, newAttempts: any[]) => {
    // Update all local state immediately
    setCurrentAttempts(newAttemptNumber)
    setLastScore(totalScore)
    setAllAttempts(newAttempts)
    setBestScore(newBestScore)
    setBestAttemptNumber(newBestAttemptNumber)
    
    // Force a re-render
    setRefreshKey(prev => prev + 1)
    
    console.log("Updated local state:", {
      currentAttempts: newAttemptNumber,
      lastScore: totalScore,
      bestScore: newBestScore,
      bestAttemptNumber: newBestAttemptNumber,
      attemptsCount: newAttempts.length
    })
  }

  const handleSubmit = async () => {
    if (isSubmitted || isLoading) return
    
    if (
      selectedOptions.length !== questions.length ||
      selectedOptions.some((opt) => opt === undefined)
    ) {
      Alert.alert("Incomplete", "Please answer all questions before submitting.")
      return
    }

    const totalScore = calculateScore()
    setIsSubmitted(true)
    setIsLoading(true)

    if (!studentId || !quizId) {
      setIsLoading(false)
      return
    }

    try {
      const quizRef = doc(db, "students", studentId, "enrolledQuizzes", quizId)
      const attemptSnap = await getDoc(quizRef)
      const data = attemptSnap.data()
      const prevAttempts = Array.isArray(data?.attempts) ? data.attempts : []
      
      // Get current best score, handling 0 properly
      let currentBestScore = 0
      if (data && data.hasOwnProperty('bestScore') && typeof data.bestScore === 'number') {
        currentBestScore = data.bestScore
      }
      
      const currentBestAttemptNumber = data?.bestAttemptNumber || 0

      const newAttempts = [...prevAttempts, { score: totalScore, timestamp: Date.now() }]
      const newAttemptNumber = currentAttempts + 1

      // Determine if this is a new best score
      let newBestScore = currentBestScore
      let newBestAttemptNumber = currentBestAttemptNumber

      if (totalScore > currentBestScore) {
        newBestScore = totalScore
        newBestAttemptNumber = newAttemptNumber
      }

      // Update student's enrollment record
      await setDoc(
        quizRef,
        {
          quizId,
          subject,
          attemptsUsed: newAttemptNumber,
          lastScore: totalScore,
          bestScore: newBestScore,
          bestAttemptNumber: newBestAttemptNumber,
          attempts: newAttempts,
        },
        { merge: true },
      )

      // Also store attempt in quiz's studentAttempts collection for mentor access
      await addDoc(collection(db, "quizzes", quizId, "studentAttempts"), {
        studentId,
        score: totalScore,
        timestamp: Date.now(),
        attemptNumber: newAttemptNumber,
        subject,
        mentorName,
      })

      console.log("Submitted quiz with scores:", {
        totalScore,
        newBestScore,
        currentBestScore,
        isNewBest: totalScore > currentBestScore,
        newAttemptNumber
      })

      // Reset quiz state first
      resetQuizState()

      // Update local state immediately after successful Firebase write
      updateLocalStateAfterSubmission(totalScore, newAttemptNumber, newBestScore, newBestAttemptNumber, newAttempts)

      // Show success alert
      Alert.alert(
        "Quiz Submitted", 
        `You scored ${totalScore} points.${totalScore > currentBestScore ? ' New best score!' : ''}`, 
        [
          {
            text: "OK",
            onPress: async () => {
              // Additional refresh from Firebase to ensure consistency
              console.log("Alert OK pressed, refreshing data...")
              await checkAttemptLimit()
            },
          },
        ]
      )

    } catch (error) {
      console.error("Error submitting quiz:", error)
      Alert.alert("Error", "Failed to submit quiz. Please try again.")
      setIsSubmitted(false)
    } finally {
      setIsLoading(false)
    }
  }

  const allQuestionsAnswered =
    selectedOptions.length === questions.length && selectedOptions.every((opt) => opt !== undefined)

  // Calculate total possible score
  const totalPossibleScore = questions.reduce(
    (acc, q) =>
      acc +
      (q.scorePerQuestion !== undefined && !isNaN(Number(q.scorePerQuestion)) ? Number(q.scorePerQuestion) : score),
    0,
  )

  // Format timer display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`
  }

  return (
    <View style={styles.container} key={refreshKey}>
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
            <Text style={styles.quiz}>{subject}</Text>
            <Text style={styles.details}> Quiz</Text>
          </Text>
          <Text style={styles.subtitle}>By {mentorName}</Text>
        </View>

        {/* Loading Indicator */}
        {isLoading && (
          <View style={styles.loadingCard}>
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        )}

        {/* Attempts Card */}
        <View style={styles.attemptsCard}>
          <View style={styles.attemptsHeader}>
            <Text style={styles.attemptsIcon}>🎯</Text>
            <Text style={styles.attemptsTitle}>Quiz Progress</Text>
          </View>
          <View style={styles.attemptsInfo}>
            <View style={styles.attemptStat}>
              <Text style={styles.attemptStatLabel}>Used</Text>
              <Text style={styles.attemptStatValue}>
                {currentAttempts} <Text style={styles.attemptStatUnit}>/ {allowedAttempts}</Text>
              </Text>
            </View>
            <View style={styles.attemptDivider} />
            <View style={styles.attemptStat}>
              <Text style={styles.attemptStatLabel}>Last Score</Text>
              <Text style={styles.attemptStatValue}>
                {lastScore !== null ? (
                  <>
                    {lastScore} <Text style={styles.attemptStatUnit}>/ {totalPossibleScore}</Text>
                  </>
                ) : (
                  <Text style={styles.attemptStatUnit}>No attempts</Text>
                )}
              </Text>
            </View>
            <View style={styles.attemptDivider} />
            <View style={styles.attemptStat}>
              <Text style={styles.attemptStatLabel}>Best Score</Text>
              <Text style={styles.attemptStatValue}>
                {bestScore !== null ? (
                  <>
                    {bestScore} <Text style={styles.attemptStatUnit}>/ {totalPossibleScore}</Text>
                  </>
                ) : (
                  <Text style={styles.attemptStatUnit}>No attempts</Text>
                )}
              </Text>
              {bestAttemptNumber !== null && bestScore !== null && (
                <Text style={styles.attemptNumberLabel}>Attempt #{bestAttemptNumber}</Text>
              )}
            </View>
          </View>
        </View>

        {!quizStarted ? (
          <>
            {/* Quiz Info Card */}
            <View style={styles.infoCard}>
              <View style={styles.infoHeader}>
                <Text style={styles.infoIcon}>📋</Text>
                <Text style={styles.infoTitle}>Quiz Information</Text>
              </View>
              <View style={styles.infoContent}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Questions</Text>
                  <Text style={styles.infoValue}>{questions.length}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Timer</Text>
                  <Text style={styles.infoValue}>{perQuestionTimer ? `${perQuestionTimer} min` : "No timer"}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Points per Question</Text>
                  <Text style={styles.infoValue}>{score}</Text>
                </View>
              </View>
            </View>

            {/* Start Quiz Button */}
            <TouchableOpacity
              style={[styles.startButton, (currentAttempts >= allowedAttempts || isLoading) && styles.disabledButton]}
              onPress={() => {
                if (currentAttempts >= allowedAttempts) {
                  Alert.alert("Limit Reached", "You have used all attempts for this quiz.")
                  return
                }
                if (isLoading) return
                
                if (perQuestionTimer && perQuestionTimer > 0) {
                  setTimerCount(perQuestionTimer * 60)
                }
                setQuizStarted(true)
              }}
              disabled={currentAttempts >= allowedAttempts || isLoading}
            >
              <Text style={styles.startButtonIcon}>
                {isLoading ? "⏳" : currentAttempts >= allowedAttempts ? "🔒" : "🚀"}
              </Text>
              <Text style={styles.startButtonText}>
                {isLoading ? "Loading..." : currentAttempts >= allowedAttempts ? "No Attempts Left" : "Start Quiz"}
              </Text>
            </TouchableOpacity>

            {/* Attempt History */}
            {allowedAttempts > 0 && (
              <View style={styles.historyCard}>
                <View style={styles.historyHeader}>
                  <Text style={styles.historyIcon}>📊</Text>
                  <Text style={styles.historyTitle}>Your Attempts</Text>
                </View>
                {Array.from({ length: allowedAttempts }).map((_, idx) => {
                  const attempt = allAttempts[idx]
                  const isBestAttempt = bestAttemptNumber === idx + 1
                  return (
                    <View key={`${idx}-${refreshKey}`} style={[styles.attemptCard, isBestAttempt && styles.bestAttemptCard]}>
                      <View style={styles.attemptCardHeader}>
                        <View style={[styles.attemptNumberBadge, isBestAttempt && styles.bestAttemptBadge]}>
                          <Text style={styles.attemptNumberText}>{idx + 1}</Text>
                        </View>
                        <Text style={styles.attemptCardTitle}>
                          Attempt {idx + 1}
                          {isBestAttempt && <Text style={styles.bestLabel}> 🏆 Best</Text>}
                        </Text>
                      </View>
                      {attempt ? (
                        <View style={styles.attemptCardContent}>
                          <Text style={styles.attemptCardScore}>
                            Points: {attempt.score} / {totalPossibleScore}
                          </Text>
                          <Text style={styles.attemptCardDate}>{new Date(attempt.timestamp).toLocaleString()}</Text>
                        </View>
                      ) : (
                        <Text style={styles.attemptCardEmpty}>Not attempted yet</Text>
                      )}
                    </View>
                  )
                })}
              </View>
            )}
          </>
        ) : (
          <>
            {/* Timer Display */}
            {perQuestionTimer && perQuestionTimer > 0 && (
              <View style={styles.timerCard}>
                <Text style={styles.timerIcon}>⏱️</Text>
                <Text style={styles.timerValue}>{formatTime(timerCount)}</Text>
                <Text style={styles.timerLabel}>Remaining</Text>
              </View>
            )}

            {/* Questions List */}
            {Array.isArray(questions) && questions.length > 0 ? (
              questions.map((question, qIdx) => (
                <View key={qIdx} style={styles.questionCard}>
                  <View style={styles.questionHeader}>
                    <View style={styles.questionNumber}>
                      <Text style={styles.questionNumberText}>{qIdx + 1}</Text>
                    </View>
                    <Text style={styles.questionText}>{question.question}</Text>
                  </View>

                  <View style={styles.optionsContainer}>
                    {Array.isArray(question.options) &&
                      question.options.map((option: string, index: number) => (
                        <TouchableOpacity
                          key={index}
                          style={[styles.optionButton, selectedOptions[qIdx] === index && styles.selectedOption]}
                          onPress={() => {
                            const updatedSelections = [...selectedOptions]
                            updatedSelections[qIdx] = index
                            setSelectedOptions(updatedSelections)
                          }}
                          disabled={isSubmitted || isLoading}
                        >
                          <View
                            style={[styles.optionBadge, selectedOptions[qIdx] === index && styles.selectedOptionBadge]}
                          >
                            <Text
                              style={[
                                styles.optionBadgeText,
                                selectedOptions[qIdx] === index && styles.selectedOptionBadgeText,
                              ]}
                            >
                              {String.fromCharCode(65 + index)}
                            </Text>
                          </View>
                          <Text
                            style={[styles.optionText, selectedOptions[qIdx] === index && styles.selectedOptionText]}
                          >
                            {option}
                          </Text>
                        </TouchableOpacity>
                      ))}
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.errorCard}>
                <Text style={styles.errorIcon}>⚠️</Text>
                <Text style={styles.errorText}>No question data available.</Text>
              </View>
            )}

            {/* Submit Button */}
            {!isSubmitted && (
              <TouchableOpacity
                style={[styles.submitButton, (!allQuestionsAnswered || isLoading) && styles.disabledButton]}
                onPress={handleSubmit}
                disabled={!allQuestionsAnswered || isLoading}
              >
                <Text style={styles.submitButtonIcon}>{isLoading ? "⏳" : "✓"}</Text>
                <Text style={styles.submitButtonText}>{isLoading ? "Submitting..." : "Submit Quiz"}</Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </ScrollView>
    </View>
  )
}

// ... (styles remain the same as previous version)
const styles = StyleSheet.create({
  // ... all styles remain the same
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
    marginBottom: 8,
  },
  quiz: {
    color: "#7461EE",
  },
  details: {
    color: "#FF6B6B",
  },
  subtitle: {
    fontSize: 16,
    color: "#64748B",
    fontWeight: "500",
  },
  loadingCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  loadingText: {
    fontSize: 16,
    color: "#7461EE",
    fontWeight: "600",
  },
  attemptsCard: {
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
  attemptsHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  attemptsIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  attemptsTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1E293B",
  },
  attemptsInfo: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  attemptStat: {
    alignItems: "center",
    flex: 1,
  },
  attemptStatLabel: {
    fontSize: 14,
    color: "#64748B",
    fontWeight: "500",
    marginBottom: 4,
  },
  attemptStatValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1E293B",
  },
  attemptStatUnit: {
    fontSize: 14,
    color: "#64748B",
    fontWeight: "500",
  },
  attemptNumberLabel: {
    fontSize: 12,
    color: "#7461EE",
    fontWeight: "600",
    marginTop: 2,
  },
  attemptDivider: {
    height: 40,
    width: 1,
    backgroundColor: "#E2E8F0",
    marginHorizontal: 8,
  },
  infoCard: {
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
    borderColor: "rgba(255, 107, 107, 0.1)",
  },
  infoHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  infoIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1E293B",
  },
  infoContent: {
    marginTop: 8,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  infoLabel: {
    fontSize: 14,
    color: "#64748B",
    fontWeight: "500",
  },
  infoValue: {
    fontSize: 14,
    color: "#1E293B",
    fontWeight: "600",
  },
  startButton: {
    backgroundColor: "#7461EE",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    borderRadius: 16,
    marginHorizontal: 20,
    marginBottom: 24,
    shadowColor: "#7461EE",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  disabledButton: {
    backgroundColor: "#E2E8F0",
    shadowColor: "#94A3B8",
  },
  startButtonIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  startButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },
  historyCard: {
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
    borderColor: "rgba(52, 211, 153, 0.1)",
  },
  historyHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  historyIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1E293B",
  },
  attemptCard: {
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  bestAttemptCard: {
    backgroundColor: "rgba(255, 215, 0, 0.1)",
    borderColor: "#FFD700",
    borderWidth: 2,
  },
  attemptCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  attemptNumberBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#7461EE",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  bestAttemptBadge: {
    backgroundColor: "#FFD700",
  },
  attemptNumberText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  attemptCardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1E293B",
  },
  bestLabel: {
    color: "#FFD700",
    fontSize: 14,
    fontWeight: "700",
  },
  attemptCardContent: {
    marginLeft: 38,
  },
  attemptCardScore: {
    fontSize: 14,
    color: "#1E293B",
    fontWeight: "500",
    marginBottom: 4,
  },
  attemptCardDate: {
    fontSize: 12,
    color: "#64748B",
  },
  attemptCardEmpty: {
    marginLeft: 38,
    fontSize: 14,
    color: "#94A3B8",
    fontStyle: "italic",
  },
  timerCard: {
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
    alignItems: "center",
  },
  timerIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  timerValue: {
    fontSize: 32,
    fontWeight: "700",
    color: "#FF6B6B",
    marginBottom: 4,
  },
  timerLabel: {
    fontSize: 14,
    color: "#64748B",
    fontWeight: "500",
  },
  questionCard: {
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
  questionHeader: {
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
  },
  optionsContainer: {
    marginTop: 8,
  },
  optionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  selectedOption: {
    backgroundColor: "rgba(116, 97, 238, 0.1)",
    borderColor: "#7461EE",
  },
  optionBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#E2E8F0",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  selectedOptionBadge: {
    backgroundColor: "#7461EE",
  },
  optionBadgeText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#64748B",
  },
  selectedOptionBadgeText: {
    color: "#FFFFFF",
  },
  optionText: {
    flex: 1,
    fontSize: 14,
    color: "#1E293B",
    fontWeight: "500",
  },
  selectedOptionText: {
    color: "#1E293B",
    fontWeight: "600",
  },
  errorCard: {
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
    borderColor: "rgba(255, 107, 107, 0.1)",
    alignItems: "center",
  },
  errorIcon: {
    fontSize: 32,
    marginBottom: 12,
  },
  errorText: {
    fontSize: 16,
    color: "#EF4444",
    fontWeight: "500",
    textAlign: "center",
  },
  submitButton: {
    backgroundColor: "#34D399",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    borderRadius: 16,
    marginHorizontal: 20,
    marginTop: 8,
    shadowColor: "#34D399",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  submitButtonIcon: {
    fontSize: 20,
    marginRight: 8,
    color: "#FFFFFF",
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },
})

export default TakeQuizScreen