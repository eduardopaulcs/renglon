import Constants from 'expo-constants';

/** Read from app.config.ts, so the drawer always shows the version that was actually built. */
export const APP_VERSION = Constants.expoConfig?.version ?? '';

export const AUTHOR_NAME = 'Eduardo Paul Contardi Soria';
export const AUTHOR_WEBSITE = 'https://eduardopaulcs.com';
export const AUTHOR_WEBSITE_LABEL = 'eduardopaulcs.com';
