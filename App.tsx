import { NavigationContainer } from "@react-navigation/native"
import { createNativeStackNavigator } from "@react-navigation/native-stack"

import GetStartedScreen from "./screen/GetStartedScreen"
import AuthScreen from "./screen/AuthScreen"
import LoginScreen from "./screen/LoginScreen"
import SignupScreen from "./screen/SignupScreen"
import EmailVerificationScreen from "./screen/EmailVerificationScreen"
import DashboardScreen from "./screen/DashboardScreen"
import StudentDashboardScreen from "./screen/StudentDashboardScreen"
import MentorDashboardScreen from "./screen/MentorDashboardScreen"
import CreateQuizScreen from "./screen/CreateQuizScreen"
import QuizListScreen from "./screen/QuizListScreen"
import SettingsScreen from "./screen/SettingScreen"
import LogOutScreen from "./screen/LogOutScreen"
import QuestionScreen from "./screen/QuestionScreen"
import QuizDetailsScreen from "./screen/QuizDetailsScreen"
import QuestionListScreen from "./screen/QuestionListScreen"
import UpdateQuestionScreen from "./screen/UpdateQuestionScreen"
import TakeQuizScreen from "./screen/TakeQuizScreen"
import StudentAttemptsScreen from "./screen/StudentAttemptsScreen"

import type { RootStackParamList } from "./type/navigation"

const Stack = createNativeStackNavigator<RootStackParamList>()

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="GetStarted" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="GetStarted" component={GetStartedScreen} />
        <Stack.Screen name="Auth" component={AuthScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Signup" component={SignupScreen} />
        <Stack.Screen name="EmailVerification" component={EmailVerificationScreen} />
        <Stack.Screen name="DashboardScreen" component={DashboardScreen} />
        <Stack.Screen name="StudentDashboardScreen" component={StudentDashboardScreen} />
        <Stack.Screen name="MentorDashboardScreen" component={MentorDashboardScreen} />
        <Stack.Screen name="CreateQuiz" component={CreateQuizScreen} />
        <Stack.Screen name="UpdateQuiz" component={CreateQuizScreen} />
        <Stack.Screen name="QuizList" component={QuizListScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen name="Logout" component={LogOutScreen} />
        <Stack.Screen name="Question" component={QuestionScreen} />
        <Stack.Screen name="QuizDetails" component={QuizDetailsScreen} />
        <Stack.Screen name="QuestionList" component={QuestionListScreen} />
        <Stack.Screen name="UpdateQuestion" component={UpdateQuestionScreen} />
        <Stack.Screen name="TakeQuiz" component={TakeQuizScreen} />
        <Stack.Screen name="StudentAttemptsScreen" component={StudentAttemptsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  )
}