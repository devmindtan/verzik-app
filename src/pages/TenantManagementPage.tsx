import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Eye,
  ToggleLeft,
  ToggleRight,
  Settings,
  Users,
  Wallet,
  RefreshCw,
} from "lucide-react";
import { blockchainService } from "../services/blockchainService";
import { AppModal } from "../components/AppModal";
import { authService } from "../services/authService";
import { HighlightText } from "../components/HighlightText";
import { SearchInput } from "../components/SearchInput";
import { useAuth } from "../contexts/AuthContext";
import { TruncatedHash } from "../components/TruncatedHash";
import { ConfirmPopup } from "../components/ConfirmPopup";
import { AppTooltip } from "../components/Tooltip";
import { TablePagination } from "../components/TablePagination";
import { includesNormalized } from "../lib/searchUtils";
import { Tenant, Operator, Document, BlockchainEvent } from "../types";

export function TenantManagementPage() {
  const PAGE_SIZE = 10;
  const { session } = useAuth();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showTreasuryModal, setShowTreasuryModal] = useState(false);
  const [showOpManagerModal, setShowOpManagerModal] = useState(false);
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [configForm, setConfigForm] = useState({ minStake: 1, cooldown: 7 });
  const [createForm, setCreateForm] = useState({
    name: "",
    admin: "",
    operatorManager: "",
    treasury: "",
  });
  const [treasuryForm, setTreasuryForm] = useState({ newTreasury: "" });
  const [opManagerForm, setOpManagerForm] = useState({ newManager: "" });
  const [recoveryForm, setRecoveryForm] = useState({
    fromAddress: "",
    toAddress: "",
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [confirm, setConfirm] = useState<{
    open: boolean;
    title: string;
    message: string;
    variant: "danger" | "warning" | "info";
    onConfirm: () => void;
  }>({
    open: false,
    title: "",
    message: "",
    variant: "danger",
    onConfirm: () => {},
  });

  const canCreate = authService.hasPermission(session, "create_tenant");
  const canManage = authService.hasPermission(session, "manage_tenant_config");
  const canSetTreasury = authService.hasPermission(session, "set_treasury");
  const canSetOpManager = authService.hasPermission(
    session,
    "set_operator_manager",
  );
  const canRecover = authService.hasPermission(session, "recover_operator");

  const refresh = useCallback(async () => {
    const result = await blockchainService.getTenants();
    setTenants(result);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const loadData = async () => {
      setLoading(true);
      try {
        const result = await blockchainService.getTenants();
        if (!cancelled) {
          setTenants(result);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };
    loadData();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !createForm.name ||
      !createForm.admin ||
      !createForm.operatorManager ||
      !createForm.treasury
    )
      return;
    setConfirm({
      open: true,
      title: "Create New Tenant",
      message: `This will create tenant "${createForm.name}" on-chain with the specified admin, operator manager, and treasury addresses. This action cannot be undone.`,
      variant: "info",
      onConfirm: async () => {
        setActionLoading(true);
        try {
          await blockchainService.createTenant(
            createForm.name,
            createForm.admin,
            createForm.operatorManager,
            createForm.treasury,
          );
          setCreateForm({
            name: "",
            admin: "",
            operatorManager: "",
            treasury: "",
          });
          setShowCreateModal(false);
          await refresh();
        } finally {
          setActionLoading(false);
        }
      },
    });
  };

  const handleToggleStatus = (tenant: Tenant) => {
    const action = tenant.isActive ? "deactivate" : "activate";
    setConfirm({
      open: true,
      title: tenant.isActive ? "Deactivate Tenant" : "Activate Tenant",
      message: `This will ${action} tenant "${tenant.name}". ${tenant.isActive ? "All operators and documents under this tenant will be affected." : "The tenant will resume normal operations."}`,
      variant: "warning",
      onConfirm: async () => {
        setActionLoading(true);
        try {
          await blockchainService.setTenantStatus(
            tenant.id,
            !tenant.isActive,
            session?.address || "",
          );
          await refresh();
        } finally {
          setActionLoading(false);
        }
      },
    });
  };

  const handleSaveConfig = () => {
    if (!selectedTenant) return;
    setConfirm({
      open: true,
      title: "Update Configuration",
      message: `This will update the configuration for "${selectedTenant.name}": min stake = ${configForm.minStake} ETH, cooldown = ${configForm.cooldown} days. This affects all operators in this tenant.`,
      variant: "warning",
      onConfirm: async () => {
        setActionLoading(true);
        try {
          await blockchainService.updateTenantConfig(
            selectedTenant.id,
            configForm.minStake,
            configForm.cooldown * 86400,
            session?.address || "",
          );
          setShowConfigModal(false);
          await refresh();
        } finally {
          setActionLoading(false);
        }
      },
    });
  };

  const openDetail = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setDetailLoading(true);
    setDetailOperators([]);
    setDetailDocuments([]);
    setDetailEvents([]);
    setShowDetailModal(true);
  };

  const openConfig = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setConfigForm({
      minStake: tenant.config.minOperatorStake,
      cooldown: Math.floor(tenant.config.unstakeCooldown / 86400),
    });
    setShowConfigModal(true);
  };

  const openTreasury = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setTreasuryForm({ newTreasury: "" });
    setShowTreasuryModal(true);
  };

  const openOpManager = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setOpManagerForm({ newManager: "" });
    setShowOpManagerModal(true);
  };

  const openRecovery = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setRecoveryForm({ fromAddress: "", toAddress: "" });
    setShowRecoveryModal(true);
  };

  const handleSetTreasury = () => {
    if (!selectedTenant || !treasuryForm.newTreasury) return;
    setConfirm({
      open: true,
      title: "Change Treasury Address",
      message: `This will change the treasury for "${selectedTenant.name}" from ${selectedTenant.treasury} to ${treasuryForm.newTreasury}. All future slashed funds will go to the new address.`,
      variant: "warning",
      onConfirm: async () => {
        setActionLoading(true);
        try {
          await blockchainService.setTreasury(
            selectedTenant.id,
            treasuryForm.newTreasury,
            session?.address || "",
          );
          setShowTreasuryModal(false);
          await refresh();
        } finally {
          setActionLoading(false);
        }
      },
    });
  };

  const handleSetOpManager = () => {
    if (!selectedTenant || !opManagerForm.newManager) return;
    setConfirm({
      open: true,
      title: "Change Operator Manager",
      message: `This will change the operator manager for "${selectedTenant.name}" from ${selectedTenant.operatorManager} to ${opManagerForm.newManager}. The new manager will have full control over operator lifecycle.`,
      variant: "warning",
      onConfirm: async () => {
        setActionLoading(true);
        try {
          await blockchainService.setOperatorManager(
            selectedTenant.id,
            opManagerForm.newManager,
            session?.address || "",
          );
          setShowOpManagerModal(false);
          await refresh();
        } finally {
          setActionLoading(false);
        }
      },
    });
  };

  const handleRecoverOperator = () => {
    if (!selectedTenant || !recoveryForm.fromAddress || !recoveryForm.toAddress)
      return;
    setConfirm({
      open: true,
      title: "Recover Operator",
      message: `This will migrate operator ${recoveryForm.fromAddress} to new address ${recoveryForm.toAddress}. The old address will lose all stake and permissions. The new address inherits everything.`,
      variant: "danger",
      onConfirm: async () => {
        setActionLoading(true);
        try {
          await blockchainService.recoverOperator(
            selectedTenant.id,
            recoveryForm.fromAddress,
            recoveryForm.toAddress,
            session?.address || "",
          );
          setShowRecoveryModal(false);
          await refresh();
        } finally {
          setActionLoading(false);
        }
      },
    });
  };

  // Detail modal data state
  const [detailOperators, setDetailOperators] = useState<Operator[]>([]);
  const [detailDocuments, setDetailDocuments] = useState<Document[]>([]);
  const [detailEvents, setDetailEvents] = useState<BlockchainEvent[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    if (!showDetailModal || !selectedTenant) return;
    let cancelled = false;
    const loadDetail = async () => {
      setDetailLoading(true);
      try {
        const [ops, docs, events] = await Promise.all([
          blockchainService.getOperators(selectedTenant.id),
          blockchainService.getDocuments(selectedTenant.id),
          blockchainService.getEventsByTenant(selectedTenant.id),
        ]);
        if (!cancelled) {
          setDetailOperators(ops);
          setDetailDocuments(docs);
          setDetailEvents(events);
        }
      } finally {
        if (!cancelled) {
          setDetailLoading(false);
        }
      }
    };
    loadDetail();
    return () => {
      cancelled = true;
    };
  }, [showDetailModal, selectedTenant]);

  // Table row data state
  const [tenantOperators, setTenantOperators] = useState<
    Record<string, Operator[]>
  >({});
  const [tenantDocuments, setTenantDocuments] = useState<
    Record<string, Document[]>
  >({});

  useEffect(() => {
    if (tenants.length === 0) return;
    let cancelled = false;
    const loadRowData = async () => {
      const [opsResults, docsResults] = await Promise.all([
        Promise.all(
          tenants.map(async (t) => ({
            id: t.id,
            data: await blockchainService.getOperators(t.id),
          })),
        ),
        Promise.all(
          tenants.map(async (t) => ({
            id: t.id,
            data: await blockchainService.getDocuments(t.id),
          })),
        ),
      ]);
      if (!cancelled) {
        const opsMap: Record<string, Operator[]> = {};
        const docsMap: Record<string, Document[]> = {};
        opsResults.forEach(({ id, data }) => {
          opsMap[id] = data;
        });
        docsResults.forEach(({ id, data }) => {
          docsMap[id] = data;
        });
        setTenantOperators(opsMap);
        setTenantDocuments(docsMap);
      }
    };
    loadRowData();
    return () => {
      cancelled = true;
    };
  }, [tenants]);

  const filteredTenants = tenants.filter((tenant) =>
    includesNormalized(
      `${tenant.name} ${tenant.id} ${tenant.admin} ${tenant.operatorManager} ${tenant.treasury}`,
      searchQuery,
    ),
  );
  const totalPages = Math.max(1, Math.ceil(filteredTenants.length / PAGE_SIZE));
  const paginatedTenants = filteredTenants.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Tenant Management
          </h1>
          <p className="text-gray-500 mt-1">
            Each tenant has 3 separate roles: Admin, Operator Manager, Treasury
          </p>
        </div>
        {canCreate && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors text-sm"
          >
            <Plus size={18} /> New Tenant
          </button>
        )}
      </div>

      {/* Tenants table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="px-5 py-4 border-b bg-slate-50 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <h2 className="font-bold text-gray-900">
            All Tenants ({filteredTenants.length}/{tenants.length})
          </h2>
          <div className="w-full lg:max-w-sm">
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search by tenant name, id, admin, manager, or treasury..."
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="px-5 py-8 text-center text-gray-400 text-sm">
              Loading tenants...
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-5 py-3 text-left font-semibold text-gray-600">
                    Name
                  </th>
                  <th className="px-5 py-3 text-left font-semibold text-gray-600">
                    Admin
                  </th>
                  <th className="px-5 py-3 text-left font-semibold text-gray-600">
                    Op. Manager
                  </th>
                  <th className="px-5 py-3 text-left font-semibold text-gray-600">
                    Treasury
                  </th>
                  <th className="px-5 py-3 text-left font-semibold text-gray-600">
                    Min Stake
                  </th>
                  <th className="px-5 py-3 text-left font-semibold text-gray-600">
                    Status
                  </th>
                  <th className="px-5 py-3 text-center font-semibold text-gray-600">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedTenants.map((tenant) => {
                  const ops = tenantOperators[tenant.id] || [];
                  const docs = tenantDocuments[tenant.id] || [];
                  return (
                    <tr
                      key={tenant.id}
                      className="border-b hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-5 py-3">
                        <div className="font-medium text-gray-900">
                          <HighlightText
                            text={tenant.name}
                            query={searchQuery}
                          />
                        </div>
                        <div className="text-xs text-gray-500">
                          {ops.length} ops / {docs.length} docs
                        </div>
                      </td>
                      <td className="px-5 py-3 text-xs text-gray-700">
                        <span className="block max-w-[180px] truncate font-mono">
                          <HighlightText
                            text={tenant.admin}
                            query={searchQuery}
                          />
                        </span>
                      </td>
                      <td className="px-5 py-3 text-xs text-gray-700">
                        <span className="block max-w-[180px] truncate font-mono">
                          <HighlightText
                            text={tenant.operatorManager}
                            query={searchQuery}
                          />
                        </span>
                      </td>
                      <td className="px-5 py-3 text-xs text-gray-700">
                        <span className="block max-w-[180px] truncate font-mono">
                          <HighlightText
                            text={tenant.treasury}
                            query={searchQuery}
                          />
                        </span>
                      </td>
                      <td className="px-5 py-3 text-gray-700">
                        {tenant.config.minOperatorStake} ETH
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-semibold ${tenant.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}`}
                        >
                          {tenant.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <AppTooltip content="View details">
                            <button
                              onClick={() => openDetail(tenant)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              aria-label="View details"
                            >
                              <Eye size={16} />
                            </button>
                          </AppTooltip>
                          {canManage && (
                            <>
                              <AppTooltip content="Configure">
                                <button
                                  onClick={() => openConfig(tenant)}
                                  className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                  aria-label="Configure"
                                >
                                  <Settings size={16} />
                                </button>
                              </AppTooltip>
                              <AppTooltip content="Toggle status">
                                <button
                                  onClick={() => handleToggleStatus(tenant)}
                                  className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                  aria-label="Toggle status"
                                >
                                  {tenant.isActive ? (
                                    <ToggleRight
                                      size={16}
                                      className="text-green-600"
                                    />
                                  ) : (
                                    <ToggleLeft size={16} />
                                  )}
                                </button>
                              </AppTooltip>
                            </>
                          )}
                          {canSetTreasury && (
                            <AppTooltip content="Change Treasury">
                              <button
                                onClick={() => openTreasury(tenant)}
                                className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                                aria-label="Change Treasury"
                              >
                                <Wallet size={16} />
                              </button>
                            </AppTooltip>
                          )}
                          {canSetOpManager && (
                            <AppTooltip content="Change Operator Manager">
                              <button
                                onClick={() => openOpManager(tenant)}
                                className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                aria-label="Change Operator Manager"
                              >
                                <Users size={16} />
                              </button>
                            </AppTooltip>
                          )}
                          {canRecover && (
                            <AppTooltip content="Recover Operator">
                              <button
                                onClick={() => openRecovery(tenant)}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                aria-label="Recover Operator"
                              >
                                <RefreshCw size={16} />
                              </button>
                            </AppTooltip>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
          {!loading && filteredTenants.length === 0 && (
            <div className="px-5 py-8 text-center text-gray-400 text-sm">
              {tenants.length === 0
                ? "No tenants yet."
                : "No tenants match your search."}
            </div>
          )}
        </div>
        {!loading && filteredTenants.length > 0 && (
          <TablePagination
            totalItems={filteredTenants.length}
            pageSize={PAGE_SIZE}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            itemLabel="tenants"
          />
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <Modal
          title="Create New Tenant"
          onClose={() => setShowCreateModal(false)}
        >
          <form onSubmit={handleCreate} className="space-y-4">
            <Field label="Tenant Name">
              <input
                type="text"
                value={createForm.name}
                onChange={(e) =>
                  setCreateForm({ ...createForm, name: e.target.value })
                }
                className="input"
                placeholder="e.g., Finance Operations"
              />
            </Field>
            <Field label="Admin Address">
              <input
                type="text"
                value={createForm.admin}
                onChange={(e) =>
                  setCreateForm({ ...createForm, admin: e.target.value })
                }
                className="input font-mono text-sm"
                placeholder="0x..."
              />
            </Field>
            <Field label="Operator Manager Address">
              <input
                type="text"
                value={createForm.operatorManager}
                onChange={(e) =>
                  setCreateForm({
                    ...createForm,
                    operatorManager: e.target.value,
                  })
                }
                className="input font-mono text-sm"
                placeholder="0x..."
              />
            </Field>
            <Field label="Treasury Address">
              <input
                type="text"
                value={createForm.treasury}
                onChange={(e) =>
                  setCreateForm({ ...createForm, treasury: e.target.value })
                }
                className="input font-mono text-sm"
                placeholder="0x... (receives slashed funds only)"
              />
            </Field>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="btn-secondary flex-1"
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary flex-1"
                disabled={actionLoading}
              >
                {actionLoading ? "Creating..." : "Create Tenant"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedTenant && (
        <Modal
          title={selectedTenant.name}
          onClose={() => setShowDetailModal(false)}
          wide
        >
          <div className="space-y-6">
            {detailLoading ? (
              <div className="py-8 text-center text-gray-400 text-sm">
                Loading details...
              </div>
            ) : (
              <>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-slate-100 mb-3 text-sm uppercase tracking-wide">
                    Role Holders
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <RoleCard
                      label="Admin"
                      address={selectedTenant.admin}
                      color="blue"
                    />
                    <RoleCard
                      label="Operator Manager"
                      address={selectedTenant.operatorManager}
                      color="emerald"
                    />
                    <RoleCard
                      label="Treasury"
                      address={selectedTenant.treasury}
                      color="amber"
                      note="Funds only"
                    />
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-slate-100 mb-3 text-sm uppercase tracking-wide">
                    Configuration
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-50 dark:bg-slate-800 rounded-lg p-3">
                      <p className="text-xs text-gray-500 dark:text-slate-400">
                        Min Operator Stake
                      </p>
                      <p className="font-bold text-gray-900 dark:text-slate-100">
                        {selectedTenant.config.minOperatorStake} ETH
                      </p>
                    </div>
                    <div className="bg-gray-50 dark:bg-slate-800 rounded-lg p-3">
                      <p className="text-xs text-gray-500 dark:text-slate-400">
                        Unstake Cooldown
                      </p>
                      <p className="font-bold text-gray-900 dark:text-slate-100">
                        {Math.floor(
                          selectedTenant.config.unstakeCooldown / 86400,
                        )}{" "}
                        days
                      </p>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-slate-100 mb-3 text-sm uppercase tracking-wide">
                    Operators ({detailOperators.length})
                  </h3>
                  <div className="space-y-2">
                    {detailOperators.map((op) => (
                      <div
                        key={op.id}
                        className="flex items-center justify-between bg-gray-50 dark:bg-slate-800 rounded-lg p-3"
                      >
                        <div>
                          <p className="text-sm text-gray-900 dark:text-slate-100">
                            <TruncatedHash value={op.address} />
                          </p>
                          <p className="text-xs text-gray-500 dark:text-slate-400">
                            Stake: {op.stakeAmount} ETH / Joined:{" "}
                            {op.joinedAt.toLocaleDateString()}
                          </p>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-semibold ${op.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}`}
                        >
                          {op.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                    ))}
                    {detailOperators.length === 0 && (
                      <p className="text-gray-400 text-sm">No operators yet.</p>
                    )}
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-slate-100 mb-3 text-sm uppercase tracking-wide">
                    Documents ({detailDocuments.length})
                  </h3>
                  <div className="space-y-2">
                    {detailDocuments.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between bg-gray-50 dark:bg-slate-800 rounded-lg p-3"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-slate-100 truncate">
                            {doc.fileName}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-slate-400">
                            <TruncatedHash value={doc.fileHash} />
                          </p>
                        </div>
                        <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-semibold ${doc.coSignQualified ? "bg-teal-100 text-teal-800" : "bg-yellow-100 text-yellow-800"}`}
                          >
                            {doc.coSignQualified ? "Qualified" : "Pending"}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-semibold ${doc.isValid ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
                          >
                            {doc.isValid ? "Valid" : "Revoked"}
                          </span>
                        </div>
                      </div>
                    ))}
                    {detailDocuments.length === 0 && (
                      <p className="text-gray-400 text-sm">No documents yet.</p>
                    )}
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-slate-100 mb-3 text-sm uppercase tracking-wide">
                    Recent Events
                  </h3>
                  <div className="max-h-48 overflow-y-auto space-y-1">
                    {detailEvents
                      .slice(-10)
                      .reverse()
                      .map((evt) => (
                        <div
                          key={evt.id}
                          className="flex items-start gap-2 text-xs py-1.5"
                        >
                          <span className="text-gray-400 dark:text-slate-500 whitespace-nowrap">
                            {evt.timestamp.toLocaleTimeString()}
                          </span>
                          <span className="font-mono text-gray-500 dark:text-slate-400">
                            #{evt.blockNumber}
                          </span>
                          <span className="text-gray-700 dark:text-slate-300 flex-1">
                            {evt.description}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </Modal>
      )}

      {/* Config Modal */}
      {showConfigModal && selectedTenant && (
        <Modal
          title={`Configure: ${selectedTenant.name}`}
          onClose={() => setShowConfigModal(false)}
        >
          <div className="space-y-4">
            <Field label="Min Operator Stake (ETH)">
              <input
                type="number"
                step="0.1"
                value={configForm.minStake}
                onChange={(e) =>
                  setConfigForm({
                    ...configForm,
                    minStake: parseFloat(e.target.value),
                  })
                }
                className="input"
              />
            </Field>
            <Field label="Unstake Cooldown (days)">
              <input
                type="number"
                value={configForm.cooldown}
                onChange={(e) =>
                  setConfigForm({
                    ...configForm,
                    cooldown: parseInt(e.target.value),
                  })
                }
                className="input"
              />
            </Field>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowConfigModal(false)}
                className="btn-secondary flex-1"
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveConfig}
                className="btn-primary flex-1"
                disabled={actionLoading}
              >
                {actionLoading ? "Saving..." : "Save Config"}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Treasury Modal */}
      {showTreasuryModal && selectedTenant && (
        <Modal
          title={`Change Treasury: ${selectedTenant.name}`}
          onClose={() => setShowTreasuryModal(false)}
        >
          <div className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-xs text-amber-600 font-semibold">
                Current Treasury
              </p>
              <p className="text-sm text-amber-800 font-mono">
                <TruncatedHash value={selectedTenant.treasury} />
              </p>
            </div>
            <Field label="New Treasury Address">
              <input
                type="text"
                value={treasuryForm.newTreasury}
                onChange={(e) =>
                  setTreasuryForm({
                    ...treasuryForm,
                    newTreasury: e.target.value,
                  })
                }
                className="input font-mono text-sm"
                placeholder="0x... (receives slashed funds only)"
              />
            </Field>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowTreasuryModal(false)}
                className="btn-secondary flex-1"
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleSetTreasury}
                className="flex-1 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors text-sm"
                disabled={actionLoading}
              >
                {actionLoading ? "Updating..." : "Change Treasury"}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Operator Manager Modal */}
      {showOpManagerModal && selectedTenant && (
        <Modal
          title={`Change Operator Manager: ${selectedTenant.name}`}
          onClose={() => setShowOpManagerModal(false)}
        >
          <div className="space-y-4">
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
              <p className="text-xs text-emerald-600 font-semibold">
                Current Operator Manager
              </p>
              <p className="text-sm text-emerald-800 font-mono">
                <TruncatedHash value={selectedTenant.operatorManager} />
              </p>
            </div>
            <Field label="New Operator Manager Address">
              <input
                type="text"
                value={opManagerForm.newManager}
                onChange={(e) =>
                  setOpManagerForm({
                    ...opManagerForm,
                    newManager: e.target.value,
                  })
                }
                className="input font-mono text-sm"
                placeholder="0x..."
              />
            </Field>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowOpManagerModal(false)}
                className="btn-secondary flex-1"
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleSetOpManager}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors text-sm"
                disabled={actionLoading}
              >
                {actionLoading ? "Updating..." : "Change Manager"}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Recovery Modal */}
      {showRecoveryModal && selectedTenant && (
        <Modal
          title={`Recover Operator: ${selectedTenant.name}`}
          onClose={() => setShowRecoveryModal(false)}
        >
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800 font-semibold">
                Warning: This will migrate an operator from their old address to
                a new address. The old address will lose all stake and
                permissions.
              </p>
            </div>
            <Field label="Old Operator Address (lost wallet)">
              <input
                type="text"
                value={recoveryForm.fromAddress}
                onChange={(e) =>
                  setRecoveryForm({
                    ...recoveryForm,
                    fromAddress: e.target.value,
                  })
                }
                className="input font-mono text-sm"
                placeholder="0x... (the lost address)"
              />
            </Field>
            <Field label="New Operator Address (replacement wallet)">
              <input
                type="text"
                value={recoveryForm.toAddress}
                onChange={(e) =>
                  setRecoveryForm({
                    ...recoveryForm,
                    toAddress: e.target.value,
                  })
                }
                className="input font-mono text-sm"
                placeholder="0x... (the new address)"
              />
            </Field>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowRecoveryModal(false)}
                className="btn-secondary flex-1"
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleRecoverOperator}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors text-sm"
                disabled={actionLoading}
              >
                {actionLoading ? "Recovering..." : "Recover Operator"}
              </button>
            </div>
          </div>
        </Modal>
      )}

      <ConfirmPopup
        open={confirm.open}
        title={confirm.title}
        message={confirm.message}
        variant={confirm.variant}
        confirmLabel={actionLoading ? "Processing..." : "Confirm"}
        onConfirm={() => {
          confirm.onConfirm();
          setConfirm({ ...confirm, open: false });
        }}
        onCancel={() => setConfirm({ ...confirm, open: false })}
      />
    </div>
  );
}

