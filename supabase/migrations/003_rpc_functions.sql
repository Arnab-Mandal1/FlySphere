-- migration: rpc functions and cancellation trigger

-- reserve_seat: atomically locks a seat and creates a booking.
-- uses FOR UPDATE to prevent double-booking race conditions.
-- security definer so the seat update bypasses RLS
create or replace function public.reserve_seat(
  p_user_id     uuid,
  p_flight_id   uuid,
  p_seat_id     uuid,
  p_total_price numeric,
  p_pnr_code    text
)
returns public.bookings
language plpgsql
security definer
set search_path = public
as $$
declare
  v_booking public.bookings;
begin
  perform 1
    from public.seats
   where id = p_seat_id
     and flight_id = p_flight_id
     and is_available = true
   for update;

  if not found then
    raise exception 'SEAT_UNAVAILABLE: Seat is no longer available';
  end if;

  update public.seats
     set is_available = false
   where id = p_seat_id;

  insert into public.bookings (user_id, flight_id, seat_id, total_price, pnr_code)
  values (p_user_id, p_flight_id, p_seat_id, p_total_price, p_pnr_code)
  returning * into v_booking;

  return v_booking;
end;
$$;

-- cancel_booking: atomically cancels a booking and frees the seat.
create or replace function public.cancel_booking(
  p_booking_id uuid,
  p_user_id    uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_booking public.bookings;
  v_flight  public.flights;
begin
  select * into v_booking
    from public.bookings
   where id = p_booking_id and user_id = p_user_id
   for update;

  if not found then
    raise exception 'BOOKING_NOT_FOUND: Booking not found';
  end if;

  if v_booking.status = 'cancelled' then
    raise exception 'ALREADY_CANCELLED: Booking is already cancelled';
  end if;

  select * into v_flight
    from public.flights
   where id = v_booking.flight_id;

  if v_flight.departs_at - now() < interval '2 hours' then
    raise exception 'CANCELLATION_WINDOW: Cannot cancel within 2 hours of departure';
  end if;

  update public.seats set is_available = true where id = v_booking.seat_id;
  update public.bookings set status = 'cancelled' where id = p_booking_id;
end;
$$;

-- db-level trigger enforcing the 2-hour cancellation rule
create or replace function public.enforce_cancellation_window()
returns trigger
language plpgsql
as $$
declare
  v_flight public.flights;
begin
  if NEW.status = 'cancelled' and OLD.status <> 'cancelled' then
    select * into v_flight from public.flights where id = NEW.flight_id;
    if v_flight.departs_at - now() < interval '2 hours' then
      raise exception 'CANCELLATION_WINDOW: Cancellations within 2 hours of departure are not allowed';
    end if;
  end if;
  return NEW;
end;
$$;

create trigger trg_enforce_cancellation_window
  before update on public.bookings
  for each row
  execute function public.enforce_cancellation_window();

grant execute on function public.reserve_seat   to authenticated;
grant execute on function public.cancel_booking to authenticated;
