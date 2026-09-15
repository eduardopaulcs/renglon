import { Banner } from 'react-native-paper';

import { t } from '@/i18n';
import { useAppTheme } from '@/theme';

interface TipBannerProps {
  visible: boolean;
  icon: string;
  text: string;
  /** Takes the user straight to the feature the tip describes. */
  action?: { label: string; onPress: () => void };
  onDismiss: () => void;
}

/** An inline banner rather than a dialog or snackbar: it never blocks the screen or times out. */
export function TipBanner({ visible, icon, text, action, onDismiss }: TipBannerProps) {
  const theme = useAppTheme();
  return (
    <Banner
      visible={visible}
      icon={icon}
      actions={[{ label: t('tips.gotIt'), onPress: onDismiss }, ...(action ? [action] : [])]}
      style={{ backgroundColor: theme.colors.surfaceVariant }}>
      {text}
    </Banner>
  );
}
