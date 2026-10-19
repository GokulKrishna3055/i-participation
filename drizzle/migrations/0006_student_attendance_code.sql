ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS student_code text NOT NULL DEFAULT upper(substr(replace(gen_random_uuid()::text,'-',''),1,8));
CREATE UNIQUE INDEX IF NOT EXISTS profiles_student_code_key ON public.profiles(student_code);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
begin
 insert into public.profiles(id, roll_number, full_name, department) values (new.id, upper(coalesce(new.raw_user_meta_data->>'roll_number', split_part(new.email,'@',1))), coalesce(new.raw_user_meta_data->>'full_name','Student'), new.raw_user_meta_data->>'department');
 insert into public.user_roles(user_id, role) values (new.id,'user');
 -- bootstrap: the very first account on a fresh system becomes the admin
 if not exists (select 1 from public.user_roles where role='admin') then
   insert into public.user_roles(user_id, role) values (new.id,'admin');
 end if;
 return new;
end $$;

CREATE OR REPLACE FUNCTION public.mark_attendance_by_code(_event_id uuid, _code text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE p public.profiles; c integer; ins integer;
BEGIN
 IF NOT public.can_manage_event(_event_id) THEN RAISE EXCEPTION 'Not assigned to this event'; END IF;
 SELECT * INTO p FROM public.profiles WHERE student_code = upper(trim(coalesce(_code,'')));
 IF NOT FOUND THEN RAISE EXCEPTION 'Invalid student code'; END IF;
 IF NOT EXISTS (SELECT 1 FROM public.event_registrations WHERE user_id=p.id AND event_id=_event_id) THEN
   RAISE EXCEPTION '% has not registered for this event', p.full_name; END IF;
 SELECT CASE category WHEN 'tech' THEN 20 ELSE 15 END INTO c FROM public.events WHERE id=_event_id;
 INSERT INTO public.attendance(user_id,event_id,credits,verified_by,verified_at)
   VALUES(p.id,_event_id,c,auth.uid(),now()) ON CONFLICT(user_id,event_id) DO NOTHING;
 GET DIAGNOSTICS ins = ROW_COUNT;
 RETURN jsonb_build_object('status', CASE WHEN ins=1 THEN 'ok' ELSE 'already' END, 'credits', c, 'full_name', p.full_name, 'roll_number', p.roll_number);
END $$;
REVOKE ALL ON FUNCTION public.mark_attendance_by_code(uuid,text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.mark_attendance_by_code(uuid,text) TO authenticated;