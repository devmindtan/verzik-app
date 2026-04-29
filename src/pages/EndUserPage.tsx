import { useEffect, useState } from 'react';
import { FileText, CheckCircle, XCircle, ShieldCheck, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { TruncatedHash } from '../components/TruncatedHash';

interface UserDocument {
  id: string;
  file_hash: string;
  file_name: string;
  doc_type: string;
  issued_by: string;
  issued_at: string;
  is_valid: boolean;
  co_sign_qualified: boolean;
  recipient_address: string;
  metadata_amount: number;
  metadata_recipient: string;
  signatures: { signer_address: string; signature_type: string; signed_at: string }[];
}

export function EndUserPage() {
  const { session } = useAuth();
  const [documents, setDocuments] = useState<UserDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'valid' | 'revoked'>('all');

  useEffect(() => {
    if (!session?.address) { setLoading(false); return; }
    fetchDocuments();
  }, [session?.address]);

  const fetchDocuments = async () => {
    setLoading(true);
    const { data: docs } = await supabase
      .from('documents')
      .select('*')
      .eq('recipient_address', session!.address)
      .order('issued_at', { ascending: false });

    if (docs && docs.length > 0) {
      const docIds = docs.map((d: any) => d.id);
      const { data: sigs } = await supabase
        .from('document_signatures')
        .select('*')
        .in('document_id', docIds)
        .order('signed_at', { ascending: true });

      const sigMap: Record<string, any[]> = {};
      (sigs || []).forEach((s: any) => {
        if (!sigMap[s.document_id]) sigMap[s.document_id] = [];
        sigMap[s.document_id].push(s);
      });

      const enriched = docs.map((d: any) => ({
        ...d,
        signatures: sigMap[d.id] || [],
      }));
      setDocuments(enriched);
    } else {
      setDocuments([]);
    }
    setLoading(false);
  };

  const filteredDocs = documents.filter((d) => {
    if (filter === 'valid') return d.is_valid;
    if (filter === 'revoked') return !d.is_valid;
    return true;
  });

  const docTypeLabel: Record<string, string> = { voucher: 'Voucher', contract: 'Contract', certificate: 'Certificate', receipt: 'Receipt' };

  const validCount = documents.filter((d) => d.is_valid).length;
  const qualifiedCount = documents.filter((d) => d.co_sign_qualified && d.is_valid).length;
  const revokedCount = documents.filter((d) => !d.is_valid).length;

  if (!session?.isConnected) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">My Documents</h1>
        <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
          <User size={48} className="mx-auto text-gray-300 mb-4" />
          <h2 className="text-lg font-semibold text-gray-700 mb-2">Login Required</h2>
          <p className="text-gray-500 text-sm">Connect your wallet to view documents signed for you by operators.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Documents</h1>
        <p className="text-gray-500 mt-1">Documents signed by operators and assigned to your wallet: <TruncatedHash value={session.address} /></p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border-l-4 border-l-green-400 bg-green-50 p-4">
          <div className="flex items-center gap-2 mb-1 opacity-60"><CheckCircle size={18} /><span className="text-xs font-medium">Valid</span></div>
          <p className="text-2xl font-bold text-green-700">{validCount}</p>
        </div>
        <div className="rounded-xl border-l-4 border-l-teal-400 bg-teal-50 p-4">
          <div className="flex items-center gap-2 mb-1 opacity-60"><ShieldCheck size={18} /><span className="text-xs font-medium">Co-Sign Qualified</span></div>
          <p className="text-2xl font-bold text-teal-700">{qualifiedCount}</p>
        </div>
        <div className="rounded-xl border-l-4 border-l-red-400 bg-red-50 p-4">
          <div className="flex items-center gap-2 mb-1 opacity-60"><XCircle size={18} /><span className="text-xs font-medium">Revoked</span></div>
          <p className="text-2xl font-bold text-red-700">{revokedCount}</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2">
        {(['all', 'valid', 'revoked'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              filter === f ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {f === 'all' ? `All (${documents.length})` : f === 'valid' ? `Valid (${validCount})` : `Revoked (${revokedCount})`}
          </button>
        ))}
      </div>

      {/* Document list */}
      {loading ? (
        <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
          <div className="w-8 h-8 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Loading documents...</p>
        </div>
      ) : filteredDocs.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
          <FileText size={48} className="mx-auto text-gray-300 mb-4" />
          <h2 className="text-lg font-semibold text-gray-700 mb-2">No Documents Found</h2>
          <p className="text-gray-500 text-sm">
            {session.role === 'end_user' || session.role === 'none'
              ? 'No operators have signed documents for your wallet yet.'
              : 'No documents match the current filter.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredDocs.map((doc) => (
            <div key={doc.id} className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <div className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      doc.is_valid ? (doc.co_sign_qualified ? 'bg-teal-100 text-teal-600' : 'bg-yellow-100 text-yellow-600') : 'bg-red-100 text-red-600'
                    }`}>
                      <FileText size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-gray-900">{doc.file_name}</h3>
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs font-semibold">
                          {docTypeLabel[doc.doc_type] || doc.doc_type}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500">
                        <span>Issued by: <TruncatedHash value={doc.issued_by} /></span>
                        <span>{new Date(doc.issued_at).toLocaleDateString()}</span>
                      </div>
                      <div className="mt-1 text-xs text-gray-500">
                        Hash: <TruncatedHash value={doc.file_hash} />
                      </div>
                      {doc.metadata_amount > 0 && (
                        <div className="mt-1 text-xs text-gray-600 font-medium">
                          Amount: {doc.metadata_amount.toLocaleString()}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                      doc.is_valid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {doc.is_valid ? 'Valid' : 'Revoked'}
                    </span>
                    {doc.co_sign_qualified && doc.is_valid && (
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-teal-100 text-teal-800">
                        Qualified
                      </span>
                    )}
                    {!doc.co_sign_qualified && doc.is_valid && (
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
                        Pending
                      </span>
                    )}
                  </div>
                </div>

                {/* Signatures */}
                {doc.signatures.length > 0 && (
                  <div className="mt-4 pt-3 border-t">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                      Signatures ({doc.signatures.length})
                    </p>
                    <div className="space-y-1.5">
                      {doc.signatures.map((sig, idx) => (
                        <div key={idx} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
                          <CheckCircle size={14} className="text-teal-600 flex-shrink-0" />
                          <span className="text-sm text-gray-900"><TruncatedHash value={sig.signer_address} /></span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                            sig.signature_type === 'primary' ? 'bg-blue-100 text-blue-700' : 'bg-cyan-100 text-cyan-700'
                          }`}>
                            {sig.signature_type === 'primary' ? 'ISSUER' : 'CO-SIGN'}
                          </span>
                          <span className="text-xs text-gray-400 ml-auto">{new Date(sig.signed_at).toLocaleDateString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
