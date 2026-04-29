import { useState } from 'react';
import { Search, ShieldCheck, AlertTriangle, Clock, CheckCircle, XCircle } from 'lucide-react';
import { blockchainService } from '../services/blockchainService';
import { TruncatedHash } from '../components/TruncatedHash';
import { Document } from '../types';

type VerifyState = 'idle' | 'searching' | 'found' | 'not_found';

export function DocumentVerifyPage() {
  const [fileHash, setFileHash] = useState('');
  const [verifyState, setVerifyState] = useState<VerifyState>('idle');
  const [document, setDocument] = useState<Document | null>(null);
  const [message, setMessage] = useState('');

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileHash.trim()) return;

    setVerifyState('searching');
    setDocument(null);
    setMessage('');

    // Simulate blockchain lookup delay
    setTimeout(() => {
      const result = blockchainService.verifyDocument(fileHash.trim());
      if (result.found && result.document) {
        setVerifyState('found');
        setDocument(result.document);
        setMessage(result.message);
      } else {
        setVerifyState('not_found');
        setMessage(result.message);
      }
    }, 800);
  };

  const handleClear = () => {
    setFileHash('');
    setVerifyState('idle');
    setDocument(null);
    setMessage('');
  };

  const docTypeLabel: Record<string, string> = { voucher: 'Voucher', contract: 'Contract', certificate: 'Certificate', receipt: 'Receipt' };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Verify Document</h1>
        <p className="text-gray-500 mt-1">Enter a file hash to verify its authenticity on the blockchain. Available to everyone.</p>
      </div>

      {/* Info banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
        <ShieldCheck size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-800">
          <p className="font-semibold">How document verification works</p>
          <p className="mt-1 text-blue-700">
            In production, this would query the smart contract directly to verify that a document with the given hash exists on-chain, check its co-sign status, and confirm it hasn't been revoked. Currently running in demo mode with mock data.
          </p>
        </div>
      </div>

      {/* Search form */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <form onSubmit={handleVerify} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">File Hash</label>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={fileHash}
                onChange={(e) => setFileHash(e.target.value)}
                placeholder="Enter file hash (0x...)"
                className="w-full pl-9 pr-4 py-3 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1.5">
              Try: <button type="button" onClick={() => setFileHash('0xabcd1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab')} className="text-blue-600 hover:underline font-mono">0xabcd...90ab</button> (sample document)
            </p>
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={verifyState === 'searching'} className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2.5 rounded-lg font-semibold transition-colors text-sm flex items-center justify-center gap-2">
              {verifyState === 'searching' ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <ShieldCheck size={16} />
                  Verify Document
                </>
              )}
            </button>
            {verifyState !== 'idle' && (
              <button type="button" onClick={handleClear} className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold transition-colors text-sm">
                Clear
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Results */}
      {verifyState === 'found' && document && (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="px-6 py-4 border-b bg-green-50 flex items-center gap-3">
            <CheckCircle size={24} className="text-green-600" />
            <div>
              <h2 className="font-bold text-green-900">Document Found on Chain</h2>
              <p className="text-sm text-green-700">{message}</p>
            </div>
          </div>
          <div className="p-6 space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">File Name</p>
                <p className="font-medium text-gray-900">{document.fileName}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">Document Type</p>
                <p className="font-medium text-gray-900 capitalize">{docTypeLabel[document.docType] || document.docType}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">Issued By</p>
                <p className="text-sm text-gray-900"><TruncatedHash value={document.issuedBy} /></p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">Issued At</p>
                <p className="font-medium text-gray-900">{document.issuedAt.toLocaleString()}</p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-1">File Hash</p>
              <p className="text-sm text-gray-900"><TruncatedHash value={document.fileHash} /></p>
            </div>

            {/* Verification Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className={`rounded-lg border-2 p-4 ${document.isValid ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50'}`}>
                <div className="flex items-center gap-2 mb-1">
                  {document.isValid ? <CheckCircle size={18} className="text-green-600" /> : <XCircle size={18} className="text-red-600" />}
                  <span className={`font-bold text-sm ${document.isValid ? 'text-green-900' : 'text-red-900'}`}>
                    {document.isValid ? 'Document is Valid' : 'Document has been Revoked'}
                  </span>
                </div>
                <p className={`text-xs ${document.isValid ? 'text-green-700' : 'text-red-700'}`}>
                  {document.isValid ? 'This document has not been revoked and is still valid on-chain.' : 'This document has been revoked by an authorized party.'}
                </p>
              </div>

              <div className={`rounded-lg border-2 p-4 ${document.coSignQualified ? 'border-teal-300 bg-teal-50' : 'border-yellow-300 bg-yellow-50'}`}>
                <div className="flex items-center gap-2 mb-1">
                  {document.coSignQualified ? <CheckCircle size={18} className="text-teal-600" /> : <Clock size={18} className="text-yellow-600" />}
                  <span className={`font-bold text-sm ${document.coSignQualified ? 'text-teal-900' : 'text-yellow-900'}`}>
                    {document.coSignQualified ? 'Co-Sign Qualified' : 'Awaiting Co-Signatures'}
                  </span>
                </div>
                <p className={`text-xs ${document.coSignQualified ? 'text-teal-700' : 'text-yellow-700'}`}>
                  {document.coSignQualified
                    ? `This document has met the minimum co-signature threshold (${document.coSigners.length} signers).`
                    : `Currently ${document.coSigners.length} signer(s). Needs more co-signatures to qualify.`}
                </p>
              </div>
            </div>

            {/* Co-Signers */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Co-Signers ({document.coSigners.length})</p>
              <div className="space-y-1.5">
                {document.coSigners.map((signer, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
                    <CheckCircle size={14} className="text-teal-600 flex-shrink-0" />
                    <span className="text-sm text-gray-900"><TruncatedHash value={signer} /></span>
                    {idx === 0 && <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-semibold ml-auto">ISSUER</span>}
                  </div>
                ))}
              </div>
            </div>

            {document.metadata && (
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-2 font-semibold uppercase tracking-wide">Metadata</p>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  {document.metadata.amount !== undefined && (
                    <div><p className="text-gray-500 text-xs">Amount</p><p className="font-bold text-gray-900">{document.metadata.amount}</p></div>
                  )}
                  {document.metadata.recipient && (
                    <div><p className="text-gray-500 text-xs">Recipient</p><p className="text-xs text-gray-900"><TruncatedHash value={document.metadata.recipient} /></p></div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {verifyState === 'not_found' && (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="px-6 py-4 border-b bg-amber-50 flex items-center gap-3">
            <AlertTriangle size={24} className="text-amber-600" />
            <div>
              <h2 className="font-bold text-amber-900">Document Not Found</h2>
              <p className="text-sm text-amber-700">{message}</p>
            </div>
          </div>
          <div className="p-6">
            <div className="text-sm text-gray-600 space-y-2">
              <p>Possible reasons:</p>
              <ul className="list-disc list-inside space-y-1 text-gray-500">
                <li>The file hash is incorrect or incomplete</li>
                <li>The document was never registered on this protocol</li>
                <li>The document exists on a different tenant or network</li>
              </ul>
              <p className="mt-3 text-gray-500 text-xs">
                In production, this would query the blockchain directly via the smart contract's <code className="bg-gray-100 px-1 py-0.5 rounded">documents(tenantId, fileHash)</code> mapping.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* How it works section */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h2 className="font-bold text-gray-900 mb-4">How On-Chain Verification Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-700 font-bold text-sm mb-2">1</div>
            <h3 className="font-semibold text-gray-900 text-sm">Submit Hash</h3>
            <p className="text-xs text-gray-500 mt-1">Enter the file hash (SHA-256 or similar) of the document you want to verify.</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-700 font-bold text-sm mb-2">2</div>
            <h3 className="font-semibold text-gray-900 text-sm">Query Contract</h3>
            <p className="text-xs text-gray-500 mt-1">The system queries the VoucherProtocol smart contract for the given hash.</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center text-teal-700 font-bold text-sm mb-2">3</div>
            <h3 className="font-semibold text-gray-900 text-sm">Get Result</h3>
            <p className="text-xs text-gray-500 mt-1">Receive verification: document exists, is valid, co-sign status, and full metadata.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
