import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Lock,
  Unlock,
  Eye,
  Zap,
  Flame,
  Coins,
  ShieldCheck,
  FileText,
} from "lucide-react";
import { AppModal } from "../components/AppModal";
import { blockchainService } from "../services/blockchainService";
import { authService } from "../services/authService";
import { HighlightText } from "../components/HighlightText";
import { SearchInput } from "../components/SearchInput";
import { useAuth } from "../contexts/AuthContext";
import { TruncatedHash } from "../components/TruncatedHash";
import { ConfirmPopup } from "../components/ConfirmPopup";
import { AppTooltip } from "../components/Tooltip";
import { TablePagination } from "../components/TablePagination";
import { AppSelect } from "../components/AppSelect";
import { includesNormalized } from "../lib/searchUtils";
import { Operator } from "../types";

export function OperatorManagementPage() {
  const PAGE_SIZE = 10;
  const { session } = useAuth();
  const [selectedTenant, setSelectedTenant] = useState(
    session?.tenantId || "t1",
  );
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showSlashModal, setShowSlashModal] = useState(false);
  const [showSoftSlashModal, setShowSoftSlashModal] = useState(false);
  const [showDelegateModal, setShowDelegateModal] = useState(false);
  const [showMetadataModal, setShowMetadataModal] = useState(false);
  const [selectedOp, setSelectedOp] = useState<Operator | null>(null);
  const [addForm, setAddForm] = useState({ address: "", stakeAmount: 1 });
  const [slashReason, setSlashReason] = useState("");
  const [softSlashForm, setSoftSlashForm] = useState({
    penaltyBps: 1000,
    reason: "",
  });
  const [delegateForm, setDelegateForm] = useState({ delegateAddress: "" });
  const [metadataForm, setMetadataForm] = useState({ metadataURI: "" });
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
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [tenants, setTenants] = useState<any[]>([]);
  const [operators, setOperators] = useState<Operator[]>([]);
  const [tenant, setTenant] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const canManage = authService.hasPermission(session, "manage_operators");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [t, ops, ten] = await Promise.all([
        blockchainService.getTenants(),
        blockchainService.getOperators(selectedTenant),
        blockchainService.getTenant(selectedTenant),
      ]);
      setTenants(t);
      setOperators(ops);
      setTenant(ten);
    } finally {
      setLoading(false);
    }
  }, [selectedTenant]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const refresh = () => loadData();
  const filteredOperators = operators.filter((operator) =>
    includesNormalized(
      `${operator.address} ${operator.stakeAmount} ${operator.isActive ? "active" : "inactive"} ${operator.metadataURI || ""} ${operator.recoveryDelegate || ""}`,
      searchQuery,
    ),
  );
  const totalPages = Math.max(
    1,
    Math.ceil(filteredOperators.length / PAGE_SIZE),
  );
  const paginatedOperators = filteredOperators.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedTenant, searchQuery]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.address || addForm.stakeAmount <= 0) return;
    setConfirm({
      open: true,
      title: "Add Operator",
      message: `This will add ${addForm.address} as an operator with ${addForm.stakeAmount} ETH stake. The stake will be locked on-chain.`,
      variant: "info",
      onConfirm: async () => {
        setActionLoading(true);
        try {
          await blockchainService.joinAsOperator(
            selectedTenant,
            addForm.address,
            addForm.stakeAmount,
          );
          setAddForm({ address: "", stakeAmount: 1 });
          setShowAddModal(false);
          await refresh();
        } finally {
          setActionLoading(false);
        }
      },
    });
  };

  const handleToggle = (op: Operator) => {
    const action = op.isActive ? "deactivate" : "activate";
    setConfirm({
      open: true,
      title: op.isActive ? "Deactivate Operator" : "Activate Operator",
      message: `This will ${action} operator ${op.address}. ${op.isActive ? "The operator will no longer be able to sign documents." : "The operator will resume signing capabilities."}`,
      variant: "warning",
      onConfirm: async () => {
        setActionLoading(true);
        try {
          await blockchainService.setOperatorStatus(
            selectedTenant,
            op.address,
            !op.isActive,
            session?.address || "",
          );
          await refresh();
        } finally {
          setActionLoading(false);
        }
      },
    });
  };

  const handleSlash = () => {
    if (!selectedOp || !slashReason) return;
    setConfirm({
      open: true,
      title: "Slash Operator",
      message: `This will seize the operator's ENTIRE stake of ${selectedOp.stakeAmount} ETH and transfer it to the tenant treasury. The operator will be permanently deactivated. Reason: ${slashReason}`,
      variant: "danger",
      onConfirm: async () => {
        setActionLoading(true);
        try {
          await blockchainService.slashOperator(
            selectedTenant,
            selectedOp.address,
            slashReason,
            session?.address || "",
          );
          setSlashReason("");
          setShowSlashModal(false);
          setSelectedOp(null);
          await refresh();
        } finally {
          setActionLoading(false);
        }
      },
    });
  };

  const handleSoftSlash = () => {
    if (!selectedOp || !softSlashForm.reason) return;
    const penalty = (softSlashForm.penaltyBps / 100).toFixed(1);
    const amount = (
      (selectedOp.stakeAmount * softSlashForm.penaltyBps) /
      10000
    ).toFixed(4);
    setConfirm({
      open: true,
      title: "Soft Slash Operator",
      message: `This will seize ${penalty}% (${amount} ETH) of the operator's stake. If remaining stake falls below minimum, the operator will be auto-deactivated. Reason: ${softSlashForm.reason}`,
      variant: "warning",
      onConfirm: async () => {
        setActionLoading(true);
        try {
          await blockchainService.softSlashOperator(
            selectedTenant,
            selectedOp.address,
            softSlashForm.penaltyBps,
            softSlashForm.reason,
            session?.address || "",
          );
          setSoftSlashForm({ penaltyBps: 1000, reason: "" });
          setShowSoftSlashModal(false);
          setSelectedOp(null);
          await refresh();
        } finally {
          setActionLoading(false);
        }
      },
    });
  };

  const handleRequestUnstake = (op: Operator) => {
    setConfirm({
      open: true,
      title: "Request Unstake",
      message: `This will initiate the unstake process for operator ${op.address}. A cooldown period will begin before the stake can be withdrawn.`,
      variant: "warning",
      onConfirm: async () => {
        setActionLoading(true);
        try {
          await blockchainService.requestUnstake(selectedTenant, op.address);
          await refresh();
        } finally {
          setActionLoading(false);
        }
      },
    });
  };

  const handleTopUp = (op: Operator) => {
    const amount = prompt("Top-up amount (ETH):");
    if (amount && parseFloat(amount) > 0) {
      setConfirm({
        open: true,
        title: "Top Up Stake",
        message: `This will add ${amount} ETH to operator ${op.address}'s stake. Current stake: ${op.stakeAmount} ETH.`,
        variant: "info",
        onConfirm: async () => {
          setActionLoading(true);
          try {
            await blockchainService.topUpStake(
              selectedTenant,
              op.address,
              parseFloat(amount),
            );
            await refresh();
          } finally {
            setActionLoading(false);
          }
        },
      });
    }
  };

  const handleExecuteUnstake = (op: Operator) => {
    setConfirm({
      open: true,
      title: "Execute Unstake",
      message: `This will withdraw ${op.stakeAmount} ETH from operator ${op.address}. The operator will be deactivated and the stake returned.`,
      variant: "info",
      onConfirm: async () => {
        setActionLoading(true);
        try {
          await blockchainService.executeUnstake(selectedTenant, op.address);
          await refresh();
        } finally {
          setActionLoading(false);
        }
      },
    });
  };

  const handleSetDelegate = () => {
    if (!selectedOp || !delegateForm.delegateAddress) return;
    setConfirm({
      open: true,
      title: "Set Recovery Delegate",
      message: `This will set ${delegateForm.delegateAddress} as the recovery delegate for operator ${selectedOp.address}. The delegate can recover the operator's account if the wallet is lost.`,
      variant: "info",
      onConfirm: async () => {
        setActionLoading(true);
        try {
          await blockchainService.setRecoveryDelegate(
            selectedTenant,
            selectedOp.address,
            delegateForm.delegateAddress,
          );
          setShowDelegateModal(false);
          setSelectedOp(null);
          await refresh();
        } finally {
          setActionLoading(false);
        }
      },
    });
  };

  const handleUpdateMetadata = () => {
    if (!selectedOp) return;
    setConfirm({
      open: true,
      title: "Update Metadata",
      message: `This will update the metadata URI for operator ${selectedOp.address}.`,
      variant: "info",
      onConfirm: async () => {
        setActionLoading(true);
        try {
          await blockchainService.updateOperatorMetadata(
            selectedTenant,
            selectedOp.address,
            metadataForm.metadataURI,
          );
          setShowMetadataModal(false);
          setSelectedOp(null);
          await refresh();
        } finally {
          setActionLoading(false);
        }
      },
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100">
              Operator Management
            </h1>
            <p className="text-gray-500 mt-1 dark:text-slate-400">
              Manage operator lifecycle, stakes, and penalties
            </p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-8 text-center text-gray-400 dark:text-slate-400">
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100">
            Operator Management
          </h1>
          <p className="text-gray-500 mt-1 dark:text-slate-400">
            Manage operator lifecycle, stakes, and penalties
          </p>
        </div>
        {canManage && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors text-sm"
            disabled={actionLoading}
          >
            <Plus size={18} /> Add Operator
          </button>
        )}
      </div>

      {/* Tenant selector */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-4 flex items-center gap-3">
        <label className="text-sm font-semibold text-gray-700 dark:text-slate-200">
          Tenant:
        </label>
        <AppSelect
          value={selectedTenant}
          onChange={setSelectedTenant}
          data={tenants.map((tenantOption) => ({
            value: tenantOption.id,
            label: tenantOption.name,
          }))}
          className="w-full max-w-xs"
          disabled={actionLoading}
        />
      </div>

      {/* Tenant info bar */}
      {tenant && (
        <div className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
          <h2 className="font-bold text-gray-900 dark:text-slate-100 mb-3">
            {tenant.name}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-gray-500 dark:text-slate-400 text-xs">
                Min Stake
              </p>
              <p className="font-bold text-gray-900 dark:text-slate-100">
                {tenant.config.minOperatorStake} ETH
              </p>
            </div>
            <div>
              <p className="text-gray-500 dark:text-slate-400 text-xs">
                Unstake Cooldown
              </p>
              <p className="font-bold text-gray-900 dark:text-slate-100">
                {Math.floor(tenant.config.unstakeCooldown / 86400)} days
              </p>
            </div>
            <div>
              <p className="text-gray-500 dark:text-slate-400 text-xs">
                Active Operators
              </p>
              <p className="font-bold text-gray-900 dark:text-slate-100">
                {operators.filter((o) => o.isActive).length}
              </p>
            </div>
            <div>
              <p className="text-gray-500 dark:text-slate-400 text-xs">
                Total Staked
              </p>
              <p className="font-bold text-gray-900 dark:text-slate-100">
                {operators.reduce((s, o) => s + o.stakeAmount, 0).toFixed(2)}{" "}
                ETH
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Operators table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <h2 className="font-bold text-gray-900 dark:text-slate-100">
            Operators ({filteredOperators.length}/{operators.length})
          </h2>
          <div className="w-full lg:max-w-sm">
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search by operator address, status, delegate, or metadata..."
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-5 py-3 text-left font-semibold text-gray-600 dark:text-slate-300">
                  Address
                </th>
                <th className="px-5 py-3 text-left font-semibold text-gray-600 dark:text-slate-300">
                  Stake
                </th>
                <th className="px-5 py-3 text-left font-semibold text-gray-600 dark:text-slate-300">
                  Status
                </th>
                <th className="px-5 py-3 text-left font-semibold text-gray-600 dark:text-slate-300">
                  Joined
                </th>
                <th className="px-5 py-3 text-left font-semibold text-gray-600 dark:text-slate-300">
                  Unstake
                </th>
                <th className="px-5 py-3 text-center font-semibold text-gray-600 dark:text-slate-300">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedOperators.map((op) => (
                <tr
                  key={op.id}
                  className="border-b border-slate-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800/70 transition-colors"
                >
                  <td className="px-5 py-3 text-xs text-gray-900 dark:text-slate-100">
                    <span className="block max-w-[180px] truncate font-mono">
                      <HighlightText text={op.address} query={searchQuery} />
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span className="font-semibold text-gray-900 dark:text-slate-100">
                      {op.stakeAmount} ETH
                    </span>
                    {op.stakeAmount > 0 &&
                      op.stakeAmount <
                        (tenant?.config.minOperatorStake || 0) && (
                        <span className="ml-2 text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-semibold">
                          BELOW MIN
                        </span>
                      )}
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-semibold ${op.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}`}
                    >
                      {op.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-gray-600 dark:text-slate-400">
                    {op.joinedAt.toLocaleDateString()}
                  </td>
                  <td className="px-5 py-3 text-xs">
                    {op.pendingUnstakeAt ? (
                      <div>
                        <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded font-medium">
                          {op.pendingUnstakeAt.toLocaleDateString()}
                        </span>
                        {new Date() >= op.pendingUnstakeAt && (
                          <button
                            onClick={() => handleExecuteUnstake(op)}
                            className="ml-2 text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded font-semibold hover:bg-blue-700 transition-colors"
                            disabled={actionLoading}
                          >
                            Withdraw
                          </button>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400 dark:text-slate-500">
                        —
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <AppTooltip content="View details">
                        <button
                          onClick={() => {
                            setSelectedOp(op);
                            setShowDetailModal(true);
                          }}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
                          aria-label="View details"
                        >
                          <Eye size={16} />
                        </button>
                      </AppTooltip>
                      {canManage && (
                        <>
                          <AppTooltip content="Top-up stake">
                            <button
                              onClick={() => handleTopUp(op)}
                              className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
                              aria-label="Top-up stake"
                              disabled={actionLoading}
                            >
                              <Coins size={16} />
                            </button>
                          </AppTooltip>
                          <AppTooltip
                            content={op.isActive ? "Deactivate" : "Activate"}
                          >
                            <button
                              onClick={() => handleToggle(op)}
                              className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                              aria-label={
                                op.isActive ? "Deactivate" : "Activate"
                              }
                              disabled={actionLoading}
                            >
                              {op.isActive ? (
                                <Lock size={16} className="text-yellow-600" />
                              ) : (
                                <Unlock size={16} className="text-green-600" />
                              )}
                            </button>
                          </AppTooltip>
                          <AppTooltip content="Soft slash (partial penalty)">
                            <button
                              onClick={() => {
                                setSelectedOp(op);
                                setShowSoftSlashModal(true);
                              }}
                              className="p-1.5 text-orange-600 hover:bg-orange-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
                              aria-label="Soft slash"
                              disabled={actionLoading}
                            >
                              <Zap size={16} />
                            </button>
                          </AppTooltip>
                          <AppTooltip content="Full slash (seize all stake)">
                            <button
                              onClick={() => {
                                setSelectedOp(op);
                                setShowSlashModal(true);
                              }}
                              className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
                              aria-label="Full slash"
                              disabled={actionLoading}
                            >
                              <Flame size={16} />
                            </button>
                          </AppTooltip>
                          {op.isActive && !op.pendingUnstakeAt && (
                            <AppTooltip content="Request unstake">
                              <button
                                onClick={() => handleRequestUnstake(op)}
                                className="p-1.5 text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-xs"
                                aria-label="Request unstake"
                                disabled={actionLoading}
                              >
                                Exit
                              </button>
                            </AppTooltip>
                          )}
                          <AppTooltip content="Set recovery delegate">
                            <button
                              onClick={() => {
                                setSelectedOp(op);
                                setDelegateForm({
                                  delegateAddress: op.recoveryDelegate || "",
                                });
                                setShowDelegateModal(true);
                              }}
                              className="p-1.5 text-cyan-600 hover:bg-cyan-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
                              aria-label="Set recovery delegate"
                              disabled={actionLoading}
                            >
                              <ShieldCheck size={16} />
                            </button>
                          </AppTooltip>
                          <AppTooltip content="Update metadata URI">
                            <button
                              onClick={() => {
                                setSelectedOp(op);
                                setMetadataForm({
                                  metadataURI: op.metadataURI || "",
                                });
                                setShowMetadataModal(true);
                              }}
                              className="p-1.5 text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                              aria-label="Update metadata URI"
                              disabled={actionLoading}
                            >
                              <FileText size={16} />
                            </button>
                          </AppTooltip>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredOperators.length === 0 && (
            <div className="px-5 py-8 text-center text-gray-400 dark:text-slate-400 text-sm">
              {operators.length === 0
                ? "No operators in this tenant."
                : "No operators match your search."}
            </div>
          )}
        </div>
        {!loading && filteredOperators.length > 0 && (
          <TablePagination
            totalItems={filteredOperators.length}
            pageSize={PAGE_SIZE}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            itemLabel="operators"
          />
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <Modal title="Add Operator" onClose={() => setShowAddModal(false)}>
          <form onSubmit={handleAdd} className="space-y-4">
            <Field label="Operator Address">
              <input
                type="text"
                value={addForm.address}
                onChange={(e) =>
                  setAddForm({ ...addForm, address: e.target.value })
                }
                className="input font-mono text-sm"
                placeholder="0x..."
              />
            </Field>
            <Field label="Stake Amount (ETH)">
              <input
                type="number"
                step="0.1"
                value={addForm.stakeAmount}
                onChange={(e) =>
                  setAddForm({
                    ...addForm,
                    stakeAmount: parseFloat(e.target.value),
                  })
                }
                className="input"
              />
            </Field>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary flex-1"
                disabled={actionLoading}
              >
                {actionLoading ? "Adding..." : "Add Operator"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedOp && (
        <Modal
          title="Operator Details"
          onClose={() => setShowDetailModal(false)}
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 dark:bg-slate-800 rounded-lg p-3">
                <p className="text-xs text-gray-500 dark:text-slate-400">
                  Address
                </p>
                <p className="text-sm text-gray-900 dark:text-slate-100">
                  <TruncatedHash value={selectedOp.address} />
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-slate-800 rounded-lg p-3">
                <p className="text-xs text-gray-500 dark:text-slate-400">
                  Status
                </p>
                <p
                  className={`font-bold ${selectedOp.isActive ? "text-green-700" : "text-gray-500"}`}
                >
                  {selectedOp.isActive ? "Active" : "Inactive"}
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-slate-800 rounded-lg p-3">
                <p className="text-xs text-gray-500 dark:text-slate-400">
                  Stake Amount
                </p>
                <p className="font-bold text-gray-900 dark:text-slate-100">
                  {selectedOp.stakeAmount} ETH
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-slate-800 rounded-lg p-3">
                <p className="text-xs text-gray-500 dark:text-slate-400">
                  Joined
                </p>
                <p className="font-bold text-gray-900 dark:text-slate-100">
                  {selectedOp.joinedAt.toLocaleDateString()}
                </p>
              </div>
            </div>
            {selectedOp.pendingUnstakeAt && (
              <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-700/50 rounded-lg p-3">
                <p className="text-xs text-amber-600 font-semibold">
                  Unstake Pending
                </p>
                <p className="text-sm text-amber-800">
                  Available from: {selectedOp.pendingUnstakeAt.toLocaleString()}
                </p>
              </div>
            )}
            {selectedOp.recoveryDelegate && (
              <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-700/50 rounded-lg p-3">
                <p className="text-xs text-blue-600 font-semibold">
                  Recovery Delegate
                </p>
                <p className="text-sm text-blue-800">
                  <TruncatedHash value={selectedOp.recoveryDelegate} />
                </p>
              </div>
            )}
            {selectedOp.metadataURI && (
              <div className="bg-gray-50 dark:bg-slate-800 rounded-lg p-3">
                <p className="text-xs text-gray-500 dark:text-slate-400">
                  Metadata URI
                </p>
                <p className="text-sm text-gray-900 dark:text-slate-100">
                  <TruncatedHash value={selectedOp.metadataURI} />
                </p>
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
              <p className="text-sm text-red-800 font-semibold">
                Warning: This will seize the operator's entire stake (
                {selectedOp.stakeAmount} ETH) and transfer it to the tenant
                treasury.
              </p>
            </div>
            <p className="text-sm text-gray-700">
              Operator: <TruncatedHash value={selectedOp.address} />
            </p>
            <Field label="Reason for slashing">
              <input
                type="text"
                value={slashReason}
                onChange={(e) => setSlashReason(e.target.value)}
                className="input"
                placeholder="e.g., Double-signing violation"
              />
            </Field>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowSlashModal(false)}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleSlash}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
                disabled={actionLoading}
              >
                {actionLoading ? "Slashing..." : "Slash Operator"}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Soft Slash Modal */}
      {showSoftSlashModal && selectedOp && (
        <Modal
          title="Soft Slash Operator"
          onClose={() => setShowSoftSlashModal(false)}
        >
          <div className="space-y-4">
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <p className="text-sm text-orange-800">
                Partial penalty:{" "}
                <strong>{(softSlashForm.penaltyBps / 100).toFixed(1)}%</strong>{" "}
                of stake (
                {(
                  (selectedOp.stakeAmount * softSlashForm.penaltyBps) /
                  10000
                ).toFixed(4)}{" "}
                ETH) will be seized.
              </p>
              <p className="text-xs text-orange-600 mt-1">
                If remaining stake falls below minimum, operator will be
                deactivated.
              </p>
            </div>
            <Field label="Penalty (Basis Points, 1000 = 10%)">
              <input
                type="number"
                step="100"
                min="100"
                max="10000"
                value={softSlashForm.penaltyBps}
                onChange={(e) =>
                  setSoftSlashForm({
                    ...softSlashForm,
                    penaltyBps: parseInt(e.target.value) || 0,
                  })
                }
                className="input"
              />
            </Field>
            <Field label="Reason">
              <input
                type="text"
                value={softSlashForm.reason}
                onChange={(e) =>
                  setSoftSlashForm({ ...softSlashForm, reason: e.target.value })
                }
                className="input"
                placeholder="e.g., Late response"
              />
            </Field>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowSoftSlashModal(false)}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleSoftSlash}
                className="flex-1 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
                disabled={actionLoading}
              >
                {actionLoading ? "Slashing..." : "Soft Slash"}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Recovery Delegate Modal */}
      {showDelegateModal && selectedOp && (
        <Modal
          title="Set Recovery Delegate"
          onClose={() => setShowDelegateModal(false)}
        >
          <div className="space-y-4">
            <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-3">
              <p className="text-xs text-cyan-600 font-semibold">Operator</p>
              <p className="text-sm text-cyan-800 font-mono">
                <TruncatedHash value={selectedOp.address} />
              </p>
            </div>
            <Field label="Delegate Address (trusted wallet for recovery)">
              <input
                type="text"
                value={delegateForm.delegateAddress}
                onChange={(e) =>
                  setDelegateForm({
                    ...delegateForm,
                    delegateAddress: e.target.value,
                  })
                }
                className="input font-mono text-sm"
                placeholder="0x... (can recover your account if wallet is lost)"
              />
            </Field>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowDelegateModal(false)}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleSetDelegate}
                className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors text-sm"
                disabled={actionLoading}
              >
                {actionLoading ? "Setting..." : "Set Delegate"}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Metadata Modal */}
      {showMetadataModal && selectedOp && (
        <Modal
          title="Update Metadata URI"
          onClose={() => setShowMetadataModal(false)}
        >
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500">Operator</p>
              <p className="text-sm text-gray-900 font-mono">
                <TruncatedHash value={selectedOp.address} />
              </p>
            </div>
            <Field label="Metadata URI (IPFS CID or URL)">
              <input
                type="text"
                value={metadataForm.metadataURI}
                onChange={(e) =>
                  setMetadataForm({
                    ...metadataForm,
                    metadataURI: e.target.value,
                  })
                }
                className="input font-mono text-sm"
                placeholder="ipfs://Qm... or https://..."
              />
            </Field>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowMetadataModal(false)}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateMetadata}
                className="btn-primary flex-1"
                disabled={actionLoading}
              >
                {actionLoading ? "Updating..." : "Update"}
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
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <AppModal title={title} onClose={onClose}>
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
      <label className="block text-sm font-semibold text-gray-700 dark:text-slate-200 mb-1">
        {label}
      </label>
      {children}
    </div>
  );
}
