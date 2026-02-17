import { describe, it, expect } from 'vitest';
import {
  CUSTOMER_TYPES,
  detectCustomerType,
  parseSaleDate,
  filterSales,
  groupSalesByCustomer,
} from './salesUtils.js';

describe('detectCustomerType', () => {
  it('returns Walk-in when name contains "walk" (case-insensitive)', () => {
    expect(detectCustomerType('Walk-in Customer')).toBe('Walk-in');
    expect(detectCustomerType('WALK IN')).toBe('Walk-in');
    expect(detectCustomerType('some walk client')).toBe('Walk-in');
  });

  it('returns Hotel when name contains "hotel" (case-insensitive)', () => {
    expect(detectCustomerType('Local Market Hotel')).toBe('Hotel');
    expect(detectCustomerType('HOTEL Grand')).toBe('Hotel');
    expect(detectCustomerType('hotel abc')).toBe('Hotel');
  });

  it('returns Wholesale when name contains "wholesale" (case-insensitive)', () => {
    expect(detectCustomerType('Wholesale Buyer')).toBe('Wholesale');
    expect(detectCustomerType('WHOLESALE Co')).toBe('Wholesale');
    expect(detectCustomerType('abc wholesale xyz')).toBe('Wholesale');
  });

  it('returns Walk-in for empty or falsy input', () => {
    expect(detectCustomerType('')).toBe('Walk-in');
    expect(detectCustomerType(null)).toBe('Walk-in');
    expect(detectCustomerType(undefined)).toBe('Walk-in');
  });

  it('returns Walk-in when no keyword matches', () => {
    expect(detectCustomerType('Catering Service A')).toBe('Walk-in');
    expect(detectCustomerType('Random Client')).toBe('Walk-in');
  });

  it('prefers first match: walk before hotel before wholesale in string order', () => {
    expect(detectCustomerType('walk hotel')).toBe('Walk-in');
    expect(detectCustomerType('hotel wholesale')).toBe('Hotel');
    expect(detectCustomerType('wholesale only')).toBe('Wholesale');
  });
});

describe('parseSaleDate', () => {
  it('returns YYYY-MM-DD for ISO createdAt', () => {
    expect(parseSaleDate({ createdAt: '2025-01-15T10:00:00.000Z' })).toBe('2025-01-15');
    expect(parseSaleDate({ date: '2024-06-01T00:00:00Z' })).toBe('2024-06-01');
  });

  it('prefers date over createdAt when both present', () => {
    expect(parseSaleDate({ date: '2025-02-01', createdAt: '2025-01-01T00:00:00Z' })).toBe('2025-02-01');
  });

  it('parses date-only string to YYYY-MM-DD', () => {
    expect(parseSaleDate({ date: '2025-01-31' })).toBe('2025-01-31');
    expect(parseSaleDate({ date: '2024-12-01' })).toBe('2024-12-01');
  });

  it('returns null when no date or createdAt', () => {
    expect(parseSaleDate({})).toBe(null);
    expect(parseSaleDate({ date: '', createdAt: '' })).toBe(null);
  });

  it('returns null for invalid date', () => {
    expect(parseSaleDate({ date: 'not-a-date' })).toBe(null);
  });
});

