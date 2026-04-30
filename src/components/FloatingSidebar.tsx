import { X, Bell, Clock, Star, GitBranch, MessageSquare, Plug, TestTube, BookOpen, Shield, Scale } from 'lucide-react';

interface FloatingSidebarProps {
  open: boolean;
  onClose: () => void;
  onNavigate: (page: string) => void;
}

export function FloatingSidebar({ open, onClose, onNavigate }: FloatingSidebarProps) {
  if (!open) return null;

  const tools = [
    { icon: <BookOpen size={16} />, label: 'Documentation', desc: 'System guide & API reference', action: () => { onClose(); onNavigate('documentation'); }, active: true },
    { icon: <Shield size={16} />, label: 'Co-Sign Policies', desc: 'Multi-signature requirements', action: () => { onClose(); onNavigate('cosign-policies'); }, active: true },
    { icon: <Scale size={16} />, label: 'Violation Penalties', desc: 'Penalty configuration per violation', action: () => { onClose(); onNavigate('violation-penalties'); }, active: true },
    { icon: <Bell size={16} />, label: 'Notifications', desc: 'Real-time alerts for events', status: 'Planned' },
    { icon: <Clock size={16} />, label: 'Activity Feed', desc: 'Live stream of protocol events', status: 'Planned' },
    { icon: <Star size={16} />, label: 'Watchlist', desc: 'Track specific operators & docs', status: 'Planned' },
    { icon: <GitBranch size={16} />, label: 'Version History', desc: 'Document revision tracking', status: 'Planned' },
    { icon: <MessageSquare size={16} />, label: 'Governance', desc: 'Proposal & voting system', status: 'Planned' },
    { icon: <Plug size={16} />, label: 'Integrations', desc: 'External service connectors', status: 'Planned' },
    { icon: <TestTube size={16} />, label: 'Test Suite', desc: 'Automated protocol testing', status: 'Planned' },
  ];

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />
      <div className="fixed right-4 top-16 bottom-4 w-80 bg-white rounded-2xl shadow-2xl border z-50 flex flex-col overflow-hidden">
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-5 py-4 text-white">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-sm">Quick Panel</h2>
            <button onClick={onClose} className="text-white/60 hover:text-white transition-colors">
              <X size={18} />
            </button>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Tools & upcoming features</p>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
          {tools.map((item) => (
            <div
              key={item.label}
              onClick={item.action ? item.action : undefined}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors group ${
                item.action ? 'hover:bg-blue-50 cursor-pointer' : 'cursor-default'
              }`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                item.action
                  ? 'bg-blue-100 text-blue-600'
                  : 'bg-gray-100 group-hover:bg-blue-50 text-gray-400 group-hover:text-blue-600'
              }`}>
                {item.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${item.action ? 'text-blue-700' : 'text-gray-900'}`}>{item.label}</p>
                <p className="text-[11px] text-gray-500 truncate">{item.desc}</p>
              </div>
              {item.action ? (
                <span className="text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded font-medium flex-shrink-0">Open</span>
              ) : (
                <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-medium flex-shrink-0">{item.status}</span>
              )}
            </div>
          ))}
        </div>

        <div className="border-t px-5 py-3 bg-gray-50">
          <p className="text-[11px] text-gray-400 text-center">More features coming soon</p>
        </div>
      </div>
    </>
  );
}
