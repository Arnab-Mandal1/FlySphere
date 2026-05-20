-- seed data: flights, seats, test user
-- test account: test@flightapp.dev / TestPass123!

insert into public.flights
  (id, flight_no, origin, destination, departs_at, arrives_at, aircraft_type, status, base_price)
values
  -- DEL → BOM
  (
    '11111111-0000-0000-0000-000000000001',
    'FM101', 'DEL', 'BOM',
    now() + interval '2 days 6 hours',
    now() + interval '2 days 8 hours 30 minutes',
    'Boeing 737', 'scheduled', 4500.00
  ),
  (
    '11111111-0000-0000-0000-000000000002',
    'FM102', 'DEL', 'BOM',
    now() + interval '3 days 14 hours',
    now() + interval '3 days 16 hours 30 minutes',
    'Airbus A320', 'scheduled', 5200.00
  ),
  -- BOM → BLR
  (
    '22222222-0000-0000-0000-000000000001',
    'FM201', 'BOM', 'BLR',
    now() + interval '4 days 8 hours',
    now() + interval '4 days 9 hours 45 minutes',
    'Boeing 737', 'scheduled', 3800.00
  ),
  (
    '22222222-0000-0000-0000-000000000002',
    'FM202', 'BOM', 'BLR',
    now() + interval '5 days 17 hours',
    now() + interval '5 days 18 hours 45 minutes',
    'Airbus A321', 'scheduled', 4100.00
  ),
  -- BLR → HYD
  (
    '33333333-0000-0000-0000-000000000001',
    'FM301', 'BLR', 'HYD',
    now() + interval '6 days 7 hours',
    now() + interval '6 days 8 hours 10 minutes',
    'ATR 72', 'scheduled', 2900.00
  ),
  (
    '33333333-0000-0000-0000-000000000002',
    'FM302', 'BLR', 'HYD',
    now() + interval '7 days 15 hours',
    now() + interval '7 days 16 hours 10 minutes',
    'Boeing 737', 'scheduled', 3200.00
  ),
  -- HYD → DEL
  (
    '44444444-0000-0000-0000-000000000001',
    'FM401', 'HYD', 'DEL',
    now() + interval '8 days 9 hours',
    now() + interval '8 days 11 hours 30 minutes',
    'Airbus A320', 'scheduled', 5500.00
  ),
  (
    '44444444-0000-0000-0000-000000000002',
    'FM402', 'HYD', 'DEL',
    now() + interval '9 days 18 hours',
    now() + interval '9 days 20 hours 30 minutes',
    'Boeing 787', 'scheduled', 6800.00
  );

-- generate seats for each flight
-- first class: rows 1-2, cols A-B (4 seats)
-- business:    rows 3-6, cols A-B (8 seats)
-- economy:     rows 7-26, cols A-F (120 seats)
create or replace function generate_seats(p_flight_id uuid)
returns void language plpgsql as $$
declare
  v_row int;
  v_col text;
begin
  foreach v_col in array array['A','B'] loop
    for v_row in 1..2 loop
      insert into public.seats (flight_id, seat_number, class, is_available, extra_fee)
      values (p_flight_id, v_row::text || v_col, 'first', true, 3000.00)
      on conflict (flight_id, seat_number) do nothing;
    end loop;
  end loop;

  foreach v_col in array array['A','B'] loop
    for v_row in 3..6 loop
      insert into public.seats (flight_id, seat_number, class, is_available, extra_fee)
      values (p_flight_id, v_row::text || v_col, 'business', true, 1500.00)
      on conflict (flight_id, seat_number) do nothing;
    end loop;
  end loop;

  foreach v_col in array array['A','B','C','D','E','F'] loop
    for v_row in 7..26 loop
      insert into public.seats (flight_id, seat_number, class, is_available, extra_fee)
      values (p_flight_id, v_row::text || v_col, 'economy', true, 0.00)
      on conflict (flight_id, seat_number) do nothing;
    end loop;
  end loop;
end;
$$;

select generate_seats('11111111-0000-0000-0000-000000000001');
select generate_seats('11111111-0000-0000-0000-000000000002');
select generate_seats('22222222-0000-0000-0000-000000000001');
select generate_seats('22222222-0000-0000-0000-000000000002');
select generate_seats('33333333-0000-0000-0000-000000000001');
select generate_seats('33333333-0000-0000-0000-000000000002');
select generate_seats('44444444-0000-0000-0000-000000000001');
select generate_seats('44444444-0000-0000-0000-000000000002');

-- mark some seats as occupied for realism
update public.seats
   set is_available = false
 where flight_id in (
   '11111111-0000-0000-0000-000000000001',
   '22222222-0000-0000-0000-000000000001'
 )
   and seat_number in ('7A','7C','8B','9D','10E','11F','12A','15C');

drop function generate_seats(uuid);
