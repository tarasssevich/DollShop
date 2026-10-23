-- Role and permissions setup for DollShop (Step 3.3)

-- 1. Create app_owner and app_user roles if they do not exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'app_owner') THEN
    CREATE ROLE app_owner WITH LOGIN PASSWORD 'dollshop_owner_password';
  END IF;
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'app_user') THEN
    CREATE ROLE app_user WITH LOGIN PASSWORD 'dollshop_dev_password';
  END IF;
END
$$;

-- 2. Revoke default public schema privileges from PUBLIC
REVOKE ALL ON SCHEMA public FROM PUBLIC;
REVOKE CREATE ON SCHEMA public FROM PUBLIC;

-- 3. Grant schema ownership and DDL rights to app_owner
GRANT ALL ON SCHEMA public TO app_owner;
CREATE SCHEMA IF NOT EXISTS drizzle AUTHORIZATION app_owner;
GRANT ALL ON SCHEMA drizzle TO app_owner;
GRANT ALL PRIVILEGES ON DATABASE dollshop TO app_owner;

-- 4. Transfer ownership of all existing tables, sequences and routines to app_owner
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
    EXECUTE format('ALTER TABLE public.%I OWNER TO app_owner', r.tablename);
  END LOOP;
  FOR r IN (SELECT sequence_name FROM information_schema.sequences WHERE sequence_schema = 'public') LOOP
    EXECUTE format('ALTER SEQUENCE public.%I OWNER TO app_owner', r.sequence_name);
  END LOOP;
  FOR r IN (SELECT proname, oidvectortypes(proargtypes) as argtypes FROM pg_proc WHERE pronamespace = 'public'::regnamespace) LOOP
    EXECUTE format('ALTER FUNCTION public.%I(%s) OWNER TO app_owner', r.proname, r.argtypes);
  END LOOP;
END
$$;

-- 5. Grant minimal runtime DML rights to app_user (NO DDL: NO DROP, NO ALTER, NO TRUNCATE)
GRANT USAGE ON SCHEMA public TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_user;
GRANT EXECUTE ON ALL ROUTINES IN SCHEMA public TO app_user;

-- 6. Ensure future tables created by app_owner also automatically grant DML to app_user
ALTER DEFAULT PRIVILEGES FOR ROLE app_owner IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app_user;
ALTER DEFAULT PRIVILEGES FOR ROLE app_owner IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO app_user;
ALTER DEFAULT PRIVILEGES FOR ROLE app_owner IN SCHEMA public GRANT EXECUTE ON ROUTINES TO app_user;
