ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS account_type text NOT NULL DEFAULT 'student' CHECK (account_type IN ('student','organiser'));
UPDATE public.profiles p SET account_type = 'organiser' FROM auth.users u WHERE u.id = p.id AND u.raw_user_meta_data->>'account_type' = 'organiser';
UPDATE public.profiles p SET account_type = 'organiser' FROM public.event_organisers o WHERE o.user_id = p.id;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
begin
 insert into public.profiles(id, roll_number, full_name, department, account_type) values (new.id, upper(coalesce(new.raw_user_meta_data->>'roll_number', split_part(new.email,'@',1))), coalesce(new.raw_user_meta_data->>'full_name','Student'), new.raw_user_meta_data->>'department',
   case when new.raw_user_meta_data->>'account_type' = 'organiser' then 'organiser' else 'student' end);
 insert into public.user_roles(user_id, role) values (new.id,'user');
 return new;
end $function$;

CREATE OR REPLACE FUNCTION public.enforce_single_admin()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
begin
 if new.role = 'admin' and exists (select 1 from public.user_roles where role = 'admin' and user_id <> new.user_id) then
   raise exception 'Only one admin account is allowed';
 end if;
 return new;
end $function$;
DROP TRIGGER IF EXISTS single_admin_guard ON public.user_roles;
CREATE TRIGGER single_admin_guard BEFORE INSERT OR UPDATE ON public.user_roles FOR EACH ROW EXECUTE FUNCTION public.enforce_single_admin();