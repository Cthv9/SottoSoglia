/**
 * Round amount UP to the nearest integer euro.
 * 12.10 → 13, 12.00 → 12, 0.01 → 1
 */
export function ceilToEuro(value: number): number {
  return Math.ceil(value);
}

/**
 * Parse a user-typed string into a number.
 * Accepts both comma and dot as decimal separator.
 */
export function parseAmount(raw: string): number {
  const normalized = raw.replace(',', '.');
  const parsed = parseFloat(normalized);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Format integer cents-as-euros for display: "13 €"
 */
export function formatAmount(amount: number): string {
  return `${amount} €`;
}

/**
 * Format a decimal number for display preserving decimals: "12.10 €"
 */
export function formatAmountDecimal(amount: number): string {
  return `${amount.toFixed(2).replace('.', ',')} €`;
}
