import React, { useState } from 'react';
import { Truck, Plus, Save, Activity, Clock } from 'lucide-react';
import { Card, Button, Input } from '../ui';
import { getAutoShipmentName } from '../useStoreCalculations';
import { useStore } from '../StoreContext';

export default function ShipmentManager() {
  const { fishTypes, setFishTypes, shipments, setShipments, storeOverheadPerKg } = useStore();
  const [isCreating, setIsCreating] = useState(false);
  const [newShipment, setNewShipment] = useState({
    supplier: '',
    items: [],
    expenses: []
  });

  const [isAddingFish, setIsAddingFish] = useState(false);
  const [newFishName, setNewFishName] = useState('');
  const [tempItem, setTempItem] = useState({ name: '', weight: '', cost: '' });
  const [tempExpense, setTempExpense] = useState({ type: '', amount: '' });

  const addItem = () => {
    if (!tempItem.name || !tempItem.weight || !tempItem.cost) return;
    setNewShipment(prev => ({
      ...prev,
      items: [...prev.items, { ...tempItem, id: Date.now() }]
    }));
    setTempItem({ name: '', weight: '', cost: '' });
    setIsAddingFish(false);
  };

  const addFishType = () => {
    if (newFishName) {
      setFishTypes([...fishTypes, newFishName]);
      setTempItem({ ...tempItem, name: newFishName });
      setNewFishName('');
      setIsAddingFish(false);
    }
  };

  const addExpense = () => {
    if (!tempExpense.type || !tempExpense.amount) return;
    setNewShipment(prev => ({
      ...prev,
      expenses: [...prev.expenses, { ...tempExpense, id: Date.now() }]
    }));
    setTempExpense({ type: '', amount: '' });
  };

  const finalizeShipment = () => {
    const shipmentName = newShipment.supplier.trim() ? newShipment.supplier : getAutoShipmentName();
    setShipments([
      ...shipments,
      {
        ...newShipment,
        supplier: shipmentName,
        id: Date.now(),
        isFinalized: true,
        date: new Date().toISOString().split('T')[0]
      }
    ]);
    setIsCreating(false);
    setNewShipment({ supplier: '', items: [], expenses: [] });
  };

  const totalWt = newShipment.items.reduce((s, i) => s + parseFloat(i.weight), 0);
  const totalExp = newShipment.expenses.reduce((s, i) => s + parseFloat(i.amount), 0);
  const directOverheadPerKg = totalWt > 0 ? totalExp / totalWt : 0;

  if (isCreating) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-800">New Shipment Entry</h2>
          <Button variant="secondary" onClick={() => setIsCreating(false)}>Cancel</Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6">
              <h3 className="font-semibold mb-4 text-slate-700">1. Shipment Details</h3>
              <div className="space-y-2">
                <Input
                  label="Shipment Name / Supplier"
                  value={newShipment.supplier}
                  onChange={e => setNewShipment({ ...newShipment, supplier: e.target.value })}
                  placeholder={`Leave empty for "${getAutoShipmentName()}"`}
                />
                {!newShipment.supplier && (
                  <p className="text-xs text-blue-500 flex items-center gap-1">
                    <Clock size={12} /> Auto-name: {getAutoShipmentName()}
                  </p>
                )}
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="font-semibold mb-4 text-slate-700">2. Fish Stock (Items)</h3>
              <div className="flex flex-col md:flex-row gap-2 mb-4 items-end">
                <div className="flex-1 w-full">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Fish Type</label>
                  {isAddingFish ? (
                    <div className="flex gap-2">
                      <input
                        autoFocus
                        className="w-full px-3 py-2 border border-blue-500 rounded-lg outline-none"
                        placeholder="Enter new fish name"
                        value={newFishName}
                        onChange={e => setNewFishName(e.target.value)}
                      />
                      <Button onClick={addFishType} variant="success" className="whitespace-nowrap">Add</Button>
                      <Button onClick={() => setIsAddingFish(false)} variant="secondary">X</Button>
                    </div>
                  ) : (
                    <select
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none bg-white"
                      value={tempItem.name}
                      onChange={e => {
                        if (e.target.value === '__NEW__') setIsAddingFish(true);
                        else setTempItem({ ...tempItem, name: e.target.value });
                      }}
                    >
                      <option value="">Select Fish...</option>
                      {fishTypes.map(f => (
                        <option key={f} value={f}>{f}</option>
                      ))}
                      <option value="__NEW__" className="font-bold text-blue-600">+ Add New Fish Type</option>
                    </select>
                  )}
                </div>
                <Input className="w-full md:w-24" label="Weight (kg)" type="number" value={tempItem.weight} onChange={e => setTempItem({ ...tempItem, weight: e.target.value })} placeholder="0" />
                <Input className="w-full md:w-32" label="Total Cost (₹)" type="number" value={tempItem.cost} onChange={e => setTempItem({ ...tempItem, cost: e.target.value })} placeholder="0.00" />
                <Button onClick={addItem} disabled={isAddingFish}><Plus size={18} /></Button>
              </div>
              {newShipment.items.length > 0 && (
                <div className="bg-slate-50 rounded-lg p-2 space-y-2">
                  {newShipment.items.map(item => (
                    <div key={item.id} className="flex justify-between items-center text-sm px-2">
                      <span>{item.name} ({item.weight}kg)</span>
                      <span className="font-mono">₹{item.cost}</span>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card className="p-6">
              <h3 className="font-semibold mb-4 text-slate-700">3. Shipment Expenses</h3>
              <div className="flex gap-2 mb-4 items-end">
                <Input className="flex-1" label="Expense Type" value={tempExpense.type} onChange={e => setTempExpense({ ...tempExpense, type: e.target.value })} placeholder="Driver / Wages" />
                <Input className="w-32" label="Amount" type="number" value={tempExpense.amount} onChange={e => setTempExpense({ ...tempExpense, amount: e.target.value })} placeholder="0.00" />
                <Button onClick={addExpense} variant="secondary"><Plus size={18} /></Button>
              </div>
              {newShipment.expenses.length > 0 && (
                <div className="bg-orange-50 rounded-lg p-2 space-y-2 border border-orange-100">
                  {newShipment.expenses.map(exp => (
                    <div key={exp.id} className="flex justify-between items-center text-sm px-2 text-orange-800">
                      <span>{exp.type}</span>
                      <span className="font-mono">₹{exp.amount}</span>
                    </div>
                  ))}
                  <div className="border-t border-orange-200 mt-2 pt-2 flex justify-between font-bold text-orange-900 px-2">
                    <span>Total Expenses</span>
                    <span>₹{totalExp.toFixed(2)}</span>
                  </div>
                </div>
              )}
            </Card>
          </div>

          <div className="lg:col-span-1">
            <Card className="p-6 bg-slate-800 text-white sticky top-6">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <Activity size={20} /> Cost Preview
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between text-sm text-slate-400">
                  <span>Total Weight</span>
                  <span className="text-white font-mono">{totalWt} kg</span>
                </div>
                <div className="flex justify-between text-sm text-slate-400">
                  <span>Direct Overhead</span>
                  <span className="text-white font-mono">₹{totalExp.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-purple-300">
                  <span>Store Overhead</span>
                  <span className="font-mono">+₹{storeOverheadPerKg.toFixed(2)}/kg</span>
                </div>
                <div className="border-b border-slate-600 pb-4">
                  <div className="flex justify-between text-sm text-yellow-400 font-bold">
                    <span>Total Overhead per KG</span>
                    <span className="font-mono">+₹{(directOverheadPerKg + storeOverheadPerKg).toFixed(2)}</span>
                  </div>
                </div>
                <Button className="w-full justify-center mt-6" onClick={finalizeShipment} disabled={newShipment.items.length === 0}>
                  <Save size={18} /> Finalize & Save
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-800">Shipment History</h2>
        <Button onClick={() => setIsCreating(true)}><Plus size={18} /> New Shipment</Button>
      </div>
      <div className="grid gap-4">
        {shipments.map(shipment => {
          const sWeight = shipment.items.reduce((a, b) => a + parseFloat(b.weight), 0);
          const sCost = shipment.items.reduce((a, b) => a + parseFloat(b.cost), 0);
          const sExp = shipment.expenses.reduce((a, b) => a + parseFloat(b.amount), 0);
          return (
            <Card key={shipment.id} className="p-4 flex flex-col md:flex-row justify-between items-center gap-4 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4">
                <div className="bg-blue-100 p-3 rounded-full text-blue-600">
                  <Truck size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800">{shipment.supplier}</h4>
                  <p className="text-sm text-slate-500">{shipment.date} • ID: #{shipment.id}</p>
                </div>
              </div>
              <div className="flex gap-8 text-sm">
                <div>
                  <span className="block text-slate-500 text-xs uppercase">Stock Added</span>
                  <span className="font-medium">{sWeight} kg</span>
                </div>
                <div>
                  <span className="block text-slate-500 text-xs uppercase">Total Eff. Cost</span>
                  <span className="font-bold text-slate-800">₹{(sCost + sExp + storeOverheadPerKg * sWeight).toFixed(2)}</span>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
