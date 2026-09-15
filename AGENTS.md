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
| `npm run icons` | Regenerates every icon PNG from the SVG drawing in `scripts/export-icons.mjs` |

When asked to start or run the app, launch it (`npm run dev`), confirm it is up and stop there.
Do not keep monitoring it, tapping through screens, taking screenshots or inspecting the database
afterwards: the user is using the app, and whatever changes on screen is their doing.

## Architecture

- **Routing**: `expo-router`, file-based routes in `src/app/`. `(drawer)/` holds the screens
  reachable from the side menu (all notes, folder, tag, trash, backup); `note/[id].tsx` is the
  editor, stacked above the drawer.
- **Data**: `expo-sqlite` + Drizzle. `src/db/schema.ts` is the source of truth for the schema.
  Queries live in `src/db/queries/` and are synchronous, because the expo-sqlite driver is.
  Inside `db.transaction` use `.run()`, `.get()` and `.all()`; an `async` callback breaks it.
- **State**: there is no state manager. `useLiveData` (`src/db/live.ts`) re-runs a query whenever
  any of the tables it lists changes, so the database **is** the state. Do not use Drizzle's
  `useLiveQuery`: it only watches the main table of the query, so a list showing tags goes stale
  when a tag changes. Do not add Zustand/Redux without a concrete reason either: it would
  duplicate the source of truth.
- **UI**: `react-native-paper` (Material 3) with the "notebook" palette in `src/theme/`. Titles
  use `titleFont`. Transient feedback goes through the app-wide `useSnackbar()`. Folder icons and
  tag colors are stored as keys from `src/lib/appearance.ts`, never as raw icon names or hex
  values; the theme maps each tag color to its light and dark variant (`tagColors`).
- **Tips**: one-time hints use `useTip` (`src/services/tips.ts`) with `TipBanner`. Whether a tip
  was seen is stored in `expo-sqlite/kv-store`, not in the notes database, so backups and
  migrations never touch it. A tip is dismissed with its button or by using the feature it
  describes.
- **UI strings**: always through `t()` / `tp()` from `src/i18n`, never hardcoded. The app follows
  the phone language: English for English, Spanish for everything else. Add keys to `es.ts`
  first; `en.ts` is typed against it, so a missing translation fails the typecheck. Spanish copy
  avoids second-person verbs so it reads naturally for both "tú" and "vos" speakers.

## Things that break easily

- **`enableChangeListener`** in `src/db/client.ts` is what makes `useLiveData` work. Remove it
  and notes still save, but no screen updates.
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
- **Until the first release**, schema changes are folded into the initial migration instead of
  adding new ones: delete the files in `drizzle/`, run `npm run db:generate`, recreate the FTS
  migration with `npx drizzle-kit generate --custom --name notes_fts5` and paste its SQL back, then
  clear the app data (`adb shell pm clear com.eduardopaulcs.renglon`), because a database that
  already applied the old migrations would try to create the tables again. Once the app is
  published, applied migrations are never edited: every change is a new migration.
- Deleting notes: soft delete (`deleted_at`) with an Undo snackbar. A hard `DELETE` happens only
  when deleting forever from the trash, and when discarding a note left without a title or text
  (a folder or tags alone do not keep it). While that new note is untouched, `listNotes` and
  `noteCounts` hide it, so it never flashes into a list.
- Imported files are untrusted: validate them fully (`src/lib/backup-format.ts`) before writing
  anything.
