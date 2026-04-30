import {
  type CSSProperties,
  type ReactNode,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { Info } from "lucide-react";

interface AppTooltipProps {
  content: ReactNode;
  children: ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  className?: string;
  delayDuration?: number;
}

interface InfoTooltipProps {
  content: ReactNode;
  trigger?: ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  className?: string;
  delayDuration?: number;
}

interface TermTooltipProps {
  term: string;
  description: string;
  side?: "top" | "right" | "bottom" | "left";
}

function cx(...values: Array<string | undefined | false>) {
  return values.filter(Boolean).join(" ");
}

function getOppositeSide(side: "top" | "right" | "bottom" | "left") {
  switch (side) {
    case "top":
      return "bottom";
    case "bottom":
      return "top";
    case "left":
      return "right";
    case "right":
    default:
      return "left";
  }
}

export function AppTooltip({
  content,
  children,
  side = "top",
  className,
  delayDuration = 200,
}: AppTooltipProps) {
  const triggerRef = useRef<HTMLSpanElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [style, setStyle] = useState<CSSProperties>({ opacity: 0 });
  const [resolvedSide, setResolvedSide] = useState(side);

  useEffect(() => {
    setMounted(true);
    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const clearOpenTimeout = () => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const scheduleOpen = () => {
    clearOpenTimeout();
    timeoutRef.current = window.setTimeout(() => {
      setOpen(true);
    }, delayDuration);
  };

  const closeTooltip = () => {
    clearOpenTimeout();
    setOpen(false);
  };

  useLayoutEffect(() => {
    if (!open || !triggerRef.current || !tooltipRef.current) {
      return;
    }

    const updatePosition = () => {
      const gap = 12;
      const padding = 10;
      const triggerRect = triggerRef.current?.getBoundingClientRect();
      const tooltipRect = tooltipRef.current?.getBoundingClientRect();

      if (!triggerRect || !tooltipRect) {
        return;
      }

      const place = (currentSide: "top" | "right" | "bottom" | "left") => {
        switch (currentSide) {
          case "bottom":
            return {
              top: triggerRect.bottom + gap,
              left:
                triggerRect.left + (triggerRect.width - tooltipRect.width) / 2,
            };
          case "left":
            return {
              top:
                triggerRect.top + (triggerRect.height - tooltipRect.height) / 2,
              left: triggerRect.left - tooltipRect.width - gap,
            };
          case "right":
            return {
              top:
                triggerRect.top + (triggerRect.height - tooltipRect.height) / 2,
              left: triggerRect.right + gap,
            };
          case "top":
          default:
            return {
              top: triggerRect.top - tooltipRect.height - gap,
              left:
                triggerRect.left + (triggerRect.width - tooltipRect.width) / 2,
            };
        }
      };

      const fits = (currentSide: "top" | "right" | "bottom" | "left") => {
        const pos = place(currentSide);
        return (
          pos.top >= padding &&
          pos.left >= padding &&
          pos.top + tooltipRect.height <= window.innerHeight - padding &&
          pos.left + tooltipRect.width <= window.innerWidth - padding
        );
      };

      const nextSide = fits(side) ? side : getOppositeSide(side);
      const raw = place(nextSide);
      const maxLeft = window.innerWidth - tooltipRect.width - padding;
      const maxTop = window.innerHeight - tooltipRect.height - padding;

      setResolvedSide(nextSide);

      setStyle({
        top: Math.min(Math.max(padding, raw.top), maxTop),
        left: Math.min(Math.max(padding, raw.left), maxLeft),
        opacity: 1,
      });
    };

    updatePosition();
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);

    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [open, side, content]);

  return (
    <>
      <span
        ref={triggerRef}
        className="inline-flex align-middle"
        onMouseEnter={scheduleOpen}
        onMouseLeave={closeTooltip}
        onFocus={scheduleOpen}
        onBlur={closeTooltip}
      >
        {children}
      </span>
      {mounted &&
        open &&
        createPortal(
          <div
            ref={tooltipRef}
            role="tooltip"
            style={style}
            className="pointer-events-none fixed z-[90]"
          >
            <div
              className={cx(
                "relative max-w-[240px] rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-[11px] font-medium leading-5 text-slate-600 shadow-xl shadow-slate-900/10 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:shadow-black/30",
                className,
              )}
            >
              <span
                className={cx(
                  "absolute h-2.5 w-2.5 rotate-45 border bg-white dark:border-slate-700 dark:bg-slate-900",
                  resolvedSide === "top" &&
                    "-bottom-[5px] left-1/2 -translate-x-1/2 border-l-0 border-t-0",
                  resolvedSide === "bottom" &&
                    "-top-[5px] left-1/2 -translate-x-1/2 border-r-0 border-b-0",
                  resolvedSide === "left" &&
                    "-right-[5px] top-1/2 -translate-y-1/2 border-l-0 border-b-0",
                  resolvedSide === "right" &&
                    "-left-[5px] top-1/2 -translate-y-1/2 border-r-0 border-t-0",
                )}
              />
              {typeof content === "string" ? <p>{content}</p> : content}
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}

export function InfoTooltip({
  content,
  trigger,
  side = "top",
  className,
  delayDuration = 200,
}: InfoTooltipProps) {
  return (
    <AppTooltip
      content={content}
      side={side}
      className={className}
      delayDuration={delayDuration}
    >
      {trigger ?? (
        <span className="inline-flex items-center cursor-help text-slate-400 hover:text-slate-600 transition-colors dark:text-slate-500 dark:hover:text-slate-300">
          <Info className="h-3.5 w-3.5" />
        </span>
      )}
    </AppTooltip>
  );
}

export function TermTooltip({
  term,
  description,
  side = "top",
}: TermTooltipProps) {
  return (
    <InfoTooltip
      content={description}
      side={side}
      trigger={
        <span className="inline-flex items-center gap-1 cursor-help text-blue-600 dark:text-blue-400">
          {term}
          <Info className="h-3 w-3 text-slate-400 dark:text-slate-500" />
        </span>
      }
    />
  );
}
