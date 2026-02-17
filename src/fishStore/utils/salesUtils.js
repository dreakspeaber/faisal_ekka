/**
 * Pure utilities for sales: customer type detection, date parsing, filtering, grouping.
 * Used by SalesPoint and tested in salesUtils.test.js.
 */

export const CUSTOMER_TYPES = ['Walk-in', 'Hotel', 'Wholesale'];

/**
 * Detect customer type from client name (case-insensitive).
 * - "Walk-in" if name contains "walk"
 * - "Hotel" if name contains "hotel"
 * - "Wholesale" if name contains "wholesale"
 * @param {string} clientName
 * @returns {'Walk-in'|'Hotel'|'Wholesale'}
 */
export function detectCustomerType(clientName) {
  if (!clientName) return 'Walk-in';
  const name = (clientName || '').toLowerCase();
  if (name.includes('walk')) return 'Walk-in';
  if (name.includes('hotel')) return 'Hotel';
  if (name.includes('wholesale')) return 'Wholesale';
  return 'Walk-in';
}

/**
 * Parse sale date to YYYY-MM-DD for comparison. Uses sale.date or sale.createdAt.
 * @param {{ date?: string, createdAt?: string }} sale
 * @returns {string|null} ISO date string (YYYY-MM-DD) or null
 */
export function parseSaleDate(sale) {
  const d = sale.date || sale.createdAt;
  if (!d) return null;
  if (typeof d === 'string' && d.includes('T')) return d.split('T')[0];
  const parsed = new Date(d);
  return isNaN(parsed.getTime()) ? null : parsed.toISOString().split('T')[0];
}

/**
 * Filter sales by status, customer type, and date range.
 * @param {Array<{ status: string, customerType: string, date?: string, createdAt?: string }>} sales
 * @param {{ filterStatus?: string, filterCustomerType?: string, dateFrom?: string, dateTo?: string }} options
 * @returns {typeof sales}
 */
export function filterSales(sales, { filterStatus = 'All', filterCustomerType = 'All', dateFrom = '', dateTo = '' } = {}) {
  return sales.filter(s => {
    if (filterStatus !== 'All' && s.status !== filterStatus) return false;
    if (filterCustomerType !== 'All' && s.customerType !== filterCustomerType) return false;
    const saleDate = parseSaleDate(s);
    if (dateFrom && saleDate < dateFrom) return false;
    if (dateTo && saleDate > dateTo) return false;
    return true;
  });
}

/**
 * Group sales by client name. Each group has clientName, customerType, sales[], totalAmount, totalPending.
 * @param {Array<{ clientName?: string, customerType?: string, finalAmount?: number, amountPending?: number }>} sales
 * @returns {Array<{ clientName: string, customerType: string, sales: typeof sales, totalAmount: number, totalPending: number }>}
 */
export function groupSalesByCustomer(sales) {
  const map = new Map();
  sales.forEach(sale => {
    const key = sale.clientName || 'Unknown';
    if (!map.has(key)) {
      map.set(key, { clientName: key, customerType: sale.customerType || 'Walk-in', sales: [], totalAmount: 0, totalPending: 0 });
    }
    const group = map.get(key);
    group.sales.push(sale);
    group.totalAmount += sale.finalAmount || 0;
    group.totalPending += sale.amountPending || 0;
  });
  return Array.from(map.values());
}
