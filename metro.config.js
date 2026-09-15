const { getDefaultConfig } = require('expo/metro-config');

/**
 * Metro tiene que reconocer .sql como source para que inline-import los pueda
 * resolver. La otra mitad del cableado esta en babel.config.js.
 */
const config = getDefaultConfig(__dirname);

config.resolver.sourceExts.push('sql');

module.exports = config;
