/**
 * Enrichit le storytelling des trois lignes MODUL'AIR (Cyborg, Cygnus, Eclipso).
 *   node scripts/enrich-modulair.mjs   (nécessite DATABASE_URL)
 */
import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();

const STORIES = {
  cyborg: {
    shortDescription:
      "La ligne la plus technique de MODUL’AIR : assemblages apparents, fixations indexées et vocabulaire d’instrument de précision.",
    description:
      "Cyborg assume l’esthétique de l’assemblage. Ses modules s’emboîtent à vue — face, charnières, branches — comme les pièces d’un outil conçu pour durer et pour évoluer. Rien n’est caché : chaque jonction est un détail de design, chaque branche se remplace sans toucher au reste. Imprimée en nylon PA12, Cyborg transforme la monture en système ouvert que l’on répare, recompose et personnalise au fil du temps. Pour celles et ceux qui aiment lire la fonction dans la forme.",
  },
  cygnus: {
    shortDescription:
      "L’élégance fluide de MODUL’AIR : une face élancée qui accueille branches et verres interchangeables sans jamais perdre sa grâce.",
    description:
      "Cygnus apporte la ligne au système modulaire. Sa face étirée, presque calligraphique, équilibre la modularité par la continuité du trait. Les branches se changent, les couleurs se contrastent, les verres se remplacent — et pourtant la silhouette reste fidèle à elle-même, légère et posée. Une monture pensée pour celles et ceux qui veulent la liberté de la modularité sans renoncer au raffinement. Nylon PA12, impression 3D à la demande, Montréal.",
  },
  eclipso: {
    shortDescription:
      "Le jeu des superpositions : faces et contre-faces se combinent pour créer profondeur, couleur et ombres uniques à chaque configuration.",
    description:
      "Eclipso superpose les plans comme une éclipse superpose les astres. Sa face se compose de couches qui se décalent et se contrastent : un bicolore qui ne se contente pas de juxtaposer mais qui crée du relief, de la profondeur, des ombres portées qui changent selon la lumière. Chaque configuration est un graphisme à part entière. Modulaire jusque dans son expressivité, Eclipso est la ligne MODUL’AIR de celles et ceux qui voient la monture comme une composition. Imprimée en 3D en nylon PA12 à Montréal.",
  },
};

async function main() {
  let n = 0;
  for (const [slug, data] of Object.entries(STORIES)) {
    const r = await db.product.updateMany({ where: { slug }, data });
    if (r.count) {
      n += r.count;
      console.log(`↑ ${slug} enrichi`);
    } else {
      console.log(`· ${slug} introuvable (slug absent)`);
    }
  }
  console.log(`\n✓ ${n} fiche(s) MODUL'AIR enrichie(s).`);
}
main().catch((e) => { console.error(e); process.exit(1); }).finally(() => db.$disconnect());
