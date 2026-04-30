import { useState, useEffect } from "react";
import { ArrowUp } from "lucide-react";
import { AppTooltip } from "./Tooltip";

export function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  return (
    <AppTooltip content="Back to top" side="left">
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className="fixed bottom-6 right-6 z-50 w-10 h-10 bg-blue-400 hover:bg-blue-500 text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110"
        aria-label="Back to top"
      >
        <ArrowUp size={18} />
      </button>
    </AppTooltip>
  );
}
