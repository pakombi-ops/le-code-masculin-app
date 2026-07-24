import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Animated, Dimensions, Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Colors, Typography, Spacing, Radius, Shadow } from '../../theme';
import { getLessonById, formatDuration } from '../../constants/lessons';
import { getPillarById } from '../../constants/pillars';
import { useAuthStore } from '../../store/authStore';
import { getNextLesson, getLessonStatus, getCompletedLessonIds } from '../../constants/progression';

const { width } = Dimensions.get('window');
type Tab = 'resume' | 'defi' | 'notes';

export default function LeconScreen() {
  const { lessonId } = useLocalSearchParams<{ lessonId: string }>();
  const lesson = getLessonById(lessonId ?? '');
  const pillar = lesson ? getPillarById(lesson.pillarId) : null;
  const { user, userProgress, completeLessonAndRefresh } = useAuthStore();

  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [activeTab, setActiveTab] = useState<Tab>('resume');
  const [defiDone, setDefiDone] = useState(false);
  const [note, setNote] = useState('');
  const [completing, setCompleting] = useState(false);

  const progressAnim = useRef(new Animated.Value(0)).current;
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isCompleted = lesson
    ? userProgress.some((p) => p.lesson_id === lesson.id)
    : false;

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  if (!lesson || !pillar) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTxt}>Leçon introuvable.</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.errorBack}>← Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const duration = lesson.duration;
  const phaseColor = pillar.color ?? Colors.brand.gold;

  const handlePlayPause = () => {
    if (isPlaying) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
      intervalRef.current = setInterval(() => {
        setElapsed(prev => {
          const next = prev + 1;
          if (next >= duration) {
            clearInterval(intervalRef.current!);
            setIsPlaying(false);
            setProgress(1);
            return duration;
          }
          const newProgress = next / duration;
          setProgress(newProgress);
          Animated.timing(progressAnim, {
            toValue: newProgress,
            duration: 900,
            useNativeDriver: false,
          }).start();
          return next;
        });
      }, 1000);
    }
  };

  const handleRewind = () => {
    const newElapsed = Math.max(0, elapsed - 15);
    setElapsed(newElapsed);
    setProgress(newElapsed / duration);
  };

  const handleForward = () => {
    const newElapsed = Math.min(duration, elapsed + 15);
    setElapsed(newElapsed);
    setProgress(newElapsed / duration);
  };

  const handleDefiDone = () => {
    setDefiDone(true);
    Alert.alert(
      '💪 Défi accompli !',
      "Excellent. Chaque défi complété t'rapproche de l'homme que tu construis.",
      [{ text: 'Continuer', style: 'default' }]
    );
  };

  const handleCompleteAndNext = async () => {
    if (!user?.id) return;
    setCompleting(true);
    try {
    if (!isCompleted) {
      await completeLessonAndRefresh(user.id, lesson.pillarId, lesson.id);
    }

    const next = getNextLesson(lesson.id);
    if (!next) {
      Alert.alert('🎉 Félicitations', 'Tu as terminé la dernière leçon disponible !', [
        { text: 'Retour au programme', onPress: () => router.push('/(tabs)/programme') },
      ]);
      return;
    }

    const completedIds = getCompletedLessonIds(useAuthStore.getState().userProgress);
    const nextStatus = getLessonStatus(next, completedIds, useAuthStore.getState().userProgress);

    if (nextStatus === 'locked') {
      Alert.alert(
        '🔒 Leçon verrouillée',
        "La prochaine leçon se débloque 7 jours après avoir terminé celle-ci. Reviens bientôt !",
        [{ text: 'Retour au programme', onPress: () => router.push('/(tabs)/programme') }]
      );
      return;
    }

    router.replace({ pathname: '/lecon', params: { lessonId: next.id } });
    } catch (err) {
    console.error('Erreur completeLessonAndRefresh:', err);
    Alert.alert('Erreur', "Impossible d'enregistrer ta progression pour le moment.");
    } finally {
    setCompleting(false);
    }
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.navBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.navTitle} numberOfLines={1}>
          Semaine {lesson.weekNumber}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.playerCard}>
          <View style={[styles.playerVisual, { borderColor: phaseColor }]}>
            <Text style={[styles.playerPillarNum, { color: phaseColor }]}>{pillar.id}</Text>
            <Text style={styles.playerPillarName}>{pillar.name}</Text>
          </View>

          <Text style={styles.playerLabel}>PILIER {pillar.id} · {pillar.name.toUpperCase()}</Text>
          <Text style={styles.playerTitle}>{lesson.title}</Text>
          <Text style={styles.playerMeta}>
            {lesson.type === 'audio' ? '🎧 Audio' : '▶️ Vidéo'} · {formatDuration(duration)}
          </Text>

          {isCompleted && (
            <View style={styles.completedBadge}>
              <Text style={styles.completedBadgeTxt}>✓ Leçon complétée</Text>
            </View>
          )}

          <View style={styles.scrubberArea}>
            <View style={styles.scrubberTrack}>
              <Animated.View
                style={[
                  styles.scrubberFill,
                  {
                    width: progressAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
                    backgroundColor: phaseColor,
                  },
                ]}
              />
              <Animated.View
                style={[
                  styles.scrubberKnob,
                  {
                    left: progressAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '97%'] }),
                    backgroundColor: phaseColor,
                  },
                ]}
              />
            </View>
            <View style={styles.timeRow}>
              <Text style={styles.timeText}>{formatTime(elapsed)}</Text>
              <Text style={styles.timeText}>{formatTime(duration)}</Text>
            </View>
          </View>

          <View style={styles.controls}>
            <TouchableOpacity onPress={handleRewind} style={styles.controlBtn}>
              <Text style={styles.controlTxt}>⟨15</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handlePlayPause} style={[styles.playBtn, { backgroundColor: phaseColor }]}>
              <Text style={styles.playBtnTxt}>{isPlaying ? '❙❙' : '▶'}</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleForward} style={styles.controlBtn}>
              <Text style={styles.controlTxt}>15⟩</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.tabs}>
          {(['resume', 'defi', 'notes'] as Tab[]).map(tab => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabTxt, activeTab === tab && styles.tabTxtActive]}>
                {tab === 'resume' ? 'Résumé' : tab === 'defi' ? 'Défi' : 'Notes'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.tabContent}>
          {activeTab === 'resume' && (
            <View>
              <Text style={styles.tabBodyText}>{lesson.description}</Text>
              <View style={styles.insightCard}>
                <Text style={styles.insightLabel}>INSIGHT CLÉ</Text>
                <Text style={styles.insightText}>"{lesson.keyInsight}"</Text>
              </View>
            </View>
          )}

          {activeTab === 'defi' && (
            <View>
              <View style={[styles.defiCard, { borderColor: phaseColor }]}>
                <Text style={[styles.defiLabel, { color: phaseColor }]}>DÉFI DE LA SEMAINE</Text>
                <Text style={styles.defiText}>{lesson.challenge}</Text>
              </View>

              {!defiDone ? (
                <TouchableOpacity
                  style={[styles.defiBtn, { backgroundColor: phaseColor }]}
                  onPress={handleDefiDone}
                  activeOpacity={0.85}
                >
                  <Text style={styles.defiBtnTxt}>Marquer comme accompli ✓</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.defiDone}>
                  <Text style={styles.defiDoneTxt}>✅ Défi accompli cette semaine</Text>
                </View>
              )}

              <TouchableOpacity
                style={styles.journalBtn}
                onPress={() => Alert.alert('Journal', 'Fonctionnalité journal bientôt disponible.')}
              >
                <Text style={styles.journalBtnTxt}>📝 Écrire dans mon journal</Text>
              </TouchableOpacity>
            </View>
          )}

          {activeTab === 'notes' && (
            <View>
              <View style={styles.noteArea}>
                <Text style={styles.notePlaceholder}>
                  {note || 'Tes notes personnelles sur cette leçon...'}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.noteBtn}
                onPress={() => Alert.alert('Notes', 'Éditeur de notes bientôt disponible.')}
              >
                <Text style={styles.noteBtnTxt}>✏️ Écrire une note</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.nextArea}>
          <TouchableOpacity
            style={[styles.nextBtn, completing && { opacity: 0.6 }]}
            onPress={handleCompleteAndNext}
            disabled={completing}
          >
            <Text style={styles.nextBtnTxt}>
              {completing ? 'Enregistrement...' : isCompleted ? 'Leçon suivante →' : 'Terminer et continuer →'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 50 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background.primary },
  errorContainer: { flex: 1, backgroundColor: Colors.background.primary, alignItems: 'center', justifyContent: 'center' },
  errorTxt: { ...Typography.h4, color: Colors.text.muted },
  errorBack: { ...Typography.body, color: Colors.brand.gold, marginTop: Spacing.base },
  navBar: { flexDirection: 'row', alignItems: 'center', paddingTop: 56, paddingHorizontal: Spacing.xl, paddingBottom: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border.subtle },
  backBtn: { width: 40, padding: Spacing.xs },
  backArrow: { fontSize: 22, color: Colors.brand.gold },
  navTitle: { flex: 1, ...Typography.label, color: Colors.text.secondary, textAlign: 'center' },
  playerCard: { backgroundColor: Colors.background.secondary, margin: Spacing.xl, borderRadius: Radius.xl, borderWidth: 1, borderColor: Colors.border.default, padding: Spacing.xl, alignItems: 'center', ...Shadow.md },
  playerVisual: { width: 80, height: 80, borderRadius: 40, borderWidth: 2, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background.primary, marginBottom: Spacing.lg },
  playerPillarNum: { ...Typography.h2 },
  playerPillarName: { ...Typography.caption, color: Colors.text.muted },
  playerLabel: { ...Typography.labelSmall, color: Colors.text.muted, letterSpacing: 3, marginBottom: Spacing.xs },
  playerTitle: { ...Typography.h4, color: Colors.text.primary, textAlign: 'center', marginBottom: Spacing.xs },
  playerMeta: { ...Typography.caption, color: Colors.text.muted, marginBottom: Spacing.md },
  completedBadge: { backgroundColor: Colors.status.successBg, borderRadius: Radius.full, paddingHorizontal: Spacing.md, paddingVertical: 4, marginBottom: Spacing.lg },
  completedBadgeTxt: { ...Typography.caption, color: Colors.status.success, fontWeight: '700' },
  scrubberArea: { width: '100%', marginBottom: Spacing.xl },
  scrubberTrack: { height: 4, backgroundColor: Colors.border.default, borderRadius: 2, overflow: 'visible', position: 'relative' },
  scrubberFill: { height: 4, borderRadius: 2, position: 'absolute', top: 0, left: 0 },
  scrubberKnob: { width: 14, height: 14, borderRadius: 7, position: 'absolute', top: -5 },
  timeRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: Spacing.sm },
  timeText: { ...Typography.caption, color: Colors.text.muted },
  controls: { flexDirection: 'row', alignItems: 'center', gap: Spacing['2xl'] },
  controlBtn: { padding: Spacing.sm },
  controlTxt: { ...Typography.body, color: Colors.text.secondary, fontWeight: '600' },
  playBtn: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', ...Shadow.gold },
  playBtnTxt: { fontSize: 22, color: Colors.text.inverse },
  tabs: { flexDirection: 'row', marginHorizontal: Spacing.xl, borderRadius: Radius.lg, backgroundColor: Colors.background.secondary, padding: 4, marginBottom: Spacing.xl },
  tab: { flex: 1, paddingVertical: Spacing.sm, alignItems: 'center', borderRadius: Radius.md },
  tabActive: { backgroundColor: Colors.background.primary },
  tabTxt: { ...Typography.label, color: Colors.text.muted },
  tabTxtActive: { color: Colors.text.primary },
  tabContent: { paddingHorizontal: Spacing.xl },
  tabBodyText: { ...Typography.bodyLarge, color: Colors.text.secondary, lineHeight: 28, marginBottom: Spacing.xl },
  insightCard: { borderLeftWidth: 2, borderLeftColor: Colors.brand.gold, paddingLeft: Spacing.md, paddingVertical: Spacing.sm, backgroundColor: Colors.background.secondary, borderRadius: Radius.md, padding: Spacing.base },
  insightLabel: { ...Typography.labelSmall, color: Colors.brand.gold, marginBottom: Spacing.sm },
  insightText: { ...Typography.quote, color: Colors.text.primary },
  defiCard: { borderWidth: 1.5, borderRadius: Radius.lg, padding: Spacing.base, marginBottom: Spacing.xl, backgroundColor: Colors.background.secondary },
  defiLabel: { ...Typography.label, marginBottom: Spacing.sm },
  defiText: { ...Typography.bodyLarge, color: Colors.text.primary, lineHeight: 28 },
  defiBtn: { borderRadius: Radius.lg, paddingVertical: Spacing.base, alignItems: 'center', marginBottom: Spacing.base },
  defiBtnTxt: { ...Typography.button, color: Colors.text.inverse },
  defiDone: { borderRadius: Radius.lg, paddingVertical: Spacing.md, alignItems: 'center', backgroundColor: Colors.status.successBg, marginBottom: Spacing.base },
  defiDoneTxt: { ...Typography.body, color: Colors.status.success, fontWeight: '600' },
  journalBtn: { borderWidth: 1, borderColor: Colors.border.default, borderRadius: Radius.lg, paddingVertical: Spacing.md, alignItems: 'center' },
  journalBtnTxt: { ...Typography.body, color: Colors.text.secondary },
  noteArea: { backgroundColor: Colors.background.secondary, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border.default, padding: Spacing.base, minHeight: 150, marginBottom: Spacing.base },
  notePlaceholder: { ...Typography.body, color: Colors.text.muted, fontStyle: 'italic', lineHeight: 26 },
  noteBtn: { borderWidth: 1, borderColor: Colors.border.default, borderRadius: Radius.lg, paddingVertical: Spacing.md, alignItems: 'center' },
  noteBtnTxt: { ...Typography.body, color: Colors.text.secondary },
  nextArea: { paddingHorizontal: Spacing.xl, marginTop: Spacing.xl },
  nextBtn: { borderWidth: 1.5, borderColor: Colors.brand.gold, borderRadius: Radius.lg, paddingVertical: Spacing.md, alignItems: 'center' },
  nextBtnTxt: { ...Typography.button, color: Colors.brand.gold },
});