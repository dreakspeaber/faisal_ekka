/**
 * Payment and discount utilities (Phase 1 - Core Payment Features).
 * Used by SalesPoint and tested in paymentUtils.test.js.
 */

/**
 * Compute payment status for a sale from payment history.
 * @param {number} saleId
 * @param {number} finalAmount
 * @param {Array<{ saleId: number, amount: number }>} paymentHistory
 * @returns {{ status: 'Paid'|'Partial'|'Pending', amountPaid: number, amountPending: number }}
 */
export function calculatePaymentStatus(saleId, finalAmount, paymentHistory) {
  const amountPaid = (paymentHistory || [])
    .filter(p => p.saleId === saleId)
    .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
  if (amountPaid >= finalAmount) return { status: 'Paid', amountPaid, amountPending: 0 };
  if (amountPaid > 0) return { status: 'Partial', amountPaid, amountPending: finalAmount - amountPaid };
  return { status: 'Pending', amountPaid: 0, amountPending: finalAmount };
}

/**
 * Compute discount amount from original amount and discount percent (0-100).
 * @param {number} originalAmount
 * @param {number} discountPercent
 * @returns {number}
 */
export function discountAmountFromPercent(originalAmount, discountPercent) {
  const pct = Math.max(0, Math.min(100, parseFloat(discountPercent) || 0));
  return (originalAmount * pct) / 100;
}

/**
 * Compute discount percent from original amount and discount amount.
 * @param {number} originalAmount
 * @param {number} discountAmount
 * @returns {number}
 */
export function discountPercentFromAmount(originalAmount, discountAmount) {
  const orig = parseFloat(originalAmount) || 0;
  const amt = parseFloat(discountAmount) || 0;
  if (orig <= 0) return 0;
  return Math.max(0, Math.min(100, (amt / orig) * 100));
}

/**
 * Validate discount: percent 0-100, amount <= original.
 * @param {number} originalAmount
 * @param {number} discountAmount
 * @param {number} discountPercent
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateDiscount(originalAmount, discountAmount, discountPercent) {
  const orig = parseFloat(originalAmount) || 0;
  const amt = parseFloat(discountAmount) || 0;
  const pct = parseFloat(discountPercent) || 0;
  if (pct < 0 || pct > 100) return { valid: false, error: 'Discount % must be 0-100' };
  if (amt < 0) return { valid: false, error: 'Discount amount cannot be negative' };
  if (amt > orig) return { valid: false, error: 'Discount amount cannot exceed original amount' };
  return { valid: true };
}

/**
 * Compute sale amounts: original, discount, final.
 * @param {number} weight
 * @param {number} pricePerKg
 * @param {{ discountPercent?: number, discountAmount?: number }} options
 * @returns {{ originalAmount: number, discountAmount: number, discountPercent: number, finalAmount: number }}
 */
export function computeSaleAmounts(weight, pricePerKg, { discountPercent = 0, discountAmount = 0 } = {}) {
  const originalAmount = parseFloat(weight) * parseFloat(pricePerKg);
  let discount = parseFloat(discountAmount) || 0;
  const pct = parseFloat(discountPercent) || 0;
  if (pct > 0 && discount <= 0) discount = (originalAmount * pct) / 100;
  discount = Math.max(0, Math.min(originalAmount, discount));
  const finalAmount = originalAmount - discount;
  const actualPct = originalAmount > 0 ? (discount / originalAmount) * 100 : 0;
  return {
    originalAmount,
    discountAmount: discount,
    discountPercent: actualPct,
    finalAmount,
  };
}
