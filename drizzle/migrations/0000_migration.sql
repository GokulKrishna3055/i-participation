
create type public.app_role as enum ('admin','user');
create type public.event_category as enum ('tech','non_tech');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  roll_number text not null unique,
  full_name text not null,
  department text,
  created_at timestamptz not null default now()
);
grant select, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  unique(user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id=_user_id and role=_role)
$$;

create policy "own or admin read profiles" on public.profiles for select to authenticated
  using (id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "own update profile" on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());
create policy "read own roles or admin" on public.user_roles for select to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles(id, roll_number, full_name, department)
  values (new.id, upper(coalesce(new.raw_user_meta_data->>'roll_number', split_part(new.email,'@',1))),
          coalesce(new.raw_user_meta_data->>'full_name','Student'),
          new.raw_user_meta_data->>'department');
  insert into public.user_roles(user_id, role) values (new.id,'user');
  if not exists (select 1 from public.user_roles where role='admin') then
    insert into public.user_roles(user_id, role) values (new.id,'admin');
  end if;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

create table public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  venue text not null,
  starts_at timestamptz not null,
  ends_at timestamptz,
  category event_category not null default 'tech',
  credits int not null default 10,
  created_at timestamptz not null default now()
);
grant select on public.events to anon, authenticated;
grant insert, update, delete on public.events to authenticated;
grant all on public.events to service_role;
alter table public.events enable row level security;
create policy "events public read" on public.events for select to anon, authenticated using (true);
create policy "admin write events" on public.events for all to authenticated
  using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create table public.event_qr (
  event_id uuid primary key references public.events(id) on delete cascade,
  token uuid not null default gen_random_uuid() unique,
  active boolean not null default true,
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.event_qr to authenticated;
grant all on public.event_qr to service_role;
alter table public.event_qr enable row level security;
create policy "admin qr" on public.event_qr for all to authenticated
  using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create table public.attendance (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  event_id uuid not null references public.events(id) on delete cascade,
  credits int not null,
  created_at timestamptz not null default now(),
  unique(user_id, event_id)
);
grant select, delete on public.attendance to authenticated;
grant all on public.attendance to service_role;
alter table public.attendance enable row level security;
create policy "own or admin attendance" on public.attendance for select to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "admin delete attendance" on public.attendance for delete to authenticated
  using (public.has_role(auth.uid(),'admin'));

create or replace function public.claim_event_credit(_token uuid)
returns json language plpgsql security definer set search_path = public as $$
declare ev public.events; q public.event_qr; inserted int;
begin
  if auth.uid() is null then return json_build_object('status','unauthenticated'); end if;
  select * into q from public.event_qr where token=_token;
  if not found or not q.active then return json_build_object('status','invalid'); end if;
  select * into ev from public.events where id=q.event_id;
  insert into public.attendance(user_id,event_id,credits) values (auth.uid(), ev.id, ev.credits)
    on conflict (user_id,event_id) do nothing;
  get diagnostics inserted = row_count;
  if inserted = 0 then
    return json_build_object('status','already','event',ev.title,'credits',ev.credits);
  end if;
  return json_build_object('status','ok','event',ev.title,'credits',ev.credits);
end $$;
grant execute on function public.claim_event_credit(uuid) to authenticated;

create or replace function public.get_leaderboard()
returns table(user_id uuid, roll_number text, full_name text, department text, total int, tech int, non_tech int, events_count int)
language sql stable security definer set search_path = public as $$
  select p.id, p.roll_number, p.full_name, p.department,
    coalesce(sum(a.credits),0)::int,
    coalesce(sum(a.credits) filter (where e.category='tech'),0)::int,
    coalesce(sum(a.credits) filter (where e.category='non_tech'),0)::int,
    count(a.id)::int
  from public.profiles p
  left join public.attendance a on a.user_id=p.id
  left join public.events e on e.id=a.event_id
  group by p.id
  order by 5 desc, p.full_name
$$;
grant execute on function public.get_leaderboard() to anon, authenticated;

-- Tiebreaker quiz
create table public.quiz_questions (
  id uuid primary key default gen_random_uuid(),
  position int not null,
  question text not null,
  options jsonb not null,
  correct_index int not null
);
grant select (id, position, question, options) on public.quiz_questions to authenticated;
grant all on public.quiz_questions to service_role;
alter table public.quiz_questions enable row level security;
create policy "read questions" on public.quiz_questions for select to authenticated using (true);

create table public.quiz_sessions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category event_category not null,
  status text not null default 'live' check (status in ('live','closed')),
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.quiz_sessions to authenticated;
grant all on public.quiz_sessions to service_role;
alter table public.quiz_sessions enable row level security;

create table public.quiz_participants (
  session_id uuid not null references public.quiz_sessions(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  answers jsonb,
  score int,
  submitted_at timestamptz,
  rank int,
  prize text,
  primary key(session_id, user_id)
);
grant select, insert, delete on public.quiz_participants to authenticated;
grant all on public.quiz_participants to service_role;
alter table public.quiz_participants enable row level security;

create policy "sessions visible" on public.quiz_sessions for select to authenticated
  using (public.has_role(auth.uid(),'admin') or exists (select 1 from public.quiz_participants qp where qp.session_id=id and qp.user_id=auth.uid()));
create policy "admin sessions" on public.quiz_sessions for all to authenticated
  using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create policy "participants visible" on public.quiz_participants for select to authenticated
  using (user_id=auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "admin participants" on public.quiz_participants for all to authenticated
  using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create or replace function public.submit_quiz(_session_id uuid, _answers jsonb)
returns json language plpgsql security definer set search_path = public as $$
declare s public.quiz_sessions; qp public.quiz_participants; sc int := 0; r record;
begin
  select * into s from public.quiz_sessions where id=_session_id;
  if not found or s.status <> 'live' then return json_build_object('status','closed'); end if;
  select * into qp from public.quiz_participants where session_id=_session_id and user_id=auth.uid();
  if not found then return json_build_object('status','not_participant'); end if;
  if qp.submitted_at is not null then return json_build_object('status','already','score',qp.score); end if;
  for r in select id, correct_index from public.quiz_questions loop
    if (_answers->>(r.id::text))::int = r.correct_index then sc := sc + 1; end if;
  end loop;
  update public.quiz_participants set answers=_answers, score=sc, submitted_at=now()
    where session_id=_session_id and user_id=auth.uid();
  return json_build_object('status','ok','score',sc);
end $$;
grant execute on function public.submit_quiz(uuid, jsonb) to authenticated;

create or replace function public.finalize_quiz(_session_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare s public.quiz_sessions; first_p text; second_p text;
begin
  if not public.has_role(auth.uid(),'admin') then raise exception 'forbidden'; end if;
  select * into s from public.quiz_sessions where id=_session_id;
  if s.category='tech' then first_p:='₹800 + Pumpkin King trophy'; second_p:='₹700 + Phantom Coder medal';
  else first_p:='₹600 + Pumpkin King trophy'; second_p:='₹400 + Phantom medal'; end if;
  with ranked as (
    select user_id, row_number() over (order by score desc nulls last, submitted_at asc nulls last) rn
    from public.quiz_participants where session_id=_session_id
  )
  update public.quiz_participants qp set rank=ranked.rn,
    prize = case when ranked.rn=1 then first_p when ranked.rn=2 then second_p
                 when ranked.rn=3 then 'Spooky goodie hamper + certificate'
                 else 'Certificate of Survival' end
  from ranked where qp.session_id=_session_id and qp.user_id=ranked.user_id;
  update public.quiz_sessions set status='closed' where id=_session_id;
end $$;
grant execute on function public.finalize_quiz(uuid) to authenticated;

-- results visible to participants: names of co-participants
create or replace function public.get_quiz_results(_session_id uuid)
returns table(roll_number text, full_name text, score int, rank int, prize text, submitted_at timestamptz)
language sql stable security definer set search_path = public as $$
  select p.roll_number, p.full_name, qp.score, qp.rank, qp.prize, qp.submitted_at
  from public.quiz_participants qp join public.profiles p on p.id=qp.user_id
  where qp.session_id=_session_id
    and (public.has_role(auth.uid(),'admin') or exists (select 1 from public.quiz_participants x where x.session_id=_session_id and x.user_id=auth.uid()))
  order by qp.rank nulls last, qp.score desc nulls last
$$;
grant execute on function public.get_quiz_results(uuid) to authenticated;

insert into public.events (title, description, venue, starts_at, ends_at, category, credits) values
('Code from the Crypt', 'A haunted competitive coding round. Solve cursed problems before the clock strikes midnight.', 'CS Lab 1, Main Block', '2026-10-31 09:30+05:30', '2026-10-31 11:30+05:30', 'tech', 20),
('Debug the Dead', 'Resurrect broken programs riddled with ghostly bugs. Fastest exorcist wins.', 'CS Lab 2, Main Block', '2026-10-31 11:45+05:30', '2026-10-31 13:00+05:30', 'tech', 15),
('Phantom Paper Presentation', 'Present your research ideas to a panel of spectral judges.', 'Seminar Hall A', '2026-10-31 14:00+05:30', '2026-10-31 16:00+05:30', 'tech', 15),
('Haunted Treasure Hunt', 'Follow eerie clues across campus to find the cursed pumpkin.', 'Campus Grounds (start: Main Gate)', '2026-10-31 10:00+05:30', '2026-10-31 12:00+05:30', 'non_tech', 15),
('Spooky Connexions', 'Connect the haunted pictures to guess the hidden word.', 'Seminar Hall B', '2026-10-31 13:30+05:30', '2026-10-31 14:30+05:30', 'non_tech', 10),
('Graveyard Gaming', 'Survive the night in a multiplayer gaming showdown.', 'Gaming Arena, Block C', '2026-10-31 15:00+05:30', '2026-10-31 17:00+05:30', 'non_tech', 10);
insert into public.event_qr(event_id) select id from public.events;

create or replace function public.add_event_qr() returns trigger language plpgsql security definer set search_path=public as $$
begin insert into public.event_qr(event_id) values (new.id); return new; end $$;
create trigger events_add_qr after insert on public.events for each row execute function public.add_event_qr();

insert into public.quiz_questions(position, question, options, correct_index) values
(1,'int i = 5; int j = i++; What is j?','["5","6","4","Undefined"]',0),
(2,'int i = 5; int j = ++i; What is j?','["5","6","7","4"]',1),
(3,'int i = 1; i = i++ + ++i; In Java, what is i?','["3","4","2","5"]',1),
(4,'int a = 10; printf("%d", a++ * 2); prints?','["22","20","21","11"]',1),
(5,'int x = 3; int y = x++ + x++; In Java, y = ?','["6","7","8","9"]',1),
(6,'for(int i=0;i<5;i++); After the loop (C, i declared outside), i = ?','["4","5","6","0"]',1),
(7,'int i = 0; while(i++ < 3); final i = ?','["3","4","2","5"]',1),
(8,'int i = 10; int j = i-- - --i; In Java, j = ?','["0","1","2","-2"]',2),
(9,'Which is generally preferred for iterators in C++ for efficiency?','["i++","++i","i+=1","No difference ever"]',1),
(10,'int i = 2; int k = ++i * i++; In Java, k = ?','["6","9","12","8"]',1);
