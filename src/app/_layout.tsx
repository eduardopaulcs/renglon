import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { StyleSheet, View, useColorScheme } from 'react-native';
import { ActivityIndicator, PaperProvider, Text } from 'react-native-paper';

import migrations from '@/../drizzle/migrations';
// Importing `db` already loads src/db/client, which opens the connection and applies the
// PRAGMAs (foreign_keys, WAL) when evaluated. Nothing else needs to be imported.
import { db } from '@/db/client';
import { darkTheme, lightTheme } from '@/theme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme;

  // Migrations run before any screen queries the database. If this were skipped, the first
  // query would fail with "no such table".
  const { success, error } = useMigrations(db, migrations);

  useEffect(() => {
    if (success || error) SplashScreen.hideAsync();
  }, [success, error]);

  if (error) {
    return (
      <PaperProvider theme={theme}>
        <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
          <Text variant="titleMedium">No se pudo preparar la base de datos</Text>
          <Text variant="bodySmall" style={styles.errorDetail}>
            {error.message}
          </Text>
        </View>
      </PaperProvider>
    );
  }

  if (!success) {
    return (
      <PaperProvider theme={theme}>
        <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
          <ActivityIndicator />
        </View>
      </PaperProvider>
    );
  }

  return (
    <PaperProvider theme={theme}>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: theme.colors.surface },
          headerTintColor: theme.colors.onSurface,
          contentStyle: { backgroundColor: theme.colors.background },
        }}>
        <Stack.Screen name="index" options={{ title: 'Renglon' }} />
        <Stack.Screen name="note/[id]" options={{ title: 'Nota' }} />
      </Stack>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 8 },
  errorDetail: { textAlign: 'center', opacity: 0.7 },
});
