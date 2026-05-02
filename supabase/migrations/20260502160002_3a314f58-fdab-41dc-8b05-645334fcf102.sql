-- ============================================================
-- Ersätt de fyra "kp_*" vyerna så att de pekar på de nya tabellerna
-- (person, fb_relation, afb_relation, actor_organization).
-- ============================================================

DROP VIEW IF EXISTS public.kp_v_region_stockholm_booked CASCADE;
DROP VIEW IF EXISTS public.kp_v_person_directory CASCADE;
DROP VIEW IF EXISTS public.kp_person_relationships CASCADE;
DROP VIEW IF EXISTS public.kp_persons CASCADE;

-- ---------- kp_persons ----------
CREATE VIEW public.kp_persons
WITH (security_invoker = on) AS
SELECT
  p.pnr,
  p.fnamn  AS first_name,
  p.mnamn  AS middle_name,
  p.enamn  AS last_name,
  p.kon    AS gender,
  p.kommun AS municipality,
  p.lan    AS county,
  p.fb_postnr,
  p.fb_postort,
  p.fb_utdel_adr1 AS fb_address1,
  p.fb_utdel_adr2 AS fb_address2,
  -- Bokad till Region Stockholm = personen jobbar för RS (har koppling i actor_organization)
  EXISTS (SELECT 1 FROM public.actor_organization ao WHERE ao.pnr = p.pnr) AS booked_to_region_stockholm,
  -- Tillhör Region Stockholm = folkbokförd i Stockholms län (lan = '1')
  (p.lan = '1') AS belongs_to_region_stockholm,
  -- HSA-ID = actor_id från actor_organization (första träffen)
  (SELECT ao.actor_id
     FROM public.actor_organization ao
    WHERE ao.pnr = p.pnr
      AND ao.actor_id IS NOT NULL
    LIMIT 1) AS hsaid,
  -- Skyddad identitet om sekretessmarkering eller skyddad folkbokföring
  (COALESCE(p.sekr_mark,'') = 'J' OR COALESCE(p.skyddad_fb,'') = 'J') AS protected_identity,
  p.imported_at AS created_at,
  p.imported_at AS updated_at
FROM public.person p;

-- ---------- kp_v_person_directory (samma som kp_persons för appens behov) ----------
CREATE VIEW public.kp_v_person_directory
WITH (security_invoker = on) AS
SELECT
  pnr,
  first_name,
  middle_name,
  last_name,
  gender,
  municipality,
  county,
  fb_postnr,
  fb_postort,
  fb_address1,
  fb_address2,
  booked_to_region_stockholm,
  belongs_to_region_stockholm,
  hsaid,
  protected_identity
FROM public.kp_persons;

-- ---------- kp_v_region_stockholm_booked ----------
CREATE VIEW public.kp_v_region_stockholm_booked
WITH (security_invoker = on) AS
SELECT
  pnr,
  first_name,
  middle_name,
  last_name,
  gender,
  municipality,
  county,
  fb_postnr,
  fb_postort,
  fb_address1,
  fb_address2,
  booked_to_region_stockholm,
  belongs_to_region_stockholm,
  hsaid,
  created_at,
  updated_at
FROM public.kp_persons
WHERE booked_to_region_stockholm = true;

-- ---------- kp_person_relationships ----------
-- Mappar fb_relation + afb_relation till app-formatet (person_a, person_b, rel_typ, ...)
-- Översätter rel_typ-koder till svenska etiketter och exkluderar granne/kollega/kusin.
CREATE VIEW public.kp_person_relationships
WITH (security_invoker = on) AS
WITH combined AS (
  SELECT
    fr.id,
    fr.pnr           AS person_a,
    fr.fb_rel_pnr    AS person_b,
    fr.rel_typ,
    fr.vard_datum    AS start_date_raw,
    fr.rel_avr_datum AS end_date_raw,
    fr.status,
    'fb'::text       AS source
  FROM public.fb_relation fr
  WHERE fr.fb_rel_pnr IS NOT NULL
    AND fr.rel_typ IS NOT NULL
    AND UPPER(fr.rel_typ) NOT IN ('GR','KO','KU','GRANNE','KOLLEGA','KUSIN')
  UNION ALL
  -- afb_relation har inte en fb_rel_pnr-kolumn (det är historiska personer utan pnr i registret)
  -- vi tar bara med dem som har en pnr-baserad referens i fältet (vissa rader använder afb_rel_fodtid som identifierare)
  SELECT
    1000000000 + ar.id AS id,
    ar.pnr             AS person_a,
    ar.afb_rel_fodtid  AS person_b,  -- bästa tillgängliga referens
    ar.rel_typ,
    ar.vard_datum      AS start_date_raw,
    ar.rel_avr_datum   AS end_date_raw,
    ar.status,
    'afb'::text        AS source
  FROM public.afb_relation ar
  WHERE ar.afb_rel_fodtid IS NOT NULL
    AND ar.rel_typ IS NOT NULL
    AND UPPER(ar.rel_typ) NOT IN ('GR','KO','KU','GRANNE','KOLLEGA','KUSIN')
    -- Bara ta med de där fodtid faktiskt är ett 12-siffrigt pnr (annars finns inte personen i person-tabellen)
    AND ar.afb_rel_fodtid ~ '^[0-9]{12}$'
)
SELECT
  c.id::bigint AS id,
  c.person_a,
  c.person_b,
  c.rel_typ,
  CASE UPPER(c.rel_typ)
    WHEN 'M'  THEN 'Make/Maka'
    WHEN 'P'  THEN 'Partner'
    WHEN 'B'  THEN 'Barn'
    WHEN 'FA' THEN 'Far'
    WHEN 'MO' THEN 'Mor'
    WHEN 'VF' THEN 'Vårdnadshavare Far'
    WHEN 'V'  THEN 'Vårdnadshavare'
    WHEN 'SY' THEN 'Syskon'
    WHEN 'AD' THEN 'Adoptivförälder'
    ELSE c.rel_typ
  END AS relation_label,
  c.status,
  -- Konvertera ÅÅÅÅMMDD-strängar till date där möjligt
  CASE WHEN c.start_date_raw ~ '^[0-9]{8}$'
       THEN to_date(c.start_date_raw, 'YYYYMMDD')::text END AS start_date,
  CASE WHEN c.end_date_raw ~ '^[0-9]{8}$'
       THEN to_date(c.end_date_raw, 'YYYYMMDD')::text END AS end_date,
  now() AS created_at
FROM combined c;

-- Bevilja rättigheter (vyer ärver inte från bastabellerna automatiskt för anon)
GRANT SELECT ON public.kp_persons TO anon, authenticated;
GRANT SELECT ON public.kp_v_person_directory TO anon, authenticated;
GRANT SELECT ON public.kp_v_region_stockholm_booked TO anon, authenticated;
GRANT SELECT ON public.kp_person_relationships TO anon, authenticated;