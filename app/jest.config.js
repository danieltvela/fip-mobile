/** @type {import('@jest/types').Config.InitialOptions} */
module.exports = {
  preset: 'jest-expo',
  // pnpm nests every dep in node_modules/.pnpm/<pkg>@<ver>/node_modules/<pkg>,
  // which defeats the standard RN transformIgnorePatterns lookahead. Transform
  // everything instead: jest-expo's babel handles node_modules fine.
  transformIgnorePatterns: [],
  roots: ['<rootDir>/lib'],
};
