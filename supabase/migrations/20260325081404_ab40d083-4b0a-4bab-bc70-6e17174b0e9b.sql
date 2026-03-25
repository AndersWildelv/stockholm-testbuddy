
-- Enum for roles
CREATE TYPE public.app_role AS ENUM ('admin', 'viewer');

-- Enum for person type
CREATE TYPE public.person_type AS ENUM ('Personal', 'Invånare');

-- Enum for booking status
CREATE TYPE public.booking_status AS ENUM ('active', 'released', 'expired');

-- User roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS for user_roles
CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view own role"
  ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can manage roles"
  ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Persons table
CREATE TABLE public.persons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id TEXT NOT NULL UNIQUE,
  personnummer TEXT,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  hsa_id TEXT,
  person_type person_type NOT NULL GENERATED ALWAYS AS (
    CASE WHEN hsa_id IS NOT NULL AND hsa_id <> '' THEN 'Personal'::person_type ELSE 'Invånare'::person_type END
  ) STORED,
  is_static BOOLEAN NOT NULL DEFAULT false,
  municipality TEXT,
  region TEXT,
  address TEXT,
  postal_code TEXT,
  city TEXT,
  phone TEXT,
  email TEXT,
  additional_attributes JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.persons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view persons"
  ON public.persons FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admins can insert persons"
  ON public.persons FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update dynamic persons"
  ON public.persons FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') AND is_static = false)
  WITH CHECK (public.has_role(auth.uid(), 'admin') AND is_static = false);

CREATE POLICY "Admins can delete persons"
  ON public.persons FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Relations table
CREATE TABLE public.relations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id UUID NOT NULL REFERENCES public.persons(id) ON DELETE CASCADE,
  related_person_id UUID NOT NULL REFERENCES public.persons(id) ON DELETE CASCADE,
  relation_type TEXT NOT NULL,
  valid_from DATE,
  valid_to DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT no_self_relation CHECK (person_id <> related_person_id)
);
ALTER TABLE public.relations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view relations"
  ON public.relations FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admins can manage relations"
  ON public.relations FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Bookings table
CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id UUID NOT NULL REFERENCES public.persons(id) ON DELETE CASCADE,
  booked_by UUID NOT NULL REFERENCES auth.users(id),
  booked_by_email TEXT,
  start_time TIMESTAMPTZ NOT NULL DEFAULT now(),
  end_time TIMESTAMPTZ NOT NULL,
  status booking_status NOT NULL DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view bookings"
  ON public.bookings FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admins can create bookings"
  ON public.bookings FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update bookings"
  ON public.bookings FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Import batches table
CREATE TABLE public.import_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  imported_by UUID NOT NULL REFERENCES auth.users(id),
  file_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'staging',
  total_rows INT DEFAULT 0,
  valid_rows INT DEFAULT 0,
  error_rows INT DEFAULT 0,
  validation_report JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  published_at TIMESTAMPTZ
);
ALTER TABLE public.import_batches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view imports"
  ON public.import_batches FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admins can manage imports"
  ON public.import_batches FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Audit log table
CREATE TABLE public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view audit log"
  ON public.audit_log FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated can insert audit log"
  ON public.audit_log FOR INSERT TO authenticated
  WITH CHECK (true);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_persons_updated_at
  BEFORE UPDATE ON public.persons
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes
CREATE INDEX idx_persons_person_type ON public.persons(person_type);
CREATE INDEX idx_persons_is_static ON public.persons(is_static);
CREATE INDEX idx_persons_person_id ON public.persons(person_id);
CREATE INDEX idx_bookings_person_id ON public.bookings(person_id);
CREATE INDEX idx_bookings_status ON public.bookings(status);
CREATE INDEX idx_relations_person_id ON public.relations(person_id);
CREATE INDEX idx_relations_related_person_id ON public.relations(related_person_id);
CREATE INDEX idx_audit_log_entity ON public.audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_log_created ON public.audit_log(created_at DESC);
