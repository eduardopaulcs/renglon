import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { Snackbar } from 'react-native-paper';

interface SnackbarAction {
  label: string;
  onPress: () => void;
}

interface Message {
  id: number;
  text: string;
  action?: SnackbarAction;
}

type ShowSnackbar = (text: string, action?: SnackbarAction) => void;

const SnackbarContext = createContext<ShowSnackbar>(() => {});
const SnackbarOffsetContext = createContext(0);

/**
 * One snackbar for the whole app, mounted above the navigator. It has to live there because
 * the messages that matter most ("Note saved", "Moved to trash · Undo") are triggered by a
 * screen that is being closed, and must stay visible on the screen the user lands on.
 *
 * Its height is measured and published separately, so floating buttons can move out of its way
 * the way Android's own snackbars push them up.
 */
export function SnackbarProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState<Message | null>(null);
  const [visible, setVisible] = useState(false);
  const [height, setHeight] = useState(0);

  const show = useCallback<ShowSnackbar>((text, action) => {
    setMessage({ id: Date.now(), text, action });
    setVisible(true);
  }, []);

  return (
    <SnackbarContext.Provider value={show}>
      <SnackbarOffsetContext.Provider value={visible ? height : 0}>{children}</SnackbarOffsetContext.Provider>
      <View
        pointerEvents="box-none"
        style={styles.host}
        onLayout={(event) => setHeight(event.nativeEvent.layout.height)}>
        <Snackbar
          // A new key restarts the timer when a message replaces one that is still showing.
          key={message?.id}
          visible={visible}
          onDismiss={() => setVisible(false)}
          duration={4000}
          action={message?.action}
          // Paper positions the snackbar absolutely; letting it flow gives the host its height.
          wrapperStyle={styles.wrapper}>
          {message?.text}
        </Snackbar>
      </View>
    </SnackbarContext.Provider>
  );
}

export const useSnackbar = () => useContext(SnackbarContext);

/** Space the snackbar currently takes from the bottom of the screen, or 0 when hidden. */
export const useSnackbarOffset = () => useContext(SnackbarOffsetContext);

const styles = StyleSheet.create({
  host: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  wrapper: { position: 'relative' },
});
