import { readFileSync } from "node:fs";
const file = process.argv[2] || "public/models/hybride.glb";
const buf = readFileSync(file);
// GLB: header(12) + chunk0 length(4)+type(4)+JSON
const jsonLen = buf.readUInt32LE(12);
const json = JSON.parse(buf.slice(20, 20 + jsonLen).toString("utf8"));
console.log("Fichier:", file);
console.log("meshes:", (json.meshes || []).length, "nodes:", (json.nodes || []).length, "materials:", (json.materials || []).length);
console.log("noms meshes:", (json.meshes || []).map((m) => m.name).filter(Boolean).slice(0, 20).join(", ") || "(sans nom)");
console.log("noms nodes:", (json.nodes || []).map((n) => n.name).filter(Boolean).slice(0, 20).join(", ") || "(sans nom)");
let tris = 0;
for (const m of json.meshes || []) for (const p of m.primitives || []) {
  const acc = json.accessors?.[p.indices];
  if (acc) tris += acc.count / 3;
}
console.log("triangles ~", Math.round(tris));
