import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { StyleSheet, View, useColorScheme } from 'react-native';
import { ActivityIndicator, PaperProvider, Text } from 'react-native-paper';

import migrations from '@/../drizzle/migrations';
// Importar `db` ya carga src/db/client, que al evaluarse abre la conexion y
// aplica los PRAGMAs (foreign_keys, WAL). No hace falta importar nada mas.
import { db } from '@/db/client';
import { darkTheme, lightTheme } from '@/theme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme;

  // Las migraciones corren antes de que cualquier pantalla consulte la base.
  // Si esto se saltara, la primera query fallaria con "no such table".
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
