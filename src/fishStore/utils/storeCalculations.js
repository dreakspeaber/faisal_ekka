/**
 * Pure store calculation functions (wages, overhead, inventory).
 * Used by useStoreCalculations hook and tested in storeCalculations.test.js.
 */

import { sharedExpensePerKg } from './shipmentUtils.js';
import { calculatePaymentStatus } from './paymentUtils.js';

/**
 * Total monthly wages from staff list.
 * @param {Array<{ salary?: number|string }>} staffList
 * @returns {number}
 */
export function computeTotalMonthlyWages(staffList) {
  return (staffList || []).reduce((acc, staff) => acc + parseFloat(staff.salary || 0), 0);
}

/**
 * Store overhead per kg (fixed costs spread over stock and turnover days).
 * @param {{ monthlyRent?: number|string, avgDailyStock?: number|string, avgTurnaroundDays?: number|string }} storeSettings
 * @param {number} totalMonthlyWages
 * @returns {number}
 */
export function computeStoreOverheadPerKg(storeSettings, totalMonthlyWages) {
  const totalMonthlyFixed = parseFloat(storeSettings?.monthlyRent || 0) + totalMonthlyWages;
  const dailyFixedCost = totalMonthlyFixed / 30;
  const avgStock = parseFloat(storeSettings?.avgDailyStock || 0);
  const costPerKgPerDay = avgStock > 0 ? dailyFixedCost / avgStock : 0;
  return costPerKgPerDay * parseFloat(storeSettings?.avgTurnaroundDays || 0);
}

/**
 * Build inventory from finalized shipments, then deduct sales and apply payment status.
 * @param {Array} shipments
 * @param {Array} sales
 * @param {Array} paymentHistory
 * @param {number} storeOverheadPerKg
 * @returns {Record<string, { weight: number, totalValue: number, avgCost: number, directCost: number, storeOverhead: number, soldWeight: number, soldValue: number, pendingValue: number }>}
 */
export function computeInventory(shipments, sales, paymentHistory, storeOverheadPerKg) {
  const stock = {};

  (shipments || []).filter(s => s.isFinalized).forEach(shipment => {
    const totalWeight = shipment.items.reduce((sum, item) => sum + parseFloat(item.weight || 0), 0);
    const directOverheadPerKg = sharedExpensePerKg(shipment);

    shipment.items.forEach(item => {
      const itemWeight = parseFloat(item.weight || 0);
      const itemBaseCost = parseFloat(item.cost || 0);
      const rawCostPerKg = itemWeight > 0 ? itemBaseCost / itemWeight : 0;
      const effectiveCostPerKg = rawCostPerKg + directOverheadPerKg + storeOverheadPerKg;

      if (!stock[item.name]) {
        stock[item.name] = {
          weight: 0,
          totalValue: 0,
          avgCost: 0,
          directCost: 0,
          storeOverhead: 0,
          soldWeight: 0,
          soldValue: 0,
          pendingValue: 0,
        };
      }

      stock[item.name].totalValue += itemWeight * effectiveCostPerKg;
      stock[item.name].weight += itemWeight;
      stock[item.name].avgCost = stock[item.name].weight > 0 ? stock[item.name].totalValue / stock[item.name].weight : 0;
      stock[item.name].directCost = rawCostPerKg + directOverheadPerKg;
    });
  });

  (sales || []).forEach(sale => {
    if (!stock[sale.itemName]) return;
    const w = parseFloat(sale.weight || 0);
    const finalAmount = sale.finalAmount ?? parseFloat(sale.price || 0) * w;

    const { amountPaid } = calculatePaymentStatus(sale.id, finalAmount, paymentHistory || []);
    const amountPending = finalAmount - amountPaid;
    const status = amountPaid >= finalAmount ? 'Paid' : amountPaid > 0 ? 'Partial' : 'Pending';

    stock[sale.itemName].weight -= w;
    stock[sale.itemName].totalValue -= w * stock[sale.itemName].avgCost;
    stock[sale.itemName].soldWeight += w;
    stock[sale.itemName].soldValue += finalAmount;
    if (status !== 'Paid') {
      stock[sale.itemName].pendingValue += amountPending;
    }
  });

  return stock;
}
