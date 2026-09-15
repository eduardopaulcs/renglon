import type { ExpoConfig } from 'expo/config';

/**
 * Configuracion nativa de Renglon.
 *
 * Fuente unica de verdad: no existe app.json. Los directorios android/ e ios/
 * estan en .gitignore y se regeneran con `expo prebuild` (CNG), asi que
 * cualquier ajuste nativo tiene que declararse aca o se pierde.
 */
const config: ExpoConfig = {
  name: 'Renglon',
  slug: 'renglon',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'renglon',
  userInterfaceStyle: 'automatic',

  android: {
    // Inmutable una vez publicado en Play Store.
    package: 'com.eduardopaulcs.renglon',
    versionCode: 1,
    adaptiveIcon: {
      backgroundColor: '#E6F4FE',
      foregroundImage: './assets/images/android-icon-foreground.png',
      backgroundImage: './assets/images/android-icon-background.png',
      monochromeImage: './assets/images/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
  },

  ios: {
    icon: './assets/expo.icon',
    bundleIdentifier: 'com.eduardopaulcs.renglon',
    supportsTablet: true,
  },

  web: {
    output: 'static',
    favicon: './assets/images/favicon.png',
  },

  plugins: [
    'expo-router',
    [
      'expo-splash-screen',
      {
        backgroundColor: '#208AEF',
        image: './assets/images/splash-icon.png',
        imageWidth: 76,
      },
    ],
    [
      // enableFTS habilita FTS3/4/5 en el binario de SQLite. Es un config plugin,
      // por eso la app necesita un development build: en Expo Go no se aplica.
      'expo-sqlite',
      {
        enableFTS: true,
        useSQLCipher: false,
      },
    ],
    [
      // minSdk explicito en lugar de heredar el default del SDK, que cambia
      // entre versiones de Expo sin aviso.
      'expo-build-properties',
      {
        android: {
          minSdkVersion: 24,
          compileSdkVersion: 36,
          targetSdkVersion: 36,
        },
      },
    ],
  ],

  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
};

export default config;
