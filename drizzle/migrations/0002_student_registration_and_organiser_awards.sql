CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
begin
 insert into public.profiles(id, roll_number, full_name, department) values (new.id, upper(coalesce(new.raw_user_meta_data->>'roll_number', split_part(new.email,'@',1))), coalesce(new.raw_user_meta_data->>'full_name','Student'), new.raw_user_meta_data->>'department');
 insert into public.user_roles(user_id, role) values (new.id,'user');
 return new;
end $$;
CREATE TABLE public.event_registrations (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
 event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE, ticket_token uuid NOT NULL UNIQUE DEFAULT gen_random_uuid(),
 created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(user_id,event_id)
);
GRANT SELECT ON public.event_registrations TO authenticated;
GRANT ALL ON public.event_registrations TO service_role;
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY registrations_read ON public.event_registrations FOR SELECT TO authenticated USING (user_id=auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE INDEX event_registrations_event_idx ON public.event_registrations(event_id);
CREATE TABLE public.event_awards (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
 event_id uuid REFERENCES public.events(id) ON DELETE SET NULL, category public.event_category NOT NULL,
 place integer NOT NULL CHECK (place IN (1,2)), amount integer NOT NULL CHECK (amount>=0),
 credits integer NOT NULL DEFAULT 0 CHECK (credits BETWEEN 0 AND 10000), organiser_id uuid NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(category,place), UNIQUE(category,user_id),
 CONSTRAINT award_amount_matches_pool CHECK (amount = CASE WHEN category='tech' THEN CASE WHEN place=1 THEN 800 ELSE 700 END ELSE CASE WHEN place=1 THEN 600 ELSE 400 END END)
);
GRANT SELECT ON public.event_awards TO authenticated;
GRANT ALL ON public.event_awards TO service_role;
ALTER TABLE public.event_awards ENABLE ROW LEVEL SECURITY;
CREATE POLICY awards_read ON public.event_awards FOR SELECT TO authenticated USING (user_id=auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE INDEX event_awards_user_idx ON public.event_awards(user_id);
CREATE INDEX attendance_user_idx ON public.attendance(user_id);
CREATE INDEX user_roles_user_idx ON public.user_roles(user_id);
CREATE OR REPLACE FUNCTION public.register_for_event(_event_id uuid) RETURNS public.event_registrations LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
declare result public.event_registrations;
begin
 if auth.uid() IS NULL then raise exception 'Sign in to register'; end if;
 if NOT EXISTS(select 1 from public.events where id=_event_id) then raise exception 'Event not found'; end if;
 insert into public.event_registrations(user_id,event_id) values(auth.uid(),_event_id) ON CONFLICT(user_id,event_id) DO NOTHING;
 select * into result from public.event_registrations where user_id=auth.uid() and event_id=_event_id;
 return result;
end $$;
REVOKE ALL ON FUNCTION public.register_for_event(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.register_for_event(uuid) TO authenticated;
CREATE OR REPLACE FUNCTION public.record_event_winner(_event_id uuid,_user_id uuid,_place integer,_credits integer) RETURNS public.event_awards LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
declare ev public.events; result public.event_awards; prize integer;
begin
 if auth.uid() IS NULL OR NOT public.has_role(auth.uid(),'admin') then raise exception 'Organisers only'; end if;
 if _place NOT IN (1,2) OR _place IS NULL OR _credits IS NULL OR _credits<0 OR _credits>10000 then raise exception 'Invalid rank or credits'; end if;
 select * into ev from public.events where id=_event_id;
 if NOT FOUND then raise exception 'Event not found'; end if;
 if NOT EXISTS(select 1 from public.event_registrations where event_id=_event_id and user_id=_user_id) AND NOT EXISTS(select 1 from public.attendance where event_id=_event_id and user_id=_user_id) then raise exception 'Student must be registered or checked in for this event'; end if;
 prize:=CASE WHEN ev.category='tech' THEN CASE WHEN _place=1 THEN 800 ELSE 700 END ELSE CASE WHEN _place=1 THEN 600 ELSE 400 END END;
 insert into public.event_awards(user_id,event_id,category,place,amount,credits,organiser_id) values(_user_id,_event_id,ev.category,_place,prize,_credits,auth.uid())
 ON CONFLICT(category,place) DO UPDATE SET user_id=excluded.user_id,event_id=excluded.event_id,amount=excluded.amount,credits=excluded.credits,organiser_id=excluded.organiser_id,updated_at=now()
 returning * into result;
 return result;
end $$;
REVOKE ALL ON FUNCTION public.record_event_winner(uuid,uuid,integer,integer) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.record_event_winner(uuid,uuid,integer,integer) TO authenticated;
CREATE OR REPLACE FUNCTION public.remove_event_winner(_award_id uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
begin
 if auth.uid() IS NULL OR NOT public.has_role(auth.uid(),'admin') then raise exception 'Organisers only'; end if;
 delete from public.event_awards where id=_award_id;
end $$;
REVOKE ALL ON FUNCTION public.remove_event_winner(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.remove_event_winner(uuid) TO authenticated;
CREATE OR REPLACE FUNCTION public.get_leaderboard() RETURNS TABLE(user_id uuid,roll_number text,full_name text,department text,total integer,tech integer,non_tech integer,events_count integer) LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 with points as (
 select a.user_id,a.credits,e.category,1 as attended from public.attendance a join public.events e on e.id=a.event_id
 UNION ALL select w.user_id,w.credits,w.category,0 from public.event_awards w
 )
 select p.id,p.roll_number,p.full_name,p.department,coalesce(sum(x.credits),0)::integer,
 coalesce(sum(x.credits) filter(where x.category='tech'),0)::integer,
 coalesce(sum(x.credits) filter(where x.category='non_tech'),0)::integer,coalesce(sum(x.attended),0)::integer
 from public.profiles p left join points x on x.user_id=p.id group by p.id order by 5 desc,p.full_name
$$;
CREATE OR REPLACE FUNCTION public.check_registration_ticket(_token uuid) RETURNS TABLE(roll_number text,full_name text,event_title text,registered_at timestamptz) LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
begin
 if auth.uid() IS NULL OR NOT public.has_role(auth.uid(),'admin') then raise exception 'Organisers only'; end if;
 return query select p.roll_number,p.full_name,e.title,r.created_at from public.event_registrations r join public.profiles p on p.id=r.user_id join public.events e on e.id=r.event_id where r.ticket_token=_token;
end $$;
REVOKE ALL ON FUNCTION public.check_registration_ticket(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.check_registration_ticket(uuid) TO authenticated;