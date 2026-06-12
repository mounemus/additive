import { cn } from "@/lib/utils";

const COLOR_MAP: Record<string, string> = {
  black: "#111111",
  white: "#f5f5f2",
  blue: "#1f6fff",
  red: "#e23b2e",
  orange: "#ff6a2a",
  grey: "#9a9a96",
  gray: "#9a9a96",
  silver: "#d8d8d4",
  green: "#2e8b57",
};

export function ColorDots({
  colors,
  className,
  size = "sm",
}: {
  colors: string[];
  className?: string;
  size?: "sm" | "md";
}) {
  if (!colors.length) return null;
  return (
    <div className={cn("flex items-center gap-1.5", className)} aria-label={`Coloris : ${colors.join(", ")}`}>
      {colors.map((c) => (
        <span
          key={c}
          title={c}
          className={cn(
            "rounded-full ring-1 ring-black/10",
            size === "sm" ? "h-3 w-3" : "h-5 w-5"
          )}
          style={{ backgroundColor: COLOR_MAP[c.toLowerCase()] ?? "#cccccc" }}
        />
      ))}
    </div>
  );
}
