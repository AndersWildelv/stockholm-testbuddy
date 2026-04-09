
-- Fix views to use security invoker
ALTER VIEW public.kp_persons SET (security_invoker = true);
ALTER VIEW public.kp_person_relationships SET (security_invoker = true);
ALTER VIEW public.kp_v_person_directory SET (security_invoker = true);
ALTER VIEW public.kp_v_region_stockholm_booked SET (security_invoker = true);
ALTER VIEW public.kp_v_married_couples SET (security_invoker = true);

-- Fix function search paths
CREATE OR REPLACE FUNCTION kundtest_portal_v2.load_from_raw()
RETURNS void LANGUAGE plpgsql
SET search_path = kundtest_portal_v2
AS $$
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
RETURNS void LANGUAGE plpgsql
SET search_path = kundtest_portal_v2
AS $$
BEGIN
    UPDATE kundtest_portal_v2.persons p
    SET booked_to_region_stockholm = a.booked_to_region_stockholm, hsaid = a.hsaid, updated_at = now()
    FROM kundtest_portal_v2.region_stockholm_assignments a
    WHERE p.pnr = a.pnr;
END;
$$;
