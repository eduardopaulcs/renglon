import { Drawer } from 'expo-router/drawer';

import { AppDrawerContent } from '@/components/AppDrawerContent';
import { useAppTheme } from '@/theme';

/**
 * Horizontal distance before a touch counts as a drawer swipe. The library default is 5 px, so
 * a tap on a menu item that drifts slightly also starts a swipe; when that swipe ends it
 * restores the drawer to the "open" state it saw at the start, reopening the menu right after
 * the item closed it.
 */
const SWIPE_ACTIVATION_DISTANCE = 24;

export default function DrawerLayout() {
  const theme = useAppTheme();
  return (
    <Drawer
      drawerContent={(props) => <AppDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerStyle: { backgroundColor: theme.colors.background },
        configureGestureHandler: (gesture) =>
          gesture.activeOffsetX([-SWIPE_ACTIVATION_DISTANCE, SWIPE_ACTIVATION_DISTANCE]),
      }}
    />
  );
}
