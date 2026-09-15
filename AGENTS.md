# Renglon

Notepad app for Android. Expo + React Native + TypeScript, with all data stored locally in SQLite.

This is the instructions file for AI assistants.

> **Expo has changed a lot between releases.** Before writing code, read the docs for the exact
> version this project uses: https://docs.expo.dev/versions/v57.0.0/

## Commands

| Command | What it does |
| --- | --- |
| `npm run doctor` | Checks the native environment (JDK, SDK, AVD) before building |
| `npm run emulator` | Starts the AVD and waits until it has finished booting |
| `npm run dev` | Emulator + Metro with the dev client. The everyday command |
| `npm run android` | Emulator + full native build (slow) |
| `npm run db:generate` | Regenerates migrations from `src/db/schema.ts` |
| `npm run typecheck` | `tsc --noEmit` |

## Architecture

- **Routing**: `expo-router`, file-based routes in `src/app/`.
- **Data**: `expo-sqlite` + Drizzle. `src/db/schema.ts` is the source of truth for the schema.
- **State**: there is no state manager. Drizzle's `useLiveQuery` re-renders when SQLite changes,
  so the database **is** the state. Do not add Zustand/Redux without a concrete reason: it would
  duplicate the source of truth.
- **UI**: `react-native-paper` (Material 3). Themes live in `src/theme/`.

## Things that break easily

- **`enableChangeListener`** in `src/db/client.ts` is what makes `useLiveQuery` work. Remove it
  and notes still save, but the list stops updating.
- **`babel.config.js` + `metro.config.js`** are both required to bundle the `.sql` files. If
  either is missing, migrations fail at runtime, not at build time.
- **FTS5** (`drizzle/0001_notes_fts5.sql`) is hand-written because Drizzle does not model
  virtual tables. If the `title`/`body` columns of `notes` change, the triggers must be updated
  by hand. Regenerating the schema does **not** touch them.
- **Expo Go does not work**: the `enableFTS` option of `expo-sqlite` is a config plugin and is
  not applied there. A development build is required.
- **`android/` and `ios/` are gitignored** (CNG). Editing them by hand is pointless: they get
  regenerated. Every native setting goes in `app.config.ts`.

## Environment (Windows)

- **`JAVA_HOME` must point to a JDK 21** (`%LOCALAPPDATA%\Java\jdk-21`). Neither the system JDK
  26 nor the JBR 25 bundled with Android Studio works: with JDK 24+ the build dies in
  `configureCMakeDebug`. The cause is that AGP forks `prefab`, and
  `GeneratePrefabPackages.reportErrors` turns **any** stderr line into an exception; newer JDKs
  write a native-access warning there. The error shown on screen is that warning, not the real
  cause, so it is easy to chase the wrong lead. `npm run doctor` catches this before building.
- The Gradle truststore lives in **`~/.gradle/gradle.properties`**, outside the repo: it is
  specific to this machine and survives `expo prebuild`. AVG's Web/Mail Shield intercepts TLS
  with its own CA; Windows trusts it, Java does not, and every download fails with
  `PKIX path building failed`. The file in `%LOCALAPPDATA%\Android\java-tls\` is the JDK's
  cacerts plus that CA.
- **Do not use `JAVA_TOOL_OPTIONS`** for the truststore: every child JVM inherits it and prints
  "Picked up JAVA_TOOL_OPTIONS" to stderr, which is exactly what breaks AGP's output parsing.

## Conventions

- **Everything is written in English**: code comments, documentation, script output, test
  names and commit messages.
- Comments explain **why**, not what. If the code already says it, do not comment it.
- Dates in SQLite: epoch-ms integers, never ISO strings.
- Deleting notes: soft delete (`deleted_at`), never `DELETE`.
