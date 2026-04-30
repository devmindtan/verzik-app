import { useState, useEffect } from 'react';
import { Plus, AlertTriangle, Scale } from 'lucide-react';
import { blockchainService } from '../services/blockchainService';
import { authService } from '../services/authService';
import { useAuth } from '../contexts/AuthContext';
import { ConfirmPopup } from '../components/ConfirmPopup';

interface ViolationPenalty {
  id: string;
  tenantId: string;
  violationCode: string;
  penaltyBps: number;
  description: string;
  createdAt: Date;
}

export function ViolationPenaltyPage() {
  const { session } = useAuth();
  const [selectedTenant, setSelectedTenant] = useState(session?.tenantId || 't1');
  const [penalties, setPenalties] = useState<ViolationPenalty[]>([]);
  const [tenants, setTenants] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({ violationCode: '', penaltyBps: 1000, description: '' });
  const [confirm, setConfirm] = useState<{ open: boolean; title: string; message: string; variant: 'danger' | 'warning' | 'info'; onConfirm: () => void }>({
    open: false, title: '', message: '', variant: 'danger', onConfirm: () => {},
  });

  const canManage = authService.hasPermission(session, 'set_violation_penalty');

  const loadData = async () => {
    setLoading(true);
    const [tenantList, penaltyList] = await Promise.all([
      blockchainService.getTenants(),
      blockchainService.getViolationPenalties(selectedTenant),
    ]);
    setTenants(tenantList.map((t) => ({ id: t.id, name: t.name })));
    setPenalties(penaltyList);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [selectedTenant]);

  const handleCreate = () => {
    if (!createForm.violationCode || createForm.penaltyBps <= 0) return;
    const pct = (createForm.penaltyBps / 100).toFixed(1);
    setConfirm({
      open: true,
      title: 'Set Violation Penalty',
      message: `This will set the penalty for violation "${createForm.violationCode}" to ${pct}% (${createForm.penaltyBps} basis points) of the operator's stake. ${createForm.description ? `Description: ${createForm.description}` : ''}`,
      variant: 'warning',
      onConfirm: async () => {
        setActionLoading(true);
        try {
          await blockchainService.setViolationPenalty(selectedTenant, createForm.violationCode, createForm.penaltyBps, createForm.description, session?.address || '');
          setShowCreateModal(false);
          setCreateForm({ violationCode: '', penaltyBps: 1000, description: '' });
          await loadData();
        } finally {
          setActionLoading(false);
        }
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Violation Penalties</h1>
          <p className="text-gray-500 mt-1">Configure penalty percentages for operator violations</p>
        </div>
        {canManage && (
          <button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors text-sm" disabled={actionLoading}>
            <Plus size={18} /> New Penalty
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

      {/* Penalties list */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="px-5 py-4 border-b bg-slate-50">
          <h2 className="font-bold text-gray-900">Penalties ({penalties.length})</h2>
        </div>
        {loading ? (
          <div className="px-5 py-8 text-center text-gray-400 text-sm">Loading penalties...</div>
        ) : penalties.length === 0 ? (
          <div className="px-5 py-8 text-center text-gray-400 text-sm">No violation penalties configured. Create one to define penalty amounts for soft-slash operations.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-5 py-3 text-left font-semibold text-gray-600">Violation Code</th>
                  <th className="px-5 py-3 text-left font-semibold text-gray-600">Penalty</th>
                  <th className="px-5 py-3 text-left font-semibold text-gray-600">Description</th>
                  <th className="px-5 py-3 text-left font-semibold text-gray-600">Created</th>
                </tr>
              </thead>
              <tbody>
                {penalties.map((penalty) => (
                  <tr key={penalty.id} className="border-b hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <AlertTriangle size={14} className="text-orange-500" />
                        <span className="font-mono font-semibold text-gray-900">{penalty.violationCode}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className="px-2 py-0.5 rounded text-xs font-semibold bg-orange-100 text-orange-800">
                        {(penalty.penaltyBps / 100).toFixed(1)}% ({penalty.penaltyBps} bps)
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-600 max-w-xs truncate">{penalty.description || '—'}</td>
                    <td className="px-5 py-3 text-xs text-gray-500">{penalty.createdAt.toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Info box */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
        <div className="flex items-start gap-3">
          <Scale size={20} className="text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-bold text-blue-900 text-sm mb-1">How Violation Penalties Work</h3>
            <p className="text-sm text-blue-800">When an operator violates protocol rules, the Operator Manager can apply a <strong>soft slash</strong> using a violation code. The penalty percentage defined here determines how much of the operator's stake is seized. For example, a 1000 bps (10%) penalty on a 2 ETH stake would seize 0.2 ETH.</p>
          </div>
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setShowCreateModal(false)}>
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b flex items-center justify-between flex-shrink-0">
              <h2 className="text-lg font-bold text-gray-900">New Violation Penalty</h2>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Violation Code</label>
                <input type="text" value={createForm.violationCode} onChange={(e) => setCreateForm({ ...createForm, violationCode: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" placeholder="e.g., DOUBLE_SIGN, LATE_RESPONSE" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Penalty (Basis Points)</label>
                <input type="number" step="100" min={100} max={10000} value={createForm.penaltyBps} onChange={(e) => setCreateForm({ ...createForm, penaltyBps: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" />
                <p className="text-xs text-gray-500 mt-1">{(createForm.penaltyBps / 100).toFixed(1)}% of stake (1000 bps = 10%)</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
                <input type="text" value={createForm.description} onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" placeholder="e.g., Operator signed two blocks at same height" />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowCreateModal(false)} className="btn-secondary flex-1" disabled={actionLoading}>Cancel</button>
                <button onClick={handleCreate} className="btn-primary flex-1" disabled={actionLoading}>{actionLoading ? 'Creating...' : 'Set Penalty'}</button>
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
