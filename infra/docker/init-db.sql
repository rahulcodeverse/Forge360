-- Create extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Row-level security on audit_logs — no UPDATE or DELETE
-- This is enforced at the application level; the DB-level lock is belt-and-suspenders.
