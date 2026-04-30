import { useState, useEffect } from 'react';
import { Plus, Shield } from 'lucide-react';
import { blockchainService } from '../services/blockchainService';
import { authService } from '../services/authService';
import { useAuth } from '../contexts/AuthContext';
import { ConfirmPopup } from '../components/ConfirmPopup';
import { CoSignPolicy } from '../types';

export function CoSignPolicyPage() {
  const { session } = useAuth();
  const [selectedTenant, setSelectedTenant] = useState(session?.tenantId || 't1');
  const [policies, setPolicies] = useState<CoSignPolicy[]>([]);
  const [tenants, setTenants] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    docType: 'voucher',
    enabled: true,
    minSigners: 2,
    requiredRoles: 'operator',
    whitelistedOperators: '',
  });
  const [confirm, setConfirm] = useState<{ open: boolean; title: string; message: string; variant: 'danger' | 'warning' | 'info'; onConfirm: () => void }>({
    open: false, title: '', message: '', variant: 'danger', onConfirm: () => {},
  });

  const canManage = authService.hasPermission(session, 'set_policies');

  const loadData = async () => {
    setLoading(true);
    const [tenantList, policyList] = await Promise.all([
      blockchainService.getTenants(),
      blockchainService.getCoSignPolicies(selectedTenant),
    ]);
    setTenants(tenantList.map((t) => ({ id: t.id, name: t.name })));
    setPolicies(policyList);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [selectedTenant]);

  const handleCreate = () => {
    const policy: CoSignPolicy = {
      tenantId: selectedTenant,
      docType: createForm.docType,
      enabled: createForm.enabled,
      minSigners: createForm.minSigners,
      requiredRoles: createForm.requiredRoles ? createForm.requiredRoles.split(',').map((r) => r.trim()) : [],
      whitelistedOperators: createForm.whitelistedOperators ? createForm.whitelistedOperators.split(',').map((a) => a.trim()) : [],
    };
    setConfirm({
      open: true,
      title: 'Set Co-Sign Policy',
      message: `This will set the co-sign policy for "${policy.docType}" documents: min ${policy.minSigners} signers, required roles: [${policy.requiredRoles.join(', ')}], whitelisted: ${policy.whitelistedOperators.length} operators.`,
      variant: 'info',
      onConfirm: async () => {
        setActionLoading(true);
        try {
          await blockchainService.setCoSignPolicy(policy, session?.address || '');
          setShowCreateModal(false);
          await loadData();
        } finally {
          setActionLoading(false);
        }
      },
    });
  };

  const handleToggle = (policy: CoSignPolicy) => {
    const updated: CoSignPolicy = { ...policy, enabled: !policy.enabled };
    setConfirm({
      open: true,
      title: policy.enabled ? 'Disable Policy' : 'Enable Policy',
      message: `This will ${policy.enabled ? 'disable' : 'enable'} the co-sign policy for "${policy.docType}" documents.`,
      variant: 'warning',
      onConfirm: async () => {
        setActionLoading(true);
        try {
          await blockchainService.setCoSignPolicy(updated, session?.address || '');
          await loadData();
        } finally {
          setActionLoading(false);
        }
      },
    });
  };

  const docTypeLabel: Record<string, string> = { voucher: 'Voucher', contract: 'Contract', certificate: 'Certificate', receipt: 'Receipt' };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Co-Sign Policies</h1>
          <p className="text-gray-500 mt-1">Configure multi-signature requirements per document type</p>
        </div>
        {canManage && (
          <button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors text-sm" disabled={actionLoading}>
            <Plus size={18} /> New Policy
          </button>
        )}
      </div>

      {/* Tenant selector */}
      <div className="bg-white rounded-xl shadow-sm border p-4 flex items-center gap-3">
        <label className="text-sm font-semibold text-gray-700">Tenant:</label>
        <select value={selectedTenant} onChange={(e) => setSelectedTenant(e.target.value)} className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" disabled={actionLoading}>
          {tenants.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </div>

      {/* Policies list */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="px-5 py-4 border-b bg-slate-50">
          <h2 className="font-bold text-gray-900">Policies ({policies.length})</h2>
        </div>
        {loading ? (
          <div className="px-5 py-8 text-center text-gray-400 text-sm">Loading policies...</div>
        ) : policies.length === 0 ? (
          <div className="px-5 py-8 text-center text-gray-400 text-sm">No co-sign policies configured. Create one to require multi-signature verification for documents.</div>
        ) : (
          <div className="divide-y">
            {policies.map((policy) => (
              <div key={policy.docType} className="px-5 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                      <Shield size={20} className="text-blue-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-gray-900">{docTypeLabel[policy.docType] || policy.docType}</h3>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${policy.enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                          {policy.enabled ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Min {policy.minSigners} signers
                        {policy.requiredRoles.length > 0 && ` | Roles: ${policy.requiredRoles.join(', ')}`}
                        {policy.whitelistedOperators.length > 0 && ` | ${policy.whitelistedOperators.length} whitelisted`}
                      </p>
                    </div>
                  </div>
                  {canManage && (
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleToggle(policy)} className="text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors border" style={{ color: policy.enabled ? '#b45309' : '#16a34a', borderColor: policy.enabled ? '#fbbf24' : '#86efac' }}>
                        {policy.enabled ? 'Disable' : 'Enable'}
                      </button>
                    </div>
                  )}
                </div>
                {policy.whitelistedOperators.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {policy.whitelistedOperators.map((addr) => (
                      <span key={addr} className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-mono">{addr.slice(0, 10)}...</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setShowCreateModal(false)}>
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b flex items-center justify-between flex-shrink-0">
              <h2 className="text-lg font-bold text-gray-900">New Co-Sign Policy</h2>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Document Type</label>
                <select value={createForm.docType} onChange={(e) => setCreateForm({ ...createForm, docType: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none">
                  <option value="voucher">Voucher</option>
                  <option value="contract">Contract</option>
                  <option value="certificate">Certificate</option>
                  <option value="receipt">Receipt</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Min Signers</label>
                <input type="number" min={1} max={10} value={createForm.minSigners} onChange={(e) => setCreateForm({ ...createForm, minSigners: parseInt(e.target.value) || 2 })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Required Roles (comma-separated)</label>
                <input type="text" value={createForm.requiredRoles} onChange={(e) => setCreateForm({ ...createForm, requiredRoles: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" placeholder="e.g., operator, manager" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Whitelisted Operators (comma-separated addresses)</label>
                <input type="text" value={createForm.whitelistedOperators} onChange={(e) => setCreateForm({ ...createForm, whitelistedOperators: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" placeholder="0xaddr1, 0xaddr2" />
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCreateForm({ ...createForm, enabled: !createForm.enabled })}
                  className={`relative w-10 h-5 rounded-full transition-colors ${createForm.enabled ? 'bg-blue-600' : 'bg-gray-300'}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${createForm.enabled ? 'translate-x-5' : ''}`} />
                </button>
                <span className="text-sm text-gray-700">Enabled</span>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowCreateModal(false)} className="btn-secondary flex-1" disabled={actionLoading}>Cancel</button>
                <button onClick={handleCreate} className="btn-primary flex-1" disabled={actionLoading}>{actionLoading ? 'Creating...' : 'Create Policy'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmPopup
        open={confirm.open}
        title={confirm.title}
        message={confirm.message}
        variant={confirm.variant}
        confirmLabel={actionLoading ? 'Processing...' : 'Confirm'}
        onConfirm={() => { confirm.onConfirm(); setConfirm({ ...confirm, open: false }); }}
        onCancel={() => setConfirm({ ...confirm, open: false })}
      />
    </div>
  );
}
