import expoConfig from '@bandada/eslint-config/expo';

export default [
  ...expoConfig,
  {
    ignores: [
      'dist/**',
      '.expo/**',
      'node_modules/**',
      'coverage/**',
      'expo-env.d.ts',
      'tailwind.config.js',
      'babel.config.js',
      'metro.config.js',
      'scripts/**',
      'plugins/**',
    ],
  },
  {
    rules: {
      // React Compiler rule that doesn't understand Reanimated shared values
      // (`sharedValue.value = …`) nor refs mutated inside callbacks/effects.
      'react-hooks/immutability': 'off',
    },
  },
];
