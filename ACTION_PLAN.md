# DC Ledger Enhancement Action Plan

## Overview
This document outlines the precise edits and enhancements needed for the DC Fish Ledger system based on the latest requirements.

---

## 1. Shipment Management Improvements

### 1.1 Enhanced Shipment Editing
**Current Issue**: Edit shipment panel doesn't show all items and expenses for editing.

**Required Changes**:
- [ ] In `ShipmentManager` component, when `editingShipment` is set:
  - Display all fish items with editable weight and cost fields
  - Display all expenses with editable type and amount fields
  - Add ability to add/remove items and expenses in edit mode
  - Show calculated shared expense per kg for the shipment

**Implementation Details**:
```javascript
// Add these fields to editingShipment state display:
- Items list with inline editing (name, weight, totalCost)
- Expenses list with inline editing (type, amount)
- Calculated field: "Shared Expense per KG" = Total Expenses / Total Weight
- Add/Remove buttons for items and expenses
```

### 1.2 Display Shared Expense Per KG
**Required Changes**:
- [ ] Calculate and display shared (direct) expense per kg for each shipment
- [ ] Formula: `Total Expenses / Total Weight = Direct Overhead per KG`
- [ ] Show this in:
  - Shipment creation preview (already exists in Cost Preview)
  - Shipment history cards
  - Shipment edit panel

---

## 2. Selling Price Management

### 2.1 Remove Selling Price from Shipment
**Current Issue**: Selling price should not be part of shipment creation; it's determined independently.

**Required Changes**:
- [ ] Remove any selling price input from shipment creation/edit screens
- [ ] Confirm shipments only track:
  - Fish type, weight, purchase cost (total for whole weight)
  - Expenses (transportation, ice, wages, etc.)
  - Status, tracking, notes

### 2.2 Create Inventory Selling Price Modal
**Required Changes**:
- [ ] Add "Set Selling Prices" button on Dashboard
- [ ] Create modal component `SellingPriceModal`:
  - Shows all fish types from inventory
  - Each fish type has input field: "Selling Price per KG (₹)"
  - Store selling prices in new state: `sellingPrices` object
    ```javascript
    {
      "Mathi": 150,
      "Ayila": 250,
      "Chembali": 400,
      "Ayikora": 850
    }
    ```
  - Save button to update all prices
  - Show effective cost vs selling price comparison
  - Calculate and display profit margin per fish type

### 2.3 Update Sales to Use Stored Selling Prices
**Required Changes**:
- [ ] When creating a sale, auto-populate selling price from `sellingPrices` state
- [ ] Allow manual override per transaction if needed
- [ ] Show suggested price from inventory vs entered price

---

## 3. Sales Payment Management

### 3.1 Add Discount Fields to Sales
**Required Changes**:
- [ ] Add to `sales` schema:
  - `discountPercent` (number, 0-100)
  - `discountAmount` (number, calculated or manual)
- [ ] Add to sales entry form:
  - Discount % input
  - Discount Amount input (auto-calculated or manual)
  - Show: Original Total, Discount, Final Total
- [ ] Update Sales History table to show:
  - Original Amount
  - Discount (if any)
  - Final Amount

### 3.2 Payment History Tracking
**Required Changes**:
- [ ] Add new state: `paymentHistory` array
  ```javascript
  {
    id, 
    saleId, 
    date, 
    amount, 
    paymentMode, 
    note
  }
  ```
- [ ] Each sale tracks:
  - Original amount
  - Amount paid (sum of payment history)
  - Amount pending
  - Payment status (auto-calculated):
    - "Paid" if amountPaid >= finalAmount
    - "Partial" if amountPaid > 0 && < finalAmount
    - "Pending" if amountPaid === 0

### 3.3 Pay Action Button
**Required Changes**:
- [ ] Add "Pay" button in Sales History for Pending/Partial status sales
- [ ] Clicking "Pay" opens inline payment form:
  - Amount to pay (default: remaining balance)
  - Payment mode (Cash/GPay/Other)
  - Note
  - Date (auto: today)
- [ ] On submit:
  - Add entry to `paymentHistory`
  - Update sale's payment status automatically
  - Show success message

### 3.4 Payment History Toggle View
**Required Changes**:
- [ ] Add expandable row in Sales History table
- [ ] When expanded, show all payment history entries for that sale:
  - Date, Amount, Payment Mode, Note
  - Edit button (opens inline edit form)
  - Delete button (with confirmation)
- [ ] Edit payment history entry:
  - Modify amount, payment mode, note
  - Recalculate sale's payment status
- [ ] Delete payment history entry:
  - Confirm deletion
  - Recalculate sale's payment status

---

## 4. Sales Listing & Filtering Enhancements

### 4.1 Customer Type Categorization
**Required Changes**:
- [ ] Add explicit `customerType` field to sales:
  - Auto-detect from client name:
    - "Walk-in" if name contains "walk"
    - "Hotel" if name contains "hotel"
    - "Wholesale" if name contains "wholesale"
  - Allow manual selection in sales form
- [ ] Add customer type badge in Sales History

### 4.2 Multi-Level Filtering
**Required Changes**:
- [ ] Add filter controls above Sales History table:
  - Customer Type filter: [All, Walk-in, Hotels, Wholesale]
  - Payment Status filter: [All, Paid, Partial, Pending]
  - Date range filter (optional)
- [ ] Apply filters simultaneously
- [ ] Show count of filtered results

