/**
 * babel-plugin-inline-import turns the .sql files in drizzle/ into strings at bundle time.
 * Without it, migrations fail at RUNTIME (not at build time) with an unhelpful error. It
 * always goes together with metro.config.js.
 */
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [['inline-import', { extensions: ['.sql'] }]],
  };
};
