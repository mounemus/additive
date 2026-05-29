import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#F9F9F9] text-[#111111] flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between p-6 bg-white border-b">
        <div className="font-bold text-2xl tracking-tighter">ADDITIVE EYEWEAR</div>
        <nav className="hidden md:flex gap-8 text-sm font-medium">
          <Link href="/configurator" className="hover:text-gray-500 transition-colors">Découverte & Catalogue</Link>
          <Link href="#" className="hover:text-gray-500 transition-colors">La technologie</Link>
          <Link href="/b2b" className="hover:text-gray-500 transition-colors">Opticiens (B2B)</Link>
        </nav>
        <div className="flex gap-4">
          <Link href="/configurator" className="px-5 py-2.5 bg-black text-white text-sm font-medium rounded-full hover:bg-gray-800 transition-colors">
            Créer ma monture
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-4 py-20 bg-gradient-to-b from-white to-[#F9F9F9]">
        <div className="max-w-4xl space-y-8">
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-tight">
            Le futur de la lunetterie, <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-500">
              imprimé sur mesure.
            </span>
          </h1>
          <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Fusionnez design paramétrique, réalité augmentée et impression 3D.
            Co-créez des montures uniques, adaptées parfaitement à votre visage grâce à notre configurateur 3D photoréaliste.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
            <Link
              href="/configurator"
              className="px-8 py-4 bg-black text-white text-lg font-medium rounded-full hover:bg-gray-800 transition-all transform hover:scale-105 shadow-lg flex items-center gap-2"
            >
              Lancer l&apos;expérience 3D
            </Link>
            <Link
              href="#"
              className="px-8 py-4 bg-white text-black border border-gray-200 text-lg font-medium rounded-full hover:bg-gray-50 transition-all shadow-sm"
            >
              Voir la collection
            </Link>
          </div>
        </div>
      </section>

      {/* Quick Features */}
      <section className="py-20 bg-white border-t">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
          <div>
            <div className="text-4xl mb-4">🕶️</div>
            <h3 className="text-xl font-bold mb-2">Design Paramétrique</h3>
            <p className="text-gray-500">Personnalisez la forme, les dimensions et les couleurs de votre monture à l&apos;infini.</p>
          </div>
          <div>
            <div className="text-4xl mb-4">📱</div>
            <h3 className="text-xl font-bold mb-2">Essayage Virtuel (RA)</h3>
            <p className="text-gray-500">Essayez vos créations instantanément avec notre technologie de réalité augmentée haute fidélité.</p>
          </div>
          <div>
            <div className="text-4xl mb-4">🖨️</div>
            <h3 className="text-xl font-bold mb-2">Impression 3D Zéro Déchet</h3>
            <p className="text-gray-500">Fabriqué à la demande. Un processus éco-responsable utilisant du nylon fritté haut de gamme.</p>
          </div>
        </div>
      </section>
    </main>
  );
}
