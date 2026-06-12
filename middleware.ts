import { withAuth } from "next-auth/middleware";

/**
 * Protège tout l'espace /admin (sauf /admin/login, exclu du matcher).
 * Les routes API admin sont en plus gardées individuellement par requireAdmin().
 */
export default withAuth({
  pages: { signIn: "/admin/login" },
});

export const config = {
  matcher: ["/admin/((?!login).*)", "/admin"],
};
