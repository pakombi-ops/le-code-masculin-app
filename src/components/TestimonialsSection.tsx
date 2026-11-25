import React from 'react';
import { View, Text, Image, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { Quote } from 'lucide-react-native';

// Palette Pilier Conscient
const COLORS = {
  navy: '#1A1A2E',
  gold: '#C8963C',
  goldLight: '#C4A35A',
  cream: '#F5F0E8',
  creamLight: '#F2EDE3',
};

interface Testimonial {
  name: string;
  city: string;
  photo: any; // require('../../assets/testimonials/nicolas.jpg')
  quote: string;
}

// À remplacer par les vraies photos une fois disponibles dans /assets/testimonials/
const TESTIMONIALS: Testimonial[] = [
  {
    name: 'Nicolas M.R.',
    city: 'France',
    photo: require('../../assets/testimonials/nicolas.jpg'),
    quote:
      "Le Code Masculin m'a donné une structure claire là où j'improvisais depuis des années. Les résultats sont concrets, pas juste des concepts.",
  },
  {
    name: 'Yannick A.F.',
    city: 'Belgique',
    photo: require('../../assets/testimonials/yannick.jpg'),
    quote:
      "Ce qui change tout, c'est le suivi quotidien. Je ne me contente plus de savoir ce que je devrais faire — je le fais.",
  },
  {
    name: 'Florent Dessaint',
    city: 'Québec',
    photo: require('../../assets/testimonials/florent.jpg'),
    quote:
      "Un programme direct, sans discours creux. Chaque pilier m'a forcé à regarder des zones que j'évitais depuis longtemps.",
  },
];

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.82;

export default function TestimonialsSection() {
  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Ils ont fait le pas</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={CARD_WIDTH + 16}
        decelerationRate="fast"
        contentContainerStyle={styles.scrollContent}
      >
        {TESTIMONIALS.map((t, index) => (
          <View key={index} style={[styles.card, { width: CARD_WIDTH }]}>
            <Quote size={20} color={COLORS.gold} style={styles.quoteIcon} />
            <Text style={styles.quoteText}>{t.quote}</Text>
            <View style={styles.footer}>
              <Image source={t.photo} style={styles.photo} />
              <View>
                <Text style={styles.name}>{t.name}</Text>
                <Text style={styles.city}>{t.city}</Text>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gold,
    textTransform: 'uppercase',
    letterSpacing: 1,
    textAlign: 'center',
    marginBottom: 16,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 16,
  },
  card: {
    backgroundColor: COLORS.navy,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(200, 150, 60, 0.25)',
  },
  quoteIcon: {
    marginBottom: 8,
  },
  quoteText: {
    fontSize: 15,
    lineHeight: 22,
    color: COLORS.cream,
    marginBottom: 16,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  photo: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: COLORS.gold,
  },
  name: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.creamLight,
  },
  city: {
    fontSize: 12,
    color: 'rgba(242, 237, 227, 0.6)',
  },
});
