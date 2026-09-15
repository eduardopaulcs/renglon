import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { Snackbar } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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

/**
 * One snackbar for the whole app, mounted above the navigator. It has to live there because
 * the messages that matter most ("Note saved", "Moved to trash · Undo") are triggered by a
 * screen that is being closed, and must stay visible on the screen the user lands on.
 */
export function SnackbarProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState<Message | null>(null);
  const [visible, setVisible] = useState(false);
  const insets = useSafeAreaInsets();

  const show = useCallback<ShowSnackbar>((text, action) => {
    setMessage({ id: Date.now(), text, action });
    setVisible(true);
  }, []);

  return (
    <SnackbarContext.Provider value={show}>
      {children}
      <Snackbar
        // A new key restarts the timer when a message replaces one that is still showing.
        key={message?.id}
        visible={visible}
        onDismiss={() => setVisible(false)}
        duration={4000}
        action={message?.action}
        wrapperStyle={{ bottom: insets.bottom }}>
        {message?.text}
      </Snackbar>
    </SnackbarContext.Provider>
  );
}

export const useSnackbar = () => useContext(SnackbarContext);
