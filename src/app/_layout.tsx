import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import { Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { StyleSheet, View, useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ActivityIndicator, PaperProvider, Text } from 'react-native-paper';

import migrations from '@/../drizzle/migrations';
import { SnackbarProvider } from '@/components/SnackbarProvider';
// Importing `db` already loads src/db/client, which opens the connection and applies the
// PRAGMAs (foreign_keys, WAL) when evaluated. Nothing else needs to be imported.
import { db } from '@/db/client';
import { t } from '@/i18n';
import { darkTheme, lightTheme, navigationThemeFor } from '@/theme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const dark = useColorScheme() === 'dark';
  const theme = dark ? darkTheme : lightTheme;

  // Migrations run before any screen queries the database. If this were skipped, the first
  // query would fail with "no such table".
  const { success, error } = useMigrations(db, migrations);

  useEffect(() => {
    if (success || error) SplashScreen.hideAsync();
  }, [success, error]);

  let content;
  if (error) {
    content = (
      <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <Text variant="titleMedium">{t('db.error')}</Text>
        <Text variant="bodySmall" style={styles.errorDetail}>
          {error.message}
        </Text>
      </View>
    );
  } else if (!success) {
    content = (
      <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator />
      </View>
    );
  } else {
    content = (
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.colors.background } }}>
        <Stack.Screen name="(drawer)" />
        <Stack.Screen name="note/[id]" />
      </Stack>
    );
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <PaperProvider theme={theme}>
        <ThemeProvider value={navigationThemeFor(theme, dark)}>
          <StatusBar style={dark ? 'light' : 'dark'} />
          <SnackbarProvider>{content}</SnackbarProvider>
        </ThemeProvider>
      </PaperProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 8 },
  errorDetail: { textAlign: 'center', opacity: 0.7 },
});
