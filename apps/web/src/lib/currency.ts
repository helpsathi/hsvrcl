export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Ensures strict two-decimal banking precision without floating point inaccuracies.
 */
export function roundINR(amount: number): number {
  return Math.round((Number(amount) + Number.EPSILON) * 100) / 100;
}

/**
 * Convert INR currency amounts directly to integer paise for payment gateways.
 */
export function toPaise(inrAmount: number): number {
  return Math.round(Number(inrAmount) * 100);
}

/**
 * Convert integer paise back to INR decimal representation.
 */
export function fromPaise(paiseAmount: number): number {
  return Math.round(Number(paiseAmount)) / 100;
}

