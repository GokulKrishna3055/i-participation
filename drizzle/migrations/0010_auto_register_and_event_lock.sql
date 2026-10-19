ALTER TABLE public.profiles ADD COLUMN locked_event_id uuid REFERENCES public.events(id);

DROP FUNCTION public.event_roster(uuid, text, integer);

CREATE OR REPLACE FUNCTION public.mark_attendance_by_code(_event_id uuid, _code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _profile public.profiles%ROWTYPE;
  _event public.events%ROWTYPE;
  _locked_title text;
  _inserted boolean;
BEGIN
  IF NOT public.can_manage_event(_event_id) THEN
    RETURN jsonb_build_object('status', 'denied');
  END IF;
  SELECT * INTO _profile FROM public.profiles WHERE student_code = upper(trim(_code));
  IF NOT FOUND THEN
    RETURN jsonb_build_object('status', 'unknown_code');
  END IF;
  IF _profile.account_type <> 'student' OR public.has_role(_profile.id, 'admin') THEN
    RETURN jsonb_build_object('status', 'not_student', 'name', _profile.full_name);
  END IF;
  SELECT * INTO _event FROM public.events WHERE id = _event_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('status', 'unknown_event');
  END IF;
  IF _profile.locked_event_id IS NOT NULL AND _profile.locked_event_id <> _event_id THEN
    SELECT title INTO _locked_title FROM public.events WHERE id = _profile.locked_event_id;
    RETURN jsonb_build_object('status', 'locked', 'name', _profile.full_name, 'roll', _profile.roll_number, 'event_title', _locked_title);
  END IF;
  INSERT INTO public.event_registrations (user_id, event_id)
  VALUES (_profile.id, _event_id)
  ON CONFLICT (user_id, event_id) DO NOTHING;
  UPDATE public.profiles SET locked_event_id = _event_id WHERE id = _profile.id;
  INSERT INTO public.attendance (user_id, event_id, credits, verified_by, verified_at)
  VALUES (_profile.id, _event_id, _event.credits, auth.uid(), now())
  ON CONFLICT (user_id, event_id) DO NOTHING
  RETURNING true INTO _inserted;
  IF _inserted THEN
    RETURN jsonb_build_object('status', 'ok', 'name', _profile.full_name, 'roll', _profile.roll_number, 'credits', _event.credits);
  ELSE
    RETURN jsonb_build_object('status', 'already', 'name', _profile.full_name, 'roll', _profile.roll_number, 'credits', _event.credits);
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.release_student(_event_id uuid, _user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.can_manage_event(_event_id) THEN
    RETURN jsonb_build_object('status', 'denied');
  END IF;
  UPDATE public.profiles SET locked_event_id = NULL
  WHERE id = _user_id AND locked_event_id = _event_id;
  IF FOUND THEN
    RETURN jsonb_build_object('status', 'released');
  END IF;
  RETURN jsonb_build_object('status', 'not_locked');
END;
$$;

CREATE FUNCTION public.event_roster(_event_id uuid, _search text DEFAULT ''::text, _page integer DEFAULT 1)
RETURNS TABLE(registration_id uuid, user_id uuid, roll_number text, full_name text, department text, secret_code text, registered_at timestamptz, present boolean, credits integer, locked_here boolean, locked_elsewhere text, total_count bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.can_manage_event(_event_id) THEN
    RETURN;
  END IF;
  RETURN QUERY
  WITH students AS (
    SELECT p.id, p.roll_number, p.full_name, p.department, p.student_code, p.locked_event_id
    FROM public.profiles p
    WHERE p.account_type = 'student'
      AND NOT public.has_role(p.id, 'admin')
      AND (_search = '' OR p.full_name ILIKE '%' || _search || '%' OR p.roll_number ILIKE '%' || _search || '%' OR p.student_code ILIKE '%' || _search || '%')
  ), counted AS (
    SELECT count(*) AS c FROM students
  )
  SELECT
    r.id AS registration_id,
    s.id AS user_id,
    s.roll_number,
    s.full_name,
    s.department,
    s.student_code AS secret_code,
    r.created_at AS registered_at,
    (a.id IS NOT NULL) AS present,
    COALESCE(a.credits, 0) AS credits,
    (s.locked_event_id = _event_id) AS locked_here,
    CASE WHEN s.locked_event_id IS NOT NULL AND s.locked_event_id <> _event_id THEN (SELECT title FROM public.events e WHERE e.id = s.locked_event_id) ELSE NULL END AS locked_elsewhere,
    counted.c AS total_count
  FROM students s
  CROSS JOIN counted
  LEFT JOIN public.event_registrations r ON r.user_id = s.id AND r.event_id = _event_id
  LEFT JOIN public.attendance a ON a.user_id = s.id AND a.event_id = _event_id
  ORDER BY (a.id IS NOT NULL) DESC, s.full_name
  LIMIT 50 OFFSET (GREATEST(_page, 1) - 1) * 50;
END;
$$;

REVOKE ALL ON FUNCTION public.mark_attendance_by_code(uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.release_student(uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.event_roster(uuid, text, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.mark_attendance_by_code(uuid, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.release_student(uuid, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.event_roster(uuid, text, integer) TO authenticated, service_role;