export default function ConfiguratorPage() {
  return (
    <div className="flex h-screen bg-gray-50">
      <div className="flex-1 flex flex-col">
        <header className="h-16 bg-white border-b flex items-center justify-between px-6">
          <div className="font-bold text-xl">Additive Eyewear</div>
          <div className="text-gray-500">Modèle &gt; Personnalisation</div>
          <div className="flex items-center gap-4">
            <span className="font-medium">149 €</span>
            <button className="px-4 py-2 bg-gray-200 rounded-md">Sauvegarder</button>
            <button className="px-4 py-2 bg-black text-white rounded-md">Panier</button>
          </div>
        </header>
        <main className="flex-1 relative bg-gray-100 flex items-center justify-center">
          <div className="text-gray-400">Viewer 3D interactif - Cliquez et glissez pour tourner</div>
          <button className="absolute bottom-8 px-6 py-3 bg-white shadow-lg rounded-full font-medium">
            👁️ Essayer en RA
          </button>
        </main>
      </div>
      <aside className="w-80 bg-white border-l p-6">
        <h2 className="text-lg font-bold mb-4">Personnalisation</h2>
        <div className="flex gap-2 mb-6">
          <button className="px-3 py-1 bg-black text-white rounded">Forme</button>
          <button className="px-3 py-1 bg-gray-100 rounded">Couleur</button>
          <button className="px-3 py-1 bg-gray-100 rounded">Matériau</button>
          <button className="px-3 py-1 bg-gray-100 rounded">Dimensions</button>
        </div>
        <div className="space-y-4">
          <p className="text-sm text-gray-500">Sélectionnez vos options...</p>
        </div>
      </aside>
    </div>
  );
}
