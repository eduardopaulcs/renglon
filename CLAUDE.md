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

- **`JAVA_HOME` tiene que ser un JDK 21** (`%LOCALAPPDATA%\Java\jdk-21`). Ni el JDK 26 del
  sistema ni el JBR 25 que trae Android Studio sirven: con JDK 24+ el build muere en
  `configureCMakeDebug`. La causa es que AGP forkea `prefab` y
  `GeneratePrefabPackages.reportErrors` convierte **cualquier** linea de stderr en excepcion;
  los JDK nuevos escriben ahi un warning de acceso nativo. El error que se ve en pantalla es
  ese warning, no la causa real, asi que es facil perseguir la pista equivocada.
  `npm run doctor` lo detecta antes de compilar.
- El truststore de Gradle vive en **`~/.gradle/gradle.properties`**, fuera del repo: es
  especifico de esta maquina y sobrevive a `expo prebuild`. El Web/Mail Shield de AVG
  intercepta TLS con su propia CA; Windows confia en ella, Java no, y toda descarga falla con
  `PKIX path building failed`. El archivo en `%LOCALAPPDATA%\Android\java-tls\` es el cacerts
  del JDK mas esa CA.
- **No usar `JAVA_TOOL_OPTIONS`** para el truststore: lo hereda todo JVM hijo y le antepone un
  "Picked up JAVA_TOOL_OPTIONS" a stderr, que es justo lo que descompone el parseo de AGP.

## Convenciones

- Los comentarios explican **por que**, no que. Si el codigo ya lo dice, no se comenta.
- Fechas en SQLite: enteros epoch ms, nunca ISO strings.
- Borrado de notas: logico (`deleted_at`), nunca `DELETE`.
