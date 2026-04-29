import {
  Tenant,
  Operator,
  Document,
  CoSignPolicy,
  BlockchainEvent,
  RecoveryAlias,
} from '../types';

let tenants: Map<string, Tenant> = new Map();
let operators: Map<string, Map<string, Operator>> = new Map();
let documents: Map<string, Document[]> = new Map();
let coSignPolicies: Map<string, CoSignPolicy[]> = new Map();
let blockchainEvents: BlockchainEvent[] = [];
let recoveryAliases: RecoveryAlias[] = [];

let eventId = 0;
let tenantIdCounter = 2;
let blockNumber = 1000;

function nextBlock(): number {
  return ++blockNumber;
}

function randomTxHash(): string {
  return '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
}

function addEvent(
  type: BlockchainEvent['type'],
  actor: string,
  description: string,
  tenantId?: string,
  data?: Record<string, any>
) {
  blockchainEvents.push({
    id: `evt_${++eventId}`,
    txHash: randomTxHash(),
    type,
    actor,
    description,
    timestamp: new Date(),
    blockNumber: nextBlock(),
    gasUsed: Math.floor(Math.random() * 200000) + 50000,
    tenantId,
    data: data || {},
  });

  if (blockchainEvents.length > 1000) {
    blockchainEvents = blockchainEvents.slice(-1000);
  }
}

// Initialize sample data
const initializeSampleData = () => {
  const tenant1: Tenant = {
    id: 't1',
    name: 'Finance Operations',
    admin: '0xadmin002',
    operatorManager: '0xopmgr001',
    treasury: '0xtreasury001',
    isActive: true,
    createdAt: new Date('2024-01-15'),
    config: {
      minOperatorStake: 1,
      unstakeCooldown: 7 * 24 * 60 * 60,
    },
  };

  const tenant2: Tenant = {
    id: 't2',
    name: 'HR & Compliance',
    admin: '0xadmin003',
    operatorManager: '0xopmgr002',
    treasury: '0xtreasury002',
    isActive: true,
    createdAt: new Date('2024-02-20'),
    config: {
      minOperatorStake: 0.5,
      unstakeCooldown: 3 * 24 * 60 * 60,
    },
  };

  tenants.set(tenant1.id, tenant1);
  tenants.set(tenant2.id, tenant2);

  const op1: Operator = {
    id: 'op1',
    tenantId: 't1',
    address: '0xoperator001',
    stakeAmount: 2,
    isActive: true,
    joinedAt: new Date('2024-01-20'),
    metadataURI: 'ipfs://QmX1...',
  };

  const op2: Operator = {
    id: 'op2',
    tenantId: 't1',
    address: '0xoperator002',
    stakeAmount: 1.5,
    isActive: true,
    joinedAt: new Date('2024-01-25'),
  };

  const tenantOps = new Map();
  tenantOps.set(op1.address, op1);
  tenantOps.set(op2.address, op2);
  operators.set('t1', tenantOps);

  const doc1: Document = {
    id: 'doc1',
    tenantId: 't1',
    fileHash: '0xabcd1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab',
    fileName: 'Invoice_2024_001.pdf',
    docType: 'receipt',
    issuedBy: '0xoperator001',
    issuedAt: new Date('2024-03-01'),
    isValid: true,
    coSigners: ['0xoperator001', '0xoperator002'],
    coSignQualified: true,
    metadata: {
      amount: 5000,
      recipient: '0xrecipient001',
    },
  };

  const doc2: Document = {
    id: 'doc2',
    tenantId: 't1',
    fileHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcd',
    fileName: 'Contract_VendorA.pdf',
    docType: 'contract',
    issuedBy: '0xoperator001',
    issuedAt: new Date('2024-03-15'),
    isValid: true,
    coSigners: ['0xoperator001'],
    coSignQualified: false,
  };

  documents.set('t1', [doc1, doc2]);

  const policy: CoSignPolicy = {
    tenantId: 't1',
    docType: 'receipt',
    enabled: true,
    minSigners: 2,
    requiredRoles: ['operator'],
    whitelistedOperators: ['0xoperator001', '0xoperator002'],
  };

  coSignPolicies.set('t1', [policy]);

  addEvent('tenant_created', '0xadmin001', `Tenant "Finance Operations" created`, 't1');
  addEvent('operator_joined', '0xoperator001', 'Operator joined with 2 ETH stake', 't1');
  addEvent('operator_joined', '0xoperator002', 'Operator joined with 1.5 ETH stake', 't1');
  addEvent('document_anchored', '0xoperator001', 'Document "Invoice_2024_001.pdf" registered', 't1');
  addEvent('document_cosigned', '0xoperator002', 'Document co-signed', 't1');
  addEvent('document_qualified', '0xoperator002', 'Document reached co-sign threshold', 't1');
  addEvent('tenant_created', '0xadmin001', `Tenant "HR & Compliance" created`, 't2');
};

