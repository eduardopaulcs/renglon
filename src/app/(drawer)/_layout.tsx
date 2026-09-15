import { Drawer } from 'expo-router/drawer';

import { AppDrawerContent } from '@/components/AppDrawerContent';
import { useAppTheme } from '@/theme';

export default function DrawerLayout() {
  const theme = useAppTheme();
  return (
    <Drawer
      drawerContent={(props) => <AppDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerStyle: { backgroundColor: theme.colors.background },
      }}
    />
  );
}
