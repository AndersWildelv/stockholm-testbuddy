
GRANT USAGE ON SCHEMA kundtest_portal_v2 TO service_role;
GRANT SELECT ON ALL TABLES IN SCHEMA kundtest_portal_v2 TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA kundtest_portal_v2 GRANT SELECT ON TABLES TO service_role;
