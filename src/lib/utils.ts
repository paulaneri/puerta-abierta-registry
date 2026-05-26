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

/**
 * Convierte una fecha 'YYYY-MM-DD' (o ISO) en un Date local sin desfase de zona horaria.
 */
export function parseLocalDate(date: string | Date): Date {
  if (date instanceof Date) return date;
  const [y, m, d] = date.split('T')[0].split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

/**
 * Calcula la edad en años a partir de una fecha de nacimiento (YYYY-MM-DD o ISO).
 * Usa parseLocalDate para evitar desfases por zona horaria.
 */
export function calcularEdad(fechaNacimiento?: string | null): number | null {
  if (!fechaNacimiento) return null;
  try {
    const nac = parseLocalDate(fechaNacimiento);
    const hoy = new Date();
    let edad = hoy.getFullYear() - nac.getFullYear();
    const m = hoy.getMonth() - nac.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--;
    return edad >= 0 ? edad : null;
  } catch {
    return null;
  }
}

