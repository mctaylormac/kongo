import React, { useState, useEffect } from "react";
import { Bus, Plus, Search, Filter, MoreVertical, Wrench, CheckCircle, AlertCircle, Loader2, Trash2, Edit2, X } from "../../../lib/icons";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/Card";
import { supabase } from "../../../lib/supabase";
import { useAppState } from "../../../hooks/useAppState";
import { toast } from "sonner";
import { AddBusForm } from "../forms/AddBusForm";


interface BusData {
  id: string;
  name?: string;
  type?: string;
  plate_number: string;
  capacity: number;
  status: string;
  agency_id: string;
  agencies: { name: string };
  drivers?: { full_name: string }[];
  last_maintenance: string | null;
  total_trips?: number;
}

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  active: { label: "Actif", color: "bg-[#34C759]/10 text-[#34C759]", icon: CheckCircle },
  "on-trip": { label: "En Voyage", color: "bg-[#007AFF]/10 text-[#007AFF]", icon: Bus },
  maintenance: { label: "Maintenance", color: "bg-[#FF3B30]/10 text-[#FF3B30]", icon: Wrench },
  inactive: { label: "Inactif", color: "bg-gray-100 text-gray-500", icon: AlertCircle },
};

export function Buses() {
  const { userRole, agencyId, isLoading: isAppStateLoading } = useAppState();
  const [buses, setBuses] = useState<BusData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedBus, setSelectedBus] = useState<BusData | null>(null);

  const fetchBuses = async () => {
    setIsLoading(true);
    try {
      let busQuery = supabase
        .from('buses')
        .select('*, agencies(name), drivers(full_name)')
        .order('id', { ascending: false });

      let tripQuery = supabase
        .from('trips')
        .select('bus_id')
        .in('status', ['scheduled', 'in_progress', 'departed', 'full']);

      if (userRole !== 'superuser') {
        if (!agencyId) {
          setBuses([]);
          setIsLoading(false);
          return;
        }
        busQuery = busQuery.eq('agency_id', agencyId);
        tripQuery = tripQuery.eq('agency_id', agencyId);
      }

      const [busResult, tripResult] = await Promise.all([busQuery, tripQuery]);
      if (busResult.error) throw busResult.error;
      if (tripResult.error) throw tripResult.error;

      const activeTripBusIds = new Set((tripResult.data || []).map((trip: any) => trip.bus_id));
      const busesWithStatus = (busResult.data || []).map((bus: any) => ({
        ...bus,
        status: activeTripBusIds.has(bus.id) ? 'on-trip' : bus.status,
      }));

      setBuses(busesWithStatus as BusData[]);
    } catch (error) {
      console.error("Error fetching buses:", error);
      toast.error("Échec du chargement des bus");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isAppStateLoading && userRole !== 'guest') {
      fetchBuses();
    }
  }, [userRole, agencyId, isAppStateLoading]);

  const filteredBuses = buses.filter(b => 
    b.plate_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.agencies?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDeleteBus = async (id: string) => {
    if (!confirm("Voulez-vous vraiment supprimer ce bus ?")) return;
    try {
      const { error } = await supabase.from('buses').delete().eq('id', id);
      if (error) throw error;
      toast.success("Bus supprimé");
      fetchBuses();
    } catch (error) {
      toast.error("Erreur lors de la suppression");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-[32px] font-bold text-[#1D1D1F] tracking-tight">Gestion de la Flotte</h1>
          <p className="text-[15px] text-[#86868B] mt-1">Supervisez l'état et la disponibilité de vos bus</p>
        </div>
        {(userRole === 'agency' || userRole === 'chef') && (
          <button 
            onClick={() => {
              setSelectedBus(null);
              setShowAddModal(true);
            }}
            className="h-11 px-6 bg-[#1D1D1F] text-white rounded-xl flex items-center justify-center gap-2 hover:bg-[#3A3A3C] transition-all shadow-sm"
          >
            <Plus className="w-5 h-5" strokeWidth={2.5} />
            <span className="text-[15px] font-medium">Nouveau</span>
          </button>
        )}
      </div>

      {/* Stats Quick View */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
              <Bus className="w-6 h-6 text-[#007AFF]" />
            </div>
            <div>
              <p className="text-[12px] font-bold text-[#86868B] uppercase tracking-wider">Total Bus</p>
              <p className="text-[24px] font-bold text-[#1D1D1F] leading-none mt-1">{buses.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-[#34C759]" />
            </div>
            <div>
              <p className="text-[12px] font-bold text-[#86868B] uppercase tracking-wider">Prêts</p>
              <p className="text-[24px] font-bold text-[#34C759] leading-none mt-1">
                {buses.filter(b => b.status === 'active').length}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-100/50 flex items-center justify-center text-xl">
              ✈️
            </div>
            <div>
              <p className="text-[12px] font-bold text-[#86868B] uppercase tracking-wider">En Voyage</p>
              <p className="text-[24px] font-bold text-[#007AFF] leading-none mt-1">
                {buses.filter(b => b.status === 'on-trip').length}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center">
              <Wrench className="w-6 h-6 text-[#FF3B30]" />
            </div>
            <div>
              <p className="text-[12px] font-bold text-[#86868B] uppercase tracking-wider">Maintenance</p>
              <p className="text-[24px] font-bold text-[#FF3B30] leading-none mt-1">
                {buses.filter(b => b.status === 'maintenance').length}
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
          placeholder="Rechercher par plaque ou agence..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full h-11 pl-10 pr-4 bg-white border border-black/5 rounded-xl text-[15px] focus:outline-none focus:ring-2 focus:ring-black/5 transition-all shadow-sm"
        />
      </div>

      {/* Buses Table */}
      <Card className="overflow-hidden border-black/5 shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-black/[0.02] border-b border-black/5">
                  <th className="px-6 py-4 text-[13px] font-bold text-[#1D1D1F] uppercase tracking-wider">Plaque & Bus</th>
                  <th className="px-6 py-4 text-[13px] font-bold text-[#1D1D1F] uppercase tracking-wider">Agence</th>
                  <th className="px-6 py-4 text-[13px] font-bold text-[#1D1D1F] uppercase tracking-wider">Chauffeur</th>
                  <th className="px-6 py-4 text-[13px] font-bold text-[#1D1D1F] uppercase tracking-wider text-center">Capacité</th>
                  <th className="px-6 py-4 text-[13px] font-bold text-[#1D1D1F] uppercase tracking-wider">Statut</th>
                  {(userRole === 'agency' || userRole === 'chef') && <th className="px-6 py-4 text-[13px] font-bold text-[#1D1D1F] uppercase tracking-wider text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <Loader2 className="w-10 h-10 animate-spin text-[#1D1D1F]/20" />
                        <p className="text-[14px] text-[#86868B] font-medium">Chargement de la flotte...</p>
                      </div>
                    </td>
                  </tr>
                ) : filteredBuses.length > 0 ? (
                  filteredBuses.map((bus) => {
                    const config = statusConfig[bus.status] || statusConfig.inactive;
                    const StatusIcon = config.icon;
                    // @ts-ignore
                    const assignedDriver = bus.drivers?.[0]?.full_name;

                    return (
                      <tr key={bus.id} className="hover:bg-black/[0.01] transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-slate-50 border border-black/5 flex items-center justify-center shadow-sm">
                              <Bus className="w-5 h-5 text-[#1D1D1F]" />
                            </div>
                            <div>
                              <div className="text-[15px] font-bold text-[#1D1D1F] tracking-tight flex items-center gap-2">
                                {bus.plate_number}
                                {bus.type && <span className="text-[10px] bg-black/5 px-2 py-0.5 rounded-full font-medium text-[#86868B]">{bus.type}</span>}
                              </div>
                              {bus.name && <div className="text-[13px] text-[#86868B]">{bus.name}</div>}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-[14px] font-medium text-[#1D1D1F]">
                          {bus.agencies?.name || "N/A"}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {assignedDriver ? (
                              <div className="flex flex-col items-start">
                                <span className="text-[14px] font-semibold text-[#1D1D1F]">{assignedDriver}</span>
                                <span className="text-[11px] text-blue-600 font-bold uppercase tracking-tight">Assigné</span>
                              </div>
                            ) : (
                              <span className="text-[13px] text-[#86868B] font-medium italic">Non assigné</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center text-[14px] font-medium text-[#1D1D1F]">
                          {bus.capacity}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-bold ${config.color}`}>
                            <StatusIcon className="w-3.5 h-3.5" />
                            {config.label}
                          </span>
                        </td>
                        {(userRole === 'agency' || userRole === 'chef') && (
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button 
                                onClick={() => {
                                  setSelectedBus(bus);
                                  setShowAddModal(true);
                                }}
                                className="p-2 hover:bg-black/5 rounded-lg transition-all text-[#86868B] hover:text-[#1D1D1F]"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => handleDeleteBus(bus.id)}
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
                    <td colSpan={6} className="px-6 py-20 text-center text-[#86868B] italic font-medium">
                      Aucun bus trouvé.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Add Bus Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in zoom-in duration-200">
          <Card className="w-full max-w-lg shadow-2xl">
            <CardHeader>
              <CardTitle>{selectedBus ? "Modifier le Bus" : "Ajouter un Bus"}</CardTitle>
              <CardDescription>{selectedBus ? "Mettez à jour les informations de ce véhicule." : "Enregistrez un nouveau véhicule dans votre flotte."}</CardDescription>
            </CardHeader>
            <CardContent>
              <AddBusForm 
                initialData={selectedBus}
                onSuccess={() => {
                  setShowAddModal(false);
                  setSelectedBus(null);
                  fetchBuses();
                }}
                onCancel={() => {
                  setShowAddModal(false);
                  setSelectedBus(null);
                }}
              />
            </CardContent>
          </Card>
        </div>
      )}

    </div>
  );
}
