import expoConfig from '@bandada/eslint-config/expo';

export default [
  ...expoConfig,
  { ignores: ['dist/**', '.expo/**', 'node_modules/**', 'coverage/**', 'expo-env.d.ts'] },
];
