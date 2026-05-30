"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { use } from "react";
import Image from "next/image";

export default function PipelinePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { id } = resolvedParams;

  // Global State for Acts
  const [currentAct, setCurrentAct] = useState<number>(1);

  // Act 1 State
  const [brandData, setBrandData] = useState({
    name: "",
    industry: "",
    description: "",
    audience: "",
    website: "",
    horizon: "90j",
    language: "fr",
  });

  // Act 2 State
  const [enrichedData, setEnrichedData] = useState<{
    slogan: string;
    mission: string;
    values: string;
    persona: string;
    tone: string;
    keywords: string;
    hashtags: string;
    colors: string;
    style: string;
    dna: string;
  }>({
    slogan: "", mission: "", values: "", persona: "", tone: "", keywords: "", hashtags: "", colors: "", style: "", dna: ""
  });
  const [enrichmentProgress, setEnrichmentProgress] = useState(0);

  const handleAct1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!brandData.name) return;
    setCurrentAct(2);
    startEnrichment();
  };

  // Act 3, 4, 5 State
  const [strategyItems, setStrategyItems] = useState([
    { id: 1, kind: "POST_IDEA", platform: "Instagram", title: "Top 5 erreurs en lunetterie 3D", status: "DRAFT", visual: "" },
    { id: 2, kind: "REEL_IDEA", platform: "TikTok", title: "Behind the scenes: Impression", status: "DRAFT", visual: "" },
    { id: 3, kind: "POST_IDEA", platform: "LinkedIn", title: "Le futur de l'optique", status: "DRAFT", visual: "" },
  ]);
  const [concretizingItem, setConcretizingItem] = useState<number | null>(null);

  const approveStrategyItems = () => {
    setCurrentAct(4);
  };

  const concretizeItem = (id: number) => {
    setConcretizingItem(id);
    setTimeout(() => {
      setStrategyItems(items => items.map(i => i.id === id ? { ...i, status: "READY", visual: "https://via.placeholder.com/400x400" } : i));
      setConcretizingItem(null);
    }, 2000);
  };

  const startEnrichment = () => {
    setEnrichmentProgress(0);
    const fields = Object.keys(enrichedData) as Array<keyof typeof enrichedData>;
    const dummyData = {
      slogan: "Lunetterie 3D de précision",
      mission: "Révolutionner l'optique via la technologie additive",
      values: "Innovation, Sur-mesure, Écologie",
      persona: "Technophiles de 25-45 ans, porteurs de lunettes, soucieux du design",
      tone: "Premium, innovant, accessible",
      keywords: "3D, sur-mesure, léger, tech",
      hashtags: "#3Dprinting #eyewear #innovation #tech",
      colors: "Noir, Gris titane, Orange néon",
      style: "Minimaliste, industriel, épuré",
      dna: "La fusion de l'artisanat optique et de l'industrie 4.0"
    };

    let step = 0;
    const interval = setInterval(() => {
      if (step < fields.length) {
        const field = fields[step];
        setEnrichedData(prev => ({ ...prev, [field]: dummyData[field] }));
        setEnrichmentProgress(((step + 1) / fields.length) * 100);
        step++;
      } else {
        clearInterval(interval);
      }
    }, 500); // Simulate 30s but faster for dev
  };

  return (
    <main className="min-h-screen bg-[#F9F9F9] text-[#111111] p-8">
      <div className="max-w-5xl mx-auto">
        <header className="mb-12 border-b pb-4">
          <h1 className="text-3xl font-bold tracking-tight">Studio Narratif</h1>
          <p className="text-gray-500">Pipeline #{id}</p>

          {/* Progress Indicator */}
          <div className="flex gap-2 mt-6">
            {[1, 2, 3, 4, 5].map((actNum) => (
              <div
                key={actNum}
                className={`flex-1 h-2 rounded-full ${
                  actNum < currentAct ? "bg-green-500" :
                  actNum === currentAct ? "bg-blue-600" : "bg-gray-200"
                }`}
              />
            ))}
          </div>
        </header>

        <div className="space-y-16 pb-32">
          {/* ACTE 1 */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`bg-white p-8 rounded-2xl shadow-sm border ${currentAct !== 1 ? 'opacity-50 pointer-events-none' : ''}`}
          >
            <h2 className="text-2xl font-bold mb-6">ACTE 1 — Déclaration de la marque</h2>
            <form onSubmit={handleAct1Submit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Nom de la marque *</label>
                  <input required type="text" value={brandData.name} onChange={e => setBrandData({...brandData, name: e.target.value})} className="w-full border p-2 rounded" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Industrie</label>
                  <input type="text" placeholder="ex: SaaS B2B" value={brandData.industry} onChange={e => setBrandData({...brandData, industry: e.target.value})} className="w-full border p-2 rounded" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description (2 phrases)</label>
                <textarea rows={2} value={brandData.description} onChange={e => setBrandData({...brandData, description: e.target.value})} className="w-full border p-2 rounded" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Audience cible</label>
                  <input type="text" value={brandData.audience} onChange={e => setBrandData({...brandData, audience: e.target.value})} className="w-full border p-2 rounded" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Site web</label>
                  <input type="url" value={brandData.website} onChange={e => setBrandData({...brandData, website: e.target.value})} className="w-full border p-2 rounded" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Horizon stratégique</label>
                  <select value={brandData.horizon} onChange={e => setBrandData({...brandData, horizon: e.target.value})} className="w-full border p-2 rounded">
                    <option value="30j">30 jours</option>
                    <option value="90j">90 jours</option>
                    <option value="1an">1 an</option>
                  </select>
                </div>
              </div>

              {currentAct === 1 && (
                <button type="submit" className="mt-6 px-6 py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition">
                  Lancer le pipeline
                </button>
              )}
            </form>
          </motion.section>

          {/* ACTE 2 */}
          <AnimatePresence>
            {currentAct >= 2 && (
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-white p-8 rounded-2xl shadow-sm border ${currentAct !== 2 ? 'opacity-50 pointer-events-none' : ''}`}
              >
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold">ACTE 2 — Enrichissement IA en cours...</h2>
                  <div className="w-1/3 bg-gray-200 rounded-full h-2.5">
                    <div className="bg-blue-600 h-2.5 rounded-full transition-all duration-500" style={{ width: `${enrichmentProgress}%` }}></div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {Object.entries(enrichedData).map(([key, value]) => (
                    <div key={key} className="border rounded-lg p-4 bg-gray-50 flex items-start justify-between min-h-[80px]">
                      <div className="w-full">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">{key}</label>
                        {value ? (
                          <input
                            className="w-full bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none transition-colors"
                            value={value}
                            onChange={(e) => setEnrichedData({...enrichedData, [key]: e.target.value})}
                          />
                        ) : (
                          <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                        )}
                      </div>
                      {value && (
                        <button className="text-gray-400 hover:text-yellow-500 ml-2" title="Régénérer">
                          ✨
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {currentAct === 2 && enrichmentProgress === 100 && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-8 flex justify-end">
                    <button
                      onClick={() => setCurrentAct(3)}
                      className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition flex items-center gap-2"
                    >
                      ✓ Approuver le profil
                    </button>
                  </motion.div>
                )}
              </motion.section>
            )}
          </AnimatePresence>

          {/* ACTE 3 */}
          <AnimatePresence>
            {currentAct >= 3 && (
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-white p-8 rounded-2xl shadow-sm border ${currentAct !== 3 ? 'opacity-50 pointer-events-none' : ''}`}
              >
                <h2 className="text-2xl font-bold mb-6">ACTE 3 — Génération de la stratégie</h2>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Global Strategy */}
                  <div className="lg:col-span-1 bg-gray-50 p-6 rounded-xl border">
                    <h3 className="font-bold text-lg mb-4">Stratégie Globale</h3>
                    <div className="space-y-4">
                      <div>
                        <strong className="text-sm">Vision :</strong>
                        <p className="text-sm text-gray-600">Éduquer le marché sur l&apos;impression 3D tout en mettant en avant le design sur-mesure.</p>
                      </div>
                      <div>
                        <strong className="text-sm">Piliers :</strong>
                        <ul className="text-sm text-gray-600 list-disc pl-5">
                          <li>Innovation technologique</li>
                          <li>Témoignages clients</li>
                          <li>Design & Style</li>
                        </ul>
                      </div>
                      <div>
                        <strong className="text-sm">KPIs Cibles :</strong>
                        <ul className="text-sm text-gray-600 list-disc pl-5">
                          <li>+20% engagement Instagram</li>
                          <li>50 leads qualifiés/mois</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Strategy Items */}
                  <div className="lg:col-span-2 space-y-4 max-h-[500px] overflow-y-auto pr-2">
                    <h3 className="font-bold text-lg mb-2">Plan d&apos;action suggéré</h3>
                    {strategyItems.map(item => (
                      <div key={item.id} className="border p-4 rounded-lg flex justify-between items-center bg-white">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-bold px-2 py-1 bg-gray-100 rounded text-gray-600">{item.kind}</span>
                            <span className="text-xs font-bold px-2 py-1 bg-blue-50 text-blue-600 rounded">{item.platform}</span>
                          </div>
                          <p className="font-medium">{item.title}</p>
                        </div>
                        {currentAct === 3 && (
                          <div className="flex gap-2">
                            <button className="text-red-500 hover:bg-red-50 p-2 rounded">✗</button>
                            <button className="text-green-600 bg-green-50 px-4 py-2 rounded font-medium hover:bg-green-100">✓ Retenir</button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {currentAct === 3 && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-8 flex justify-end">
                    <button
                      onClick={approveStrategyItems}
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
                    >
                      Concrétiser les items sélectionnés →
                    </button>
                  </motion.div>
                )}
              </motion.section>
            )}
          </AnimatePresence>

          {/* ACTE 4 & 5 */}
          <AnimatePresence>
            {currentAct >= 4 && (
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white p-8 rounded-2xl shadow-sm border"
              >
                <h2 className="text-2xl font-bold mb-6">ACTE 4 & 5 — Studio de concrétisation & Actions</h2>
                <div className="space-y-12">
                  {strategyItems.map(item => (
                    <div key={item.id} className="border rounded-xl overflow-hidden">
                      {/* Act 4: Concretization */}
                      <div className="p-6 bg-gray-50 flex flex-col md:flex-row gap-8">
                        {/* Preview Mockup */}
                        <div className="w-full md:w-1/2 flex justify-center">
                          <div className="w-full max-w-sm bg-white border rounded-xl overflow-hidden shadow-sm">
                            <div className="p-3 border-b flex items-center gap-2">
                              <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                              <span className="font-bold text-sm">additive</span>
                            </div>
                            <div className="aspect-square bg-gray-100 flex items-center justify-center relative">
                              {item.visual ? (
                                <Image src={item.visual} alt={item.title} fill className="object-cover" />
                              ) : concretizingItem === item.id ? (
                                <div className="text-center">
                                  <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                                  <p className="text-sm text-gray-500">Génération par IA...</p>
                                </div>
                              ) : (
                                <p className="text-gray-400">Visuel non généré</p>
                              )}
                            </div>
                            <div className="p-4">
                              <div className="flex gap-4 mb-2 text-xl">❤ 💬 📤</div>
                              <p className="text-sm font-bold mb-1">142 J&apos;aime</p>
                              <p className="text-sm">
                                <span className="font-bold mr-2">additive</span>
                                {item.title}. Découvrez pourquoi...
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Controls */}
                        <div className="w-full md:w-1/2 flex flex-col justify-center space-y-4">
                          <div>
                            <h3 className="font-bold text-lg">{item.title}</h3>
                            <p className="text-sm text-gray-500">{item.platform} • {item.kind}</p>
                          </div>
                          {item.status === "DRAFT" ? (
                            <button
                              onClick={() => concretizeItem(item.id)}
                              disabled={concretizingItem === item.id}
                              className="px-4 py-2 bg-purple-600 text-white rounded font-medium hover:bg-purple-700 disabled:opacity-50 inline-flex w-max"
                            >
                              Générer Visuel & Caption
                            </button>
                          ) : (
                            <div className="flex flex-col gap-2">
                              <button className="px-4 py-2 border rounded font-medium hover:bg-gray-50 inline-flex w-max items-center gap-2">
                                ✨ Régénérer avec FLUX
                              </button>
                              <button className="px-4 py-2 border rounded font-medium hover:bg-gray-50 inline-flex w-max items-center gap-2">
                                ✏️ Éditer Caption
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Act 5: Actions */}
                      {item.status === "READY" && (
                        <div className="border-t p-6 bg-white">
                          <h4 className="font-bold text-sm uppercase text-gray-500 mb-4">ACTE 5 — Action Finale</h4>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <button className="p-4 border rounded-xl hover:border-blue-500 hover:bg-blue-50 transition flex flex-col items-center text-center">
                              <span className="text-2xl mb-2">📱</span>
                              <span className="font-bold">Partager manuel</span>
                              <span className="text-xs text-gray-500 mt-1">Copier & télécharger</span>
                            </button>
                            <button className="p-4 border rounded-xl hover:border-blue-500 hover:bg-blue-50 transition flex flex-col items-center text-center">
                              <span className="text-2xl mb-2">📅</span>
                              <span className="font-bold">Programmer</span>
                              <span className="text-xs text-gray-500 mt-1">Via calendrier</span>
                            </button>
                            <button className="p-4 border rounded-xl hover:border-blue-500 hover:bg-blue-50 transition flex flex-col items-center text-center">
                              <span className="text-2xl mb-2">🚀</span>
                              <span className="font-bold">Publier Auto</span>
                              <span className="text-xs text-gray-500 mt-1">API directe</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </motion.section>
            )}
          </AnimatePresence>
        </div>
      </div>
    </main>
  );
}
