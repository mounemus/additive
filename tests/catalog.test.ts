import { describe, it, expect } from "vitest";
import { stripShortcodes } from "@/lib/catalog";

/**
 * Les descriptions produits importées de WordPress contiennent des
 * shortcodes hérités (ex. `[3d_viewer id="3098"]`). stripShortcodes doit
 * les retirer sans toucher au texte rédactionnel.
 */
describe("stripShortcodes", () => {
  it("retire un shortcode auto-fermant avec attributs", () => {
    expect(
      stripShortcodes('Monture légère. [3d_viewer id="3098"] Imprimée en PA12.')
    ).toBe("Monture légère. Imprimée en PA12.");
  });

  it("retire les paires ouvrante/fermante", () => {
    expect(stripShortcodes("[gallery ids=\"1,2\"]photos[/gallery] Texte.")).toBe(
      "photos Texte."
    );
  });

  it("retire plusieurs shortcodes et compacte les espaces", () => {
    expect(stripShortcodes("[vc_row][vc_column]Un design épuré.[/vc_column][/vc_row]")).toBe(
      "Un design épuré."
    );
  });

  it("préserve un texte sans shortcode", () => {
    expect(stripShortcodes("Description sobre, sans balise.")).toBe(
      "Description sobre, sans balise."
    );
  });

  it("préserve null et renvoie null si tout est shortcode", () => {
    expect(stripShortcodes(null)).toBeNull();
    expect(stripShortcodes('[3d_viewer id="1"]')).toBeNull();
  });
});
