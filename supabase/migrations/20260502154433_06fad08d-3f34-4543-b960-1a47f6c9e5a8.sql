CREATE OR REPLACE FUNCTION public.reset_test_data()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, kundtest_portal_v2
AS $$
DECLARE
  c_bookings int := 0;
  c_relations int := 0;
  c_audit int := 0;
  c_persons int := 0;
  c_kp_rel int := 0;
  c_kp_persons int := 0;
  c_kp_assignments int := 0;
BEGIN
  DELETE FROM public.bookings; GET DIAGNOSTICS c_bookings = ROW_COUNT;
  DELETE FROM public.relations; GET DIAGNOSTICS c_relations = ROW_COUNT;
  DELETE FROM public.audit_log; GET DIAGNOSTICS c_audit = ROW_COUNT;
  DELETE FROM public.persons; GET DIAGNOSTICS c_persons = ROW_COUNT;
  DELETE FROM kundtest_portal_v2.person_relationships; GET DIAGNOSTICS c_kp_rel = ROW_COUNT;
  DELETE FROM kundtest_portal_v2.region_stockholm_assignments; GET DIAGNOSTICS c_kp_assignments = ROW_COUNT;
  DELETE FROM kundtest_portal_v2.persons; GET DIAGNOSTICS c_kp_persons = ROW_COUNT;

  RETURN jsonb_build_object(
    'bookings', c_bookings,
    'relations', c_relations,
    'audit_log', c_audit,
    'persons', c_persons,
    'kp_person_relationships', c_kp_rel,
    'kp_region_stockholm_assignments', c_kp_assignments,
    'kp_persons', c_kp_persons
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.reset_test_data() TO anon, authenticated;