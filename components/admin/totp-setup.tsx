"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ShieldCheck, ShieldOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * Section « Sécurité — 2FA » de la page Paramètres.
 *
 * Activation : POST /api/admin/totp/setup génère un secret (affiché une
 * seule fois, base32 + URI otpauth à copier dans l'app d'authentification),
 * puis POST /api/admin/totp/verify { code, action: "enable" } confirme.
 * Désactivation : code valide exigé, action: "disable".
 */
export function TotpSetup({ enabled }: { enabled: boolean }) {
  const router = useRouter();
  const [isEnabled, setIsEnabled] = useState(enabled);
  const [secret, setSecret] = useState<string | null>(null);
  const [uri, setUri] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  async function startSetup() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/totp/setup", { method: "POST" });
      const data = await res.json();
      if (!res.ok || !data.secret) throw new Error();
      setSecret(data.secret);
      setUri(data.uri);
      setCode("");
    } catch {
      setMessage({ ok: false, text: "Impossible de générer le secret. Réessayez." });
    } finally {
      setLoading(false);
    }
  }

  async function verify(action: "enable" | "disable") {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/totp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, action }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setMessage({ ok: false, text: "Code invalide. Vérifiez votre app d'authentification." });
        return;
      }
      if (action === "enable") {
        setIsEnabled(true);
        setSecret(null);
        setUri(null);
        setMessage({ ok: true, text: "2FA activée. Le code sera demandé à chaque connexion." });
      } else {
        setIsEnabled(false);
        setMessage({ ok: true, text: "2FA désactivée." });
      }
      setCode("");
      router.refresh();
    } catch {
      setMessage({ ok: false, text: "Erreur serveur. Réessayez." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          {isEnabled ? (
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
          ) : (
            <ShieldOff className="h-4 w-4 text-muted" />
          )}
          Sécurité — 2FA
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted">
          Authentification à deux facteurs par code TOTP (Google Authenticator,
          Aegis, 1Password…). {isEnabled ? "Actuellement activée." : "Actuellement désactivée."}
        </p>

        {!isEnabled && !secret && (
          <Button onClick={startSetup} disabled={loading} className="gap-2">
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Activer la 2FA
          </Button>
        )}

        {!isEnabled && secret && (
          <div className="space-y-4 rounded-xl border border-border bg-background p-4">
            <div>
              <p className="text-sm font-medium">
                1. Ajoutez ce secret dans votre app d&rsquo;authentification
              </p>
              <p className="mt-1 text-xs text-muted">
                Il ne sera plus jamais affiché — copiez-le maintenant.
              </p>
              <code className="mt-2 block break-all rounded-lg bg-foreground/5 px-3 py-2 font-mono text-sm">
                {secret}
              </code>
              {uri && (
                <code className="mt-2 block break-all rounded-lg bg-foreground/5 px-3 py-2 font-mono text-xs text-muted">
                  {uri}
                </code>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="totp-confirm">2. Saisissez le code affiché par l&rsquo;app</Label>
              <div className="flex gap-2">
                <Input
                  id="totp-confirm"
                  type="text"
                  inputMode="numeric"
                  placeholder="123456"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="max-w-[10rem]"
                />
                <Button
                  onClick={() => verify("enable")}
                  disabled={loading || code.trim().length < 6}
                  className="gap-2"
                >
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  Confirmer
                </Button>
              </div>
            </div>
          </div>
        )}

        {isEnabled && (
          <div className="space-y-2">
            <Label htmlFor="totp-disable">Code actuel pour désactiver</Label>
            <div className="flex gap-2">
              <Input
                id="totp-disable"
                type="text"
                inputMode="numeric"
                placeholder="123456"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="max-w-[10rem]"
              />
              <Button
                variant="outline"
                onClick={() => verify("disable")}
                disabled={loading || code.trim().length < 6}
                className="gap-2"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Désactiver
              </Button>
            </div>
          </div>
        )}

        {message && (
          <p className={`text-sm ${message.ok ? "text-emerald-600" : "text-red-600"}`}>
            {message.text}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
