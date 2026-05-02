import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import Svg, { Polygon, Line, Circle, Text as SvgText } from 'react-native-svg';
import { Colors, Typography, Spacing, Radius, Shadow } from '../../theme';
import { PILLARS, getPillarById } from '../../constants/pillars';
import { getWeakestPillars } from '../../constants/quiz';

const { width } = Dimensions.get('window');
const RADAR_SIZE = width - 80;
const CENTER = RADAR_SIZE / 2;
const RADIUS = CENTER - 30;

function polar(angle: number, r: number) {
  const rad = ((angle - 90) * Math.PI) / 180;
  return { x: CENTER + r * Math.cos(rad), y: CENTER + r * Math.sin(rad) };
}

function RadarChart({ scores }: { scores: Record<number, number> }) {
  const pillars = [2, 10, 7, 5, 1, 6, 8, 11];
  const n = pillars.length;
  const step = 360 / n;
  const grid = [0.25, 0.5, 0.75, 1.0];

  const pts = (f: number) => pillars.map((_, i) => { const p = polar(i * step, RADIUS * f); return `${p.x},${p.y}`; }).join(' ');
  const scorePts = pillars.map((id, i) => { const s = Math.max(0.1, (scores[id] ?? 3) / 10); const p = polar(i * step, RADIUS * s); return `${p.x},${p.y}`; }).join(' ');

  return (
    <Svg width={RADAR_SIZE} height={RADAR_SIZE}>
      {grid.map((l, i) => <Polygon key={i} points={pts(l)} fill="none" stroke={i === 3 ? Colors.brand.gold : Colors.border.subtle} strokeWidth={i === 3 ? 1 : 0.5} strokeDasharray={i < 3 ? '3,3' : undefined} opacity={0.5} />)}
      {pillars.map((_, i) => { const p = polar(i * step, RADIUS); return <Line key={i} x1={CENTER} y1={CENTER} x2={p.x} y2={p.y} stroke={Colors.border.subtle} strokeWidth={0.5} opacity={0.5} />; })}
      <Polygon points={scorePts} fill={Colors.brand.gold} fillOpacity={0.18} stroke={Colors.brand.gold} strokeWidth={2} />
      {pillars.map((id, i) => { const p = polar(i * step, RADIUS + 22); const name = getPillarById(id)?.name.split(' ')[0] ?? ''; return <SvgText key={i} x={p.x} y={p.y} fill={Colors.text.muted} fontSize={9} textAnchor="middle" dominantBaseline="middle">{name}</SvgText>; })}
      {pillars.map((id, i) => { const s = Math.max(0.1, (scores[id] ?? 3) / 10); const p = polar(i * step, RADIUS * s); return <Circle key={i} cx={p.x} cy={p.y} r={4} fill={Colors.brand.gold} />; })}
    </Svg>
  );
}

