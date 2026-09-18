import "dotenv/config";

/**
 * Runs before every test file.
 * Load environment variables from .env and ensure TEST_DATABASE_URL is set.
 */
if (!process.env.TEST_DATABASE_URL && process.env.DATABASE_URL) {
  process.env.TEST_DATABASE_URL = process.env.DATABASE_URL;
}

if (process.env.TEST_DATABASE_URL) {
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
}
