
-- 1. Create schema
CREATE SCHEMA IF NOT EXISTS kundtest_portal_v2;

-- 2. Tables
CREATE TABLE kundtest_portal_v2.persons (
    pnr text PRIMARY KEY,
    first_name text,
    middle_name text,
    last_name text,
    gender text,
    municipality text,
    county text,
    fb_postnr text,
    fb_postort text,
    fb_address1 text,
    fb_address2 text,
    booked_to_region_stockholm boolean NOT NULL DEFAULT false,
    hsaid text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE kundtest_portal_v2.person_relationships (
    id bigserial PRIMARY KEY,
    person_a text NOT NULL REFERENCES kundtest_portal_v2.persons(pnr) ON DELETE CASCADE,
    person_b text NOT NULL REFERENCES kundtest_portal_v2.persons(pnr) ON DELETE CASCADE,
    rel_typ text NOT NULL,
    relation_label text,
    status text,
    start_date date,
    end_date date,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE kundtest_portal_v2.excel_person_join_raw (
    pnr text,
    fnamn text,
    mnamn text,
    enamn text,
    kon text,
    kommun text,
    lan text,
    fb_utdel_adr1 text,
    fb_utdel_adr2 text,
    fb_postnr text,
    fb_postort text,
    fb_rel_pnr text,
    rel_typ text,
    status text
);

CREATE TABLE kundtest_portal_v2.region_stockholm_assignments (
    pnr text PRIMARY KEY,
    booked_to_region_stockholm boolean NOT NULL DEFAULT true,
    hsaid text,
    source_note text,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Indexes
CREATE INDEX idx_kp_persons_booked ON kundtest_portal_v2.persons (booked_to_region_stockholm);
CREATE INDEX idx_kp_persons_hsaid ON kundtest_portal_v2.persons (hsaid);
CREATE INDEX idx_kp_persons_name ON kundtest_portal_v2.persons (last_name, first_name);
CREATE INDEX idx_kp_rel_typ ON kundtest_portal_v2.person_relationships (rel_typ);
CREATE INDEX idx_kp_rel_a ON kundtest_portal_v2.person_relationships (person_a);
CREATE INDEX idx_kp_rel_b ON kundtest_portal_v2.person_relationships (person_b);

-- 4. Functions
CREATE OR REPLACE FUNCTION kundtest_portal_v2.load_from_raw()
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
    INSERT INTO kundtest_portal_v2.persons (pnr, first_name, middle_name, last_name, gender, municipality, county, fb_postnr, fb_postort, fb_address1, fb_address2)
    SELECT DISTINCT r.pnr, r.fnamn, r.mnamn, r.enamn, r.kon, r.kommun, r.lan, r.fb_postnr, r.fb_postort, r.fb_utdel_adr1, r.fb_utdel_adr2
    FROM kundtest_portal_v2.excel_person_join_raw r
    WHERE r.pnr IS NOT NULL
    ON CONFLICT (pnr) DO UPDATE
    SET first_name = EXCLUDED.first_name, middle_name = EXCLUDED.middle_name, last_name = EXCLUDED.last_name,
        gender = EXCLUDED.gender, municipality = EXCLUDED.municipality, county = EXCLUDED.county,
        fb_postnr = EXCLUDED.fb_postnr, fb_postort = EXCLUDED.fb_postort,
        fb_address1 = EXCLUDED.fb_address1, fb_address2 = EXCLUDED.fb_address2, updated_at = now();

    INSERT INTO kundtest_portal_v2.person_relationships (person_a, person_b, rel_typ, status)
    SELECT DISTINCT r.pnr, r.fb_rel_pnr, r.rel_typ, r.status
    FROM kundtest_portal_v2.excel_person_join_raw r
    WHERE r.pnr IS NOT NULL AND r.fb_rel_pnr IS NOT NULL AND r.rel_typ IS NOT NULL
      AND EXISTS (SELECT 1 FROM kundtest_portal_v2.persons p1 WHERE p1.pnr = r.pnr)
      AND EXISTS (SELECT 1 FROM kundtest_portal_v2.persons p2 WHERE p2.pnr = r.fb_rel_pnr)
    ON CONFLICT DO NOTHING;

    PERFORM kundtest_portal_v2.sync_region_stockholm_assignments();
END;
$$;

CREATE OR REPLACE FUNCTION kundtest_portal_v2.sync_region_stockholm_assignments()
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
    UPDATE kundtest_portal_v2.persons p
    SET booked_to_region_stockholm = a.booked_to_region_stockholm, hsaid = a.hsaid, updated_at = now()
    FROM kundtest_portal_v2.region_stockholm_assignments a
    WHERE p.pnr = a.pnr;
END;
$$;

-- 5. Views in kundtest_portal_v2
CREATE OR REPLACE VIEW kundtest_portal_v2.v_person_directory AS
SELECT pnr, first_name, middle_name, last_name, gender, municipality, county,
       fb_postnr, fb_postort, fb_address1, fb_address2, booked_to_region_stockholm, hsaid
FROM kundtest_portal_v2.persons;

CREATE OR REPLACE VIEW kundtest_portal_v2.v_region_stockholm_booked_persons AS
SELECT * FROM kundtest_portal_v2.persons WHERE booked_to_region_stockholm = true;

CREATE OR REPLACE VIEW kundtest_portal_v2.v_married_couples_readable AS
WITH married AS (
    SELECT DISTINCT least(r.person_a, r.person_b) AS person_1, greatest(r.person_a, r.person_b) AS person_2
    FROM kundtest_portal_v2.person_relationships r WHERE r.rel_typ = 'M'
)
SELECT m.person_1, p1.first_name AS person_1_first_name, p1.last_name AS person_1_last_name,
    p1.booked_to_region_stockholm AS person_1_booked, p1.hsaid AS person_1_hsaid,
    m.person_2, p2.first_name AS person_2_first_name, p2.last_name AS person_2_last_name,
    p2.booked_to_region_stockholm AS person_2_booked, p2.hsaid AS person_2_hsaid
FROM married m
JOIN kundtest_portal_v2.persons p1 ON p1.pnr = m.person_1
JOIN kundtest_portal_v2.persons p2 ON p2.pnr = m.person_2;

-- 6. Modify bookings table
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_person_id_fkey;
TRUNCATE public.bookings;
ALTER TABLE public.bookings ALTER COLUMN person_id TYPE text USING person_id::text;

-- 7. Public schema views for Supabase client
CREATE OR REPLACE VIEW public.kp_persons AS SELECT * FROM kundtest_portal_v2.persons;
CREATE OR REPLACE VIEW public.kp_person_relationships AS SELECT * FROM kundtest_portal_v2.person_relationships;
CREATE OR REPLACE VIEW public.kp_v_person_directory AS SELECT * FROM kundtest_portal_v2.v_person_directory;
CREATE OR REPLACE VIEW public.kp_v_region_stockholm_booked AS SELECT * FROM kundtest_portal_v2.v_region_stockholm_booked_persons;
CREATE OR REPLACE VIEW public.kp_v_married_couples AS SELECT * FROM kundtest_portal_v2.v_married_couples_readable;

-- 8. Grants
GRANT USAGE ON SCHEMA kundtest_portal_v2 TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA kundtest_portal_v2 TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA kundtest_portal_v2 TO anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.kp_persons TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.kp_person_relationships TO anon, authenticated;
GRANT SELECT ON public.kp_v_person_directory TO anon, authenticated;
GRANT SELECT ON public.kp_v_region_stockholm_booked TO anon, authenticated;
GRANT SELECT ON public.kp_v_married_couples TO anon, authenticated;
