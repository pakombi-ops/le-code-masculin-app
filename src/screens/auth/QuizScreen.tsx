/**
 * QUIZ DE DIAGNOSTIC — 8 questions, une par pilier clé
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { AuthStackParamList, QuizResults } from '../../types';
import { Colors, Typography, Spacing, Radii } from '../../theme';
import { ProgressBar } from '../../components/ui/Components';
import Button from '../../components/ui/Button';
import SafeScreen from '../../components/layout/SafeScreen';
import { useAppStore } from '../../store/useAppStore';

type Nav = StackNavigationProp<AuthStackParamList, 'Quiz'>;

const QUIZ_QUESTIONS = [
  {
    id: 1, pillarId: 2, pillarName: 'DISCIPLINE',
    question: 'Dans une semaine typique, combien de fois tiens-tu tes engagements envers toi-même ?',
    answers: [
      { id: 'a', text: 'Presque jamais', score: 1 },
      { id: 'b', text: '1 ou 2 fois sur 5', score: 2 },
      { id: 'c', text: '3 ou 4 fois sur 5', score: 3 },
      { id: 'd', text: 'Toujours ou presque', score: 4 },
    ],
  },
  {
    id: 2, pillarId: 1, pillarName: 'FORCE PHYSIQUE',
    question: "À quelle fréquence pratiques-tu une activité physique intense ?",
    answers: [
      { id: 'a', text: 'Jamais ou rarement', score: 1 },
      { id: 'b', text: '1 fois par semaine', score: 2 },
      { id: 'c', text: '2 à 3 fois par semaine', score: 3 },
      { id: 'd', text: '4 fois ou plus par semaine', score: 4 },
    ],
  },
  {
    id: 3, pillarId: 7, pillarName: 'PRÉSENCE',
    question: "Dans tes interactions quotidiennes, es-tu vraiment présent ou souvent distrait ?",
    answers: [
      { id: 'a', text: 'Souvent distrait', score: 1 },
      { id: 'b', text: 'Parfois présent', score: 2 },
      { id: 'c', text: 'Généralement présent', score: 3 },
      { id: 'd', text: 'Pleinement présent', score: 4 },
    ],
  },
  {
    id: 4, pillarId: 5, pillarName: 'BUT',
    question: "As-tu une vision claire de ce que tu veux accomplir dans les 5 prochaines années ?",
    answers: [
      { id: 'a', text: 'Aucune idée', score: 1 },
      { id: 'b', text: 'Quelques idées vagues', score: 2 },
      { id: 'c', text: "Une direction générale", score: 3 },
      { id: 'd', text: 'Une vision précise et écrite', score: 4 },
    ],
  },
  {
    id: 5, pillarId: 3, pillarName: 'LEADERSHIP',
    question: "Prends-tu des initiatives dans ta vie professionnelle et personnelle ?",
    answers: [
      { id: 'a', text: 'Je suis rarement', score: 1 },
      { id: 'b', text: 'Parfois, si les conditions sont réunies', score: 2 },
      { id: 'c', text: 'Souvent, même en terrain inconnu', score: 3 },
      { id: 'd', text: "Je guide naturellement les autres", score: 4 },
    ],
  },
  {
    id: 6, pillarId: 10, pillarName: 'COURAGE',
    question: "Face à une situation difficile, quelle est ta réaction habituelle ?",
    answers: [
      { id: 'a', text: "J'évite ou je reporte", score: 1 },
      { id: 'b', text: "J'hésite longtemps puis j'agis", score: 2 },
      { id: 'c', text: "J'agis malgré l'inconfort", score: 3 },
      { id: 'd', text: "Je vois les défis comme des opportunités", score: 4 },
    ],
  },
  {
    id: 7, pillarId: 6, pillarName: 'HONNEUR',
    question: "Ta parole et tes actions sont-elles alignées au quotidien ?",
    answers: [
      { id: 'a', text: "Rarement", score: 1 },
      { id: 'b', text: "Parfois", score: 2 },
      { id: 'c', text: "La plupart du temps", score: 3 },
      { id: 'd', text: "Mon intégrité est non négociable", score: 4 },
    ],
  },
  {
    id: 8, pillarId: 12, pillarName: 'HÉRITAGE',
    question: "Penses-tu à l'impact que tu veux laisser sur les personnes autour de toi ?",
    answers: [
      { id: 'a', text: "Pas vraiment", score: 1 },
      { id: 'b', text: "Parfois en surface", score: 2 },
      { id: 'c', text: "Régulièrement", score: 3 },
      { id: 'd', text: "C'est au cœur de mes décisions", score: 4 },
    ],
  },
];

export default function QuizScreen() {
  const navigation = useNavigation<Nav>();
  const { setQuizResults } = useAppStore();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});

  const question = QUIZ_QUESTIONS[currentQuestion];
  const selectedAnswer = answers[question.id];
  const progress = ((currentQuestion + 1) / QUIZ_QUESTIONS.length) * 100;

  const handleAnswer = (answerId: string) => {
    setAnswers((prev) => ({ ...prev, [question.id]: answerId }));
  };

  const handleNext = () => {
    if (!selectedAnswer) return;

    if (currentQuestion < QUIZ_QUESTIONS.length - 1) {
      setCurrentQuestion((c) => c + 1);
    } else {
      // Calculer les résultats
      const scores: Record<number, number> = {};
      QUIZ_QUESTIONS.forEach((q) => {
        const answerScore = q.answers.find((a) => a.id === answers[q.id])?.score ?? 2;
        // Score sur 10 (answerScore 1-4 → 2.5-10)
        scores[q.pillarId] = Math.round(answerScore * 2.5);
      });

      // Les 3 piliers avec les scores les plus bas = priorités
      const sortedByScore = Object.entries(scores).sort(([, a], [, b]) => a - b);
      const priorityPillars = sortedByScore.slice(0, 3).map(([id]) => parseInt(id));

      const results: QuizResults = {
        scores,
        priorityPillars,
        completedAt: new Date().toISOString(),
      };

      setQuizResults(results);
      navigation.navigate('QuizResult', { results });
    }
  };

  return (
    <SafeScreen edges={['top', 'bottom']}>
      <View style={styles.container}>
        {/* Progress */}
        <View style={styles.progressContainer}>
          <Text style={styles.progressLabel}>
            Question {currentQuestion + 1} / {QUIZ_QUESTIONS.length}
          </Text>
          <ProgressBar progress={progress} />
        </View>

        {/* Question */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.pillarLabel}>{question.pillarName}</Text>
          <Text style={styles.question}>{question.question}</Text>

          <View style={styles.answers}>
            {question.answers.map((answer) => (
              <TouchableOpacity
                key={answer.id}
                style={[
                  styles.answerCard,
                  selectedAnswer === answer.id && styles.answerCardSelected,
                ]}
                onPress={() => handleAnswer(answer.id)}
                activeOpacity={0.8}
              >
                <View style={[
                  styles.answerIndicator,
                  selectedAnswer === answer.id && styles.answerIndicatorSelected,
                ]}>
                  {selectedAnswer === answer.id && (
                    <Text style={styles.answerCheck}>✓</Text>
                  )}
                </View>
                <Text style={[
                  styles.answerText,
                  selectedAnswer === answer.id && styles.answerTextSelected,
                ]}>
                  {answer.text}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Next */}
        <View style={styles.footer}>
          <Button
            label={currentQuestion === QUIZ_QUESTIONS.length - 1 ? 'Voir mes résultats' : 'Suivant'}
            onPress={handleNext}
            disabled={!selectedAnswer}
            fullWidth
            size="lg"
          />
        </View>
      </View>
    </SafeScreen>
  );
}

