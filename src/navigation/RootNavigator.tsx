import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useAppStore } from '../store/useAppStore';
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';
import type { RootStackParamList } from '../types';

const Stack = createStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false, animationEnabled: true }}>
        {!isAuthenticated ? (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        ) : (
          <Stack.Screen name="Main" component={MainNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
