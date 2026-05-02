import React, { useRef, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, Animated,
  TouchableOpacity, Dimensions, NativeSyntheticEvent, NativeScrollEvent,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { AuthStackParamList } from '../../types';
import { Colors, Typography, Spacing, Radii } from '../../theme';
import Button from '../../components/ui/Button';
import SafeScreen from '../../components/layout/SafeScreen';

const { width } = Dimensions.get('window');
type Nav = StackNavigationProp<AuthStackParamList, 'Onboarding'>;

const SLIDES = [
  {
    id: '1',
    title: 'Deviens l\'homme\nque tu es censé être.',
    subtitle: '12 piliers. 52 semaines.\nUne transformation réelle.',
    emoji: '⚡',
    cta: null,
  },
  {
    id: '2',
    title: 'Le Code Masculin\nen 12 Piliers',
    subtitle: 'Un cadre complet, pas\ndes conseils génériques.',
    emoji: '⬡',
    pillars: [
      'Force Physique', 'Discipline', 'Leadership', 'Vulnérabilité',
      'But', 'Honneur', 'Présence', 'Stoïcisme',
      'Générosité', 'Courage', 'Authenticité', 'Héritage',
    ],
    cta: null,
  },
  {
    id: '3',
    title: 'Ton coach\ndans ta poche.',
    subtitle: null,
    emoji: null,
    features: [
      { icon: '◎', title: 'Prince Johann IA', desc: 'Coaching à tout moment' },
      { icon: '◫', title: 'Programme 52 semaines', desc: 'Structure et progression réelles' },
      { icon: '⬡', title: 'Suivi des 12 Piliers', desc: 'Progression mesurable et durable' },
    ],
    cta: 'Créer mon compte',
  },
];

export default function OnboardingScreen() {
  const navigation = useNavigation<Nav>();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / width);
    setCurrentIndex(idx);
  };

  const goNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
    }
  };

  const renderSlide = ({ item }: { item: typeof SLIDES[0] }) => (
    <View style={styles.slide}>
      {/* Emoji / illustration */}
      {item.emoji && (
        <Text style={styles.slideEmoji}>{item.emoji}</Text>
      )}

      <Text style={styles.slideTitle}>{item.title}</Text>
      {item.subtitle && <Text style={styles.slideSubtitle}>{item.subtitle}</Text>}

      {/* Slide 2 — Grille des 12 piliers */}
      {'pillars' in item && item.pillars && (
        <View style={styles.pillarsGrid}>
          {item.pillars.map((pillar, idx) => (
            <View key={pillar} style={[styles.pillarChip, { borderColor: Colors.pillars?.[idx] ?? Colors.gold.border }]}>
              <Text style={styles.pillarNumber}>{idx + 1}</Text>
              <Text style={styles.pillarName}>{pillar}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Slide 3 — Features */}
      {'features' in item && item.features && (
        <View style={styles.featuresContainer}>
          {item.features.map((f) => (
            <View key={f.title} style={styles.featureCard}>
              <Text style={styles.featureIcon}>{f.icon}</Text>
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>{f.title}</Text>
                <Text style={styles.featureDesc}>{f.desc}</Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );

  return (
    <SafeScreen edges={['top', 'bottom']}>
      {/* Skip */}
      <TouchableOpacity
        style={styles.skip}
        onPress={() => navigation.navigate('Login')}
      >
        <Text style={styles.skipText}>Passer</Text>
      </TouchableOpacity>

      {/* Slides */}
      <Animated.FlatList
        ref={flatListRef}
        data={SLIDES}
        renderItem={renderSlide}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: true }
        )}
        onMomentumScrollEnd={handleScroll}
        scrollEventThrottle={16}
      />

      {/* Bottom — Dots + CTA */}
      <View style={styles.bottom}>
        {/* Dots */}
        <View style={styles.dots}>
          {SLIDES.map((_, idx) => (
            <View
              key={idx}
              style={[styles.dot, idx === currentIndex && styles.dotActive]}
            />
          ))}
        </View>

        {/* CTA ou Suivant */}
        {currentIndex === SLIDES.length - 1 ? (
          <View style={styles.ctaContainer}>
            <Button
              label="Créer mon compte"
              onPress={() => navigation.navigate('Register')}
              fullWidth
              size="lg"
            />
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginLink}>J'ai déjà un compte. Se connecter</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <Button
            label="Suivant"
            onPress={goNext}
            variant="secondary"
            size="md"
            style={styles.nextBtn}
          />
        )}
      </View>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  skip: {
    position: 'absolute',
    top: Spacing.lg,
    right: Spacing.screenPadding,
    zIndex: 10,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  skipText: {
    color: Colors.text.tertiary,
    fontSize: Typography.size.sm,
  },
  slide: {
    width,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.screenPadding,
    paddingTop: 80,
    gap: Spacing.lg,
  },
  slideEmoji: {
    fontSize: 64,
    marginBottom: Spacing.base,
  },
  slideTitle: {
    ...Typography.styles.displayMedium,
    textAlign: 'center',
    lineHeight: 42,
  },
  slideSubtitle: {
    ...Typography.styles.body,
    textAlign: 'center',
    lineHeight: 24,
    color: Colors.text.secondary,
  },
  pillarsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    justifyContent: 'center',
    marginTop: Spacing.md,
  },
  pillarChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    borderWidth: 1,
    borderRadius: Radii.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    backgroundColor: Colors.background.secondary,
  },
  pillarNumber: {
    fontSize: Typography.size.xs,
    color: Colors.gold.primary,
    fontWeight: Typography.weight.bold,
  },
  pillarName: {
    fontSize: Typography.size.xs,
    color: Colors.text.secondary,
    fontWeight: Typography.weight.medium,
  },
  featuresContainer: {
    width: '100%',
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.base,
    backgroundColor: Colors.background.secondary,
    borderRadius: Radii.lg,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.border.default,
  },
  featureIcon: {
    fontSize: 28,
    width: 44,
    textAlign: 'center',
    color: Colors.gold.primary,
  },
  featureText: { flex: 1, gap: Spacing.xs },
  featureTitle: { ...Typography.styles.bodyBold },
  featureDesc: { ...Typography.styles.caption, color: Colors.text.secondary },
  bottom: {
    paddingHorizontal: Spacing.screenPadding,
    paddingBottom: Spacing['2xl'],
    alignItems: 'center',
    gap: Spacing.lg,
  },
  dots: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.border.subtle,
  },
  dotActive: {
    width: 24,
    backgroundColor: Colors.gold.primary,
  },
  ctaContainer: {
    width: '100%',
    gap: Spacing.base,
    alignItems: 'center',
  },
  nextBtn: {
    minWidth: 140,
  },
  loginLink: {
    fontSize: Typography.size.sm,
    color: Colors.text.secondary,
    textDecorationLine: 'underline',
  },
});
