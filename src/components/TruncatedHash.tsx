import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { AppTooltip } from "./Tooltip";

interface TruncatedHashProps {
  value: string;
  maxLength?: number;
  className?: string;
  disableCopy?: boolean;
}

export function TruncatedHash({
  value,
  maxLength = 14,
  className = "",
  disableCopy = false,
}: TruncatedHashProps) {
  const [copied, setCopied] = useState(false);

  if (!value) return null;

  const needsTruncation = value.length > maxLength;
  const display = needsTruncation
    ? `${value.slice(0, 6)}...${value.slice(-4)}`
    : value;

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <span className={`inline-flex items-center gap-1 group ${className}`}>
      <AppTooltip content={value}>
        <span className="font-mono">{display}</span>
      </AppTooltip>
      {!disableCopy && (
        <AppTooltip content={copied ? "Copied" : "Copy full value"}>
          <button
            type="button"
            onClick={handleCopy}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 text-gray-400 hover:text-blue-600 rounded"
            aria-label="Copy full value"
          >
            {copied ? (
              <Check size={12} className="text-emerald-500" />
            ) : (
              <Copy size={12} />
            )}
          </button>
        </AppTooltip>
      )}
    </span>
  );
}
