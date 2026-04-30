import {
  Shield,
  FileCheck,
  Users,
  BookOpen,
  ArrowRight,
  Wallet,
  Building2,
} from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";

interface HomePageProps {
  onNavigate: (page: string) => void;
}

export function HomePage({ onNavigate }: HomePageProps) {
  const { lang, setLang, t } = useLanguage();

  return (
    <div className="min-h-[100dvh] bg-slate-950 text-white flex flex-col overflow-x-clip">
      {/* Hero */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-transparent to-cyan-600/10" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-to-b from-blue-500/10 to-transparent rounded-full blur-3xl" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-4">
          <nav className="flex items-center justify-between mb-16">
            <div className="flex items-center gap-1">
              {/* Container bọc Logo */}
              <div className="w-10 h-10 flex items-center justify-center overflow-hidden">
                {/* Thay 'logo.png' bằng tên file thật của bạn trong thư mục public */}
                <img
                  src="/verzik.svg"
                  alt="Verzik Logo"
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="font-bold text-xl">Verzik</span>
            </div>
            <div className="flex items-center gap-3">
              {/* Language toggle */}
              <div className="flex items-center bg-white/5 border border-white/10 rounded-lg p-0.5">
                <button
                  onClick={() => setLang("en")}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${lang === "en" ? "bg-white/15 text-white" : "text-slate-400 hover:text-white"}`}
                >
                  EN
                </button>
                <button
                  onClick={() => setLang("vi")}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${lang === "vi" ? "bg-white/15 text-white" : "text-slate-400 hover:text-white"}`}
                >
                  VI
                </button>
              </div>
              <button
                onClick={() => onNavigate("documentation")}
                className="text-sm text-slate-400 hover:text-white transition-colors"
              >
                {t("nav.docs")}
              </button>
              <button
                onClick={() => onNavigate("verify")}
                className="text-sm text-slate-400 hover:text-white transition-colors"
              >
                {t("nav.verify")}
              </button>
              <button
                onClick={() => onNavigate("transactions")}
                className="text-sm text-slate-400 hover:text-white transition-colors"
              >
                {t("nav.explorer")}
              </button>
              <button
                onClick={() => onNavigate("dashboard")}
                className="bg-cyan-600 hover:bg-cyan-700 px-4 py-2 rounded-lg font-semibold text-sm transition-colors"
              >
                {t("nav.launch")}
              </button>
            </div>
          </nav>

          <div className="text-center max-w-3xl mx-auto pb-20">
            <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 text-sm text-slate-300 mb-8">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              {t("home.badge")}
            </div>
            <h1 className="text-5xl sm:text-6xl font-bold tracking-tight mb-6">
              <span className="bg-gradient-to-r from-white via-blue-100 to-cyan-200 bg-clip-text text-transparent">
                {t("home.title1")}
              </span>
              <br />
              <span className="text-slate-400">{t("home.title2")}</span>
            </h1>
            <p className="text-lg text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
              {t("home.desc")}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => onNavigate("dashboard")}
                className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 px-8 py-3.5 rounded-xl font-bold text-base transition-all shadow-lg shadow-blue-500/25"
              >
                {t("home.launch")} <ArrowRight size={18} />
              </button>
              <button
                onClick={() => onNavigate("documentation")}
                className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 px-8 py-3.5 rounded-xl font-semibold text-base transition-colors"
              >
                <BookOpen size={18} /> {t("home.readDocs")}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Features */}
      <section className="bg-slate-900/50 border-y border-white/5">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold mb-3">{t("home.pillars")}</h2>
            <p className="text-slate-400 max-w-xl mx-auto">
              {t("home.pillarsDesc")}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FeatureCard
              icon={<Building2 size={24} />}
              title={t("home.tenantAdmin")}
              description={t("home.tenantAdminDesc")}
              color="blue"
            />
            <FeatureCard
              icon={<Users size={24} />}
              title={t("home.opManager")}
              description={t("home.opManagerDesc")}
              color="emerald"
            />
            <FeatureCard
              icon={<Wallet size={24} />}
              title={t("home.treasury")}
              description={t("home.treasuryDesc")}
              color="amber"
            />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold mb-3">{t("home.howItWorks")}</h2>
          <p className="text-slate-400 max-w-xl mx-auto">
            {t("home.howItWorksDesc")}
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StepCard
            step={1}
            title={t("home.step1")}
            description={t("home.step1Desc")}
          />
          <StepCard
            step={2}
            title={t("home.step2")}
            description={t("home.step2Desc")}
          />
          <StepCard
            step={3}
            title={t("home.step3")}
            description={t("home.step3Desc")}
          />
          <StepCard
            step={4}
            title={t("home.step4")}
            description={t("home.step4Desc")}
          />
        </div>
      </section>

      {/* Public features */}
      <section className="bg-slate-900/50 border-y border-white/5">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold mb-3">
              {t("home.publicFeatures")}
            </h2>
            <p className="text-slate-400 max-w-xl mx-auto">
              {t("home.publicFeaturesDesc")}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <button
              onClick={() => onNavigate("transactions")}
              className="text-left bg-white/5 hover:bg-white/8 border border-white/10 rounded-xl p-6 transition-colors group"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <Shield size={20} className="text-blue-400" />
                </div>
                <h3 className="font-bold text-lg group-hover:text-cyan-400 transition-colors">
                  {t("home.txExplorer")}
                </h3>
              </div>
              <p className="text-slate-400 text-sm">
                {t("home.txExplorerDesc")}
              </p>
            </button>
            <button
              onClick={() => onNavigate("verify")}
              className="text-left bg-white/5 hover:bg-white/8 border border-white/10 rounded-xl p-6 transition-colors group"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                  <FileCheck size={20} className="text-emerald-400" />
                </div>
                <h3 className="font-bold text-lg group-hover:text-cyan-400 transition-colors">
                  {t("home.docVerify")}
                </h3>
              </div>
              <p className="text-slate-400 text-sm">
                {t("home.docVerifyDesc")}
              </p>
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-white/5">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-500">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-cyan-400 rounded flex items-center justify-center text-slate-900 font-bold text-[10px]">
              VP
            </div>
            <span>Verzil Demo v2.0</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => onNavigate("documentation")}
              className="hover:text-white transition-colors"
            >
              {t("nav.docs")}
            </button>
            <button
              onClick={() => onNavigate("verify")}
              className="hover:text-white transition-colors"
            >
              {t("nav.verify")}
            </button>
            <button
              onClick={() => onNavigate("transactions")}
              className="hover:text-white transition-colors"
            >
              {t("nav.explorer")}
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
  color,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
}) {
  const colorMap: Record<string, { bg: string; border: string; icon: string }> =
    {
      blue: {
        bg: "bg-blue-500/10",
        border: "border-blue-500/20",
        icon: "text-blue-400",
      },
      emerald: {
        bg: "bg-emerald-500/10",
        border: "border-emerald-500/20",
        icon: "text-emerald-400",
      },
      amber: {
        bg: "bg-amber-500/10",
        border: "border-amber-500/20",
        icon: "text-amber-400",
      },
    };
  const c = colorMap[color] || colorMap.blue;
  return (
    <div className={`${c.bg} border ${c.border} rounded-xl p-6`}>
      <div className={`${c.icon} mb-4`}>{icon}</div>
      <h3 className="font-bold text-lg mb-2">{title}</h3>
      <p className="text-slate-400 text-sm leading-relaxed">{description}</p>
    </div>
  );
}

function StepCard({
  step,
  title,
  description,
}: {
  step: number;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-5 text-center">
      <div className="w-8 h-8 bg-cyan-500/20 rounded-full flex items-center justify-center text-cyan-400 font-bold text-sm mx-auto mb-3">
        {step}
      </div>
      <h3 className="font-bold mb-1.5">{title}</h3>
      <p className="text-slate-400 text-xs leading-relaxed">{description}</p>
    </div>
  );
}
