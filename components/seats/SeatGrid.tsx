'use client'

import { useMemo } from 'react'
import { cn } from '@/lib/utils'
import type { Seat, SeatClass } from '@/types'

interface SeatGridProps {
  readonly seats: Seat[]
  readonly selectedSeatId: string | null
  readonly onSeatSelect: (seat: Seat) => void
  readonly flightClass?: SeatClass
}

interface ClassZone {
  label: string
  seatClass: SeatClass
  rowStart: number
  rowEnd: number
  leftCols: string[]
  rightCols: string[]
}

const CLASS_ZONES: ClassZone[] = [
  { label: 'First Class',    seatClass: 'first',    rowStart: 1,  rowEnd: 2,  leftCols: ['A'],          rightCols: ['B'] },
  { label: 'Business Class', seatClass: 'business', rowStart: 3,  rowEnd: 6,  leftCols: ['A'],          rightCols: ['B'] },
  { label: 'Economy Class',  seatClass: 'economy',  rowStart: 7,  rowEnd: 26, leftCols: ['A', 'B', 'C'], rightCols: ['D', 'E', 'F'] },
]

const CLASS_HEADER_STYLE: Record<SeatClass, string> = {
  first:    'text-purple-600 bg-purple-50 border-purple-200',
  business: 'text-amber-600 bg-amber-50 border-amber-200',
  economy:  'text-sky-600 bg-sky-50 border-sky-200',
}

function getSeatStyle(seat: Seat | undefined, selectedSeatId: string | null): string {
  if (!seat) return 'bg-slate-100 cursor-not-allowed opacity-30'

  if (seat.id === selectedSeatId) {
    return 'bg-green-500 text-white ring-2 ring-green-600 ring-offset-1 cursor-pointer'
  }

  if (!seat.is_available) {
    return 'bg-slate-300 text-slate-400 cursor-not-allowed'
  }

  const availableStyles: Record<SeatClass, string> = {
    first:    'bg-purple-500 hover:bg-purple-600 text-white cursor-pointer',
    business: 'bg-amber-400 hover:bg-amber-500 text-white cursor-pointer',
    economy:  'bg-sky-400 hover:bg-sky-500 text-white cursor-pointer',
  }

  return availableStyles[seat.class]
}

function getSeatTitle(seat: Seat | undefined, seatNo: string): string {
  if (!seat) return seatNo
  const fee = seat.extra_fee > 0 ? ` (+₹${seat.extra_fee})` : ''
  const status = seat.is_available ? '' : ' — Occupied'
  return `${seatNo} — ${seat.class}${fee}${status}`
}

function SeatButton({
  seatNo,
  seat,
  selectedSeatId,
  col,
  onSeatSelect,
}: {
  readonly seatNo: string
  readonly seat: Seat | undefined
  readonly selectedSeatId: string | null
  readonly col: string
  readonly onSeatSelect: (seat: Seat) => void
}) {
  const isDisabled = !(seat?.is_available)
  const label = seat?.is_available === false ? '✕' : col

  const handleClick = () => {
    if (seat) onSeatSelect(seat)
  }

  return (
    <button
      onClick={handleClick}
      disabled={isDisabled}
      title={getSeatTitle(seat, seatNo)}
      className={cn(
        'w-8 h-8 rounded-md text-xs font-semibold transition-all',
        getSeatStyle(seat, selectedSeatId)
      )}
    >
      {label}
    </button>
  )
}

function SeatRow({
  row,
  leftCols,
  rightCols,
  seatMap,
  selectedSeatId,
  onSeatSelect,
}: {
  readonly row: number
  readonly leftCols: string[]
  readonly rightCols: string[]
  readonly seatMap: Record<string, Seat>
  readonly selectedSeatId: string | null
  readonly onSeatSelect: (seat: Seat) => void
}) {
  return (
    <div className="flex items-center justify-center gap-1 mb-1">
      <div className="w-7 text-center text-xs text-slate-400 font-medium">{row}</div>
      <div className="flex gap-1">
        {leftCols.map((col) => {
          const seatNo = `${row}${col}`
          return (
            <SeatButton
              key={seatNo}
              seatNo={seatNo}
              seat={seatMap[seatNo]}
              selectedSeatId={selectedSeatId}
              col={col}
              onSeatSelect={onSeatSelect}
            />
          )
        })}
      </div>
      <div className="w-6 text-center text-xs text-slate-200">|</div>
      <div className="flex gap-1">
        {rightCols.map((col) => {
          const seatNo = `${row}${col}`
          return (
            <SeatButton
              key={seatNo}
              seatNo={seatNo}
              seat={seatMap[seatNo]}
              selectedSeatId={selectedSeatId}
              col={col}
              onSeatSelect={onSeatSelect}
            />
          )
        })}
      </div>
    </div>
  )
}

function ClassSection({
  zone,
  seatMap,
  selectedSeatId,
  onSeatSelect,
}: {
  readonly zone: ClassZone
  readonly seatMap: Record<string, Seat>
  readonly selectedSeatId: string | null
  readonly onSeatSelect: (seat: Seat) => void
}) {
  const rows = Array.from(
    { length: zone.rowEnd - zone.rowStart + 1 },
    (_, i) => zone.rowStart + i
  )

  return (
    <div className="mb-6">
      <div className={cn(
        'text-xs font-semibold uppercase tracking-widest text-center py-1.5 rounded-lg border mb-3',
        CLASS_HEADER_STYLE[zone.seatClass]
      )}>
        {zone.label}
      </div>

      <div className="flex items-center justify-center gap-1 mb-1">
        <div className="w-7" />
        <div className="flex gap-1">
          {zone.leftCols.map((col) => (
            <div key={col} className="w-8 text-center text-xs font-medium text-slate-400">{col}</div>
          ))}
        </div>
        <div className="w-6" />
        <div className="flex gap-1">
          {zone.rightCols.map((col) => (
            <div key={col} className="w-8 text-center text-xs font-medium text-slate-400">{col}</div>
          ))}
        </div>
      </div>

      {rows.map((row) => (
        <SeatRow
          key={row}
          row={row}
          leftCols={zone.leftCols}
          rightCols={zone.rightCols}
          seatMap={seatMap}
          selectedSeatId={selectedSeatId}
          onSeatSelect={onSeatSelect}
        />
      ))}
    </div>
  )
}

export function SeatGrid({ seats, selectedSeatId, onSeatSelect }: SeatGridProps) {
  const seatMap = useMemo(() => {
    const map: Record<string, Seat> = {}
    seats.forEach((s) => { map[s.seat_number] = s })
    return map
  }, [seats])

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 overflow-y-auto max-h-[75vh] touch-pan-y">
      <div className="text-center mb-4">
        <div className="inline-block bg-slate-100 rounded-full px-4 py-1 text-xs text-slate-400 font-medium">
          ✈ Front of aircraft
        </div>
      </div>

      {CLASS_ZONES.map((zone) => (
        <ClassSection
          key={zone.seatClass}
          zone={zone}
          seatMap={seatMap}
          selectedSeatId={selectedSeatId}
          onSeatSelect={onSeatSelect}
        />
      ))}

      <div className="text-center mt-2">
        <div className="inline-block bg-slate-100 rounded-full px-4 py-1 text-xs text-slate-400 font-medium">
          Rear of aircraft
        </div>
      </div>
    </div>
  )
}
