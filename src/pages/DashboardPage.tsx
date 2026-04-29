import { useEffect, useState } from 'react';
import { Building2, Users, FileText, ShieldCheck, Activity } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { blockchainService } from '../services/blockchainService';
import { authService } from '../services/authService';
import { TruncatedHash } from '../components/TruncatedHash';
import { Tenant, Operator, Document, BlockchainEvent } from '../types';

export function DashboardPage() {
  const { session } = useAuth();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [operators, setOperators] = useState<Operator[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [events, setEvents] = useState<BlockchainEvent[]>([]);

  useEffect(() => {
    const allTenants = blockchainService.getTenants();
    setTenants(allTenants);

    // Show all data regardless of auth - view is public
    setOperators(allTenants.flatMap((t) => blockchainService.getOperators(t.id)));
    setDocuments(allTenants.flatMap((t) => blockchainService.getDocuments(t.id)));
    setEvents(blockchainService.getEvents());
  }, [session]);

  const activeOperators = operators.filter((o) => o.isActive).length;
  const validDocuments = documents.filter((d) => d.isValid).length;
  const qualifiedDocs = documents.filter((d) => d.coSignQualified).length;
  const totalStake = operators.reduce((sum, o) => sum + o.stakeAmount, 0);
  const stats = blockchainService.getEventStatistics();

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
    operator_slashed: 'bg-red-100 text-red-800',
    operator_soft_slashed: 'bg-orange-100 text-orange-800',
    document_anchored: 'bg-indigo-100 text-indigo-800',
    document_cosigned: 'bg-cyan-100 text-cyan-800',
    document_qualified: 'bg-teal-100 text-teal-800',
    document_revoked: 'bg-red-100 text-red-800',
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">
          {session?.isConnected ? (
            <>
              Logged in as <span className="font-semibold text-gray-700">{authService.getRoleLabel(session?.role)}</span>
              {session?.tenantId && (
                <span className="text-gray-400"> — Tenant: {blockchainService.getTenant(session.tenantId)?.name}</span>
              )}
            </>
          ) : (
            'Overview of the VoucherProtocol system. Login to perform actions.'
          )}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard icon={<Building2 size={20} />} label="Tenants" value={tenants.length} color="blue" />
        <StatCard icon={<Users size={20} />} label="Active Operators" value={activeOperators} color="green" />
        <StatCard icon={<FileText size={20} />} label="Valid Documents" value={validDocuments} color="indigo" />
        <StatCard icon={<ShieldCheck size={20} />} label="Qualified Docs" value={qualifiedDocs} color="teal" />
        <StatCard icon={<Activity size={20} />} label="Total Stake" value={`${totalStake.toFixed(2)} ETH`} color="amber" />
      </div>

      {/* Two columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tenants overview */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="px-5 py-4 border-b bg-slate-50">
            <h2 className="font-bold text-gray-900">Tenants Overview</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-5 py-3 text-left font-semibold text-gray-600">Name</th>
                  <th className="px-5 py-3 text-left font-semibold text-gray-600">Admin</th>
                  <th className="px-5 py-3 text-left font-semibold text-gray-600">Op. Manager</th>
                  <th className="px-5 py-3 text-left font-semibold text-gray-600">Treasury</th>
                  <th className="px-5 py-3 text-left font-semibold text-gray-600">Status</th>
                </tr>
              </thead>
              <tbody>
                {tenants.map((t) => (
                  <tr key={t.id} className="border-b hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3 font-medium text-gray-900">{t.name}</td>
                    <td className="px-5 py-3 text-xs text-gray-600"><TruncatedHash value={t.admin} /></td>
                    <td className="px-5 py-3 text-xs text-gray-600"><TruncatedHash value={t.operatorManager} /></td>
                    <td className="px-5 py-3 text-xs text-gray-600"><TruncatedHash value={t.treasury} /></td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${t.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                        {t.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Event stats */}
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <h2 className="font-bold text-gray-900 mb-4">Event Statistics</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between pb-2 border-b">
              <span className="text-gray-500">Total Events</span>
              <span className="font-bold text-gray-900">{stats.totalEvents}</span>
            </div>
            <div className="flex justify-between pb-2 border-b">
              <span className="text-gray-500">Unique Actors</span>
              <span className="font-bold text-gray-900">{stats.uniqueActors}</span>
            </div>
            <div className="flex justify-between pb-2 border-b">
              <span className="text-gray-500">Total Gas Used</span>
              <span className="font-bold text-gray-900">{(stats.totalGasUsed / 1000).toFixed(0)}K</span>
            </div>
            <div className="pt-2">
              <h3 className="font-semibold text-gray-700 mb-2">By Type</h3>
              <div className="space-y-1.5">
                {Object.entries(stats.byType).map(([type, count]) => (
                  <div key={type} className="flex justify-between items-center">
                    <span className="text-gray-500 text-xs">{eventTypeLabel[type] || type}</span>
                    <span className="font-semibold text-gray-900 text-xs">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Events */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="px-5 py-4 border-b bg-slate-50 flex items-center justify-between">
          <h2 className="font-bold text-gray-900">Recent Events</h2>
          <span className="text-xs text-gray-500">{events.length} total</span>
        </div>
        <div className="max-h-80 overflow-y-auto divide-y">
          {[...events].reverse().slice(0, 15).map((event) => (
            <div key={event.id} className="px-5 py-3 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 font-medium">{event.description}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                    <TruncatedHash value={event.actor} />
                    <span>Block #{event.blockNumber}</span>
                    <span>{event.timestamp.toLocaleTimeString()}</span>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-semibold whitespace-nowrap ${eventTypeColor[event.type] || 'bg-gray-100 text-gray-700'}`}>
                  {eventTypeLabel[event.type] || event.type}
                </span>
              </div>
            </div>
          ))}
          {events.length === 0 && (
            <div className="px-5 py-8 text-center text-gray-400 text-sm">No events recorded</div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string | number; color: string }) {
  const colorMap: Record<string, string> = {
    blue: 'border-blue-400 bg-blue-50 text-blue-700',
    green: 'border-green-400 bg-green-50 text-green-700',
    indigo: 'border-indigo-400 bg-indigo-50 text-indigo-700',
    teal: 'border-teal-400 bg-teal-50 text-teal-700',
    amber: 'border-amber-400 bg-amber-50 text-amber-700',
  };
  return (
    <div className={`rounded-xl border-l-4 p-4 ${colorMap[color] || colorMap.blue}`}>
      <div className="flex items-center gap-2 mb-1 opacity-60">{icon}<span className="text-xs font-medium">{label}</span></div>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}
