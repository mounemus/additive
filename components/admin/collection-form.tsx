"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { SeoFields } from "@/components/admin/seo-fields";
import { MediaUploader } from "@/components/admin/media-uploader";
import { slugify } from "@/lib/utils";
import type { CollectionInput } from "@/lib/validations";

export function CollectionForm({
  collectionId,
  initial,
}: {
  collectionId?: string;
  initial?: Partial<CollectionInput>;
}) {
  const router = useRouter();
  const [state, setState] = useState<CollectionInput>({
    name: initial?.name ?? "",
    slug: initial?.slug ?? "",
    tagline: initial?.tagline ?? "",
    description: initial?.description ?? "",
    image: initial?.image ?? "",
    video: initial?.video ?? "",
    order: initial?.order ?? 0,
    isPublished: initial?.isPublished ?? false,
    seoTitle: initial?.seoTitle ?? "",
    seoDescription: initial?.seoDescription ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof CollectionInput>(key: K, value: CollectionInput[K]) {
    setState((s) => ({ ...s, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(
        collectionId
          ? `/api/admin/collections/${collectionId}`
          : "/api/admin/collections",
        {
          method: collectionId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(state),
        }
      );
      if (!res.ok) throw new Error("Enregistrement impossible.");
      router.push("/admin/collections");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inattendue.");
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="max-w-3xl space-y-8">
      <fieldset className="space-y-5 rounded-2xl border border-border p-6">
        <legend className="px-2 text-sm font-semibold">Informations</legend>
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name">Nom *</Label>
            <Input
              id="name"
              value={state.name}
              onChange={(e) => {
                set("name", e.target.value);
                if (!collectionId) set("slug", slugify(e.target.value));
              }}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="slug">Slug *</Label>
            <Input
              id="slug"
              value={state.slug}
              onChange={(e) => set("slug", e.target.value)}
              required
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="tagline">Accroche</Label>
          <Input
            id="tagline"
            value={state.tagline ?? ""}
            onChange={(e) => set("tagline", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            rows={5}
            value={state.description ?? ""}
            onChange={(e) => set("description", e.target.value)}
          />
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="video">URL vidéo (optionnel)</Label>
            <Input
              id="video"
              value={state.video ?? ""}
              onChange={(e) => set("video", e.target.value)}
              placeholder="https://…"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="order">Ordre d’affichage</Label>
            <Input
              id="order"
              type="number"
              value={state.order}
              onChange={(e) => set("order", Number(e.target.value))}
            />
          </div>
        </div>
      </fieldset>

      <fieldset className="space-y-4 rounded-2xl border border-border p-6">
        <legend className="px-2 text-sm font-semibold">Image de couverture</legend>
        {state.image && (
          <p className="break-all rounded-lg bg-foreground/5 p-3 text-xs text-muted">
            {state.image}
          </p>
        )}
        <MediaUploader onUploaded={(url) => set("image", url)} />
      </fieldset>

      <SeoFields
        title={state.seoTitle ?? ""}
        description={state.seoDescription ?? ""}
        onTitleChange={(v) => set("seoTitle", v)}
        onDescriptionChange={(v) => set("seoDescription", v)}
      />

      <div className="flex items-center justify-between rounded-2xl border border-border p-6">
        <Label htmlFor="isPublished">Collection publiée</Label>
        <Switch
          id="isPublished"
          checked={state.isPublished}
          onCheckedChange={(v) => set("isPublished", v)}
        />
      </div>

      {error && <p className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>}

      <div className="flex gap-3">
        <Button type="submit" disabled={saving} className="gap-2">
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          {collectionId ? "Enregistrer" : "Créer la collection"}
        </Button>
        <Button type="button" variant="ghost" onClick={() => router.back()}>
          Annuler
        </Button>
      </div>
    </form>
  );
}
