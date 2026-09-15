import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { AVD_NAME, listAvds, resolveSdkRoot, sdkTool, tryExec } from './android-env.mjs';

/**
 * Checks the native environment before building.
 *
 * It exists because Android Gradle failures are notoriously cryptic: a wrong JAVA_HOME shows
 * up as "Unsupported class file major version" rather than "your JDK is not supported".
 * Better to fail here and name the actual problem.
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

/** Reads the Gradle version from the wrapper, if the native project has been generated. */
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

  // `--version` (JDK 9+) is used because it writes to stdout. The old `-version` writes to
  // stderr, which execFileSync does not return: it yields "" rather than null, which is why
  // the fallback chains with || instead of ??.
  const output = tryExec(bin, ['--version']) || tryExec(bin, ['-version'], { stdio: 'pipe' });
  if (!output) return null;

  // Handles both formats: `openjdk 25.0.3` and `openjdk version "25.0.3"`.
  const match = output.match(/(?:version\s+")?(\d+)(?:\.(\d+))?/);
  if (!match) return null;

  const major = Number(match[1]);
  // Old JDKs report themselves as 1.8.0: there the real major version is the second number.
  return major === 1 && match[2] ? Number(match[2]) : major;
}

// --- Node ---------------------------------------------------------------
const nodeMajor = Number(process.versions.node.split('.')[0]);
if (nodeMajor >= 20) ok('Node', `v${process.versions.node}`);
else bad('Node', `v${process.versions.node} — Expo SDK 57 requires Node 20+`);

// --- JDK ----------------------------------------------------------------
const javaHome = process.env.JAVA_HOME;
if (!javaHome) {
  bad('JAVA_HOME', 'not set — Gradle will use the java on PATH, which may be incompatible');
} else if (!existsSync(javaHome)) {
  bad('JAVA_HOME', `points to a path that does not exist: ${javaHome}`);
} else {
  const major = javaMajor(javaHome);
  const gradle = gradleVersion();

  if (major === null) {
    warn('JAVA_HOME', `could not read the java version in ${javaHome}`);
  } else if (major < 17) {
    bad('JDK', `JDK ${major} — the Android Gradle Plugin requires 17 or newer`);
  } else if (major > 21) {
    // Not a theoretical precaution: with JDK 24+ the build dies in configureCMakeDebug. AGP
    // forks prefab, and GeneratePrefabPackages.reportErrors turns any stderr line into an
    // exception; newer JDKs write a native-access warning there. The error you see is the
    // warning, not the cause.
    bad(
      'JDK',
      `JDK ${major} — use a JDK 21. With 24+ the Android Gradle Plugin fails in ` +
        'configureCMakeDebug on a native-access warning it treats as an error'
    );
  } else {
    ok('JDK', `${major} (${javaHome})${gradle ? ` · Gradle ${gradle.raw}` : ''}`);
  }
}

// --- Android SDK --------------------------------------------------------
const sdkRoot = resolveSdkRoot();
if (!sdkRoot) {
  bad('Android SDK', 'not found — set ANDROID_HOME');
} else {
  ok('Android SDK', sdkRoot);

  const adb = sdkTool(sdkRoot, 'adb');
  if (existsSync(adb)) ok('adb', tryExec(adb, ['--version'])?.split(/\r?\n/)[0] ?? 'present');
  else bad('adb', 'platform-tools is missing');

  const emulator = sdkTool(sdkRoot, 'emulator');
  if (!existsSync(emulator)) {
    bad('emulator', 'the SDK "emulator" package is missing');
  } else {
    const avds = listAvds(emulator);
    if (avds.includes(AVD_NAME)) ok('AVD', AVD_NAME);
    else bad('AVD', `"${AVD_NAME}" is missing — available: ${avds.join(', ') || '(none)'}`);
  }
}

// --- Report -------------------------------------------------------------
const icon = { ok: 'OK  ', warn: 'WARN', bad: 'FAIL' };
console.log('\nRenglon — environment check\n');
for (const check of checks) {
  console.log(`  [${icon[check.level]}] ${check.name.padEnd(13)} ${check.detail}`);
}

const failures = checks.filter((c) => c.level === 'bad');
console.log(failures.length ? `\n${failures.length} problem(s) blocking the build.\n` : '\nEnvironment ready.\n');
process.exit(failures.length ? 1 : 0);
