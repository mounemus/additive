import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Table back-office sobre et responsive (présentation uniquement). */
export function DataTable({
  headers,
  children,
  className,
}: {
  headers: string[];
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("overflow-x-auto rounded-2xl border border-border bg-surface", className)}>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left">
            {headers.map((h) => (
              <th
                key={h}
                className="whitespace-nowrap px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-muted"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">{children}</tbody>
      </table>
    </div>
  );
}

export function EmptyRow({ colSpan, message }: { colSpan: number; message: string }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-5 py-12 text-center text-muted">
        {message}
      </td>
    </tr>
  );
}
