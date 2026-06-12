"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export function SeoFields({
  title,
  description,
  onTitleChange,
  onDescriptionChange,
}: {
  title: string;
  description: string;
  onTitleChange: (v: string) => void;
  onDescriptionChange: (v: string) => void;
}) {
  return (
    <fieldset className="rounded-2xl border border-border p-6">
      <legend className="px-2 text-sm font-semibold">SEO</legend>
      <div className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="seoTitle">Titre SEO</Label>
          <Input
            id="seoTitle"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="Titre affiché dans Google (≈ 60 caractères)"
          />
          <p className="text-xs text-muted">{title.length} / 60 caractères recommandés</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="seoDescription">Description SEO</Label>
          <Textarea
            id="seoDescription"
            rows={3}
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            placeholder="Description affichée dans les résultats de recherche (≈ 155 caractères)"
          />
          <p className="text-xs text-muted">{description.length} / 155 caractères recommandés</p>
        </div>
      </div>
    </fieldset>
  );
}
