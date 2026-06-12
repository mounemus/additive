"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Trash2, Copy, Check, Film, FileBox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { MediaUploader } from "@/components/admin/media-uploader";
import { formatDate } from "@/lib/utils";

type Asset = {
  id: string;
  url: string;
  alt: string | null;
  kind: string;
  createdAt: string | Date;
};

const KINDS = [
  { value: "image", label: "Image produit" },
  { value: "video", label: "Vidéo" },
  { value: "render3d", label: "Rendu 3D" },
  { value: "texture", label: "Texture" },
  { value: "moodboard", label: "Moodboard" },
  { value: "autre", label: "Autre" },
];

export function MediaManager({ assets }: { assets: Asset[] }) {
  const router = useRouter();
  const [kind, setKind] = useState("image");
  const [copied, setCopied] = useState<string | null>(null);

  async function addAsset(url: string) {
    await fetch("/api/admin/media", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url, kind }),
    });
    router.refresh();
  }

  async function removeAsset(id: string) {
    if (!confirm("Supprimer ce média de la bibliothèque ?")) return;
    await fetch(`/api/admin/media/${id}`, { method: "DELETE" });
    router.refresh();
  }

  function copyUrl(url: string) {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(url);
      setTimeout(() => setCopied(null), 1500);
    });
  }

  return (
    <div className="space-y-8">
      <div className="max-w-xl space-y-4 rounded-2xl border border-border bg-surface p-6">
        <div className="space-y-2">
          <label htmlFor="kind" className="text-sm font-medium">
            Type de média
          </label>
          <Select id="kind" value={kind} onChange={(e) => setKind(e.target.value)}>
            {KINDS.map((k) => (
              <option key={k.value} value={k.value}>
                {k.label}
              </option>
            ))}
          </Select>
        </div>
        <MediaUploader onUploaded={addAsset} />
      </div>

      {assets.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-12 text-center text-muted">
          Bibliothèque vide. Ajoutez vos images produits, rendus 3D, textures et
          moodboards ci-dessus.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {assets.map((a) => (
            <div
              key={a.id}
              className="group overflow-hidden rounded-2xl border border-border bg-surface"
            >
              <div className="relative aspect-[4/3] bg-foreground/5">
                {a.kind === "video" ? (
                  <div className="flex h-full items-center justify-center">
                    <Film className="h-9 w-9 text-muted" />
                  </div>
                ) : a.kind === "render3d" ? (
                  <div className="flex h-full items-center justify-center">
                    <FileBox className="h-9 w-9 text-muted" />
                  </div>
                ) : (
                  <Image
                    src={a.url}
                    alt={a.alt ?? ""}
                    fill
                    sizes="(max-width: 1024px) 50vw, 25vw"
                    className="object-cover"
                  />
                )}
                <Badge variant="muted" className="absolute left-3 top-3 bg-black/40 text-white">
                  {KINDS.find((k) => k.value === a.kind)?.label ?? a.kind}
                </Badge>
              </div>
              <div className="flex items-center justify-between gap-2 p-3">
                <p className="truncate text-xs text-muted" title={a.url}>
                  {formatDate(a.createdAt)}
                </p>
                <div className="flex shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => copyUrl(a.url)}
                    title="Copier l’URL"
                    aria-label="Copier l’URL"
                  >
                    {copied === a.url ? (
                      <Check className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeAsset(a.id)}
                    title="Supprimer"
                    aria-label="Supprimer"
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
