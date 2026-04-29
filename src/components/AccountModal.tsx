import { X, Shield, Users, Wallet, ExternalLink, Settings, Palette, FileText, PenTool } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/authService';
import { TruncatedHash } from './TruncatedHash';
import { useState } from 'react';

interface AccountModalProps {
  open: boolean;
  onClose: () => void;
  onNavigate: (page: string) => void;
}

export function AccountModal({ open, onClose, onNavigate }: AccountModalProps) {
  const { session, disconnectWallet } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'settings'>('profile');

  if (!open || !session) return null;

  const roleColorMap: Record<string, string> = {
    protocol_admin: 'bg-red-100 text-red-800 border-red-200',
    tenant_admin: 'bg-blue-100 text-blue-800 border-blue-200',
    tenant_operator: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    tenant_treasury: 'bg-amber-100 text-amber-800 border-amber-200',
    end_user: 'bg-cyan-100 text-cyan-800 border-cyan-200',
    none: 'bg-gray-100 text-gray-700 border-gray-200',
  };

  const roleIconMap: Record<string, React.ReactNode> = {
    protocol_admin: <Shield size={16} />,
    tenant_admin: <Settings size={16} />,
    tenant_operator: <Users size={16} />,
    tenant_treasury: <Wallet size={16} />,
    end_user: <Users size={16} />,
    none: <Wallet size={16} />,
  };

  const handleDisconnect = () => {
    disconnectWallet();
    onClose();
    onNavigate('home');
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-6 py-5 text-white">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-lg">Account</h2>
            <button onClick={onClose} className="text-white/60 hover:text-white transition-colors">
              <X size={20} />
            </button>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center text-2xl font-bold text-cyan-400">
              {session.address.slice(2, 4).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${roleColorMap[session.role] || roleColorMap.none}`}>
                  {roleIconMap[session.role]}
                  {authService.getRoleLabel(session.role)}
                </span>
              </div>
              <p className="text-sm text-white/70 mt-1.5"><TruncatedHash value={session.address} /></p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b flex">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors ${activeTab === 'profile' ? 'text-blue-700 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Profile
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors ${activeTab === 'settings' ? 'text-blue-700 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Settings
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === 'profile' && (
            <div className="space-y-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">Wallet Address</p>
                <div className="flex items-center gap-2">
                  <TruncatedHash value={session.address} />
                </div>
              </div>

              <div>
                <p className="text-xs text-gray-500 mb-1">Role</p>
                <p className="text-sm font-semibold text-gray-900">{authService.getRoleLabel(session.role)}</p>
                <p className="text-xs text-gray-500 mt-0.5">{authService.getRoleDescription(session.role)}</p>
              </div>

              {session.tenantId && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Tenant</p>
                  <p className="text-sm text-gray-900">{session.tenantId}</p>
                </div>
              )}

              <div>
                <p className="text-xs text-gray-500 mb-1">Connection</p>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full" />
                  <span className="text-sm text-emerald-700 font-medium">Connected</span>
                </div>
              </div>

              <div className="pt-4 border-t space-y-2">
                {(session.role === 'end_user' || session.role === 'none') && (
                  <button
                    onClick={() => { onClose(); onNavigate('my-documents'); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-cyan-700 hover:bg-cyan-50 rounded-lg transition-colors font-medium"
                  >
                    <FileText size={14} /> My Documents
                  </button>
                )}
                {(session.role === 'tenant_operator' || session.role === 'none') && (
                  <button
                    onClick={() => { onClose(); onNavigate('my-signed-docs'); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-blue-700 hover:bg-blue-50 rounded-lg transition-colors font-medium"
                  >
                    <PenTool size={14} /> My Signatures
                  </button>
                )}
                <button
                  onClick={() => { onClose(); onNavigate('transactions'); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <ExternalLink size={14} /> View My Transactions
                </button>
                <button
                  onClick={handleDisconnect}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Wallet size={14} /> Disconnect Wallet
                </button>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-4">
              <div className="space-y-3">
                <SettingToggle
                  label="Transaction Notifications"
                  description="Show alerts for new blockchain events"
                  defaultChecked={true}
                />
                <SettingToggle
                  label="Auto-refresh Dashboard"
                  description="Update dashboard data automatically"
                  defaultChecked={true}
                />
                <SettingToggle
                  label="Compact View"
                  description="Use smaller fonts and tighter spacing"
                  defaultChecked={false}
                />
              </div>

              <div className="pt-4 border-t">
                <p className="text-xs text-gray-500 mb-3">Display</p>
                <div className="flex items-center gap-2">
                  <Palette size={14} className="text-gray-400" />
                  <span className="text-sm text-gray-700">Theme</span>
                  <span className="ml-auto text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">System Default</span>
                </div>
              </div>

              <div className="pt-4 border-t">
                <p className="text-xs text-gray-500 mb-3">About</p>
                <div className="space-y-1.5 text-xs text-gray-500">
                  <p>VoucherProtocol Demo v2.0</p>
                  <p>Mock blockchain — no real on-chain operations</p>
                  <p>All data stored in browser memory</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SettingToggle({ label, description, defaultChecked }: { label: string; description: string; defaultChecked: boolean }) {
  const [checked, setChecked] = useState(defaultChecked);
  return (
    <div className="flex items-center justify-between py-1">
      <div>
        <p className="text-sm font-medium text-gray-900">{label}</p>
        <p className="text-xs text-gray-500">{description}</p>
      </div>
      <button
        onClick={() => setChecked(!checked)}
        className={`relative w-10 h-5 rounded-full transition-colors ${checked ? 'bg-blue-600' : 'bg-gray-300'}`}
      >
        <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-5' : ''}`} />
      </button>
    </div>
  );
}
