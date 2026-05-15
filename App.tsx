import React from 'react';
import { View, ActivityIndicator, StyleSheet, StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useAuth } from './src/hooks/useAuth';
import { colors } from './src/theme/colors';
import LoginScreen from './src/screens/LoginScreen';
import TabNavigator from './src/navigation/TabNavigator';
import { AppUser } from './src/types';

export default function App() {
  const { user, loading, setUser } = useAuth();

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />
      <NavigationContainer>
        {user ? (
          <TabNavigator user={user} setUser={setUser} />
        ) : (
          <LoginScreen onLogin={(u: AppUser) => setUser(u)} />
        )}
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
});
