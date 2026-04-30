/**
 * QuickSearchDialog — Ctrl+K global search
 * Searches across tenants, operators, documents.
 * Inspired by reference quick-search-dialog.tsx (ShadCN) — rebuilt with Tailwind.
 */
import { useEffect, useRef, useState, useCallback } from "react";
import {
  Search,
  X,
  Clock,
  Building2,
  Users,
  FileText,
  LayoutDashboard,
  ArrowRight,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { blockchainService } from "../services/blockchainService";
import { HighlightText } from "./HighlightText";
import { includesNormalized } from "../lib/searchUtils";
import type { Tenant, Operator, Document } from "../types";

// ─── Types ────────────────────────────────────────────────────────────────────

type ResultKind = "tenant" | "operator" | "document" | "page";

interface QuickResult {
  id: string;
  kind: ResultKind;
  title: string;
  subtitle: string;
  meta?: string;
  badge?: string;
  badgeColor?: string;
  navigateTo: string;
  navigateOptions?: { actorFilter?: string };
}

// ─── Constants ────────────────────────────────────────────────────────────────

const LS_KEY = "vz_search_history";
const MAX_HISTORY = 6;
const MAX_PER_GROUP = 4;
const DEBOUNCE_MS = 250;

const STATIC_PAGES: QuickResult[] = [
  {
    id: "p-dashboard",
    kind: "page",
    title: "Dashboard",
    subtitle: "Overview and stats",
    navigateTo: "dashboard",
  },
  {
    id: "p-tenants",
    kind: "page",
    title: "Tenant Management",
    subtitle: "Create and manage tenants",
    navigateTo: "tenants",
  },
  {
    id: "p-operators",
    kind: "page",
    title: "Operator Management",
    subtitle: "Stake, slash, and manage operators",
    navigateTo: "operators",
  },
  {
    id: "p-documents",
    kind: "page",
    title: "Document Management",
    subtitle: "Anchor, co-sign, and revoke documents",
    navigateTo: "documents",
  },
  {
    id: "p-transactions",
    kind: "page",
    title: "Transaction History",
    subtitle: "Browse all blockchain events",
    navigateTo: "transactions",
  },
  {
    id: "p-verify",
    kind: "page",
    title: "Verify Document",
    subtitle: "Check a document hash on-chain",
    navigateTo: "verify",
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function kindMeta(kind: ResultKind) {
  switch (kind) {
    case "tenant":
      return {
        icon: Building2,
        iconBg: "bg-blue-100",
        iconColor: "text-blue-600",
        label: "Tenant",
      };
    case "operator":
      return {
        icon: Users,
        iconBg: "bg-emerald-100",
        iconColor: "text-emerald-600",
        label: "Operator",
      };
    case "document":
      return {
        icon: FileText,
        iconBg: "bg-violet-100",
        iconColor: "text-violet-600",
        label: "Document",
      };
    case "page":
      return {
        icon: LayoutDashboard,
        iconBg: "bg-slate-100",
        iconColor: "text-slate-500",
        label: "Page",
      };
  }
}

function buildTenantResults(tenants: Tenant[], query: string): QuickResult[] {
  return tenants
    .filter(
      (t) =>
        includesNormalized(t.name, query) ||
        includesNormalized(t.id, query) ||
        includesNormalized(t.admin, query) ||
        includesNormalized(t.operatorManager, query),
    )
    .slice(0, MAX_PER_GROUP)
    .map((t) => ({
      id: `tenant-${t.id}`,
      kind: "tenant" as ResultKind,
      title: t.name,
      subtitle: `Admin: ${t.admin.slice(0, 10)}…  |  ${t.isActive ? "Active" : "Inactive"}`,
      meta: `ID: ${t.id}`,
      badge: t.isActive ? "Active" : "Inactive",
      badgeColor: t.isActive
        ? "bg-emerald-100 text-emerald-700"
        : "bg-gray-100 text-gray-500",
      navigateTo: "tenants",
    }));
}

function buildOperatorResults(
  operators: Operator[],
  query: string,
): QuickResult[] {
  return operators
    .filter(
      (o) =>
        includesNormalized(o.address, query) ||
        includesNormalized(o.id, query) ||
        includesNormalized(o.tenantId, query),
    )
    .slice(0, MAX_PER_GROUP)
    .map((o) => ({
      id: `operator-${o.id}`,
      kind: "operator" as ResultKind,
      title: `${o.address.slice(0, 8)}…${o.address.slice(-6)}`,
      subtitle: `Tenant: ${o.tenantId}  |  Stake: ${o.stakeAmount} VZK`,
      meta: o.isActive ? "Active" : "Inactive",
      badge: o.isActive ? "Active" : "Inactive",
      badgeColor: o.isActive
        ? "bg-emerald-100 text-emerald-700"
        : "bg-gray-100 text-gray-500",
      navigateTo: "operators",
    }));
}

function buildDocumentResults(
  documents: Document[],
  query: string,
): QuickResult[] {
  return documents
    .filter(
      (d) =>
        includesNormalized(d.fileName, query) ||
        includesNormalized(d.fileHash, query) ||
        includesNormalized(d.id, query) ||
        includesNormalized(d.docType, query) ||
        includesNormalized(d.issuedBy, query),
    )
    .slice(0, MAX_PER_GROUP)
    .map((d) => ({
      id: `doc-${d.id}`,
      kind: "document" as ResultKind,
      title: d.fileName,
      subtitle: `${d.docType.charAt(0).toUpperCase() + d.docType.slice(1)}  |  By: ${d.issuedBy.slice(0, 10)}…`,
      meta: d.isValid ? "Valid" : "Revoked",
      badge: d.isValid ? "Valid" : "Revoked",
      badgeColor: d.isValid
        ? "bg-blue-100 text-blue-700"
        : "bg-red-100 text-red-600",
      navigateTo: "documents",
    }));
}

function buildPageResults(query: string): QuickResult[] {
  return STATIC_PAGES.filter(
    (p) =>
      includesNormalized(p.title, query) ||
      includesNormalized(p.subtitle, query),
  );
}

// ─── Result row ───────────────────────────────────────────────────────────────

function ResultRow({
  result,
  query,
  isSelected,
  onClick,
  onMouseEnter,
}: {
  result: QuickResult;
  query: string;
  isSelected: boolean;
  onClick: () => void;
  onMouseEnter: () => void;
}) {
  const { icon: Icon, iconBg, iconColor } = kindMeta(result.kind);
  return (
    <button
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors group ${
        isSelected ? "bg-blue-50 ring-1 ring-blue-200" : "hover:bg-gray-50"
      }`}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
    >
      <div
        className={`w-8 h-8 ${iconBg} rounded-lg flex items-center justify-center shrink-0`}
      >
        <Icon size={15} className={iconColor} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-gray-900 truncate">
            <HighlightText text={result.title} query={query} />
          </span>
          {result.badge && (
            <span
              className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0 ${result.badgeColor}`}
            >
              {result.badge}
            </span>
          )}
        </div>
        <p className="text-xs text-gray-400 truncate mt-0.5">
          <HighlightText text={result.subtitle} query={query} />
        </p>
      </div>
      <ChevronRight
        size={14}
        className={`shrink-0 transition-opacity ${isSelected ? "opacity-60" : "opacity-0 group-hover:opacity-40"}`}
      />
    </button>
  );
}

