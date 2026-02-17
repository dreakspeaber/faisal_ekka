import React, { useState } from 'react';
import { TrendingUp, Truck, DollarSign, Users, Settings, Trash2, Clock, Wallet } from 'lucide-react';
import { Card, Button, Input } from './src/fishStore/ui.js';
import { StoreProvider, useStore } from './src/fishStore/StoreContext.jsx';
import Dashboard from './src/fishStore/views/Dashboard.jsx';
import ShipmentManager from './src/fishStore/views/ShipmentManager.jsx';
import SalesPoint from './src/fishStore/views/SalesPoint.jsx';

function SettingsPanel() {
  const { storeSettings, setStoreSettings, totalMonthlyWages } = useStore();
  const totalMonthly = parseFloat(storeSettings.monthlyRent) + totalMonthlyWages;
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-purple-100 p-3 rounded-full text-purple-600">
          <Settings size={24} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-800">Store Configuration</h2>
          <p className="text-slate-500">Configure fixed costs and turnover time to calculate overheads.</p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <DollarSign size={18} /> Monthly Fixed Expenses (₹)
          </h3>
          <div className="space-y-4">
            <Input
              label="Store Rent"
              type="number"
              value={storeSettings.monthlyRent}
              onChange={e => setStoreSettings({ ...storeSettings, monthlyRent: e.target.value })}
            />
            <Input label="Total Staff Wages" type="number" value={totalMonthlyWages} readOnly={true} helperText="Automatically calculated from Staff Manager tab" />
            <div className="pt-4 border-t border-slate-100 flex justify-between font-bold text-slate-700">
              <span>Total Monthly</span>
              <span>₹{totalMonthly.toFixed(2)}</span>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <h3 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <Clock size={18} /> Capacity & Turnover
          </h3>
          <div className="space-y-4">
            <Input
              label="Avg Daily Inventory (kg)"
              type="number"
              value={storeSettings.avgDailyStock}
              onChange={e => setStoreSettings({ ...storeSettings, avgDailyStock: e.target.value })}
              helperText="Average weight of stock held in store"
            />
            <Input
              label="Avg Turnaround Time (Days)"
              type="number"
              value={storeSettings.avgTurnaroundDays}
              onChange={e => setStoreSettings({ ...storeSettings, avgTurnaroundDays: e.target.value })}
              helperText="How many days stock usually sits"
            />
          </div>
        </Card>
      </div>
    </div>
  );
}

