import React, { useState } from 'react';
import { Package, DollarSign, Activity, Settings, List, CheckCircle, Clock3, ShoppingCart, Eye, EyeOff, IndianRupee, Pencil } from 'lucide-react';
import { Card, Button, Input } from '../ui';
import { useStore } from '../StoreContext';

export default function Dashboard() {
  const { inventory, storeOverheadPerKg, sales, sellingPrices, setSellingPrices } = useStore();
  const [showDetailed, setShowDetailed] = useState(false);
  const [sellingPriceModalItem, setSellingPriceModalItem] = useState(null);
  const [sellingPriceInput, setSellingPriceInput] = useState('');

  const totalStockWeight = Object.values(inventory).reduce((acc, curr) => acc + Math.max(0, curr.weight), 0);
  const totalStockValue = Object.values(inventory).reduce((acc, curr) => acc + Math.max(0, curr.totalValue), 0);
  const totalRevenue = sales.reduce((acc, curr) => {
    const finalAmount = curr.finalAmount || parseFloat(curr.price) * parseFloat(curr.weight);
    return acc + finalAmount;
  }, 0);

  const totalSoldWeight = sales.reduce((acc, curr) => acc + parseFloat(curr.weight), 0);
  const totalPending = sales
    .filter(s => s.status === 'Pending')
    .reduce((acc, curr) => {
      const finalAmount = curr.finalAmount || parseFloat(curr.price) * parseFloat(curr.weight);
      return acc + finalAmount;
    }, 0);
  const totalReceived = totalRevenue - totalPending;

  const openSellingPriceModal = (itemName) => {
    setSellingPriceModalItem(itemName);
    setSellingPriceInput(sellingPrices[itemName] != null ? String(sellingPrices[itemName]) : '');
  };

  const closeSellingPriceModal = () => {
    setSellingPriceModalItem(null);
    setSellingPriceInput('');
  };

  const saveSellingPrice = () => {
    if (!sellingPriceModalItem) return;
    const num = parseFloat(sellingPriceInput);
    if (!Number.isNaN(num) && num >= 0) {
      setSellingPrices((prev) => ({ ...prev, [sellingPriceModalItem]: num }));
    }
    closeSellingPriceModal();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-xl font-bold text-slate-700">Overview</h2>
        <button
          onClick={() => setShowDetailed(!showDetailed)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${showDetailed ? 'bg-blue-600 text-white' : 'bg-white border border-slate-300 text-slate-600'}`}
        >
          {showDetailed ? <EyeOff size={16} /> : <Eye size={16} />}
          {showDetailed ? 'Simple View' : 'Detailed View'}
        </button>
      </div>

      <div className={`grid grid-cols-1 ${showDetailed ? 'md:grid-cols-4' : 'md:grid-cols-4'} gap-4`}>
        <Card className="p-4 border-l-4 border-blue-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-slate-500">Stock (In Hand)</p>
              <h3 className="text-2xl font-bold text-slate-800">
                {totalStockWeight.toFixed(1)} <span className="text-sm font-normal text-slate-400">kg</span>
              </h3>
            </div>
            <Package className="text-blue-500" />
          </div>
        </Card>
        <Card className="p-4 border-l-4 border-emerald-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-slate-500">Stock Value</p>
              <h3 className="text-2xl font-bold text-slate-800">₹{totalStockValue.toFixed(2)}</h3>
            </div>
            <DollarSign className="text-emerald-500" />
          </div>
        </Card>
        <Card className="p-4 border-l-4 border-orange-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-slate-500">Total Sales</p>
              <h3 className="text-2xl font-bold text-slate-800">₹{totalRevenue.toFixed(2)}</h3>
            </div>
            <Activity className="text-orange-500" />
          </div>
        </Card>
        <Card className="p-4 border-l-4 border-purple-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-slate-500">Overhead Rate</p>
              <h3 className="text-2xl font-bold text-slate-800">₹{storeOverheadPerKg.toFixed(2)}</h3>
              <p className="text-xs text-slate-500">per kg / turnover</p>
            </div>
            <Settings className="text-purple-500" />
          </div>
        </Card>
      </div>

      {showDetailed && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in slide-in-from-top-4 duration-300">
          <Card className="p-4 bg-slate-50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 text-green-600 rounded-lg">
                <CheckCircle size={20} />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase">Cash Received</p>
                <p className="text-xl font-bold text-green-700">₹{totalReceived.toFixed(2)}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4 bg-slate-50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 text-red-600 rounded-lg">
                <Clock3 size={20} />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase">Pending Payments</p>
                <p className="text-xl font-bold text-red-700">₹{totalPending.toFixed(2)}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4 bg-slate-50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                <ShoppingCart size={20} />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase">Total Weight Sold</p>
                <p className="text-xl font-bold text-blue-700">
                  {totalSoldWeight.toFixed(1)} <span className="text-sm font-normal">kg</span>
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6">
        <Card className="p-6">
          <h3 className="font-bold text-lg mb-4 text-slate-800 flex items-center gap-2">
            <List className="w-5 h-5 text-blue-600" />
            {showDetailed ? 'Complete Inventory Analysis' : 'Current Stock Status'}
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-600 uppercase">
                <tr>
                  <th className="px-4 py-3 rounded-l-lg">Item</th>
                  <th className="px-4 py-3">In Stock</th>
                  {showDetailed && <th className="px-4 py-3 text-blue-600">Total Sold</th>}
                  <th className="px-4 py-3">Direct Cost</th>
                  <th className="px-4 py-3">Overhead</th>
                  <th className="px-4 py-3 font-bold bg-slate-100">Eff. Cost</th>
                  <th className="px-4 py-3">Selling Price</th>
                  <th className="px-4 py-3">Stock Value</th>
                  {showDetailed && <th className="px-4 py-3 text-orange-600">Pending ₹</th>}
                  <th className="px-4 py-3 rounded-r-lg w-24"></th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(inventory).map(([name, data]) => {
                  const directCost = data.avgCost - storeOverheadPerKg;
                  return (
                    <tr key={name} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-800">{name}</td>
                      <td className={`px-4 py-3 ${data.weight < 10 ? 'text-red-600 font-bold' : ''}`}>
                        {Math.max(0, data.weight).toFixed(2)} kg
                      </td>
                      {showDetailed && (
                        <td className="px-4 py-3 text-blue-600 font-medium">
                          {data.soldWeight.toFixed(1)} kg
                        </td>
                      )}
                      <td className="px-4 py-3 text-slate-500">₹{directCost.toFixed(2)}</td>
                      <td className="px-4 py-3 text-slate-400 text-xs">+₹{storeOverheadPerKg.toFixed(2)}</td>
                      <td className="px-4 py-3 font-bold bg-blue-50 text-blue-800">₹{data.avgCost.toFixed(2)}</td>
                      <td className="px-4 py-3 text-slate-600">
                        {sellingPrices[name] != null ? (
                          <span className="font-medium text-emerald-700">₹{Number(sellingPrices[name]).toFixed(2)}<span className="text-slate-400 text-xs">/kg</span></span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-500">₹{Math.max(0, data.totalValue).toFixed(2)}</td>
                      {showDetailed && (
                        <td className="px-4 py-3 text-orange-600 font-medium">
                          {data.pendingValue > 0 ? `₹${data.pendingValue.toFixed(2)}` : '-'}
                        </td>
                      )}
                      <td className="px-4 py-3">
                        <Button
                          variant="outline"
                          className="text-xs py-1.5 px-2 gap-1"
                          onClick={() => openSellingPriceModal(name)}
                          title="Set selling price"
                        >
                          <IndianRupee size={14} />
                          <Pencil size={12} />
                          Set Price
                        </Button>
                      </td>
                    </tr>
                  );
                })}
                {Object.keys(inventory).length === 0 && (
                  <tr>
                    <td colSpan={showDetailed ? 10 : 8} className="text-center py-4 text-slate-400">
                      No inventory yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {sellingPriceModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={closeSellingPriceModal}>
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm mx-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-slate-800 mb-1">Set Selling Price</h3>
            <p className="text-sm text-slate-500 mb-4">Price per kg for <strong>{sellingPriceModalItem}</strong></p>
            <Input
              label="Selling Price (₹/kg)"
              type="number"
              step="0.01"
              min="0"
              value={sellingPriceInput}
              onChange={e => setSellingPriceInput(e.target.value)}
              placeholder="e.g. 150"
            />
            {inventory[sellingPriceModalItem] && (
              <p className="mt-2 text-xs text-slate-400">
                Effective cost: ₹{inventory[sellingPriceModalItem].avgCost.toFixed(2)}/kg
              </p>
            )}
            <div className="flex gap-2 mt-6">
              <Button variant="secondary" className="flex-1" onClick={closeSellingPriceModal}>Cancel</Button>
              <Button variant="primary" className="flex-1" onClick={saveSellingPrice}>Save</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
