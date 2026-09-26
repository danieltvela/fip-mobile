/** @type {import('@jest/types').Config.InitialOptions} */
module.exports = {
  preset: 'jest-expo',
  transformIgnorePatterns: [
    'node_modules/(?!.*((jest-)?react-native|expo))',
  ],
  roots: ['<rootDir>/src'],
};
