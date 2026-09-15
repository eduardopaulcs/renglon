import { spawn } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';

import { AVD_NAME, findRunningEmulator, listAvds, resolveSdkRoot, sdkTool, tryExec } from './android-env.mjs';

/**
 * Arranca el AVD y NO devuelve el control hasta que el sistema termino de
 * bootear. Es idempotente: si ya hay un emulador corriendo, sale enseguida.
 *
 * El punto importante es la espera activa del final. `adb devices` reporta el
 * emulador como "device" bastante antes de que Android este realmente listo, y
 * si `expo run:android` instala en esa ventana falla con errores que no apuntan
 * a la causa real.
 */

const BOOT_TIMEOUT_MS = 300_000;
const POLL_INTERVAL_MS = 2_000;

function fail(message) {
  console.error(`\n[boot-emulator] ${message}\n`);
  process.exit(1);
}

async function waitForBoot(adb, startedAt) {
  let lastReport = 0;

  while (Date.now() - startedAt < BOOT_TIMEOUT_MS) {
    const serial = findRunningEmulator(adb);

    if (serial) {
      const booted = tryExec(adb, ['-s', serial, 'shell', 'getprop', 'sys.boot_completed']);
      if (booted === '1') return serial;
    }

    const elapsed = Math.floor((Date.now() - startedAt) / 1000);
    if (elapsed - lastReport >= 10) {
      lastReport = elapsed;
      console.log(`[boot-emulator] esperando boot... ${elapsed}s`);
    }

    await sleep(POLL_INTERVAL_MS);
  }
  return null;
}

async function main() {
  const sdkRoot = resolveSdkRoot();
  if (!sdkRoot) {
    fail(
      'No encuentro el SDK de Android.\n' +
        'Defini ANDROID_HOME apuntando a tu instalacion (normalmente %LOCALAPPDATA%\\Android\\Sdk).'
    );
  }

  const adb = sdkTool(sdkRoot, 'adb');
  const emulator = sdkTool(sdkRoot, 'emulator');

  const alreadyRunning = findRunningEmulator(adb);
  if (alreadyRunning) {
    console.log(`[boot-emulator] ya hay un emulador corriendo (${alreadyRunning}), no hago nada.`);
    return;
  }

  const avds = listAvds(emulator);
  if (!avds.includes(AVD_NAME)) {
    fail(
      `El AVD "${AVD_NAME}" no existe. Disponibles: ${avds.length ? avds.join(', ') : '(ninguno)'}\n\n` +
        'Crealo con:\n' +
        `  "${sdkRoot}\\cmdline-tools\\latest\\bin\\avdmanager.bat" create avd -n ${AVD_NAME} ` +
        '-k "system-images;android-36;google_apis;x86_64" -d pixel_7'
    );
  }

  console.log(`[boot-emulator] arrancando ${AVD_NAME}...`);
  const startedAt = Date.now();

  // detached + unref para que el emulador sobreviva a este proceso: si muriera
  // con el script, el `npm run android` encadenado se quedaria sin dispositivo.
  const child = spawn(emulator, ['-avd', AVD_NAME, '-no-snapshot-save', '-no-boot-anim', '-gpu', 'host'], {
    detached: true,
    stdio: 'ignore',
  });
  child.unref();

  const serial = await waitForBoot(adb, startedAt);
  if (!serial) {
    fail(
      `El emulador no termino de bootear en ${BOOT_TIMEOUT_MS / 1000}s.\n` +
        'Causa mas probable: sin aceleracion por hardware. Verifica que la feature\n' +
        '"HypervisorPlatform" este activada Y que hayas reiniciado despues de activarla.'
    );
  }

  // Desbloquea la pantalla; si no, la app se instala pero queda tapada por el lockscreen.
  tryExec(adb, ['-s', serial, 'shell', 'input', 'keyevent', '82']);

  const seconds = Math.round((Date.now() - startedAt) / 1000);
  console.log(`[boot-emulator] listo: ${serial} (${seconds}s)`);
}

main().catch((error) => fail(error.message));
