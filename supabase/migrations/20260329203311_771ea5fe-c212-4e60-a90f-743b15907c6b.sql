
ALTER TABLE public.persons ADD COLUMN is_bookable boolean NOT NULL DEFAULT true;

CREATE POLICY "Anon can create bookings" ON public.bookings FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Anon can update bookings" ON public.bookings FOR UPDATE TO anon USING (true) WITH CHECK (true);
