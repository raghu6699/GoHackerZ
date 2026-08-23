/**
 * Runs before every test file.
 * When TEST_DATABASE_URL is set, point Prisma at it so integration tests
 * never touch the dev/prod database. Unit tests are unaffected.
 */
if (process.env.TEST_DATABASE_URL) {
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
}
