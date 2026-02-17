import { useMemo } from 'react';
import { computeTotalMonthlyWages, computeStoreOverheadPerKg, computeInventory } from './utils/storeCalculations.js';

export function getAutoShipmentName() {
  const date = new Date();
  const day = date.getDate().toString().padStart(2, '0');
  const month = date.toLocaleString('default', { month: 'long' });
  const year = date.getFullYear().toString().slice(-2);
  return `${day}-${month}-${year}`;
}

export function useStoreCalculations(storeSettings, staffList, shipments, sales, paymentHistory) {
  const totalMonthlyWages = useMemo(
    () => computeTotalMonthlyWages(staffList),
    [staffList]
  );

  const storeOverheadPerKg = useMemo(
    () => computeStoreOverheadPerKg(storeSettings, totalMonthlyWages),
    [storeSettings, totalMonthlyWages]
  );

  const inventory = useMemo(
    () => computeInventory(shipments, sales, paymentHistory, storeOverheadPerKg),
    [shipments, sales, paymentHistory, storeOverheadPerKg]
  );

  return { totalMonthlyWages, storeOverheadPerKg, inventory };
}
