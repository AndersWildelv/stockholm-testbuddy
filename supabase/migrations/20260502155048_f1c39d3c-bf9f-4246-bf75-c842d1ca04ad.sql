-- =========================================================
-- 8 nya tabeller för folkbokföringsimport
-- =========================================================

-- 1. person
CREATE TABLE public.person (
  pnr                       text PRIMARY KEY,
  pnr_typ                   text,
  tilltalskod               text,
  fnamn                     text,
  mnamn                     text,
  enamn                     text,
  fnamn_styrkt              text,
  mnamn_styrkt              text,
  enamn_styrkt              text,
  lan                       text,
  kommun                    text,
  fors                      text,
  fb_co_adr                 text,
  fb_utdel_adr1             text,
  fb_utdel_adr2             text,
  fb_postnr                 text,
  fb_postort                text,
  avr_orsak                 text,
  avr_datum                 text,
  fb_datum                  text,
  avi_namn                  text,
  fast_beteckning           text,
  fb_avi_utdel_adr          text,
  fb_avi_postnr             text,
  fb_avi_postort            text,
  sp_co_adr                 text,
  sp_utdel_adr1             text,
  sp_utdel_adr2             text,
  sp_postnr                 text,
  sp_postort                text,
  sp_avi_utdel_adr          text,
  sp_avi_postnr             text,
  sp_avi_postort            text,
  utl_co_adr                text,
  utl_utdel_adr1            text,
  utl_utdel_adr2            text,
  utl_land                  text,
  utl_datum                 text,
  civ                       text,
  civ_datum                 text,
  fod_lan                   text,
  fod_fors                  text,
  fod_ort                   text,
  fod_ort_styrkt            text,
  fod_land                  text,
  inv_datum                 text,
  icke_terr_fors            text,
  kon                       text,
  eff_datum                 text,
  hanv_pnr                  text,
  sekr_mark                 text,
  created_by                text,
  created_time              text,
  updated_by                text,
  updated_time              text,
  distriktskod              text,
  skyddad_fb                text,
  fod_datum                 text,
  identity_level            text,
  identity_level_date       text,
  fiktivt_nr                text,
  utl_datum_rostratt        text,
  antraffad_dod             text,
  uppehallsratt             text,
  opt_out_pappersavisering  text,
  version                   text,
  revision                  text,
  imported_at               timestamptz NOT NULL DEFAULT now()
);

-- 2. contact_info
CREATE TABLE public.contact_info (
  contact_info_id     text PRIMARY KEY,
  pnr                 text NOT NULL REFERENCES public.person(pnr) ON DELETE CASCADE,
  last_updated_stamp  text,
  created_stamp       text
);
CREATE INDEX idx_contact_info_pnr ON public.contact_info(pnr);

-- 3. fb_relation
CREATE TABLE public.fb_relation (
  id              bigserial PRIMARY KEY,
  pnr             text NOT NULL REFERENCES public.person(pnr) ON DELETE CASCADE,
  fb_rel_pnr      text NOT NULL,
  rel_typ         text NOT NULL,
  vard_datum      text,
  vard_slut_datum text,
  rel_avr_orsak   text,
  rel_avr_datum   text,
  created_by      text,
  created_time    text,
  updated_by      text,
  updated_time    text,
  status          text,
  UNIQUE (pnr, fb_rel_pnr, rel_typ, vard_datum)
);
CREATE INDEX idx_fb_relation_pnr ON public.fb_relation(pnr);
CREATE INDEX idx_fb_relation_fb_rel_pnr ON public.fb_relation(fb_rel_pnr);
CREATE INDEX idx_fb_relation_rel_typ ON public.fb_relation(rel_typ);

