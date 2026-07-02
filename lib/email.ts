import "server-only";

/**
 * E-mails transactionnels via l'API Resend (simple POST, pas de SDK).
 *
 * Fail-open : sans RESEND_API_KEY, tout est silencieusement ignoré (log) —
 * le site fonctionne à l'identique, les e-mails s'activent en posant la clé.
 *
 * Variables d'environnement :
 *  - RESEND_API_KEY : clé API Resend (active la fonctionnalité)
 *  - EMAIL_FROM     : expéditeur vérifié (défaut : onboarding@resend.dev,
 *                     utilisable uniquement vers l'adresse du compte Resend)
 *  - ADMIN_EMAIL    : boîte de l'atelier (notifications de demandes)
 */

const FROM = process.env.EMAIL_FROM || "Additive <onboarding@resend.dev>";

export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return false; // e-mails non configurés : non bloquant
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: FROM,
        to: [opts.to],
        subject: opts.subject,
        html: opts.html,
        ...(opts.replyTo ? { reply_to: opts.replyTo } : {}),
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      console.error("[email] resend", res.status, (await res.text()).slice(0, 200));
      return false;
    }
    return true;
  } catch (e) {
    console.error("[email] envoi impossible:", e);
    return false;
  }
}

/** Notifie l'atelier (ADMIN_EMAIL). Non bloquant. */
export function notifyAtelier(subject: string, html: string): void {
  const admin = process.env.ADMIN_EMAIL;
  if (!admin) return;
  void sendEmail({ to: admin, subject, html });
}

/* ── Gabarits ──────────────────────────────────────────────────────────────
   HTML minimal compatible clients mail, aux couleurs de la marque. */

function shell(title: string, body: string): string {
  return `<!doctype html><body style="margin:0;background:#f3f2ed;font-family:Arial,Helvetica,sans-serif;color:#0b0d10">
  <div style="max-width:560px;margin:0 auto;padding:32px 20px">
    <p style="font-size:18px;font-weight:bold;letter-spacing:6px;margin:0 0 24px">ADDITIVE<span style="color:#1557ff">.</span></p>
    <div style="background:#ffffff;border-radius:12px;padding:28px 26px">
      <h1 style="font-size:20px;margin:0 0 14px">${title}</h1>
      ${body}
    </div>
    <p style="font-size:11px;color:#8a8f98;margin:18px 4px 0">
      Additive — lunetterie imprimée en 3D, Montréal. Cet e-mail fait suite à votre demande sur additive.
    </p>
  </div></body>`;
}

const row = (label: string, value: string) =>
  `<tr><td style="padding:5px 12px 5px 0;color:#5d636e;font-size:13px;white-space:nowrap">${label}</td>
   <td style="padding:5px 0;font-size:13px;font-weight:bold">${value}</td></tr>`;

export function customizationClientEmail(data: {
  name: string;
  conceptLabel?: string | null;
  total?: number | null;
  currency?: string;
  options?: Record<string, string> | null;
  paid?: boolean;
}): { subject: string; html: string } {
  const price =
    data.total != null ? `${data.total} $ ${data.currency ?? "CAD"}` : "communiquée sous 48 h";
  const rows = [
    data.conceptLabel ? row("Concept", data.conceptLabel) : "",
    row("Estimation", price),
    data.paid ? row("Acompte", "reçu — production prioritaire") : "",
  ].join("");
  return {
    subject: data.paid
      ? "Votre acompte est reçu — votre monture entre en fabrication"
      : "Votre demande de monture sur mesure est bien reçue",
    html: shell(
      data.paid ? "Acompte reçu, merci !" : `Merci ${data.name}.`,
      `<p style="font-size:14px;line-height:1.6;margin:0 0 16px">
        Votre configuration est transmise à notre atelier montréalais. Nous revenons
        vers vous sous <b>48 h ouvrables</b> pour valider les détails${data.paid ? "" : " et le paiement"}.
      </p>
      <table style="border-collapse:collapse">${rows}</table>
      <p style="font-size:13px;color:#5d636e;line-height:1.6;margin:16px 0 0">
        Une question, une précision (prescription, contraintes) ? Répondez simplement à cet e-mail.
      </p>`
    ),
  };
}

export function contactClientEmail(name: string): { subject: string; html: string } {
  return {
    subject: "Nous avons bien reçu votre message",
    html: shell(
      `Merci ${name}.`,
      `<p style="font-size:14px;line-height:1.6;margin:0">
        Votre message est arrivé à l'atelier. Nous vous répondons sous 48 h ouvrables.
      </p>`
    ),
  };
}

export function atelierNotificationEmail(data: {
  kind: "personnalisation" | "contact" | "paiement";
  name: string;
  email: string;
  conceptLabel?: string | null;
  total?: number | null;
  message?: string | null;
  requestId?: string;
}): { subject: string; html: string } {
  const rows = [
    row("Client", `${data.name} — ${data.email}`),
    data.conceptLabel ? row("Concept", data.conceptLabel) : "",
    data.total != null ? row("Estimation", `${data.total} $ CAD`) : "",
    data.requestId ? row("Demande", data.requestId) : "",
  ].join("");
  return {
    subject:
      data.kind === "paiement"
        ? `ACOMPTE REÇU — ${data.name}`
        : data.kind === "personnalisation"
          ? `Nouvelle demande de monture — ${data.name}`
          : `Nouveau message — ${data.name}`,
    html: shell(
      data.kind === "paiement" ? "Acompte reçu" : "Nouvelle demande",
      `<table style="border-collapse:collapse">${rows}</table>
      ${data.message ? `<p style="font-size:13px;line-height:1.6;margin:14px 0 0;white-space:pre-wrap">${data.message}</p>` : ""}
      <p style="font-size:13px;margin:16px 0 0"><a href="https://additive-blue.vercel.app/admin/contact-requests" style="color:#1557ff">Ouvrir dans l'admin →</a></p>`
    ),
  };
}
