
-- Replace the overly permissive audit_log insert policy with user_id check
DROP POLICY "Authenticated can insert audit log" ON public.audit_log;
CREATE POLICY "Users can insert own audit entries"
  ON public.audit_log FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
