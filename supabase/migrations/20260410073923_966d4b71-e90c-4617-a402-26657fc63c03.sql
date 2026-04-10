
GRANT USAGE ON SCHEMA kundtest_portal_v2 TO sandbox_exec;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA kundtest_portal_v2 TO sandbox_exec;
ALTER DEFAULT PRIVILEGES IN SCHEMA kundtest_portal_v2 GRANT SELECT, INSERT, UPDATE ON TABLES TO sandbox_exec;

-- Also grant to anon and authenticated for reading via views
GRANT USAGE ON SCHEMA kundtest_portal_v2 TO anon;
GRANT SELECT ON ALL TABLES IN SCHEMA kundtest_portal_v2 TO anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA kundtest_portal_v2 GRANT SELECT ON TABLES TO anon;

GRANT USAGE ON SCHEMA kundtest_portal_v2 TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA kundtest_portal_v2 TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA kundtest_portal_v2 GRANT SELECT ON TABLES TO authenticated;
