import Link from "next/link";
import { db } from "@/lib/db";
import { safeQuery } from "@/lib/admin";
import { formatDate, formatPrice } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/admin/status-badge";
import { RequestActions } from "@/components/admin/request-actions";

export const dynamic = "force-dynamic";

export default async function AdminRequestsPage({
  searchParams,
}: {
  searchParams: { tab?: string };
}) {
  const tab = searchParams.tab === "personnalisation" ? "personnalisation" : "messages";

  const [contacts, customizations] = await Promise.all([
    safeQuery(
      () => db.contactRequest.findMany({ orderBy: { createdAt: "desc" } }),
      []
    ),
    safeQuery(
      () => db.customizationRequest.findMany({ orderBy: { createdAt: "desc" } }),
      []
    ),
  ]);

  // Photos temporaires jointes (panneau atelier) — récupérées par token.
  const tokens = customizations.map((c) => c.photoToken).filter(Boolean) as string[];
  const photos = tokens.length
    ? await safeQuery(
        () => db.tempPhoto.findMany({ where: { token: { in: tokens } } }),
        []
      )
    : [];
  const photoByToken = new Map(photos.map((p) => [p.token, p.dataUrl]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Demandes clients</h1>
        <p className="mt-1 text-sm text-muted">
          Messages du formulaire de contact et demandes issues du configurateur.
        </p>
      </div>

      <div className="flex gap-2 border-b border-border">
        {[
          { id: "messages", label: `Messages (${contacts.length})` },
          { id: "personnalisation", label: `Personnalisations (${customizations.length})` },
        ].map((t) => (
          <Link
            key={t.id}
            href={t.id === "messages" ? "/admin/contact-requests" : "/admin/contact-requests?tab=personnalisation"}
            className={cn(
              "border-b-2 px-4 py-2.5 text-sm font-medium transition-colors",
              tab === t.id
                ? "border-foreground text-foreground"
                : "border-transparent text-muted hover:text-foreground"
            )}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {tab === "messages" ? (
        <div className="space-y-4">
          {contacts.length === 0 && (
            <p className="rounded-2xl border border-dashed border-border p-12 text-center text-muted">
              Aucun message pour le moment.
            </p>
          )}
          {contacts.map((c) => (
            <article key={c.id} className="rounded-2xl border border-border bg-surface p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="font-medium">
                    {c.name}{" "}
                    <a href={`mailto:${c.email}`} className="text-sm text-accent-blue hover:underline">
                      {c.email}
                    </a>
                    {c.phone && <span className="text-sm text-muted"> · {c.phone}</span>}
                  </p>
                  <div className="mt-1 flex items-center gap-2 text-xs text-muted">
                    {c.type && <Badge variant="outline">{c.type}</Badge>}
                    <span>{formatDate(c.createdAt)}</span>
                    <StatusBadge status={c.status} />
                  </div>
                </div>
                <RequestActions id={c.id} kind="contact" status={c.status} note={c.note} />
              </div>
              <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
                {c.message}
              </p>
              {c.note && (
                <p className="mt-3 rounded-lg bg-amber-50 p-3 text-xs text-amber-900">
                  Note interne : {c.note}
                </p>
              )}
            </article>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {customizations.length === 0 && (
            <p className="rounded-2xl border border-dashed border-border p-12 text-center text-muted">
              Aucune demande de personnalisation pour le moment.
            </p>
          )}
          {customizations.map((c) => (
            <article key={c.id} className="rounded-2xl border border-border bg-surface p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="font-medium">
                    {c.name}{" "}
                    <a href={`mailto:${c.email}`} className="text-sm text-accent-blue hover:underline">
                      {c.email}
                    </a>
                    {c.phone && <span className="text-sm text-muted"> · {c.phone}</span>}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted">
                    <span>{formatDate(c.createdAt)}</span>
                    <StatusBadge status={c.status} />
                    {c.estimatedPrice != null && (
                      <Badge variant="orange">
                        Estimation : {formatPrice(c.estimatedPrice, c.currency)}
                      </Badge>
                    )}
                  </div>
                </div>
                <RequestActions id={c.id} kind="customization" status={c.status} note={c.note} />
              </div>

              {/* Panneau atelier : profil complet de la demande */}
              <dl className="mt-4 grid gap-3 rounded-xl bg-foreground/[0.03] p-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <dt className="text-xs uppercase tracking-wider text-muted">Morphologie</dt>
                  <dd className="mt-0.5 font-medium capitalize">{c.faceShape ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wider text-muted">Style</dt>
                  <dd className="mt-0.5 font-medium">
                    {c.styleTags.length ? c.styleTags.join(", ") : "—"}
                    {c.boldness ? ` · ${c.boldness}` : ""}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wider text-muted">Concept</dt>
                  <dd className="mt-0.5 font-medium">
                    {c.conceptLabel ?? "—"}
                    {c.matchRate != null ? ` · ${c.matchRate}% match` : ""}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wider text-muted">Options</dt>
                  <dd className="mt-0.5 font-medium">
                    {c.options ? Object.entries(c.options as Record<string, string>).map(([k, v]) => `${k}: ${v}`).join(" · ") : "—"}
                  </dd>
                </div>
              </dl>

              {c.measurements && (
                <dl className="mt-3 flex flex-wrap gap-2 text-xs">
                  {Object.entries(c.measurements as Record<string, number>).map(([k, v]) => (
                    <span key={k} className="rounded-md bg-foreground/[0.04] px-2 py-1 text-muted">
                      {k.replace(/Mm$/, "")}: <span className="font-medium text-foreground">{v} mm</span>
                    </span>
                  ))}
                </dl>
              )}

              {(c.photoToken && photoByToken.get(c.photoToken)) || c.moodboardUrl ? (
                <div className="mt-3 flex flex-wrap gap-3">
                  {c.photoToken && photoByToken.get(c.photoToken) && (
                    <div>
                      <p className="mb-1 text-xs text-muted">Photo (temporaire)</p>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={photoByToken.get(c.photoToken)!} alt="Photo client" className="h-28 w-28 rounded-lg border border-border object-cover" />
                    </div>
                  )}
                  {c.moodboardUrl && (
                    <div>
                      <p className="mb-1 text-xs text-muted">Moodboard</p>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={c.moodboardUrl} alt="Moodboard" className="h-28 w-40 rounded-lg border border-border object-cover" />
                    </div>
                  )}
                </div>
              ) : null}

              {c.conceptSummary && (
                <p className="mt-3 text-sm italic text-muted">« {c.conceptSummary} »</p>
              )}
              {c.message && (
                <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed">{c.message}</p>
              )}
              {c.note && (
                <p className="mt-3 rounded-lg bg-amber-50 p-3 text-xs text-amber-900">
                  Note interne : {c.note}
                </p>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
