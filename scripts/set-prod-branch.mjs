/**
 * Bascule la branche de production du projet Vercel sur `main`.
 * Usage ponctuel : node scripts/set-prod-branch.mjs
 * (contourne les problèmes de quoting JSON du CLI sous Windows)
 */
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";

const PROJECT_ID = "prj_VtWe3jdVg8KvYrUxuSjat7NeqLJd";

const candidates = [
  join(process.env.APPDATA ?? "", "com.vercel.cli", "auth.json"),
  join(homedir(), ".local", "share", "com.vercel.cli", "auth.json"),
  join(homedir(), "AppData", "Local", "com.vercel.cli", "auth.json"),
  join(homedir(), ".vercel", "auth.json"),
];

let token = null;
for (const p of candidates) {
  if (existsSync(p)) {
    try {
      token = JSON.parse(readFileSync(p, "utf8")).token;
      if (token) break;
    } catch {}
  }
}
if (!token) {
  console.error("Token Vercel introuvable dans:", candidates);
  process.exit(1);
}

const res = await fetch(`https://api.vercel.com/v9/projects/${PROJECT_ID}`, {
  method: "PATCH",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ link: { productionBranch: "main" } }),
});

const data = await res.json();
if (!res.ok) {
  console.error("Erreur", res.status, JSON.stringify(data));
  process.exit(1);
}
console.log("productionBranch:", data.link?.productionBranch);
