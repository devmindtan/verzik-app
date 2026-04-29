import { useState } from 'react';
import { Search, ExternalLink } from 'lucide-react';
import { blockchainService } from '../services/blockchainService';
import { TruncatedHash } from '../components/TruncatedHash';
import { BlockchainEvent } from '../types';

export function TransactionHistoryPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterTenant, setFilterTenant] = useState('');
  const [showDetail, setShowDetail] = useState<BlockchainEvent | null>(null);

  const allEvents = blockchainService.getEvents();
  const tenants = blockchainService.getTenants();

  // Apply filters
  let filteredEvents = [...allEvents];
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    filteredEvents = filteredEvents.filter(
      (e) =>
        e.txHash.toLowerCase().includes(q) ||
        e.actor.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q)
    );
  }
  if (filterType) {
    filteredEvents = filteredEvents.filter((e) => e.type === filterType);
  }
  if (filterTenant) {
    filteredEvents = filteredEvents.filter((e) => e.tenantId === filterTenant);
  }

  // Sort newest first
  filteredEvents.sort((a, b) => b.blockNumber - a.blockNumber);

  const eventTypes = [...new Set(allEvents.map((e) => e.type))];

  const eventTypeLabel: Record<string, string> = {
    tenant_created: 'Tenant Created',
    operator_joined: 'Operator Joined',
    operator_staked: 'Stake Topped Up',
    operator_unstake_requested: 'Unstake Requested',
    operator_unstaked: 'Unstaked',
    operator_status_changed: 'Status Changed',
    operator_slashed: 'Slashed',
    operator_soft_slashed: 'Soft Slashed',
    operator_recovered: 'Recovered',
    document_anchored: 'Document Anchored',
    document_cosigned: 'Co-Signed',
    document_revoked: 'Revoked',
    document_qualified: 'Qualified',
    policy_updated: 'Policy Updated',
    treasury_updated: 'Treasury Updated',
    config_updated: 'Config Updated',
    role_granted: 'Role Granted',
  };

  const eventTypeColor: Record<string, string> = {
    tenant_created: 'bg-blue-100 text-blue-800',
    operator_joined: 'bg-green-100 text-green-800',
    operator_staked: 'bg-emerald-100 text-emerald-800',
    operator_unstake_requested: 'bg-yellow-100 text-yellow-800',
    operator_unstaked: 'bg-gray-100 text-gray-800',
    operator_status_changed: 'bg-gray-100 text-gray-700',
    operator_slashed: 'bg-red-100 text-red-800',
    operator_soft_slashed: 'bg-orange-100 text-orange-800',
    operator_recovered: 'bg-cyan-100 text-cyan-800',
    document_anchored: 'bg-indigo-100 text-indigo-800',
    document_cosigned: 'bg-teal-100 text-teal-800',
    document_revoked: 'bg-red-100 text-red-800',
    document_qualified: 'bg-teal-100 text-teal-800',
    policy_updated: 'bg-purple-100 text-purple-800',
    treasury_updated: 'bg-amber-100 text-amber-800',
    config_updated: 'bg-slate-100 text-slate-800',
    role_granted: 'bg-blue-100 text-blue-800',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Transaction History</h1>
        <p className="text-gray-500 mt-1">Search and browse all blockchain transactions. Available to everyone.</p>
      </div>

      {/* Search & Filters */}
      <div className="bg-white rounded-xl shadow-sm border p-5">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="md:col-span-2 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by tx hash, address, or description..."
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>
          <div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value="">All Types</option>
              {eventTypes.map((t) => (
                <option key={t} value={t}>{eventTypeLabel[t] || t}</option>
              ))}
            </select>
          </div>
          <div>
            <select
              value={filterTenant}
              onChange={(e) => setFilterTenant(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value="">All Tenants</option>
              {tenants.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
          <span>{filteredEvents.length} transactions found</span>
          <button
            onClick={() => { setSearchQuery(''); setFilterType(''); setFilterTenant(''); }}
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            Clear filters
          </button>
        </div>
      </div>

      {/* Transaction List */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-5 py-3 text-left font-semibold text-gray-600">Tx Hash</th>
                <th className="px-5 py-3 text-left font-semibold text-gray-600">Block</th>
                <th className="px-5 py-3 text-left font-semibold text-gray-600">Type</th>
                <th className="px-5 py-3 text-left font-semibold text-gray-600">Description</th>
                <th className="px-5 py-3 text-left font-semibold text-gray-600">Actor</th>
                <th className="px-5 py-3 text-left font-semibold text-gray-600">Time</th>
                <th className="px-5 py-3 text-center font-semibold text-gray-600">Detail</th>
              </tr>
            </thead>
            <tbody>
              {filteredEvents.slice(0, 50).map((event) => (
                <tr key={event.id} className="border-b hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3 text-xs text-blue-600 hover:text-blue-800 cursor-pointer" onClick={() => setShowDetail(event)}>
                    <TruncatedHash value={event.txHash} />
                  </td>
                  <td className="px-5 py-3 text-xs text-gray-600">#{event.blockNumber}</td>
                  <td className="px-5 py-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold whitespace-nowrap ${eventTypeColor[event.type] || 'bg-gray-100 text-gray-700'}`}>
                      {eventTypeLabel[event.type] || event.type}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-gray-700 max-w-xs truncate">{event.description}</td>
                  <td className="px-5 py-3 text-xs text-gray-600"><TruncatedHash value={event.actor} /></td>
                  <td className="px-5 py-3 text-xs text-gray-500 whitespace-nowrap">{event.timestamp.toLocaleTimeString()}</td>
                  <td className="px-5 py-3 text-center">
                    <button onClick={() => setShowDetail(event)} className="p-1 text-gray-400 hover:text-blue-600 transition-colors">
                      <ExternalLink size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredEvents.length === 0 && (
            <div className="px-5 py-8 text-center text-gray-400 text-sm">No transactions found.</div>
          )}
          {filteredEvents.length > 50 && (
            <div className="px-5 py-3 text-center text-xs text-gray-500 border-t">Showing first 50 of {filteredEvents.length} transactions</div>
          )}
        </div>
      </div>

      {/* Detail Drawer */}
      {showDetail && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setShowDetail(null)}>
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b flex items-center justify-between flex-shrink-0">
              <h2 className="text-lg font-bold text-gray-900">Transaction Detail</h2>
              <button onClick={() => setShowDetail(null)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto">
              <DetailRow label="Transaction Hash" value={showDetail.txHash} mono copyable />
              <DetailRow label="Block Number" value={`#${showDetail.blockNumber}`} />
              <DetailRow label="Type" value={eventTypeLabel[showDetail.type] || showDetail.type} />
              <DetailRow label="Actor" value={showDetail.actor} mono copyable />
              <DetailRow label="Description" value={showDetail.description} />
              <DetailRow label="Timestamp" value={showDetail.timestamp.toLocaleString()} />
              <DetailRow label="Gas Used" value={`${showDetail.gasUsed.toLocaleString()} gas`} />
              {showDetail.tenantId && (
                <DetailRow label="Tenant" value={`${blockchainService.getTenant(showDetail.tenantId)?.name || showDetail.tenantId} (${showDetail.tenantId})`} />
              )}
              {Object.keys(showDetail.data).length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Additional Data</p>
                  <div className="bg-gray-50 rounded-lg p-3 font-mono text-xs text-gray-700 space-y-1">
                    {Object.entries(showDetail.data).map(([key, val]) => (
                      <div key={key} className="flex gap-2">
                        <span className="text-gray-500">{key}:</span>
                        <span className="text-gray-900 break-all">{String(val)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailRow({ label, value, mono, copyable }: { label: string; value: string; mono?: boolean; copyable?: boolean }) {
  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      {copyable ? (
        <p className="text-sm text-gray-900"><TruncatedHash value={value} /></p>
      ) : (
        <p className={`text-sm text-gray-900 break-all ${mono ? 'font-mono' : ''}`}>{value}</p>
      )}
    </div>
  );
}
