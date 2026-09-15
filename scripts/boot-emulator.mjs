import { spawn } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';

import { AVD_NAME, findRunningEmulator, listAvds, resolveSdkRoot, sdkTool, tryExec } from './android-env.mjs';

/**
 * Starts the AVD and does NOT return until the system has finished booting. It is
 * idempotent: if an emulator is already running, it exits right away.
 *
 * The important part is the active wait at the end. `adb devices` reports the emulator as
 * "device" well before Android is actually ready, and if `expo run:android` installs during
 * that window it fails with errors that do not point to the real cause.
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
      console.log(`[boot-emulator] waiting for boot... ${elapsed}s`);
    }

    await sleep(POLL_INTERVAL_MS);
  }
  return null;
}

async function main() {
  const sdkRoot = resolveSdkRoot();
  if (!sdkRoot) {
    fail(
      'Android SDK not found.\n' +
        'Set ANDROID_HOME to your installation (usually %LOCALAPPDATA%\\Android\\Sdk).'
    );
  }

  const adb = sdkTool(sdkRoot, 'adb');
  const emulator = sdkTool(sdkRoot, 'emulator');

  const alreadyRunning = findRunningEmulator(adb);
  if (alreadyRunning) {
    console.log(`[boot-emulator] an emulator is already running (${alreadyRunning}), nothing to do.`);
    return;
  }

  const avds = listAvds(emulator);
  if (!avds.includes(AVD_NAME)) {
    fail(
      `AVD "${AVD_NAME}" does not exist. Available: ${avds.length ? avds.join(', ') : '(none)'}\n\n` +
        'Create it with:\n' +
        `  "${sdkRoot}\\cmdline-tools\\latest\\bin\\avdmanager.bat" create avd -n ${AVD_NAME} ` +
        '-k "system-images;android-36;google_apis;x86_64" -d pixel_7'
    );
  }

  console.log(`[boot-emulator] starting ${AVD_NAME}...`);
  const startedAt = Date.now();

  // detached + unref so the emulator outlives this process: if it died along with the script,
  // the chained `npm run android` would be left without a device.
  const child = spawn(emulator, ['-avd', AVD_NAME, '-no-snapshot-save', '-no-boot-anim', '-gpu', 'host'], {
    detached: true,
    stdio: 'ignore',
  });
  child.unref();

  const serial = await waitForBoot(adb, startedAt);
  if (!serial) {
    fail(
      `The emulator did not finish booting within ${BOOT_TIMEOUT_MS / 1000}s.\n` +
        'Most likely cause: no hardware acceleration. Check that the "HypervisorPlatform"\n' +
        'Windows feature is enabled, and run `emulator -accel-check`.'
    );
  }

  // Unlock the screen; otherwise the app installs but stays hidden behind the lock screen.
  tryExec(adb, ['-s', serial, 'shell', 'input', 'keyevent', '82']);

  const seconds = Math.round((Date.now() - startedAt) / 1000);
  console.log(`[boot-emulator] ready: ${serial} (${seconds}s)`);
}

main().catch((error) => fail(error.message));
