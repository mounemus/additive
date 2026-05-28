export default function B2bPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Espace Partenaires (Opticiens)</h1>
      <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
        <h2 className="text-lg font-bold mb-4">Vos clients récents</h2>
        <table className="w-full text-left">
          <thead>
            <tr className="border-b">
              <th className="pb-2">Client</th>
              <th className="pb-2">Date</th>
              <th className="pb-2">Statut</th>
              <th className="pb-2">Action</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b">
              <td className="py-3">Jean Dupont</td>
              <td className="py-3">Aujourd&apos;hui</td>
              <td className="py-3"><span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-sm">En attente</span></td>
              <td className="py-3"><button className="text-blue-600">Voir détails</button></td>
            </tr>
          </tbody>
        </table>
      </div>
      <button className="px-4 py-2 bg-black text-white rounded-md">Nouvelle configuration client</button>
    </div>
  );
}
