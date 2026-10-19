ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone text, ADD COLUMN IF NOT EXISTS contact_email text, ADD COLUMN IF NOT EXISTS year text;

CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
begin
 insert into public.profiles(id, roll_number, full_name, department, account_type, phone, contact_email, year) values (new.id, upper(coalesce(new.raw_user_meta_data->>'roll_number', split_part(new.email,'@',1))), coalesce(new.raw_user_meta_data->>'full_name','Student'), new.raw_user_meta_data->>'department',
   case when new.raw_user_meta_data->>'account_type' = 'organiser' then 'organiser' else 'student' end,
   new.raw_user_meta_data->>'phone', new.raw_user_meta_data->>'contact_email', new.raw_user_meta_data->>'year');
 insert into public.user_roles(user_id, role) values (new.id,'user');
 return new;
end $function$;

CREATE OR REPLACE FUNCTION public.event_export_v2(_event_id uuid)
RETURNS TABLE(team_code text, full_name text, roll_number text, phone text, contact_email text, department text, year text)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NOT public.can_manage_event(_event_id) THEN RAISE EXCEPTION 'not allowed'; END IF;
  RETURN QUERY SELECT t.team_code, p.full_name, p.roll_number, p.phone, p.contact_email, p.department, p.year
  FROM public.event_registrations r JOIN public.profiles p ON p.id=r.user_id
  LEFT JOIN public.team_members m ON m.event_id=r.event_id AND m.user_id=r.user_id
  LEFT JOIN public.teams t ON t.id=m.team_id
  WHERE r.event_id=_event_id ORDER BY t.seq NULLS LAST, p.roll_number;
END $$;
REVOKE ALL ON FUNCTION public.event_export_v2(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.event_export_v2(uuid) TO authenticated;