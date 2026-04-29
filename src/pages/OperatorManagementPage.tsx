import { useState } from 'react';
import { Plus, Lock, Unlock, Eye, Zap, Flame, Coins } from 'lucide-react';
import { blockchainService } from '../services/blockchainService';
import { authService } from '../services/authService';
import { useAuth } from '../contexts/AuthContext';
import { TruncatedHash } from '../components/TruncatedHash';
import { ConfirmPopup } from '../components/ConfirmPopup';
import { Operator } from '../types';

export function OperatorManagementPage() {
  const { session } = useAuth();
  const [selectedTenant, setSelectedTenant] = useState(session?.tenantId || 't1');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showSlashModal, setShowSlashModal] = useState(false);
  const [showSoftSlashModal, setShowSoftSlashModal] = useState(false);
  const [selectedOp, setSelectedOp] = useState<Operator | null>(null);
  const [addForm, setAddForm] = useState({ address: '', stakeAmount: 1 });
  const [slashReason, setSlashReason] = useState('');
  const [softSlashForm, setSoftSlashForm] = useState({ penaltyBps: 1000, reason: '' });
  const [confirm, setConfirm] = useState<{ open: boolean; title: string; message: string; variant: 'danger' | 'warning' | 'info'; onConfirm: () => void }>({
    open: false, title: '', message: '', variant: 'danger', onConfirm: () => {},
  });

  const canManage = authService.hasPermission(session, 'manage_operators');
  const tenants = blockchainService.getTenants();
  const operators = blockchainService.getOperators(selectedTenant);
  const tenant = blockchainService.getTenant(selectedTenant);

  const refresh = () => setSelectedTenant(selectedTenant);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.address || addForm.stakeAmount <= 0) return;
    setConfirm({
      open: true,
      title: 'Add Operator',
      message: `This will add ${addForm.address} as an operator with ${addForm.stakeAmount} ETH stake. The stake will be locked on-chain.`,
      variant: 'info',
      onConfirm: () => {
        blockchainService.joinAsOperator(selectedTenant, addForm.address, addForm.stakeAmount);
        setAddForm({ address: '', stakeAmount: 1 });
        setShowAddModal(false);
        refresh();
      },
    });
  };

  const handleToggle = (op: Operator) => {
    const action = op.isActive ? 'deactivate' : 'activate';
    setConfirm({
      open: true,
      title: op.isActive ? 'Deactivate Operator' : 'Activate Operator',
      message: `This will ${action} operator ${op.address}. ${op.isActive ? 'The operator will no longer be able to sign documents.' : 'The operator will resume signing capabilities.'}`,
      variant: 'warning',
      onConfirm: () => {
        blockchainService.setOperatorStatus(selectedTenant, op.address, !op.isActive, session?.address || '');
        refresh();
      },
    });
  };

  const handleSlash = () => {
    if (!selectedOp || !slashReason) return;
    setConfirm({
      open: true,
      title: 'Slash Operator',
      message: `This will seize the operator's ENTIRE stake of ${selectedOp.stakeAmount} ETH and transfer it to the tenant treasury. The operator will be permanently deactivated. Reason: ${slashReason}`,
      variant: 'danger',
      onConfirm: () => {
        blockchainService.slashOperator(selectedTenant, selectedOp.address, slashReason, session?.address || '');
        setSlashReason('');
        setShowSlashModal(false);
        setSelectedOp(null);
        refresh();
      },
    });
  };

  const handleSoftSlash = () => {
    if (!selectedOp || !softSlashForm.reason) return;
    const penalty = (softSlashForm.penaltyBps / 100).toFixed(1);
    const amount = (selectedOp.stakeAmount * softSlashForm.penaltyBps / 10000).toFixed(4);
    setConfirm({
      open: true,
      title: 'Soft Slash Operator',
      message: `This will seize ${penalty}% (${amount} ETH) of the operator's stake. If remaining stake falls below minimum, the operator will be auto-deactivated. Reason: ${softSlashForm.reason}`,
      variant: 'warning',
      onConfirm: () => {
        blockchainService.softSlashOperator(selectedTenant, selectedOp.address, softSlashForm.penaltyBps, softSlashForm.reason, session?.address || '');
        setSoftSlashForm({ penaltyBps: 1000, reason: '' });
        setShowSoftSlashModal(false);
        setSelectedOp(null);
        refresh();
      },
    });
  };

  const handleRequestUnstake = (op: Operator) => {
    setConfirm({
      open: true,
      title: 'Request Unstake',
      message: `This will initiate the unstake process for operator ${op.address}. A cooldown period will begin before the stake can be withdrawn.`,
      variant: 'warning',
      onConfirm: () => {
        blockchainService.requestUnstake(selectedTenant, op.address);
        refresh();
      },
    });
  };

  const handleTopUp = (op: Operator) => {
    const amount = prompt('Top-up amount (ETH):');
    if (amount && parseFloat(amount) > 0) {
      setConfirm({
        open: true,
        title: 'Top Up Stake',
        message: `This will add ${amount} ETH to operator ${op.address}'s stake. Current stake: ${op.stakeAmount} ETH.`,
        variant: 'info',
        onConfirm: () => {
          blockchainService.topUpStake(selectedTenant, op.address, parseFloat(amount));
          refresh();
        },
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Operator Management</h1>
          <p className="text-gray-500 mt-1">Manage operator lifecycle, stakes, and penalties</p>
        </div>
        {canManage && (
          <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors text-sm">
            <Plus size={18} /> Add Operator
          </button>
        )}
      </div>

      {/* Tenant selector */}
      <div className="bg-white rounded-xl shadow-sm border p-4 flex items-center gap-3">
        <label className="text-sm font-semibold text-gray-700">Tenant:</label>
        <select value={selectedTenant} onChange={(e) => setSelectedTenant(e.target.value)} className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none">
          {tenants.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </div>

      {/* Tenant info bar */}
      {tenant && (
        <div className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl border p-5">
          <h2 className="font-bold text-gray-900 mb-3">{tenant.name}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-gray-500 text-xs">Min Stake</p>
              <p className="font-bold text-gray-900">{tenant.config.minOperatorStake} ETH</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs">Unstake Cooldown</p>
              <p className="font-bold text-gray-900">{Math.floor(tenant.config.unstakeCooldown / 86400)} days</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs">Active Operators</p>
              <p className="font-bold text-gray-900">{operators.filter((o) => o.isActive).length}</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs">Total Staked</p>
              <p className="font-bold text-gray-900">{operators.reduce((s, o) => s + o.stakeAmount, 0).toFixed(2)} ETH</p>
            </div>
          </div>
        </div>
      )}

      {/* Operators table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="px-5 py-4 border-b bg-slate-50">
          <h2 className="font-bold text-gray-900">Operators ({operators.length})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-5 py-3 text-left font-semibold text-gray-600">Address</th>
                <th className="px-5 py-3 text-left font-semibold text-gray-600">Stake</th>
                <th className="px-5 py-3 text-left font-semibold text-gray-600">Status</th>
                <th className="px-5 py-3 text-left font-semibold text-gray-600">Joined</th>
                <th className="px-5 py-3 text-left font-semibold text-gray-600">Unstake</th>
                <th className="px-5 py-3 text-center font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {operators.map((op) => (
                <tr key={op.id} className="border-b hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3 text-xs text-gray-900"><TruncatedHash value={op.address} /></td>
                  <td className="px-5 py-3">
                    <span className="font-semibold text-gray-900">{op.stakeAmount} ETH</span>
                    {op.stakeAmount > 0 && op.stakeAmount < (tenant?.config.minOperatorStake || 0) && (
                      <span className="ml-2 text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-semibold">BELOW MIN</span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${op.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                      {op.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-gray-600">{op.joinedAt.toLocaleDateString()}</td>
                  <td className="px-5 py-3 text-xs">
                    {op.pendingUnstakeAt ? (
                      <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded font-medium">
                        {op.pendingUnstakeAt.toLocaleDateString()}
                      </span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => { setSelectedOp(op); setShowDetailModal(true); }} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="View details">
                        <Eye size={16} />
                      </button>
                      {canManage && (
                        <>
                          <button onClick={() => handleTopUp(op)} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="Top-up stake">
                            <Coins size={16} />
                          </button>
                          <button onClick={() => handleToggle(op)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors" title={op.isActive ? 'Deactivate' : 'Activate'}>
                            {op.isActive ? <Lock size={16} className="text-yellow-600" /> : <Unlock size={16} className="text-green-600" />}
                          </button>
                          <button onClick={() => { setSelectedOp(op); setShowSoftSlashModal(true); }} className="p-1.5 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors" title="Soft slash (partial penalty)">
                            <Zap size={16} />
                          </button>
                          <button onClick={() => { setSelectedOp(op); setShowSlashModal(true); }} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Full slash (seize all stake)">
                            <Flame size={16} />
                          </button>
                          {op.isActive && !op.pendingUnstakeAt && (
                            <button onClick={() => handleRequestUnstake(op)} className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors text-xs" title="Request unstake">
                              Exit
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {operators.length === 0 && (
            <div className="px-5 py-8 text-center text-gray-400 text-sm">No operators in this tenant.</div>
          )}
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <Modal title="Add Operator" onClose={() => setShowAddModal(false)}>
          <form onSubmit={handleAdd} className="space-y-4">
            <Field label="Operator Address"><input type="text" value={addForm.address} onChange={(e) => setAddForm({ ...addForm, address: e.target.value })} className="input font-mono text-sm" placeholder="0x..." /></Field>
            <Field label="Stake Amount (ETH)"><input type="number" step="0.1" value={addForm.stakeAmount} onChange={(e) => setAddForm({ ...addForm, stakeAmount: parseFloat(e.target.value) })} className="input" /></Field>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setShowAddModal(false)} className="btn-secondary flex-1">Cancel</button>
              <button type="submit" className="btn-primary flex-1">Add Operator</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedOp && (
        <Modal title="Operator Details" onClose={() => setShowDetailModal(false)}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">Address</p>
                <p className="text-sm text-gray-900"><TruncatedHash value={selectedOp.address} /></p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">Status</p>
                <p className={`font-bold ${selectedOp.isActive ? 'text-green-700' : 'text-gray-500'}`}>{selectedOp.isActive ? 'Active' : 'Inactive'}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">Stake Amount</p>
                <p className="font-bold text-gray-900">{selectedOp.stakeAmount} ETH</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">Joined</p>
                <p className="font-bold text-gray-900">{selectedOp.joinedAt.toLocaleDateString()}</p>
              </div>
            </div>
            {selectedOp.pendingUnstakeAt && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-xs text-amber-600 font-semibold">Unstake Pending</p>
                <p className="text-sm text-amber-800">Available from: {selectedOp.pendingUnstakeAt.toLocaleString()}</p>
              </div>
            )}
            {selectedOp.recoveryDelegate && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-600 font-semibold">Recovery Delegate</p>
                <p className="text-sm text-blue-800"><TruncatedHash value={selectedOp.recoveryDelegate} /></p>
              </div>
            )}
            {selectedOp.metadataURI && (
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">Metadata URI</p>
                <p className="text-sm text-gray-900"><TruncatedHash value={selectedOp.metadataURI} /></p>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Slash Modal */}
      {showSlashModal && selectedOp && (
        <Modal title="Slash Operator" onClose={() => setShowSlashModal(false)}>
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800 font-semibold">Warning: This will seize the operator's entire stake ({selectedOp.stakeAmount} ETH) and transfer it to the tenant treasury.</p>
            </div>
            <p className="text-sm text-gray-700">Operator: <TruncatedHash value={selectedOp.address} /></p>
            <Field label="Reason for slashing">
              <input type="text" value={slashReason} onChange={(e) => setSlashReason(e.target.value)} className="input" placeholder="e.g., Double-signing violation" />
            </Field>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowSlashModal(false)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={handleSlash} className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors">Slash Operator</button>
            </div>
          </div>
        </Modal>
      )}

      {/* Soft Slash Modal */}
      {showSoftSlashModal && selectedOp && (
        <Modal title="Soft Slash Operator" onClose={() => setShowSoftSlashModal(false)}>
          <div className="space-y-4">
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <p className="text-sm text-orange-800">Partial penalty: <strong>{(softSlashForm.penaltyBps / 100).toFixed(1)}%</strong> of stake ({(selectedOp.stakeAmount * softSlashForm.penaltyBps / 10000).toFixed(4)} ETH) will be seized.</p>
              <p className="text-xs text-orange-600 mt-1">If remaining stake falls below minimum, operator will be deactivated.</p>
            </div>
            <Field label="Penalty (Basis Points, 1000 = 10%)">
              <input type="number" step="100" min="100" max="10000" value={softSlashForm.penaltyBps} onChange={(e) => setSoftSlashForm({ ...softSlashForm, penaltyBps: parseInt(e.target.value) || 0 })} className="input" />
            </Field>
            <Field label="Reason">
              <input type="text" value={softSlashForm.reason} onChange={(e) => setSoftSlashForm({ ...softSlashForm, reason: e.target.value })} className="input" placeholder="e.g., Late response" />
            </Field>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowSoftSlashModal(false)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={handleSoftSlash} className="flex-1 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors">Soft Slash</button>
            </div>
          </div>
        </Modal>
      )}

      <ConfirmPopup
        open={confirm.open}
        title={confirm.title}
        message={confirm.message}
        variant={confirm.variant}
        confirmLabel="Confirm"
        onConfirm={() => { confirm.onConfirm(); setConfirm({ ...confirm, open: false }); }}
        onCancel={() => setConfirm({ ...confirm, open: false })}
      />
    </div>
  );
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-4 border-b flex items-center justify-between flex-shrink-0">
          <h2 className="text-lg font-bold text-gray-900">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>
        <div className="p-6 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="block text-sm font-semibold text-gray-700 mb-1">{label}</label>{children}</div>;
}
