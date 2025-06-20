import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export default function GetStartedScreen({ navigation }: any) {
  return (
    <View style={styles.container}>
      {/* Background Gradient Elements */}
      <View style={styles.backgroundCircle1} />
      <View style={styles.backgroundCircle2} />
      <View style={styles.backgroundCircle3} />

      {/* Main Content */}
      <View style={styles.mainContent}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>
            <Text style={styles.smart}>Smart</Text>
            <Text style={styles.quiz}>Quiz</Text>
          </Text>
        </View>

        <View style={styles.illustrationContainer}>
          {/* Learning Journey Illustration */}
          <View style={styles.learningIllustration}>
            {/* Central Learning Hub */}
            <View style={styles.learningHub}>
              <View style={styles.hubCircle}>
                <Text style={styles.hubIcon}>📖</Text>
              </View>
              <Text style={styles.hubLabel}>Learn</Text>
            </View>

            {/* Subject Bubbles */}
            <View style={styles.subjectBubbles}>
              <View style={[styles.bubble, styles.bubble1]}>
                <Text style={styles.bubbleIcon}>🔢</Text>
                <Text style={styles.bubbleText}>Math</Text>
              </View>
              <View style={[styles.bubble, styles.bubble2]}>
                <Text style={styles.bubbleIcon}>🧪</Text>
                <Text style={styles.bubbleText}>Science</Text>
              </View>
              <View style={[styles.bubble, styles.bubble3]}>
                <Text style={styles.bubbleIcon}>🌍</Text>
                <Text style={styles.bubbleText}>Geography</Text>
              </View>
              <View style={[styles.bubble, styles.bubble4]}>
                <Text style={styles.bubbleIcon}>📚</Text>
                <Text style={styles.bubbleText}>Literature</Text>
              </View>
            </View>

            {/* Achievement Stars */}
            <View style={styles.achievementStars}>
              <View style={[styles.achievementStar, styles.star1]}>
                <Text style={styles.starText}>⭐</Text>
              </View>
              <View style={[styles.achievementStar, styles.star2]}>
                <Text style={styles.starText}>✨</Text>
              </View>
              <View style={[styles.achievementStar, styles.star3]}>
                <Text style={styles.starText}>🌟</Text>
              </View>
            </View>

            {/* Knowledge Path */}
            <View style={styles.knowledgePath}>
              <View style={styles.pathDot}></View>
              <View style={styles.pathLine}></View>
              <View style={styles.pathDot}></View>
              <View style={styles.pathLine}></View>
              <View style={styles.pathDot}></View>
            </View>

            {/* Quiz Badge */}
            <View style={styles.quizBadge}>
              <Text style={styles.badgeIcon}>🎯</Text>
              <Text style={styles.badgeText}>Quiz Master</Text>
            </View>
          </View>
        </View>

        <View style={styles.textContent}>
          <Text style={styles.description}>
            Master your subjects with SmartQuiz practice, learn, and succeed with quizzes tailored just for you!
          </Text>
        </View>
      </View>

      {/* Bottom Section */}
      <View style={styles.bottomSection}>
        <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Auth')}>
          <Text style={styles.buttonIcon}>🚀</Text>
          <Text style={styles.buttonText}>Get Started</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFF',
  },
  backgroundCircle1: {
    position: 'absolute',
    top: -100,
    right: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(116, 97, 238, 0.1)',
  },
  backgroundCircle2: {
    position: 'absolute',
    top: height * 0.3,
    left: -80,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255, 107, 107, 0.08)',
  },
  backgroundCircle3: {
    position: 'absolute',
    bottom: 100,
    right: -60,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(52, 211, 153, 0.1)',
  },
  mainContent: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: width * 0.13,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -1,
  },
  smart: {
    color: '#7461EE',
  },
  quiz: {
    color: '#FF6B6B',
  },
  illustrationContainer: {
    alignItems: 'center',
    marginBottom: 40,
    width: width * 0.9,
    height: 220,
  },
  learningIllustration: {
    width: '100%',
    height: '100%',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  learningHub: {
    position: 'absolute',
    alignItems: 'center',
    top: 60,
  },
  hubCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#7461EE',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#7461EE',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  hubIcon: {
    fontSize: 32,
  },
  hubLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7461EE',
    marginTop: 8,
  },
  subjectBubbles: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  bubble: {
    position: 'absolute',
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 2,
  },
  bubble1: {
    top: 20,
    left: 20,
    borderColor: '#FF6B6B',
  },
  bubble2: {
    top: 20,
    right: 20,
    borderColor: '#34D399',
  },
  bubble3: {
    bottom: 40,
    left: 30,
    borderColor: '#F59E0B',
  },
  bubble4: {
    bottom: 40,
    right: 30,
    borderColor: '#8B5CF6',
  },
  bubbleIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  bubbleText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#334155',
  },
  achievementStars: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  achievementStar: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  star1: {
    top: 10,
    left: '50%',
    marginLeft: -15,
  },
  star2: {
    top: 40,
    right: 10,
  },
  star3: {
    bottom: 20,
    left: 10,
  },
  starText: {
    fontSize: 16,
  },
  knowledgePath: {
    position: 'absolute',
    bottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  pathDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#7461EE',
  },
  pathLine: {
    width: 30,
    height: 2,
    backgroundColor: '#CBD5E1',
    marginHorizontal: 4,
  },
  quizBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#FF6B6B',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  badgeIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  textContent: {
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  description: {
    fontSize: 16,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: '400',
  },
  bottomSection: {
    paddingHorizontal: 20,
    paddingBottom: height * 0.12,
    alignItems: 'center',
  },
  button: {
    backgroundColor: '#7461EE',
    paddingVertical: 20,
    paddingHorizontal: 50,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7461EE',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
    minWidth: width * 0.75,
  },
  buttonIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600',
  },
});