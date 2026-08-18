import React, { useState, useEffect } from "react";
import { Building2, Store, Plus, Loader2, Search, Trash2, Edit2, MapPin, Phone, ArrowLeft } from "../../../lib/icons";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/Card";
import { supabase } from "../../../lib/supabase";
import { useAppState } from "../../../hooks/useAppState";
import { toast } from "sonner";
import { AddSiteForm } from "../forms/AddSiteForm";
import { useSearchParams, useNavigate } from "react-router";

export function Agencies() {
  const { userRole, agencyId } = useAppState();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const filterAgencyId = searchParams.get('id');
  
  const [isLoading, setIsLoading] = useState(true);
  const [agencySites, setAgencySites] = useState<any[]>([]);
  const [agencyName, setAgencyName] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingSite, setEditingSite] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, [userRole, agencyId, filterAgencyId]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      let query = supabase.from("agency_sites").select("*").order("created_at", { ascending: false });

      const targetAgencyId = filterAgencyId || (userRole !== "superuser" ? agencyId : null);

      if (targetAgencyId) {
        query = query.eq("agency_id", targetAgencyId);
        
        // Fetch agency name if filtering
        const { data: agencyData } = await supabase
          .from('agencies')
          .select('name')
          .eq('id', targetAgencyId)
          .single();
        if (agencyData) setAgencyName(agencyData.name);
      } else {
        setAgencyName(null);
      }

      const { data, error } = await query;
      if (error) throw error;
      setAgencySites(data || []);
    } catch (error: any) {
      toast.error("Erreur lors du chargement des points de vente");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSite = async (id: string) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer ce point de vente ?")) return;
    try {
      const { error } = await supabase.from("agency_sites").delete().eq("id", id);
      if (error) throw error;
      toast.success("Point de vente supprimé");
      fetchData();
    } catch (err: any) {
      toast.error("Erreur: " + err.message);
    }
  };

  const filteredSites = agencySites.filter(
    (s) =>
      s.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.address?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group by city for the overview panel
  const cityGroups = Array.from(new Set(agencySites.map((s) => s.city))).filter(Boolean);

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
        <div className="flex items-center gap-4">
          {filterAgencyId && (
            <button 
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-black/5 rounded-full transition-all"
            >
              <ArrowLeft className="w-6 h-6 text-[#1D1D1F]" />
            </button>
          )}
          <div>
            <h1 className="text-[32px] font-semibold text-[#1D1D1F] tracking-tight">
              {agencyName ? `Sites: ${agencyName}` : "Points de Vente"}
            </h1>
            <p className="text-[15px] text-[#86868B] mt-1">
              {agencyName 
                ? `Gestion des points de vente pour l'agence ${agencyName}`
                : "Gérez vos sites d'agence et les guichets de vente"}
            </p>
          </div>
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
         {userRole !== 'superuser' && (
           <button
             onClick={() => {
               setEditingSite(null);
               setShowCreateModal(true);
             }}
             className="h-11 px-5 bg-[#1D1D1F] text-white rounded-xl flex items-center gap-2 hover:bg-[#2C2C2E] transition-all shadow-sm"
           >
             <Plus className="w-5 h-5" strokeWidth={2.5} />
             <span className="text-[15px] font-medium">Nouveau</span>
           </button>
         )}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[13px] text-[#86868B]">Total Sites</p>
                <p className="text-[28px] font-semibold text-[#1D1D1F] mt-2">{agencySites.length}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-[#007AFF]/10 flex items-center justify-center">
                <Building2 className="w-6 h-6 text-[#007AFF]" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[13px] text-[#86868B]">Villes couvertes</p>
                <p className="text-[28px] font-semibold text-[#1D1D1F] mt-2">{cityGroups.length}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-[#34C759]/10 flex items-center justify-center">
                <MapPin className="w-6 h-6 text-[#34C759]" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[13px] text-[#86868B]">Sites actifs</p>
                <p className="text-[28px] font-semibold text-[#1D1D1F] mt-2">{agencySites.length}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-[#FF9500]/10 flex items-center justify-center">
                <Store className="w-6 h-6 text-[#FF9500]" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* City overview panel */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Répartition par Ville</CardTitle>
            <CardDescription>Vos sites regroupés par localité</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {cityGroups.map((city) => {
                const citySites = agencySites.filter((s) => s.city === city);
                return (
                  <div key={city} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] font-bold text-[#1D1D1F] uppercase tracking-wider">
                        {city}
                      </span>
                      <span className="text-[12px] font-medium text-[#86868B]">
                        {citySites.length} site{citySites.length > 1 ? "s" : ""}
                      </span>
                    </div>
                    <div className="h-1.5 bg-black/5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#34C759]"
                        style={{
                          width: `${(citySites.length / (agencySites.length || 1)) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
              {agencySites.length === 0 && (
                <p className="text-center text-[13px] text-[#86868B] py-4">
                  Aucun site enregistré
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Sites list */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Vos Points de Vente</CardTitle>
            <CardDescription>Sites actifs pour la vente de billets</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-black/5">
              {filteredSites.map((site) => (
                <div key={site.id} className="p-6 hover:bg-black/5 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-[#34C759]/10 flex items-center justify-center">
                        <Store className="w-6 h-6 text-[#34C759]" />
                      </div>
                      <div>
                        <h4 className="text-[17px] font-semibold text-[#1D1D1F]">{site.name}</h4>
                        <p className="text-[13px] text-[#86868B]">
                          {site.city}
                          {site.address ? ` • ${site.address}` : ""}
                        </p>
                        {site.phone && (
                          <p className="text-[12px] text-[#86868B] flex items-center gap-1 mt-0.5">
                            <Phone className="w-3 h-3" />
                            {site.phone}
                          </p>
                        )}
                      </div>
                    </div>
                     {userRole !== 'superuser' && (
                       <div className="flex items-center gap-2">
                         <span className="inline-flex px-2.5 py-1 rounded-full text-[12px] font-semibold bg-[#34C759]/10 text-[#34C759]">
                           Actif
                         </span>
                         <button
                           onClick={() => {
                             setEditingSite(site);
                             setShowCreateModal(true);
                           }}
                           className="p-2 hover:bg-black/5 rounded-lg group transition-all"
                           title="Modifier"
                         >
                           <Edit2 className="w-4 h-4 text-[#86868B] group-hover:text-[#1D1D1F]" />
                         </button>
                         <button
                           onClick={() => handleDeleteSite(site.id)}
                           className="p-2 hover:bg-[#FF3B30]/10 rounded-lg group transition-all"
                           title="Supprimer"
                         >
                           <Trash2 className="w-4 h-4 text-[#86868B] group-hover:text-[#FF3B30]" />
                         </button>
                       </div>
                     )}
                  </div>
                </div>
              ))}
              {filteredSites.length === 0 && (
                <div className="p-12 text-center">
                  <Store className="w-12 h-12 text-black/10 mx-auto mb-3" />
                  <p className="text-[14px] text-[#86868B]">
                    {searchQuery
                      ? "Aucun site ne correspond à votre recherche."
                      : "Aucun point de vente enregistré. Cliquez sur « Nouveau » pour en créer un."}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create / Edit Site Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in zoom-in duration-200">
          <Card className="w-full max-w-lg shadow-2xl">
            <CardHeader>
              <CardTitle>
                {editingSite ? "Modifier le Point de Vente" : "Nouveau Point de Vente"}
              </CardTitle>
              <CardDescription>
                {editingSite
                  ? "Modifiez les détails de ce site."
                  : "Ajoutez un nouveau site d'agence pour la vente de billets."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AddSiteForm
                onSuccess={() => {
                  setShowCreateModal(false);
                  setEditingSite(null);
                  fetchData();
                }}
                onCancel={() => {
                  setShowCreateModal(false);
                  setEditingSite(null);
                }}
                initialData={editingSite}
              />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
