import { describe, it, expect } from "vitest";
import {
  computeQuote,
  buildConcepts,
  conceptByLabel,
  DEFAULT_QUOTE_OPTIONS,
  answersToProfile,
  type Boldness,
} from "@/lib/configurator";
import { DEFAULT_PRICING } from "@/content/configurator-defaults";
import { computeModulairPrice, DEFAULT_SELECTION } from "@/lib/modulair";

/**
 * Les moteurs de prix sont la partie la plus sensible du site (déjà source
 * d'un bug carte ≠ devis corrigé en prod). Ces tests verrouillent :
 *  1. l'INVARIANT carte = devis au premier choix,
 *  2. la monotonie (une option payante n'abaisse jamais le total),
 *  3. le recalcul MODUL'AIR.
 */

const BOLDNESS: Boldness[] = ["discret", "equilibre", "affirme"];

describe("computeQuote — cohérence carte/devis", () => {
  it("au premier choix (options par défaut), le total du devis égale le prix affiché sur la carte", () => {
    for (const boldness of BOLDNESS) {
      const concepts = buildConcepts("ovale", ["minimal", "discret", "matiere"], boldness);
      expect(concepts.length).toBeGreaterThan(0);
      expect(concepts.length).toBeLessThanOrEqual(3);
      for (const c of concepts) {
        const quote = computeQuote(
          { conceptLabel: c.label, boldness, ...DEFAULT_QUOTE_OPTIONS },
          DEFAULT_PRICING
        );
        expect(quote.total).toBe(c.basePrice);
      }
    }
  });

  it("repli sur la base de la grille quand le concept est inconnu", () => {
    const quote = computeQuote(
      { conceptLabel: "Inexistant", boldness: "equilibre", ...DEFAULT_QUOTE_OPTIONS },
      DEFAULT_PRICING
    );
    expect(quote.base).toBe(DEFAULT_PRICING.base + 10); // équilibré = +10
    expect(quote.total).toBe(quote.base);
  });

  it("chaque option payante augmente strictement le total", () => {
    const base = computeQuote(
      { conceptLabel: "Ligne pure", boldness: "equilibre", ...DEFAULT_QUOTE_OPTIONS },
      DEFAULT_PRICING
    ).total;
    const upgrades: Partial<Record<keyof typeof DEFAULT_QUOTE_OPTIONS, string>>[] = [
      { material: "pa12-carbon" },
      { finish: "signature" },
      { lensType: "correction" },
      { delivery: "express" },
      { urgency: "rush" },
    ];
    for (const up of upgrades) {
      const total = computeQuote(
        { conceptLabel: "Ligne pure", boldness: "equilibre", ...DEFAULT_QUOTE_OPTIONS, ...up },
        DEFAULT_PRICING
      ).total;
      expect(total).toBeGreaterThan(base);
    }
  });

  it("le coefficient de complexité ne s'applique qu'au surcoût matériau", () => {
    // « Structure ouverte » : complexité high (coef 1.35 dans la grille défaut).
    const tpl = conceptByLabel("Structure ouverte");
    expect(tpl?.complexity).toBe("high");
    const q = computeQuote(
      {
        conceptLabel: "Structure ouverte",
        boldness: "affirme",
        ...DEFAULT_QUOTE_OPTIONS,
        material: "pa12-carbon", // 90 $ dans la grille défaut
      },
      DEFAULT_PRICING
    );
    expect(q.base).toBe(tpl!.basePrice + 25); // affirmé = +25
    expect(q.material).toBe(Math.round(90 * DEFAULT_PRICING.complexity.high));
    expect(q.total).toBe(q.base + q.material);
  });
});

describe("buildConcepts", () => {
  it("renvoie au plus 3 concepts, meilleurs taux de correspondance en tête", () => {
    const concepts = buildConcepts("rond", ["technique", "sculptural"], "affirme");
    expect(concepts.length).toBeLessThanOrEqual(3);
    for (let i = 1; i < concepts.length; i++) {
      expect(concepts[i - 1].matchRate).toBeGreaterThanOrEqual(concepts[i].matchRate);
    }
  });

  it("fournit toujours 3 concepts même sans affinité de tags", () => {
    const concepts = buildConcepts(null, [], "equilibre");
    expect(concepts.length).toBe(3);
  });
});

describe("answersToProfile", () => {
  it("retient au plus 3 tags, ordonnés par score", () => {
    const profile = answersToProfile({
      espace: "atelier",
      objet: "outil",
      couleur: "metal",
      matiere: "carbone",
    });
    expect(profile.length).toBeLessThanOrEqual(3);
    expect(profile[0]).toBe("technique"); // 4 réponses techniques → dominant
  });
});

describe("computeModulairPrice", () => {
  it("sélection par défaut = prix de base (options incluses)", () => {
    const p = computeModulairPrice(DEFAULT_SELECTION);
    expect(p.total).toBeGreaterThan(0);
    expect(p.total).toBe(p.base);
  });

  it("le bicolore ajoute le surcoût d'assemblage", () => {
    const uni = computeModulairPrice({ ...DEFAULT_SELECTION, faceColor: "black", branchColor: "black" });
    const bi = computeModulairPrice({ ...DEFAULT_SELECTION, faceColor: "black", branchColor: "blue" });
    expect(bi.total).toBeGreaterThan(uni.total);
    expect(bi.bicolor).toBeGreaterThan(0);
  });
});
