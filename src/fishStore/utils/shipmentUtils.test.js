import { describe, it, expect } from 'vitest';
import { totalWeight, totalExpenses, sharedExpensePerKg } from './shipmentUtils.js';

describe('shipmentUtils (Phase 3 - Shipment shared expense)', () => {
  describe('totalWeight', () => {
    it('sums item weights', () => {
      const shipment = {
        items: [
          { id: 1, name: 'Mathi', weight: 100, cost: 12000 },
          { id: 2, name: 'Ayila', weight: 50, cost: 11000 },
        ],
      };
      expect(totalWeight(shipment)).toBe(150);
    });

    it('handles string weights', () => {
      expect(totalWeight({ items: [{ weight: '30' }, { weight: '20' }] })).toBe(50);
    });

    it('returns 0 for empty or missing items', () => {
      expect(totalWeight({})).toBe(0);
      expect(totalWeight({ items: [] })).toBe(0);
    });
  });

  describe('totalExpenses', () => {
    it('sums expense amounts', () => {
      const shipment = {
        expenses: [
          { id: 1, type: 'Driver/Tempo', amount: 2500 },
          { id: 2, type: 'Ice & Box', amount: 1000 },
        ],
      };
      expect(totalExpenses(shipment)).toBe(3500);
    });

    it('handles string amounts', () => {
      expect(totalExpenses({ expenses: [{ amount: '500' }, { amount: '300' }] })).toBe(800);
    });

    it('returns 0 for empty or missing expenses', () => {
      expect(totalExpenses({})).toBe(0);
      expect(totalExpenses({ expenses: [] })).toBe(0);
    });
  });

  describe('sharedExpensePerKg (Direct Overhead per KG)', () => {
    it('returns Total Expenses / Total Weight', () => {
      const shipment = {
        items: [{ weight: 100 }, { weight: 50 }],
        expenses: [{ amount: 2500 }, { amount: 1000 }],
      };
      expect(sharedExpensePerKg(shipment)).toBe(3500 / 150);
    });

    it('returns 0 when total weight is 0', () => {
      expect(sharedExpensePerKg({ items: [], expenses: [{ amount: 1000 }] })).toBe(0);
    });

    it('matches action plan formula: Direct Overhead per KG = Total Expenses / Total Weight', () => {
      const shipment = {
        items: [{ weight: 200 }],
        expenses: [{ amount: 4000 }],
      };
      expect(sharedExpensePerKg(shipment)).toBe(20);
    });
  });
});
