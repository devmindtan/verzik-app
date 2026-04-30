import { useEffect, useState, useRef } from "react";
import {
  FileText,
  CheckCircle,
  XCircle,
  ShieldCheck,
  User,
  BookOpen,
  Lock,
  Unlock,
  X,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { AppTooltip } from "../components/Tooltip";
import { supabase } from "../lib/supabase";
import { TruncatedHash } from "../components/TruncatedHash";

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
  encrypted: boolean;
  content: string;
  signatures: {
    signer_address: string;
    signature_type: string;
    signed_at: string;
  }[];
}

export function EndUserPage() {
  const { session } = useAuth();
  const [documents, setDocuments] = useState<UserDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "valid" | "revoked">("all");
  const [readerDoc, setReaderDoc] = useState<UserDocument | null>(null);
  const [decrypted, setDecrypted] = useState(false);
  const [decryptKey, setDecryptKey] = useState("");
  const [decryptError, setDecryptError] = useState("");
  const [fontSize, setFontSize] = useState(16);
  const [currentPage, setCurrentPage] = useState(0);
  const readerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!session?.address) {
      setLoading(false);
      return;
    }
    fetchDocuments();
  }, [session?.address]);

  const fetchDocuments = async () => {
    setLoading(true);
    const { data: docs } = await supabase
      .from("documents")
      .select("*")
      .eq("recipient_address", session!.address)
      .order("issued_at", { ascending: false });

    if (docs && docs.length > 0) {
      const docIds = docs.map((d: any) => d.id);
      const { data: sigs } = await supabase
        .from("document_signatures")
        .select("*")
        .in("document_id", docIds)
        .order("signed_at", { ascending: true });

      const sigMap: Record<string, any[]> = {};
      (sigs || []).forEach((s: any) => {
        if (!sigMap[s.document_id]) sigMap[s.document_id] = [];
        sigMap[s.document_id].push(s);
      });

      const enriched = docs.map((d: any) => ({
        ...d,
        encrypted: d.encrypted || false,
        content: d.content || generateSampleContent(d),
        signatures: (sigMap[d.id] || []).map((s: any) => ({
          signer_address: s.signer_address,
          signature_type: s.signature_type,
          signed_at: s.signed_at,
        })),
      }));
      setDocuments(enriched);
    } else {
      setDocuments([]);
    }
    setLoading(false);
  };

  const generateSampleContent = (doc: any): string => {
    const typeContent: Record<string, string> = {
      voucher: `VOUCHER DOCUMENT\n\nDocument ID: ${doc.id}\nFile Hash: ${doc.file_hash}\n\nThis voucher certifies that the holder is entitled to the specified amount.\n\nAmount: ${doc.metadata_amount || "0"} units\nRecipient: ${doc.metadata_recipient || doc.recipient_address}\nIssued by: ${doc.issued_by}\nDate: ${new Date(doc.issued_at).toLocaleDateString()}\n\nThis document has been verified and anchored on the blockchain through the Verzik system. The authenticity of this document can be independently verified by checking the file hash against the on-chain record.\n\n--- TERMS AND CONDITIONS ---\n\n1. This voucher is non-transferable unless explicitly authorized.\n2. The voucher must be presented in its original form for redemption.\n3. Any modification to this document invalidates the blockchain verification.\n4. The issuer reserves the right to revoke this voucher under the conditions specified in the protocol.\n\n--- VERIFICATION ---\n\nBlockchain verification status: ${doc.is_valid ? "VALID" : "REVOKED"}\nCo-sign qualification: ${doc.co_sign_qualified ? "QUALIFIED" : "PENDING"}\n\nThis document was registered on the Verzik blockchain and can be verified at any time using the document verification page.`,
      contract: `CONTRACT AGREEMENT\n\nContract ID: ${doc.id}\nReference Hash: ${doc.file_hash}\n\nThis contract establishes the terms of agreement between the parties as recorded on the blockchain.\n\nPARTIES:\n- Issuer: ${doc.issued_by}\n- Recipient: ${doc.metadata_recipient || doc.recipient_address}\n\nCONTRACT VALUE: ${doc.metadata_amount || "0"} units\nEFFECTIVE DATE: ${new Date(doc.issued_at).toLocaleDateString()}\n\n--- ARTICLE 1: OBLIGATIONS ---\n\nThe issuer agrees to fulfill the obligations as specified in the protocol documentation. All terms are binding as recorded on the blockchain and cannot be altered unilaterally.\n\n--- ARTICLE 2: VERIFICATION ---\n\nThis contract is verified through multi-signature co-signing. The current qualification status is: ${doc.co_sign_qualified ? "FULLY QUALIFIED" : "PENDING CO-SIGNATURES"}.\n\n--- ARTICLE 3: REVOCATION ---\n\nThis contract may be revoked by the tenant admin under the conditions specified in the Verzik governance framework.\n\nStatus: ${doc.is_valid ? "ACTIVE" : "REVOKED"}`,
      certificate: `CERTIFICATE OF AUTHENTICITY\n\nCertificate ID: ${doc.id}\nVerification Hash: ${doc.file_hash}\n\nThis is to certify that the following has been verified and recorded on the blockchain:\n\nCertified Entity: ${doc.metadata_recipient || doc.recipient_address}\nCertification Value: ${doc.metadata_amount || "0"}\nIssuing Authority: ${doc.issued_by}\nDate of Issuance: ${new Date(doc.issued_at).toLocaleDateString()}\n\nThis certificate is secured by blockchain technology and can be independently verified.\n\nVerification Status: ${doc.is_valid ? "VALID" : "REVOKED"}\nCo-sign Status: ${doc.co_sign_qualified ? "QUALIFIED" : "PENDING"}\n\n--- END OF CERTIFICATE ---`,
      receipt: `RECEIPT\n\nReceipt ID: ${doc.id}\nTransaction Hash: ${doc.file_hash}\n\nRECEIPT DETAILS:\n\nFrom: ${doc.issued_by}\nTo: ${doc.metadata_recipient || doc.recipient_address}\nAmount: ${doc.metadata_amount || "0"} units\nDate: ${new Date(doc.issued_at).toLocaleDateString()}\n\nThis receipt confirms the transaction recorded on the Verzik blockchain.\n\nStatus: ${doc.is_valid ? "CONFIRMED" : "REVOKED"}\nCo-sign: ${doc.co_sign_qualified ? "QUALIFIED" : "PENDING"}\n\n--- END OF RECEIPT ---`,
    };
    return typeContent[doc.doc_type] || typeContent.voucher;
  };

  const handleDecrypt = () => {
    if (!decryptKey.trim()) {
      setDecryptError("Please enter a decryption key");
      return;
    }
    // Simulate decryption - in production this would use real crypto
    if (decryptKey.length >= 6) {
      setDecrypted(true);
      setDecryptError("");
    } else {
      setDecryptError(
        "Invalid decryption key. Key must be at least 6 characters.",
      );
    }
  };

  const openReader = (doc: UserDocument) => {
    setReaderDoc(doc);
    setDecrypted(!doc.encrypted);
    setDecryptKey("");
    setDecryptError("");
    setCurrentPage(0);
    setFontSize(16);
  };

  const closeReader = () => {
    setReaderDoc(null);
    setDecrypted(false);
    setDecryptKey("");
    setDecryptError("");
  };

  const getReaderPages = (content: string): string[] => {
    const charsPerPage = 2000;
    const pages: string[] = [];
    for (let i = 0; i < content.length; i += charsPerPage) {
      pages.push(content.slice(i, i + charsPerPage));
    }
    return pages.length > 0 ? pages : [content];
  };

  const filteredDocs = documents.filter((d) => {
    if (filter === "valid") return d.is_valid;
    if (filter === "revoked") return !d.is_valid;
    return true;
  });

  const docTypeLabel: Record<string, string> = {
    voucher: "Voucher",
    contract: "Contract",
    certificate: "Certificate",
    receipt: "Receipt",
  };

  const validCount = documents.filter((d) => d.is_valid).length;
  const qualifiedCount = documents.filter(
    (d) => d.co_sign_qualified && d.is_valid,
  ).length;
  const revokedCount = documents.filter((d) => !d.is_valid).length;

  if (!session?.isConnected) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">My Documents</h1>
        <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
          <User size={48} className="mx-auto text-gray-300 mb-4" />
          <h2 className="text-lg font-semibold text-gray-700 mb-2">
            Login Required
          </h2>
          <p className="text-gray-500 text-sm">
            Connect your wallet to view documents signed for you by operators.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Documents</h1>
        <p className="text-gray-500 mt-1">
          Documents signed by operators and assigned to your wallet:{" "}
          <TruncatedHash value={session.address} />
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border-l-4 border-l-green-400 bg-green-50 p-4">
          <div className="flex items-center gap-2 mb-1 opacity-60">
            <CheckCircle size={18} />
            <span className="text-xs font-medium">Valid</span>
          </div>
          <p className="text-2xl font-bold text-green-700">{validCount}</p>
        </div>
        <div className="rounded-xl border-l-4 border-l-teal-400 bg-teal-50 p-4">
          <div className="flex items-center gap-2 mb-1 opacity-60">
            <ShieldCheck size={18} />
            <span className="text-xs font-medium">Co-Sign Qualified</span>
          </div>
          <p className="text-2xl font-bold text-teal-700">{qualifiedCount}</p>
        </div>
        <div className="rounded-xl border-l-4 border-l-red-400 bg-red-50 p-4">
          <div className="flex items-center gap-2 mb-1 opacity-60">
            <XCircle size={18} />
            <span className="text-xs font-medium">Revoked</span>
          </div>
          <p className="text-2xl font-bold text-red-700">{revokedCount}</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2">
        {(["all", "valid", "revoked"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              filter === f
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {f === "all"
              ? `All (${documents.length})`
              : f === "valid"
                ? `Valid (${validCount})`
                : `Revoked (${revokedCount})`}
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
          <h2 className="text-lg font-semibold text-gray-700 mb-2">
            No Documents Found
          </h2>
          <p className="text-gray-500 text-sm">
            No operators have signed documents for your wallet yet.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredDocs.map((doc) => (
            <div
              key={doc.id}
              className="bg-white rounded-xl shadow-sm border overflow-hidden"
            >
              <div className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        doc.is_valid
                          ? doc.co_sign_qualified
                            ? "bg-teal-100 text-teal-600"
                            : "bg-yellow-100 text-yellow-600"
                          : "bg-red-100 text-red-600"
                      }`}
                    >
                      <FileText size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-gray-900">
                          {doc.file_name}
                        </h3>
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs font-semibold">
                          {docTypeLabel[doc.doc_type] || doc.doc_type}
                        </span>
                        {doc.encrypted && (
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-xs font-semibold flex items-center gap-1">
                            <Lock size={10} /> Encrypted
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500">
                        <span>
                          Issued by: <TruncatedHash value={doc.issued_by} />
                        </span>
                        <span>
                          {new Date(doc.issued_at).toLocaleDateString()}
                        </span>
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
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        doc.is_valid
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {doc.is_valid ? "Valid" : "Revoked"}
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
                    <button
                      onClick={() => openReader(doc)}
                      className="mt-1 flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors"
                    >
                      <BookOpen size={12} /> Read
                    </button>
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
                        <div
                          key={idx}
                          className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2"
                        >
                          <CheckCircle
                            size={14}
                            className="text-teal-600 flex-shrink-0"
                          />
                          <span className="text-sm text-gray-900">
                            <TruncatedHash value={sig.signer_address} />
                          </span>
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                              sig.signature_type === "primary"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-cyan-100 text-cyan-700"
                            }`}
                          >
                            {sig.signature_type === "primary"
                              ? "ISSUER"
                              : "CO-SIGN"}
                          </span>
                          <span className="text-xs text-gray-400 ml-auto">
                            {new Date(sig.signed_at).toLocaleDateString()}
                          </span>
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

      {/* Document Reader Modal */}
      {readerDoc && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={closeReader}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[calc(100dvh-2rem)] sm:max-h-[calc(100dvh-3rem)] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Reader Header */}
            <div className="px-6 py-4 border-b flex items-center justify-between flex-shrink-0 bg-gradient-to-r from-slate-800 to-slate-900 text-white rounded-t-2xl">
              <div className="flex items-center gap-3 min-w-0">
                <BookOpen size={20} className="text-cyan-400 flex-shrink-0" />
                <div className="min-w-0">
                  <h2 className="font-bold text-sm truncate">
                    {readerDoc.file_name}
                  </h2>
                  <p className="text-[11px] text-slate-400">
                    {docTypeLabel[readerDoc.doc_type] || readerDoc.doc_type} |
                    Issued: {new Date(readerDoc.issued_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {readerDoc.encrypted && !decrypted && (
                  <span className="flex items-center gap-1 text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded font-semibold">
                    <Lock size={10} /> Encrypted
                  </span>
                )}
                {decrypted && readerDoc.encrypted && (
                  <span className="flex items-center gap-1 text-[10px] bg-green-500/20 text-green-300 px-2 py-0.5 rounded font-semibold">
                    <Unlock size={10} /> Decrypted
                  </span>
                )}
                <button
                  onClick={closeReader}
                  className="text-white/60 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Decrypt prompt (if encrypted and not yet decrypted) */}
            {readerDoc.encrypted && !decrypted && (
              <div className="p-8 flex flex-col items-center justify-center">
                <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mb-4">
                  <Lock size={32} className="text-amber-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  Encrypted Document
                </h3>
                <p className="text-sm text-gray-500 mb-6 text-center max-w-sm">
                  This document is encrypted. Enter the decryption key provided
                  by the issuer to read its contents.
                </p>
                <div className="w-full max-w-sm space-y-3">
                  <input
                    type="password"
                    value={decryptKey}
                    onChange={(e) => {
                      setDecryptKey(e.target.value);
                      setDecryptError("");
                    }}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-center font-mono"
                    placeholder="Enter decryption key"
                    onKeyDown={(e) => e.key === "Enter" && handleDecrypt()}
                  />
                  {decryptError && (
                    <p className="text-xs text-red-600 text-center">
                      {decryptError}
                    </p>
                  )}
                  <button
                    onClick={handleDecrypt}
                    className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-semibold transition-colors text-sm"
                  >
                    <Unlock size={16} /> Decrypt & Read
                  </button>
                </div>
              </div>
            )}

            {/* Reader Content (if not encrypted or decrypted) */}
            {(decrypted || !readerDoc.encrypted) && (
              <>
                {/* Toolbar */}
                <div className="px-6 py-2 border-b flex items-center justify-between bg-gray-50 flex-shrink-0">
                  <div className="flex items-center gap-2">
                    <AppTooltip content="Decrease font size">
                      <button
                        onClick={() => setFontSize(Math.max(12, fontSize - 2))}
                        className="p-1.5 hover:bg-gray-200 rounded transition-colors"
                        aria-label="Decrease font size"
                      >
                        <ZoomOut size={14} className="text-gray-600" />
                      </button>
                    </AppTooltip>
                    <span className="text-xs text-gray-500 w-8 text-center">
                      {fontSize}
                    </span>
                    <AppTooltip content="Increase font size">
                      <button
                        onClick={() => setFontSize(Math.min(24, fontSize + 2))}
                        className="p-1.5 hover:bg-gray-200 rounded transition-colors"
                        aria-label="Increase font size"
                      >
                        <ZoomIn size={14} className="text-gray-600" />
                      </button>
                    </AppTooltip>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    {(() => {
                      const pages = getReaderPages(readerDoc.content);
                      return `Page ${currentPage + 1} of ${pages.length}`;
                    })()}
                  </div>
                </div>

                {/* Content */}
                <div
                  ref={readerRef}
                  className="flex-1 overflow-y-auto p-8"
                  style={{ fontSize: `${fontSize}px`, lineHeight: "1.8" }}
                >
                  <div className="max-w-xl mx-auto whitespace-pre-wrap text-gray-800 font-serif">
                    {(() => {
                      const pages = getReaderPages(readerDoc.content);
                      return pages[currentPage] || pages[0];
                    })()}
                  </div>
                </div>

                {/* Page navigation */}
                {(() => {
                  const pages = getReaderPages(readerDoc.content);
                  if (pages.length <= 1) return null;
                  return (
                    <div className="px-6 py-3 border-t flex items-center justify-center gap-4 bg-gray-50 flex-shrink-0">
                      <button
                        onClick={() =>
                          setCurrentPage(Math.max(0, currentPage - 1))
                        }
                        disabled={currentPage === 0}
                        className="p-2 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-30"
                      >
                        <ChevronLeft size={18} />
                      </button>
                      <div className="flex items-center gap-1">
                        {pages.map((_, idx) => (
                          <button
                            key={idx}
                            onClick={() => setCurrentPage(idx)}
                            className={`w-2 h-2 rounded-full transition-colors ${idx === currentPage ? "bg-blue-600" : "bg-gray-300 hover:bg-gray-400"}`}
                          />
                        ))}
                      </div>
                      <button
                        onClick={() =>
                          setCurrentPage(
                            Math.min(pages.length - 1, currentPage + 1),
                          )
                        }
                        disabled={currentPage === pages.length - 1}
                        className="p-2 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-30"
                      >
                        <ChevronRight size={18} />
                      </button>
                    </div>
                  );
                })()}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
