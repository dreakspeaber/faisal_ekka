import React, { createContext, useContext, useState, useMemo } from 'react';
import { useStoreCalculations } from './useStoreCalculations.js';

const defaultStoreSettings = {
  monthlyRent: 15000,
  avgDailyStock: 500,
  avgTurnaroundDays: 5,
};

const defaultClients = [
  { id: 1, name: 'Local Market Hotel' },
  { id: 2, name: 'Catering Service A' },
  { id: 3, name: 'Walk-in Customer' },
];

const defaultStaffList = [
  { id: 1, name: 'Ramesh', role: 'Helper', salary: 12000, phone: '9876543210' },
  { id: 2, name: 'Suresh', role: 'Cleaner', salary: 8000, phone: '9876543211' },
  { id: 3, name: 'Manager', role: 'Admin', salary: 15000, phone: '9876543212' },
];

const defaultStaffTransactions = [
  { id: 1, staffId: 1, date: '2023-10-01', type: 'Salary', amount: 12000, note: 'October Salary' },
  { id: 2, staffId: 2, date: '2023-10-15', type: 'Advance', amount: 2000, note: 'Festival Advance' },
];

const defaultShipments = [
  {
    id: 1,
    supplier: 'Harbour Fresh Catch',
    date: '2023-10-24',
    items: [
      { id: 101, name: 'Mathi', weight: 100, cost: 12000 },
      { id: 102, name: 'Ayila', weight: 50, cost: 11000 },
      { id: 103, name: 'Chembali', weight: 30, cost: 10500 },
      { id: 104, name: 'Ayikora', weight: 20, cost: 14000 },
    ],
    expenses: [
      { id: 201, type: 'Driver/Tempo', amount: 2500 },
      { id: 202, type: 'Ice & Box', amount: 1000 },
      { id: 203, type: 'Unloading Wages', amount: 500 },
    ],
    isFinalized: true,
  },
];

const StoreContext = createContext(null);

export function StoreProvider({ children }) {
  const [storeSettings, setStoreSettings] = useState(defaultStoreSettings);
  const [fishTypes, setFishTypes] = useState(['Mathi', 'Ayila', 'Chembali', 'Ayikora']);
  const [clients, setClients] = useState(defaultClients);
  const [staffList, setStaffList] = useState(defaultStaffList);
  const [staffTransactions, setStaffTransactions] = useState(defaultStaffTransactions);
  const [shipments, setShipments] = useState(defaultShipments);
  const [sales, setSales] = useState([]);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [sellingPrices, setSellingPrices] = useState({});

  const { totalMonthlyWages, storeOverheadPerKg, inventory } = useStoreCalculations(
    storeSettings,
    staffList,
    shipments,
    sales,
    paymentHistory
  );

  const value = useMemo(
    () => ({
      storeSettings,
      setStoreSettings,
      fishTypes,
      setFishTypes,
      clients,
      setClients,
      staffList,
      setStaffList,
      staffTransactions,
      setStaffTransactions,
      shipments,
      setShipments,
      sales,
      setSales,
      paymentHistory,
      setPaymentHistory,
      sellingPrices,
      setSellingPrices,
      totalMonthlyWages,
      storeOverheadPerKg,
      inventory,
    }),
    [
      storeSettings,
      fishTypes,
      clients,
      staffList,
      staffTransactions,
      shipments,
      sales,
      paymentHistory,
      sellingPrices,
      totalMonthlyWages,
      storeOverheadPerKg,
      inventory,
    ]
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}
