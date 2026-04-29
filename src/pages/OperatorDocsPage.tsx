import { useEffect, useState } from 'react';
import { FileText, CheckCircle, PenTool, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { TruncatedHash } from '../components/TruncatedHash';

interface SignedDocument {
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
  my_signature_type: string;
  my_signed_at: string;
  all_signatures: { signer_address: string; signature_type: string; signed_at: string }[];
}

export function OperatorDocsPage() {
  const { session } = useAuth();
  const [primaryDocs, setPrimaryDocs] = useState<SignedDocument[]>([]);
  const [cosignDocs, setCosignDocs] = useState<SignedDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'primary' | 'cosign'>('primary');

  useEffect(() => {
    if (!session?.address) { setLoading(false); return; }
    fetchDocuments();
  }, [session?.address]);

  const fetchDocuments = async () => {
    setLoading(true);
    const address = session!.address;

    // Get all signatures by this operator
    const { data: mySigs } = await supabase
      .from('document_signatures')
      .select('document_id, signature_type, signed_at')
      .eq('signer_address', address)
      .order('signed_at', { ascending: false });

    if (!mySigs || mySigs.length === 0) {
      setPrimaryDocs([]);
      setCosignDocs([]);
      setLoading(false);
      return;
    }

    const docIds = mySigs.map((s: any) => s.document_id);
    const { data: docs } = await supabase
      .from('documents')
      .select('*')
      .in('id', docIds)
      .order('issued_at', { ascending: false });

    // Get all signatures for these documents
    const { data: allSigs } = await supabase
      .from('document_signatures')
      .select('*')
      .in('document_id', docIds)
      .order('signed_at', { ascending: true });

    const sigMap: Record<string, any[]> = {};
    (allSigs || []).forEach((s: any) => {
      if (!sigMap[s.document_id]) sigMap[s.document_id] = [];
      sigMap[s.document_id].push(s);
    });

    const mySigMap: Record<string, { type: string; at: string }> = {};
    mySigs.forEach((s: any) => {
      mySigMap[s.document_id] = { type: s.signature_type, at: s.signed_at };
    });

    const enriched: SignedDocument[] = (docs || []).map((d: any) => ({
      ...d,
      my_signature_type: mySigMap[d.id]?.type || 'unknown',
      my_signed_at: mySigMap[d.id]?.at || '',
      all_signatures: sigMap[d.id] || [],
    }));

    setPrimaryDocs(enriched.filter((d) => d.my_signature_type === 'primary'));
    setCosignDocs(enriched.filter((d) => d.my_signature_type === 'cosign'));
    setLoading(false);
  };

  const currentDocs = activeTab === 'primary' ? primaryDocs : cosignDocs;
  const docTypeLabel: Record<string, string> = { voucher: 'Voucher', contract: 'Contract', certificate: 'Certificate', receipt: 'Receipt' };

  if (!session?.isConnected) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">My Signed Documents</h1>
        <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
          <User size={48} className="mx-auto text-gray-300 mb-4" />
          <h2 className="text-lg font-semibold text-gray-700 mb-2">Login Required</h2>
          <p className="text-gray-500 text-sm">Connect your wallet to view documents you have signed.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Signed Documents</h1>
        <p className="text-gray-500 mt-1">Documents signed by your wallet: <TruncatedHash value={session.address} /></p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl border-l-4 border-l-blue-400 bg-blue-50 p-4">
          <div className="flex items-center gap-2 mb-1 opacity-60"><FileText size={18} /><span className="text-xs font-medium">Primary Signed</span></div>
          <p className="text-2xl font-bold text-blue-700">{primaryDocs.length}</p>
          <p className="text-xs text-blue-600 mt-0.5">Documents you issued directly</p>
        </div>
        <div className="rounded-xl border-l-4 border-l-cyan-400 bg-cyan-50 p-4">
          <div className="flex items-center gap-2 mb-1 opacity-60"><PenTool size={18} /><span className="text-xs font-medium">Co-Signed</span></div>
          <p className="text-2xl font-bold text-cyan-700">{cosignDocs.length}</p>
          <p className="text-xs text-cyan-600 mt-0.5">Documents you co-signed as additional signer</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
        <button
          onClick={() => setActiveTab('primary')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition-colors ${
            activeTab === 'primary' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <FileText size={16} />
          Primary Signed ({primaryDocs.length})
        </button>
        <button
          onClick={() => setActiveTab('cosign')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition-colors ${
            activeTab === 'cosign' ? 'bg-white text-cyan-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <PenTool size={16} />
          Co-Signed ({cosignDocs.length})
        </button>
      </div>

      {/* Document list */}
      {loading ? (
        <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
          <div className="w-8 h-8 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Loading documents...</p>
        </div>
      ) : currentDocs.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
          <FileText size={48} className="mx-auto text-gray-300 mb-4" />
          <h2 className="text-lg font-semibold text-gray-700 mb-2">
            No {activeTab === 'primary' ? 'Primary Signed' : 'Co-Signed'} Documents
          </h2>
          <p className="text-gray-500 text-sm">
            {activeTab === 'primary'
              ? 'You have not issued any documents directly yet.'
              : 'You have not co-signed any documents yet.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {currentDocs.map((doc) => (
            <div key={doc.id} className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <div className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      activeTab === 'primary' ? 'bg-blue-100 text-blue-600' : 'bg-cyan-100 text-cyan-600'
                    }`}>
                      {activeTab === 'primary' ? <FileText size={20} /> : <PenTool size={20} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-gray-900">{doc.file_name}</h3>
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs font-semibold">
                          {docTypeLabel[doc.doc_type] || doc.doc_type}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500">
                        <span>Hash: <TruncatedHash value={doc.file_hash} /></span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                        <span>Signed: {new Date(doc.my_signed_at).toLocaleDateString()}</span>
                        {doc.recipient_address && (
                          <span>Recipient: <TruncatedHash value={doc.recipient_address} /></span>
                        )}
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
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-teal-100 text-teal-800">Qualified</span>
                    )}
                  </div>
                </div>

                {/* All signatures */}
                {doc.all_signatures.length > 0 && (
                  <div className="mt-4 pt-3 border-t">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                      All Signatures ({doc.all_signatures.length})
                    </p>
                    <div className="space-y-1.5">
                      {doc.all_signatures.map((sig, idx) => (
                        <div key={idx} className={`flex items-center gap-2 rounded-lg px-3 py-2 ${
                          sig.signer_address === session?.address ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'
                        }`}>
                          <CheckCircle size={14} className="text-teal-600 flex-shrink-0" />
                          <span className="text-sm text-gray-900"><TruncatedHash value={sig.signer_address} /></span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                            sig.signature_type === 'primary' ? 'bg-blue-100 text-blue-700' : 'bg-cyan-100 text-cyan-700'
                          }`}>
                            {sig.signature_type === 'primary' ? 'ISSUER' : 'CO-SIGN'}
                          </span>
                          {sig.signer_address === session?.address && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold bg-amber-100 text-amber-700">YOU</span>
                          )}
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