initializeSampleData();

// ============ TENANT MANAGEMENT ============
export const blockchainService = {
  getTenants: () => Array.from(tenants.values()),
  getTenant: (id: string) => tenants.get(id),

  createTenant: (name: string, admin: string, operatorManager: string, treasury: string): Tenant => {
    const id = `t${++tenantIdCounter}`;
    const tenant: Tenant = {
      id,
      name,
      admin,
      operatorManager,
      treasury,
      isActive: true,
      createdAt: new Date(),
      config: {
        minOperatorStake: 1,
        unstakeCooldown: 7 * 24 * 60 * 60,
      },
    };
    tenants.set(id, tenant);
    addEvent('tenant_created', admin, `Tenant "${name}" created`, id);
    return tenant;
  },

  setTenantStatus: (tenantId: string, isActive: boolean, actor: string) => {
    const tenant = tenants.get(tenantId);
    if (tenant) {
      tenant.isActive = isActive;
      addEvent('config_updated', actor, `Tenant "${tenant.name}" ${isActive ? 'activated' : 'deactivated'}`, tenantId);
    }
  },

  updateTenantConfig: (tenantId: string, minStake: number, cooldown: number, actor: string) => {
    const tenant = tenants.get(tenantId);
    if (tenant) {
      tenant.config.minOperatorStake = minStake;
      tenant.config.unstakeCooldown = cooldown;
      addEvent('config_updated', actor, `Tenant config updated: minStake=${minStake}, cooldown=${cooldown}s`, tenantId);
    }
  },

  setTreasury: (tenantId: string, newTreasury: string, actor: string) => {
    const tenant = tenants.get(tenantId);
    if (tenant) {
      const old = tenant.treasury;
      tenant.treasury = newTreasury;
      addEvent('treasury_updated', actor, `Treasury changed from ${old} to ${newTreasury}`, tenantId, { oldTreasury: old, newTreasury });
    }
  },

  setOperatorManager: (tenantId: string, newManager: string, actor: string) => {
    const tenant = tenants.get(tenantId);
    if (tenant) {
      const old = tenant.operatorManager;
      tenant.operatorManager = newManager;
      addEvent('role_granted', actor, `Operator Manager changed from ${old} to ${newManager}`, tenantId);
    }
  },

  // ============ OPERATOR MANAGEMENT ============
  getOperators: (tenantId: string): Operator[] => {
    return Array.from(operators.get(tenantId)?.values() || []);
  },

  getOperator: (tenantId: string, address: string) => {
    return operators.get(tenantId)?.get(address);
  },

  joinAsOperator: (tenantId: string, address: string, stakeAmount: number): Operator => {
    if (!operators.has(tenantId)) {
      operators.set(tenantId, new Map());
    }

    const op: Operator = {
      id: `op_${Math.random().toString(36).substr(2, 9)}`,
      tenantId,
      address,
      stakeAmount,
      isActive: true,
      joinedAt: new Date(),
    };

    operators.get(tenantId)!.set(address, op);
    addEvent('operator_joined', address, `Operator joined with ${stakeAmount} ETH stake`, tenantId, { stakeAmount });
    return op;
  },

  topUpStake: (tenantId: string, address: string, amount: number) => {
    const op = operators.get(tenantId)?.get(address);
    if (op) {
      op.stakeAmount += amount;
      addEvent('operator_staked', address, `Operator topped up ${amount} ETH (total: ${op.stakeAmount})`, tenantId, { amount, newTotal: op.stakeAmount });
    }
  },

  requestUnstake: (tenantId: string, address: string) => {
    const op = operators.get(tenantId)?.get(address);
    if (op) {
      const tenant = tenants.get(tenantId);
      if (tenant) {
        op.pendingUnstakeAt = new Date(Date.now() + tenant.config.unstakeCooldown * 1000);
        addEvent('operator_unstake_requested', address, `Unstake requested, available at ${op.pendingUnstakeAt.toLocaleString()}`, tenantId);
      }
    }
  },

  executeUnstake: (tenantId: string, address: string) => {
    const op = operators.get(tenantId)?.get(address);
    if (op && op.pendingUnstakeAt && new Date() >= op.pendingUnstakeAt) {
      const amount = op.stakeAmount;
      op.stakeAmount = 0;
      op.isActive = false;
      op.pendingUnstakeAt = undefined;
      addEvent('operator_unstaked', address, `Operator unstaked ${amount} ETH`, tenantId, { amount });
    }
  },

  setOperatorStatus: (tenantId: string, address: string, isActive: boolean, actor: string) => {
    const op = operators.get(tenantId)?.get(address);
    if (op) {
      op.isActive = isActive;
      if (!isActive) op.pendingUnstakeAt = undefined;
      addEvent('operator_status_changed', actor, `Operator ${address} ${isActive ? 'activated' : 'deactivated'}`, tenantId, { operatorAddress: address, isActive });
    }
  },

  slashOperator: (tenantId: string, address: string, reason: string, actor: string) => {
    const op = operators.get(tenantId)?.get(address);
    const tenant = tenants.get(tenantId);
    if (op && tenant) {
      const slashedAmount = op.stakeAmount;
      op.stakeAmount = 0;
      op.isActive = false;
      op.pendingUnstakeAt = undefined;
      addEvent('operator_slashed', actor, `Operator slashed: ${slashedAmount} ETH seized. Reason: ${reason}`, tenantId, { operatorAddress: address, slashedAmount, reason, treasury: tenant.treasury });
    }
  },

  softSlashOperator: (tenantId: string, address: string, penaltyBps: number, reason: string, actor: string) => {
    const op = operators.get(tenantId)?.get(address);
    const tenant = tenants.get(tenantId);
    if (op && tenant) {
      const slashAmount = (op.stakeAmount * penaltyBps) / 10000;
      op.stakeAmount -= slashAmount;
      op.pendingUnstakeAt = undefined;
      if (op.stakeAmount < tenant.config.minOperatorStake) {
        op.isActive = false;
      }
      addEvent('operator_soft_slashed', actor, `Operator soft-slashed: ${slashAmount.toFixed(4)} ETH (${penaltyBps / 100}%). Reason: ${reason}`, tenantId, { operatorAddress: address, slashAmount, penaltyBps, remainingStake: op.stakeAmount });
    }
  },

  // ============ DOCUMENT MANAGEMENT ============
  getDocuments: (tenantId: string): Document[] => {
    return documents.get(tenantId) || [];
  },

  getDocument: (tenantId: string, fileHash: string) => {
    return documents.get(tenantId)?.find((d) => d.fileHash === fileHash);
  },

  getDocumentByHash: (fileHash: string): Document | null => {
    for (const docs of documents.values()) {
      const found = docs.find((d) => d.fileHash === fileHash);
      if (found) return found;
    }
    return null;
  },

  registerDocument: (
    tenantId: string,
    fileHash: string,
    fileName: string,
    docType: Document['docType'],
    issuedBy: string,
    metadata?: Document['metadata']
  ): Document => {
    if (!documents.has(tenantId)) {
      documents.set(tenantId, []);
    }

    const doc: Document = {
      id: `doc_${Math.random().toString(36).substr(2, 9)}`,
      tenantId,
      fileHash,
      fileName,
      docType,
      issuedBy,
      issuedAt: new Date(),
      isValid: true,
      coSigners: [issuedBy],
      coSignQualified: false,
      metadata,
    };

    documents.get(tenantId)!.push(doc);
    addEvent('document_anchored', issuedBy, `Document "${fileName}" anchored on-chain`, tenantId, { fileHash, docType });
    return doc;
  },

  coSignDocument: (tenantId: string, fileHash: string, signer: string): Document | null => {
    const doc = documents.get(tenantId)?.find((d) => d.fileHash === fileHash);
    if (doc && !doc.coSigners.includes(signer)) {
      doc.coSigners.push(signer);
      addEvent('document_cosigned', signer, `Document co-signed`, tenantId, { fileHash });

      const policy = coSignPolicies.get(tenantId)?.find((p) => p.docType === doc.docType);
      if (policy && doc.coSigners.length >= policy.minSigners && !doc.coSignQualified) {
        doc.coSignQualified = true;
        addEvent('document_qualified', signer, `Document reached co-sign qualification`, tenantId, { fileHash });
      }

      return doc;
    }
    return doc || null;
  },

  revokeDocument: (tenantId: string, fileHash: string, revokedBy: string) => {
    const doc = documents.get(tenantId)?.find((d) => d.fileHash === fileHash);
    if (doc) {
      doc.isValid = false;
      addEvent('document_revoked', revokedBy, `Document "${doc.fileName}" revoked`, tenantId, { fileHash });
    }
  },

  // ============ CO-SIGN POLICY ============
  getCoSignPolicies: (tenantId: string): CoSignPolicy[] => {
    return coSignPolicies.get(tenantId) || [];
  },

  setCoSignPolicy: (policy: CoSignPolicy, actor: string) => {
    if (!coSignPolicies.has(policy.tenantId)) {
      coSignPolicies.set(policy.tenantId, []);
    }
    const existing = coSignPolicies
      .get(policy.tenantId)
      ?.findIndex((p) => p.docType === policy.docType);
    if (existing !== undefined && existing >= 0) {
      coSignPolicies.get(policy.tenantId)![existing] = policy;
    } else {
      coSignPolicies.get(policy.tenantId)!.push(policy);
    }
    addEvent('policy_updated', actor, `Co-sign policy updated for "${policy.docType}"`, policy.tenantId, { docType: policy.docType, minSigners: policy.minSigners });
  },

  // ============ RECOVERY ============
  getRecoveryAliases: (tenantId: string) => {
    return recoveryAliases.filter((a) => a.tenantId === tenantId);
  },

  recoverOperator: (
    tenantId: string,
    fromAddress: string,
    toAddress: string,
    recoveredBy: string
  ): RecoveryAlias => {
    const tenantOps = operators.get(tenantId);
    if (tenantOps && tenantOps.has(fromAddress)) {
      const op = tenantOps.get(fromAddress)!;
      op.address = toAddress;
      tenantOps.delete(fromAddress);
      tenantOps.set(toAddress, op);
    }

    const alias: RecoveryAlias = {
      tenantId,
      fromAddress,
      toAddress,
      recoveredAt: new Date(),
      recoveredBy,
    };

    recoveryAliases.push(alias);
    addEvent('operator_recovered', recoveredBy, `Operator recovered: ${fromAddress.slice(0, 10)}... → ${toAddress.slice(0, 10)}...`, tenantId, { fromAddress, toAddress });
    return alias;
  },

  // ============ EVENTS / TRANSACTIONS ============
  getEvents: (): BlockchainEvent[] => blockchainEvents,

  getEventsByTenant: (tenantId: string): BlockchainEvent[] => {
    return blockchainEvents.filter((e) => e.tenantId === tenantId);
  },

  getEventsByActor: (actor: string): BlockchainEvent[] => {
    return blockchainEvents.filter((e) => e.actor === actor);
  },

  searchTransactions: (query: string): BlockchainEvent[] => {
    const q = query.toLowerCase();
    return blockchainEvents.filter(
      (e) =>
        e.txHash.toLowerCase().includes(q) ||
        e.actor.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q) ||
        e.type.toLowerCase().includes(q) ||
        (e.tenantId && e.tenantId.toLowerCase().includes(q))
    );
  },

  clearEvents: () => {
    blockchainEvents = [];
  },

  getEventStatistics: () => {
    return {
      totalEvents: blockchainEvents.length,
      byType: blockchainEvents.reduce(
        (acc, e) => {
          acc[e.type] = (acc[e.type] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      ),
      uniqueActors: new Set(blockchainEvents.map((e) => e.actor)).size,
      totalGasUsed: blockchainEvents.reduce((sum, e) => sum + e.gasUsed, 0),
    };
  },

  // ============ VERIFY DOCUMENT (UI-only stub) ============
  verifyDocument: (fileHash: string): { found: boolean; document: Document | null; message: string } => {
    // Stub - in real implementation would call smart contract
    const doc = blockchainService.getDocumentByHash(fileHash);
    if (doc) {
      return {
        found: true,
        document: doc,
        message: 'Document found on-chain. Verification would be performed by smart contract.',
      };
    }
    return {
      found: false,
      document: null,
      message: 'Document not found. In production, this would query the blockchain directly.',
    };
  },
};
