import { useState } from 'react';
import { Plus, Eye, ToggleLeft, ToggleRight, Settings, Users, Wallet } from 'lucide-react';
import { blockchainService } from '../services/blockchainService';
import { authService } from '../services/authService';
import { useAuth } from '../contexts/AuthContext';
import { TruncatedHash } from '../components/TruncatedHash';
import { ConfirmPopup } from '../components/ConfirmPopup';
import { Tenant } from '../types';

export function TenantManagementPage() {
  const { session } = useAuth();
  const [tenants, setTenants] = useState(blockchainService.getTenants());
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [configForm, setConfigForm] = useState({ minStake: 1, cooldown: 7 });
  const [createForm, setCreateForm] = useState({ name: '', admin: '', operatorManager: '', treasury: '' });
  const [confirm, setConfirm] = useState<{ open: boolean; title: string; message: string; variant: 'danger' | 'warning' | 'info'; onConfirm: () => void }>({
    open: false, title: '', message: '', variant: 'danger', onConfirm: () => {},
  });

  const canCreate = authService.hasPermission(session, 'create_tenant');
  const canManage = authService.hasPermission(session, 'manage_tenant_config');

  const refresh = () => setTenants(blockchainService.getTenants());

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.name || !createForm.admin || !createForm.operatorManager || !createForm.treasury) return;
    setConfirm({
      open: true,
      title: 'Create New Tenant',
      message: `This will create tenant "${createForm.name}" on-chain with the specified admin, operator manager, and treasury addresses. This action cannot be undone.`,
      variant: 'info',
      onConfirm: () => {
        blockchainService.createTenant(createForm.name, createForm.admin, createForm.operatorManager, createForm.treasury);
        setCreateForm({ name: '', admin: '', operatorManager: '', treasury: '' });
        setShowCreateModal(false);
        refresh();
      },
    });
  };

  const handleToggleStatus = (tenant: Tenant) => {
    const action = tenant.isActive ? 'deactivate' : 'activate';
    setConfirm({
      open: true,
      title: tenant.isActive ? 'Deactivate Tenant' : 'Activate Tenant',
      message: `This will ${action} tenant "${tenant.name}". ${tenant.isActive ? 'All operators and documents under this tenant will be affected.' : 'The tenant will resume normal operations.'}`,
      variant: 'warning',
      onConfirm: () => {
        blockchainService.setTenantStatus(tenant.id, !tenant.isActive, session?.address || '');
        refresh();
      },
    });
  };

  const handleSaveConfig = () => {
    if (!selectedTenant) return;
    setConfirm({
      open: true,
      title: 'Update Configuration',
      message: `This will update the configuration for "${selectedTenant.name}": min stake = ${configForm.minStake} ETH, cooldown = ${configForm.cooldown} days. This affects all operators in this tenant.`,
      variant: 'warning',
      onConfirm: () => {
        blockchainService.updateTenantConfig(selectedTenant.id, configForm.minStake, configForm.cooldown * 86400, session?.address || '');
        setShowConfigModal(false);
        refresh();
      },
    });
  };

  const openDetail = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setShowDetailModal(true);
  };

  const openConfig = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setConfigForm({ minStake: tenant.config.minOperatorStake, cooldown: Math.floor(tenant.config.unstakeCooldown / 86400) });
    setShowConfigModal(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tenant Management</h1>
          <p className="text-gray-500 mt-1">Each tenant has 3 separate roles: Admin, Operator Manager, Treasury</p>
        </div>
        {canCreate && (
          <button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors text-sm">
            <Plus size={18} /> New Tenant
          </button>
        )}
      </div>

      {/* Role explanation */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center"><Settings size={16} className="text-white" /></div>
            <h3 className="font-bold text-blue-900">Tenant Admin</h3>
          </div>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>- Manage tenant configuration</li>
            <li>- Set treasury address</li>
            <li>- Set operator manager</li>
            <li>- Revoke documents</li>
          </ul>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center"><Users size={16} className="text-white" /></div>
            <h3 className="font-bold text-emerald-900">Operator Manager</h3>
          </div>
          <ul className="text-sm text-emerald-800 space-y-1">
            <li>- Manage operator lifecycle</li>
            <li>- Slash / soft-slash operators</li>
            <li>- Set co-sign policies</li>
            <li>- Set penalties & stakes</li>
          </ul>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-amber-600 rounded-lg flex items-center justify-center"><Wallet size={16} className="text-white" /></div>
            <h3 className="font-bold text-amber-900">Treasury</h3>
          </div>
          <ul className="text-sm text-amber-800 space-y-1">
            <li>- <strong>Only</strong> receives slashed funds</li>
            <li>- No management power</li>
            <li>- View-only access to events</li>
            <li>- Cannot manage operators</li>
          </ul>
        </div>
      </div>

      {/* Tenants table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="px-5 py-4 border-b bg-slate-50">
          <h2 className="font-bold text-gray-900">All Tenants ({tenants.length})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-5 py-3 text-left font-semibold text-gray-600">Name</th>
                <th className="px-5 py-3 text-left font-semibold text-gray-600">Admin</th>
                <th className="px-5 py-3 text-left font-semibold text-gray-600">Op. Manager</th>
                <th className="px-5 py-3 text-left font-semibold text-gray-600">Treasury</th>
                <th className="px-5 py-3 text-left font-semibold text-gray-600">Min Stake</th>
                <th className="px-5 py-3 text-left font-semibold text-gray-600">Status</th>
                <th className="px-5 py-3 text-center font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tenants.map((tenant) => {
                const ops = blockchainService.getOperators(tenant.id);
                const docs = blockchainService.getDocuments(tenant.id);
                return (
                  <tr key={tenant.id} className="border-b hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3">
                      <div className="font-medium text-gray-900">{tenant.name}</div>
                      <div className="text-xs text-gray-500">{ops.length} ops / {docs.length} docs</div>
                    </td>
                    <td className="px-5 py-3 text-xs text-gray-700"><TruncatedHash value={tenant.admin} /></td>
                    <td className="px-5 py-3 text-xs text-gray-700"><TruncatedHash value={tenant.operatorManager} /></td>
                    <td className="px-5 py-3 text-xs text-gray-700"><TruncatedHash value={tenant.treasury} /></td>
                    <td className="px-5 py-3 text-gray-700">{tenant.config.minOperatorStake} ETH</td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${tenant.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                        {tenant.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => openDetail(tenant)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="View details">
                          <Eye size={16} />
                        </button>
                        {canManage && (
                          <>
                            <button onClick={() => openConfig(tenant)} className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors" title="Configure">
                              <Settings size={16} />
                            </button>
                            <button onClick={() => handleToggleStatus(tenant)} className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors" title="Toggle status">
                              {tenant.isActive ? <ToggleRight size={16} className="text-green-600" /> : <ToggleLeft size={16} />}
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {tenants.length === 0 && (
            <div className="px-5 py-8 text-center text-gray-400 text-sm">No tenants yet.</div>
          )}
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <Modal title="Create New Tenant" onClose={() => setShowCreateModal(false)}>
          <form onSubmit={handleCreate} className="space-y-4">
            <Field label="Tenant Name">
              <input type="text" value={createForm.name} onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })} className="input" placeholder="e.g., Finance Operations" />
            </Field>
            <Field label="Admin Address">
              <input type="text" value={createForm.admin} onChange={(e) => setCreateForm({ ...createForm, admin: e.target.value })} className="input font-mono text-sm" placeholder="0x..." />
            </Field>
            <Field label="Operator Manager Address">
              <input type="text" value={createForm.operatorManager} onChange={(e) => setCreateForm({ ...createForm, operatorManager: e.target.value })} className="input font-mono text-sm" placeholder="0x..." />
            </Field>
            <Field label="Treasury Address">
              <input type="text" value={createForm.treasury} onChange={(e) => setCreateForm({ ...createForm, treasury: e.target.value })} className="input font-mono text-sm" placeholder="0x... (receives slashed funds only)" />
            </Field>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setShowCreateModal(false)} className="btn-secondary flex-1">Cancel</button>
              <button type="submit" className="btn-primary flex-1">Create Tenant</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedTenant && (
        <Modal title={selectedTenant.name} onClose={() => setShowDetailModal(false)} wide>
          <div className="space-y-6">
            <div>
              <h3 className="font-bold text-gray-900 mb-3 text-sm uppercase tracking-wide">Role Holders</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <RoleCard label="Admin" address={selectedTenant.admin} color="blue" />
                <RoleCard label="Operator Manager" address={selectedTenant.operatorManager} color="emerald" />
                <RoleCard label="Treasury" address={selectedTenant.treasury} color="amber" note="Funds only" />
              </div>
            </div>
            <div>
              <h3 className="font-bold text-gray-900 mb-3 text-sm uppercase tracking-wide">Configuration</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">Min Operator Stake</p>
                  <p className="font-bold text-gray-900">{selectedTenant.config.minOperatorStake} ETH</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">Unstake Cooldown</p>
                  <p className="font-bold text-gray-900">{Math.floor(selectedTenant.config.unstakeCooldown / 86400)} days</p>
                </div>
              </div>
            </div>
            <div>
              <h3 className="font-bold text-gray-900 mb-3 text-sm uppercase tracking-wide">Operators ({blockchainService.getOperators(selectedTenant.id).length})</h3>
              <div className="space-y-2">
                {blockchainService.getOperators(selectedTenant.id).map((op) => (
                  <div key={op.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                    <div>
                      <p className="text-sm text-gray-900"><TruncatedHash value={op.address} /></p>
                      <p className="text-xs text-gray-500">Stake: {op.stakeAmount} ETH / Joined: {op.joinedAt.toLocaleDateString()}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${op.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                      {op.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                ))}
                {blockchainService.getOperators(selectedTenant.id).length === 0 && (
                  <p className="text-gray-400 text-sm">No operators yet.</p>
                )}
              </div>
            </div>
            <div>
              <h3 className="font-bold text-gray-900 mb-3 text-sm uppercase tracking-wide">Documents ({blockchainService.getDocuments(selectedTenant.id).length})</h3>
              <div className="space-y-2">
                {blockchainService.getDocuments(selectedTenant.id).map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">{doc.fileName}</p>
                      <p className="text-xs text-gray-500"><TruncatedHash value={doc.fileHash} /></p>
                    </div>
                    <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${doc.coSignQualified ? 'bg-teal-100 text-teal-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {doc.coSignQualified ? 'Qualified' : 'Pending'}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${doc.isValid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {doc.isValid ? 'Valid' : 'Revoked'}
                      </span>
                    </div>
                  </div>
                ))}
                {blockchainService.getDocuments(selectedTenant.id).length === 0 && (
                  <p className="text-gray-400 text-sm">No documents yet.</p>
                )}
              </div>
            </div>
            <div>
              <h3 className="font-bold text-gray-900 mb-3 text-sm uppercase tracking-wide">Recent Events</h3>
              <div className="max-h-48 overflow-y-auto space-y-1">
                {blockchainService.getEventsByTenant(selectedTenant.id).slice(-10).reverse().map((evt) => (
                  <div key={evt.id} className="flex items-start gap-2 text-xs py-1.5">
                    <span className="text-gray-400 whitespace-nowrap">{evt.timestamp.toLocaleTimeString()}</span>
                    <span className="font-mono text-gray-500">#{evt.blockNumber}</span>
                    <span className="text-gray-700 flex-1">{evt.description}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Config Modal */}
      {showConfigModal && selectedTenant && (
        <Modal title={`Configure: ${selectedTenant.name}`} onClose={() => setShowConfigModal(false)}>
          <div className="space-y-4">
            <Field label="Min Operator Stake (ETH)">
              <input type="number" step="0.1" value={configForm.minStake} onChange={(e) => setConfigForm({ ...configForm, minStake: parseFloat(e.target.value) })} className="input" />
            </Field>
            <Field label="Unstake Cooldown (days)">
              <input type="number" value={configForm.cooldown} onChange={(e) => setConfigForm({ ...configForm, cooldown: parseInt(e.target.value) })} className="input" />
            </Field>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowConfigModal(false)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={handleSaveConfig} className="btn-primary flex-1">Save Config</button>
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

function Modal({ title, children, onClose, wide }: { title: string; children: React.ReactNode; onClose: () => void; wide?: boolean }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className={`bg-white rounded-xl shadow-xl ${wide ? 'max-w-3xl' : 'max-w-md'} w-full max-h-[90vh] flex flex-col`} onClick={(e) => e.stopPropagation()}>
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
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1">{label}</label>
      {children}
    </div>
  );
}

function RoleCard({ label, address, color, note }: { label: string; address: string; color: string; note?: string }) {
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-50 border-blue-200',
    emerald: 'bg-emerald-50 border-emerald-200',
    amber: 'bg-amber-50 border-amber-200',
  };
  return (
    <div className={`rounded-lg border p-3 ${colorMap[color]}`}>
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs font-bold uppercase tracking-wide text-gray-600">{label}</p>
        {note && <span className="text-[10px] bg-amber-200 text-amber-800 px-1.5 py-0.5 rounded font-semibold">{note}</span>}
      </div>
      <p className="text-sm text-gray-900"><TruncatedHash value={address} /></p>
    </div>
  );
}