### 4.3 Grouped Sales View
**Required Changes**:
- [ ] Add new view option: "Group by Customer"
- [ ] When enabled:
  - Group all sales by `clientName`
  - Show customer header with:
    - Customer name
    - Customer type badge
    - Total sales amount
    - Total pending amount
    - Number of transactions
  - Expandable list of all sales for that customer
  - Apply filters to grouped view as well

---

## 5. State Schema Updates

### 5.1 Sales Schema Enhancement
```javascript
{
  id: number,
  date: string,
  createdAt: string (ISO),
  clientName: string,
  customerType: "Walk-in" | "Hotel" | "Wholesale",
  itemName: string,
  weight: number,
  price: number (per kg),
  billNumber: string,
  mobile: string,
  paymentMode: "Cash" | "GPay" | "Other",
  discountPercent: number,
  discountAmount: number,
  originalAmount: number (calculated: weight * price),
  finalAmount: number (calculated: originalAmount - discountAmount),
  amountPaid: number (sum from paymentHistory),
  amountPending: number (calculated: finalAmount - amountPaid),
  status: "Paid" | "Partial" | "Pending" (auto-calculated)
}
```

### 5.2 Payment History Schema
```javascript
{
  id: number,
  saleId: number,
  date: string,
  amount: number,
  paymentMode: "Cash" | "GPay" | "Other",
  note: string,
  recordedBy: string (optional)
}
```

### 5.3 Selling Prices Schema
```javascript
{
  [fishName: string]: {
    sellingPrice: number,
    lastUpdated: string,
    costPrice: number (from inventory),
    margin: number (calculated)
  }
}
```

---

## 6. UI Components to Create/Modify

### New Components
1. **SellingPriceModal** - Modal for setting per-kg selling prices
2. **PaymentForm** - Inline form for recording payments
3. **PaymentHistoryRow** - Expandable row showing payment history
4. **CustomerGroupView** - Grouped sales view by customer
5. **SalesFilters** - Filter controls component

### Modified Components
1. **ShipmentManager** - Enhanced edit mode with all items/expenses
2. **SalesPoint** - Add discount fields, remove price from shipment context
3. **Dashboard** - Add "Set Selling Prices" button
4. **SalesHistory** - Add filters, grouping, payment actions

---

## 7. Implementation Order (Priority)

### Phase 1 - Core Payment Features
1. Add discount fields to sales
2. Implement payment history state and schema
3. Add "Pay" action button and form
4. Implement payment history toggle view

### Phase 2 - Selling Price Management
1. Create selling price state
2. Build SellingPriceModal component
3. Integrate with sales entry form
4. Remove any price references from shipments

### Phase 3 - Shipment Editing Enhancement
1. Enhance shipment edit panel with all items
2. Add inline editing for items and expenses
3. Display shared expense per kg
4. Add/remove functionality

### Phase 4 - Sales Filtering & Grouping
1. Add customer type field and auto-detection
2. Implement filter controls
3. Build grouped view by customer
4. Add date range filtering

---

## 8. Data Migration Considerations

### Existing Data
- [ ] Add default values for new fields in existing sales:
  - `customerType`: Auto-detect from clientName
  - `discountPercent`: 0
  - `discountAmount`: 0
  - `originalAmount`: weight * price
  - `finalAmount`: originalAmount
  - `amountPaid`: Calculate based on status (Paid = finalAmount, else 0)
  - `amountPending`: Calculate based on status

- [ ] Add default values for shipments:
  - Ensure all shipments have `status`, `trackingId`, `notes`

---

## 9. Validation Rules

### Sales Entry
- [ ] Discount % must be 0-100
- [ ] Discount amount cannot exceed original amount
- [ ] If discount % entered, auto-calculate discount amount
- [ ] If discount amount entered, auto-calculate discount %
- [ ] Selling price must be greater than 0

### Payment Recording
- [ ] Payment amount must be > 0
- [ ] Payment amount cannot exceed pending amount (with warning/confirmation)
- [ ] Payment mode is required
- [ ] Cannot delete last payment if sale status should be Pending

### Shipment Editing
- [ ] Item weight must be > 0
- [ ] Item cost must be > 0
- [ ] At least one item required to save shipment
- [ ] Expense amount must be > 0

---

## 10. Testing Checklist

### Sales & Payments
- [ ] Create sale with discount
- [ ] Record partial payment
- [ ] Record multiple payments
- [ ] Edit payment history entry
- [ ] Delete payment history entry
- [ ] Verify status auto-updates correctly

### Selling Prices
- [ ] Set selling prices from dashboard
- [ ] Verify prices auto-populate in sales form
- [ ] Override price manually in sale
- [ ] View profit margins in modal

### Shipment Editing
- [ ] Edit all items in a shipment
- [ ] Edit all expenses in a shipment
- [ ] Add new item to existing shipment
- [ ] Remove item from existing shipment
- [ ] Verify shared expense per kg calculation

### Sales Filtering
- [ ] Filter by customer type
- [ ] Filter by payment status
- [ ] Combine multiple filters
- [ ] Group by customer view
- [ ] Expand/collapse grouped entries

---

## Summary of Key Changes

| Area | Current State | Required State |
|------|--------------|----------------|
| Shipment Edit | Basic fields only | All items, expenses, add/remove |
| Selling Price | In shipment/sales | Independent modal on dashboard |
| Sale Payments | Single status field | Payment history with actions |
| Sale Discounts | Not available | Percent & amount fields |
| Sales View | Flat list with basic filter | Grouped, multi-filtered, expandable |
| Payment Tracking | Status only | Full payment history with edit/delete |

---

**End of Action Plan**
