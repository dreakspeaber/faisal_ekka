import { describe, it, expect } from 'vitest';
import {
  calculatePaymentStatus,
  discountAmountFromPercent,
  discountPercentFromAmount,
  validateDiscount,
  computeSaleAmounts,
} from './paymentUtils.js';

describe('calculatePaymentStatus (Phase 1 - Payment History)', () => {
  it('returns Paid when amountPaid >= finalAmount', () => {
    const history = [{ saleId: 1, amount: 100 }];
    expect(calculatePaymentStatus(1, 100, history)).toEqual({ status: 'Paid', amountPaid: 100, amountPending: 0 });
    expect(calculatePaymentStatus(1, 80, history)).toEqual({ status: 'Paid', amountPaid: 100, amountPending: 0 });
  });

  it('returns Partial when 0 < amountPaid < finalAmount', () => {
    const history = [{ saleId: 1, amount: 40 }];
    expect(calculatePaymentStatus(1, 100, history)).toEqual({ status: 'Partial', amountPaid: 40, amountPending: 60 });
  });

  it('returns Pending when amountPaid === 0', () => {
    expect(calculatePaymentStatus(1, 100, [])).toEqual({ status: 'Pending', amountPaid: 0, amountPending: 100 });
    expect(calculatePaymentStatus(1, 100, [{ saleId: 2, amount: 50 }])).toEqual({ status: 'Pending', amountPaid: 0, amountPending: 100 });
  });

  it('sums multiple payments for the same sale', () => {
    const history = [
      { saleId: 1, amount: 30 },
      { saleId: 1, amount: 40 },
      { saleId: 1, amount: 30 },
    ];
    expect(calculatePaymentStatus(1, 100, history)).toEqual({ status: 'Paid', amountPaid: 100, amountPending: 0 });
  });

  it('ignores payments for other sales', () => {
    const history = [{ saleId: 2, amount: 100 }];
    expect(calculatePaymentStatus(1, 100, history)).toEqual({ status: 'Pending', amountPaid: 0, amountPending: 100 });
  });

  it('handles null/undefined paymentHistory', () => {
    expect(calculatePaymentStatus(1, 100, null)).toEqual({ status: 'Pending', amountPaid: 0, amountPending: 100 });
    expect(calculatePaymentStatus(1, 100, undefined)).toEqual({ status: 'Pending', amountPaid: 0, amountPending: 100 });
  });
});

describe('discountAmountFromPercent (Phase 1 - Discounts)', () => {
  it('computes discount amount from percent', () => {
    expect(discountAmountFromPercent(1000, 10)).toBe(100);
    expect(discountAmountFromPercent(500, 20)).toBe(100);
    expect(discountAmountFromPercent(100, 0)).toBe(0);
    expect(discountAmountFromPercent(100, 100)).toBe(100);
  });

  it('clamps percent to 0-100', () => {
    expect(discountAmountFromPercent(100, -5)).toBe(0);
    expect(discountAmountFromPercent(100, 150)).toBe(100);
  });
});

describe('discountPercentFromAmount (Phase 1 - Discounts)', () => {
  it('computes discount percent from amount', () => {
    expect(discountPercentFromAmount(1000, 100)).toBe(10);
    expect(discountPercentFromAmount(500, 125)).toBe(25);
    expect(discountPercentFromAmount(100, 0)).toBe(0);
  });

  it('clamps percent to 0-100', () => {
    expect(discountPercentFromAmount(100, 150)).toBe(100);
  });

  it('returns 0 when originalAmount is 0', () => {
    expect(discountPercentFromAmount(0, 50)).toBe(0);
  });
});

describe('validateDiscount (Phase 1 - Validation)', () => {
  it('returns valid for correct discount', () => {
    expect(validateDiscount(1000, 100, 10)).toEqual({ valid: true });
    expect(validateDiscount(500, 0, 0)).toEqual({ valid: true });
  });

  it('rejects discount percent outside 0-100', () => {
    expect(validateDiscount(100, 0, -1).valid).toBe(false);
    expect(validateDiscount(100, 0, 101).valid).toBe(false);
  });

  it('rejects discount amount exceeding original', () => {
    expect(validateDiscount(100, 150, 0).valid).toBe(false);
  });

  it('rejects negative discount amount', () => {
    expect(validateDiscount(100, -10, 0).valid).toBe(false);
  });
});

describe('computeSaleAmounts (Phase 1 - Sale totals)', () => {
  it('computes original and final without discount', () => {
    const r = computeSaleAmounts(10, 50, {});
    expect(r.originalAmount).toBe(500);
    expect(r.discountAmount).toBe(0);
    expect(r.finalAmount).toBe(500);
  });

  it('applies discount percent', () => {
    const r = computeSaleAmounts(10, 100, { discountPercent: 10 });
    expect(r.originalAmount).toBe(1000);
    expect(r.discountAmount).toBe(100);
    expect(r.finalAmount).toBe(900);
  });

  it('applies discount amount', () => {
    const r = computeSaleAmounts(10, 100, { discountAmount: 50 });
    expect(r.originalAmount).toBe(1000);
    expect(r.discountAmount).toBe(50);
    expect(r.discountPercent).toBe(5);
    expect(r.finalAmount).toBe(950);
  });

  it('clamps discount to original (no negative final)', () => {
    const r = computeSaleAmounts(10, 100, { discountAmount: 1500 });
    expect(r.discountAmount).toBe(1000);
    expect(r.finalAmount).toBe(0);
  });
});
