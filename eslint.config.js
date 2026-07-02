import globals from 'globals';

/** @type {import('eslint').Linter.Config[]} */
export default [
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'coverage/**'
    ]
  },
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'module',
      globals: {
        ...globals.node, // Add Node.js globals
        ...globals.es2024
      }
    },
    rules: {
      // Override/redefine rules from the base config
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-console': 'off',
      'prefer-const': 'error',
      'no-var': 'error',
      'eqeqeq': ['error', 'always'],
      'curly': ['error', 'multi-line'],
      'no-throw-literal': 'error',
      'prefer-template': 'warn',
      'no-param-reassign': 'warn',
      'consistent-return': 'warn',

      // Node.js specific rules
      'no-process-exit': 'off', // Allow process.exit in CLI scripts
      'no-restricted-modules': 'off', // Allow all modules for now

      // Allow common Node.js patterns
      'no-undef': 'off', // Temporarily disable to see what's left

      // Override specific rules that are causing issues
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    }
  }
];