import { getTheme, themeToCssVars } from "@/lib/site-config";

/**
 * Injecte la palette pilotée par le back-office en variables CSS sur :root.
 * Rendu côté serveur dans le <head> — surcharge les défauts de globals.css ;
 * les rôles sémantiques (.dark / .section-dark) en héritent par référence.
 */
export async function SiteThemeStyle() {
  const theme = await getTheme();
  return (
    <style
      id="site-theme"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: `:root{${themeToCssVars(theme)}}` }}
    />
  );
}
