"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Pencil, Trash2, Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Actions de ligne : publier/dépublier, éditer, supprimer. */
export function RowActions({
  id,
  resource,
  isPublished,
  editHref,
  deleteLabel = "cet élément",
}: {
  id: string;
  resource: "products" | "collections";
  isPublished: boolean;
  editHref: string;
  deleteLabel?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function togglePublish() {
    setBusy(true);
    await fetch(`/api/admin/${resource}/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPublished: !isPublished }),
    });
    router.refresh();
    setBusy(false);
  }

  async function remove() {
    if (!confirm(`Supprimer définitivement ${deleteLabel} ?`)) return;
    setBusy(true);
    await fetch(`/api/admin/${resource}/${id}`, { method: "DELETE" });
    router.refresh();
    setBusy(false);
  }

  return (
    <div className="flex items-center justify-end gap-1">
      {busy ? (
        <Loader2 className="mx-2 h-4 w-4 animate-spin text-muted" />
      ) : (
        <>
          <Button
            variant="ghost"
            size="icon"
            onClick={togglePublish}
            title={isPublished ? "Dépublier" : "Publier"}
            aria-label={isPublished ? "Dépublier" : "Publier"}
          >
            {isPublished ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
          <Link href={editHref}>
            <Button variant="ghost" size="icon" title="Modifier" aria-label="Modifier">
              <Pencil className="h-4 w-4" />
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={remove}
            title="Supprimer"
            aria-label="Supprimer"
          >
            <Trash2 className="h-4 w-4 text-red-600" />
          </Button>
        </>
      )}
    </div>
  );
}
