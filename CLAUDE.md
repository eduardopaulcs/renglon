# Renglon

App de bloc de notas para Android. Expo + React Native + TypeScript, datos 100% locales en SQLite.

## Comandos

| Comando | Que hace |
| --- | --- |
| `npm run doctor` | Valida el entorno nativo (JDK, SDK, AVD) antes de compilar |
| `npm run emulator` | Arranca el AVD y espera a que termine de bootear |
| `npm run dev` | Emulador + Metro con dev client. El del dia a dia |
| `npm run android` | Emulador + build nativo completo (lento) |
| `npm run db:generate` | Regenera migraciones desde `src/db/schema.ts` |
| `npm run typecheck` | `tsc --noEmit` |

## Arquitectura

- **Routing**: `expo-router`, rutas por archivo en `src/app/`.
- **Datos**: `expo-sqlite` + Drizzle. `src/db/schema.ts` es la fuente de verdad del esquema.
- **Estado**: no hay state manager. `useLiveQuery` de Drizzle re-renderiza ante cambios en
  SQLite, asi que la base **es** el estado. No agregar Zustand/Redux sin una razon concreta:
  duplicaria la fuente de verdad.
- **UI**: `react-native-paper` (Material 3). Los temas viven en `src/theme/`.

## Cosas que se rompen facil

- **`enableChangeListener`** en `src/db/client.ts` es lo que hace funcionar `useLiveQuery`.
  Si se saca, las notas se guardan pero la lista no se actualiza.
- **`babel.config.js` + `metro.config.js`** son ambos necesarios para empaquetar los `.sql`.
  Si falta uno, las migraciones fallan en runtime, no en build.
- **FTS5** (`drizzle/0001_notes_fts5.sql`) esta escrito a mano porque Drizzle no modela tablas
  virtuales. Si se cambian las columnas `title`/`body` de `notes`, hay que actualizar los
  triggers a mano. Regenerar el esquema **no** los toca.
- **Expo Go no sirve**: el plugin `enableFTS` de `expo-sqlite` es un config plugin y no se
  aplica ahi. Hay que usar development build.
- **`android/` e `ios/` estan gitignoreados** (CNG). Editarlos a mano no sirve: se regeneran.
  Todo ajuste nativo va en `app.config.ts`.

## Entorno (Windows)

- `JAVA_HOME` apunta al JBR de Android Studio (JDK 25). Sirve porque Gradle 9.3 lo soporta.
  El JDK del sistema es 26 y **no** funciona con AGP.
- La configuracion critica de Gradle vive en **`~/.gradle/gradle.properties`**, no en el repo:
  es especifica de esta maquina y ademas sobrevive a `expo prebuild`. Contiene dos flags que
  resuelven fallos no obvios:
  - `--enable-native-access=ALL-UNNAMED`: JNA (usado por AGP) llama a `System.load`, y bajo
    JDK 25 eso escribe un warning por stderr. AGP lee el stderr de sus tareas de CMake y lo
    toma como fallo, con lo cual el build muere en `configureCMakeDebug` mostrando el warning
    como si fuera el error.
  - `-Djavax.net.ssl.trustStore=...`: el Web/Mail Shield de AVG intercepta TLS con su propia
    CA. Windows confia en ella, Java no, y toda descarga falla con `PKIX path building failed`.
    El truststore en `%LOCALAPPDATA%\Android\java-tls\` es el cacerts del JDK mas esa CA.
- **No usar `JAVA_TOOL_OPTIONS`** para esto: lo hereda todo JVM hijo y le antepone un
  "Picked up JAVA_TOOL_OPTIONS" a stderr, que es justo lo que descompone el parseo de AGP.

## Convenciones

- Los comentarios explican **por que**, no que. Si el codigo ya lo dice, no se comenta.
- Fechas en SQLite: enteros epoch ms, nunca ISO strings.
- Borrado de notas: logico (`deleted_at`), nunca `DELETE`.
