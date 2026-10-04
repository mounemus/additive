"use client";

import { withBase } from "@/lib/base-path";
import { useRef, useState } from "react";
import { upload } from "@vercel/blob/client";
import {
  AlertCircle,
  CheckCircle2,
  LinkIcon,
  Loader2,
  UploadCloud,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

/** Taille max côté client (doit rester alignée avec la route upload). */
const MAX_SIZE_BYTES = 100 * 1024 * 1024;

/** MIME acceptés (les .glb arrivent parfois sans type ou en octet-stream). */
const ACCEPTED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/svg+xml",
  "video/mp4",
  "video/webm",
  "model/gltf-binary",
]);

const ACCEPT_ATTR =
  "image/jpeg,image/png,image/webp,image/avif,image/svg+xml,video/mp4,video/webm,model/gltf-binary,.glb";

type UploadItem = {
  id: string;
  name: string;
  status: "uploading" | "done" | "error";
  progress: number;
  message?: string;
};

function isGlbFile(file: File): boolean {
  return (
    /\.glb$/i.test(file.name) ||
    file.type === "model/gltf-binary"
  );
}

/**
 * Déduit le `kind` MediaAsset depuis le MIME/extension du fichier, aligné sur
 * les valeurs du select existant (image | video | render3d | texture |
 * moodboard | autre). Pour une image, le type sélectionné dans le select est
 * respecté s'il est compatible (texture, moodboard…).
 */
function deduceKind(file: File, selectedKind: string): string {
  if (isGlbFile(file)) return "render3d";
  if (file.type.startsWith("video/")) return "video";
  if (file.type.startsWith("image/")) {
    return ["image", "texture", "moodboard", "autre"].includes(selectedKind)
      ? selectedKind
      : "image";
  }
  return "autre";
}

function validateFile(file: File): string | null {
  if (!ACCEPTED_MIME.has(file.type) && !isGlbFile(file)) {
    return "Type de fichier refusé (images JPEG/PNG/WebP/AVIF/SVG, vidéos MP4/WebM, modèles .glb).";
  }
  if (file.size > MAX_SIZE_BYTES) {
    return "Fichier trop volumineux (maximum 100 Mo).";
  }
  return null;
}

/**
 * Uploader de médias :
 *  - téléversement direct depuis le PC vers Vercel Blob (drag & drop ou clic,
 *    multi-fichiers, contourne la limite serverless de 4,5 Mo) ;
 *  - mode URL (toujours disponible) : colle l'URL d'un média déjà hébergé.
 */
