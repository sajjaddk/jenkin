const globals = require('globals');

module.exports = [
  {
    files: ['cypress/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: { ...globals.browser, ...globals.mocha, cy: 'readonly', Cypress: 'readonly', expect: 'readonly' },
    },
    rules: {
      'no-unused-vars': 'error',
      'no-undef': 'error',
      eqeqeq: 'error',
      'no-console': 'warn',
    },
  },
  {
    files: ['playwright/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: { ...globals.node },
    },
    rules: { 'no-unused-vars': 'error', 'no-undef': 'error', eqeqeq: 'error' },
  },
  {
    files: ['*.js'],
    languageOptions: { ecmaVersion: 2022, sourceType: 'commonjs', globals: { ...globals.node } },
    rules: { 'no-unused-vars': 'error', 'no-undef': 'error', eqeqeq: 'error' },
  },
];
