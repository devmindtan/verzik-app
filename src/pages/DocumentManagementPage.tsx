import { useState, useEffect } from 'react';
import { Plus, CheckCircle, XCircle, FileText, Eye, PenTool } from 'lucide-react';
import { blockchainService } from '../services/blockchainService';
import { authService } from '../services/authService';
import { useAuth } from '../contexts/AuthContext';
import { TruncatedHash } from '../components/TruncatedHash';
import { ConfirmPopup } from '../components/ConfirmPopup';
import { Document } from '../types';

export function DocumentManagementPage() {
  const { session } = useAuth();
  const [selectedTenant, setSelectedTenant] = useState(session?.tenantId || 't1');
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showCoSignModal, setShowCoSignModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [registerForm, setRegisterForm] = useState({ fileHash: '', fileName: '', docType: 'voucher' as Document['docType'], amount: '' });
  const [coSignForm, setCoSignForm] = useState({ signer: '' });
  const [confirm, setConfirm] = useState<{ open: boolean; title: string; message: string; variant: 'danger' | 'warning' | 'info'; onConfirm: () => void }>({
    open: false, title: '', message: '', variant: 'danger', onConfirm: () => {},
  });
  const [tenants, setTenants] = useState<Awaited<ReturnType<typeof blockchainService.getTenants>>>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  const canRegister = authService.hasPermission(session, 'register_document');
  const canCoSign = authService.hasPermission(session, 'cosign_document');
  const canRevoke = authService.hasPermission(session, 'revoke_document');

  const loadData = async () => {
    setLoading(true);
    try {
      const [fetchedTenants, fetchedDocuments] = await Promise.all([
        blockchainService.getTenants(),
        blockchainService.getDocuments(selectedTenant),
      ]);
      setTenants(fetchedTenants);
      setDocuments(fetchedDocuments);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedTenant]);

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!registerForm.fileHash || !registerForm.fileName) return;
    setConfirm({
      open: true,
      title: 'Register Document',
      message: `This will anchor "${registerForm.fileName}" on-chain with the provided file hash. This action is permanent and cannot be undone.`,
      variant: 'info',
      onConfirm: async () => {
        await blockchainService.registerDocument(
          selectedTenant, registerForm.fileHash, registerForm.fileName, registerForm.docType,
          session?.address || '0x0',
          registerForm.amount ? { amount: parseFloat(registerForm.amount) } : undefined
        );
        setRegisterForm({ fileHash: '', fileName: '', docType: 'voucher', amount: '' });
        setShowRegisterModal(false);
        await loadData();
      },
    });
  };

  const handleCoSign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoc || !coSignForm.signer) return;
    setConfirm({
      open: true,
      title: 'Co-Sign Document',
      message: `This will add ${coSignForm.signer} as a co-signer to "${selectedDoc.fileName}". This signature is permanent and cannot be removed.`,
      variant: 'info',
      onConfirm: async () => {
        await blockchainService.coSignDocument(selectedTenant, selectedDoc.fileHash, coSignForm.signer);
        setCoSignForm({ signer: '' });
        setShowCoSignModal(false);
        await loadData();
      },
    });
  };

  const handleRevoke = (doc: Document) => {
    setConfirm({
      open: true,
      title: 'Revoke Document',
      message: `This will revoke "${doc.fileName}". The document will remain on-chain as a historical record but will be marked as invalid. Future verification attempts will show the revoked status. This cannot be undone.`,
      variant: 'danger',
      onConfirm: async () => {
        await blockchainService.revokeDocument(selectedTenant, doc.fileHash, session?.address || '0x0');
        await loadData();
      },
    });
  };

  const docTypeLabel: Record<string, string> = { voucher: 'Voucher', contract: 'Contract', certificate: 'Certificate', receipt: 'Receipt' };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Document Management</h1>
          <p className="text-gray-500 mt-1">Register, co-sign, and manage blockchain-anchored documents</p>
        </div>
        {canRegister && (
          <button onClick={() => setShowRegisterModal(true)} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors text-sm">
            <Plus size={18} /> Register Document
          </button>
        )}
      </div>

      {/* Tenant selector - always visible */}
      <div className="bg-white rounded-xl shadow-sm border p-4 flex items-center gap-3">
        <label className="text-sm font-semibold text-gray-700">Tenant:</label>
        <select value={selectedTenant} onChange={(e) => setSelectedTenant(e.target.value)} className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none">
          {tenants.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </div>

      {/* Documents list */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="px-5 py-4 border-b bg-slate-50 flex items-center justify-between">
          <h2 className="font-bold text-gray-900">Documents ({documents.length})</h2>
          <div className="flex gap-2 text-xs">
            <span className="px-2 py-1 bg-green-100 text-green-800 rounded font-semibold">{documents.filter((d) => d.isValid && d.coSignQualified).length} Qualified</span>
            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded font-semibold">{documents.filter((d) => d.isValid && !d.coSignQualified).length} Pending</span>
            <span className="px-2 py-1 bg-red-100 text-red-800 rounded font-semibold">{documents.filter((d) => !d.isValid).length} Revoked</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="px-5 py-8 text-center text-gray-400 text-sm">Loading documents...</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-5 py-3 text-left font-semibold text-gray-600">Document</th>
                  <th className="px-5 py-3 text-left font-semibold text-gray-600">Type</th>
                  <th className="px-5 py-3 text-left font-semibold text-gray-600">File Hash</th>
                  <th className="px-5 py-3 text-left font-semibold text-gray-600">Co-Signers</th>
                  <th className="px-5 py-3 text-left font-semibold text-gray-600">Status</th>
                  <th className="px-5 py-3 text-center font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((doc) => (
                  <tr key={doc.id} className="border-b hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <FileText size={16} className="text-gray-400 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 truncate">{doc.fileName}</p>
                          <p className="text-xs text-gray-500">{doc.issuedAt.toLocaleDateString()}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs font-semibold">{docTypeLabel[doc.docType] || doc.docType}</span>
                    </td>
                    <td className="px-5 py-3 text-xs text-gray-600"><TruncatedHash value={doc.fileHash} /></td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1">
                        <span className="text-sm font-semibold text-gray-900">{doc.coSigners.length}</span>
                        <span className="text-gray-400 text-xs">signers</span>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex flex-col gap-1">
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold w-fit ${doc.coSignQualified ? 'bg-teal-100 text-teal-800' : 'bg-yellow-100 text-yellow-800'}`}>
                          {doc.coSignQualified ? 'Qualified' : 'Pending'}
                        </span>
                        {!doc.isValid && (
                          <span className="px-2 py-0.5 rounded text-xs font-semibold bg-red-100 text-red-800 w-fit">Revoked</span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => { setSelectedDoc(doc); setShowDetailModal(true); }} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="View details">
                          <Eye size={16} />
                        </button>
                        {canCoSign && doc.isValid && !doc.coSignQualified && (
                          <button onClick={() => { setSelectedDoc(doc); setShowCoSignModal(true); }} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="Co-sign">
                            <PenTool size={16} />
                          </button>
                        )}
                        {canRevoke && doc.isValid && (
                          <button onClick={() => handleRevoke(doc)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Revoke">
                            <XCircle size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {!loading && documents.length === 0 && (
            <div className="px-5 py-8 text-center text-gray-400 text-sm">No documents in this tenant.</div>
          )}
        </div>
      </div>

      {/* Register Modal */}
      {showRegisterModal && (
        <Modal title="Register Document" onClose={() => setShowRegisterModal(false)}>
          <form onSubmit={handleRegister} className="space-y-4">
            <Field label="File Hash"><input type="text" value={registerForm.fileHash} onChange={(e) => setRegisterForm({ ...registerForm, fileHash: e.target.value })} className="input font-mono text-sm" placeholder="0x..." /></Field>
            <Field label="File Name"><input type="text" value={registerForm.fileName} onChange={(e) => setRegisterForm({ ...registerForm, fileName: e.target.value })} className="input" placeholder="e.g., Invoice_2024_01.pdf" /></Field>
            <Field label="Document Type">
              <select value={registerForm.docType} onChange={(e) => setRegisterForm({ ...registerForm, docType: e.target.value as Document['docType'] })} className="input">
                <option value="voucher">Voucher</option>
                <option value="contract">Contract</option>
                <option value="certificate">Certificate</option>
                <option value="receipt">Receipt</option>
              </select>
            </Field>
            <Field label="Amount (Optional)"><input type="number" step="0.01" value={registerForm.amount} onChange={(e) => setRegisterForm({ ...registerForm, amount: e.target.value })} className="input" placeholder="0.00" /></Field>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setShowRegisterModal(false)} className="btn-secondary flex-1">Cancel</button>
              <button type="submit" className="btn-primary flex-1">Register</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Co-Sign Modal */}
      {showCoSignModal && selectedDoc && (
        <Modal title="Co-Sign Document" onClose={() => setShowCoSignModal(false)}>
          <form onSubmit={handleCoSign} className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-sm font-medium text-gray-900">{selectedDoc.fileName}</p>
              <p className="text-xs text-gray-500 mt-1"><TruncatedHash value={selectedDoc.fileHash} /></p>
              <p className="text-xs text-gray-500 mt-1">Current signers: {selectedDoc.coSigners.length}</p>
            </div>
            <Field label="Co-Signer Address"><input type="text" value={coSignForm.signer} onChange={(e) => setCoSignForm({ signer: e.target.value })} className="input font-mono text-sm" placeholder="0x..." /></Field>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setShowCoSignModal(false)} className="btn-secondary flex-1">Cancel</button>
              <button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors">Co-Sign</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedDoc && (
        <Modal title="Document Details" onClose={() => setShowDetailModal(false)} wide>
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">File Name</p>
                <p className="font-medium text-gray-900">{selectedDoc.fileName}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">Type</p>
                <p className="font-medium text-gray-900 capitalize">{selectedDoc.docType}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">Issued By</p>
                <p className="text-sm text-gray-900"><TruncatedHash value={selectedDoc.issuedBy} /></p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">Issued At</p>
                <p className="font-medium text-gray-900">{selectedDoc.issuedAt.toLocaleString()}</p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-1">File Hash</p>
              <p className="text-sm text-gray-900"><TruncatedHash value={selectedDoc.fileHash} /></p>
            </div>

            {selectedDoc.metadata && (
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-2">Metadata</p>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  {selectedDoc.metadata.amount !== undefined && (
                    <div><p className="text-gray-500 text-xs">Amount</p><p className="font-bold text-gray-900">{selectedDoc.metadata.amount}</p></div>
                  )}
                  {selectedDoc.metadata.recipient && (
                    <div><p className="text-gray-500 text-xs">Recipient</p><p className="text-xs text-gray-900"><TruncatedHash value={selectedDoc.metadata.recipient} /></p></div>
                  )}
                  {selectedDoc.metadata.expiryDate && (
                    <div><p className="text-gray-500 text-xs">Expiry</p><p className="text-gray-900">{selectedDoc.metadata.expiryDate.toLocaleDateString()}</p></div>
                  )}
                </div>
              </div>
            )}

            <div>
              <p className="text-xs text-gray-500 mb-2 font-semibold uppercase tracking-wide">Co-Signers ({selectedDoc.coSigners.length})</p>
              <div className="space-y-1.5">
                {selectedDoc.coSigners.map((signer, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
                    <CheckCircle size={14} className="text-teal-600 flex-shrink-0" />
                    <span className="text-sm text-gray-900"><TruncatedHash value={signer} /></span>
                    {idx === 0 && <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-semibold">ISSUER</span>}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2 border-t">
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${selectedDoc.coSignQualified ? 'bg-teal-50 text-teal-800' : 'bg-yellow-50 text-yellow-800'}`}>
                {selectedDoc.coSignQualified ? <CheckCircle size={16} /> : <div className="w-4 h-4 border-2 border-yellow-400 rounded-full" />}
                <span className="text-sm font-semibold">{selectedDoc.coSignQualified ? 'Co-Sign Qualified' : 'Awaiting Co-Signatures'}</span>
              </div>
              {!selectedDoc.isValid && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 text-red-800">
                  <XCircle size={16} />
                  <span className="text-sm font-semibold">Revoked</span>
                </div>
              )}
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
  return <div><label className="block text-sm font-semibold text-gray-700 mb-1">{label}</label>{children}</div>;
}