export default function ResultatsScreen() {
  const { scores: sp } = useLocalSearchParams<{ scores: string }>();
  const scores: Record<number, number> = sp ? JSON.parse(sp) : {};
  const weak = getWeakestPillars(scores);
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }).start();
  }, []);

  const insights: Record<number, string> = {
    2: "Tu connais tes objectifs. Tu cèdes encore trop souvent.",
    10: "Tu perçois l'injustice. Exprimer ton désaccord est encore difficile.",
    7: "Tu es là physiquement. Être là entièrement est un travail à part.",
    5: "Tu vis sans direction claire. C'est un point de départ.",
    1: "Ton corps attend ta décision. La transformation commence là.",
    6: "Ta parole n'est pas encore ta loi. C'est le fondement de tout.",
    8: "Tu réagis encore plus que tu ne réponds. La maîtrise s'apprend.",
    11: "Tu te censures encore. L'homme authentique dérange.",
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Animated.View style={[styles.content, { opacity }]}>
          <Text style={styles.topLabel}>TON CODE MASCULIN DE DÉPART</Text>
          <Text style={styles.subtitle}>Voici ce que tes réponses révèlent.</Text>

          <View style={styles.radarCard}>
            <RadarChart scores={scores} />
          </View>

          <Text style={styles.sectionLabel}>TES 3 PILIERS PRIORITAIRES</Text>
          <View style={styles.pillars}>
            {weak.map((p, idx) => (
              <View key={p.pillarId} style={[styles.card, idx === 0 && styles.cardFirst]}>
                <View style={styles.cardHeader}>
                  <View>
                    <Text style={styles.pillarLabel}>PILIER {p.pillarId}</Text>
                    <Text style={styles.pillarName}>{p.pillarName}</Text>
                  </View>
                  <View style={styles.dots}>
                    {Array.from({ length: 10 }).map((_, i) => (
                      <View key={i} style={[styles.dot, i < Math.round(p.score) && styles.dotFilled]} />
                    ))}
                  </View>
                </View>
                <Text style={styles.insight}>{insights[p.pillarId] ?? ''}</Text>
                <Text style={styles.score}>Score : {Math.round(p.score)}/10</Text>
              </View>
            ))}
          </View>

          <View style={styles.msgCard}>
            <Text style={styles.msgLine}>On commence par là.</Text>
            <Text style={styles.msgSub}>Pas par le début du livre — par toi.</Text>
          </View>

          <TouchableOpacity style={styles.ctaBtn} onPress={() => router.push({ pathname: '/(auth)/register', params: { scores: sp } })} activeOpacity={0.85}>
            <Text style={styles.ctaTxt}>Commencer mon Code  →</Text>
          </TouchableOpacity>
          <Text style={styles.ctaNote}>Gratuit · 10 messages de coaching offerts</Text>
          <View style={{ height: 50 }} />
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background.primary },
  content: { paddingHorizontal: Spacing.xl, paddingTop: 70, alignItems: 'center' },
  topLabel: { ...Typography.labelSmall, color: Colors.brand.gold, letterSpacing: 4, textAlign: 'center', marginBottom: Spacing.sm },
  subtitle: { ...Typography.body, color: Colors.text.secondary, fontStyle: 'italic', textAlign: 'center', marginBottom: Spacing.xl },
  radarCard: { backgroundColor: Colors.background.secondary, borderRadius: Radius.xl, borderWidth: 1, borderColor: Colors.border.default, padding: Spacing.md, marginBottom: Spacing['2xl'], alignItems: 'center', width: '100%' },
  sectionLabel: { ...Typography.label, color: Colors.brand.gold, letterSpacing: 3, marginBottom: Spacing.base, alignSelf: 'flex-start' },
  pillars: { gap: Spacing.sm, width: '100%', marginBottom: Spacing.xl },
  card: { backgroundColor: Colors.background.secondary, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border.default, borderLeftWidth: 3, borderLeftColor: Colors.brand.gold, padding: Spacing.base },
  cardFirst: { ...Shadow.gold },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.sm },
  pillarLabel: { ...Typography.labelSmall, color: Colors.brand.gold, marginBottom: 2 },
  pillarName: { ...Typography.h4, color: Colors.text.primary },
  dots: { flexDirection: 'row', gap: 3 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.border.default },
  dotFilled: { backgroundColor: Colors.brand.gold },
  insight: { ...Typography.body, color: Colors.text.secondary, fontStyle: 'italic', marginBottom: 4 },
  score: { ...Typography.caption, color: Colors.text.muted },
  msgCard: { width: '100%', padding: Spacing.xl, borderLeftWidth: 2, borderLeftColor: Colors.brand.gold, marginBottom: Spacing['2xl'], backgroundColor: Colors.background.secondary, borderRadius: Radius.lg },
  msgLine: { ...Typography.h3, color: Colors.text.primary, marginBottom: Spacing.xs },
  msgSub: { ...Typography.body, color: Colors.text.secondary, fontStyle: 'italic' },
  ctaBtn: { backgroundColor: Colors.brand.gold, borderRadius: Radius.lg, paddingVertical: Spacing.base + 2, alignItems: 'center', width: '100%', ...Shadow.gold },
  ctaTxt: { ...Typography.button, color: Colors.text.inverse },
  ctaNote: { ...Typography.caption, color: Colors.text.muted, marginTop: Spacing.md },
});
