-- migration: row level security policies

alter table public.flights     enable row level security;
alter table public.seats       enable row level security;
alter table public.bookings    enable row level security;
alter table public.passengers  enable row level security;
alter table public.reschedules enable row level security;

-- flights: anyone can search flights
create policy "flights_select_public"
  on public.flights for select
  using (true);

-- seats: anyone can view seat availability
create policy "seats_select_public"
  on public.seats for select
  using (true);

-- bookings: users see and manage only their own
create policy "bookings_select_own"
  on public.bookings for select
  using (auth.uid() = user_id);

create policy "bookings_insert_own"
  on public.bookings for insert
  with check (auth.uid() = user_id);

create policy "bookings_update_own"
  on public.bookings for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- passengers: access via booking ownership
create policy "passengers_select_own"
  on public.passengers for select
  using (
    exists (
      select 1 from public.bookings b
      where b.id = booking_id and b.user_id = auth.uid()
    )
  );

create policy "passengers_insert_own"
  on public.passengers for insert
  with check (
    exists (
      select 1 from public.bookings b
      where b.id = booking_id and b.user_id = auth.uid()
    )
  );

-- reschedules: access via booking ownership
create policy "reschedules_select_own"
  on public.reschedules for select
  using (
    exists (
      select 1 from public.bookings b
      where b.id = booking_id and b.user_id = auth.uid()
    )
  );

create policy "reschedules_insert_own"
  on public.reschedules for insert
  with check (
    exists (
      select 1 from public.bookings b
      where b.id = booking_id and b.user_id = auth.uid()
    )
  );
