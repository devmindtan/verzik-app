import { Select } from "@mantine/core";

interface AppSelectOption {
  value: string;
  label: string;
}

interface AppSelectProps {
  value: string;
  onChange: (value: string) => void;
  data: AppSelectOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function AppSelect({
  value,
  onChange,
  data,
  placeholder,
  disabled,
  className,
}: AppSelectProps) {
  return (
    <Select
      value={value}
      onChange={(next: string | null) => onChange(next ?? "")}
      data={data}
      placeholder={placeholder}
      disabled={disabled}
      size="sm"
      radius="md"
      comboboxProps={{ withinPortal: true, zIndex: 1200 }}
      className={className}
      styles={{
        input: {
          fontSize: "0.875rem",
          transition: "all 160ms ease",
        },
      }}
    />
  );
}
