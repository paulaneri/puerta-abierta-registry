import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formatea un número al estilo hispánico: punto para miles, coma para decimales
 * Ejemplo: 2000 -> "2.000"
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('es-AR').format(num);
}

/**
 * Formatea un número como moneda al estilo argentino: punto para miles, coma para decimales
 * Ejemplo: 2000.23 -> "2.000,23"
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Formatea una fecha al formato argentino dd/mm/aaaa
 */
export function formatDate(date: Date | string): string {
  if (typeof date === 'string') {
    // Parse YYYY-MM-DD without UTC shift
    const [year, month, day] = date.split('T')[0].split('-').map(Number);
    return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
  }
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}
