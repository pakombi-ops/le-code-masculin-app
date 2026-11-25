import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import * as LucideIcons from 'lucide-react-native';
import { FeatureExplanationContent } from '../constants/featureExplanations';
import { Colors, Typography, Spacing } from '../theme';

export function Icon({
  name,
  size = 26,
  color = Colors.text.primary,
}: {
  name: string;
  size?: number;
  color?: string;
}) {
  const Cmp = (LucideIcons as Record<string, any>)[name];
  if (!Cmp) return null;
  return <Cmp size={size} color={color} />;
}

const bodyBold = { ...Typography.body, fontWeight: '700' as const };

export function FeatureExplanationSections({ content }: { content: FeatureExplanationContent }) {
  return (
    <>
      {/* 1. Hero */}
      <View style={styles.section}>
        <Text style={styles.heroTitle}>{content.hero.title}</Text>
        <Text style={styles.heroSubtitle}>{content.hero.subtitle}</Text>
      </View>

      {/* 2. Vue d'ensemble + grille */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{content.overview.title}</Text>
        <Text style={styles.bodyText}>{content.overview.description}</Text>
        <View style={styles.grid}>
          {content.overview.grid.map((item, i) => (
            <View key={i} style={styles.gridItem}>
              <Icon name={item.icon} size={24} color={Colors.brand.gold} />
              <Text style={styles.gridItemTitle}>{item.title}</Text>
              <Text style={styles.gridItemDescription}>{item.description}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* 3. Confiance */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{content.trust.title}</Text>
        <Text style={styles.bodyText}>{content.trust.text}</Text>
        <View style={styles.badgeRow}>
          {content.trust.badges.map((badge, i) => (
            <View key={i} style={styles.badge}>
              <Icon name="BadgeCheck" size={16} color={Colors.brand.gold} />
              <Text style={styles.badgeText}>{badge}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* 4. Pour qui */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{content.personas.title}</Text>
        {content.personas.items.map((persona, i) => (
          <View key={i} style={styles.personaRow}>
            <View style={styles.personaIconWrap}>
              <Icon name={persona.icon} size={22} color={Colors.text.primary} />
            </View>
            <View style={styles.personaTextWrap}>
              <Text style={styles.personaTitle}>{persona.title}</Text>
              <Text style={styles.personaDescription}>{persona.description}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* 5. Témoignages (placeholders) */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{content.testimonials.title}</Text>
        {content.testimonials.items.map((t, i) => (
          <View key={i} style={styles.testimonial}>
            <Text style={styles.testimonialName}>
              {t.name} {t.countryFlag}
            </Text>
            <Text style={styles.testimonialQuote}>{t.quote}</Text>
          </View>
        ))}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  section: { marginBottom: Spacing.xl },
  heroTitle: { ...Typography.h1, color: Colors.text.primary, marginBottom: Spacing.sm },
  heroSubtitle: { ...Typography.body, color: Colors.text.secondary },
  sectionTitle: { ...Typography.h2, color: Colors.text.primary, marginBottom: Spacing.sm },
  bodyText: { ...Typography.body, color: Colors.text.secondary, marginBottom: Spacing.md },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  gridItem: { width: '48%', marginBottom: Spacing.md },
  gridItemTitle: { ...bodyBold, color: Colors.text.primary, marginTop: Spacing.xs },
  gridItemDescription: { ...Typography.caption, color: Colors.text.secondary },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.secondary,
    borderRadius: 999,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  badgeText: { ...Typography.caption, color: Colors.text.primary, marginLeft: Spacing.xs },
  personaRow: { flexDirection: 'row', marginBottom: Spacing.md },
  personaIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  personaTextWrap: { flex: 1 },
  personaTitle: { ...bodyBold, color: Colors.text.primary },
  personaDescription: { ...Typography.caption, color: Colors.text.secondary },
  testimonial: {
    marginBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.default,
    paddingBottom: Spacing.md,
  },
  testimonialName: { ...bodyBold, color: Colors.text.primary, marginBottom: Spacing.xs },
  testimonialQuote: { ...Typography.caption, color: Colors.text.secondary },
});