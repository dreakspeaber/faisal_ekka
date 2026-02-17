import { describe, it, expect } from 'vitest';
import {
  computeTotalMonthlyWages,
  computeStoreOverheadPerKg,
  computeInventory,
} from './storeCalculations.js';

describe('computeTotalMonthlyWages', () => {
  it('sums staff salaries', () => {
    const staff = [
      { id: 1, name: 'A', salary: 12000 },
      { id: 2, name: 'B', salary: 8000 },
    ];
    expect(computeTotalMonthlyWages(staff)).toBe(20000);
  });

  it('handles string salaries', () => {
    expect(computeTotalMonthlyWages([{ salary: '15000' }])).toBe(15000);
  });

  it('returns 0 for empty list', () => {
    expect(computeTotalMonthlyWages([])).toBe(0);
    expect(computeTotalMonthlyWages(null)).toBe(0);
  });
});

describe('computeStoreOverheadPerKg', () => {
  it('computes overhead from rent, wages, stock and turnaround', () => {
    const settings = { monthlyRent: 15000, avgDailyStock: 500, avgTurnaroundDays: 5 };
    const wages = 35000;
    const totalFixed = 50000;
    const dailyFixed = totalFixed / 30;
    const costPerKgPerDay = dailyFixed / 500;
    const expected = costPerKgPerDay * 5;
    expect(computeStoreOverheadPerKg(settings, wages)).toBeCloseTo(expected, 10);
  });

  it('returns 0 when avgDailyStock is 0 (avoids division by zero)', () => {
    const settings = { monthlyRent: 10000, avgDailyStock: 0, avgTurnaroundDays: 5 };
    expect(computeStoreOverheadPerKg(settings, 0)).toBe(0);
  });
});

describe('computeInventory', () => {
  const storeOverheadPerKg = 2;

  it('builds stock from finalized shipments with effective cost', () => {
    const shipments = [
      {
        id: 1,
        isFinalized: true,
        items: [
          { name: 'Mathi', weight: 100, cost: 10000 },
          { name: 'Ayila', weight: 50, cost: 5000 },
        ],
        expenses: [{ amount: 1500 }],
      },
    ];
    const inv = computeInventory(shipments, [], [], storeOverheadPerKg);
    expect(inv.Mathi).toBeDefined();
    expect(inv.Mathi.weight).toBe(100);
    expect(inv.Mathi.avgCost).toBeGreaterThan(100);
    expect(inv.Ayila).toBeDefined();
    expect(inv.Ayila.weight).toBe(50);
  });

  it('ignores non-finalized shipments', () => {
    const shipments = [
      { id: 1, isFinalized: false, items: [{ name: 'Mathi', weight: 100, cost: 10000 }], expenses: [] },
    ];
    const inv = computeInventory(shipments, [], [], storeOverheadPerKg);
    expect(Object.keys(inv)).toHaveLength(0);
  });

  it('deducts sales from stock and tracks pendingValue for unpaid sales', () => {
    const shipments = [
      {
        id: 1,
        isFinalized: true,
        items: [{ name: 'Mathi', weight: 100, cost: 10000 }],
        expenses: [],
      },
    ];
    const sales = [
      { id: 101, itemName: 'Mathi', weight: 30, price: 120, finalAmount: 3600 },
    ];
    const paymentHistory = [{ saleId: 101, amount: 1000 }];
    const inv = computeInventory(shipments, sales, paymentHistory, storeOverheadPerKg);
    expect(inv.Mathi.weight).toBe(70);
    expect(inv.Mathi.soldWeight).toBe(30);
    expect(inv.Mathi.soldValue).toBe(3600);
    expect(inv.Mathi.pendingValue).toBe(2600);
  });

  it('does not add pendingValue when sale is fully paid', () => {
    const shipments = [
      {
        id: 1,
        isFinalized: true,
        items: [{ name: 'Mathi', weight: 100, cost: 10000 }],
        expenses: [],
      },
    ];
    const sales = [{ id: 102, itemName: 'Mathi', weight: 20, price: 100, finalAmount: 2000 }];
    const paymentHistory = [{ saleId: 102, amount: 2000 }];
    const inv = computeInventory(shipments, sales, paymentHistory, storeOverheadPerKg);
    expect(inv.Mathi.pendingValue).toBe(0);
  });
});
