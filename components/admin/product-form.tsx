"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Loader2, Trash2, GripVertical, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ListInput } from "@/components/admin/list-input";
import { SeoFields } from "@/components/admin/seo-fields";
import { MediaUploader } from "@/components/admin/media-uploader";
import { Model3DViewer } from "@/components/product/model-3d-viewer";
import { slugify } from "@/lib/utils";
import type { ProductInput } from "@/lib/validations";

type ProductFormProps = {
  collections: { id: string; name: string }[];
  productId?: string;
  initial?: Partial<ProductInput>;
};

export function ProductForm({ collections, productId, initial }: ProductFormProps) {
  const router = useRouter();
  const [state, setState] = useState<ProductInput>({
    name: initial?.name ?? "",
    slug: initial?.slug ?? "",
    shortDescription: initial?.shortDescription ?? "",
    description: initial?.description ?? "",
    shortDescriptionEn: initial?.shortDescriptionEn ?? "",
    descriptionEn: initial?.descriptionEn ?? "",
    price: initial?.price ?? null,
    currency: initial?.currency ?? "CAD",
    collectionId: initial?.collectionId ?? "",
    colors: initial?.colors ?? [],
    materials: initial?.materials ?? [],
    dimensions: initial?.dimensions ?? "",
    features: initial?.features ?? [],
    images: initial?.images ?? [],
    model3dUrl: initial?.model3dUrl ?? "",
    variants: initial?.variants ?? [],
    customizable: initial?.customizable ?? true,
    isFeatured: initial?.isFeatured ?? false,
    isPublished: initial?.isPublished ?? false,
    seoTitle: initial?.seoTitle ?? "",
    seoDescription: initial?.seoDescription ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof ProductInput>(key: K, value: ProductInput[K]) {
    setState((s) => ({ ...s, [key]: value }));
  }

  // ── Déclinaisons (groupes de variantes type WooCommerce) ──────────────────
  const variants = state.variants;
  function setVariants(next: ProductInput["variants"]) {
    set("variants", next);
  }
  function addGroup() {
    if (variants.length >= 6) return;
    setVariants([...variants, { name: "", values: [{ label: "" }] }]);
  }
  function removeGroup(gi: number) {
    setVariants(variants.filter((_, i) => i !== gi));
  }
  function renameGroup(gi: number, name: string) {
    setVariants(variants.map((g, i) => (i === gi ? { ...g, name } : g)));
  }
  function addValue(gi: number) {
    setVariants(
      variants.map((g, i) =>
        i === gi && g.values.length < 12
          ? { ...g, values: [...g.values, { label: "" }] }
          : g
      )
    );
  }
  function removeValue(gi: number, vi: number) {
    setVariants(
      variants.map((g, i) =>
        i === gi ? { ...g, values: g.values.filter((_, j) => j !== vi) } : g
      )
    );
  }
  function setValueLabel(gi: number, vi: number, label: string) {
    setVariants(
      variants.map((g, i) =>
        i === gi
          ? { ...g, values: g.values.map((v, j) => (j === vi ? { ...v, label } : v)) }
          : g
      )
    );
  }
  function setValueDelta(gi: number, vi: number, raw: string) {
    const priceDelta = raw === "" ? undefined : Number(raw);
    setVariants(
      variants.map((g, i) =>
        i === gi
          ? {
              ...g,
              values: g.values.map((v, j) =>
                j === vi ? { ...v, priceDelta } : v
              ),
            }
          : g
      )
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(
        productId ? `/api/admin/products/${productId}` : "/api/admin/products",
        {
          method: productId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(state),
        }
      );
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(
          data?.issues
            ? Object.values(data.issues as Record<string, string[]>).flat().join(" · ")
            : "Enregistrement impossible."
        );
      }
      router.push("/admin/products");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inattendue.");
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-8 xl:grid-cols-[1.6fr_1fr]">
      <div className="space-y-8">
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
                  if (!productId) set("slug", slugify(e.target.value));
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
            <Label htmlFor="shortDescription">Description courte</Label>
            <Textarea
              id="shortDescription"
              rows={2}
              value={state.shortDescription ?? ""}
              onChange={(e) => set("shortDescription", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description longue</Label>
            <Textarea
              id="description"
              rows={6}
              value={state.description ?? ""}
              onChange={(e) => set("description", e.target.value)}
            />
          </div>
          {/* Traductions EN optionnelles : vides = repli sur le français. */}
          <div className="space-y-2">
            <Label htmlFor="shortDescriptionEn">Description courte (EN)</Label>
            <Textarea
              id="shortDescriptionEn"
              rows={2}
              value={state.shortDescriptionEn ?? ""}
              onChange={(e) => set("shortDescriptionEn", e.target.value)}
              placeholder="Optionnel — affichée sur les pages /en"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="descriptionEn">Description (EN)</Label>
            <Textarea
              id="descriptionEn"
              rows={6}
              value={state.descriptionEn ?? ""}
              onChange={(e) => set("descriptionEn", e.target.value)}
              placeholder="Optionnel — affichée sur les pages /en"
            />
          </div>
          <div className="grid gap-5 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="price">Prix</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={state.price ?? ""}
                onChange={(e) =>
                  set("price", e.target.value === "" ? null : Number(e.target.value))
                }
                placeholder="Vide = sur demande"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Devise</Label>
              <Input
                id="currency"
                value={state.currency}
                onChange={(e) => set("currency", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="collection">Collection</Label>
              <Select
                id="collection"
                value={state.collectionId ?? ""}
                onChange={(e) => set("collectionId", e.target.value)}
              >
                <option value="">— Aucune —</option>
                {collections.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="dimensions">Dimensions</Label>
            <Input
              id="dimensions"
              value={state.dimensions ?? ""}
              onChange={(e) => set("dimensions", e.target.value)}
              placeholder="Verre 53 mm · Pont 17 mm · Branches 135 mm…"
            />
          </div>
        </fieldset>

        <fieldset className="space-y-5 rounded-2xl border border-border p-6">
          <legend className="px-2 text-sm font-semibold">Attributs</legend>
          <div className="space-y-2">
            <Label htmlFor="colors">Couleurs</Label>
            <ListInput
              id="colors"
              value={state.colors}
              onChange={(v) => set("colors", v)}
              placeholder="Black, White, Blue…"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="materials">Matériaux</Label>
            <ListInput
              id="materials"
              value={state.materials}
              onChange={(v) => set("materials", v)}
              placeholder="Nylon PA12…"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="features">Caractéristiques</Label>
            <ListInput
              id="features"
              value={state.features}
              onChange={(v) => set("features", v)}
              placeholder="Impression 3D SLS à la demande…"
            />
          </div>
        </fieldset>

        <fieldset className="space-y-5 rounded-2xl border border-border p-6">
          <legend className="px-2 text-sm font-semibold">Déclinaisons</legend>
          <p className="text-xs text-muted">
            Groupes d’options façon boutique (ex. « Verres », « Branches »).
            Chaque valeur peut ajouter un supplément au prix de base.
          </p>

          {variants.map((group, gi) => (
            <div key={gi} className="space-y-4 rounded-xl border border-border p-4">
              <div className="flex items-center gap-3">
                <Input
                  value={group.name}
                  onChange={(e) => renameGroup(gi, e.target.value)}
                  placeholder="Nom du groupe (ex. Verres)"
                  aria-label={`Nom du groupe ${gi + 1}`}
                  maxLength={60}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Supprimer le groupe"
                  onClick={() => removeGroup(gi)}
                >
                  <Trash2 className="h-4 w-4 text-red-600" />
                </Button>
              </div>

              <ul className="space-y-2">
                {group.values.map((v, vi) => (
                  <li key={vi} className="flex items-center gap-2">
                    <Input
                      value={v.label}
                      onChange={(e) => setValueLabel(gi, vi, e.target.value)}
                      placeholder="Valeur (ex. Solaires)"
                      aria-label={`Valeur ${vi + 1} du groupe ${gi + 1}`}
                      maxLength={60}
                    />
                    <div className="relative w-32 shrink-0">
                      <Input
                        type="number"
                        step="1"
                        value={v.priceDelta ?? ""}
                        onChange={(e) => setValueDelta(gi, vi, e.target.value)}
                        placeholder="+ $"
                        aria-label={`Supplément de la valeur ${vi + 1} du groupe ${gi + 1}`}
                        className="pr-7"
                      />
                      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted">
                        $
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label="Supprimer la valeur"
                      disabled={group.values.length <= 1}
                      onClick={() => removeValue(gi, vi)}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </li>
                ))}
              </ul>

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-2"
                disabled={group.values.length >= 12}
                onClick={() => addValue(gi)}
              >
                <Plus className="h-4 w-4" /> Ajouter une valeur
              </Button>
            </div>
          ))}

          <Button
            type="button"
            variant="outline"
            className="gap-2"
            disabled={variants.length >= 6}
            onClick={addGroup}
          >
            <Plus className="h-4 w-4" /> Ajouter un groupe
          </Button>
        </fieldset>

        <SeoFields
          title={state.seoTitle ?? ""}
          description={state.seoDescription ?? ""}
          onTitleChange={(v) => set("seoTitle", v)}
          onDescriptionChange={(v) => set("seoDescription", v)}
        />
      </div>

      <div className="space-y-8">
        <fieldset className="space-y-4 rounded-2xl border border-border p-6">
          <legend className="px-2 text-sm font-semibold">Galerie</legend>
          <MediaUploader
            onUploaded={(url) =>
              set("images", [...state.images, { url, alt: state.name }])
            }
          />
          {state.images.length > 0 && (
            <ul className="space-y-3">
              {state.images.map((img, i) => (
                <li
                  key={`${img.url}-${i}`}
                  className="flex items-center gap-3 rounded-xl border border-border p-3"
                >
                  <GripVertical className="h-4 w-4 shrink-0 text-muted" />
                  <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-lg bg-foreground/5">
                    <Image src={img.url} alt={img.alt ?? ""} fill className="object-cover" sizes="80px" />
                  </div>
                  <Input
                    value={img.alt ?? ""}
                    placeholder="Texte alternatif"
                    aria-label={`Texte alternatif de l'image ${i + 1}`}
                    onChange={(e) =>
                      set(
                        "images",
                        state.images.map((im, j) =>
                          j === i ? { ...im, alt: e.target.value } : im
                        )
                      )
                    }
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Supprimer l'image"
                    onClick={() =>
                      set("images", state.images.filter((_, j) => j !== i))
                    }
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </fieldset>

        <fieldset className="space-y-4 rounded-2xl border border-border p-6">
          <legend className="px-2 text-sm font-semibold">Modèle 3D (GLB / GLTF)</legend>
          <div className="space-y-2">
            <Label htmlFor="model3d">URL du modèle 3D</Label>
            <Input
              id="model3d"
              value={state.model3dUrl ?? ""}
              onChange={(e) => set("model3dUrl", e.target.value)}
              placeholder="https://…/monture.glb"
            />
          </div>
          <MediaUploader onUploaded={(url) => set("model3dUrl", url)} />
          {state.model3dUrl ? (
            <Model3DViewer
              src={state.model3dUrl}
              alt="Aperçu 3D"
              className="aspect-video w-full overflow-hidden rounded-xl border border-border"
            />
          ) : (
            <p className="text-xs text-muted">
              Téléversez un fichier .glb/.gltf ou collez une URL. Affiché et
              manipulable (rotation, zoom, AR) sur la fiche produit.
            </p>
          )}
        </fieldset>

        <fieldset className="space-y-5 rounded-2xl border border-border p-6">
          <legend className="px-2 text-sm font-semibold">Publication</legend>
          <div className="flex items-center justify-between">
            <Label htmlFor="isPublished">Publié</Label>
            <Switch
              id="isPublished"
              checked={state.isPublished}
              onCheckedChange={(v) => set("isPublished", v)}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="isFeatured">Produit vedette</Label>
            <Switch
              id="isFeatured"
              checked={state.isFeatured}
              onCheckedChange={(v) => set("isFeatured", v)}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="customizable">Personnalisable</Label>
            <Switch
              id="customizable"
              checked={state.customizable}
              onCheckedChange={(v) => set("customizable", v)}
            />
          </div>
        </fieldset>

        {error && (
          <p className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>
        )}

        <div className="flex gap-3">
          <Button type="submit" disabled={saving} className="gap-2">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {productId ? "Enregistrer" : "Créer le produit"}
          </Button>
          <Button type="button" variant="ghost" onClick={() => router.back()}>
            Annuler
          </Button>
        </div>
      </div>
    </form>
  );
}
