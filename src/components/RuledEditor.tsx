import { useState, type Ref } from 'react';
import { StyleSheet, TextInput, View, type NativeSyntheticEvent, type TextInputSelectionChangeEventData } from 'react-native';

import type { TextSelection } from '@/lib/markdown';
import { useAppTheme } from '@/theme';

/** Text and rules share this value; if they diverge, the text drifts off the lines. */
export const LINE_HEIGHT = 30;
const MIN_LINES = 14;
const MARGIN_X = 36;

interface RuledEditorProps {
  value: string;
  placeholder: string;
  selection?: TextSelection;
  inputRef?: Ref<TextInput>;
  onChangeText: (text: string) => void;
  onSelectionChange: (selection: TextSelection) => void;
  onFocus: () => void;
  onBlur: () => void;
}

/**
 * The note body drawn on ruled paper. The input does not scroll by itself: it grows with its
 * content inside the screen's ScrollView, so the rules can be laid out behind it one per line.
 */
export function RuledEditor({
  value,
  placeholder,
  selection,
  inputRef,
  onChangeText,
  onSelectionChange,
  onFocus,
  onBlur,
}: RuledEditorProps) {
  const theme = useAppTheme();
  const [contentHeight, setContentHeight] = useState(0);
  const lines = Math.max(MIN_LINES, Math.ceil(contentHeight / LINE_HEIGHT) + 2);

  return (
    <View style={styles.paper}>
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        {Array.from({ length: lines }, (_, index) => (
          <View key={index} style={[styles.rule, { borderBottomColor: theme.notebook.ruleLine }]} />
        ))}
        <View style={[styles.margin, { backgroundColor: theme.notebook.marginLine }]} />
      </View>
      <TextInput
        ref={inputRef}
        multiline
        scrollEnabled={false}
        value={value}
        selection={selection}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.outline}
        selectionColor={theme.colors.primary}
        cursorColor={theme.colors.primary}
        onChangeText={onChangeText}
        onFocus={onFocus}
        onBlur={onBlur}
        onSelectionChange={(event: NativeSyntheticEvent<TextInputSelectionChangeEventData>) =>
          onSelectionChange(event.nativeEvent.selection)
        }
        onContentSizeChange={(event) => setContentHeight(event.nativeEvent.contentSize.height)}
        textAlignVertical="top"
        style={[styles.input, { color: theme.colors.onSurface, minHeight: LINE_HEIGHT * MIN_LINES }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  paper: { position: 'relative' },
  rule: { height: LINE_HEIGHT, borderBottomWidth: 1 },
  margin: { position: 'absolute', left: MARGIN_X, top: 0, bottom: 0, width: 1.5 },
  input: {
    fontSize: 17,
    lineHeight: LINE_HEIGHT,
    paddingTop: 0,
    paddingBottom: 0,
    paddingLeft: MARGIN_X + 12,
    paddingRight: 20,
    includeFontPadding: false,
  },
});
