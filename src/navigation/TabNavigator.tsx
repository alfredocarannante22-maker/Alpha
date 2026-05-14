import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { colors } from '../theme/colors';
import { AppUser } from '../types';

import CalendarScreen from '../screens/CalendarScreen';
import NotesScreen from '../screens/NotesScreen';
import ExpensesScreen from '../screens/ExpensesScreen';
import TodosScreen from '../screens/TodosScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();

interface TabNavigatorProps {
  user: AppUser;
  setUser: (u: AppUser | null) => void;
}

export default function TabNavigator({ user, setUser }: TabNavigatorProps) {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textLight,
        tabBarLabelStyle: styles.label,
        tabBarIcon: ({ color, size, focused }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'calendar';

          if (route.name === 'Calendar') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          } else if (route.name === 'Notes') {
            iconName = focused ? 'document-text' : 'document-text-outline';
          } else if (route.name === 'Expenses') {
            iconName = focused ? 'wallet' : 'wallet-outline';
          } else if (route.name === 'Todos') {
            iconName = focused ? 'checkbox' : 'checkbox-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person-circle' : 'person-circle-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="Calendar"
        options={{ tabBarLabel: 'Calendario' }}
      >
        {() => <CalendarScreen user={user} />}
      </Tab.Screen>
      <Tab.Screen
        name="Notes"
        options={{ tabBarLabel: 'Note' }}
      >
        {() => <NotesScreen user={user} />}
      </Tab.Screen>
      <Tab.Screen
        name="Expenses"
        options={{ tabBarLabel: 'Spese' }}
      >
        {() => <ExpensesScreen user={user} />}
      </Tab.Screen>
      <Tab.Screen
        name="Todos"
        options={{ tabBarLabel: 'Liste' }}
      >
        {() => <TodosScreen user={user} />}
      </Tab.Screen>
      <Tab.Screen
        name="Profile"
        options={{ tabBarLabel: 'Profilo' }}
      >
        {() => <ProfileScreen user={user} setUser={setUser} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.surface,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    paddingBottom: Platform.OS === 'ios' ? 20 : 8,
    paddingTop: 8,
    height: Platform.OS === 'ios' ? 85 : 65,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  label: {
    fontSize: 11,
    fontWeight: '500',
  },
});
