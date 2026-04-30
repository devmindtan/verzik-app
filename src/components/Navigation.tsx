import { Menu, X, User, PanelRightOpen, LogIn, Search } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { AppTooltip } from "./Tooltip";
import { TruncatedHash } from "./TruncatedHash";

interface NavItem {
  label: string;
  href: string;
}

interface NavigationProps {
  currentPage: string;
  onNavigate: (page: string, options?: { actorFilter?: string }) => void;
  navItems: NavItem[];
  onOpenSidebar?: () => void;
  onOpenAccount?: () => void;
  onOpenSearch?: () => void;
}

export function Navigation({
  currentPage,
  onNavigate,
  navItems,
  onOpenSidebar,
  onOpenAccount,
  onOpenSearch,
}: NavigationProps) {
  const { session } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="bg-gradient-to-r from-slate-900 to-slate-800 text-white shadow-lg sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14">
          <div
            className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition"
            onClick={() => onNavigate("home")}
          >
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-lg flex items-center justify-center font-bold text-slate-900 text-xs">
              VP
            </div>
            <span className="font-bold text-base hidden sm:inline">Verzik</span>
          </div>

          <div className="hidden md:flex items-center gap-0.5">
            {navItems.map((item) => (
              <button
                key={item.href}
                onClick={() => onNavigate(item.href)}
                className={`px-2.5 py-1.5 rounded-lg transition-colors text-xs font-medium ${
                  currentPage === item.href
                    ? "bg-white/15 text-white font-semibold"
                    : "text-slate-300 hover:bg-white/10 hover:text-white"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {/* Quick search button */}
            <AppTooltip content="Quick Search (Ctrl+K)">
              <button
                onClick={onOpenSearch}
                className="hidden sm:flex items-center gap-2 bg-white/8 hover:bg-white/15 border border-white/10 rounded-lg px-3 py-1.5 transition-colors text-slate-400 hover:text-white"
                aria-label="Quick Search"
              >
                <Search size={13} />
                <span className="text-xs">Search…</span>
                <kbd className="text-[10px] font-mono bg-white/10 px-1 py-0.5 rounded border border-white/10 leading-none">
                  ⌃K
                </kbd>
              </button>
            </AppTooltip>
            <AppTooltip content="Search">
              <button
                onClick={onOpenSearch}
                className="sm:hidden p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                aria-label="Search"
              >
                <Search size={16} />
              </button>
            </AppTooltip>
            <>
              <AppTooltip content="Account & Settings">
                <button
                  onClick={onOpenAccount}
                  className="flex items-center gap-1.5 bg-white/10 hover:bg-white/15 rounded-lg px-2.5 py-1.5 transition-colors"
                  aria-label="Account & Settings"
                >
                  <User size={14} className="text-cyan-400" />
                  <span className="hidden sm:inline text-xs text-slate-300 font-medium max-w-[110px] truncate">
                    {session?.isConnected ? (
                      <TruncatedHash value={session.address} disableCopy />
                    ) : (
                      "Guest"
                    )}
                  </span>
                </button>
              </AppTooltip>
              <AppTooltip content="Quick Panel">
                <button
                  onClick={onOpenSidebar}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                  aria-label="Quick Panel"
                >
                  <PanelRightOpen size={16} />
                </button>
              </AppTooltip>
            </>
            {!session?.isConnected && (
              <button
                onClick={() => onNavigate("login")}
                className="flex items-center gap-1 bg-cyan-600 hover:bg-cyan-700 px-3 py-1.5 rounded-lg transition-colors font-semibold text-xs"
              >
                <LogIn size={12} />
                <span className="hidden sm:inline">Login</span>
              </button>
            )}
            <button
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden pb-3 border-t border-white/10">
            {navItems.map((item) => (
              <button
                key={item.href}
                onClick={() => {
                  onNavigate(item.href);
                  setMobileMenuOpen(false);
                }}
                className={`block w-full text-left px-3 py-2 rounded-lg transition-colors text-sm ${
                  currentPage === item.href
                    ? "bg-white/15 text-white font-semibold"
                    : "text-slate-300 hover:bg-white/10"
                }`}
              >
                {item.label}
              </button>
            ))}
            {!session?.isConnected && (
              <button
                onClick={() => {
                  onNavigate("login");
                  setMobileMenuOpen(false);
                }}
                className="block w-full text-left px-3 py-2 rounded-lg transition-colors text-sm text-cyan-400 hover:bg-white/10 font-semibold"
              >
                Login
              </button>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
