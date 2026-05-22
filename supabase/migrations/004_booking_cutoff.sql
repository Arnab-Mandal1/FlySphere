-- prevent bookings within 1 hour of departure
create or replace function public.enforce_booking_cutoff()
returns trigger
language plpgsql
as $$
declare
v_flight public.flights;
begin
select * into v_flight from public.flights where id = NEW.flight_id;

if v_flight.departs_at - now() < interval '1 hour' then
    raise exception 'BOOKING_CUTOFF: Bookings close 1 hour before departure';
end if;

return NEW;
end;
$$;

create trigger trg_enforce_booking_cutoff
    before insert on public.bookings
    for each row
    execute function public.enforce_booking_cutoff();