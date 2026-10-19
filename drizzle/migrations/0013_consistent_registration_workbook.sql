CREATE OR REPLACE FUNCTION public.registration_workbook()
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE result jsonb;
BEGIN
  IF auth.uid() IS NULL OR NOT (public.has_role(auth.uid(), 'admin') OR public.is_event_organiser()) THEN
    RAISE EXCEPTION 'Only admins and assigned organisers can export registrations' USING ERRCODE = '42501';
  END IF;
  WITH students AS (
    SELECT p.id, p.full_name, p.roll_number, p.phone, p.contact_email, p.department, p.year
    FROM public.profiles p
    WHERE p.account_type = 'student'
      AND NOT EXISTS (SELECT 1 FROM public.user_roles u WHERE u.user_id = p.id AND u.role = 'admin')
      AND NOT EXISTS (SELECT 1 FROM public.event_organisers o WHERE o.user_id = p.id)
  ), authorised_events AS (
    SELECT e.id, e.title, e.starts_at FROM public.events e WHERE public.can_manage_event(e.id)
  )
  SELECT jsonb_build_object(
    'students', COALESCE((SELECT jsonb_agg(to_jsonb(s) - 'id' ORDER BY s.roll_number, s.id) FROM students s), '[]'::jsonb),
    'events', COALESCE((SELECT jsonb_agg(jsonb_build_object(
      'id', e.id, 'title', e.title,
      'registrations', COALESCE((SELECT jsonb_agg(jsonb_build_object(
        'team_code', t.team_code, 'full_name', s.full_name, 'roll_number', s.roll_number,
        'phone', s.phone, 'contact_email', s.contact_email, 'department', s.department, 'year', s.year
      ) ORDER BY t.seq NULLS LAST, s.roll_number, s.id)
      FROM public.event_registrations r JOIN students s ON s.id = r.user_id
      LEFT JOIN public.team_members m ON m.event_id = r.event_id AND m.user_id = r.user_id
      LEFT JOIN public.teams t ON t.id = m.team_id AND t.event_id = r.event_id
      WHERE r.event_id = e.id), '[]'::jsonb)
    ) ORDER BY e.starts_at, e.id) FROM authorised_events e), '[]'::jsonb)
  ) INTO result;
  RETURN result;
END;
$$;
REVOKE ALL ON FUNCTION public.registration_workbook() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.registration_workbook() TO authenticated, service_role;
COMMENT ON FUNCTION public.registration_workbook() IS 'Single consistent snapshot of all student signups and authorised event registrations for one Excel workbook; organisers are restricted to their assigned event.';