# System Architecture

## High-Level Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend Layer (React)                │
│  ┌────────────────────────────────────────────────────┐  │
│  │  Pages (Dashboard, Tenants, Operators, Documents) │  │
│  │         + Navigation + Authentication             │  │
│  └────────────────────────────────────────────────────┘  │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│               Business Logic Layer                      │
│  ┌────────────────────────────────────────────────────┐  │
│  │  blockchainService: Core Operations              │  │
│  │  - Tenant management                             │  │
│  │  - Operator lifecycle                            │  │
│  │  - Document registration & co-signing            │  │
│  │  - Event tracking                                │  │
│  │  - Recovery mechanisms                           │  │
│  └────────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────────┐  │
│  │  authService: RBAC & Session Management          │  │
│  │  - Role-based permissions                        │  │
│  │  - Session/wallet management                     │  │
│  │  - Access control enforcement                    │  │
│  └────────────────────────────────────────────────────┘  │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│              Data Persistence Layer                     │
│  ┌────────────────────────────────────────────────────┐  │
│  │  In-Memory Storage (Maps/Arrays)                  │  │
│  │  - Tenants                                        │  │
│  │  - Operators (per tenant)                         │  │
│  │  - Documents (per tenant)                         │  │
│  │  - Co-Sign Policies                              │  │
│  │  - Recovery Aliases                              │  │
│  │  - Event Log                                      │  │
│  └────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

## Component Hierarchy

```
App
├── AuthProvider
│   └── AuthContext
│       └── useAuth()
│
├── Navigation
│   └── Role-based menu rendering
│
└── Pages (based on currentPage state)
    ├── LoginPage
    │   └── Demo account selection
    │
    ├── DashboardPage
    │   ├── Stats cards
    │   ├── Tenant overview
    │   ├── Event statistics
    │   └── Recent events
    │
    ├── TenantManagementPage
    │   ├── Tenant cards
    │   ├── Create modal
    │   └── Details modal
    │
    ├── OperatorManagementPage
    │   ├── Tenant selector
    │   ├── Operator table
    │   └── Add operator modal
    │
    └── DocumentManagementPage
        ├── Document grid
        ├── Register modal
        └── Co-sign modal
```

## Data Flow

### 1. Authentication Flow
```
User → LoginPage
  ↓
Connect wallet (select demo account)
  ↓
authService.connectWallet()
  ↓
AuthContext updated
  ↓
Navigate to Dashboard with role-based permissions
```

### 2. Tenant Creation Flow
```
TenantManagementPage
  ↓
Fill form → Submit
  ↓
blockchainService.createTenant()
  ↓
Create Tenant object
  ↓
Store in tenants Map
  ↓
Add blockchain event
  ↓
UI refresh with new tenant
```

### 3. Document Registration & Co-Signing Flow
```
Operator views DocumentManagementPage
  ↓
Register Document
  ↓
blockchainService.registerDocument()
  ↓
Create Document + Add to documents[]
  ↓
coSigners = [issuedBy]
  ↓
coSignQualified = false
  ↓
Another Operator Co-Signs
  ↓
blockchainService.coSignDocument()
  ↓
Add signer to coSigners[]
  ↓
Check policy → minSigners met?
  ↓
If YES → coSignQualified = true
  ↓
UI shows qualified status with checkmark
```

### 4. Operator Slashing Flow
```
TenantAdmin → OperatorManagementPage
  ↓
Click Slash on operator
  ↓
Enter reason
  ↓
blockchainService.slashOperator()
  ↓
Set isActive = false
  ↓
Set stakeAmount = 0
  ↓
Create blockchain event
  ↓
Operator removed from active list
```

## State Management

### Authentication State (React Context)
```typescript
interface AuthContextType {
  session: UserSession | null;
  connectWallet: (address: string) => void;
  disconnectWallet: () => void;
  isLoading: boolean;
}
```

### Application State (Local State)
- Current page (navigation)
- Modal open/close states
- Form inputs
- Selected tenant/document/operator

### Business State (blockchainService)
- All tenants
- All operators (nested by tenant)
- All documents (nested by tenant)
- All events (global)
- Co-sign policies
- Recovery aliases

## Role-Based Access Control (RBAC)

### Permission Matrix
```
┌──────────────────┬────────┬──────────┬──────────────┬──────────┐
│ Action           │ Admin  │ T.Admin  │ Op.Manager   │ Operator │
├──────────────────┼────────┼──────────┼──────────────┼──────────┤
│ Create Tenant    │   ✓    │          │              │          │
│ Manage Tenant    │   ✓    │    ✓     │              │          │
│ Create Operator  │   ✓    │    ✓     │      ✓       │          │
│ Slash Operator   │   ✓    │    ✓     │      ✓       │          │
│ Set Policies     │   ✓    │    ✓     │      ✓       │          │
│ Register Doc     │   ✓    │    ✓     │      ✓       │     ✓    │
│ Co-Sign Doc      │   ✓    │    ✓     │      ✓       │     ✓    │
│ View All Data    │   ✓    │          │              │          │
│ View Tenant Data │   ✓    │    ✓     │      ✓       │          │
└──────────────────┴────────┴──────────┴──────────────┴──────────┘
```

