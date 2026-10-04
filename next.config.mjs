/** @type {import('next').NextConfig} */

// CSP : stricte mais compatible avec les besoins réels du site —
// MediaPipe (cdn.jsdelivr.net + modèle sur storage.googleapis.com, WASM),
// model-viewer (ajax.googleapis.com), images data:/blob: du configurateur,
// caméra pour l'analyse faciale. Next.js exige inline scripts/styles.
//
// www.gstatic.com : les GLB du catalogue sont compressés Draco
// (extensionsRequired: KHR_draco_mesh_compression) et <model-viewer>
// télécharge son décodeur (draco_wasm_wrapper.js + draco_decoder.wasm)
// depuis https://www.gstatic.com/draco/versioned/decoders/… — sans ces
// hôtes dans script-src ET connect-src, le décodage échoue silencieusement
// et la 3D reste invisible.
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' 'wasm-unsafe-eval' https://cdn.jsdelivr.net https://ajax.googleapis.com https://www.gstatic.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "media-src 'self' data: blob: https:",
  "font-src 'self' data:",
  // *.public.blob.vercel-storage.com : GLB téléversés depuis l'admin (Vercel
  // Blob) — model-viewer les télécharge en fetch() côté client. Les GLB
  // hébergés sur buypukka.ca passent, eux, par /api/model-proxy (même origine).
  "connect-src 'self' data: blob: https://cdn.jsdelivr.net https://storage.googleapis.com https://www.gstatic.com https://*.public.blob.vercel-storage.com",
  "worker-src 'self' blob:",
  "object-src 'none'",
  // 'self' = buypukka.ca : l'admin s'affiche dans le menu WordPress (même domaine).
  "frame-ancestors 'self'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // La caméra est nécessaire au scan facial (même origine uniquement).
  { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=(), payment=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
];

// Servi sous https://buypukka.ca/additive par le relais WordPress.
// Doit rester identique à BASE_PATH (lib/base-path.ts).
const BASE_PATH = "/additive";
const PUBLIC_URL = `https://buypukka.ca${BASE_PATH}`;

const nextConfig = {
  basePath: BASE_PATH,
  // next-auth (client ET serveur) en déduit son basePath et l'origine publique.
  env: { NEXTAUTH_URL: `${PUBLIC_URL}/api/auth`, NEXT_PUBLIC_BASE_PATH: BASE_PATH },
  async redirects() {
    // Accès direct à l'URL Vercel : la racine renvoie vers le site public.
    return [{ source: "/", destination: PUBLIC_URL, basePath: false, permanent: false }];
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "utfs.io" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "buypukka.ca" },
      // Médias téléversés depuis l'admin (Vercel Blob).
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
    ],
  },
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
  webpack(config, { isServer }) {
    if (!isServer) {
      // lib/catalog.ts utilise fs.existsSync (mapping GLB local côté serveur)
      // mais reste importé transitivement par un composant client via
      // lib/site-config.ts → module vide côté navigateur, jamais appelé.
      config.resolve.fallback = { ...config.resolve.fallback, fs: false };
    }
    return config;
  },
};

export default nextConfig;
