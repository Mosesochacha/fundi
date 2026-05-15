export function getInputStyles(
  error?: string,
  isSuccess?: boolean,
  focused?: boolean,
) {
  const border = error
    ? "border-error"
    : isSuccess
      ? "border-[#22c55e]"
      : focused
        ? "border-[#f97316]"
        : "border-gray-200";

  const bg = error
    ? "bg-coral-lt"
    : isSuccess
      ? "bg-[#f0fdf4]"
      : focused
        ? "bg-[#fff7ed]"
        : "bg-white";

  const shadow = error
    ? undefined
    : isSuccess
      ? "0 0 0 3px rgba(34,197,94,0.12)"
      : focused
        ? "0 0 0 3px rgba(249,115,22,0.12)"
        : undefined;

  return { border, bg, shadow };
}
