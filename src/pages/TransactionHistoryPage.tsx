import { useState, useEffect } from "react";
import { ExternalLink } from "lucide-react";
import { AppModal } from "../components/AppModal";
import { HighlightText } from "../components/HighlightText";
import { SearchInput } from "../components/SearchInput";
import { TablePagination } from "../components/TablePagination";
import { AppSelect } from "../components/AppSelect";
import { blockchainService } from "../services/blockchainService";
import { TruncatedHash } from "../components/TruncatedHash";
import { includesNormalized } from "../lib/searchUtils";
import { BlockchainEvent } from "../types";

interface TransactionHistoryPageProps {
  initialActorFilter?: string;
}

export function TransactionHistoryPage({
  initialActorFilter = "",
}: TransactionHistoryPageProps) {
  const PAGE_SIZE = 12;
  const [searchQuery, setSearchQuery] = useState(initialActorFilter);
  const [filterType, setFilterType] = useState("");
  const [filterTenant, setFilterTenant] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showDetail, setShowDetail] = useState<BlockchainEvent | null>(null);
  const [allEvents, setAllEvents] = useState<BlockchainEvent[]>([]);
  const [tenants, setTenants] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [events, tenantList] = await Promise.all([
      blockchainService.getEvents(),
      blockchainService.getTenants(),
    ]);
    setAllEvents(events);
    setTenants(tenantList.map((t) => ({ id: t.id, name: t.name })));
    setLoading(false);
  };

  const eventTypeLabel: Record<string, string> = {
    tenant_created: "Tenant Created",
    operator_joined: "Operator Joined",
    operator_staked: "Stake Topped Up",
    operator_unstake_requested: "Unstake Requested",
    operator_unstaked: "Unstaked",
    operator_status_changed: "Status Changed",
    operator_slashed: "Slashed",
    operator_soft_slashed: "Soft Slashed",
    operator_recovered: "Recovered",
    document_anchored: "Document Anchored",
    document_cosigned: "Co-Signed",
    document_revoked: "Revoked",
    document_qualified: "Qualified",
    policy_updated: "Policy Updated",
    treasury_updated: "Treasury Updated",
    config_updated: "Config Updated",
    role_granted: "Role Granted",
  };

  const eventTypeColor: Record<string, string> = {
    tenant_created: "bg-blue-100 text-blue-800",
    operator_joined: "bg-green-100 text-green-800",
    operator_staked: "bg-emerald-100 text-emerald-800",
    operator_unstake_requested: "bg-yellow-100 text-yellow-800",
    operator_unstaked: "bg-gray-100 text-gray-800",
    operator_status_changed: "bg-gray-100 text-gray-700",
    operator_slashed: "bg-red-100 text-red-800",
    operator_soft_slashed: "bg-orange-100 text-orange-800",
    operator_recovered: "bg-cyan-100 text-cyan-800",
    document_anchored: "bg-indigo-100 text-indigo-800",
    document_cosigned: "bg-teal-100 text-teal-800",
    document_revoked: "bg-red-100 text-red-800",
    document_qualified: "bg-teal-100 text-teal-800",
    policy_updated: "bg-purple-100 text-purple-800",
    treasury_updated: "bg-amber-100 text-amber-800",
    config_updated: "bg-slate-100 text-slate-800",
    role_granted: "bg-blue-100 text-blue-800",
  };

  const eventTypes = [...new Set(allEvents.map((e) => e.type))];

  let filteredEvents = [...allEvents];
  if (searchQuery) {
    filteredEvents = filteredEvents.filter((event) => {
      const tenantName = event.tenantId
        ? tenants.find((tenant) => tenant.id === event.tenantId)?.name ||
          event.tenantId
        : "";
      const typeLabel = eventTypeLabel[event.type] || event.type;

      return includesNormalized(
        `${event.txHash} ${event.actor} ${event.description} ${typeLabel} ${tenantName}`,
        searchQuery,
      );
    });
  }
  if (filterType) {
    filteredEvents = filteredEvents.filter((e) => e.type === filterType);
  }
  if (filterTenant) {
    filteredEvents = filteredEvents.filter((e) => e.tenantId === filterTenant);
  }

  // Sort newest first
  filteredEvents.sort((a, b) => b.blockNumber - a.blockNumber);
  const totalPages = Math.max(1, Math.ceil(filteredEvents.length / PAGE_SIZE));
  const paginatedEvents = filteredEvents.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterType, filterTenant]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Transaction History
        </h1>
        <p className="text-gray-500 mt-1">
          Search and browse all blockchain transactions. Available to everyone.
        </p>
      </div>

      {/* Search & Filters */}
      <div className="bg-white rounded-xl shadow-sm border p-5">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="md:col-span-2">
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search by tx hash, address, type, tenant, or description..."
            />
          </div>
          <div>
            <AppSelect
              value={filterType}
              onChange={setFilterType}
              data={[
                { value: "", label: "All Types" },
                ...eventTypes.map((type) => ({
                  value: type,
                  label: eventTypeLabel[type] || type,
                })),
              ]}
            />
          </div>
          <div>
            <AppSelect
              value={filterTenant}
              onChange={setFilterTenant}
              data={[
                { value: "", label: "All Tenants" },
                ...tenants.map((tenant) => ({
                  value: tenant.id,
                  label: tenant.name,
                })),
              ]}
            />
          </div>
        </div>
        <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
          <span>{filteredEvents.length} transactions found</span>
          <button
            onClick={() => {
              setSearchQuery("");
              setFilterType("");
              setFilterTenant("");
            }}
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            Clear filters
          </button>
        </div>
      </div>

      {/* Transaction List */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {loading ? (
          <div className="px-5 py-8 text-center text-gray-400 text-sm">
            Loading transactions...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-5 py-3 text-left font-semibold text-gray-600">
                    Tx Hash
                  </th>
                  <th className="px-5 py-3 text-left font-semibold text-gray-600">
                    Block
                  </th>
                  <th className="px-5 py-3 text-left font-semibold text-gray-600">
                    Type
                  </th>
                  <th className="px-5 py-3 text-left font-semibold text-gray-600">
                    Description
                  </th>
                  <th className="px-5 py-3 text-left font-semibold text-gray-600">
                    Actor
                  </th>
                  <th className="px-5 py-3 text-left font-semibold text-gray-600">
                    Time
                  </th>
                  <th className="px-5 py-3 text-center font-semibold text-gray-600">
                    Detail
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedEvents.map((event) => (
                  <tr
                    key={event.id}
                    className="border-b hover:bg-gray-50 transition-colors"
                  >
                    <td
                      className="px-5 py-3 text-xs text-blue-600 hover:text-blue-800 cursor-pointer"
                      onClick={() => setShowDetail(event)}
                    >
                      <span className="block max-w-[180px] truncate font-mono">
                        <HighlightText
                          text={event.txHash}
                          query={searchQuery}
                        />
                      </span>
                    </td>
                    <td className="px-5 py-3 text-xs text-gray-600">
                      #{event.blockNumber}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold whitespace-nowrap ${eventTypeColor[event.type] || "bg-gray-100 text-gray-700"}`}
                      >
                        <HighlightText
                          text={eventTypeLabel[event.type] || event.type}
                          query={searchQuery}
                        />
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-700 max-w-xs truncate">
                      <HighlightText
                        text={event.description}
                        query={searchQuery}
                      />
                    </td>
                    <td className="px-5 py-3 text-xs text-gray-600">
                      <span className="block max-w-[160px] truncate font-mono">
                        <HighlightText text={event.actor} query={searchQuery} />
                      </span>
                    </td>
                    <td className="px-5 py-3 text-xs text-gray-500 whitespace-nowrap">
                      {event.timestamp.toLocaleTimeString()}
                    </td>
                    <td className="px-5 py-3 text-center">
                      <button
                        onClick={() => setShowDetail(event)}
                        className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                      >
                        <ExternalLink size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredEvents.length === 0 && (
              <div className="px-5 py-8 text-center text-gray-400 text-sm">
                No transactions found.
              </div>
            )}
          </div>
        )}
        {!loading && filteredEvents.length > 0 && (
          <TablePagination
            totalItems={filteredEvents.length}
            pageSize={PAGE_SIZE}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            itemLabel="transactions"
          />
        )}
      </div>

      {/* Detail Drawer */}
      {showDetail && (
        <AppModal
          title="Transaction Detail"
          onClose={() => setShowDetail(null)}
          width="lg"
        >
          <div className="space-y-4">
            <DetailRow
              label="Transaction Hash"
              value={showDetail.txHash}
              mono
              copyable
            />
            <DetailRow
              label="Block Number"
              value={`#${showDetail.blockNumber}`}
            />
            <DetailRow
              label="Type"
              value={eventTypeLabel[showDetail.type] || showDetail.type}
            />
            <DetailRow label="Actor" value={showDetail.actor} mono copyable />
            <DetailRow label="Description" value={showDetail.description} />
            <DetailRow
              label="Timestamp"
              value={showDetail.timestamp.toLocaleString()}
            />
            <DetailRow
              label="Gas Used"
              value={`${showDetail.gasUsed.toLocaleString()} gas`}
            />
            {showDetail.tenantId && (
              <DetailRow
                label="Tenant"
                value={`${tenants.find((tenant) => tenant.id === showDetail.tenantId)?.name || showDetail.tenantId} (${showDetail.tenantId})`}
              />
            )}
            {Object.keys(showDetail.data).length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Additional Data
                </p>
                <div className="bg-gray-50 rounded-lg p-3 font-mono text-xs text-gray-700 space-y-1">
                  {Object.entries(showDetail.data).map(([key, val]) => (
                    <div key={key} className="flex gap-2">
                      <span className="text-gray-500">{key}:</span>
                      <span className="text-gray-900 break-all">
                        {String(val)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </AppModal>
      )}
    </div>
  );
}

function DetailRow({
  label,
  value,
  mono,
  copyable,
}: {
  label: string;
  value: string;
  mono?: boolean;
  copyable?: boolean;
}) {
  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      {copyable ? (
        <p className="text-sm text-gray-900">
          <TruncatedHash value={value} />
        </p>
      ) : (
        <p
          className={`text-sm text-gray-900 break-all ${mono ? "font-mono" : ""}`}
        >
          {value}
        </p>
      )}
    </div>
  );
}
