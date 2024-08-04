-- Reset the database by dropping all the tables.
PRAGMA defer_foreign_keys = true;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS boats;
DROP TABLE IF EXISTS log_entries;
DROP TABLE IF EXISTS users_to_boats;
DROP TABLE IF EXISTS auth_sessions;
SELECT name FROM sqlite_master; -- Display the tables in the database that haven't been deleted (for debugging purposes)
PRAGMA defer_foreign_keys = false;