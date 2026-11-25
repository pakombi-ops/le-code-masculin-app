import { Tabs } from 'expo-router';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
      <Icon size={20} color={color} strokeWidth={focused ? 2 : 1.5} />
      <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>{label}</Text>
    </View>
  );
}

// CORRIGÉ : on garde tabBarIcon (qui reçoit `focused` correctement géré
// par React Navigation — c'était la surbrillance qui marchait avant).
// tabBarButton ne sert plus qu'à styliser le conteneur pour le centrage,
// en laissant passer son contenu normal (props.children) au lieu de le
// remplacer — ça évite de recalculer focused nous-mêmes et de le casser.
function CenteredTabButton(props: any) {
  const { children, style, ...rest } = props;
  return (
    <Pressable {...rest} style={styles.tabBarButton}>
      {children}
    </Pressable>
  );
}

export default function TabsLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: [styles.tabBar, { bottom: insets.bottom + 10 }],
        tabBarShowLabel: false,
        tabBarButton: CenteredTabButton,
        sceneContainerStyle: { backgroundColor: Colors.background.primary },
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
    position: 'absolute',
    left: 20,
    right: 20,
    height: 68,
    borderRadius: 34,
    // CORRIGÉ : navy légèrement éclairci (au lieu du navy de base ou du doré)
    backgroundColor: 'rgba(42, 42, 66, 0.96)',
    borderTopWidth: 0,
    borderWidth: 0,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 0,
    paddingBottom: 0,
    paddingHorizontal: 0,
  },
  tabBarButton: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  tabLabel: { ...Typography.caption, color: Colors.text.muted, fontSize: 10 },
  tabLabelActive: { color: Colors.brand.gold },
});
