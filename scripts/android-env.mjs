import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';

/**
 * Resolucion compartida del SDK de Android. Centralizada aca porque
 * boot-emulator y doctor necesitan exactamente las mismas rutas, y duplicarlas
 * es la forma clasica de que se desincronicen.
 */

export const AVD_NAME = process.env.RENGLON_AVD ?? 'Renglon_API36';

const IS_WINDOWS = process.platform === 'win32';
const EXE = IS_WINDOWS ? '.exe' : '';

export function resolveSdkRoot() {
  const candidates = [
    process.env.ANDROID_HOME,
    process.env.ANDROID_SDK_ROOT,
    process.env.LOCALAPPDATA ? join(process.env.LOCALAPPDATA, 'Android', 'Sdk') : null,
    process.env.HOME ? join(process.env.HOME, 'Android', 'Sdk') : null,
  ].filter(Boolean);

  for (const candidate of candidates) {
    if (existsSync(candidate)) return candidate;
  }
  return null;
}

export function sdkTool(sdkRoot, name) {
  const locations = {
    adb: join(sdkRoot, 'platform-tools', `adb${EXE}`),
    emulator: join(sdkRoot, 'emulator', `emulator${EXE}`),
  };
  return locations[name];
}

/** Ejecuta un binario y devuelve stdout, o null si falla. Nunca tira. */
export function tryExec(file, args, options = {}) {
  try {
    return execFileSync(file, args, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
      ...options,
    }).trim();
  } catch {
    return null;
  }
}

/**
 * Devuelve el serial del primer emulador en estado "device", o null.
 * Ignora los que estan en "offline" o "unauthorized": un emulador a medio
 * arrancar aparece listado pero no acepta instalaciones.
 */
export function findRunningEmulator(adb) {
  const output = tryExec(adb, ['devices']);
  if (!output) return null;

  for (const line of output.split(/\r?\n/).slice(1)) {
    const [serial, state] = line.trim().split(/\s+/);
    if (serial?.startsWith('emulator-') && state === 'device') return serial;
  }
  return null;
}

export function listAvds(emulator) {
  const output = tryExec(emulator, ['-list-avds']);
  if (!output) return [];
  return output
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('INFO'));
}
