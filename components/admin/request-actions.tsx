"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { REQUEST_STATUS_LABELS } from "@/lib/admin";

export function RequestActions({
  id,
  kind,
  status,
  note,
}: {
  id: string;
  kind: "contact" | "customization";
  status: string;
  note: string | null;
}) {
  const router = useRouter();
  const [draftNote, setDraftNote] = useState(note ?? "");
  const [busy, setBusy] = useState(false);

  async function update(next: { status?: string; note?: string }) {
    setBusy(true);
    await fetch(`/api/admin/requests/${id}?kind=${kind}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: next.status ?? status,
        note: next.note ?? draftNote,
      }),
    });
    router.refresh();
    setBusy(false);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select
        value={status}
        onChange={(e) => update({ status: e.target.value })}
        disabled={busy}
        className="h-9 w-44 text-xs"
        aria-label="Statut de la demande"
      >
        {Object.entries(REQUEST_STATUS_LABELS).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </Select>
      <Input
        value={draftNote}
        onChange={(e) => setDraftNote(e.target.value)}
        placeholder="Note interne…"
        className="h-9 w-52 text-xs"
        aria-label="Note interne"
      />
      <Button
        size="sm"
        variant="outline"
        disabled={busy}
        onClick={() => update({})}
        className="h-9"
      >
        {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "OK"}
      </Button>
    </div>
  );
}
