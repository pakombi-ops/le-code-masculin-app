import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Colors, Spacing, Typography } from '../theme';
import type { MainTabParamList, ProgrammeStackParamList, ChatStackParamList } from '../types';

// Screens
import HomeScreen from '../screens/main/HomeScreen';
import ProgrammeHomeScreen from '../screens/main/ProgrammeScreen';
import PillarDetailScreen from '../screens/main/PillarDetailScreen';
import LessonPlayerScreen from '../screens/main/LessonPlayerScreen';
import ChatHomeScreen from '../screens/main/ChatScreen';
import PaywallScreen from '../screens/main/PaywallScreen';
import BibliothequeScreen from '../screens/main/BibliothequeScreen';
import ProfilScreen from '../screens/main/ProfilScreen';

// ─────────────────────────────────────────
// STACKS IMBRIQUÉS
// ─────────────────────────────────────────
const ProgrammeStack = createStackNavigator<ProgrammeStackParamList>();
function ProgrammeNavigator() {
  return (
    <ProgrammeStack.Navigator screenOptions={{ headerShown: false }}>
      <ProgrammeStack.Screen name="ProgrammeHome" component={ProgrammeHomeScreen} />
      <ProgrammeStack.Screen name="PillarDetail" component={PillarDetailScreen} />
      <ProgrammeStack.Screen name="LessonPlayer" component={LessonPlayerScreen} />
    </ProgrammeStack.Navigator>
  );
}

const ChatStack = createStackNavigator<ChatStackParamList>();
function ChatNavigator() {
  return (
    <ChatStack.Navigator screenOptions={{ headerShown: false }}>
      <ChatStack.Screen name="ChatHome" component={ChatHomeScreen} />
      <ChatStack.Screen
        name="Paywall"
        component={PaywallScreen}
        options={{ presentation: 'modal' }}
      />
    </ChatStack.Navigator>
  );
}

// ─────────────────────────────────────────
// ICÔNES TAB BAR (SVG inline via Text — sans dépendance externe)
// Note: remplacer par @expo/vector-icons ou Phosphor pour la production
// ─────────────────────────────────────────
type TabIconName = 'home' | 'programme' | 'chat' | 'bibliotheque' | 'profil';

function TabIcon({ name, focused }: { name: TabIconName; focused: boolean }) {
  const color = focused ? Colors.gold.primary : Colors.text.tertiary;
  const icons: Record<TabIconName, string> = {
    home: '⌂',
    programme: '◫',
    chat: '◎',
    bibliotheque: '≡',
    profil: '○',
  };
  return (
    <View style={styles.iconContainer}>
      <Text style={[styles.iconText, { color }]}>{icons[name]}</Text>
    </View>
  );
}

function TabLabel({ label, focused }: { label: string; focused: boolean }) {
  return (
    <Text
      style={[
        styles.tabLabel,
        { color: focused ? Colors.gold.primary : Colors.text.tertiary },
      ]}
    >
      {label}
    </Text>
  );
}

// ─────────────────────────────────────────
// TAB NAVIGATOR PRINCIPAL
// ─────────────────────────────────────────
const Tab = createBottomTabNavigator<MainTabParamList>();

export default function MainNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: Colors.gold.primary,
        tabBarInactiveTintColor: Colors.text.tertiary,
        tabBarShowLabel: true,
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: ({ focused }) => <TabLabel label="Accueil" focused={focused} />,
          tabBarIcon: ({ focused }) => <TabIcon name="home" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Programme"
        component={ProgrammeNavigator}
        options={{
          tabBarLabel: ({ focused }) => <TabLabel label="Programme" focused={focused} />,
          tabBarIcon: ({ focused }) => <TabIcon name="programme" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Chat"
        component={ChatNavigator}
        options={{
          tabBarLabel: ({ focused }) => <TabLabel label="Prince Johann" focused={focused} />,
          tabBarIcon: ({ focused }) => <TabIcon name="chat" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Bibliotheque"
        component={BibliothequeScreen}
        options={{
          tabBarLabel: ({ focused }) => <TabLabel label="Bibliothèque" focused={focused} />,
          tabBarIcon: ({ focused }) => <TabIcon name="bibliotheque" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Profil"
        component={ProfilScreen}
        options={{
          tabBarLabel: ({ focused }) => <TabLabel label="Profil" focused={focused} />,
          tabBarIcon: ({ focused }) => <TabIcon name="profil" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.background.secondary,
    borderTopColor: Colors.border.default,
    borderTopWidth: 1,
    height: Platform.OS === 'ios' ? 84 : 64,
    paddingBottom: Platform.OS === 'ios' ? 24 : 8,
    paddingTop: 8,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 24,
    height: 24,
  },
  iconText: {
    fontSize: 20,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '500',
    letterSpacing: 0.3,
    marginTop: 2,
  },
});
