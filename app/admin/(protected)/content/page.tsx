import { getContent } from "@/lib/catalog";
import { ContentEditor } from "@/components/admin/content-editor";

export const dynamic = "force-dynamic";

const SECTIONS = [
  {
    key: "hero",
    title: "Hero de la page d’accueil",
    description: "Titre, sous-titre, accroche et libellés des boutons.",
  },
  {
    key: "slogans",
    title: "Slogans",
    description: "Banque de slogans de marque (liste).",
  },
  {
    key: "brand",
    title: "Positionnement de marque",
    description: "Texte de présentation et taglines FR/EN.",
  },
  {
    key: "manifesto",
    title: "Manifeste",
    description: "Introduction, sections éditoriales et phrase de clôture.",
  },
  {
    key: "technology",
    title: "Page technologie",
    description: "Introduction et blocs technologiques.",
  },
  {
    key: "faq",
    title: "FAQ",
    description: "Questions/réponses affichées sur la page personnalisation.",
  },
  {
    key: "cta",
    title: "Appel à l’action final",
    description: "Titre et bouton du bandeau de conversion.",
  },
];

export default async function AdminContentPage() {
  const values = await Promise.all(SECTIONS.map((s) => getContent<unknown>(s.key)));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Contenus</h1>
        <p className="mt-1 text-sm text-muted">
          Textes éditoriaux du site : hero, slogans, manifeste, technologie,
          FAQ et appels à l’action.
        </p>
      </div>
      <div className="max-w-4xl space-y-4">
        {SECTIONS.map((s, i) => (
          <ContentEditor
            key={s.key}
            contentKey={s.key}
            title={s.title}
            description={s.description}
            value={values[i]}
          />
        ))}
      </div>
    </div>
  );
}
