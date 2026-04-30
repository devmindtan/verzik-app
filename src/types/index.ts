// Role types - 3 separate tenant roles + protocol level + end-user
export type UserRole =
  | 'protocol_admin'
  | 'tenant_admin'
  | 'tenant_operator'
  | 'tenant_treasury'
  | 'end_user'
  | 'none';

// Tenant - 3 separate role holders
export interface Tenant {
  id: string;
  name: string;
  admin: string;       // Tenant Admin - manages tenant config, operators, policies
  operatorManager: string; // Operator Manager - manages operator lifecycle, slashing
  treasury: string;     // Treasury - ONLY receives slashed funds, no other power
  isActive: boolean;
  createdAt: Date;
  config: {
    minOperatorStake: number;
    unstakeCooldown: number;
  };
}

// Operator
export interface Operator {
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

// Document
export interface Document {
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

// Co-Sign Policy
export interface CoSignPolicy {
  tenantId: string;
  docType: string;
  enabled: boolean;
  minSigners: number;
  requiredRoles: string[];
  whitelistedOperators: string[];
}

// Blockchain Event / Transaction
export interface BlockchainEvent {
  id: string;
  txHash: string;
  tenantId?: string;
  type:
    | 'tenant_created'
    | 'operator_joined'
    | 'operator_staked'
    | 'operator_unstake_requested'
    | 'operator_unstaked'
    | 'operator_status_changed'
    | 'operator_slashed'
    | 'operator_soft_slashed'
    | 'operator_recovered'
    | 'document_anchored'
    | 'document_cosigned'
    | 'document_revoked'
    | 'document_qualified'
    | 'policy_updated'
    | 'treasury_updated'
    | 'config_updated'
    | 'role_granted'
    | 'operator_recovery_delegate_updated'
    | 'operator_metadata_updated';
  actor: string;
  description: string;
  timestamp: Date;
  blockNumber: number;
  gasUsed: number;
  data: Record<string, any>;
}

// Recovery Alias
export interface RecoveryAlias {
  tenantId: string;
  fromAddress: string;
  toAddress: string;
  recoveredAt: Date;
  recoveredBy: string;
}

// Session/Auth
export interface UserSession {
  address: string;
  role: UserRole;
  tenantId?: string;
  isConnected: boolean;
}
