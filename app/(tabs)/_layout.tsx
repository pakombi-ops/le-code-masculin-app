import { Tabs } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography } from '../../src/theme';

function TabIcon({ focused, icon, label }: { focused: boolean; icon: string; label: string }) {
  return (
    <View style={styles.tabItem}>
      <Text style={[styles.tabIcon, focused && styles.tabIconActive]}>{icon}</Text>
      <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>{label}</Text>
    </View>
  );
}

/**
 * Navigation principale — 5 onglets
 * Accueil · Programme · Prince Johann · Bibliothèque · Profil
 */
export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="accueil"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} icon="⊕" label="Accueil" />
          ),
        }}
      />
      <Tabs.Screen
        name="programme"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} icon="⊞" label="Programme" />
          ),
        }}
      />
      <Tabs.Screen
        name="coach"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} icon="✦" label="Prince Johann" />
          ),
        }}
      />
      <Tabs.Screen
        name="bibliotheque"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} icon="◫" label="Bibliothèque" />
          ),
        }}
      />
      <Tabs.Screen
        name="profil"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} icon="○" label="Profil" />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.background.secondary,
    borderTopWidth: 1,
    borderTopColor: Colors.border.subtle,
    height: 70,
    paddingTop: 8,
  },
  tabItem: { alignItems: 'center', justifyContent: 'center', gap: 4 },
  tabIcon: { fontSize: 20, color: Colors.text.muted },
  tabIconActive: { color: Colors.brand.gold },
  tabLabel: { ...Typography.caption, color: Colors.text.muted, fontSize: 10 },
  tabLabelActive: { color: Colors.brand.gold },
});
