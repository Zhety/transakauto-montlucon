import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * Permet de lancer un `next build` de vérification pendant qu'un `next dev`
   * tourne : sans dossier séparé, les deux écrasent le même `.next` et le
   * serveur de dev part en erreur 500.
   */
  distDir: process.env.NEXT_DIST_DIR ?? ".next",

  /** Une seule URL canonique : le www renvoie vers le domaine nu. */
  async redirects() {
    return [
      // Chemins d'affichage des annonces Google Ads : décoratifs côté Google,
      // mais autant qu'ils mènent quelque part si quelqu'un les saisit.
      // `:path+` (au moins un segment) et non `:path*`, qui capturait aussi
      // /estimation et /reprise eux-mêmes : boucle de redirection infinie.
      { source: "/estimation/:path+", destination: "/estimation", permanent: false },
      { source: "/reprise/:path+", destination: "/reprise", permanent: false },
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.transakautomontlucon.com" }],
        destination: "https://transakautomontlucon.com/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
