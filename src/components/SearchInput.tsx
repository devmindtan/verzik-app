import { Search, X } from "lucide-react";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  className?: string;
}

export function SearchInput({
  value,
  onChange,
  placeholder,
  className = "",
}: SearchInputProps) {
  return (
    <div className={`relative ${className}`.trim()}>
      <Search
        size={16}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
      />
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full pl-9 pr-10 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 rounded"
          aria-label="Clear search"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}
