/**
 * babel-plugin-inline-import convierte los .sql de drizzle/ en strings al
 * empaquetar. Sin esto las migraciones fallan en RUNTIME (no en build), con un
 * error poco claro. Va siempre acompanado de metro.config.js.
 */
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [['inline-import', { extensions: ['.sql'] }]],
  };
};
