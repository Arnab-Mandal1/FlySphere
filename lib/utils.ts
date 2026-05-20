import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatDuration(departsAt: string, arrivesAt: string): string {
  const diff = new Date(arrivesAt).getTime() - new Date(departsAt).getTime()
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  return `${hours}h ${minutes}m`
}

export function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
}

export function generatePNR(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  return Array.from({ length: 8 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join('')
}

export const AIRPORTS: Record<string, string> = {
  DEL: 'Indira Gandhi International Airport, New Delhi',
  BOM: 'Chhatrapati Shivaji Maharaj International Airport, Mumbai',
  BLR: 'Kempegowda International Airport, Bengaluru',
  HYD: 'Rajiv Gandhi International Airport, Hyderabad',
  MAA: 'Chennai International Airport, Chennai',
  CCU: 'Netaji Subhas Chandra Bose International Airport, Kolkata',
}

export const AIRPORT_CODES = Object.keys(AIRPORTS)
