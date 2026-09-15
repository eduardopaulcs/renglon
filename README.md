# Renglon

App de bloc de notas para Android. Los datos viven **solo en el dispositivo**: no hay backend,
no hay cuenta, no hay red.

## Stack

| Capa | Herramienta |
| --- | --- |
| Framework | Expo SDK 57 (React Native 0.86) |
| Lenguaje | TypeScript |
| Routing | expo-router |
| Base de datos | expo-sqlite + Drizzle ORM |
| Busqueda | FTS5 |
| UI | react-native-paper (Material 3) |

Android 7+ (minSdk 24), compilado contra API 36.

## Arrancar

```bash
npm install
npm run doctor     # valida el entorno antes de compilar
npm run android    # primera vez: bootea el emulador y compila (lento)
npm run dev        # despues: emulador + Metro
```

`npm run android` arranca el emulador por su cuenta y espera a que termine de bootear, asi
que no hace falta abrirlo a mano.

## Requisitos del entorno

- Node 20+ (hay un `.nvmrc` con la version usada)
- Android Studio, por el SDK y el JDK embebido
- `ANDROID_HOME` y `JAVA_HOME` definidos
- Virtualizacion por hardware para el emulador. En Windows: feature
  `HypervisorPlatform` activada. Verificar con `emulator -accel-check`.

`npm run doctor` chequea todo esto y dice que falta.

## Estructura

```
src/
  app/          pantallas (expo-router)
  db/           esquema, cliente y consultas
  theme/        temas claro y oscuro
drizzle/        migraciones SQL generadas + la de FTS5, escrita a mano
scripts/        arranque del emulador y chequeo de entorno
```

`android/` no esta versionado: se genera con `expo prebuild` a partir de `app.config.ts`.

## Estado

Fundacion lista y verificada de punta a punta. Implementado: crear, listar, editar con
autoguardado, y buscar. El esquema ya contempla etiquetas, carpetas, papelera y export,
pero esas pantallas todavia no existen.