// ─── Group header ─────────────────────────────────────────────────────────────

function GroupHeader({ label, count }: { label: string; count: number }) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5">
      <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
        {label}
      </span>
      <span className="text-[10px] text-gray-300 font-medium">{count}</span>
    </div>
  );
}

// ─── Main dialog ──────────────────────────────────────────────────────────────

interface QuickSearchDialogProps {
  open: boolean;
  onClose: () => void;
  onNavigate: (page: string, options?: { actorFilter?: string }) => void;
}

export function QuickSearchDialog({
  open,
  onClose,
  onNavigate,
}: QuickSearchDialogProps) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);

  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [operators, setOperators] = useState<Operator[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);

  const [history, setHistory] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(LS_KEY) || "[]");
    } catch {
      return [];
    }
  });

  const [selectedIdx, setSelectedIdx] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);

  // Load data when dialog first opens
  useEffect(() => {
    if (!open || dataLoaded) return;
    let cancelled = false;
    setIsLoading(true);
    Promise.allSettled([
      blockchainService.getTenants(),
      blockchainService.getAllOperators(),
      blockchainService.getAllDocuments(),
    ]).then(([tenantsRes, operatorsRes, documentsRes]) => {
      if (cancelled) return;
      if (tenantsRes.status === "fulfilled") setTenants(tenantsRes.value);
      if (operatorsRes.status === "fulfilled") setOperators(operatorsRes.value);
      if (documentsRes.status === "fulfilled") setDocuments(documentsRes.value);
      setDataLoaded(true);
      setIsLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [open, dataLoaded]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setQuery("");
      setDebouncedQuery("");
      setSelectedIdx(0);
    } else {
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  // Debounce query
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedQuery(query);
      setSelectedIdx(0);
    }, DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [query]);

  // Build results
  const q = debouncedQuery.trim();
  const hasQuery = q.length > 0;

  const tenantResults = hasQuery ? buildTenantResults(tenants, q) : [];
  const operatorResults = hasQuery ? buildOperatorResults(operators, q) : [];
  const documentResults = hasQuery ? buildDocumentResults(documents, q) : [];
  const pageResults = hasQuery ? buildPageResults(q) : [];

  const allResults: QuickResult[] = [
    ...tenantResults,
    ...operatorResults,
    ...documentResults,
    ...pageResults,
  ];
  const totalResults = allResults.length;

  const getGlobalIdx = useCallback(
    (result: QuickResult): number =>
      allResults.findIndex((r) => r.id === result.id),
    [allResults],
  );

  // Save history helper
  const saveHistory = useCallback((term: string) => {
    const trimmed = term.trim();
    if (!trimmed) return;
    setHistory((prev) => {
      const updated = [trimmed, ...prev.filter((h) => h !== trimmed)].slice(
        0,
        MAX_HISTORY,
      );
      localStorage.setItem(LS_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const handleSelect = useCallback(
    (result: QuickResult) => {
      saveHistory(q || result.title);
      onNavigate(result.navigateTo, result.navigateOptions);
      onClose();
    },
    [q, onNavigate, onClose, saveHistory],
  );

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIdx((i) => Math.min(i + 1, totalResults - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIdx((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter" && totalResults > 0) {
        e.preventDefault();
        const selected = allResults[selectedIdx];
        if (selected) handleSelect(selected);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, totalResults, allResults, selectedIdx, handleSelect, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh] px-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        style={{ maxHeight: "70vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
          {isLoading ? (
            <Loader2
              size={18}
              className="text-blue-500 shrink-0 animate-spin"
            />
          ) : (
            <Search size={18} className="text-gray-400 shrink-0" />
          )}
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tenants, operators, documents…"
            className="flex-1 text-sm text-gray-900 placeholder-gray-400 outline-none bg-transparent"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors shrink-0"
              aria-label="Clear"
            >
              <X size={14} />
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-mono text-gray-400 bg-gray-100 rounded border border-gray-200 shrink-0">
            ESC
          </kbd>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 py-2">
          {/* Empty query → show history */}
          {!hasQuery && (
            <>
              {history.length > 0 ? (
                <div className="px-2">
                  <GroupHeader label="Recent Searches" count={history.length} />
                  {history.map((term) => (
                    <button
                      key={term}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 text-left group transition-colors"
                      onClick={() => setQuery(term)}
                    >
                      <div className="w-7 h-7 bg-gray-100 rounded-lg flex items-center justify-center shrink-0">
                        <Clock size={13} className="text-gray-400" />
                      </div>
                      <span className="text-sm text-gray-600 flex-1 truncate">
                        {term}
                      </span>
                      <ArrowRight
                        size={13}
                        className="text-gray-300 opacity-0 group-hover:opacity-100 shrink-0"
                      />
                    </button>
                  ))}
                </div>
              ) : (
                <div className="px-4 py-8 text-center">
                  <Search size={32} className="text-gray-200 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">
                    Type to search tenants, operators, or documents
                  </p>
                </div>
              )}
            </>
          )}

          {/* Has query → show results */}
          {hasQuery && !isLoading && totalResults === 0 && (
            <div className="px-4 py-8 text-center">
              <p className="text-sm text-gray-400">
                No results for{" "}
                <span className="font-medium text-gray-600">"{q}"</span>
              </p>
            </div>
          )}

          {hasQuery && totalResults > 0 && (
            <div className="px-2 space-y-1">
              {tenantResults.length > 0 && (
                <div>
                  <GroupHeader label="Tenants" count={tenantResults.length} />
                  {tenantResults.map((r) => (
                    <ResultRow
                      key={r.id}
                      result={r}
                      query={q}
                      isSelected={getGlobalIdx(r) === selectedIdx}
                      onClick={() => handleSelect(r)}
                      onMouseEnter={() => setSelectedIdx(getGlobalIdx(r))}
                    />
                  ))}
                </div>
              )}

              {operatorResults.length > 0 && (
                <div>
                  <GroupHeader
                    label="Operators"
                    count={operatorResults.length}
                  />
                  {operatorResults.map((r) => (
                    <ResultRow
                      key={r.id}
                      result={r}
                      query={q}
                      isSelected={getGlobalIdx(r) === selectedIdx}
                      onClick={() => handleSelect(r)}
                      onMouseEnter={() => setSelectedIdx(getGlobalIdx(r))}
                    />
                  ))}
                </div>
              )}

              {documentResults.length > 0 && (
                <div>
                  <GroupHeader
                    label="Documents"
                    count={documentResults.length}
                  />
                  {documentResults.map((r) => (
                    <ResultRow
                      key={r.id}
                      result={r}
                      query={q}
                      isSelected={getGlobalIdx(r) === selectedIdx}
                      onClick={() => handleSelect(r)}
                      onMouseEnter={() => setSelectedIdx(getGlobalIdx(r))}
                    />
                  ))}
                </div>
              )}

              {pageResults.length > 0 && (
                <div>
                  <GroupHeader label="Pages" count={pageResults.length} />
                  {pageResults.map((r) => (
                    <ResultRow
                      key={r.id}
                      result={r}
                      query={q}
                      isSelected={getGlobalIdx(r) === selectedIdx}
                      onClick={() => handleSelect(r)}
                      onMouseEnter={() => setSelectedIdx(getGlobalIdx(r))}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer hints */}
        <div className="px-4 py-2.5 border-t border-gray-100 flex items-center gap-4 text-[11px] text-gray-400">
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 bg-gray-100 rounded border border-gray-200 font-mono">
              ↑↓
            </kbd>
            Navigate
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 bg-gray-100 rounded border border-gray-200 font-mono">
              ↵
            </kbd>
            Select
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 bg-gray-100 rounded border border-gray-200 font-mono">
              Esc
            </kbd>
            Close
          </span>
          {totalResults > 0 && (
            <span className="ml-auto">
              {totalResults} result{totalResults > 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