describe('filterSales', () => {
  const sales = [
    { id: 1, clientName: 'Hotel A', customerType: 'Hotel', status: 'Paid', date: '2025-01-10', finalAmount: 1000 },
    { id: 2, clientName: 'Walk-in Bob', customerType: 'Walk-in', status: 'Pending', date: '2025-01-15', finalAmount: 500 },
    { id: 3, clientName: 'Wholesale Co', customerType: 'Wholesale', status: 'Partial', date: '2025-01-20', finalAmount: 2000 },
    { id: 4, clientName: 'Hotel B', customerType: 'Hotel', status: 'Pending', date: '2025-01-25', finalAmount: 800 },
  ];

  it('returns all sales when all filters are All or empty', () => {
    expect(filterSales(sales, {})).toHaveLength(4);
    expect(filterSales(sales, { filterStatus: 'All', filterCustomerType: 'All' })).toHaveLength(4);
  });

  it('filters by payment status', () => {
    const paid = filterSales(sales, { filterStatus: 'Paid' });
    expect(paid).toHaveLength(1);
    expect(paid[0].clientName).toBe('Hotel A');

    const pending = filterSales(sales, { filterStatus: 'Pending' });
    expect(pending).toHaveLength(2);
  });

  it('filters by customer type', () => {
    const hotels = filterSales(sales, { filterCustomerType: 'Hotel' });
    expect(hotels).toHaveLength(2);
    expect(hotels.every(s => s.customerType === 'Hotel')).toBe(true);

    const walkins = filterSales(sales, { filterCustomerType: 'Walk-in' });
    expect(walkins).toHaveLength(1);
    expect(walkins[0].clientName).toBe('Walk-in Bob');
  });

  it('filters by date range', () => {
    const fromOnly = filterSales(sales, { dateFrom: '2025-01-16' });
    expect(fromOnly).toHaveLength(2);
    expect(fromOnly.map(s => s.date)).toEqual(['2025-01-20', '2025-01-25']);

    const toOnly = filterSales(sales, { dateTo: '2025-01-14' });
    expect(toOnly).toHaveLength(1);
    expect(toOnly[0].date).toBe('2025-01-10');

    const range = filterSales(sales, { dateFrom: '2025-01-12', dateTo: '2025-01-22' });
    expect(range).toHaveLength(2);
  });

  it('applies all filters together', () => {
    const result = filterSales(sales, {
      filterStatus: 'Pending',
      filterCustomerType: 'Hotel',
      dateFrom: '2025-01-01',
      dateTo: '2025-01-31',
    });
    expect(result).toHaveLength(1);
    expect(result[0].clientName).toBe('Hotel B');
  });
});

describe('groupSalesByCustomer', () => {
  it('groups sales by clientName', () => {
    const sales = [
      { id: 1, clientName: 'Hotel A', customerType: 'Hotel', finalAmount: 100, amountPending: 0 },
      { id: 2, clientName: 'Hotel A', customerType: 'Hotel', finalAmount: 200, amountPending: 50 },
      { id: 3, clientName: 'Walk-in X', customerType: 'Walk-in', finalAmount: 80, amountPending: 80 },
    ];
    const groups = groupSalesByCustomer(sales);
    expect(groups).toHaveLength(2);

    const hotelGroup = groups.find(g => g.clientName === 'Hotel A');
    expect(hotelGroup).toBeDefined();
    expect(hotelGroup.customerType).toBe('Hotel');
    expect(hotelGroup.sales).toHaveLength(2);
    expect(hotelGroup.totalAmount).toBe(300);
    expect(hotelGroup.totalPending).toBe(50);

    const walkinGroup = groups.find(g => g.clientName === 'Walk-in X');
    expect(walkinGroup).toBeDefined();
    expect(walkinGroup.sales).toHaveLength(1);
    expect(walkinGroup.totalAmount).toBe(80);
    expect(walkinGroup.totalPending).toBe(80);
  });

  it('uses "Unknown" for missing clientName', () => {
    const sales = [{ id: 1, clientName: '', finalAmount: 10, amountPending: 0 }];
    const groups = groupSalesByCustomer(sales);
    expect(groups).toHaveLength(1);
    expect(groups[0].clientName).toBe('Unknown');
    expect(groups[0].customerType).toBe('Walk-in');
  });

  it('returns empty array for empty sales', () => {
    expect(groupSalesByCustomer([])).toEqual([]);
  });
});

describe('CUSTOMER_TYPES', () => {
  it('exports expected customer type list', () => {
    expect(CUSTOMER_TYPES).toEqual(['Walk-in', 'Hotel', 'Wholesale']);
  });
});
