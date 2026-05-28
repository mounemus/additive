export default function AdminPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Back-Office Administrateur</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="font-bold mb-2">Gestion catalogue</h2>
          <p className="text-sm text-gray-500">Modèles, textures, prix</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="font-bold mb-2">Suivi de production</h2>
          <p className="text-sm text-gray-500">Statuts d&apos;impression, exports</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="font-bold mb-2">Utilisateurs & Commandes</h2>
          <p className="text-sm text-gray-500">Historique, support</p>
        </div>
      </div>
    </div>
  );
}
