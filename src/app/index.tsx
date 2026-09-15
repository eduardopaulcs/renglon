import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { Card, FAB, Searchbar, Text, useTheme } from 'react-native-paper';

import { activeNotesQuery, createNote, searchNotes } from '@/db/queries/notes';
import type { Note } from '@/db/schema';

export default function NotesListScreen() {
  const theme = useTheme();
  const [term, setTerm] = useState('');
  const [results, setResults] = useState<Note[] | null>(null);

  // useLiveQuery re-ejecuta la consulta cuando cambia la tabla, sin que haya que
  // refrescar a mano tras crear o editar una nota.
  const { data: allNotes } = useLiveQuery(activeNotesQuery);

  const notes = results ?? allNotes ?? [];

  async function onSearch(value: string) {
    setTerm(value);
    // Volver a la lista completa apenas se limpia el campo.
    setResults(value.trim() ? await searchNotes(value) : null);
  }

  async function onCreate() {
    const note = await createNote();
    router.push(`/note/${note.id}`);
  }

  const empty = useMemo(
    () => (term.trim() ? 'Ninguna nota coincide con la busqueda.' : 'Todavia no hay notas. Crea la primera.'),
    [term]
  );

  return (
    <View style={styles.container}>
      <Searchbar placeholder="Buscar en las notas" value={term} onChangeText={onSearch} style={styles.search} />

      <FlatList
        data={notes}
        keyExtractor={(note) => String(note.id)}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={[styles.empty, { color: theme.colors.onSurfaceVariant }]}>{empty}</Text>
        }
        renderItem={({ item }) => (
          <Card style={styles.card} onPress={() => router.push(`/note/${item.id}`)}>
            <Card.Content>
              <Text variant="titleMedium" numberOfLines={1}>
                {item.title || 'Sin titulo'}
              </Text>
              {!!item.body && (
                <Text variant="bodySmall" numberOfLines={2} style={{ color: theme.colors.onSurfaceVariant }}>
                  {item.body}
                </Text>
              )}
            </Card.Content>
          </Card>
        )}
      />

      <FAB icon="plus" style={styles.fab} onPress={onCreate} accessibilityLabel="Nueva nota" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  search: { margin: 12 },
  list: { paddingHorizontal: 12, paddingBottom: 96 },
  card: { marginBottom: 8 },
  empty: { textAlign: 'center', marginTop: 48, paddingHorizontal: 32 },
  fab: { position: 'absolute', right: 16, bottom: 24 },
});
