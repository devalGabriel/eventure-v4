CREATE TABLE IF NOT EXISTS people (
  id    TEXT PRIMARY KEY,
  nume  TEXT NOT NULL,
  user  TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_people_user ON people(user);
