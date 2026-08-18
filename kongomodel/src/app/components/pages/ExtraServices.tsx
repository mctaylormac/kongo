import React, { useState, useEffect } from "react";
import { 
  Plus, Search, Loader2, Edit2, Trash2, X, CATEGORY_ICONS, 
  Zap, CheckCircle, Luggage, AlertCircle, Package 
} from "../../../lib/icons";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/Card";
import { supabase } from "../../../lib/supabase";
import { useAppState } from "../../../hooks/useAppState";
import { toast } from "sonner";
import { AddExtraServiceForm } from "../forms/AddExtraServiceForm";

interface ExtraService {
  id: string;
  agency_id: string;
  title: string;
  description: string;
  category: string;
  sub_category?: string;
  price: number;
  min_weight?: number;
  max_weight?: number;
  icon?: string;
  is_active: boolean;
  created_at: string;
  agencies?: {
    name: string;
  };
}


export function ExtraServices() {
  const { userRole, agencyId, isLoading: isAppStateLoading } = useAppState();
  const [services, setServices] = useState<ExtraService[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedService, setSelectedService] = useState<ExtraService | null>(null);

  const fetchServices = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('extra_services')
        .select('*, agencies(name)')
        .order('created_at', { ascending: false });

      if (userRole !== 'superuser') {
        if (!agencyId) {
          setServices([]);
          setIsLoading(false);
          return;
        }
        query = query.eq('agency_id', agencyId);
      }

      const { data, error } = await query;
      if (error) throw error;
      setServices(data || []);
    } catch (error) {
      console.error("Error fetching services:", error);
      toast.error("Échec du chargement des services");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isAppStateLoading && userRole !== 'guest') {
      fetchServices();
    }
  }, [userRole, agencyId, isAppStateLoading]);

  const filteredServices = services.filter(s => 
    s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDeleteService = async (id: string) => {
    if (!confirm("Voulez-vous vraiment supprimer ce service ?")) return;
    try {
      const { error } = await supabase.from('extra_services').delete().eq('id', id);
      if (error) throw error;
      toast.success("Service supprimé");
      fetchServices();
    } catch (error) {
      toast.error("Erreur lors de la suppression");
    }
  };

  const toggleStatus = async (service: ExtraService) => {
    try {
      const { error } = await supabase
        .from('extra_services')
        .update({ is_active: !service.is_active })
        .eq('id', service.id);
      
      if (error) throw error;
      toast.success(`Service ${service.is_active ? 'désactivé' : 'activé'}`);
      fetchServices();
    } catch (error) {
      toast.error("Erreur lors de la mise à jour");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-[32px] font-bold text-[#1D1D1F] tracking-tight">Services Supplémentaires</h1>
          <p className="text-[15px] text-[#86868B] mt-1">Configurez les services additionnels pour vos voyages (Bagages, Repas, etc.)</p>
        </div>
        {(userRole === 'agency' || userRole === 'chef') && (
          <button 
            onClick={() => {
              setSelectedService(null);
              setShowAddModal(true);
            }}
            className="h-11 px-6 bg-[#1D1D1F] text-white rounded-xl flex items-center justify-center gap-2 hover:bg-[#3A3A3C] transition-all shadow-sm"
          >
            <Plus className="w-5 h-5" strokeWidth={2.5} />
            <span className="text-[15px] font-medium">Ajouter un service</span>
          </button>
        )}
      </div>

      {/* Stats Quick View */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="bg-white">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center">
              <Zap className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-[12px] font-bold text-[#86868B] uppercase tracking-wider">Total Services</p>
              <p className="text-[24px] font-bold text-[#1D1D1F] leading-none mt-1">{services.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-[#34C759]" />
            </div>
            <div>
              <p className="text-[12px] font-bold text-[#86868B] uppercase tracking-wider">Actifs</p>
              <p className="text-[24px] font-bold text-[#34C759] leading-none mt-1">
                {services.filter(s => s.is_active).length}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center">
              <Luggage className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-[12px] font-bold text-[#86868B] uppercase tracking-wider">Catégorie Bagages</p>
              <p className="text-[24px] font-bold text-[#1D1D1F] leading-none mt-1">
                {services.filter(s => s.category === 'Baggage').length}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#86868B]" />
        <input
          type="text"
          placeholder="Rechercher un service..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full h-11 pl-10 pr-4 bg-white border border-black/5 rounded-xl text-[15px] focus:outline-none focus:ring-2 focus:ring-black/5 transition-all shadow-sm"
        />
      </div>

      {/* Services Table */}
      <Card className="overflow-hidden border-black/5 shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-black/[0.02] border-b border-black/5">
                  <th className="px-6 py-4 text-[13px] font-bold text-[#1D1D1F] uppercase tracking-wider">Service</th>
                  {userRole === 'superuser' && <th className="px-6 py-4 text-[13px] font-bold text-[#1D1D1F] uppercase tracking-wider">Agence</th>}
                  <th className="px-6 py-4 text-[13px] font-bold text-[#1D1D1F] uppercase tracking-wider">Catégorie</th>
                  <th className="px-6 py-4 text-[13px] font-bold text-[#1D1D1F] uppercase tracking-wider text-right">Prix</th>
                  <th className="px-6 py-4 text-[13px] font-bold text-[#1D1D1F] uppercase tracking-wider text-center">Statut</th>
                  {userRole !== 'superuser' && <th className="px-6 py-4 text-[13px] font-bold text-[#1D1D1F] uppercase tracking-wider text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <Loader2 className="w-10 h-10 animate-spin text-[#1D1D1F]/20" />
                        <p className="text-[14px] text-[#86868B] font-medium">Chargement des services...</p>
                      </div>
                    </td>
                  </tr>
                ) : filteredServices.length > 0 ? (
                  filteredServices.map((service) => {
                    const CategoryIcon = CATEGORY_ICONS[service.category] || Package;

                    return (
                      <tr key={service.id} className="hover:bg-black/[0.01] transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-slate-50 border border-black/5 flex items-center justify-center shadow-sm">
                              <CategoryIcon className="w-5 h-5 text-[#1D1D1F]" />
                            </div>
                            <div>
                              <div className="text-[15px] font-bold text-[#1D1D1F] tracking-tight">
                                {service.title}
                              </div>
                              <div className="text-[12px] text-[#86868B] max-w-[250px] truncate">{service.description}</div>
                            </div>
                          </div>
                        </td>
                        {userRole === 'superuser' && (
                          <td className="px-6 py-4">
                            <span className="text-[14px] font-semibold text-[#1D1D1F] bg-blue-50 text-blue-700 px-2 py-1 rounded-md border border-blue-100">
                              {service.agencies?.name || "Agence inconnue"}
                            </span>
                          </td>
                        )}
                        <td className="px-6 py-4">
                          <span className="text-[14px] font-medium text-[#1D1D1F] bg-black/5 px-2 py-1 rounded-md">
                            {service.category}
                            {service.sub_category && ` / ${service.sub_category}`}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right text-[15px] font-bold text-[#1D1D1F]">
                          {service.price.toLocaleString()} CDF
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex justify-center">
                            <button 
                              onClick={() => {
                                if (userRole !== 'superuser') toggleStatus(service);
                              }}
                              disabled={userRole === 'superuser'}
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-bold transition-all ${
                                service.is_active 
                                ? "bg-[#34C759]/10 text-[#34C759] hover:bg-[#34C759]/20" 
                                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                              } ${userRole === 'superuser' ? 'cursor-default' : ''}`}
                            >
                              {service.is_active ? <CheckCircle className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                              {service.is_active ? "Actif" : "Inactif"}
                            </button>
                          </div>
                        </td>
                        {userRole !== 'superuser' && (
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button 
                                onClick={() => {
                                  setSelectedService(service);
                                  setShowAddModal(true);
                                }}
                                className="p-2 hover:bg-black/5 rounded-lg transition-all text-[#86868B] hover:text-[#1D1D1F]"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => handleDeleteService(service.id)}
                                className="p-2 hover:bg-red-50 rounded-lg transition-all text-[#86868B] hover:text-red-500"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-20 text-center text-[#86868B] italic font-medium">
                      Aucun service supplémentaire trouvé.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Service Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in zoom-in duration-200">
          <Card className="w-full max-w-lg shadow-2xl overflow-hidden">
            <CardHeader className="relative">
              <button 
                onClick={() => {
                  setShowAddModal(false);
                  setSelectedService(null);
                }}
                className="absolute right-4 top-4 p-2 hover:bg-black/5 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-[#86868B]" />
              </button>
              <CardTitle>{selectedService ? "Modifier le Service" : "Ajouter un Service"}</CardTitle>
              <CardDescription>
                {selectedService ? "Mettez à jour les détails du service." : "Créez un nouveau service optionnel pour vos passagers."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AddExtraServiceForm 
                initialData={selectedService}
                onSuccess={() => {
                  setShowAddModal(false);
                  setSelectedService(null);
                  fetchServices();
                }}
                onCancel={() => {
                  setShowAddModal(false);
                  setSelectedService(null);
                }}
              />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
