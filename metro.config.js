const { getDefaultConfig } = require('expo/metro-config');

/**
 * Metro has to treat .sql as a source extension so inline-import can resolve those files.
 * The other half of the wiring lives in babel.config.js.
 */
const config = getDefaultConfig(__dirname);

config.resolver.sourceExts.push('sql');

module.exports = config;
