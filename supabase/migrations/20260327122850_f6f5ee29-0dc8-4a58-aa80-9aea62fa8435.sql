CREATE POLICY "Anon can view persons" ON public.persons FOR SELECT TO anon USING (true);
CREATE POLICY "Anon can view relations" ON public.relations FOR SELECT TO anon USING (true);
CREATE POLICY "Anon can view bookings" ON public.bookings FOR SELECT TO anon USING (true);