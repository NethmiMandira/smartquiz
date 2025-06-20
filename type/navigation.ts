export type RootStackParamList = {
  GetStarted: undefined
  Auth: undefined
  Login: undefined
  Signup: undefined
  EmailVerification: {
    email: string
  }
  DashboardScreen: undefined
  StudentDashboardScreen: undefined
  MentorDashboardScreen: undefined
  CreateQuiz: {
    quizId: string
    subject: string
    isEdit: boolean
    attempts?: number
    questions?: number
    score?: number
    timer?: number
  }
  UpdateQuiz: {
    quizId: string
    subject: string
    isEdit: boolean
    attempts?: number
    questions?: number
    score?: number
    timer?: number
  }
  QuizList: undefined
  Settings: undefined
  Help: undefined
  Logout: undefined // Added Logout screen
  Question: {
    quizId: string
    subject: string
  }
  QuizDetails: {
    quizId: string
    subject: string
    quiz: {
      id: string
      subject: string
      attempts?: number
      questions?: number
      score?: number
      timer?: number
      published: boolean
      addedQuestions: number
    }
  }
  QuestionList: {
    quizId: string
    subject: string
  }
  UpdateQuestion: {
    quizId: string
    subject: string
  }
  TakeQuiz: {
    quizId: string
    subject: string
    questions: any[]
    studentId: string
    allowedAttempts: number
    currentAttempts: number
    perQuestionTimer?: number
    mentorName: string
    score?: number
  }
  StudentAttempts: {
    quizId: string
    subject: string
    studentAttempts: Array<{
      studentId: string
      firstName: string
      lastName: string
      score: number
      attemptNumber: number
      timestamp: number
    }>
  }
  StudentAttemptsScreen: {
    quizId?: string
    subject?: string
    studentAttempts?: Array<{
      studentId: string
      firstName: string
      lastName: string
      score: number
      attemptNumber: number
      timestamp: number
    }>
  } | undefined
}