function Modal({
  title,
  children,
  onClose,
  wide,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  return (
    <AppModal title={title} onClose={onClose} width={wide ? "3xl" : "md"}>
      {children}
    </AppModal>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1">
        {label}
      </label>
      {children}
    </div>
  );
}

function RoleCard({
  label,
  address,
  color,
  note,
}: {
  label: string;
  address: string;
  color: string;
  note?: string;
}) {
  const colorMap: Record<string, string> = {
    blue: "bg-blue-50 border-blue-200 dark:bg-blue-950/40 dark:border-blue-800/70",
    emerald:
      "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800/70",
    amber:
      "bg-amber-50 border-amber-200 dark:bg-amber-950/40 dark:border-amber-800/70",
  };
  return (
    <div className={`rounded-lg border p-3 ${colorMap[color]}`}>
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs font-bold uppercase tracking-wide text-gray-600 dark:text-slate-300">
          {label}
        </p>
        {note && (
          <span className="text-[10px] bg-amber-200 text-amber-800 dark:bg-amber-500/20 dark:text-amber-200 px-1.5 py-0.5 rounded font-semibold">
            {note}
          </span>
        )}
      </div>
      <p className="text-sm text-gray-900 dark:text-slate-100">
        <TruncatedHash value={address} />
      </p>
    </div>
  );
}
