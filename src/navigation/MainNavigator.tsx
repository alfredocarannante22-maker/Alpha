import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { AppUser } from '../types';
import CalendarScreen from '../screens/CalendarScreen';
import NotesScreen from '../screens/NotesScreen';
import ExpensesScreen from '../screens/ExpensesScreen';
import TodosScreen from '../screens/TodosScreen';
import ProfileScreen from '../screens/ProfileScreen';

type TabName = 'Calendar' | 'Notes' | 'Expenses' | 'Todos' | 'Profile';

const TABS: Array<{
  name: TabName;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  activeIcon: keyof typeof Ionicons.glyphMap;
}> = [
  { name: 'Calendar', label: 'Calendario', icon: 'calendar-outline', activeIcon: 'calendar' },
  { name: 'Notes', label: 'Note', icon: 'document-text-outline', activeIcon: 'document-text' },
  { name: 'Expenses', label: 'Spese', icon: 'wallet-outline', activeIcon: 'wallet' },
  { name: 'Todos', label: 'Liste', icon: 'checkbox-outline', activeIcon: 'checkbox' },
  { name: 'Profile', label: 'Profilo', icon: 'person-circle-outline', activeIcon: 'person-circle' },
];

const BOTTOM_SAFE = Platform.OS === 'ios' ? 34 : 0;

interface Props {
  user: AppUser;
  setUser: (u: AppUser | null) => void;
}

export default function MainNavigator({ user, setUser }: Props) {
  const [activeTab, setActiveTab] = useState<TabName>('Calendar');

  function renderScreen() {
    switch (activeTab) {
      case 'Calendar': return <CalendarScreen user={user} />;
      case 'Notes': return <NotesScreen user={user} />;
      case 'Expenses': return <ExpensesScreen user={user} />;
      case 'Todos': return <TodosScreen user={user} />;
      case 'Profile': return <ProfileScreen user={user} setUser={setUser} />;
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>{renderScreen()}</View>
      <View style={[styles.tabBar, { paddingBottom: BOTTOM_SAFE }]}>
        {TABS.map((tab) => {
          const active = activeTab === tab.name;
          return (
            <TouchableOpacity
              key={tab.name}
              style={styles.tabItem}
              onPress={() => setActiveTab(tab.name)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={active ? tab.activeIcon : tab.icon}
                size={22}
                color={active ? colors.primary : colors.textLight}
              />
              <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1 },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 8,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  tabLabel: {
    fontSize: 10,
    marginTop: 2,
    color: colors.textLight,
  },
  tabLabelActive: {
    color: colors.primary,
    fontWeight: '600',
  },
});
