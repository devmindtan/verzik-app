# Blockchain Protocol Management System

A comprehensive platform for managing blockchain-based document signing and operator governance with role-based access control. This is a **demo/prototype application** with mock data suitable for business process validation and feature demonstration.

## Overview

This system implements a hierarchical blockchain governance model for document authentication:

- **Protocol Owner**: System administrator with full platform control
- **Tenant**: Independent operational units managing their own operators and policies
- **Operator**: Individual or organizational entities that sign and verify documents
- **Documents**: Blockchain-anchored records with multi-signature support

## Key Features

### 1. Role-Based Access Control (RBAC)
- **Protocol Admin**: Create tenants, manage global settings
- **Tenant Admin**: Manage tenant operators, configure policies
- **Operator Manager**: Manage operators, execute slashing
- **Operator**: Register and co-sign documents
- Automatic permission enforcement based on connected wallet

### 2. Tenant Management
- Create and manage independent tenants
- Configure operator stakes and cooldown periods
- Set treasury addresses for penalties
- View operator and document statistics per tenant

### 3. Operator Lifecycle
- Join operators with stake requirements
- Top-up stakes for increased commitment
- Request/execute unstaking with cooldown periods
- Slash operators for violations with penalty percentages
- Automatic deactivation when stakes fall below minimum
- Recovery mechanism for lost wallets via delegates

### 4. Document Management
- Register documents with file hashes
- Support multiple document types (voucher, contract, certificate, receipt)
- Track metadata (amounts, recipients, expiry dates)
- Co-sign documents with policy enforcement
- Automatic "qualified" status when meeting co-sign requirements
- Document revocation capabilities

### 5. Co-Sign Policies
- Define minimum signers per document type
- Whitelist specific operators for sensitive documents
- Require specific roles in signing process
- Automatic policy evaluation and qualification
- Configurable trust levels and penalty structures

### 6. Event Tracking
- Comprehensive blockchain event logging
- Track all actions: tenant creation, operator changes, document anchoring, co-signs
- Filter events by tenant, actor, or type
- Real-time event statistics

## Technology Stack

- **Frontend**: React 18 + TypeScript
- **Styling**: Tailwind CSS + custom components
- **Icons**: Lucide React
- **Build**: Vite
- **State**: React Context API
- **Data**: Mock in-memory service (easily replaceable with Supabase/blockchain)

## Project Structure

```
src/
├── components/          # Reusable UI components
│   └── Navigation.tsx   # Main navigation bar
├── contexts/            # React context providers
│   └── AuthContext.tsx  # Authentication state
├── pages/               # Page components
│   ├── LoginPage.tsx
│   ├── DashboardPage.tsx
│   ├── TenantManagementPage.tsx
│   ├── OperatorManagementPage.tsx
│   └── DocumentManagementPage.tsx
├── services/            # Business logic
│   ├── blockchainService.ts  # Mock blockchain operations
│   └── authService.ts        # Authentication & RBAC
├── types/               # TypeScript definitions
│   └── index.ts
└── App.tsx              # Root component
```

## Getting Started

### Prerequisites
- Node.js 16+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Demo Accounts

The system comes with pre-configured demo accounts:

| Role | Address | Description |
|------|---------|-------------|
| Protocol Admin | `0xadmin001` | Full system control |
| Tenant Admin | `0xadmin002` | Manages HR & Compliance tenant |
| Operator 1 | `0xoperator001` | Finance Tenant operator |
| Operator 2 | `0xoperator002` | Finance Tenant co-signer |

**Quick Start**: Click "Connect" and select any demo account to start exploring.

## Workflow Examples

### Example 1: Register a Document
1. Login as an Operator
2. Go to Documents page
3. Click "Register Document"
4. Fill in file hash, name, and type
5. Submit to anchor on blockchain

### Example 2: Co-Sign a Document
1. Login as a different Operator
2. View the registered document
3. Click "Co-Sign"
4. Provide signer address
5. Once minimum signers met, document becomes "Qualified"

### Example 3: Manage Operators (as Tenant Admin)
1. Login as Tenant Admin
2. Go to Operators page
3. Add new operators with stake amounts
4. Monitor stake levels and status
5. Slash operators for violations
6. Execute unstaking for departing operators

## Data Persistence

