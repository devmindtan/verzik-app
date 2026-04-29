import { UserSession, UserRole } from '../types';

export const authService = {
  sessions: new Map<string, UserSession>([
    [
      '0xadmin001',
      {
        address: '0xadmin001',
        role: 'protocol_admin',
        isConnected: true,
      },
    ],
    [
      '0xadmin002',
      {
        address: '0xadmin002',
        role: 'tenant_admin',
        tenantId: 't1',
        isConnected: true,
      },
    ],
    [
      '0xopmgr001',
      {
        address: '0xopmgr001',
        role: 'tenant_operator',
        tenantId: 't1',
        isConnected: true,
      },
    ],
    [
      '0xtreasury001',
      {
        address: '0xtreasury001',
        role: 'tenant_treasury',
        tenantId: 't1',
        isConnected: true,
      },
    ],
    [
      '0xoperator001',
      {
        address: '0xoperator001',
        role: 'none',
        tenantId: 't1',
        isConnected: true,
      },
    ],
    [
      '0xoperator002',
      {
        address: '0xoperator002',
        role: 'none',
        tenantId: 't1',
        isConnected: true,
      },
    ],
  ]),

  getCurrentSession: (): UserSession | null => {
    const stored = localStorage.getItem('currentUser');
    if (stored) {
      const address = JSON.parse(stored);
      return authService.sessions.get(address) || null;
    }
    return null;
  },

  connectWallet: (address: string): UserSession | null => {
    let session = authService.sessions.get(address);
    if (!session) {
      session = {
        address,
        role: 'none',
        isConnected: true,
      };
      authService.sessions.set(address, session);
    }
    session.isConnected = true;
    localStorage.setItem('currentUser', JSON.stringify(address));
    return session;
  },

  disconnectWallet: () => {
    localStorage.removeItem('currentUser');
  },

  getSession: (address: string): UserSession | null => {
    return authService.sessions.get(address) || null;
  },

  grantRole: (address: string, role: UserRole, tenantId?: string) => {
    let session = authService.sessions.get(address);
    if (!session) {
      session = { address, role: 'none', isConnected: false };
      authService.sessions.set(address, session);
    }
    session.role = role;
    if (tenantId) {
      session.tenantId = tenantId;
    }
  },

  hasPermission: (session: UserSession | null, permission: string): boolean => {
    if (!session || !session.isConnected) return false;

    const rolePermissions: Record<UserRole, string[]> = {
      protocol_admin: [
        'create_tenant',
        'view_all_tenants',
        'view_all_operators',
        'view_all_documents',
        'view_events',
        'manage_all_tenants',
      ],
      tenant_admin: [
        'manage_tenant_config',
        'set_treasury',
        'set_operator_manager',
        'view_tenant',
        'view_tenant_operators',
        'view_tenant_documents',
        'view_tenant_events',
        'recover_operator',
        'revoke_document',
      ],
      tenant_operator: [
        'manage_operators',
        'slash_operator',
        'set_policies',
        'create_cosign_policy',
        'set_min_stake',
        'set_cooldown',
        'set_violation_penalty',
        'view_tenant_operators',
        'view_tenant_documents',
        'view_tenant_events',
      ],
      tenant_treasury: [
        'view_tenant',
        'view_slash_proceeds',
        'view_tenant_events',
      ],
      end_user: [
        'view_public',
        'verify_document',
        'search_transactions',
        'view_own_documents',
      ],
      none: ['view_public', 'verify_document', 'search_transactions', 'register_document', 'cosign_document'],
    };

    return rolePermissions[session.role]?.includes(permission) || false;
  },

  getRoleLabel: (role: UserRole | undefined): string => {
    const labels: Record<UserRole, string> = {
      protocol_admin: 'Protocol Admin',
      tenant_admin: 'Tenant Admin',
      tenant_operator: 'Operator Manager',
      tenant_treasury: 'Treasury',
      end_user: 'End User',
      none: 'Connected Wallet',
    };
    return labels[role || 'none'];
  },

  getRoleDescription: (role: UserRole | undefined): string => {
    const descriptions: Record<UserRole, string> = {
      protocol_admin: 'Full system control. Create and manage all tenants.',
      tenant_admin: 'Manage tenant config, set treasury & operator manager, revoke documents.',
      tenant_operator: 'Manage operator lifecycle, slashing, co-sign policies, penalties.',
      tenant_treasury: 'Receive slashed funds only. No management power.',
      end_user: 'Read-only access. View documents signed by operators for your wallet.',
      none: 'Basic access: verify documents and search transactions.',
    };
    return descriptions[role || 'none'];
  },
};