function StaffManager() {
  const { staffList, setStaffList, staffTransactions, setStaffTransactions } = useStore();
  const [isAdding, setIsAdding] = useState(false);
  const [newStaff, setNewStaff] = useState({ name: '', role: '', salary: '', phone: '' });
  const [transForm, setTransForm] = useState({ staffId: '', type: 'Advance', amount: '', note: '' });

  const handleAddStaff = () => {
    if (!newStaff.name || !newStaff.salary) return;
    setStaffList([...staffList, { ...newStaff, id: Date.now() }]);
    setNewStaff({ name: '', role: '', salary: '', phone: '' });
    setIsAdding(false);
  };

  const handleDeleteStaff = id => setStaffList(staffList.filter(s => s.id !== id));

  const handleTransaction = () => {
    if (!transForm.staffId || !transForm.amount) return;
    setStaffTransactions([
      ...staffTransactions,
      { ...transForm, id: Date.now(), date: new Date().toISOString().split('T')[0] },
    ]);
    setTransForm({ staffId: '', type: 'Advance', amount: '', note: '' });
  };

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Users className="text-blue-600" /> Staff List
          </h2>
          <Button onClick={() => setIsAdding(!isAdding)}>{isAdding ? 'Cancel' : 'Add Staff'}</Button>
        </div>
        {isAdding && (
          <Card className="p-4 bg-blue-50 border-blue-100 mb-4">
            <h3 className="font-semibold mb-3 text-blue-800">New Employee Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
              <Input label="Name" value={newStaff.name} onChange={e => setNewStaff({ ...newStaff, name: e.target.value })} />
              <Input label="Role" value={newStaff.role} onChange={e => setNewStaff({ ...newStaff, role: e.target.value })} />
              <Input label="Monthly Salary (₹)" type="number" value={newStaff.salary} onChange={e => setNewStaff({ ...newStaff, salary: e.target.value })} />
              <Input label="Phone" value={newStaff.phone} onChange={e => setNewStaff({ ...newStaff, phone: e.target.value })} />
              <Button onClick={handleAddStaff} className="h-10">Save</Button>
            </div>
          </Card>
        )}
        <Card className="overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-600 uppercase">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Monthly Wage</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {staffList.map(staff => (
                <tr key={staff.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-800">{staff.name}</td>
                  <td className="px-4 py-3 text-slate-600">{staff.role}</td>
                  <td className="px-4 py-3 font-mono font-bold">₹{staff.salary}</td>
                  <td className="px-4 py-3 text-slate-500">{staff.phone}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => handleDeleteStaff(staff.id)} className="text-red-500 hover:text-red-700 p-1">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <Card className="p-6 h-full">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <Wallet className="text-emerald-600" size={18} /> Record Payment
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Staff Member</label>
                <select
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none bg-white"
                  value={transForm.staffId}
                  onChange={e => setTransForm({ ...transForm, staffId: e.target.value })}
                >
                  <option value="">Select Staff...</option>
                  {staffList.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Type</label>
                <div className="flex gap-2">
                  {['Advance', 'Salary', 'Bonus'].map(t => (
                    <button
                      key={t}
                      onClick={() => setTransForm({ ...transForm, type: t })}
                      className={`flex-1 py-2 text-sm rounded-lg border ${transForm.type === t ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-600 border-slate-300'}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <Input label="Amount (₹)" type="number" value={transForm.amount} onChange={e => setTransForm({ ...transForm, amount: e.target.value })} />
              <Input label="Note" value={transForm.note} onChange={e => setTransForm({ ...transForm, note: e.target.value })} placeholder="e.g. For festival" />
              <Button variant="success" className="w-full" onClick={handleTransaction}>Record Transaction</Button>
            </div>
          </Card>
        </div>
        <div className="md:col-span-2">
          <Card className="h-full flex flex-col">
            <div className="p-4 border-b border-slate-100">
              <h3 className="font-bold text-lg text-slate-800">Transaction History</h3>
            </div>
            <div className="flex-1 overflow-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-600 uppercase sticky top-0">
                  <tr>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Staff</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Note</th>
                    <th className="px-4 py-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {staffTransactions.slice().reverse().map(t => {
                    const staffMember = staffList.find(s => s.id == t.staffId);
                    return (
                      <tr key={t.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 text-slate-500">{t.date}</td>
                        <td className="px-4 py-3 font-medium text-slate-800">{staffMember ? staffMember.name : 'Unknown'}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs ${t.type === 'Advance' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>{t.type}</span>
                        </td>
                        <td className="px-4 py-3 text-slate-500 italic">{t.note}</td>
                        <td className="px-4 py-3 font-bold text-slate-800 text-right">₹{t.amount}</td>
                      </tr>
                    );
                  })}
                  {staffTransactions.length === 0 && (
                    <tr>
                      <td colSpan="5" className="p-4 text-center text-slate-400">No transactions recorded</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function FishStoreApp() {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <StoreProvider>
      <div className="min-h-screen bg-slate-50 font-sans text-slate-900 p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-2">
                <span className="text-blue-600">🐟</span> DC fish ledger
              </h1>
              <p className="text-slate-500">Fish Store Accounting & Inventory System</p>
            </div>
            <nav className="flex bg-white p-1 rounded-lg shadow-sm border border-slate-200 overflow-x-auto">
              {[
                { id: 'dashboard', icon: TrendingUp, label: 'Dashboard' },
                { id: 'shipments', icon: Truck, label: 'Shipments' },
                { id: 'sales', icon: DollarSign, label: 'Sales' },
                { id: 'staff', icon: Users, label: 'Staff Manager' },
                { id: 'settings', icon: Settings, label: 'Store Config' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${activeTab === tab.id ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                >
                  <tab.icon size={16} />
                  {tab.label}
                </button>
              ))}
            </nav>
          </header>
          <main>
            {activeTab === 'dashboard' && <Dashboard />}
            {activeTab === 'shipments' && <ShipmentManager />}
            {activeTab === 'sales' && <SalesPoint />}
            {activeTab === 'staff' && <StaffManager />}
            {activeTab === 'settings' && <SettingsPanel />}
          </main>
        </div>
      </div>
    </StoreProvider>
  );
}