### Permission Enforcement
```typescript
// Example from authService.ts
hasPermission(session, permission): boolean {
  if (!session?.isConnected) return false;
  
  const rolePermissions = {
    'protocol_admin': ['create_tenant', 'view_all_tenants', ...],
    'tenant_admin': ['manage_tenant_config', 'manage_operators', ...],
    'operator_manager': ['manage_operators', 'slash_operator', ...],
    'operator': ['register_document', 'cosign_document', ...],
  };
  
  return rolePermissions[session.role]?.includes(permission) || false;
}
```

## Data Models

### Tenant
```typescript
{
  id: string;
  name: string;
  admin: string;
  treasury: string;
  isActive: boolean;
  createdAt: Date;
  config: {
    minOperatorStake: number;
    unstakeCooldown: number;
  };
}
```

### Operator
```typescript
{
  id: string;
  tenantId: string;
  address: string;
  stakeAmount: number;
  isActive: boolean;
  joinedAt: Date;
  metadataURI?: string;
  pendingUnstakeAt?: Date;
  recoveryDelegate?: string;
}
```

### Document
```typescript
{
  id: string;
  tenantId: string;
  fileHash: string;
  fileName: string;
  docType: 'voucher' | 'contract' | 'certificate' | 'receipt';
  issuedBy: string;
  issuedAt: Date;
  isValid: boolean;
  coSigners: string[];
  coSignQualified: boolean;
  metadata?: {
    amount?: number;
    expiryDate?: Date;
    recipient?: string;
  };
}
```

### BlockchainEvent
```typescript
{
  id: string;
  tenantId?: string;
  type: 'tenant_created' | 'operator_joined' | 'document_anchored' | 'cosigned' | 'slash' | 'recover';
  actor: string;
  description: string;
  timestamp: Date;
  data: Record<string, any>;
}
```

## Key Operations

### 1. Tenant Creation
- Validate inputs
- Create Tenant object
- Store in Map
- Log event
- Update UI

### 2. Operator Lifecycle
- **Join**: Validate stake → Create operator → Store → Event
- **Top-Up**: Find operator → Increase stake → Event
- **Request Unstake**: Set pending time → Event
- **Execute Unstake**: Check cooldown → Remove operator → Event
- **Slash**: Deactivate → Zero stake → Event

### 3. Document Management
- **Register**: Create document → Add to list → Event
- **Co-Sign**: Add signer → Check policy → Qualify if needed → Event
- **Revoke**: Mark invalid → Event

### 4. Recovery
- **Set Delegate**: Store recovery address
- **Recover**: Migrate data to new address → Link aliases → Event

## Performance Considerations

### Current Implementation
- In-memory storage: O(1) lookups
- No database round-trips
- Events stored as array (1000 max)
- Suitable for demo/prototype

### Future Optimization
- Add indexing for complex queries
- Implement pagination for large datasets
- Use database queries with proper indexes
- Add caching layer for frequently accessed data
- Implement virtual scrolling for large lists

## Extension Points

### 1. Add New Blockchain Operations
```typescript
// In blockchainService.ts
customOperation: (params) => {
  // Implement logic
  addEvent(eventType, actor, description);
  // Return result
}
```

### 2. Add New Pages
```typescript
// Create new page component
function NewPage() { }

// Add to navigation
const navItems = [{ label: 'New', href: 'new' }];

// Add to router
case 'new': return <NewPage />;
```

### 3. Connect to Real Blockchain
```typescript
// Replace blockchainService.ts with Web3 calls
import { ethers } from 'ethers';

const provider = new ethers.providers.Web3Provider(window.ethereum);
const contract = new ethers.Contract(ADDRESS, ABI, provider.getSigner());

const createTenant = async (name, admin, treasury) => {
  const tx = await contract.createTenant(name, admin, treasury);
  await tx.wait();
};
```

## Testing Strategy

### Unit Tests
- Permission checks
- Data transformations
- Event generation

### Integration Tests
- Complete workflows
- Cross-component interactions
- State synchronization

### Manual Testing Scenarios
1. Login with different roles
2. Create tenants as admin
3. Add operators with stakes
4. Register and co-sign documents
5. Execute operator slashing
6. View event logs

## Deployment

### Development
```bash
npm run dev
# Runs on http://localhost:5173
```

### Production Build
```bash
npm run build
# Generates optimized build in dist/
npm run preview
# Preview production build locally
```

### Hosting
- Static hosting (Vercel, Netlify, CloudFlare Pages)
- All data in-memory (no backend needed for demo)
- Ready for integration with blockchain/database

---

**Architecture Version**: 1.0  
**Last Updated**: 2024
