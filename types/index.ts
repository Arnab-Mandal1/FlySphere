export type FlightStatus = 'scheduled' | 'boarding' | 'departed' | 'arrived' | 'cancelled'
export type SeatClass = 'economy' | 'business' | 'first'
export type BookingStatus = 'confirmed' | 'rescheduled' | 'cancelled'

export interface Flight {
  id: string
  flight_no: string
  origin: string
  destination: string
  departs_at: string
  arrives_at: string
  aircraft_type: string
  status: FlightStatus
  base_price: number
  created_at: string
}

export interface Seat {
  id: string
  flight_id: string
  seat_number: string
  class: SeatClass
  is_available: boolean
  extra_fee: number
  created_at: string
}

export interface Booking {
  id: string
  user_id: string
  flight_id: string
  seat_id: string
  status: BookingStatus
  booked_at: string
  total_price: number
  pnr_code: string
  created_at: string
  flight?: Flight
  seat?: Seat
  passengers?: Passenger[]
}

export interface Passenger {
  id: string
  booking_id: string
  full_name: string
  passport_no: string
  nationality: string
  dob: string
  created_at: string
}

export interface Reschedule {
  id: string
  booking_id: string
  old_flight_id: string
  new_flight_id: string
  requested_at: string
  fee_charged: number
}

export interface FlightSearchQuery {
  origin: string
  destination: string
  date: string
  passengers: number
  class: SeatClass
}

export interface PassengerFormData {
  full_name: string
  passport_no: string
  nationality: string
  dob: string
}

export type BookingStep = 'search' | 'results' | 'seat' | 'passenger' | 'confirm'

export interface Database {
  public: {
    Tables: {
      flights:     { Row: Flight;    Insert: Omit<Flight, 'id' | 'created_at'>;    Update: Partial<Flight> }
      seats:       { Row: Seat;      Insert: Omit<Seat, 'id' | 'created_at'>;      Update: Partial<Seat> }
      bookings:    { Row: Booking;   Insert: Omit<Booking, 'id' | 'booked_at' | 'created_at'>; Update: Partial<Booking> }
      passengers:  { Row: Passenger; Insert: Omit<Passenger, 'id' | 'created_at'>; Update: Partial<Passenger> }
      reschedules: { Row: Reschedule; Insert: Omit<Reschedule, 'id'>;              Update: Partial<Reschedule> }
    }
    Functions: {
      reserve_seat:   { Args: { p_user_id: string; p_flight_id: string; p_seat_id: string; p_total_price: number; p_pnr_code: string }; Returns: Booking }
      cancel_booking: { Args: { p_booking_id: string; p_user_id: string }; Returns: void }
    }
  }
}
