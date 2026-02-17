/**
 * Shipment utilities (Phase 3 - Shipment Editing / Shared Expense).
 * Shared expense per kg = Total Expenses / Total Weight (Direct Overhead per KG).
 */

/**
 * Total weight of a shipment (sum of item weights).
 * @param {{ items: Array<{ weight: number|string }> }} shipment
 * @returns {number}
 */
export function totalWeight(shipment) {
  if (!shipment?.items?.length) return 0;
  return shipment.items.reduce((sum, item) => sum + parseFloat(item.weight || 0), 0);
}

/**
 * Total expenses of a shipment (sum of expense amounts).
 * @param {{ expenses: Array<{ amount: number|string }> }} shipment
 * @returns {number}
 */
export function totalExpenses(shipment) {
  if (!shipment?.expenses?.length) return 0;
  return shipment.expenses.reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0);
}

/**
 * Shared (direct) expense per kg for a shipment: Total Expenses / Total Weight.
 * Action plan: "Direct Overhead per KG" = Total Expenses / Total Weight.
 * @param {{ items?: Array<{ weight: number|string }>, expenses?: Array<{ amount: number|string }> }} shipment
 * @returns {number}
 */
export function sharedExpensePerKg(shipment) {
  const weight = totalWeight(shipment);
  const expenses = totalExpenses(shipment);
  return weight > 0 ? expenses / weight : 0;
}
