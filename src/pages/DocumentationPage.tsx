import { useState } from 'react';
import { BookOpen, Shield, Users, FileText, Settings, Search, ChevronRight } from 'lucide-react';

export function DocumentationPage() {
  const [activeSection, setActiveSection] = useState('overview');

  const sections = [
    { id: 'overview', label: 'Overview', icon: <BookOpen size={16} /> },
    { id: 'roles', label: 'Role System', icon: <Shield size={16} /> },
    { id: 'operators', label: 'Operator Lifecycle', icon: <Users size={16} /> },
    { id: 'documents', label: 'Document Signing', icon: <FileText size={16} /> },
    { id: 'verify', label: 'Verification', icon: <Search size={16} /> },
    { id: 'config', label: 'Configuration', icon: <Settings size={16} /> },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Documentation</h1>
        <p className="text-gray-500 mt-1">Complete guide to the VoucherProtocol system</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar nav */}
        <div className="lg:col-span-1">
          <nav className="bg-white rounded-xl shadow-sm border p-2 sticky top-20">
            {sections.map((s) => (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                  activeSection === s.id
                    ? 'bg-blue-50 text-blue-700 font-semibold'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {s.icon}
                {s.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-xl shadow-sm border p-6 space-y-8">
            {activeSection === 'overview' && <OverviewSection />}
            {activeSection === 'roles' && <RolesSection />}
            {activeSection === 'operators' && <OperatorsSection />}
            {activeSection === 'documents' && <DocumentsSection />}
            {activeSection === 'verify' && <VerifySection />}
            {activeSection === 'config' && <ConfigSection />}
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-2xl font-bold text-gray-900 border-b pb-3">{children}</h2>;
}

function SubTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-lg font-bold text-gray-900 mt-6 mb-2">{children}</h3>;
}

function Para({ children }: { children: React.ReactNode }) {
  return <p className="text-gray-600 text-sm leading-relaxed">{children}</p>;
}

function InfoBox({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
      <p className="text-sm font-semibold text-blue-900 mb-1">{title}</p>
      <div className="text-sm text-blue-800">{children}</div>
    </div>
  );
}

function OverviewSection() {
  return (
    <div className="space-y-4">
      <SectionTitle>Overview</SectionTitle>
      <Para>VoucherProtocol is a blockchain-based document signing and operator governance system. It enables organizations (tenants) to anchor documents on-chain with cryptographic proof of authenticity, verified by staked operators through a multi-signature process.</Para>
      <SubTitle>Key Concepts</SubTitle>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {[
          { title: 'Protocol', desc: 'The top-level system managed by a Protocol Admin who creates tenants.' },
          { title: 'Tenant', desc: 'An independent organization with its own operators, documents, and policies.' },
          { title: 'Operator', desc: 'A staked entity that can register and co-sign documents on-chain.' },
          { title: 'Document', desc: 'A file anchored on-chain with hash, metadata, and multi-signature verification.' },
        ].map((item) => (
          <div key={item.title} className="bg-gray-50 rounded-lg p-4">
            <p className="font-bold text-gray-900 text-sm">{item.title}</p>
            <p className="text-gray-600 text-xs mt-1">{item.desc}</p>
          </div>
        ))}
      </div>
      <InfoBox title="Demo Mode">This system runs with mock data in memory. All operations simulate blockchain behavior without actual on-chain transactions. Data resets on page refresh.</InfoBox>
    </div>
  );
}

function RolesSection() {
  return (
    <div className="space-y-4">
      <SectionTitle>Role System</SectionTitle>
      <Para>Each tenant has three completely separate roles. No role can perform the functions of another. This separation ensures security and clear responsibility.</Para>
      <div className="space-y-4 mt-4">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
          <h3 className="font-bold text-blue-900 text-lg mb-2">Tenant Admin</h3>
          <ul className="text-sm text-blue-800 space-y-1.5">
            <li className="flex items-start gap-2"><ChevronRight size={14} className="mt-0.5 flex-shrink-0" /> Manage tenant configuration (min stake, cooldown)</li>
            <li className="flex items-start gap-2"><ChevronRight size={14} className="mt-0.5 flex-shrink-0" /> Set treasury address (where slashed funds go)</li>
            <li className="flex items-start gap-2"><ChevronRight size={14} className="mt-0.5 flex-shrink-0" /> Set operator manager address</li>
            <li className="flex items-start gap-2"><ChevronRight size={14} className="mt-0.5 flex-shrink-0" /> Revoke documents</li>
            <li className="flex items-start gap-2"><ChevronRight size={14} className="mt-0.5 flex-shrink-0" /> Recover operator accounts</li>
          </ul>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5">
          <h3 className="font-bold text-emerald-900 text-lg mb-2">Operator Manager</h3>
          <ul className="text-sm text-emerald-800 space-y-1.5">
            <li className="flex items-start gap-2"><ChevronRight size={14} className="mt-0.5 flex-shrink-0" /> Manage operator lifecycle (activate/deactivate)</li>
            <li className="flex items-start gap-2"><ChevronRight size={14} className="mt-0.5 flex-shrink-0" /> Slash operators (full seizure of stake)</li>
            <li className="flex items-start gap-2"><ChevronRight size={14} className="mt-0.5 flex-shrink-0" /> Soft-slash operators (partial penalty)</li>
            <li className="flex items-start gap-2"><ChevronRight size={14} className="mt-0.5 flex-shrink-0" /> Set co-sign policies per document type</li>
            <li className="flex items-start gap-2"><ChevronRight size={14} className="mt-0.5 flex-shrink-0" /> Configure violation penalties</li>
          </ul>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
          <h3 className="font-bold text-amber-900 text-lg mb-2">Treasury (Special Role)</h3>
          <ul className="text-sm text-amber-800 space-y-1.5">
            <li className="flex items-start gap-2"><ChevronRight size={14} className="mt-0.5 flex-shrink-0" /> <strong>Only</strong> receives slashed funds from penalized operators</li>
            <li className="flex items-start gap-2"><ChevronRight size={14} className="mt-0.5 flex-shrink-0" /> No management power whatsoever</li>
            <li className="flex items-start gap-2"><ChevronRight size={14} className="mt-0.5 flex-shrink-0" /> Cannot manage operators, documents, or policies</li>
            <li className="flex items-start gap-2"><ChevronRight size={14} className="mt-0.5 flex-shrink-0" /> View-only access to tenant events</li>
          </ul>
        </div>
      </div>
      <InfoBox title="Role Separation">The Treasury role is intentionally powerless. It exists solely as a destination for slashed funds, preventing any conflict of interest between financial collection and operational management.</InfoBox>
    </div>
  );
}

function OperatorsSection() {
  return (
    <div className="space-y-4">
      <SectionTitle>Operator Lifecycle</SectionTitle>
      <Para>Operators are the backbone of the document signing system. They must stake ETH to participate, and their stake can be slashed for violations.</Para>
      <div className="space-y-3 mt-4">
        {[
          { step: '1. Join', desc: 'Deposit minimum stake to become an active operator. The stake acts as a bond ensuring honest behavior.' },
          { step: '2. Operate', desc: 'Register documents on-chain and co-sign documents from other operators. Earn trust through consistent participation.' },
          { step: '3. Top-Up', desc: 'Add more stake to increase commitment or meet raised minimum requirements.' },
          { step: '4. Request Unstake', desc: 'Initiate the exit process. A cooldown period begins (configured per tenant) to allow pending transactions to settle.' },
          { step: '5. Execute Unstake', desc: 'After cooldown expires, withdraw full stake and leave the system.' },
        ].map((item) => (
          <div key={item.step} className="bg-gray-50 rounded-lg p-4">
            <p className="font-bold text-gray-900 text-sm">{item.step}</p>
            <p className="text-gray-600 text-xs mt-1">{item.desc}</p>
          </div>
        ))}
      </div>
      <SubTitle>Slashing</SubTitle>
      <Para>Operators who violate protocol rules face financial penalties:</Para>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="font-bold text-red-900 text-sm">Full Slash</p>
          <p className="text-red-700 text-xs mt-1">100% of stake seized. Operator deactivated immediately. All funds transferred to tenant treasury.</p>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <p className="font-bold text-orange-900 text-sm">Soft Slash</p>
          <p className="text-orange-700 text-xs mt-1">Partial penalty (e.g., 10% of stake). If remaining stake falls below minimum, operator is auto-deactivated.</p>
        </div>
      </div>
    </div>
  );
}

function DocumentsSection() {
  return (
    <div className="space-y-4">
      <SectionTitle>Document Signing</SectionTitle>
      <Para>Documents are anchored on-chain with their cryptographic hash, creating an immutable record of existence and authenticity.</Para>
      <SubTitle>Document Types</SubTitle>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {['Voucher', 'Contract', 'Certificate', 'Receipt'].map((t) => (
          <div key={t} className="bg-gray-50 rounded-lg p-3 text-center">
            <p className="font-semibold text-gray-900 text-sm">{t}</p>
          </div>
        ))}
      </div>
      <SubTitle>Co-Signing Process</SubTitle>
      <div className="space-y-2 mt-3">
        {[
          'Operator registers document with file hash and metadata.',
          'Document starts with 1 signer (the issuer) and "Pending" status.',
          'Other operators add their signatures (co-sign).',
          'When minimum signers threshold is met, document becomes "Qualified".',
          'Qualified documents are considered fully verified by the protocol.',
        ].map((step, i) => (
          <div key={i} className="flex items-start gap-3 bg-gray-50 rounded-lg p-3">
            <span className="w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">{i + 1}</span>
            <p className="text-sm text-gray-700">{step}</p>
          </div>
        ))}
      </div>
      <SubTitle>Revocation</SubTitle>
      <Para>Tenant Admins can revoke documents that are no longer valid. Revoked documents remain on-chain as historical records but are marked as invalid. Future verification attempts will show the revoked status.</Para>
    </div>
  );
}

function VerifySection() {
  return (
    <div className="space-y-4">
      <SectionTitle>Document Verification</SectionTitle>
      <Para>Anyone can verify a document without connecting a wallet. Simply enter the file hash and the system will check the blockchain.</Para>
      <SubTitle>What Verification Checks</SubTitle>
      <div className="space-y-2 mt-3">
        {[
          { label: 'Existence', desc: 'Does a document with this hash exist on-chain?' },
          { label: 'Validity', desc: 'Has the document been revoked?' },
          { label: 'Co-Sign Status', desc: 'Has it met the minimum signature threshold?' },
          { label: 'Signers', desc: 'Which operators have signed this document?' },
          { label: 'Metadata', desc: 'What additional data (amount, recipient) is attached?' },
        ].map((item) => (
          <div key={item.label} className="flex items-start gap-3 bg-gray-50 rounded-lg p-3">
            <span className="text-emerald-600 font-bold text-sm flex-shrink-0">{item.label}</span>
            <p className="text-sm text-gray-600">{item.desc}</p>
          </div>
        ))}
      </div>
      <InfoBox title="Public Access">The Verify and Transaction Explorer pages are accessible to everyone, even without a connected wallet. This is by design — transparency is a core principle of the protocol.</InfoBox>
    </div>
  );
}

function ConfigSection() {
  return (
    <div className="space-y-4">
      <SectionTitle>Configuration</SectionTitle>
      <Para>Each tenant has configurable parameters that govern operator behavior and document policies.</Para>
      <SubTitle>Tenant Parameters</SubTitle>
      <div className="space-y-3 mt-3">
        {[
          { param: 'Min Operator Stake', desc: 'Minimum ETH required to join as an operator. Operators below this threshold are auto-deactivated after soft-slash.', setBy: 'Operator Manager' },
          { param: 'Unstake Cooldown', desc: 'Time period (in days) between unstake request and execution. Prevents sudden exits during active operations.', setBy: 'Operator Manager' },
          { param: 'Violation Penalties', desc: 'Percentage-based penalties for specific violation codes. Used by soft-slash to calculate deduction amounts.', setBy: 'Operator Manager' },
          { param: 'Co-Sign Policies', desc: 'Per document-type rules: minimum signers, required roles, whitelisted operators.', setBy: 'Operator Manager' },
          { param: 'Treasury Address', desc: 'Wallet address that receives slashed funds. Can only be changed by Tenant Admin.', setBy: 'Tenant Admin' },
        ].map((item) => (
          <div key={item.param} className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-1">
              <p className="font-bold text-gray-900 text-sm">{item.param}</p>
              <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-semibold">{item.setBy}</span>
            </div>
            <p className="text-gray-600 text-xs">{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
