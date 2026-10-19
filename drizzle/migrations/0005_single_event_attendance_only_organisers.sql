ALTER TABLE public.event_organisers ADD CONSTRAINT event_organisers_one_event_per_user UNIQUE (user_id);
CREATE OR REPLACE FUNCTION public.register_for_event(_event_id uuid)
RETURNS public.event_registrations LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE result public.event_registrations;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in to register'; END IF;
 IF public.is_event_organiser() OR public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Organisers manage attendance only and cannot register for events'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.events WHERE id=_event_id) THEN RAISE EXCEPTION 'Event not found'; END IF;
 INSERT INTO public.event_registrations(user_id,event_id) VALUES(auth.uid(),_event_id) ON CONFLICT(user_id,event_id) DO NOTHING;
 SELECT * INTO result FROM public.event_registrations WHERE user_id=auth.uid() AND event_id=_event_id;
 RETURN result;
END $$;
REVOKE ALL ON FUNCTION public.register_for_event(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.register_for_event(uuid) TO authenticated;