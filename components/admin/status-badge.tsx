import { Badge } from "@/components/ui/badge";

const STATUS_CONFIG: Record<
  string,
  { label: string; variant: "blue" | "warning" | "success" | "muted" }
> = {
  new: { label: "Nouveau", variant: "blue" },
  in_progress: { label: "En traitement", variant: "warning" },
  answered: { label: "Répondu", variant: "success" },
  archived: { label: "Archivé", variant: "muted" },
  published: { label: "Publié", variant: "success" },
  draft: { label: "Brouillon", variant: "muted" },
};

export function StatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] ?? { label: status, variant: "muted" as const };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