// ─────────────────────────────────────────
// QUIZ RESULT SCREEN
// ─────────────────────────────────────────
import type { RouteProp } from '@react-navigation/native';

type ResultNav = StackNavigationProp<AuthStackParamList, 'QuizResult'>;
type ResultRoute = RouteProp<AuthStackParamList, 'QuizResult'>;

export function QuizResultScreen({ route }: { route: ResultRoute }) {
  const navigation = useNavigation<ResultNav>();
  const { setAuthenticated } = useAppStore();
  const { results } = route.params;

  const PILLAR_NAMES: Record<number, string> = {
    1: 'Force Physique', 2: 'Discipline', 3: 'Leadership',
    4: 'Vulnérabilité', 5: 'But', 6: 'Honneur',
    7: 'Présence', 8: 'Stoïcisme', 9: 'Générosité',
    10: 'Courage', 11: 'Authenticité', 12: 'Héritage',
  };

  const handleStart = () => {
    setAuthenticated(true);
    // La navigation vers Main se fera via le RootNavigator
  };

  return (
    <SafeScreen scrollable padded>
      <View style={resultStyles.container}>
        <Text style={resultStyles.title}>Ton Code Masculin{'\n'}de départ</Text>
        <Text style={resultStyles.subtitle}>
          Voici tes 3 piliers prioritaires selon tes réponses.
        </Text>

        {/* Piliers prioritaires */}
        <View style={resultStyles.prioritiesSection}>
          <Text style={resultStyles.sectionLabel}>TES PRIORITÉS</Text>
          {results.priorityPillars.map((pillarId, idx) => (
            <View key={pillarId} style={resultStyles.priorityCard}>
              <View style={resultStyles.priorityBadge}>
                <Text style={resultStyles.priorityNumber}>{idx + 1}</Text>
              </View>
              <View style={resultStyles.priorityInfo}>
                <Text style={resultStyles.priorityName}>{PILLAR_NAMES[pillarId]}</Text>
                <Text style={resultStyles.priorityScore}>
                  Score initial : {results.scores[pillarId] ?? 5}/10
                </Text>
              </View>
              <View style={resultStyles.priorityScoreBar}>
                <ProgressBar
                  progress={(results.scores[pillarId] ?? 5) * 10}
                  height={4}
                  color={Colors.gold.primary}
                />
              </View>
            </View>
          ))}
        </View>

        {/* Message */}
        <View style={resultStyles.messageCard}>
          <Text style={resultStyles.messageText}>
            "Le programme commence par les fondations. Peu importe où tu en es, chaque homme peut écrire un nouveau Code."
          </Text>
          <Text style={resultStyles.messageAuthor}>— Prince Johann</Text>
        </View>

        {/* CTA */}
        <Button
          label="Démarrer mon programme"
          onPress={handleStart}
          fullWidth
          size="lg"
          style={resultStyles.cta}
        />
        <Text style={resultStyles.freeNote}>10 messages de coaching offerts</Text>
      </View>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  progressContainer: { paddingHorizontal: Spacing.screenPadding, paddingTop: Spacing.lg, gap: Spacing.sm },
  progressLabel: { ...Typography.styles.caption, color: Colors.text.tertiary },
  content: { flex: 1, paddingHorizontal: Spacing.screenPadding, paddingTop: Spacing['2xl'] },
  pillarLabel: { ...Typography.styles.label, marginBottom: Spacing.md },
  question: { ...Typography.styles.heading2, marginBottom: Spacing['2xl'], lineHeight: 30 },
  answers: { gap: Spacing.md, paddingBottom: Spacing['4xl'] },
  answerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.background.secondary,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: Colors.border.default,
    padding: Spacing.base,
  },
  answerCardSelected: {
    borderColor: Colors.gold.primary,
    borderWidth: 1.5,
    backgroundColor: Colors.gold.subtle,
  },
  answerIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.border.subtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  answerIndicatorSelected: {
    backgroundColor: Colors.gold.primary,
    borderColor: Colors.gold.primary,
  },
  answerCheck: { color: Colors.text.onGold, fontSize: 12, fontWeight: Typography.weight.bold },
  answerText: { flex: 1, ...Typography.styles.body, color: Colors.text.secondary },
  answerTextSelected: { color: Colors.text.primary, fontWeight: Typography.weight.medium },
  footer: { paddingHorizontal: Spacing.screenPadding, paddingBottom: Spacing['2xl'], paddingTop: Spacing.base },
});

