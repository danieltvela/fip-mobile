/* eslint-disable no-undef */
// Auth services fail fast without a strong JWT secret; provide one for tests.
process.env.JWT_SECRET ??= 'fip-test-secret-at-least-16-chars';
