import React, { useState, useMemo } from 'react';
import { Package, DollarSign, Users, ShoppingCart, TrendingUp, Truck, Plus, Trash2, ArrowRight, Save, Activity, Settings, Clock, List, Filter, CheckCircle, Clock3, User, Wallet, Eye, EyeOff, Edit2, XCircle, LogOut, Bell, Phone } from 'lucide-react';

// --- Components ---

const Card = ({ children, className = "" }) => (
  <div className={`bg-white rounded-xl shadow-sm border border-slate-200 ${className}`}>
    {children}
  </div>
);

const Button = ({ children, onClick, variant = "primary", className = "", disabled = false, title = "" }) => {
  const baseStyle = "px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 justify-center";
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 active:scale-95",
    secondary: "bg-slate-100 text-slate-700 hover:bg-slate-200",
    danger: "bg-red-50 text-red-600 hover:bg-red-100",
    outline: "border border-slate-300 text-slate-600 hover:bg-slate-50",
    success: "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
  };
  return (
    <button 
      onClick={onClick} 
      disabled={disabled}
      title={title}
      className={`${baseStyle} ${variants[variant]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
    >
      {children}
    </button>
  );
};

const Input = ({ label, type = "text", value, onChange, placeholder, className = "", step, helperText, readOnly = false }) => (
  <div className={`flex flex-col gap-1 ${className}`}>
    {label && <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</label>}
    <input
      type={type}
      step={step}
      value={value}
      onChange={onChange}
      readOnly={readOnly}
      placeholder={placeholder}
      className={`w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors ${readOnly ? 'bg-slate-100 text-slate-700 cursor-not-allowed' : 'bg-slate-600 text-white'}`}
    />
    {helperText && <span className="text-xs text-slate-400">{helperText}</span>}
  </div>
);

// --- Main Application ---

export default function FishStoreApp({ onLogout }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Store Configuration for Indirect Costs
  const [storeSettings, setStoreSettings] = useState({
    monthlyRent: 15000,
    // monthlyWages is now derived from staff list, but kept here for fallback or caching if needed
    avgDailyStock: 500, // kg capacity
    avgTurnaroundDays: 5, // days
  });

  // Master Data State
  const [fishTypes, setFishTypes] = useState(["Mathi", "Ayila", "Chembali", "Ayikora"]);
  const [clients, setClients] = useState([
    { id: 1, name: "Local Market Hotel" },
    { id: 2, name: "Catering Service A" },
    { id: 3, name: "Walk-in Customer" }
  ]);

  // Staff Data State
  const [staffList, setStaffList] = useState([
    { id: 1, name: "Ramesh", role: "Helper", salary: 12000, phone: "9876543210" },
    { id: 2, name: "Suresh", role: "Cleaner", salary: 8000, phone: "9876543211" },
    { id: 3, name: "Manager", role: "Admin", salary: 15000, phone: "9876543212" }
  ]);
  
  const [staffTransactions, setStaffTransactions] = useState([
    { id: 1, staffId: 1, date: "2023-10-01", type: "Salary", amount: 12000, note: "October Salary" },
    { id: 2, staffId: 2, date: "2023-10-15", type: "Advance", amount: 2000, note: "Festival Advance" }
  ]);

  // Data State
  const [shipments, setShipments] = useState([
    {
      id: 1,
      supplier: "Harbour Fresh Catch",
      date: "2023-10-24",
      items: [
        { id: 101, name: "Mathi", weight: 100, cost: 12000 },    // 120/kg
        { id: 102, name: "Ayila", weight: 50, cost: 11000 },     // 220/kg
        { id: 103, name: "Chembali", weight: 30, cost: 10500 },  // 350/kg
        { id: 104, name: "Ayikora", weight: 20, cost: 14000 }    // 700/kg
      ],
      expenses: [
        { id: 201, type: "Driver/Tempo", amount: 2500 },
        { id: 202, type: "Ice & Box", amount: 1000 },
        { id: 203, type: "Unloading Wages", amount: 500 }
      ],
      status: "Delivered",
      trackingId: "",
      notes: "",
      isFinalized: true
    }
  ]);

  const [sales, setSales] = useState([]);

  // Simple daily cash controls for dashboard summary
  const [pettyCash, setPettyCash] = useState(0);
  const [dailyExpenses, setDailyExpenses] = useState(0);

  // --- Calculations ---

  // Helper: Get Auto-generated Shipment Name
  const getAutoShipmentName = () => {
    const date = new Date();
    const day = date.getDate().toString().padStart(2, '0');
    const month = date.toLocaleString('default', { month: 'long' });
    const year = date.getFullYear().toString().slice(-2);
    return `${day}-${month}-${year}`; // e.g. 24-January-24
  };

  // 1. Calculate Indirect Store Overhead per KG
  const totalMonthlyWages = useMemo(() => staffList.reduce((acc, staff) => acc + parseFloat(staff.salary || 0), 0), [staffList]);

  const storeOverheadPerKg = useMemo(() => {
    const totalMonthlyFixed = parseFloat(storeSettings.monthlyRent) + totalMonthlyWages;
    const dailyFixedCost = totalMonthlyFixed / 30;
    const costPerKgPerDay = storeSettings.avgDailyStock > 0 ? dailyFixedCost / parseFloat(storeSettings.avgDailyStock) : 0;
    return costPerKgPerDay * parseFloat(storeSettings.avgTurnaroundDays);
  }, [storeSettings, totalMonthlyWages]);

  // 2. Calculate Inventory
  const inventory = useMemo(() => {
    const stock = {};

    shipments.filter(s => s.isFinalized).forEach(shipment => {
      const totalWeight = shipment.items.reduce((sum, item) => sum + parseFloat(item.weight), 0);
      const totalExpenses = shipment.expenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
      const directOverheadPerKg = totalWeight > 0 ? totalExpenses / totalWeight : 0;

      shipment.items.forEach(item => {
        const itemWeight = parseFloat(item.weight);
        const itemBaseCost = parseFloat(item.cost);
        const rawCostPerKg = itemBaseCost / itemWeight;
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
            pendingValue: 0
          };
        }

        stock[item.name].totalValue += (itemWeight * effectiveCostPerKg);
        stock[item.name].weight += itemWeight;
        stock[item.name].avgCost = stock[item.name].totalValue / stock[item.name].weight;
        stock[item.name].directCost = rawCostPerKg + directOverheadPerKg;
      });
    });

    sales.forEach(sale => {
      if (stock[sale.itemName]) {
        const w = parseFloat(sale.weight);
        const p = parseFloat(sale.price);
        const totalSale = w * p;

        stock[sale.itemName].weight -= w;
        stock[sale.itemName].totalValue -= (w * stock[sale.itemName].avgCost);
        
        // Analytics
        stock[sale.itemName].soldWeight += w;
        stock[sale.itemName].soldValue += totalSale;
        if (sale.status === 'Pending') {
          stock[sale.itemName].pendingValue += totalSale;
        }
      }
    });

    return stock;
  }, [shipments, sales, storeOverheadPerKg]);

  // --- Views ---

  const SettingsPanel = () => {
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
                        onChange={e => setStoreSettings({...storeSettings, monthlyRent: e.target.value})} 
                    />
                    <Input 
                        label="Total Staff Wages" 
                        type="number" 
                        value={totalMonthlyWages}
                        readOnly={true}
                        helperText="Automatically calculated from Staff Manager tab"
                    />
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
                        onChange={e => setStoreSettings({...storeSettings, avgDailyStock: e.target.value})} 
                        helperText="Average weight of stock held in store"
                    />
                    <Input 
                        label="Avg Turnaround Time (Days)" 
                        type="number" 
                        value={storeSettings.avgTurnaroundDays} 
                        onChange={e => setStoreSettings({...storeSettings, avgTurnaroundDays: e.target.value})} 
                        helperText="How many days stock usually sits"
                    />
                </div>
            </Card>
        </div>
      </div>
    );
  };

  const StaffManager = () => {
    const [isAdding, setIsAdding] = useState(false);
    const [newStaff, setNewStaff] = useState({ name: "", role: "", salary: "", phone: "" });
    
    // Transaction Form
    const [transForm, setTransForm] = useState({ staffId: "", type: "Advance", amount: "", note: "" });

    const handleAddStaff = () => {
        if(!newStaff.name || !newStaff.salary) return;
        setStaffList([...staffList, { ...newStaff, id: Date.now() }]);
        setNewStaff({ name: "", role: "", salary: "", phone: "" });
        setIsAdding(false);
    };

    const handleDeleteStaff = (id) => {
        setStaffList(staffList.filter(s => s.id !== id));
    };

    const handleTransaction = () => {
        if(!transForm.staffId || !transForm.amount) return;
        setStaffTransactions([...staffTransactions, { 
            ...transForm, 
            id: Date.now(), 
            date: new Date().toISOString().split('T')[0] 
        }]);
        setTransForm({ staffId: "", type: "Advance", amount: "", note: "" });
    };

    return (
        <div className="space-y-8">
            {/* Staff List Section */}
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <Users className="text-blue-600" /> Staff List
                    </h2>
                    <Button onClick={() => setIsAdding(!isAdding)}>
                        {isAdding ? "Cancel" : "Add Staff"}
                    </Button>
                </div>

                {isAdding && (
                    <Card className="p-4 bg-blue-50 border-blue-100 mb-4">
                        <h3 className="font-semibold mb-3 text-blue-800">New Employee Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
                            <Input label="Name" value={newStaff.name} onChange={e => setNewStaff({...newStaff, name: e.target.value})} />
                            <Input label="Role" value={newStaff.role} onChange={e => setNewStaff({...newStaff, role: e.target.value})} />
                            <Input label="Monthly Salary (₹)" type="number" value={newStaff.salary} onChange={e => setNewStaff({...newStaff, salary: e.target.value})} />
                            <Input label="Phone" value={newStaff.phone} onChange={e => setNewStaff({...newStaff, phone: e.target.value})} />
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

            {/* Transactions Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1">
                    <Card className="p-6 h-full">
                        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                            <Wallet className="text-emerald-600" /> Record Payment
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Staff Member</label>
                                <select 
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none bg-white"
                                    value={transForm.staffId}
                                    onChange={e => setTransForm({...transForm, staffId: e.target.value})}
                                >
                                    <option value="">Select Staff...</option>
                                    {staffList.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Type</label>
                                <div className="flex gap-2">
                                    {['Advance', 'Salary', 'Bonus'].map(t => (
                                        <button 
                                            key={t}
                                            onClick={() => setTransForm({...transForm, type: t})}
                                            className={`flex-1 py-2 text-sm rounded-lg border ${transForm.type === t ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-600 border-slate-300'}`}
                                        >
                                            {t}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <Input label="Amount (₹)" type="number" value={transForm.amount} onChange={e => setTransForm({...transForm, amount: e.target.value})} />
                            <Input label="Note" value={transForm.note} onChange={e => setTransForm({...transForm, note: e.target.value})} placeholder="e.g. For festival" />
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
                                                    <span className={`px-2 py-0.5 rounded-full text-xs ${t.type === 'Advance' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
                                                        {t.type}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-slate-500 italic">{t.note}</td>
                                                <td className="px-4 py-3 font-bold text-slate-800 text-right">₹{t.amount}</td>
                                            </tr>
                                        )
                                    })}
                                    {staffTransactions.length === 0 && (
                                        <tr><td colSpan="5" className="p-4 text-center text-slate-400">No transactions recorded</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
  };

  const Dashboard = () => {
    const [showDetailed, setShowDetailed] = useState(false);

    const totalStockWeight = Object.values(inventory).reduce((acc, curr) => acc + Math.max(0, curr.weight), 0);
    const totalStockValue = Object.values(inventory).reduce((acc, curr) => acc + Math.max(0, curr.totalValue), 0);
    const totalRevenue = sales.reduce((acc, curr) => acc + (parseFloat(curr.price) * parseFloat(curr.weight)), 0);
    
    // Detailed Metrics
    const totalSoldWeight = sales.reduce((acc, curr) => acc + parseFloat(curr.weight), 0);
    const totalPending = sales
      .filter(s => s.status === 'Pending')
      .reduce((acc, curr) => acc + (parseFloat(curr.price) * parseFloat(curr.weight)), 0);
    const totalReceived = totalRevenue - totalPending;

    // Salary & advance flowing from staff transactions
    const totalSalaryPaid = staffTransactions
      .filter(t => t.type === 'Salary')
      .reduce((acc, t) => acc + parseFloat(t.amount || 0), 0);
    const totalAdvancePaid = staffTransactions
      .filter(t => t.type === 'Advance')
      .reduce((acc, t) => acc + parseFloat(t.amount || 0), 0);

    // Pending bill notifications
    const now = new Date();
    const pendingAlerts = sales.filter(sale => {
      if (sale.status !== 'Pending' || !sale.createdAt) return false;
      const createdAt = new Date(sale.createdAt);
      const diffHours = (now - createdAt) / (1000 * 60 * 60);
      const name = (sale.clientName || '').toLowerCase();
      const isWalkIn = name.includes('walk');
      const isHotel = name.includes('hotel');

      if (isWalkIn) {
        // Pending walk-in customer bills after five hours
        return diffHours >= 5;
      }
      if (isHotel) {
        // Pending hotel bills after two days
        return diffHours >= 48;
      }
      return false;
    });

    const petty = parseFloat(pettyCash || 0);
    const otherExp = parseFloat(dailyExpenses || 0);
    const balanceAmount = totalRevenue + petty - otherExp - totalPending;

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center mb-2">
            <h2 className="text-xl font-bold text-slate-700">Overview</h2>
            <button 
                onClick={() => setShowDetailed(!showDetailed)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${showDetailed ? 'bg-blue-600 text-white' : 'bg-white border border-slate-300 text-slate-600'}`}
            >
                {showDetailed ? <EyeOff size={16}/> : <Eye size={16}/>}
                {showDetailed ? "Simple View" : "Detailed View"}
            </button>
        </div>

        <div className={`grid grid-cols-1 ${showDetailed ? 'md:grid-cols-4' : 'md:grid-cols-4'} gap-4`}>
          <Card className="p-4 border-l-4 border-blue-500">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-slate-500">Stock (In Hand)</p>
                <h3 className="text-2xl font-bold text-slate-800">{totalStockWeight.toFixed(1)} <span className="text-sm font-normal text-slate-400">kg</span></h3>
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

        {/* Salary / Advance & Daily Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4 border-l-4 border-emerald-500">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-slate-500">Salary Paid</p>
                <h3 className="text-2xl font-bold text-slate-800">₹{totalSalaryPaid.toFixed(2)}</h3>
              </div>
              <Users className="text-emerald-500" />
            </div>
          </Card>
          <Card className="p-4 border-l-4 border-orange-500">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-slate-500">Advance Given</p>
                <h3 className="text-2xl font-bold text-slate-800">₹{totalAdvancePaid.toFixed(2)}</h3>
              </div>
              <Wallet className="text-orange-500" />
            </div>
          </Card>
          <Card className="p-4 border-l-4 border-slate-500">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase">Today Balance Summary</p>
                <p className="text-[11px] text-slate-400 mb-1">
                  (Total Sales + Petty Cash − Expenses − Pending Bills)
                </p>
                <h3 className="text-2xl font-bold text-slate-800">₹{balanceAmount.toFixed(2)}</h3>
              </div>
            </div>
          </Card>
        </div>

        {/* Petty cash / expenses controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-4">
            <h3 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <Wallet size={16} className="text-emerald-600" /> Petty Cash (Today)
            </h3>
            <Input
              label="Amount (₹)"
              type="number"
              value={pettyCash}
              onChange={e => setPettyCash(e.target.value)}
              helperText="Quick entry for today's extra cash added"
            />
          </Card>
          <Card className="p-4">
            <h3 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <DollarSign size={16} className="text-red-600" /> Other Expenses (Today)
            </h3>
            <Input
              label="Amount (₹)"
              type="number"
              value={dailyExpenses}
              onChange={e => setDailyExpenses(e.target.value)}
              helperText="Non-shipment daily expenses"
            />
          </Card>
        </div>

        {/* Detailed Stats Row */}
        {showDetailed && (
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in slide-in-from-top-4 duration-300">
                <Card className="p-4 bg-slate-50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 text-green-600 rounded-lg"><CheckCircle size={20} /></div>
                        <div>
                            <p className="text-xs font-semibold text-slate-500 uppercase">Cash Received</p>
                            <p className="text-xl font-bold text-green-700">₹{totalReceived.toFixed(2)}</p>
                        </div>
                    </div>
                </Card>
                <Card className="p-4 bg-slate-50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-100 text-red-600 rounded-lg"><Clock3 size={20} /></div>
                        <div>
                            <p className="text-xs font-semibold text-slate-500 uppercase">Pending Payments</p>
                            <p className="text-xl font-bold text-red-700">₹{totalPending.toFixed(2)}</p>
                        </div>
                    </div>
                </Card>
                <Card className="p-4 bg-slate-50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><ShoppingCart size={20} /></div>
                        <div>
                            <p className="text-xs font-semibold text-slate-500 uppercase">Total Weight Sold</p>
                            <p className="text-xl font-bold text-blue-700">{totalSoldWeight.toFixed(1)} <span className="text-sm font-normal">kg</span></p>
                        </div>
                    </div>
                </Card>
             </div>
        )}

        {/* Pending bill notifications */}
        {pendingAlerts.length > 0 && (
          <Card className="p-4 border-l-4 border-red-500 bg-red-50">
            <div className="flex items-start gap-3">
              <div className="mt-1">
                <Bell className="text-red-500" size={18} />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-red-700 mb-1">Pending Bill Alerts</h3>
                <p className="text-xs text-red-600 mb-2">
                  Hotel bills pending &gt; 2 days and walk-in bills pending &gt; 5 hours.
                </p>
                <div className="flex flex-wrap gap-2">
                  {pendingAlerts.map(alert => (
                    <span
                      key={alert.id}
                      className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-red-200 text-xs text-red-700"
                    >
                      <span className="font-semibold">{alert.clientName}</span>
                      <span className="text-slate-500">₹{(alert.price * alert.weight).toFixed(2)}</span>
                      <span className="text-slate-400">{alert.itemName}</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        )}

        <div className="grid grid-cols-1 gap-6">
          <Card className="p-6">
            <h3 className="font-bold text-lg mb-4 text-slate-800 flex items-center gap-2">
              <List className="w-5 h-5 text-blue-600" /> 
              {showDetailed ? "Complete Inventory Analysis" : "Current Stock Status"}
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
                    <th className="px-4 py-3 rounded-r-lg">Stock Value</th>
                    {showDetailed && <th className="px-4 py-3 text-orange-600">Pending ₹</th>}
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
                          <td className="px-4 py-3 text-slate-500">₹{Math.max(0, data.totalValue).toFixed(2)}</td>
                          {showDetailed && (
                              <td className="px-4 py-3 text-orange-600 font-medium">
                                  {data.pendingValue > 0 ? `₹${data.pendingValue.toFixed(2)}` : '-'}
                              </td>
                          )}
                        </tr>
                     )
                  })}
                  {Object.keys(inventory).length === 0 && (
                    <tr><td colSpan={showDetailed ? 8 : 6} className="text-center py-4 text-slate-400">No inventory yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    );
  };

  const ShipmentManager = () => {
    const [isCreating, setIsCreating] = useState(false);
    const emptyShipment = {
      supplier: "",
      items: [],
      expenses: [],
      status: "In Transit",
      trackingId: "",
      notes: ""
    };
    const [newShipment, setNewShipment] = useState(emptyShipment);
    const [editingShipment, setEditingShipment] = useState(null);
    
    // UI State for dynamic inputs
    const [isAddingFish, setIsAddingFish] = useState(false);
    const [newFishName, setNewFishName] = useState("");
    const [deleteConfirmId, setDeleteConfirmId] = useState(null);

    const [tempItem, setTempItem] = useState({ name: "", weight: "", cost: "" });
    const [tempExpense, setTempExpense] = useState({ type: "", amount: "" });

    const addItem = () => {
      if(!tempItem.name || !tempItem.weight || !tempItem.cost) return;
      setNewShipment(prev => ({
        ...prev,
        items: [...prev.items, { ...tempItem, id: Date.now() }]
      }));
      setTempItem({ name: "", weight: "", cost: "" });
      setIsAddingFish(false); 
    };

    const addFishType = () => {
      if(newFishName) {
        setFishTypes([...fishTypes, newFishName]);
        setTempItem({...tempItem, name: newFishName});
        setNewFishName("");
        setIsAddingFish(false);
      }
    };

    const addExpense = () => {
      if(!tempExpense.type || !tempExpense.amount) return;
      setNewShipment(prev => ({
        ...prev,
        expenses: [...prev.expenses, { ...tempExpense, id: Date.now() }]
      }));
      setTempExpense({ type: "", amount: "" });
    };

    const autoAddAllFishItems = () => {
      const existing = new Set(newShipment.items.map(i => i.name));
      const extra = fishTypes
        .filter(name => !existing.has(name))
        .map(name => ({
          id: Date.now() + Math.random(),
          name,
          weight: "",
          cost: ""
        }));
      if (extra.length === 0) return;
      setNewShipment(prev => ({
        ...prev,
        items: [...prev.items, ...extra]
      }));
    };

    const updateItemField = (id, field, value) => {
      setNewShipment(prev => ({
        ...prev,
        items: prev.items.map(item => item.id === id ? { ...item, [field]: value } : item)
      }));
    };

    const finalizeShipment = () => {
      const shipmentName = newShipment.supplier.trim() ? newShipment.supplier : getAutoShipmentName();
      const cleanedItems = newShipment.items.filter(
        item => item.name && item.weight && item.cost
      );
      if (cleanedItems.length === 0) return;
      
      setShipments([...shipments, { 
        ...newShipment, 
        items: cleanedItems,
        supplier: shipmentName,
        id: Date.now(), 
        isFinalized: true, 
        date: new Date().toISOString().split('T')[0] 
      }]);
      setIsCreating(false);
      setNewShipment(emptyShipment);
    };

    const handleDeleteShipment = (id) => {
      setShipments(shipments.filter(s => s.id !== id));
      setDeleteConfirmId(null);
    };

    const startNewShipment = () => {
      setNewShipment(emptyShipment);
      setIsCreating(true);
    };

    const startEditShipment = (shipment) => {
      setEditingShipment({ ...shipment });
    };

    const cancelEditShipment = () => {
      setEditingShipment(null);
    };

    const saveEditShipment = () => {
      if (!editingShipment) return;
      const cleanedItems = (editingShipment.items || []).filter(
        item => item.name && item.weight && item.cost
      );
      const updated = { ...editingShipment, items: cleanedItems };
      setShipments(shipments.map(s => s.id === updated.id ? updated : s));
      setEditingShipment(null);
    };

    // Live Calculation
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
            {/* Left Col: Inputs */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="p-6">
                <h3 className="font-semibold mb-4 text-slate-700">1. Shipment Details</h3>
                <div className="space-y-2">
                  <Input 
                    label="Shipment Name / Supplier" 
                    value={newShipment.supplier} 
                    onChange={e => setNewShipment({...newShipment, supplier: e.target.value})} 
                    placeholder={`Leave empty for "${getAutoShipmentName()}"`}
                  />
                  {!newShipment.supplier && (
                    <p className="text-xs text-blue-500 flex items-center gap-1">
                      <Clock size={12}/> Auto-name: {getAutoShipmentName()}
                    </p>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Status</label>
                      <select
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none bg-white"
                        value={newShipment.status}
                        onChange={e => setNewShipment({ ...newShipment, status: e.target.value })}
                      >
                        {['In Transit', 'Delivered', 'Cancelled'].map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                    <Input
                      label="Tracking ID"
                      value={newShipment.trackingId}
                      onChange={e => setNewShipment({ ...newShipment, trackingId: e.target.value })}
                    />
                    <Input
                      label="Notes"
                      value={newShipment.notes}
                      onChange={e => setNewShipment({ ...newShipment, notes: e.target.value })}
                    />
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-slate-700">2. Fish Stock (Items)</h3>
                  <Button variant="secondary" onClick={autoAddAllFishItems} title="Auto add all fish types into this shipment">
                    <Package size={16} /> Auto‑fetch all items
                  </Button>
                </div>
                <div className="flex flex-col md:flex-row gap-2 mb-4 items-end">
                  
                  {/* Fish Selection Logic */}
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
                          else setTempItem({...tempItem, name: e.target.value});
                        }}
                      >
                        <option value="">Select Fish...</option>
                        {fishTypes.map(f => <option key={f} value={f}>{f}</option>)}
                        <option value="__NEW__" className="font-bold text-blue-600">+ Add New Fish Type</option>
                      </select>
                    )}
                  </div>

                  <Input className="w-full md:w-24" label="Weight (kg)" type="number" value={tempItem.weight} onChange={e => setTempItem({...tempItem, weight: e.target.value})} placeholder="0" />
                  <Input className="w-full md:w-32" label="Total Cost (₹)" type="number" value={tempItem.cost} onChange={e => setTempItem({...tempItem, cost: e.target.value})} placeholder="0.00" />
                  <Button onClick={addItem} disabled={isAddingFish}><Plus size={18} /></Button>
                </div>
                
                {newShipment.items.length > 0 && (
                  <div className="bg-slate-50 rounded-lg p-3 space-y-2 border border-slate-100">
                    {newShipment.items.map(item => (
                      <div key={item.id} className="grid grid-cols-12 gap-2 items-center text-sm">
                        <div className="col-span-4 font-medium text-slate-800">
                          {item.name}
                        </div>
                        <div className="col-span-3">
                          <input
                            type="number"
                            className="w-full px-2 py-1 border border-slate-300 rounded-lg text-sm"
                            placeholder="Weight (kg)"
                            value={item.weight}
                            onChange={e => updateItemField(item.id, 'weight', e.target.value)}
                          />
                        </div>
                        <div className="col-span-3">
                          <input
                            type="number"
                            className="w-full px-2 py-1 border border-slate-300 rounded-lg text-sm"
                            placeholder="Total Cost (₹)"
                            value={item.cost}
                            onChange={e => updateItemField(item.id, 'cost', e.target.value)}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              <Card className="p-6">
                <h3 className="font-semibold mb-4 text-slate-700">3. Shipment Expenses</h3>
                <div className="flex gap-2 mb-4 items-end">
                  <Input className="flex-1" label="Expense Type" value={tempExpense.type} onChange={e => setTempExpense({...tempExpense, type: e.target.value})} placeholder="Driver / Wages" />
                  <Input className="w-32" label="Amount" type="number" value={tempExpense.amount} onChange={e => setTempExpense({...tempExpense, amount: e.target.value})} placeholder="0.00" />
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

            {/* Right Col: Preview */}
            <div className="lg:col-span-1">
              <Card className="p-6 bg-slate-800 text-white sticky top-6">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <Activity size={20}/> Cost Preview
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

                  <Button 
                    className="w-full justify-center mt-6" 
                    onClick={finalizeShipment}
                    disabled={newShipment.items.length === 0}
                  >
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
           <Button onClick={startNewShipment}><Plus size={18} /> New Shipment</Button>
        </div>

        {editingShipment && (
          <Card className="p-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                <Edit2 size={16} /> Edit Shipment – {editingShipment.supplier}
              </h3>
              <button
                className="text-slate-500 hover:text-slate-800 text-sm flex items-center gap-1"
                onClick={cancelEditShipment}
              >
                <XCircle size={14} /> Close
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Input
                label="Supplier / Name"
                value={editingShipment.supplier}
                onChange={e => setEditingShipment({ ...editingShipment, supplier: e.target.value })}
              />
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Status</label>
                <select
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none bg-white"
                  value={editingShipment.status}
                  onChange={e => setEditingShipment({ ...editingShipment, status: e.target.value })}
                >
                  {['In Transit', 'Delivered', 'Cancelled'].map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <Input
                label="Tracking ID"
                value={editingShipment.trackingId || ''}
                onChange={e => setEditingShipment({ ...editingShipment, trackingId: e.target.value })}
              />
              <Input
                label="Notes"
                value={editingShipment.notes || ''}
                onChange={e => setEditingShipment({ ...editingShipment, notes: e.target.value })}
              />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="secondary" onClick={cancelEditShipment}>Cancel</Button>
              <Button variant="primary" onClick={saveEditShipment}>Save Changes</Button>
            </div>
          </Card>
        )}

        <div className="grid gap-4">
          {shipments.map(shipment => {
             const sWeight = shipment.items.reduce((a,b) => a + parseFloat(b.weight), 0);
             const sCost = shipment.items.reduce((a,b) => a + parseFloat(b.cost), 0);
             const sExp = shipment.expenses.reduce((a,b) => a + parseFloat(b.amount), 0);

             return (
               <Card key={shipment.id} className="p-4 flex flex-col md:flex-row justify-between items-center gap-4 hover:shadow-md transition-shadow">
                 <div className="flex items-center gap-4 flex-1">
                   <div className="bg-blue-100 p-3 rounded-full text-blue-600">
                     <Truck size={24} />
                   </div>
                   <div>
                     <h4 className="font-bold text-slate-800">{shipment.supplier}</h4>
                     <p className="text-sm text-slate-500">{shipment.date} • ID: #{shipment.id}</p>
                     <p className="text-xs text-slate-500 mt-1">
                       Status: <span className={`font-semibold ${
                         shipment.status === 'Delivered' ? 'text-emerald-600' :
                         shipment.status === 'Cancelled' ? 'text-red-600' : 'text-orange-600'
                       }`}>{shipment.status || 'In Transit'}</span>
                       {shipment.trackingId && (
                         <span className="ml-3 text-slate-400">Track: {shipment.trackingId}</span>
                       )}
                     </p>
                   </div>
                 </div>
                 
                 <div className="flex gap-8 text-sm items-center">
                   <div>
                     <span className="block text-slate-500 text-xs uppercase">Stock Added</span>
                     <span className="font-medium">{sWeight} kg</span>
                   </div>
                   <div>
                     <span className="block text-slate-500 text-xs uppercase">Total Eff. Cost</span>
                     <span className="font-bold text-slate-800">₹{(sCost + sExp + (storeOverheadPerKg * sWeight)).toFixed(2)}</span>
                   </div>
                   <div className="flex items-center gap-3">
                     <button
                       className="text-slate-500 hover:text-blue-600 p-2 hover:bg-blue-50 rounded-lg transition-colors"
                       onClick={() => startEditShipment(shipment)}
                       title="Edit Shipment"
                     >
                       <Edit2 size={18} />
                     </button>
                     {deleteConfirmId === shipment.id ? (
                       <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                         <span className="text-xs text-red-700 font-medium">Delete?</span>
                         <button
                           onClick={() => handleDeleteShipment(shipment.id)}
                           className="text-red-600 hover:text-red-800 font-bold text-sm"
                           title="Confirm Delete"
                         >
                           Yes
                         </button>
                         <button
                           onClick={() => setDeleteConfirmId(null)}
                           className="text-slate-600 hover:text-slate-800 text-sm"
                           title="Cancel"
                         >
                           No
                         </button>
                       </div>
                     ) : (
                       <button
                         onClick={() => setDeleteConfirmId(shipment.id)}
                         className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition-colors"
                         title="Delete Shipment"
                       >
                         <Trash2 size={18} />
                       </button>
                     )}
                   </div>
                 </div>
               </Card>
             )
          })}
        </div>
      </div>
    );
  };

  const SalesPoint = () => {
    const [newSale, setNewSale] = useState({ 
      clientName: "", 
      itemName: "", 
      weight: "", 
      price: "", 
      status: "Paid",
      billNumber: "",
      mobile: "",
      paymentMode: "Cash"
    });
    const availableItems = Object.keys(inventory);
    
    // UI State
    const [isAddingClient, setIsAddingClient] = useState(false);
    const [newClientName, setNewClientName] = useState("");
    const [filterStatus, setFilterStatus] = useState("All");
    const [editingSale, setEditingSale] = useState(null);

    const getCostPrice = () => {
      if(!newSale.itemName) return 0;
      return inventory[newSale.itemName] ? inventory[newSale.itemName].avgCost : 0;
    };

    const addClient = () => {
      if(newClientName) {
        setClients([...clients, { id: Date.now(), name: newClientName }]);
        setNewSale({...newSale, clientName: newClientName});
        setNewClientName("");
        setIsAddingClient(false);
      }
    };

    const handleSell = () => {
      if (!newSale.clientName || !newSale.itemName || !newSale.weight || !newSale.price) return;
      if (inventory[newSale.itemName].weight < parseFloat(newSale.weight)) return; 
      
      const isWalkIn = newSale.clientName.toLowerCase().includes('walk');
      const isPending = newSale.status === 'Pending';
      if (isWalkIn && isPending && (!newSale.billNumber || !newSale.mobile)) {
        return;
      }

      const salePayload = { 
        ...newSale, 
        id: Date.now(), 
        date: new Date().toLocaleDateString(),
        createdAt: new Date().toISOString()
      };
      setSales([...sales, salePayload]);
      setNewSale({ 
        clientName: "", 
        itemName: "", 
        weight: "", 
        price: "", 
        status: "Paid",
        billNumber: "",
        mobile: "",
        paymentMode: "Cash"
      });
    };

    const effectiveCost = getCostPrice();
    const sellingPrice = parseFloat(newSale.price) || 0;
    const profitPerKg = sellingPrice - effectiveCost;
    const totalProfit = profitPerKg * (parseFloat(newSale.weight) || 0);

    const filteredSales = sales.filter(s => filterStatus === 'All' || s.status === filterStatus);

    const startEditSale = (sale) => {
      setEditingSale({ ...sale });
    };

    const cancelEditSale = () => {
      setEditingSale(null);
    };

    const applyEditSale = () => {
      if (!editingSale) return;
      setSales(sales.map(s => s.id === editingSale.id ? { ...s, ...editingSale } : s));
      setEditingSale(null);
    };

    return (
      <div className="space-y-8">
        {/* Top Section: Sales Form & Profit Sim */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6">
            <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
              <ShoppingCart className="text-blue-600" /> New Sale
            </h2>
            
            <div className="space-y-4">
              {/* Client Selection */}
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
                      else setNewSale({...newSale, clientName: e.target.value});
                    }}
                  >
                    <option value="">Select Client...</option>
                    {clients.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                    <option value="__NEW__" className="font-bold text-blue-600">+ Add New Client</option>
                  </select>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Bill Number"
                  value={newSale.billNumber}
                  onChange={e => setNewSale({ ...newSale, billNumber: e.target.value })}
                  helperText={newSale.clientName.toLowerCase().includes('walk') && newSale.status === 'Pending' ? 'Required for pending walk-in bills' : ''}
                />
                <Input
                  label="Customer Mobile"
                  value={newSale.mobile}
                  onChange={e => setNewSale({ ...newSale, mobile: e.target.value })}
                  helperText={newSale.clientName.toLowerCase().includes('walk') && newSale.status === 'Pending' ? 'Required for pending walk-in bills' : 'Optional for others'}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Fish Stock</label>
                <select 
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none"
                  value={newSale.itemName}
                  onChange={e => setNewSale({...newSale, itemName: e.target.value})}
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
                <Input label="Weight (kg)" type="number" value={newSale.weight} onChange={e => setNewSale({...newSale, weight: e.target.value})} />
                <Input label="Selling Price (₹)" type="number" value={newSale.price} onChange={e => setNewSale({...newSale, price: e.target.value})} />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Payment Status</label>
                <div className="flex gap-2">
                   {['Paid', 'Pending', 'Partial'].map(status => (
                     <button
                      key={status}
                      onClick={() => setNewSale({...newSale, status})}
                      className={`px-3 py-1 text-sm rounded-full border ${newSale.status === status ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-300'}`}
                     >
                       {status}
                     </button>
                   ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Payment Mode</label>
                <div className="flex gap-2">
                  {['Cash', 'GPay', 'Other'].map(mode => (
                    <button
                      key={mode}
                      onClick={() => setNewSale({ ...newSale, paymentMode: mode })}
                      className={`px-3 py-1 text-sm rounded-full border ${
                        newSale.paymentMode === mode ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-600 border-slate-300'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              <Button className="w-full justify-center mt-4" onClick={handleSell}>
                Confirm Sale
              </Button>
            </div>
          </Card>

          {/* Profit Simulator */}
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
                       <span className={`font-bold ${profitPerKg >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                         ₹{profitPerKg.toFixed(2)}
                       </span>
                     </div>
                     <div className="flex justify-between pt-2 border-t border-slate-700">
                       <span className="text-sm text-slate-300">Total Net Profit</span>
                       <span className={`font-bold text-lg ${totalProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                         ₹{totalProfit.toFixed(2)}
                       </span>
                     </div>
                   </div>
                 </div>
               ) : (
                 <div className="h-full flex items-center justify-center text-slate-600 italic">
                   Select an item to see profit analysis
                 </div>
               )}
             </Card>
          </div>
        </div>

        {/* Bottom Section: Sales History List */}
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <List className="text-slate-600" /> Sales History
                </h2>
                <div className="flex gap-2 bg-white p-1 rounded-lg border border-slate-200">
                    {['All', 'Paid', 'Pending'].map(f => (
                        <button
                            key={f}
                            onClick={() => setFilterStatus(f)}
                            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${filterStatus === f ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            {editingSale && (
              <Card className="mb-4 p-4 bg-slate-50 border-slate-200">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                    <Edit2 size={16} /> Edit Bill #{editingSale.billNumber || editingSale.id}
                  </h3>
                  <button
                    className="text-slate-500 hover:text-slate-800 text-sm flex items-center gap-1"
                    onClick={cancelEditSale}
                  >
                    <XCircle size={14} /> Close
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Input
                    label="Bill Number"
                    value={editingSale.billNumber || ''}
                    onChange={e => setEditingSale({ ...editingSale, billNumber: e.target.value })}
                  />
                  <Input
                    label="Customer Mobile"
                    value={editingSale.mobile || ''}
                    onChange={e => setEditingSale({ ...editingSale, mobile: e.target.value })}
                  />
                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Status</label>
                    <div className="flex gap-2">
                      {['Paid', 'Pending', 'Partial'].map(status => (
                        <button
                          key={status}
                          onClick={() => setEditingSale({ ...editingSale, status })}
                          className={`px-3 py-1 text-xs rounded-full border ${
                            editingSale.status === status ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-300'
                          }`}
                        >
                          {status}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Payment Mode</label>
                    <div className="flex gap-2">
                      {['Cash', 'GPay', 'Other'].map(mode => (
                        <button
                          key={mode}
                          onClick={() => setEditingSale({ ...editingSale, paymentMode: mode })}
                          className={`px-3 py-1 text-xs rounded-full border ${
                            editingSale.paymentMode === mode ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-600 border-slate-300'
                          }`}
                        >
                          {mode}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex justify-end gap-2">
                  <Button variant="secondary" onClick={cancelEditSale}>Cancel</Button>
                  <Button variant="primary" onClick={applyEditSale}>Save Changes</Button>
                </div>
              </Card>
            )}

            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left min-w-[900px]">
                    <thead className="bg-slate-50 text-slate-600 uppercase">
                        <tr>
                            <th className="px-4 py-3">Date</th>
                            <th className="px-4 py-3">Client</th>
                            <th className="px-4 py-3">Item</th>
                            <th className="px-4 py-3">Bill No</th>
                            <th className="px-4 py-3">Mobile</th>
                            <th className="px-4 py-3">Weight</th>
                            <th className="px-4 py-3">Price/kg</th>
                            <th className="px-4 py-3">Total</th>
                            <th className="px-4 py-3">Pay Mode</th>
                            <th className="px-4 py-3 text-right">Status</th>
                            <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredSales.slice().reverse().map(sale => (
                            <tr key={sale.id} className="hover:bg-slate-50">
                                <td className="px-4 py-3 text-slate-500">{sale.date}</td>
                                <td className="px-4 py-3 font-medium text-slate-800">{sale.clientName}</td>
                                <td className="px-4 py-3 text-slate-600">{sale.itemName}</td>
                                <td className="px-4 py-3 text-slate-600">{sale.billNumber || '-'}</td>
                                <td className="px-4 py-3 text-slate-600 flex items-center gap-1">
                                    {sale.mobile && <Phone size={12} className="text-slate-400" />}
                                    <span>{sale.mobile || '-'}</span>
                                </td>
                                <td className="px-4 py-3">{sale.weight} kg</td>
                                <td className="px-4 py-3">₹{sale.price}</td>
                                <td className="px-4 py-3 font-bold text-slate-800">₹{(sale.weight * sale.price).toFixed(2)}</td>
                                <td className="px-4 py-3">{sale.paymentMode || '-'}</td>
                                <td className="px-4 py-3 text-right">
                                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                                        sale.status === 'Paid' ? 'bg-green-100 text-green-700' : 
                                        sale.status === 'Pending' ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-600'
                                    }`}>
                                        {sale.status === 'Paid' ? <CheckCircle size={10} /> : <Clock3 size={10} />}
                                        {sale.status}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <button
                                      className="text-slate-500 hover:text-blue-600 p-1"
                                      onClick={() => startEditSale(sale)}
                                      title="Edit bill"
                                    >
                                      <Edit2 size={14} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {filteredSales.length === 0 && (
                            <tr>
                                <td colSpan="10" className="px-4 py-8 text-center text-slate-400 italic">
                                    No sales found for this filter.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
              </div>
            </Card>
        </div>
      </div>
    );
  };

  // --- Layout ---

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center justify-between w-full md:w-auto">
            <div>
              <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-2">
                <span className="text-blue-600">🐟</span> DC fish ledger
              </h1>
              <p className="text-slate-500">Fish Store Accounting & Inventory System</p>
            </div>
            <Button 
              variant="outline" 
              onClick={onLogout}
              className="md:ml-4"
              title="Logout"
            >
              <LogOut size={16} /> Logout
            </Button>
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
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                  activeTab === tab.id 
                    ? 'bg-blue-600 text-white' 
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
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
  );
}
