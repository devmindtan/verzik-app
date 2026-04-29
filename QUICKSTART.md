# Quick Start Guide

## 30-Second Setup

```bash
cd project
npm install
npm run dev
```

Open http://localhost:5173 and select a demo account to start exploring.

---

## Demo Workflows

### Scenario 1: Admin Creates Tenant (5 minutes)

1. **Login**: Select "Protocol Admin" account
2. **Navigate**: Click "Tenants" in navbar
3. **Create**: Click "New Tenant" button
4. **Fill Form**:
   - Name: "My Operations"
   - Admin: `0xadmin003`
   - Treasury: `0xtreasury003`
5. **Submit**: Click "Create" button
6. **Verify**: See new tenant in the list

**Key Features Demonstrated**: Role-based access, tenant configuration, RBAC

---

### Scenario 2: Add Operators & Configure Stakes (5 minutes)

1. **Login**: Select "Tenant Admin" (0xadmin002)
2. **Navigate**: Click "Operators"
3. **Add Operator**:
   - Click "Add Operator"
   - Address: `0xoperator003`
   - Stake: `2.5 ETH`
   - Submit
4. **Manage**:
   - See operator in list
   - Click lock icon to toggle status
   - Click lightning icon (⚡) to slash with reason

**Key Features Demonstrated**: Operator lifecycle, stake management, slashing

---

### Scenario 3: Register & Co-Sign Documents (10 minutes)

#### Part A: Register Document
1. **Login**: Select "Operator" (0xoperator001)
2. **Navigate**: Click "Documents"
3. **Register Document**:
   - Click "Register Document"
   - File Hash: `0x1234567890abcdef`
   - File Name: `Invoice_2024_001.pdf`
   - Document Type: "Receipt"
   - Amount: `5000`
   - Submit

#### Part B: Co-Sign Document
1. **Stay on Documents page** or refresh
2. **Find the registered document**
3. **Click "Co-Sign"**:
   - Enter co-signer address: `0xoperator002`
   - Click "Co-Sign"
4. **Observe**:
   - Document now shows 2 co-signers
   - Status changes from "Pending" to "Qualified" (if policy met)
   - Green checkmark appears

**Key Features Demonstrated**: Document anchoring, multi-signature, automatic qualification

---

### Scenario 4: View Dashboard & Events (3 minutes)

1. **Login**: Any account (recommend Protocol Admin for full view)
2. **Navigate**: Click "Dashboard"
3. **Explore**:
   - **Stats Cards**: View tenant, operator, document, qualified doc counts
   - **Tenants Table**: See all tenants with status and info
   - **Event Statistics**: 
     - Total events recorded
     - Unique actors
     - Breakdown by type
   - **Recent Events**: 
     - Newest events from current session
     - Actor, action, and timestamp
     - Color-coded by event type

**Key Features Demonstrated**: Aggregated analytics, event tracking, role-based data filtering

---

## Demo Accounts Reference

```
Protocol Admin
├── Address: 0xadmin001
├── Permissions: Full system access
└── Can: Create tenants, manage all data, view everything

Tenant Admin (HR & Compliance)
├── Address: 0xadmin002
├── Tenant: t2 (HR & Compliance)
├── Permissions: Tenant-level management
└── Can: Manage operators, documents, policies in t2

Operator 1 (Finance Tenant)
├── Address: 0xoperator001
├── Tenant: t1 (Finance Operations)
├── Permissions: Document operations only
└── Can: Register docs, co-sign, view tenant documents

Operator 2 (Finance Tenant)
├── Address: 0xoperator002
├── Tenant: t1 (Finance Operations)
├── Permissions: Document operations only
└── Can: Register docs, co-sign, view tenant documents
```

---

## Key UI Components Explained

### Navigation Bar
- **Logo**: Click to return to dashboard from anywhere
- **Role Badge**: Shows current role and wallet address
- **Menu Items**: Change based on your role (Protocol Admin sees more options)
- **Disconnect**: Switch to different account

### Cards & Tables
- **Hover States**: Most cards and rows highlight on hover
- **Status Badges**: Color-coded (green=active, yellow=pending, red=inactive)
- **Action Buttons**: Icons on hover (⚡ for slash, 🔒 for lock, etc.)
- **Modals**: Forms appear in centered popups for data entry

### Document Workflow
- **Register Card**: Click "Register Document" → fills form → creates document
- **Co-Sign Card**: Click "Co-Sign" → select signer → document updates
- **Status Indicator**: Spinning circle = pending, checkmark = qualified
- **Color Coding**: Purple for documents, blue for actions

---

## Common Tasks

### How to...

**...Create an Operator Stake?**
1. Go to Operators page
2. Click "Add Operator"
3. Enter address and ETH amount
4. Click "Add Operator"

**...Revoke a Document?**
1. Go to Documents page
2. Find the document card
3. Click "Revoke" button
4. Document marked as invalid (X appears)

**...Monitor System Activity?**
1. Go to Dashboard
2. Scroll to "Recent Events" section
3. See all blockchain operations in chronological order
4. Events color-coded by type (blue=anchor, green=cosign, red=slash)

**...Change Operator Status?**
1. Go to Operators page
2. Find operator in table
3. Click lock icon to toggle active/inactive
4. Icon changes immediately

**...View Tenant Details?**
1. Go to Tenants page
2. Click "Details" on a tenant card
3. Modal shows all operators in that tenant
4. Can toggle tenant status or close

---

## Technical Details

### Data Architecture
- All data stored in JavaScript memory (Map and Array)
- No database connection needed
- Data persists for current session only
- Data resets on page refresh (by design for demo)

### Permissions
- Checked client-side before UI element appears
- Also checked server-side before operation (simulated)
- Role-based: Each role has specific allowed actions
- Tenant-scoped: Can't access other tenants unless admin

### Event Logging
- Every action creates a blockchain event
- Events stored with timestamp, actor, description
- Max 1000 events kept in memory (circular buffer)
- Used for audit trail and statistics

---

## Troubleshooting

**Q: I can't see the Operators tab?**  
A: Only Protocol Admin, Tenant Admin, and Operator Manager can see it. Connect as 0xadmin001 or 0xadmin002.

**Q: Document doesn't get "Qualified" after co-signing?**  
A: Check the co-sign policy - might require more signers or specific roles. The system automatically qualifies when policy is met.

**Q: Where does data get saved?**  
A: Nowhere! It's in memory only. Refresh and everything resets. Perfect for testing, not for production.

**Q: Can I add my own demo account?**  
A: Yes! Edit `authService.ts` and add to the `sessions` Map during initialization.

**Q: How do I connect to a real blockchain?**  
A: Replace `blockchainService.ts` with Web3.js or Ethers.js calls. See ARCHITECTURE.md for details.

---

## Next Steps

1. **Explore All Roles**: Connect with each demo account to see different views
2. **Create Full Workflow**: Tenant → Operators → Documents → Co-Sign
3. **Review Code**: Check services to understand the implementation
4. **Plan Integration**: Decide how to connect to your blockchain/database
5. **Customize**: Add your branding, tenant names, and policies

---

## Support

- **Architecture Details**: See ARCHITECTURE.md
- **Full Documentation**: See README.md
- **Code Reference**: Inline comments in service files
- **Business Logic**: See blockchainService.ts
- **Permissions**: See authService.ts

---

**Version**: 1.0  
**Last Updated**: 2024  
**Status**: Ready for Business Demo
