import React from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { FEATURE_EXPLANATIONS, FeatureId } from '../../src/constants/featureExplanations';
import { FeatureExplanationSections, Icon } from '../../src/components/FeatureExplanationSections';
import { SafeScreen } from '../../src/components/layout/SafeScreen';
import { Colors, Typography, Spacing, Radius, Shadow } from '../../src/theme';

export default function FeatureExplanationScreen() {
  const { featureId } = useLocalSearchParams<{ featureId: FeatureId }>();
  const content = featureId ? FEATURE_EXPLANATIONS[featureId] : undefined;

  if (!content) {
    router.replace('/paywall');
    return null;
  }

  const goToPaywall = () => router.push('/paywall');

  return (
    <SafeScreen edges={['top']}>
      <View style={styles.root}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <FeatureExplanationSections content={content} />
          <View style={{ height: 110 }} />
        </ScrollView>

        <Pressable style={styles.floatingCta} onPress={goToPaywall} accessibilityRole="button">
          <View style={styles.floatingCtaIconWrap}>
            <Icon name="Sparkles" size={20} color={Colors.background.primary} />
          </View>
          <View style={styles.floatingCtaTextWrap}>
            <Text style={styles.floatingCtaTitle}>{content.cta.title}</Text>
            <Text style={styles.floatingCtaSubtitle}>{content.cta.subtitle}</Text>
          </View>
        </Pressable>
      </View>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background.primary },
  scrollContent: { padding: Spacing.lg },
  floatingCta: {
    position: 'absolute',
    left: Spacing.lg,
    right: Spacing.lg,
    bottom: Spacing.lg,
    backgroundColor: Colors.brand.gold,
    borderRadius: Radius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    ...Shadow.gold,
  },
  floatingCtaIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.background.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  floatingCtaTextWrap: { flex: 1 },
  floatingCtaTitle: { ...Typography.button, color: Colors.background.primary },
  floatingCtaSubtitle: { ...Typography.labelSmall, color: Colors.background.primary, opacity: 0.75 },
});