import { useEffect, useState } from 'react';
import { Building2, Users, FileText, Activity, TrendingUp, AlertTriangle, Zap } from 'lucide-react';
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
  const [stats, setStats] = useState({ totalEvents: 0, byType: {} as Record<string, number>, uniqueActors: 0, totalGasUsed: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [session]);

  const loadData = async () => {
    setLoading(true);
    const allTenants = await blockchainService.getTenants();
    setTenants(allTenants);

    const allOps = await Promise.all(allTenants.map((t) => blockchainService.getOperators(t.id)));
    setOperators(allOps.flat());

    const allDocs = await Promise.all(allTenants.map((t) => blockchainService.getDocuments(t.id)));
    setDocuments(allDocs.flat());

    const allEvents = await blockchainService.getEvents();
    setEvents(allEvents);

    const eventStats = await blockchainService.getEventStatistics();
    setStats(eventStats);
    setLoading(false);
  };

  const activeOperators = operators.filter((o) => o.isActive).length;
  const inactiveOperators = operators.length - activeOperators;
  const validDocuments = documents.filter((d) => d.isValid).length;
  const revokedDocuments = documents.filter((d) => !d.isValid).length;
  const qualifiedDocs = documents.filter((d) => d.coSignQualified && d.isValid).length;
  const totalStake = operators.reduce((sum, o) => sum + o.stakeAmount, 0);
  const activeTenants = tenants.filter((t) => t.isActive).length;

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
    operator_recovery_delegate_updated: 'Delegate Updated',
    operator_metadata_updated: 'Metadata Updated',
  };

  const eventTypeColor: Record<string, string> = {
    tenant_created: 'bg-blue-100 text-blue-800',
    operator_joined: 'bg-green-100 text-green-800',
    operator_staked: 'bg-emerald-100 text-emerald-800',
    operator_slashed: 'bg-red-100 text-red-800',
    operator_soft_slashed: 'bg-orange-100 text-orange-800',
    document_anchored: 'bg-sky-100 text-sky-800',
    document_cosigned: 'bg-cyan-100 text-cyan-800',
    document_qualified: 'bg-teal-100 text-teal-800',
    document_revoked: 'bg-red-100 text-red-800',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">
            {session?.isConnected ? (
              <>
                Signed in as <span className="font-semibold text-gray-700">{authService.getRoleLabel(session?.role)}</span>
                {session?.tenantId && <span className="text-gray-400"> — {session.tenantId}</span>}
              </>
            ) : (
              'System overview. Connect wallet to perform actions.'
            )}
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Activity size={14} className="text-green-500" />
          <span>Live</span>
        </div>
      </div>

      {/* Primary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          icon={<Building2 size={20} />}
          label="Tenants"
          value={tenants.length}
          sub={`${activeTenants} active`}
          accent="blue"
        />
        <MetricCard
          icon={<Users size={20} />}
          label="Operators"
          value={activeOperators}
          sub={inactiveOperators > 0 ? `${inactiveOperators} inactive` : 'All active'}
          accent="emerald"
        />
        <MetricCard
          icon={<FileText size={20} />}
          label="Documents"
          value={validDocuments}
          sub={`${qualifiedDocs} qualified`}
          accent="sky"
        />
        <MetricCard
          icon={<TrendingUp size={20} />}
          label="Total Stake"
          value={`${totalStake.toFixed(1)}`}
          unit="ETH"
          sub={`${operators.length} stakers`}
          accent="amber"
        />
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* Left: Tenant cards */}
        <div className="lg:col-span-3 space-y-4">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Tenants</h2>
          {tenants.length === 0 ? (
            <div className="bg-white rounded-xl border p-8 text-center text-gray-400 text-sm">No tenants created yet.</div>
          ) : (
            <div className="space-y-3">
              {tenants.map((t) => {
                const tOps = operators.filter((o) => o.tenantId === t.id);
                const tDocs = documents.filter((d) => d.tenantId === t.id);
                const tStake = tOps.reduce((s, o) => s + o.stakeAmount, 0);
                const tActiveOps = tOps.filter((o) => o.isActive).length;
                const tValidDocs = tDocs.filter((d) => d.isValid).length;
                return (
                  <div key={t.id} className="bg-white rounded-xl border overflow-hidden hover:shadow-md transition-shadow">
                    <div className="p-5">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-sm">
                            {t.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <h3 className="font-bold text-gray-900">{t.name}</h3>
                            <p className="text-xs text-gray-500">ID: {t.id}</p>
                          </div>
                        </div>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${t.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                          {t.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>

                      {/* Mini stats grid */}
                      <div className="grid grid-cols-3 gap-3">
                        <div className="bg-gray-50 rounded-lg p-3 text-center">
                          <p className="text-lg font-bold text-gray-900">{tActiveOps}</p>
                          <p className="text-[10px] text-gray-500 uppercase tracking-wide font-medium">Operators</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3 text-center">
                          <p className="text-lg font-bold text-gray-900">{tValidDocs}</p>
                          <p className="text-[10px] text-gray-500 uppercase tracking-wide font-medium">Documents</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3 text-center">
                          <p className="text-lg font-bold text-gray-900">{tStake.toFixed(1)}</p>
                          <p className="text-[10px] text-gray-500 uppercase tracking-wide font-medium">ETH Staked</p>
                        </div>
                      </div>

                      {/* Role addresses */}
                      <div className="mt-4 pt-3 border-t flex items-center gap-4 text-[11px] text-gray-500">
                        <span>Admin: <TruncatedHash value={t.admin} /></span>
                        <span>Treasury: <TruncatedHash value={t.treasury} /></span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Activity + Alerts */}
        <div className="lg:col-span-2 space-y-4">
          {/* Alerts */}
          {(revokedDocuments > 0 || inactiveOperators > 0) && (
            <div className="space-y-2">
              <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Alerts</h2>
              <div className="space-y-2">
                {revokedDocuments > 0 && (
                  <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl p-3.5">
                    <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <AlertTriangle size={16} className="text-red-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-red-800">{revokedDocuments} Revoked Document{revokedDocuments > 1 ? 's' : ''}</p>
                      <p className="text-xs text-red-600">Requires attention</p>
                    </div>
                  </div>
                )}
                {inactiveOperators > 0 && (
                  <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl p-3.5">
                    <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Zap size={16} className="text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-amber-800">{inactiveOperators} Inactive Operator{inactiveOperators > 1 ? 's' : ''}</p>
                      <p className="text-xs text-amber-600">Not currently signing</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Protocol Metrics */}
          <div>
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Protocol Metrics</h2>
            <div className="bg-white rounded-xl border mt-2 divide-y">
              <MetricRow label="Total Events" value={stats.totalEvents.toLocaleString()} />
              <MetricRow label="Unique Actors" value={stats.uniqueActors} />
              <MetricRow label="Gas Consumed" value={`${(stats.totalGasUsed / 1000).toFixed(0)}K`} />
              <MetricRow label="Co-Sign Qualified" value={qualifiedDocs} />
              <MetricRow label="Revoked Docs" value={revokedDocuments} />
            </div>
          </div>

          {/* Event Breakdown - only top types */}
          {Object.keys(stats.byType).length > 0 && (
            <div>
              <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Event Breakdown</h2>
              <div className="bg-white rounded-xl border mt-2 p-4 space-y-2.5">
                {Object.entries(stats.byType)
                  .sort(([, a], [, b]) => (b as number) - (a as number))
                  .slice(0, 6)
                  .map(([type, count]) => {
                    const total = stats.totalEvents || 1;
                    const pct = Math.round(((count as number) / total) * 100);
                    return (
                      <div key={type}>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-gray-600">{eventTypeLabel[type] || type}</span>
                          <span className="font-semibold text-gray-900">{count as number}</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gray-700 rounded-full transition-all"
                            style={{ width: `${Math.max(pct, 2)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Recent Activity</h2>
          <span className="text-xs text-gray-400">{events.length} events</span>
        </div>
        <div className="bg-white rounded-xl border overflow-hidden">
          <div className="max-h-72 overflow-y-auto divide-y">
            {events.slice(0, 15).map((event) => (
              <div key={event.id} className="px-5 py-3 hover:bg-gray-50/50 transition-colors">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-2 h-2 rounded-full bg-blue-400 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-gray-900 truncate">{event.description}</p>
                      <div className="flex items-center gap-2 mt-0.5 text-[11px] text-gray-400">
                        <TruncatedHash value={event.actor} />
                        <span>Block #{event.blockNumber}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold whitespace-nowrap ${eventTypeColor[event.type] || 'bg-gray-100 text-gray-700'}`}>
                      {eventTypeLabel[event.type] || event.type}
                    </span>
                    <span className="text-[11px] text-gray-400 whitespace-nowrap">
                      {event.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            {events.length === 0 && (
              <div className="px-5 py-8 text-center text-gray-400 text-sm">No events recorded</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ icon, label, value, unit, sub, accent }: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  unit?: string;
  sub?: string;
  accent: string;
}) {
  const accentMap: Record<string, { border: string; icon: string; text: string }> = {
    blue: { border: 'border-l-blue-500', icon: 'text-blue-600 bg-blue-50', text: 'text-blue-700' },
    emerald: { border: 'border-l-emerald-500', icon: 'text-emerald-600 bg-emerald-50', text: 'text-emerald-700' },
    sky: { border: 'border-l-sky-500', icon: 'text-sky-600 bg-sky-50', text: 'text-sky-700' },
    amber: { border: 'border-l-amber-500', icon: 'text-amber-600 bg-amber-50', text: 'text-amber-700' },
  };
  const a = accentMap[accent] || accentMap.blue;
  return (
    <div className={`bg-white rounded-xl border border-l-4 ${a.border} p-5`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</span>
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${a.icon}`}>
          {icon}
        </div>
      </div>
      <div className="flex items-baseline gap-1">
        <p className="text-2xl font-bold text-gray-900 tracking-tight">{value}</p>
        {unit && <span className="text-sm font-medium text-gray-500">{unit}</span>}
      </div>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
  );
}

function MetricRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <span className="text-sm text-gray-600">{label}</span>
      <span className="text-sm font-bold text-gray-900">{value}</span>
    </div>
  );
}
