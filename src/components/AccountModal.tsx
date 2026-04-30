import {
  X,
  Shield,
  Users,
  Wallet,
  ExternalLink,
  Settings,
  FileText,
  PenTool,
  Globe,
  Sun,
  Moon,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import { useTheme } from "../contexts/ThemeContext";
import { useCompact } from "../contexts/CompactContext";
import { authService } from "../services/authService";
import { TruncatedHash } from "./TruncatedHash";
import { useState } from "react";

interface AccountModalProps {
  open: boolean;
  onClose: () => void;
  onNavigate: (page: string, options?: { actorFilter?: string }) => void;
}

export function AccountModal({ open, onClose, onNavigate }: AccountModalProps) {
  const { session, disconnectWallet } = useAuth();
  const { lang, setLang, t } = useLanguage();
  const { theme, setTheme } = useTheme();
  const { compact, setCompact } = useCompact();
  const [activeTab, setActiveTab] = useState<"profile" | "settings">("profile");

  if (!open || !session) return null;

  const roleColorMap: Record<string, string> = {
    protocol_admin: "bg-red-100 text-red-800 border-red-200",
    tenant_admin: "bg-blue-100 text-blue-800 border-blue-200",
    tenant_operator: "bg-emerald-100 text-emerald-800 border-emerald-200",
    tenant_treasury: "bg-amber-100 text-amber-800 border-amber-200",
    end_user: "bg-cyan-100 text-cyan-800 border-cyan-200",
    none: "bg-gray-100 text-gray-700 border-gray-200",
  };

  const roleIconMap: Record<string, React.ReactNode> = {
    protocol_admin: <Shield size={16} />,
    tenant_admin: <Settings size={16} />,
    tenant_operator: <Users size={16} />,
    tenant_treasury: <Wallet size={16} />,
    end_user: <Users size={16} />,
    none: <Wallet size={16} />,
  };

  const handleDisconnect = () => {
    disconnectWallet();
    onClose();
    onNavigate("home");
  };

  const isOperator = session.role === "none";

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-6 py-5 text-white">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-lg">{t("account.title")}</h2>
            <button
              onClick={onClose}
              className="text-white/60 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center text-2xl font-bold text-cyan-400">
              {session.address.slice(2, 4).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${roleColorMap[session.role] || roleColorMap.none}`}
                >
                  {roleIconMap[session.role]}
                  {authService.getRoleLabel(session.role)}
                </span>
              </div>
              <p className="text-sm text-white/70 mt-1.5">
                <TruncatedHash value={session.address} />
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b flex dark:border-slate-700">
          <button
            onClick={() => setActiveTab("profile")}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors ${activeTab === "profile" ? "text-blue-700 border-b-2 border-blue-600" : "text-gray-500 hover:text-gray-700"}`}
          >
            {t("account.profile")}
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors ${activeTab === "settings" ? "text-blue-700 border-b-2 border-blue-600" : "text-gray-500 hover:text-gray-700"}`}
          >
            {t("account.settings")}
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === "profile" && (
            <div className="space-y-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">
                  {t("account.wallet")}
                </p>
                <div className="flex items-center gap-2">
                  <TruncatedHash value={session.address} />
                </div>
              </div>

              <div>
                <p className="text-xs text-gray-500 mb-1">
                  {t("account.role")}
                </p>
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {authService.getRoleLabel(session.role)}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {authService.getRoleDescription(session.role)}
                </p>
              </div>

              {session.tenantId && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">
                    {t("account.tenant")}
                  </p>
                  <p className="text-sm text-gray-900 dark:text-gray-100">
                    {session.tenantId}
                  </p>
                </div>
              )}

              <div>
                <p className="text-xs text-gray-500 mb-1">
                  {t("account.connection")}
                </p>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full" />
                  <span className="text-sm text-emerald-700 font-medium">
                    {t("account.connected")}
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t space-y-2 dark:border-slate-700">
                {/* My Documents - available for ALL roles */}
                <button
                  onClick={() => {
                    onClose();
                    onNavigate("my-documents");
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-cyan-700 hover:bg-cyan-50 rounded-lg transition-colors font-medium"
                >
                  <FileText size={14} /> {t("account.myDocuments")}
                </button>
                {/* My Signatures - only for operators */}
                {isOperator && (
                  <button
                    onClick={() => {
                      onClose();
                      onNavigate("my-signed-docs");
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-blue-700 hover:bg-blue-50 rounded-lg transition-colors font-medium"
                  >
                    <PenTool size={14} /> {t("account.mySignatures")}
                  </button>
                )}
                <button
                  onClick={() => {
                    onClose();
                    onNavigate("transactions", {
                      actorFilter: session.address,
                    });
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <ExternalLink size={14} /> {t("account.myTransactions")}
                </button>
                <button
                  onClick={handleDisconnect}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Wallet size={14} /> {t("account.disconnect")}
                </button>
              </div>
            </div>
          )}

          {activeTab === "settings" && (
            <div className="space-y-4">
              <div className="space-y-3">
                <SettingToggle
                  label={t("settings.txNotifications")}
                  description={t("settings.txNotificationsDesc")}
                  defaultChecked={true}
                />
                <SettingToggle
                  label={t("settings.autoRefresh")}
                  description={t("settings.autoRefreshDesc")}
                  defaultChecked={true}
                />
                <SettingToggle
                  label={t("settings.compactView")}
                  description={t("settings.compactViewDesc")}
                  checked={compact}
                  onToggle={() => setCompact(!compact)}
                />
              </div>

              <div className="pt-4 border-t dark:border-slate-700">
                <p className="text-xs text-gray-500 mb-3">
                  {t("settings.display")}
                </p>
                <div className="space-y-3">
                  {/* Theme */}
                  <div className="flex items-center gap-2">
                    {theme === "dark" ? (
                      <Moon size={14} className="text-gray-400" />
                    ) : (
                      <Sun size={14} className="text-gray-400" />
                    )}
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {t("settings.theme")}
                    </span>
                    <div className="ml-auto flex items-center bg-gray-100 dark:bg-slate-700 rounded-lg p-0.5">
                      <button
                        onClick={() => setTheme("light")}
                        className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${theme === "light" ? "bg-white text-blue-700 shadow-sm" : "text-gray-500"}`}
                      >
                        {t("settings.light")}
                      </button>
                      <button
                        onClick={() => setTheme("dark")}
                        className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${theme === "dark" ? "bg-slate-600 text-white shadow-sm" : "text-gray-500"}`}
                      >
                        {t("settings.dark")}
                      </button>
                    </div>
                  </div>
                  {/* Language */}
                  <div className="flex items-center gap-2">
                    <Globe size={14} className="text-gray-400" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {t("settings.language")}
                    </span>
                    <div className="ml-auto flex items-center bg-gray-100 dark:bg-slate-700 rounded-lg p-0.5">
                      <button
                        onClick={() => setLang("en")}
                        className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${lang === "en" ? "bg-white text-blue-700 shadow-sm" : "text-gray-500"}`}
                      >
                        EN
                      </button>
                      <button
                        onClick={() => setLang("vi")}
                        className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${lang === "vi" ? "bg-white text-blue-700 shadow-sm" : "text-gray-500"}`}
                      >
                        VI
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t dark:border-slate-700">
                <p className="text-xs text-gray-500 mb-3">
                  {t("settings.about")}
                </p>
                <div className="space-y-1.5 text-xs text-gray-500">
                  <p>Verzik Demo v2.0</p>
                  <p>Data stored in Supabase database</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SettingToggle({
  label,
  description,
  defaultChecked,
  checked: controlledChecked,
  onToggle,
}: {
  label: string;
  description: string;
  defaultChecked?: boolean;
  checked?: boolean;
  onToggle?: () => void;
}) {
  const [internalChecked, setInternalChecked] = useState(
    defaultChecked ?? false,
  );
  const isChecked =
    controlledChecked !== undefined ? controlledChecked : internalChecked;
  const toggle = onToggle || (() => setInternalChecked(!internalChecked));

  return (
    <div className="flex items-center justify-between py-1">
      <div>
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
          {label}
        </p>
        <p className="text-xs text-gray-500">{description}</p>
      </div>
      <button
        onClick={toggle}
        className={`relative w-10 h-5 rounded-full transition-colors ${isChecked ? "bg-blue-600" : "bg-gray-300"}`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${isChecked ? "translate-x-5" : ""}`}
        />
      </button>
    </div>
  );
}
