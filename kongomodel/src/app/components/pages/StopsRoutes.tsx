import React, { useState, useEffect } from "react";
import { MapPin, Plus, Loader2, Search, Trash2, Edit2 } from "../../../lib/icons";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/Card";
import { supabase } from "../../../lib/supabase";
import { useAppState } from "../../../hooks/useAppState";
import { toast } from "sonner";
import { AddStopForm } from "../forms/AddStopForm";

export function StopsRoutes() {
  const { userRole, agencyId } = useAppState();
  const [isLoading, setIsLoading] = useState(true);
  const [stops, setStops] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showStopModal, setShowStopModal] = useState(false);
  const [editingStop, setEditingStop] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, [userRole, agencyId]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch Global Stops (Locations)
      const { data: stopsData, error: stopsError } = await supabase
        .from('stops')
        .select('*, locations(name)')
        .order('name', { ascending: true });
      
      if (stopsError) throw stopsError;
      setStops(stopsData || []);

    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Erreur lors du chargement des données");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteStop = async (id: string) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cet arrêt ?")) return;
    try {
      const { error } = await supabase.from("stops").delete().eq("id", id);
      if (error) throw error;
      toast.success("Arrêt supprimé");
      fetchData();
    } catch (err: any) {
      toast.error("Erreur: " + err.message);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-[#007AFF]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[32px] font-semibold text-[#1D1D1F] tracking-tight">Points de Vente & Arrêts</h1>
          <p className="text-[15px] text-[#86868B] mt-1">Gérez vos sites d'agence et les points d'arrêt</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#86868B]" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-11 pl-10 pr-4 bg-white border border-black/10 rounded-xl text-[14px] w-[250px] focus:outline-none focus:ring-2 focus:ring-[#007AFF]/20 transition-all"
            />
          </div>
        </div>
      </div>

      {/* Global Stops (Locations) */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Terminaux & Arrêts de Bus</CardTitle>
              <CardDescription>Points de ramassage officiels</CardDescription>
            </div>
            {(userRole === 'agency' || userRole === 'superuser') && (
              <button
                onClick={() => { setEditingStop(null); setShowStopModal(true); }}
                className="h-10 px-4 bg-[#F5F5F7] text-[#1D1D1F] border border-black/5 rounded-xl flex items-center gap-2 hover:bg-[#E8E8ED] transition-all font-medium text-[14px]"
              >
                <Plus className="w-4 h-4" />
                Nouveau
              </button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#F5F5F7] border-b border-black/5">
                <tr>
                  <th className="px-6 py-4 text-left text-[13px] font-semibold text-[#1D1D1F]">Nom de l'Arrêt</th>
                  <th className="px-6 py-4 text-left text-[13px] font-semibold text-[#1D1D1F]">Ville</th>
                  <th className="px-6 py-4 text-left text-[13px] font-semibold text-[#1D1D1F]">Adresse / Zone</th>
                  {userRole !== 'superuser' && <th className="px-6 py-4 text-right text-[13px] font-semibold text-[#1D1D1F]">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {stops.map((stop) => (
                  <tr key={stop.id} className="hover:bg-black/5 transition-all">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-[#007AFF]/10 flex items-center justify-center">
                          <MapPin className="w-5 h-5 text-[#007AFF]" />
                        </div>
                        <span className="text-[15px] font-semibold text-[#1D1D1F]">{stop.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-[14px] text-[#1D1D1F] capitalize">{stop.locations?.name || stop.city_name}</td>
                    <td className="px-6 py-4 text-[14px] text-[#86868B]">{stop.address || "N/A"}</td>
                    {userRole !== 'superuser' && (
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => { setEditingStop(stop); setShowStopModal(true); }}
                            className="p-2 hover:bg-black/5 rounded-lg group transition-all"
                          >
                            <Edit2 className="w-4 h-4 text-[#86868B] group-hover:text-[#1D1D1F]" />
                          </button>
                          <button 
                            onClick={() => handleDeleteStop(stop.id)}
                            className="p-2 hover:bg-[#FF3B30]/10 rounded-lg group transition-all"
                          >
                            <Trash2 className="w-4 h-4 text-[#86868B] group-hover:text-[#FF3B30]" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Create/Edit Stop Modal */}
      {showStopModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in zoom-in duration-200">
          <Card className="w-full max-w-lg shadow-2xl">
            <CardHeader>
              <CardTitle>{editingStop ? "Modifier l'Arrêt" : "Nouvel Arrêt"}</CardTitle>
              <CardDescription>
                {editingStop ? "Modifiez les détails de cet arrêt officiel." : "Ajoutez un nouvel arrêt ou terminal de bus officiel."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AddStopForm 
                onSuccess={() => { 
                  setShowStopModal(false); 
                  setEditingStop(null);
                  fetchData(); 
                }} 
                onCancel={() => {
                  setShowStopModal(false);
                  setEditingStop(null);
                }}
                initialData={editingStop} 
              />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}


