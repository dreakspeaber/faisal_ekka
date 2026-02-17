import React, { useState } from 'react';
import { ShoppingCart, List, CheckCircle, Clock3, Wallet, Edit2, Trash2, Users, ChevronDown, ChevronRight } from 'lucide-react';
import { Card, Button, Input } from '../ui';
import { useStore } from '../StoreContext';
import { CUSTOMER_TYPES, detectCustomerType, filterSales, groupSalesByCustomer } from '../utils/salesUtils';

function CustomerTypeBadge({ type }) {
  const styles = {
    'Walk-in': 'bg-slate-100 text-slate-700',
    Hotel: 'bg-amber-100 text-amber-800',
    Wholesale: 'bg-indigo-100 text-indigo-800',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${styles[type] || styles['Walk-in']}`}>
      {type}
    </span>
  );
}

export default function SalesPoint() {
  const { inventory, storeOverheadPerKg, storeSettings, clients, setClients, sales, setSales, paymentHistory, setPaymentHistory } = useStore();
  const [newSale, setNewSale] = useState({
    clientName: '',
    customerType: '',
    itemName: '',
    weight: '',
    price: '',
    status: 'Pending',
    discountPercent: '',
    discountAmount: ''
  });
  const availableItems = Object.keys(inventory);

  const [isAddingClient, setIsAddingClient] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterCustomerType, setFilterCustomerType] = useState('All');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [viewMode, setViewMode] = useState('flat'); // 'flat' | 'grouped'
  const [expandedCustomers, setExpandedCustomers] = useState(new Set());
  const [expandedPayments, setExpandedPayments] = useState(new Set());
  const [payingSaleId, setPayingSaleId] = useState(null);
  const [paymentForm, setPaymentForm] = useState({ amount: '', paymentMode: 'Cash', note: '' });
  const [editingPaymentId, setEditingPaymentId] = useState(null);

  const getCostPrice = () => {
    if (!newSale.itemName) return 0;
    return inventory[newSale.itemName] ? inventory[newSale.itemName].avgCost : 0;
  };

  const addClient = () => {
    if (newClientName) {
      setClients([...clients, { id: Date.now(), name: newClientName }]);
      const detected = detectCustomerType(newClientName);
      setNewSale({ ...newSale, clientName: newClientName, customerType: detected });
      setNewClientName('');
      setIsAddingClient(false);
    }
  };

  const calculatePaymentStatus = (saleId, finalAmount) => {
    const amountPaid = paymentHistory
      .filter(p => p.saleId === saleId)
      .reduce((sum, p) => sum + parseFloat(p.amount), 0);
    if (amountPaid >= finalAmount) return { status: 'Paid', amountPaid, amountPending: 0 };
    if (amountPaid > 0) return { status: 'Partial', amountPaid, amountPending: finalAmount - amountPaid };
    return { status: 'Pending', amountPaid: 0, amountPending: finalAmount };
  };

  const handleSell = () => {
    if (!newSale.clientName || !newSale.itemName || !newSale.weight || !newSale.price) return;
    if (inventory[newSale.itemName].weight < parseFloat(newSale.weight)) return;

    const originalAmount = parseFloat(newSale.weight) * parseFloat(newSale.price);
    const discountAmount = parseFloat(newSale.discountAmount) || 0;
    const finalAmount = originalAmount - discountAmount;
    const saleId = Date.now();

    let initialAmountPaid = 0;
    if (newSale.status === 'Paid') {
      initialAmountPaid = finalAmount;
      setPaymentHistory(prev => [
        ...prev,
        {
          id: Date.now(),
          saleId,
          date: new Date().toISOString().split('T')[0],
          amount: finalAmount,
          paymentMode: 'Cash',
          note: 'Initial payment'
        }
      ]);
    }

    const paymentStatus =
      newSale.status === 'Paid'
        ? { status: 'Paid', amountPaid: finalAmount, amountPending: 0 }
        : { status: newSale.status, amountPaid: initialAmountPaid, amountPending: finalAmount - initialAmountPaid };

    const customerType = newSale.customerType || detectCustomerType(newSale.clientName);
    setSales([
      ...sales,
      {
        ...newSale,
        customerType,
        originalAmount,
        discountAmount,
        discountPercent: parseFloat(newSale.discountPercent) || 0,
        finalAmount,
        amountPaid: paymentStatus.amountPaid,
        amountPending: paymentStatus.amountPending,
        status: paymentStatus.status,
        id: saleId,
        date: new Date().toLocaleDateString(),
        createdAt: new Date().toISOString()
      }
    ]);
    setNewSale({
      clientName: '',
      customerType: '',
      itemName: '',
      weight: '',
      price: '',
      status: 'Pending',
      discountPercent: '',
      discountAmount: ''
    });
  };

  const handleDiscountPercentChange = (percent) => {
    const percentValue = parseFloat(percent) || 0;
    if (percentValue < 0 || percentValue > 100) return;
    const originalAmount = (parseFloat(newSale.weight) || 0) * (parseFloat(newSale.price) || 0);
    const discountAmount = (originalAmount * percentValue) / 100;
    setNewSale({ ...newSale, discountPercent: percent, discountAmount: discountAmount.toFixed(2) });
  };

  const handleDiscountAmountChange = (amount) => {
    const amountValue = parseFloat(amount) || 0;
    const originalAmount = (parseFloat(newSale.weight) || 0) * (parseFloat(newSale.price) || 0);
    if (amountValue < 0 || amountValue > originalAmount) return;
    const discountPercent = originalAmount > 0 ? (amountValue / originalAmount) * 100 : 0;
    setNewSale({ ...newSale, discountAmount: amount, discountPercent: discountPercent.toFixed(2) });
  };

  const handleAddPayment = (saleId) => {
    const sale = sales.find(s => s.id === saleId);
    if (!sale || !paymentForm.amount || parseFloat(paymentForm.amount) <= 0) return;
    const paymentAmount = parseFloat(paymentForm.amount);
    const currentPending = sale.amountPending ?? sale.finalAmount - (sale.amountPaid || 0);
    if (paymentAmount > currentPending) {
      alert(`Payment amount cannot exceed pending amount of ₹${currentPending.toFixed(2)}`);
      return;
    }
    const newPayment = {
      id: Date.now(),
      saleId,
      date: new Date().toISOString().split('T')[0],
      amount: paymentAmount,
      paymentMode: paymentForm.paymentMode,
      note: paymentForm.note || ''
    };
    setPaymentHistory(prev => [...prev, newPayment]);
    const updatedAmountPaid = (sale.amountPaid || 0) + paymentAmount;
    const updatedAmountPending = sale.finalAmount - updatedAmountPaid;
    let updatedStatus = 'Pending';
    if (updatedAmountPaid >= sale.finalAmount) updatedStatus = 'Paid';
    else if (updatedAmountPaid > 0) updatedStatus = 'Partial';
    setSales(prev =>
      prev.map(s =>
        s.id === saleId ? { ...s, amountPaid: updatedAmountPaid, amountPending: updatedAmountPending, status: updatedStatus } : s
      )
    );
    setPaymentForm({ amount: '', paymentMode: 'Cash', note: '' });
    setPayingSaleId(null);
  };

  const handleEditPayment = (paymentId) => {
    const payment = paymentHistory.find(p => p.id === paymentId);
    if (payment) {
      setPaymentForm({ amount: payment.amount.toString(), paymentMode: payment.paymentMode, note: payment.note });
      setEditingPaymentId(paymentId);
      setPayingSaleId(payment.saleId);
    }
  };

  const handleUpdatePayment = () => {
    if (!editingPaymentId || !paymentForm.amount) return;
    const payment = paymentHistory.find(p => p.id === editingPaymentId);
    if (!payment) return;
    const sale = sales.find(s => s.id === payment.saleId);
    if (!sale) return;
    const oldAmount = parseFloat(payment.amount);
    const newAmount = parseFloat(paymentForm.amount);
    const difference = newAmount - oldAmount;
    const currentPending = sale.amountPending ?? sale.finalAmount - (sale.amountPaid || 0);
    if (difference > currentPending) {
      alert('Payment increase cannot exceed pending amount');
      return;
    }
    setPaymentHistory(prev =>
      prev.map(p =>
        p.id === editingPaymentId ? { ...p, amount: newAmount, paymentMode: paymentForm.paymentMode, note: paymentForm.note } : p
      )
    );
    const updatedAmountPaid = (sale.amountPaid || 0) + difference;
    const updatedAmountPending = sale.finalAmount - updatedAmountPaid;
    let updatedStatus = 'Pending';
    if (updatedAmountPaid >= sale.finalAmount) updatedStatus = 'Paid';
    else if (updatedAmountPaid > 0) updatedStatus = 'Partial';
    setSales(prev =>
      prev.map(s =>
        s.id === payment.saleId ? { ...s, amountPaid: updatedAmountPaid, amountPending: updatedAmountPending, status: updatedStatus } : s
      )
    );
    setPaymentForm({ amount: '', paymentMode: 'Cash', note: '' });
    setEditingPaymentId(null);
    setPayingSaleId(null);
  };

  const handleDeletePayment = (paymentId) => {
    if (!confirm('Are you sure you want to delete this payment entry?')) return;
    const payment = paymentHistory.find(p => p.id === paymentId);
    if (!payment) return;
    const sale = sales.find(s => s.id === payment.saleId);
    if (!sale) return;
    setPaymentHistory(prev => prev.filter(p => p.id !== paymentId));
    const updatedAmountPaid = Math.max(0, (sale.amountPaid || 0) - parseFloat(payment.amount));
    const updatedAmountPending = sale.finalAmount - updatedAmountPaid;
    let updatedStatus = 'Pending';
    if (updatedAmountPaid >= sale.finalAmount) updatedStatus = 'Paid';
    else if (updatedAmountPaid > 0) updatedStatus = 'Partial';
    setSales(prev =>
      prev.map(s =>
        s.id === payment.saleId ? { ...s, amountPaid: updatedAmountPaid, amountPending: updatedAmountPending, status: updatedStatus } : s
      )
    );
  };

  const togglePaymentHistory = (saleId) => {
    setExpandedPayments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(saleId)) newSet.delete(saleId);
      else newSet.add(saleId);
      return newSet;
    });
  };

  const effectiveCost = getCostPrice();
  const sellingPrice = parseFloat(newSale.price) || 0;
  const profitPerKg = sellingPrice - effectiveCost;
  const totalProfit = profitPerKg * (parseFloat(newSale.weight) || 0);

  const salesWithPayments = sales.map(sale => {
    const paymentStatus = calculatePaymentStatus(sale.id, sale.finalAmount);
    const customerType = sale.customerType || detectCustomerType(sale.clientName);
    return { ...sale, customerType, amountPaid: paymentStatus.amountPaid, amountPending: paymentStatus.amountPending, status: paymentStatus.status };
  });

  const filteredSales = filterSales(salesWithPayments, { filterStatus, filterCustomerType, dateFrom, dateTo });

  const toggleCustomerGroup = (clientName) => {
    setExpandedCustomers(prev => {
      const next = new Set(prev);
      if (next.has(clientName)) next.delete(clientName);
      else next.add(clientName);
      return next;
    });
  };

  const salesByCustomer = React.useMemo(() => groupSalesByCustomer(filteredSales), [filteredSales]);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
            <ShoppingCart className="text-blue-600" /> New Sale
          </h2>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Client</label>
              {isAddingClient ? (
                <div className="flex gap-2">
                  <input
                    autoFocus
                    className="w-full px-3 py-2 border border-blue-500 rounded-lg outline-none"
                    placeholder="Enter new client name"
                    value={newClientName}
                    onChange={e => setNewClientName(e.target.value)}
                  />
                  <Button onClick={addClient} variant="success">Add</Button>
                  <Button onClick={() => setIsAddingClient(false)} variant="secondary">X</Button>
                </div>
              ) : (
                <select
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none bg-white"
                  value={newSale.clientName}
                  onChange={e => {
                    if (e.target.value === '__NEW__') setIsAddingClient(true);
                    else {
                      const name = e.target.value;
                      setNewSale({ ...newSale, clientName: name, customerType: detectCustomerType(name) });
                    }
                  }}
                >
                  <option value="">Select Client...</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                  <option value="__NEW__" className="font-bold text-blue-600">+ Add New Client</option>
                </select>
              )}
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Customer Type</label>
              <select
                className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none bg-white"
                value={newSale.customerType || detectCustomerType(newSale.clientName)}
                onChange={e => setNewSale({ ...newSale, customerType: e.target.value })}
              >
                {CUSTOMER_TYPES.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Fish Stock</label>
              <select
                className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none"
                value={newSale.itemName}
                onChange={e => setNewSale({ ...newSale, itemName: e.target.value })}
              >
                <option value="">Select Item...</option>
                {availableItems.map(item => (
                  <option key={item} value={item}>
                    {item} (Avail: {inventory[item].weight.toFixed(1)}kg)
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input label="Weight (kg)" type="number" value={newSale.weight} onChange={e => setNewSale({ ...newSale, weight: e.target.value })} />
              <Input label="Selling Price (₹/kg)" type="number" value={newSale.price} onChange={e => setNewSale({ ...newSale, price: e.target.value })} />
            </div>

            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 space-y-3">
              <h4 className="text-xs font-semibold text-orange-800 uppercase">Discount (Optional)</h4>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Discount (%)" type="number" step="0.01" value={newSale.discountPercent} onChange={e => handleDiscountPercentChange(e.target.value)} placeholder="0" helperText="0-100%" />
                <Input label="Discount Amount (₹)" type="number" step="0.01" value={newSale.discountAmount} onChange={e => handleDiscountAmountChange(e.target.value)} placeholder="0.00" />
              </div>
              {newSale.weight && newSale.price && (
                <div className="text-sm space-y-1 pt-2 border-t border-orange-200">
                  <div className="flex justify-between text-slate-600">
                    <span>Original Total:</span>
                    <span className="font-mono">₹{((parseFloat(newSale.weight) || 0) * (parseFloat(newSale.price) || 0)).toFixed(2)}</span>
                  </div>
                  {newSale.discountAmount && parseFloat(newSale.discountAmount) > 0 && (
                    <>
                      <div className="flex justify-between text-orange-600">
                        <span>Discount:</span>
                        <span className="font-mono">- ₹{parseFloat(newSale.discountAmount).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-slate-800 font-bold pt-1 border-t border-orange-200">
                        <span>Final Total:</span>
                        <span className="font-mono">₹{(((parseFloat(newSale.weight) || 0) * (parseFloat(newSale.price) || 0)) - (parseFloat(newSale.discountAmount) || 0)).toFixed(2)}</span>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Payment Status</label>
              <div className="flex gap-2">
                {['Paid', 'Pending', 'Partial'].map(status => (
                  <button
                    key={status}
                    onClick={() => setNewSale({ ...newSale, status })}
                    className={`px-3 py-1 text-sm rounded-full border ${newSale.status === status ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-300'}`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            <Button className="w-full justify-center mt-4" onClick={handleSell}>
              Confirm Sale
            </Button>
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="p-6 bg-slate-900 text-white h-full">
            <h3 className="font-bold text-lg mb-6">Transaction Analysis</h3>
            {newSale.itemName ? (
              <div className="space-y-6">
                <div className="flex justify-between items-center pb-4 border-b border-slate-700">
                  <span className="text-slate-400">Total Effective Cost</span>
                  <span className="font-mono text-xl text-white">₹{effectiveCost.toFixed(2)}<span className="text-sm text-slate-500">/kg</span></span>
                </div>
                <div className="text-xs text-slate-500 space-y-1 mb-4">
                  <div className="flex justify-between">
                    <span>Landed Cost (Shipment):</span>
                    <span>₹{(effectiveCost - storeOverheadPerKg).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-purple-400">
                    <span>Store Overhead ({storeSettings.avgTurnaroundDays} days):</span>
                    <span>₹{storeOverheadPerKg.toFixed(2)}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center pb-4 border-b border-slate-700">
                  <span className="text-slate-400">Selling Price</span>
                  <span className="font-mono text-xl text-blue-400">₹{sellingPrice.toFixed(2)}<span className="text-sm text-slate-500">/kg</span></span>
                </div>
                <div className="bg-slate-800 p-4 rounded-lg">
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-slate-400">Net Margin / kg</span>
                    <span className={`font-bold ${profitPerKg >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>₹{profitPerKg.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-slate-700">
                    <span className="text-sm text-slate-300">Total Net Profit</span>
                    <span className={`font-bold text-lg ${totalProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>₹{totalProfit.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-600 italic">Select an item to see profit analysis</div>
            )}
          </Card>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <List className="text-slate-600" /> Sales History
            </h2>
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-sm text-slate-500 font-medium">{filteredSales.length} result{filteredSales.length !== 1 ? 's' : ''}</span>
              <div className="flex gap-2 bg-white p-1 rounded-lg border border-slate-200">
                <button
                  onClick={() => setViewMode('flat')}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${viewMode === 'flat' ? 'bg-slate-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  Flat
                </button>
                <button
                  onClick={() => setViewMode('grouped')}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors flex items-center gap-1 ${viewMode === 'grouped' ? 'bg-slate-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  <Users size={12} /> Group by Customer
                </button>
              </div>
            </div>
          </div>

          <Card className="p-4 border border-slate-200">
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Filters</h4>
            <div className="flex flex-wrap items-end gap-4">
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Customer Type</label>
                <div className="flex gap-1 bg-slate-50 p-1 rounded-lg">
                  {['All', ...CUSTOMER_TYPES].map(f => (
                    <button
                      key={f}
                      onClick={() => setFilterCustomerType(f)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${filterCustomerType === f ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Payment Status</label>
                <div className="flex gap-1 bg-slate-50 p-1 rounded-lg">
                  {['All', 'Paid', 'Partial', 'Pending'].map(f => (
                    <button
                      key={f}
                      onClick={() => setFilterStatus(f)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${filterStatus === f ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex flex-wrap items-end gap-2">
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">From date</label>
                  <input
                    type="date"
                    className="px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none"
                    value={dateFrom}
                    onChange={e => setDateFrom(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">To date</label>
                  <input
                    type="date"
                    className="px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none"
                    value={dateTo}
                    onChange={e => setDateTo(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </Card>
        </div>

        {viewMode === 'grouped' ? (
          <div className="space-y-3">
            {salesByCustomer.length === 0 ? (
              <Card className="p-8 text-center text-slate-400 italic">No sales match the current filters.</Card>
            ) : (
              salesByCustomer.map(group => {
                const isExpanded = expandedCustomers.has(group.clientName);
                return (
                  <Card key={group.clientName} className="overflow-hidden border border-slate-200">
                    <button
                      type="button"
                      className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors"
                      onClick={() => toggleCustomerGroup(group.clientName)}
                    >
                      <div className="flex items-center gap-3">
                        {isExpanded ? <ChevronDown size={18} className="text-slate-500" /> : <ChevronRight size={18} className="text-slate-500" />}
                        <span className="font-semibold text-slate-800">{group.clientName}</span>
                        <CustomerTypeBadge type={group.customerType} />
                      </div>
                      <div className="flex items-center gap-6 text-sm">
                        <span className="text-slate-500">{group.sales.length} transaction{group.sales.length !== 1 ? 's' : ''}</span>
                        <span className="font-medium text-slate-800">₹{group.totalAmount.toFixed(2)} total</span>
                        {group.totalPending > 0 && (
                          <span className="font-medium text-red-600">₹{group.totalPending.toFixed(2)} pending</span>
                        )}
                      </div>
                    </button>
                    {isExpanded && (
                      <div className="border-t border-slate-100 bg-slate-50/50">
                        <table className="w-full text-sm text-left">
                          <thead className="bg-slate-100/80 text-slate-600 uppercase text-xs">
                            <tr>
                              <th className="px-4 py-2">Date</th>
                              <th className="px-4 py-2">Item</th>
                              <th className="px-4 py-2">Weight</th>
                              <th className="px-4 py-2">Price/kg</th>
                              <th className="px-4 py-2">Final Total</th>
                              <th className="px-4 py-2">Paid</th>
                              <th className="px-4 py-2">Pending</th>
                              <th className="px-4 py-2 text-right">Status</th>
                              <th className="px-4 py-2 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {group.sales.slice().reverse().map(sale => {
                              const originalAmt = sale.originalAmount ?? sale.weight * sale.price;
                              const discountAmt = sale.discountAmount || 0;
                              const finalAmt = sale.finalAmount ?? originalAmt;
                              const amountPaid = sale.amountPaid ?? 0;
                              const amountPending = sale.amountPending ?? finalAmt;
                              const salePayments = paymentHistory.filter(p => p.saleId === sale.id);
                              const isPayExpanded = expandedPayments.has(sale.id);
                              const isPaying = payingSaleId === sale.id;
                              return (
                                <React.Fragment key={sale.id}>
                                  <tr className="hover:bg-white/80">
                                    <td className="px-4 py-2 text-slate-500">{sale.date}</td>
                                    <td className="px-4 py-2 text-slate-600">{sale.itemName}</td>
                                    <td className="px-4 py-2">{sale.weight} kg</td>
                                    <td className="px-4 py-2">₹{sale.price}</td>
                                    <td className="px-4 py-2 font-bold text-slate-800">₹{finalAmt.toFixed(2)}</td>
                                    <td className="px-4 py-2 text-green-600 font-medium">₹{amountPaid.toFixed(2)}</td>
                                    <td className="px-4 py-2 text-red-600 font-medium">₹{amountPending.toFixed(2)}</td>
                                    <td className="px-4 py-2 text-right">
                                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${sale.status === 'Paid' ? 'bg-green-100 text-green-700' : sale.status === 'Pending' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                                        {sale.status}
                                      </span>
                                    </td>
                                    <td className="px-4 py-2 text-right">
                                      <div className="flex items-center justify-end gap-2">
                                        {sale.status !== 'Paid' && (
                                          <Button variant="success" className="text-xs px-2 py-1" onClick={() => { setPayingSaleId(sale.id); setPaymentForm({ amount: amountPending.toFixed(2), paymentMode: 'Cash', note: '' }); }}>
                                            Pay
                                          </Button>
                                        )}
                                        <button onClick={() => togglePaymentHistory(sale.id)} className="text-blue-600 hover:text-blue-800 text-xs px-2 py-1">
                                          {isPayExpanded ? 'Hide' : 'View'} Payments ({salePayments.length})
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                  {isPaying && (
                                    <tr className="bg-blue-50">
                                      <td colSpan="9" className="px-4 py-4">
                                        <div className="bg-white rounded-lg p-4 border border-blue-200">
                                          <h4 className="font-semibold text-slate-800 mb-3">{editingPaymentId ? 'Edit Payment' : 'Record Payment'}</h4>
                                          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                                            <Input label="Amount (₹)" type="number" step="0.01" value={paymentForm.amount} onChange={e => setPaymentForm({ ...paymentForm, amount: e.target.value })} placeholder={amountPending.toFixed(2)} />
                                            <div>
                                              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Payment Mode</label>
                                              <select className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none" value={paymentForm.paymentMode} onChange={e => setPaymentForm({ ...paymentForm, paymentMode: e.target.value })}>
                                                <option value="Cash">Cash</option>
                                                <option value="GPay">GPay</option>
                                                <option value="Other">Other</option>
                                              </select>
                                            </div>
                                            <Input label="Note" value={paymentForm.note} onChange={e => setPaymentForm({ ...paymentForm, note: e.target.value })} placeholder="Optional note" />
                                            <div className="flex items-end gap-2">
                                              <Button variant="success" onClick={editingPaymentId ? handleUpdatePayment : () => handleAddPayment(sale.id)} className="flex-1">{editingPaymentId ? 'Update' : 'Save'}</Button>
                                              <Button variant="secondary" onClick={() => { setPayingSaleId(null); setEditingPaymentId(null); setPaymentForm({ amount: '', paymentMode: 'Cash', note: '' }); }}>Cancel</Button>
                                            </div>
                                          </div>
                                        </div>
                                      </td>
                                    </tr>
                                  )}
                                  {isPayExpanded && (
                                    <tr className="bg-slate-50">
                                      <td colSpan="9" className="px-4 py-4">
                                        <div className="bg-white rounded-lg p-4 border border-slate-200">
                                          <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2"><Wallet size={16} /> Payment History</h4>
                                          {salePayments.length > 0 ? (
                                            <div className="space-y-2">
                                              <table className="w-full text-xs">
                                                <thead className="bg-slate-50"><tr><th className="px-3 py-2 text-left">Date</th><th className="px-3 py-2 text-left">Amount</th><th className="px-3 py-2 text-left">Mode</th><th className="px-3 py-2 text-left">Note</th><th className="px-3 py-2 text-right">Actions</th></tr></thead>
                                                <tbody className="divide-y divide-slate-100">
                                                  {salePayments.map(payment => (
                                                    <tr key={payment.id} className="hover:bg-slate-50">
                                                      <td className="px-3 py-2">{payment.date}</td>
                                                      <td className="px-3 py-2 font-medium">₹{parseFloat(payment.amount).toFixed(2)}</td>
                                                      <td className="px-3 py-2"><span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">{payment.paymentMode}</span></td>
                                                      <td className="px-3 py-2 text-slate-500 italic">{payment.note || '-'}</td>
                                                      <td className="px-3 py-2 text-right">
                                                        <div className="flex justify-end gap-1">
                                                          <button onClick={() => handleEditPayment(payment.id)} className="text-blue-600 hover:text-blue-800 p-1" title="Edit"><Edit2 size={14} /></button>
                                                          <button onClick={() => handleDeletePayment(payment.id)} className="text-red-600 hover:text-red-800 p-1" title="Delete"><Trash2 size={14} /></button>
                                                        </div>
                                                      </td>
                                                    </tr>
                                                  ))}
                                                </tbody>
                                              </table>
                                            </div>
                                          ) : (
                                            <p className="text-slate-400 italic text-sm">No payment history recorded</p>
                                          )}
                                        </div>
                                      </td>
                                    </tr>
                                  )}
                                </React.Fragment>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </Card>
                );
              })
            )}
          </div>
        ) : (
        <Card className="overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-600 uppercase">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Item</th>
                <th className="px-4 py-3">Weight</th>
                <th className="px-4 py-3">Price/kg</th>
                <th className="px-4 py-3">Original</th>
                <th className="px-4 py-3">Discount</th>
                <th className="px-4 py-3">Final Total</th>
                <th className="px-4 py-3">Paid</th>
                <th className="px-4 py-3">Pending</th>
                <th className="px-4 py-3 text-right">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSales.slice().reverse().map(sale => {
                const originalAmt = sale.originalAmount ?? sale.weight * sale.price;
                const discountAmt = sale.discountAmount || 0;
                const finalAmt = sale.finalAmount ?? originalAmt;
                const amountPaid = sale.amountPaid ?? 0;
                const amountPending = sale.amountPending ?? finalAmt;
                const salePayments = paymentHistory.filter(p => p.saleId === sale.id);
                const isExpanded = expandedPayments.has(sale.id);
                const isPaying = payingSaleId === sale.id;
                return (
                  <React.Fragment key={sale.id}>
                    <tr className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-slate-500">{sale.date}</td>
                      <td className="px-4 py-3 font-medium text-slate-800">{sale.clientName}</td>
                      <td className="px-4 py-3"><CustomerTypeBadge type={sale.customerType} /></td>
                      <td className="px-4 py-3 text-slate-600">{sale.itemName}</td>
                      <td className="px-4 py-3">{sale.weight} kg</td>
                      <td className="px-4 py-3">₹{sale.price}</td>
                      <td className="px-4 py-3 text-slate-600">₹{originalAmt.toFixed(2)}</td>
                      <td className="px-4 py-3">{discountAmt > 0 ? <span className="text-orange-600 font-medium">- ₹{discountAmt.toFixed(2)}</span> : <span className="text-slate-400">-</span>}</td>
                      <td className="px-4 py-3 font-bold text-slate-800">₹{finalAmt.toFixed(2)}</td>
                      <td className="px-4 py-3 text-green-600 font-medium">₹{amountPaid.toFixed(2)}</td>
                      <td className="px-4 py-3 text-red-600 font-medium">₹{amountPending.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${sale.status === 'Paid' ? 'bg-green-100 text-green-700' : sale.status === 'Pending' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                          {sale.status === 'Paid' ? <CheckCircle size={10} /> : <Clock3 size={10} />}
                          {sale.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {sale.status !== 'Paid' && (
                            <Button
                              variant="success"
                              className="text-xs px-2 py-1"
                              onClick={() => {
                                setPayingSaleId(sale.id);
                                setPaymentForm({ amount: amountPending.toFixed(2), paymentMode: 'Cash', note: '' });
                              }}
                            >
                              Pay
                            </Button>
                          )}
                          <button onClick={() => togglePaymentHistory(sale.id)} className="text-blue-600 hover:text-blue-800 text-xs px-2 py-1">
                            {isExpanded ? 'Hide' : 'View'} Payments ({salePayments.length})
                          </button>
                        </div>
                      </td>
                    </tr>

                    {isPaying && (
                      <tr className="bg-blue-50">
                        <td colSpan="13" className="px-4 py-4">
                          <div className="bg-white rounded-lg p-4 border border-blue-200">
                            <h4 className="font-semibold text-slate-800 mb-3">{editingPaymentId ? 'Edit Payment' : 'Record Payment'}</h4>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                              <Input label="Amount (₹)" type="number" step="0.01" value={paymentForm.amount} onChange={e => setPaymentForm({ ...paymentForm, amount: e.target.value })} placeholder={amountPending.toFixed(2)} />
                              <div>
                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Payment Mode</label>
                                <select className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none" value={paymentForm.paymentMode} onChange={e => setPaymentForm({ ...paymentForm, paymentMode: e.target.value })}>
                                  <option value="Cash">Cash</option>
                                  <option value="GPay">GPay</option>
                                  <option value="Other">Other</option>
                                </select>
                              </div>
                              <Input label="Note" value={paymentForm.note} onChange={e => setPaymentForm({ ...paymentForm, note: e.target.value })} placeholder="Optional note" />
                              <div className="flex items-end gap-2">
                                <Button variant="success" onClick={editingPaymentId ? handleUpdatePayment : () => handleAddPayment(sale.id)} className="flex-1">
                                  {editingPaymentId ? 'Update' : 'Save'}
                                </Button>
                                <Button
                                  variant="secondary"
                                  onClick={() => {
                                    setPayingSaleId(null);
                                    setEditingPaymentId(null);
                                    setPaymentForm({ amount: '', paymentMode: 'Cash', note: '' });
                                  }}
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}

                    {isExpanded && (
                      <tr className="bg-slate-50">
                        <td colSpan="13" className="px-4 py-4">
                          <div className="bg-white rounded-lg p-4 border border-slate-200">
                            <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                              <Wallet size={16} /> Payment History
                            </h4>
                            {salePayments.length > 0 ? (
                              <div className="space-y-2">
                                <table className="w-full text-xs">
                                  <thead className="bg-slate-50">
                                    <tr>
                                      <th className="px-3 py-2 text-left">Date</th>
                                      <th className="px-3 py-2 text-left">Amount</th>
                                      <th className="px-3 py-2 text-left">Mode</th>
                                      <th className="px-3 py-2 text-left">Note</th>
                                      <th className="px-3 py-2 text-right">Actions</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100">
                                    {salePayments.map(payment => (
                                      <tr key={payment.id} className="hover:bg-slate-50">
                                        <td className="px-3 py-2">{payment.date}</td>
                                        <td className="px-3 py-2 font-medium">₹{parseFloat(payment.amount).toFixed(2)}</td>
                                        <td className="px-3 py-2">
                                          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">{payment.paymentMode}</span>
                                        </td>
                                        <td className="px-3 py-2 text-slate-500 italic">{payment.note || '-'}</td>
                                        <td className="px-3 py-2 text-right">
                                          <div className="flex justify-end gap-1">
                                            <button onClick={() => handleEditPayment(payment.id)} className="text-blue-600 hover:text-blue-800 p-1" title="Edit">
                                              <Edit2 size={14} />
                                            </button>
                                            <button onClick={() => handleDeletePayment(payment.id)} className="text-red-600 hover:text-red-800 p-1" title="Delete">
                                              <Trash2 size={14} />
                                            </button>
                                          </div>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            ) : (
                              <p className="text-slate-400 italic text-sm">No payment history recorded</p>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
              {filteredSales.length === 0 && (
                <tr>
                  <td colSpan="13" className="px-4 py-8 text-center text-slate-400 italic">No sales found for this filter.</td>
                </tr>
              )}
            </tbody>
          </table>
        </Card>
        )}
      </div>
    </div>
  );
}
