import { describe, expect, it } from "vitest";
import { withBase } from "@/lib/base-path";

describe("withBase", () => {
  it("préfixe les chemins racine, une seule fois", () => {
    expect(withBase("/images/a.jpg")).toBe("/additive/images/a.jpg");
    expect(withBase(withBase("/api/x"))).toBe("/additive/api/x");
    expect(withBase("/additive")).toBe("/additive");
  });
  it("laisse intacts absolus, data:, protocole relatif et vides", () => {
    for (const v of ["https://x.y/a.png", "data:image/png;base64,AA", "blob:abc", "//cdn/x.js", "", null, undefined]) {
      expect(withBase(v)).toBe(v);
    }
  });
});
