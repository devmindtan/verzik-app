import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface TruncatedHashProps {
  value: string;
  maxLength?: number;
  className?: string;
}

export function TruncatedHash({ value, maxLength = 14, className = '' }: TruncatedHashProps) {
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
      <span className="font-mono" title={value}>{display}</span>
      <button
        onClick={handleCopy}
        className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 text-gray-400 hover:text-blue-600 rounded"
        title="Copy full value"
      >
        {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
      </button>
    </span>
  );
}
