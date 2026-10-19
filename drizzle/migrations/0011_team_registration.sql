ALTER TABLE public.events ADD COLUMN IF NOT EXISTS abbr text;
UPDATE public.events SET abbr = upper(left(regexp_replace(title,'[^A-Za-z]','','g'),3)) WHERE abbr IS NULL;

CREATE TABLE public.teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  team_code text NOT NULL UNIQUE,
  seq integer NOT NULL,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (event_id, seq)
);
CREATE TABLE public.team_members (
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  PRIMARY KEY (team_id, user_id),
  UNIQUE (event_id, user_id)
);
GRANT SELECT ON public.teams TO authenticated;
GRANT SELECT ON public.team_members TO authenticated;
GRANT ALL ON public.teams TO service_role;
GRANT ALL ON public.team_members TO service_role;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY teams_read ON public.teams FOR SELECT TO authenticated USING (public.can_manage_event(event_id) OR EXISTS (SELECT 1 FROM public.team_members m WHERE m.team_id = teams.id AND m.user_id = auth.uid()));
CREATE POLICY team_members_read ON public.team_members FOR SELECT TO authenticated USING (public.can_manage_event(event_id) OR user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.register_team(_event_id uuid, _codes text[])
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  _event public.events%ROWTYPE;
  _clean text[];
  _c text;
  _p public.profiles%ROWTYPE;
  _ids uuid[] := '{}';
  _seq int;
  _team_id uuid;
  _code text;
  _t text;
BEGIN
  IF NOT public.can_manage_event(_event_id) THEN RETURN jsonb_build_object('status','denied'); END IF;
  SELECT array_agg(DISTINCT upper(trim(x))) INTO _clean FROM unnest(_codes) x WHERE trim(x) <> '';
  IF _clean IS NULL OR array_length(_clean,1) < 1 OR array_length(_clean,1) > 3 THEN
    RETURN jsonb_build_object('status','bad_size');
  END IF;
  SELECT * INTO _event FROM public.events WHERE id = _event_id FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('status','unknown_event'); END IF;
  FOREACH _c IN ARRAY _clean LOOP
    SELECT * INTO _p FROM public.profiles WHERE student_code = _c FOR UPDATE;
    IF NOT FOUND THEN RETURN jsonb_build_object('status','unknown_code','code',_c); END IF;
    IF _p.account_type <> 'student' OR public.has_role(_p.id,'admin') THEN
      RETURN jsonb_build_object('status','not_student','name',_p.full_name); END IF;
    IF _p.locked_event_id IS NOT NULL AND _p.locked_event_id <> _event_id THEN
      SELECT title INTO _t FROM public.events WHERE id = _p.locked_event_id;
      RETURN jsonb_build_object('status','locked','name',_p.full_name,'roll',_p.roll_number,'event_title',_t); END IF;
    IF EXISTS (SELECT 1 FROM public.team_members WHERE event_id=_event_id AND user_id=_p.id) THEN
      SELECT t.team_code INTO _t FROM public.team_members m JOIN public.teams t ON t.id=m.team_id WHERE m.event_id=_event_id AND m.user_id=_p.id;
      RETURN jsonb_build_object('status','in_team','name',_p.full_name,'roll',_p.roll_number,'team_code',_t); END IF;
    _ids := _ids || _p.id;
  END LOOP;
  SELECT coalesce(max(seq),0)+1 INTO _seq FROM public.teams WHERE event_id=_event_id;
  _code := coalesce(_event.abbr, upper(left(regexp_replace(_event.title,'[^A-Za-z]','','g'),3))) || '-' || lpad(_seq::text,3,'0');
  INSERT INTO public.teams(event_id, team_code, seq, created_by) VALUES (_event_id,_code,_seq,auth.uid()) RETURNING id INTO _team_id;
  FOREACH _c IN ARRAY _clean LOOP PERFORM public.mark_attendance_by_code(_event_id,_c); END LOOP;
  INSERT INTO public.team_members(team_id,event_id,user_id) SELECT _team_id,_event_id,unnest(_ids);
  RETURN jsonb_build_object('status','ok','team_code',_code,'members',array_length(_ids,1),'credits',_event.credits);
END $$;
REVOKE ALL ON FUNCTION public.register_team(uuid,text[]) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.register_team(uuid,text[]) TO authenticated;

CREATE OR REPLACE FUNCTION public.event_export(_event_id uuid)
RETURNS TABLE(team_code text, roll_number text, full_name text, department text, student_code text, registered_at timestamptz, present boolean, credits integer)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NOT public.can_manage_event(_event_id) THEN RAISE EXCEPTION 'not allowed'; END IF;
  RETURN QUERY SELECT t.team_code, p.roll_number, p.full_name, p.department, p.student_code, r.created_at, a.id IS NOT NULL, a.credits
  FROM public.event_registrations r JOIN public.profiles p ON p.id=r.user_id
  LEFT JOIN public.team_members m ON m.event_id=r.event_id AND m.user_id=r.user_id
  LEFT JOIN public.teams t ON t.id=m.team_id
  LEFT JOIN public.attendance a ON a.event_id=r.event_id AND a.user_id=r.user_id
  WHERE r.event_id=_event_id ORDER BY t.seq NULLS LAST, p.roll_number;
END $$;
REVOKE ALL ON FUNCTION public.event_export(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.event_export(uuid) TO authenticated;