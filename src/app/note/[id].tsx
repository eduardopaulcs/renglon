import { useLocalSearchParams, useNavigation } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Text, TextInput } from 'react-native-paper';

import { getNote, updateNote } from '@/db/queries/notes';

const AUTOSAVE_DELAY_MS = 600;

export default function NoteEditorScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const navigation = useNavigation();
  const noteId = Number(id);

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [loaded, setLoaded] = useState(false);

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Se guarda el ultimo valor en una ref para poder volcarlo al desmontar sin
  // volver a crear el efecto de cierre en cada tecla.
  const pending = useRef({ title: '', body: '' });

  useEffect(() => {
    let active = true;
    getNote(noteId).then((note) => {
      if (!active || !note) return;
      setTitle(note.title);
      setBody(note.body);
      pending.current = { title: note.title, body: note.body };
      setLoaded(true);
    });
    return () => {
      active = false;
    };
  }, [noteId]);

  const scheduleSave = useCallback(
    (next: { title: string; body: string }) => {
      pending.current = next;
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        void updateNote(noteId, next);
      }, AUTOSAVE_DELAY_MS);
    },
    [noteId]
  );

  // Al salir de la pantalla se descarta el timer y se guarda de inmediato: si no,
  // los ultimos caracteres tecleados antes de volver atras se perderian.
  useEffect(
    () => () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      void updateNote(noteId, pending.current);
    },
    [noteId]
  );

  useEffect(() => {
    navigation.setOptions({ title: title.trim() || 'Nota' });
  }, [navigation, title]);

  if (!loaded) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <TextInput
        mode="flat"
        placeholder="Titulo"
        value={title}
        onChangeText={(value) => {
          setTitle(value);
          scheduleSave({ title: value, body });
        }}
        style={styles.title}
      />
      <TextInput
        mode="flat"
        placeholder="Escribi aca..."
        value={body}
        multiline
        onChangeText={(value) => {
          setBody(value);
          scheduleSave({ title, body: value });
        }}
        style={styles.body}
      />
      <Text variant="bodySmall" style={styles.hint}>
        Se guarda solo.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  container: { padding: 12, paddingBottom: 48 },
  title: { backgroundColor: 'transparent', fontSize: 22 },
  body: { backgroundColor: 'transparent', minHeight: 320, textAlignVertical: 'top' },
  hint: { opacity: 0.5, marginTop: 8, textAlign: 'center' },
});
