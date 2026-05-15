"use client";

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (value: boolean) => void;
  loading?: boolean;
  disabled?: boolean;
  label: string;
}

export default function ToggleSwitch({ checked, onChange, loading = false, disabled = false, label }: ToggleSwitchProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === " " && !disabled && !loading) {
      e.preventDefault();
      onChange(!checked);
    }
  };

  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled || loading}
      onClick={() => !loading && onChange(!checked)}
      onKeyDown={handleKeyDown}
      className="relative shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f97316] focus-visible:ring-offset-2 rounded-full disabled:opacity-50"
      style={{ width: 44, height: 24 }}
    >
      {/* Track */}
      <span
        style={{
          display: "block",
          width: 44,
          height: 24,
          borderRadius: 12,
          background: checked ? "#f97316" : "#d1d5db",
          transition: "background 200ms ease",
        }}
      />
      {/* Thumb */}
      <span
        style={{
          position: "absolute",
          top: 2,
          left: checked ? 22 : 2,
          width: 20,
          height: 20,
          borderRadius: "50%",
          background: "white",
          boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
          transition: "left 200ms ease",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {loading && (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" style={{ animation: "spin 0.8s linear infinite" }}>
            <circle cx="12" cy="12" r="10" stroke="#f97316" strokeWidth="3" strokeLinecap="round" strokeDasharray="32" strokeDashoffset="12" />
          </svg>
        )}
      </span>
    </button>
  );
}
