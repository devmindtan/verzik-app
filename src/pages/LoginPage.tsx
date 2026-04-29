import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/authService';

interface LoginPageProps {
  onSuccess: () => void;
}

export function LoginPage({ onSuccess }: LoginPageProps) {
  const { connectWallet } = useAuth();

  const predefinedAccounts = [
    {
      address: '0xadmin001',
      role: 'protocol_admin' as const,
      label: 'Protocol Admin',
      description: 'System administrator. Create and manage all tenants.',
      color: 'from-red-500 to-orange-500',
    },
    {
      address: '0xadmin002',
      role: 'tenant_admin' as const,
      tenantId: 't1',
      label: 'Tenant Admin',
      description: 'Manage tenant config, set treasury & operator manager, revoke documents.',
      color: 'from-blue-500 to-cyan-500',
    },
    {
      address: '0xopmgr001',
      role: 'tenant_operator' as const,
      tenantId: 't1',
      label: 'Operator Manager',
      description: 'Manage operator lifecycle, slashing, co-sign policies, penalties.',
      color: 'from-emerald-500 to-teal-500',
    },
    {
      address: '0xtreasury001',
      role: 'tenant_treasury' as const,
      tenantId: 't1',
      label: 'Treasury',
      description: 'Receive slashed funds only. No management power.',
      color: 'from-amber-500 to-yellow-500',
    },
    {
      address: '0xoperator001',
      role: 'none' as const,
      tenantId: 't1',
      label: 'Operator (Wallet)',
      description: 'Register and co-sign documents. Verify & search transactions.',
      color: 'from-slate-500 to-gray-500',
    },
    {
      address: '0xenduser001',
      role: 'end_user' as const,
      label: 'End User',
      description: 'Read-only access. View documents signed by operators for your wallet.',
      color: 'from-cyan-500 to-sky-500',
    },
  ];

  const handleConnect = (address: string, tenantId?: string) => {
    connectWallet(address);
    if (tenantId) {
      const session = authService.getSession(address);
      if (session) {
        session.tenantId = tenantId;
      }
    }
    setTimeout(onSuccess, 200);
  };

  const handleGoogleLogin = () => {
    // Simulate web3auth Google login - generates a random end-user address
    const randomAddr = '0x' + Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    const session = authService.connectWallet(randomAddr);
    if (session) {
      session.role = 'end_user';
    }
    setTimeout(onSuccess, 200);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-3xl w-full">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-2xl mb-6">
            <span className="text-2xl font-bold text-slate-900">VP</span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-3">VoucherProtocol</h1>
          <p className="text-lg text-slate-400">
            Blockchain Document Signing & Operator Governance
          </p>
        </div>

        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
          <h2 className="text-xl font-bold text-white mb-2">Select Demo Account</h2>
          <p className="text-slate-400 text-sm mb-6">
            Each role has distinct permissions. Treasury is a special role that only receives slashed funds.
          </p>

          <div className="space-y-3">
            {predefinedAccounts.map((account) => (
              <button
                key={account.address}
                onClick={() => handleConnect(account.address, account.tenantId)}
                className="w-full p-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl text-left transition-all group"
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`w-10 h-10 rounded-lg bg-gradient-to-br ${account.color} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}
                  >
                    {account.label.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white group-hover:text-cyan-400 transition-colors">
                        {account.label}
                      </span>
                      {account.role === 'tenant_treasury' && (
                        <span className="px-1.5 py-0.5 text-[10px] bg-amber-500/20 text-amber-400 rounded font-semibold">
                          FUNDS ONLY
                        </span>
                      )}
                      {account.role === 'end_user' && (
                        <span className="px-1.5 py-0.5 text-[10px] bg-cyan-500/20 text-cyan-400 rounded font-semibold">
                          READ ONLY
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-400 mt-0.5">{account.description}</p>
                    <p className="font-mono text-xs text-slate-500 mt-1.5">{account.address}</p>
                  </div>
                  <div className="text-slate-500 group-hover:text-cyan-400 transition-colors flex-shrink-0 mt-1">
                    &rarr;
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div className="mt-6 pt-6 border-t border-white/10 space-y-4">
            <div>
              <h3 className="font-semibold text-white text-sm mb-3">Or connect with custom wallet:</h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter wallet address (0x...)"
                  className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 text-sm font-mono"
                  id="customAddress"
                />
                <button
                  onClick={() => {
                    const input = document.getElementById('customAddress') as HTMLInputElement;
                    if (input.value) handleConnect(input.value);
                  }}
                  className="px-5 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-semibold transition-colors text-sm"
                >
                  Connect
                </button>
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10" /></div>
              <div className="relative flex justify-center text-xs"><span className="bg-transparent px-3 text-slate-500">or</span></div>
            </div>

            <button
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-3 px-4 py-2.5 bg-white hover:bg-gray-100 text-gray-800 rounded-lg font-semibold transition-colors text-sm"
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Sign in with Google
            </button>
            <p className="text-xs text-slate-500 text-center">Sign in as End User (read-only). No wallet required.</p>
          </div>
        </div>

        <div className="mt-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-sm text-amber-300">
          <strong>Demo:</strong> All data is in-memory and resets on refresh. No real blockchain connection.
        </div>
      </div>
    </div>
  );
}