const resultStyles = StyleSheet.create({
  container: { paddingTop: Spacing['2xl'], gap: Spacing.lg },
  title: { ...Typography.styles.displayMedium, lineHeight: 42 },
  subtitle: { ...Typography.styles.body, color: Colors.text.secondary },
  prioritiesSection: { gap: Spacing.md },
  sectionLabel: { ...Typography.styles.label },
  priorityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.background.secondary,
    borderRadius: Radii.lg,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.gold.border,
    flexWrap: 'wrap',
  },
  priorityBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.gold.subtle,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.gold.border,
  },
  priorityNumber: { color: Colors.gold.primary, fontWeight: Typography.weight.bold },
  priorityInfo: { flex: 1, gap: Spacing.xs },
  priorityName: { ...Typography.styles.bodyBold },
  priorityScore: { ...Typography.styles.caption, color: Colors.text.tertiary },
  priorityScoreBar: { width: '100%', marginTop: Spacing.xs },
  messageCard: {
    backgroundColor: Colors.background.secondary,
    borderRadius: Radii.lg,
    borderLeftWidth: 3,
    borderLeftColor: Colors.gold.primary,
    padding: Spacing.base,
    gap: Spacing.sm,
  },
  messageText: { ...Typography.styles.body, fontStyle: 'italic', color: Colors.text.secondary, lineHeight: 24 },
  messageAuthor: { ...Typography.styles.caption, color: Colors.gold.primary },
  cta: { marginTop: Spacing.md },
  freeNote: { ...Typography.styles.caption, color: Colors.text.tertiary, textAlign: 'center' },
});
