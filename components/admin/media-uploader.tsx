"use client";

import { useState } from "react";
import { Loader2, UploadCloud, LinkIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

/**
 * Uploader de médias :
 *  - mode URL (toujours disponible) : colle l'URL d'une image déjà hébergée ;
 *  - mode upload direct Cloudinary (si NEXT_PUBLIC_CLOUDINARY_* configurés,
 *    via unsigned upload preset). Compatible UploadThing en remplaçant
 *    l'implémentation de uploadFile().
 */
export function MediaUploader({
  onUploaded,
}: {
  onUploaded: (url: string) => void;
}) {
  const [url, setUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const preset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
  const cloudinaryEnabled = Boolean(cloudName && preset);

  async function uploadFile(file: File) {
    setUploading(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("upload_preset", preset as string);
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
        { method: "POST", body: form }
      );
      if (!res.ok) throw new Error();
      const data = await res.json();
      onUploaded(data.secure_url as string);
    } catch {
      setError("Le téléversement a échoué. Réessayez ou utilisez une URL.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-4">
      {cloudinaryEnabled && (
        <div>
          <Label
            htmlFor="media-file"
            className="flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-border p-8 text-center transition-colors hover:border-foreground"
          >
            {uploading ? (
              <Loader2 className="h-7 w-7 animate-spin text-muted" />
            ) : (
              <UploadCloud className="h-7 w-7 text-muted" />
            )}
            <span className="text-sm font-medium">
              Glissez une image ou cliquez pour téléverser
            </span>
            <span className="text-xs text-muted">Hébergement Cloudinary</span>
          </Label>
          <input
            id="media-file"
            type="file"
            accept="image/*,video/*"
            className="sr-only"
            disabled={uploading}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) uploadFile(f);
            }}
          />
        </div>
      )}

      <div className="flex gap-2">
        <Input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://… ou /images/products/exemple.svg"
          aria-label="URL du média"
        />
        <Button
          type="button"
          variant="outline"
          className="gap-2"
          onClick={() => {
            if (url.trim()) {
              onUploaded(url.trim());
              setUrl("");
            }
          }}
        >
          <LinkIcon className="h-4 w-4" /> Ajouter
        </Button>
      </div>
      {!cloudinaryEnabled && (
        <p className="text-xs text-muted">
          Astuce : configurez NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME et
          NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET pour activer le téléversement
          direct de fichiers.
        </p>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
