
-- Add protected_identity column
ALTER TABLE kundtest_portal_v2.persons ADD COLUMN IF NOT EXISTS protected_identity boolean NOT NULL DEFAULT false;

-- Populate from public.persons
UPDATE kundtest_portal_v2.persons kp
SET protected_identity = p.protected_identity
FROM public.persons p
WHERE kp.pnr = p.person_id AND p.protected_identity = true;

-- Drop both views to recreate with new column
DROP VIEW IF EXISTS public.kp_persons;
DROP VIEW IF EXISTS public.kp_v_person_directory;

-- Recreate kp_v_person_directory
CREATE VIEW public.kp_v_person_directory AS
SELECT pnr, first_name, middle_name, last_name, gender, municipality, county,
       fb_postnr, fb_postort, fb_address1, fb_address2,
       booked_to_region_stockholm, belongs_to_region_stockholm, hsaid,
       protected_identity
FROM kundtest_portal_v2.persons;

-- Recreate kp_persons
CREATE VIEW public.kp_persons AS
SELECT pnr, first_name, middle_name, last_name, gender, municipality, county,
       fb_postnr, fb_postort, fb_address1, fb_address2,
       booked_to_region_stockholm, belongs_to_region_stockholm, hsaid,
       protected_identity,
       created_at, updated_at
FROM kundtest_portal_v2.persons;

-- Grant access
GRANT SELECT ON public.kp_v_person_directory TO anon, authenticated, service_role;
GRANT SELECT ON public.kp_persons TO anon, authenticated, service_role;
