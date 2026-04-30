import type { ReactNode } from "react";
import { createPortal } from "react-dom";

interface AppModalProps {
  title: ReactNode;
  children: ReactNode;
  onClose: () => void;
  width?: "md" | "lg" | "xl" | "3xl";
  headerClassName?: string;
}

const widthClassMap: Record<NonNullable<AppModalProps["width"]>, string> = {
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "3xl": "max-w-3xl",
};

export function AppModal({
  title,
  children,
  onClose,
  width = "md",
  headerClassName = "",
}: AppModalProps) {
  const modal = (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/45 backdrop-blur-sm p-4 sm:p-6 dark:bg-black/70"
      onClick={onClose}
    >
      <div
        className={`w-full ${widthClassMap[width]} max-h-[calc(100dvh-2rem)] sm:max-h-[calc(100dvh-3rem)] flex flex-col overflow-hidden rounded-xl border border-white/70 bg-white/95 shadow-2xl dark:border-slate-700/80 dark:bg-slate-900/95`}
        onClick={(event) => event.stopPropagation()}
      >
        <div
          className={`px-6 py-4 border-b border-slate-200 flex items-center justify-between flex-shrink-0 dark:border-slate-700 ${headerClassName}`.trim()}
        >
          <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none transition-colors dark:text-slate-500 dark:hover:text-slate-200"
            aria-label="Close modal"
          >
            &times;
          </button>
        </div>
        <div className="p-6 overflow-y-auto text-gray-700 dark:text-slate-200">
          {children}
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
