-- Docker PostgreSQL 18 initialization script for DollShop
-- Timezone and standard extensions
SET timezone = 'Europe/Minsk';
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
