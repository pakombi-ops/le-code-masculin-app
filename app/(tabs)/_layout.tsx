import { Tabs } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { Home, Calendar, Sparkles, Library, User } from 'lucide-react-native';
import { Colors, Typography } from '../../src/theme';

function TabIcon({
  focused,
  Icon,
  label,
}: {
  focused: boolean;
  Icon: React.ComponentType<{ size: number; color: string; strokeWidth: number }>;
  label: string;
}) {
  const color = focused ? Colors.brand.gold : Colors.text.muted;
  return (
    <View style={styles.tabItem}>
      <Icon size={22} color={color} strokeWidth={focused ? 2 : 1.5} />
      <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>{label}</Text>
    </View>
  );
}

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
            <TabIcon focused={focused} Icon={Home} label="Home" />
          ),
        }}
      />
      <Tabs.Screen
        name="programme"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} Icon={Calendar} label="Cours"  />
          ),
        }}
      />
      <Tabs.Screen
        name="coach"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} Icon={Sparkles} label="Coach" />
          ),
        }}
      />
      <Tabs.Screen
        name="bibliotheque"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} Icon={Library} label="Docs" />
          ),
        }}
      />
      <Tabs.Screen
        name="profil"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} Icon={User} label="Profil"  />
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
    height: 125,
    paddingTop: 8,
    paddingBotton: 12,
    //marginBottom: 12,
  },
  tabItem: { alignItems: 'center', justifyContent: 'center', gap: 4 },
  tabLabel: { ...Typography.caption, color: Colors.text.muted, fontSize: 10 },
  tabLabelActive: { color: Colors.brand.gold },
});