export function MediaUploader({
  selectedKind = "image",
  onUploaded,
}: {
  /** Type sélectionné dans le gestionnaire (respecté si compatible). */
  selectedKind?: string;
  onUploaded: (url: string, kind?: string) => Promise<void> | void;
}) {
  const [url, setUrl] = useState("");
  const [urlError, setUrlError] = useState<string | null>(null);
  const [items, setItems] = useState<UploadItem[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function patchItem(id: string, patch: Partial<UploadItem>) {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  }

  async function uploadOne(file: File) {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const invalid = validateFile(file);
    if (invalid) {
      setItems((prev) => [
        ...prev,
        { id, name: file.name, status: "error", progress: 0, message: invalid },
      ]);
      return;
    }

    setItems((prev) => [
      ...prev,
      { id, name: file.name, status: "uploading", progress: 0 },
    ]);

    try {
      const blob = await upload(file.name, file, {
        access: "public",
        handleUploadUrl: withBase("/api/admin/media/upload"),
        contentType: file.type || (isGlbFile(file) ? "model/gltf-binary" : undefined),
        onUploadProgress: ({ percentage }) => {
          patchItem(id, { progress: Math.round(percentage) });
        },
      });

      // onUploadCompleted ne fonctionne pas en localhost : la création du
      // MediaAsset se fait ici, côté client, après succès de l'upload.
      try {
        await onUploaded(blob.url, deduceKind(file, selectedKind));
      } catch {
        patchItem(id, {
          status: "error",
          message:
            "Fichier téléversé, mais l'enregistrement dans la bibliothèque a échoué. Ajoutez-le via son URL : " +
            blob.url,
        });
        return;
      }
      patchItem(id, { status: "done", progress: 100 });
    } catch (e) {
      const raw = e instanceof Error ? e.message : "";
      let message = "Le téléversement a échoué. Vérifiez votre connexion et réessayez.";
      if (/client token/i.test(raw)) {
        // La génération du token a été refusée : session expirée ou fichier
        // rejeté par le serveur. On distingue via la session NextAuth.
        message = "Le serveur a refusé le téléversement (type ou taille du fichier).";
        try {
          const s = await fetch(withBase("/api/auth/session")).then((r) => r.json());
          if (!s?.user) message = "Session expirée : reconnectez-vous à l'admin.";
        } catch {
          /* on garde le message générique */
        }
      } else if (/content.?type|not allowed/i.test(raw)) {
        message = "Type de fichier refusé par le serveur.";
      } else if (/size|too large|maximum/i.test(raw)) {
        message = "Fichier trop volumineux (maximum 100 Mo).";
      }
      patchItem(id, { status: "error", message });
    }
  }

  function handleFiles(list: FileList | File[] | null) {
    if (!list) return;
    Array.from(list).forEach((f) => void uploadOne(f));
  }

  return (
    <div className="space-y-4">
      <div
        role="button"
        tabIndex={0}
        aria-label="Téléverser des fichiers depuis votre ordinateur"
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFiles(e.dataTransfer.files);
        }}
        className={`flex min-h-[44px] cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed p-8 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground ${
          dragOver
            ? "border-foreground bg-foreground/5"
            : "border-border hover:border-foreground"
        }`}
      >
        <UploadCloud className="h-7 w-7 text-muted" aria-hidden />
        <span className="text-sm font-medium">
          Glissez vos fichiers ici ou cliquez pour téléverser
        </span>
        <span className="text-xs text-muted">
          Images (JPEG, PNG, WebP, AVIF, SVG), vidéos (MP4, WebM), modèles 3D
          (.glb) — 100 Mo max par fichier
        </span>
      </div>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={ACCEPT_ATTR}
        className="sr-only"
        aria-hidden
        tabIndex={-1}
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = "";
        }}
      />

      {items.length > 0 && (
        <ul className="space-y-2" aria-live="polite">
          {items.map((it) => (
            <li
              key={it.id}
              className="rounded-xl border border-border bg-surface px-3 py-2"
            >
              <div className="flex items-center gap-2">
                {it.status === "uploading" ? (
                  <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted" aria-hidden />
                ) : it.status === "done" ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
                ) : (
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-600" aria-hidden />
                )}
                <span className="min-w-0 flex-1 truncate text-sm" title={it.name}>
                  {it.name}
                </span>
                <span className="shrink-0 text-xs text-muted">
                  {it.status === "uploading"
                    ? `${it.progress}%`
                    : it.status === "done"
                      ? "Ajouté"
                      : "Erreur"}
                </span>
              </div>
              {it.status === "uploading" && (
                <div
                  className="mt-2 h-1.5 overflow-hidden rounded-full bg-foreground/10"
                  role="progressbar"
                  aria-valuenow={it.progress}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <div
                    className="h-full rounded-full bg-foreground transition-all"
                    style={{ width: `${it.progress}%` }}
                  />
                </div>
              )}
              {it.status === "error" && it.message && (
                <p className="mt-1 text-xs text-red-600">{it.message}</p>
              )}
            </li>
          ))}
        </ul>
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
          onClick={async () => {
            const trimmed = url.trim();
            if (!trimmed) return;
            setUrlError(null);
            try {
              await onUploaded(trimmed);
              setUrl("");
            } catch {
              setUrlError("L'ajout a échoué. Vérifiez l'URL et réessayez.");
            }
          }}
        >
          <LinkIcon className="h-4 w-4" /> Ajouter
        </Button>
      </div>
      {urlError && <p className="text-sm text-red-600">{urlError}</p>}
    </div>
  );
}