**Current Implementation**: All data is stored in JavaScript memory and will reset on page refresh. This is ideal for:
- Feature demonstrations
- Business logic validation
- UI/UX testing
- Workflow exploration

**Future Enhancement**: Replace `blockchainService.ts` with:
- Real blockchain integration (Ethereum/EVM)
- Supabase PostgreSQL backend
- IPFS for document storage
- Smart contract interaction

## Mock Data Initialization

The system initializes with sample data:
- 2 Tenants (Finance, HR & Compliance)
- 2 Operators in Finance tenant
- 1 Sample document with co-signers
- Pre-configured co-sign policies

Modify `blockchainService.ts` `initializeSampleData()` function to customize initial state.

## API Reference

### blockchainService

#### Tenants
```typescript
getTenants(): Tenant[]
getTenant(id: string): Tenant | undefined
createTenant(name, admin, treasury): Tenant
setTenantStatus(tenantId, isActive): void
updateTenantConfig(tenantId, minStake, cooldown): void
```

#### Operators
```typescript
getOperators(tenantId): Operator[]
getOperator(tenantId, address): Operator | undefined
joinAsOperator(tenantId, address, stakeAmount): Operator
topUpStake(tenantId, address, amount): void
requestUnstake(tenantId, address): void
executeUnstake(tenantId, address): void
setOperatorStatus(tenantId, address, isActive): void
slashOperator(tenantId, address, reason): void
```

#### Documents
```typescript
getDocuments(tenantId): Document[]
getDocument(tenantId, fileHash): Document | undefined
registerDocument(tenantId, fileHash, fileName, docType, issuedBy, metadata?): Document
coSignDocument(tenantId, fileHash, signer): Document | null
revokeDocument(tenantId, fileHash, revokedBy): void
```

#### Events
```typescript
getEvents(): BlockchainEvent[]
getEventsByTenant(tenantId): BlockchainEvent[]
getEventsByActor(actor): BlockchainEvent[]
getEventStatistics(): { totalEvents, byType, uniqueActors }
```

## Permission Model

| Feature | Protocol Admin | Tenant Admin | Operator Manager | Operator |
|---------|---|---|---|---|
| Create Tenant | ✓ | | | |
| Manage Tenants | ✓ | ✓ | | |
| View All Data | ✓ | | | |
| Manage Operators | ✓ | ✓ | ✓ | |
| Set Policies | ✓ | ✓ | ✓ | |
| Register Documents | ✓ | ✓ | ✓ | ✓ |
| Co-Sign Documents | ✓ | ✓ | ✓ | ✓ |
| Recover Operators | ✓ | ✓ | | |

## Integration with Blockchain

To connect to actual blockchain:

1. **Replace mockData** with smart contract calls:
```typescript
// Example: Web3.js or Ethers.js integration
const contract = new ethers.Contract(address, ABI, signer);
const tenant = await contract.getTenant(tenantId);
```

2. **Update authService** to use Web3 wallet connection:
```typescript
const provider = new ethers.providers.Web3Provider(window.ethereum);
const signer = provider.getSigner();
```

3. **Implement transaction signing**:
```typescript
const tx = await contract.registerDocument(fileHash, fileName, docType);
await tx.wait();
```

## Security Considerations

- All operations enforced by role-based permissions
- Addresses and stakes stored but not exposed in outputs
- Demo uses mock addresses (not real private keys)
- Production requires:
  - Proper key management
  - Transaction signing
  - Smart contract audits
  - Rate limiting
  - Input validation

## Browser Support

- Chrome/Edge (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)

## Troubleshooting

**Q: Data disappears on refresh?**
A: This is normal - all data is in-memory. Data persists during the session.

**Q: How do I add more demo accounts?**
A: Edit `authService.ts` and add entries to the `sessions` Map in the initialization.

**Q: Can I modify the co-sign policy?**
A: Yes, use the Tenant Management page to configure policies for your tenant.

## License

MIT License - See LICENSE file for details

## Support

For questions or issues:
1. Check the code comments
2. Review blockchain service implementation
3. Examine mock data initialization
4. Verify role permissions in authService

---

**Version**: 1.0.0  
**Last Updated**: 2024  
**Status**: Demo/Prototype - Ready for Business Process Testing
