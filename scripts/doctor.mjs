import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { AVD_NAME, listAvds, resolveSdkRoot, sdkTool, tryExec } from './android-env.mjs';

/**
 * Chequeo del entorno nativo antes de compilar.
 *
 * Existe porque los fallos de Gradle en Android son notoriamente crípticos: un
 * JAVA_HOME incorrecto se manifiesta como "Unsupported class file major
 * version" y no como "tu JDK no sirve". Preferimos fallar acá, con el problema
 * dicho en castellano.
 */

const checks = [];

function ok(name, detail) {
  checks.push({ level: 'ok', name, detail });
}
function warn(name, detail) {
  checks.push({ level: 'warn', name, detail });
}
function bad(name, detail) {
  checks.push({ level: 'bad', name, detail });
}

/** Lee la version de Gradle del wrapper, si el proyecto nativo ya fue generado. */
function gradleVersion() {
  const wrapper = join(process.cwd(), 'android', 'gradle', 'wrapper', 'gradle-wrapper.properties');
  if (!existsSync(wrapper)) return null;

  const match = readFileSync(wrapper, 'utf8').match(/gradle-(\d+)\.(\d+)(?:\.(\d+))?-/);
  if (!match) return null;

  return { major: Number(match[1]), minor: Number(match[2]), raw: `${match[1]}.${match[2]}` };
}

function javaMajor(javaHome) {
  const bin = join(javaHome, 'bin', process.platform === 'win32' ? 'java.exe' : 'java');
  if (!existsSync(bin)) return null;

  // Se usa `--version` (JDK 9+) porque escribe en stdout. El viejo `-version`
  // escribe en stderr, que execFileSync no devuelve: daria "" y no null, por eso
  // el fallback encadena con || y no con ??.
  const output = tryExec(bin, ['--version']) || tryExec(bin, ['-version'], { stdio: 'pipe' });
  if (!output) return null;

  // Cubre los dos formatos: `openjdk 25.0.3` y `openjdk version "25.0.3"`.
  const match = output.match(/(?:version\s+")?(\d+)(?:\.(\d+))?/);
  if (!match) return null;

  const major = Number(match[1]);
  // Los JDK viejos se anuncian como 1.8.0: ahi el major real es el segundo numero.
  return major === 1 && match[2] ? Number(match[2]) : major;
}

// --- Node ---------------------------------------------------------------
const nodeMajor = Number(process.versions.node.split('.')[0]);
if (nodeMajor >= 20) ok('Node', `v${process.versions.node}`);
else bad('Node', `v${process.versions.node} — Expo SDK 57 necesita Node 20+`);

// --- JDK ----------------------------------------------------------------
const javaHome = process.env.JAVA_HOME;
if (!javaHome) {
  bad('JAVA_HOME', 'sin definir — Gradle va a usar el java del PATH, que puede ser incompatible');
} else if (!existsSync(javaHome)) {
  bad('JAVA_HOME', `apunta a una ruta inexistente: ${javaHome}`);
} else {
  const major = javaMajor(javaHome);
  const gradle = gradleVersion();

  if (major === null) {
    warn('JAVA_HOME', `no pude leer la version de java en ${javaHome}`);
  } else if (gradle && gradle.major < 9 && major > 21) {
    bad(
      'JDK',
      `JDK ${major} con Gradle ${gradle.raw}. Gradle 8.x no soporta JDK >21; ` +
        'apunta JAVA_HOME a un JDK 21'
    );
  } else if (major < 17) {
    bad('JDK', `JDK ${major} — el Android Gradle Plugin necesita 17 o superior`);
  } else {
    ok('JDK', `${major} (${javaHome})${gradle ? ` · Gradle ${gradle.raw}` : ''}`);
  }
}

// --- SDK de Android -----------------------------------------------------
const sdkRoot = resolveSdkRoot();
if (!sdkRoot) {
  bad('Android SDK', 'no encontrado — defini ANDROID_HOME');
} else {
  ok('Android SDK', sdkRoot);

  const adb = sdkTool(sdkRoot, 'adb');
  if (existsSync(adb)) ok('adb', tryExec(adb, ['--version'])?.split(/\r?\n/)[0] ?? 'presente');
  else bad('adb', 'falta platform-tools');

  const emulator = sdkTool(sdkRoot, 'emulator');
  if (!existsSync(emulator)) {
    bad('emulator', 'falta el paquete "emulator" del SDK');
  } else {
    const avds = listAvds(emulator);
    if (avds.includes(AVD_NAME)) ok('AVD', AVD_NAME);
    else bad('AVD', `falta "${AVD_NAME}" — disponibles: ${avds.join(', ') || '(ninguno)'}`);
  }
}

// --- Reporte ------------------------------------------------------------
const icon = { ok: 'OK  ', warn: 'WARN', bad: 'FAIL' };
console.log('\nRenglon — chequeo de entorno\n');
for (const check of checks) {
  console.log(`  [${icon[check.level]}] ${check.name.padEnd(13)} ${check.detail}`);
}

const failures = checks.filter((c) => c.level === 'bad');
console.log(failures.length ? `\n${failures.length} problema(s) que bloquean el build.\n` : '\nEntorno listo.\n');
process.exit(failures.length ? 1 : 0);