-- 4. afb_relation
CREATE TABLE public.afb_relation (
  id                bigserial PRIMARY KEY,
  pnr               text NOT NULL REFERENCES public.person(pnr) ON DELETE CASCADE,
  afb_rel_fodtid    text,
  rel_typ           text NOT NULL,
  vard_datum        text,
  vard_slut_datum   text,
  afb_rel_fnamn     text,
  afb_rel_mnamn     text,
  afb_rel_enamn     text,
  rel_avr_orsak     text,
  rel_avr_datum     text,
  created_by        text,
  created_time      text,
  updated_by        text,
  updated_time      text,
  status            text,
  UNIQUE (pnr, afb_rel_fodtid, rel_typ, afb_rel_fnamn, afb_rel_enamn, vard_datum)
);
CREATE INDEX idx_afb_relation_pnr ON public.afb_relation(pnr);
CREATE INDEX idx_afb_relation_rel_typ ON public.afb_relation(rel_typ);

-- 5. fastighet_adress
CREATE TABLE public.fastighet_adress (
  id              bigserial PRIMARY KEY,
  pnr             text NOT NULL REFERENCES public.person(pnr) ON DELETE CASCADE,
  fastighet       text,
  adress          text,
  lagenhet        text,
  created_by      text,
  created_time    text,
  updated_by      text,
  updated_time    text,
  UNIQUE (pnr, fastighet, adress, lagenhet)
);
CREATE INDEX idx_fastighet_adress_pnr ON public.fastighet_adress(pnr);

-- 6. contact_person
CREATE TABLE public.contact_person (
  contact_person_id           text PRIMARY KEY,
  pnr                         text NOT NULL REFERENCES public.person(pnr) ON DELETE CASCADE,
  contact_relationship_type   text,
  priority_order              text,
  given_name                  text,
  surname                     text,
  middle_name                 text,
  actor_id                    text,
  organization_id             text,
  updated_date                text,
  main_contact_address_id     text,
  last_updated_stamp          text,
  created_stamp               text
);
CREATE INDEX idx_contact_person_pnr ON public.contact_person(pnr);

-- 7. actor_organization
CREATE TABLE public.actor_organization (
  id                  bigserial PRIMARY KEY,
  pnr                 text NOT NULL REFERENCES public.person(pnr) ON DELETE CASCADE,
  actor_id            text,
  organization_id     text,
  updated_date        text,
  last_updated_stamp  text,
  created_stamp       text,
  UNIQUE (pnr, actor_id, organization_id)
);
CREATE INDEX idx_actor_organization_pnr ON public.actor_organization(pnr);

-- 8. notification_sync
CREATE TABLE public.notification_sync (
  id                    bigserial PRIMARY KEY,
  pnr                   text NOT NULL REFERENCES public.person(pnr) ON DELETE CASCADE,
  syncronization_time   text,
  record_id             text,
  notification_type     text,
  modification_time     text,
  total_record          text,
  notification_date     text,
  created_by            text,
  created_time          text,
  updated_by            text,
  updated_time          text,
  UNIQUE (pnr, syncronization_time, notification_date)
);
CREATE INDEX idx_notification_sync_pnr ON public.notification_sync(pnr);

-- =========================================================
-- RLS – appen använder delad lösenordsgrind, anon-rollen
-- =========================================================
ALTER TABLE public.person              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_info        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fb_relation         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.afb_relation        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fastighet_adress    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_person      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.actor_organization  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_sync   ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'person','contact_info','fb_relation','afb_relation',
    'fastighet_adress','contact_person','actor_organization','notification_sync'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('CREATE POLICY "Anon read %I"   ON public.%I FOR SELECT TO anon, authenticated USING (true);', t, t);
    EXECUTE format('CREATE POLICY "Anon insert %I" ON public.%I FOR INSERT TO anon, authenticated WITH CHECK (true);', t, t);
    EXECUTE format('CREATE POLICY "Anon update %I" ON public.%I FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);', t, t);
    EXECUTE format('CREATE POLICY "Anon delete %I" ON public.%I FOR DELETE TO anon, authenticated USING (true);', t, t);
  END LOOP;
END $$;

-- =========================================================
-- Reset-funktion för importflödet (truncate i rätt ordning)
-- =========================================================
CREATE OR REPLACE FUNCTION public.reset_import_tables()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  TRUNCATE TABLE
    public.notification_sync,
    public.actor_organization,
    public.contact_person,
    public.fastighet_adress,
    public.afb_relation,
    public.fb_relation,
    public.contact_info,
    public.person
  RESTART IDENTITY CASCADE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.reset_import_tables() TO anon, authenticated;