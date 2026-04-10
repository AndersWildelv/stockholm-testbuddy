
-- Add belongs_to_region_stockholm column
ALTER TABLE kundtest_portal_v2.persons
ADD COLUMN IF NOT EXISTS belongs_to_region_stockholm boolean NOT NULL DEFAULT false;

-- Drop and recreate the internal views first
DROP VIEW IF EXISTS public.kp_v_person_directory CASCADE;
DROP VIEW IF EXISTS public.kp_persons CASCADE;
DROP VIEW IF EXISTS public.kp_v_region_stockholm_booked CASCADE;
DROP VIEW IF EXISTS kundtest_portal_v2.v_person_directory CASCADE;
DROP VIEW IF EXISTS kundtest_portal_v2.v_region_stockholm_booked_persons CASCADE;

-- Recreate internal views
CREATE VIEW kundtest_portal_v2.v_person_directory AS
SELECT pnr, first_name, middle_name, last_name, gender, municipality, county,
       fb_postnr, fb_postort, fb_address1, fb_address2,
       booked_to_region_stockholm, belongs_to_region_stockholm, hsaid
FROM kundtest_portal_v2.persons;

CREATE VIEW kundtest_portal_v2.v_region_stockholm_booked_persons AS
SELECT pnr, first_name, middle_name, last_name, gender, municipality, county,
       fb_postnr, fb_postort, fb_address1, fb_address2,
       booked_to_region_stockholm, belongs_to_region_stockholm, hsaid,
       created_at, updated_at
FROM kundtest_portal_v2.persons
WHERE booked_to_region_stockholm = true;

-- Recreate public views
CREATE VIEW public.kp_v_person_directory AS
SELECT pnr, first_name, middle_name, last_name, gender, municipality, county,
       fb_postnr, fb_postort, fb_address1, fb_address2,
       booked_to_region_stockholm, belongs_to_region_stockholm, hsaid
FROM kundtest_portal_v2.v_person_directory;

CREATE VIEW public.kp_persons AS
SELECT pnr, first_name, middle_name, last_name, gender, municipality, county,
       fb_postnr, fb_postort, fb_address1, fb_address2,
       booked_to_region_stockholm, belongs_to_region_stockholm, hsaid,
       created_at, updated_at
FROM kundtest_portal_v2.persons;

CREATE VIEW public.kp_v_region_stockholm_booked AS
SELECT pnr, first_name, middle_name, last_name, gender, municipality, county,
       fb_postnr, fb_postort, fb_address1, fb_address2,
       booked_to_region_stockholm, belongs_to_region_stockholm, hsaid,
       created_at, updated_at
FROM kundtest_portal_v2.v_region_stockholm_booked_persons;

-- Grant access
GRANT SELECT ON kundtest_portal_v2.v_person_directory TO anon, authenticated;
GRANT SELECT ON kundtest_portal_v2.v_region_stockholm_booked_persons TO anon, authenticated;
