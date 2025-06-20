"use client"

import { useState } from "react"
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView, Dimensions } from "react-native"
import { type RouteProp, useRoute, useNavigation } from "@react-navigation/native"
import type { RootStackParamList } from "../type/navigation"
import { doc, updateDoc } from "firebase/firestore"
import { db } from "./FirebaseConfig"

import type { StackNavigationProp } from "@react-navigation/stack"

const { width, height } = Dimensions.get("window")

type UpdateQuestionRouteProp = RouteProp<RootStackParamList, "UpdateQuestion">
type NavigationProp = StackNavigationProp<RootStackParamList>

const UpdateQuestionScreen = () => {
  const route = useRoute<UpdateQuestionRouteProp>()
  const navigation = useNavigation<NavigationProp>()

  // Fix: param name is `question`, NOT `questionText`
  const { quizId, questionId, question, options: initialOptions, correctOption: initialCorrectOption } = route.params

  const [questionText, setQuestionText] = useState(question)
  const [options, setOptions] = useState(initialOptions)
  const [correctOption, setCorrectOption] = useState<number>(initialCorrectOption)

  const handleOptionChange = (text: string, index: number) => {
    const newOptions = [...options]
    newOptions[index] = text
    setOptions(newOptions)
  }

  const handleUpdate = async () => {
    if (!questionText.trim() || options.some((opt) => !opt.trim()) || correctOption === null) {
      Alert.alert("Validation Error", "Please fill in all fields and select the correct option.")
      return
    }

    try {
      const questionDocRef = doc(db, "quizzes", quizId, "questions", questionId)
      await updateDoc(questionDocRef, {
        question: questionText,
        options,
        correctOption,
        updatedAt: new Date(),
      })
      Alert.alert("Success", "Question updated successfully!")
      navigation.goBack()
    } catch (error) {
      console.error("Error updating question:", error)
      Alert.alert("Error", "Failed to update question.")
    }
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
            <Text style={styles.update}>Update</Text>
            <Text style={styles.question}> Question</Text>
          </Text>
          <Text style={styles.subtitle}>Edit your question and answer options</Text>
        </View>

        {/* Question Card */}
        <View style={styles.questionCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardIcon}>✏️</Text>
            <Text style={styles.cardTitle}>Question Text</Text>
          </View>
          <TextInput
            style={styles.questionInput}
            placeholder="Enter your question here..."
            placeholderTextColor="#94A3B8"
            value={questionText}
            onChangeText={setQuestionText}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Options Card */}
        <View style={styles.optionsCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardIcon}>📝</Text>
            <Text style={styles.cardTitle}>Answer Options</Text>
          </View>

          {options.map((opt, index) => (
            <View key={index} style={styles.optionContainer}>
              <View style={styles.optionHeader}>
                <Text style={styles.optionLabel}>Option {String.fromCharCode(65 + index)}</Text>
                <TouchableOpacity
                  style={[styles.correctButton, correctOption === index && styles.selectedCorrect]}
                  onPress={() => setCorrectOption(index)}
                >
                  <Text style={[styles.correctText, correctOption === index && styles.selectedCorrectText]}>
                    {correctOption === index ? "✓" : "○"}
                  </Text>
                </TouchableOpacity>
              </View>
              <TextInput
                style={styles.optionInput}
                placeholder={`Enter option ${String.fromCharCode(65 + index)}`}
                placeholderTextColor="#94A3B8"
                value={opt}
                onChangeText={(text) => handleOptionChange(text, index)}
              />
            </View>
          ))}

          <View style={styles.correctHint}>
            <Text style={styles.hintIcon}>💡</Text>
            <Text style={styles.hintText}>Tap the circle to mark the correct answer</Text>
          </View>
        </View>

        {/* Update Button */}
        <TouchableOpacity style={styles.submitButton} onPress={handleUpdate}>
          <Text style={styles.submitIcon}>💾</Text>
          <Text style={styles.submitText}>Update Question</Text>
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
  update: {
    color: "#7461EE",
  },
  question: {
    color: "#FF6B6B",
  },
  subtitle: {
    fontSize: 16,
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
  optionsCard: {
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
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
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
  questionInput: {
    borderWidth: 2,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: "#1E293B",
    backgroundColor: "#F8FAFC",
    minHeight: 80,
    textAlignVertical: "top",
    fontWeight: "500",
  },
  optionContainer: {
    marginBottom: 16,
  },
  optionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748B",
  },
  correctButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#E2E8F0",
  },
  selectedCorrect: {
    backgroundColor: "#34D399",
    borderColor: "#34D399",
  },
  correctText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#64748B",
  },
  selectedCorrectText: {
    color: "#FFFFFF",
  },
  optionInput: {
    borderWidth: 2,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: "#1E293B",
    backgroundColor: "#F8FAFC",
    fontWeight: "500",
  },
  correctHint: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF3C7",
    padding: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  hintIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  hintText: {
    fontSize: 14,
    color: "#92400E",
    fontWeight: "500",
    flex: 1,
  },
  submitButton: {
    backgroundColor: "#34D399",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    borderRadius: 16,
    marginHorizontal: 20,
    shadowColor: "#34D399",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  submitIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  submitText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },
})

export default UpdateQuestionScreen
