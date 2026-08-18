import React, { useState, useEffect } from "react";
import { Plus, User, Search, Loader2, Mail, Phone, Trash2, Edit2, MapPin, Bus, X } from "../../../lib/icons";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/Card";
import { supabase } from "../../../lib/supabase";
import { useAppState } from "../../../hooks/useAppState";
import { toast } from "sonner";
import { AddStaffForm } from "../forms/AddStaffForm";
import { SiteAssignmentForm } from "../forms/SiteAssignmentForm";
import { BusAssignmentForm } from "../forms/BusAssignmentForm";

interface StaffMember {
  id: string;
  full_name: string;
  email: string | null;
  role: string | null;
  phone_number: string | null;
  status: string;
  agency_id: string | null;
  site_id: string | null;
  license_number: string | null;
  avatar_url?: string | null;
  agencies?: { name: string } | null;
  agency_sites?: { name: string; city: string } | null;
  created_at: string;
}

const roleConfig: Record<string, { label: string; color: string; icon: string }> = {
  driver: { label: "Chauffeur", color: "bg-[#007AFF]/10 text-[#007AFF]", icon: "🚗" },
  cashier: { label: "Caissier", color: "bg-[#34C759]/10 text-[#34C759]", icon: "💰" },
  chef: { label: "Chef d'Agence", color: "bg-[#FF9500]/10 text-[#FF9500]", icon: "👔" },
  agency: { label: "Agence", color: "bg-[#AF52DE]/10 text-[#AF52DE]", icon: "🏢" },
  superuser: { label: "Super Admin", color: "bg-[#1D1D1F]/10 text-[#1D1D1F]", icon: "🛡️" },
  admin: { label: "Admin", color: "bg-[#1D1D1F]/10 text-[#1D1D1F]", icon: "🛡️" },
  guest: { label: "Invité", color: "bg-gray-100 text-gray-500", icon: "👤" },
};

export function Staff() {
  const { userRole, agencyId, isLoading: isAppStateLoading } = useAppState();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [assigningSiteStaff, setAssigningSiteStaff] = useState<StaffMember | null>(null);
  const [assigningBusStaff, setAssigningBusStaff] = useState<StaffMember | null>(null);

  const fetchStaff = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('profiles')
        .select('*, agencies(name), agency_sites(name, city)')
        .order('created_at', { ascending: false });

      if (userRole !== 'superuser') {
        if (!agencyId) {
          setStaff([]);
          setIsLoading(false);
          return;
        }
        query = query.eq('agency_id', agencyId);
      }

      const { data, error } = await query;
      if (error) throw error;
      setStaff(data as any[] || []);
    } catch (error) {
      console.error("Error fetching staff:", error);
      toast.error("Échec du chargement du personnel");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isAppStateLoading && userRole !== 'guest') {
      fetchStaff();
    }
  }, [userRole, agencyId, isAppStateLoading]);

  const filteredStaff = staff.filter(s => 
    s.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.role?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDeleteStaff = async (id: string) => {
    if (!confirm("Voulez-vous vraiment retirer ce membre du personnel ?")) return;
    try {
      const { error } = await supabase.from('profiles').update({ agency_id: null }).eq('id', id);
      if (error) throw error;
      toast.success("Membre détaché avec succès");
      fetchStaff();
    } catch (error) {
      toast.error("Erreur lors de la suppression");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-[32px] font-bold text-[#1D1D1F] tracking-tight">Gestion du Personnel</h1>
          <p className="text-[15px] text-[#86868B] mt-1">Gérez les membres de l'équipe, rôles et permissions</p>
        </div>
        {(userRole === 'agency' || userRole === 'chef') && (
          <button
            onClick={() => setShowAddModal(true)}
            className="h-11 px-5 bg-[#1D1D1F] text-white rounded-xl flex items-center justify-center gap-2 hover:bg-[#3A3A3C] transition-all shadow-sm"
          >
            <Plus className="w-5 h-5" strokeWidth={2.5} />
            <span className="text-[15px] font-medium">Ajouter Personnel</span>
          </button>
        )}
      </div>

      {/* Stats Quick View */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
              <User className="w-6 h-6 text-[#007AFF]" />
            </div>
            <div>
              <p className="text-[12px] font-bold text-[#86868B] uppercase tracking-wider">Total Équipe</p>
              <p className="text-[24px] font-bold text-[#1D1D1F] leading-none mt-1">{staff.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center">
              <div className="text-xl">🚗</div>
            </div>
            <div>
              <p className="text-[12px] font-bold text-[#86868B] uppercase tracking-wider">Chauffeurs</p>
              <p className="text-[24px] font-bold text-[#34C759] leading-none mt-1">
                {staff.filter(s => s.role === 'driver').length}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center">
              <div className="text-xl">💰</div>
            </div>
            <div>
              <p className="text-[12px] font-bold text-[#86868B] uppercase tracking-wider">Caissiers</p>
              <p className="text-[24px] font-bold text-[#FF9500] leading-none mt-1">
                {staff.filter(s => s.role === 'cashier').length}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center">
              <div className="text-xl">🛡️</div>
            </div>
            <div>
              <p className="text-[12px] font-bold text-[#86868B] uppercase tracking-wider">Admin/Chefs</p>
              <p className="text-[24px] font-bold text-[#AF52DE] leading-none mt-1">
                {staff.filter(s => s.role === 'chef' || s.role === 'superuser').length}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filter */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#86868B]" />
          <input
            type="text"
            placeholder="Rechercher par nom, email ou rôle..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-11 pl-10 pr-4 bg-white border border-black/5 rounded-xl text-[15px] focus:outline-none focus:ring-2 focus:ring-black/5 transition-all shadow-sm"
          />
        </div>
      </div>

      {/* Staff Table */}
      <Card className="overflow-hidden border-black/5 shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-black/[0.02] border-b border-black/5">
                  <th className="px-6 py-4 text-[13px] font-bold text-[#1D1D1F] uppercase tracking-wider">Membre</th>
                  <th className="px-6 py-4 text-[13px] font-bold text-[#1D1D1F] uppercase tracking-wider">Rôle</th>
                  <th className="px-6 py-4 text-[13px] font-bold text-[#1D1D1F] uppercase tracking-wider">Affectation</th>
                  <th className="px-6 py-4 text-[13px] font-bold text-[#1D1D1F] uppercase tracking-wider">Contact</th>
                  {(userRole === 'agency' || userRole === 'chef') && <th className="px-6 py-4 text-[13px] font-bold text-[#1D1D1F] uppercase tracking-wider text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <Loader2 className="w-10 h-10 animate-spin text-[#1D1D1F]/20" />
                        <p className="text-[14px] text-[#86868B] font-medium">Chargement de l'équipe...</p>
                      </div>
                    </td>
                  </tr>
                ) : filteredStaff.length > 0 ? (
                  filteredStaff.map((s) => (
                    <tr key={s.id} className="hover:bg-black/[0.01] transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 border border-black/5 flex items-center justify-center text-[#1D1D1F] font-bold shadow-sm overflow-hidden">
                            {s.avatar_url ? (
                              <img src={s.avatar_url} alt={s.full_name} className="w-full h-full object-cover" />
                            ) : (
                              s.full_name?.charAt(0).toUpperCase()
                            )}
                          </div>
                          <div>
                            <p className="text-[15px] font-semibold text-[#1D1D1F] leading-tight">{s.full_name}</p>
                            <div className="flex flex-col">
                              <p className="text-[12px] text-[#86868B] mt-0.5">{s.email}</p>
                              {s.role === 'driver' && s.license_number && (
                                <p className="text-[11px] text-[#007AFF] font-medium mt-0.5 flex items-center gap-1">
                                  <span className="opacity-70">Permis:</span> {s.license_number}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-bold ${(roleConfig[s.role || ""] || roleConfig.guest).color}`}>
                          <span className="text-[14px]">{(roleConfig[s.role || ""] || roleConfig.guest).icon}</span>
                          {(roleConfig[s.role || ""] || roleConfig.guest).label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <p className="text-[14px] font-medium text-[#1D1D1F]">
                            {s.agencies?.name || "Kongo Global"}
                          </p>
                          {s.agency_sites && (
                            <p className="text-[12px] text-purple-600 flex items-center gap-1">
                              <MapPin className="w-3 h-3" /> {s.agency_sites.name}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2 text-[13px] text-[#86868B]">
                            <Phone className="w-3 h-3" /> {s.phone_number || "N/A"}
                          </div>
                          <div className="flex items-center gap-2 text-[13px] text-[#86868B]">
                            <Mail className="w-3 h-3" /> {s.email || "N/A"}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {(userRole === 'agency' || userRole === 'chef') && (
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {/* Modifier */}
                            {(userRole === 'agency' || userRole === 'chef') && (
                              <button 
                                onClick={() => setEditingStaff(s)}
                                title="Modifier"
                                className="p-2 hover:bg-black/5 rounded-lg transition-all text-[#86868B] hover:text-[#1D1D1F]"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                            )}
                            
                            {/* Affectation Site */}
                            <button 
                              onClick={() => setAssigningSiteStaff(s)}
                              title="Affecter à un Site"
                              className="p-2 hover:bg-purple-50 rounded-lg transition-all text-[#86868B] hover:text-purple-600"
                            >
                              <MapPin className="w-4 h-4" />
                            </button>

                            {/* Affectation Bus (seulement pour les chauffeurs) */}
                            {s.role === 'driver' && (
                              <button 
                                onClick={() => setAssigningBusStaff(s)}
                                title="Affecter à un Bus"
                                className="p-2 hover:bg-blue-50 rounded-lg transition-all text-[#86868B] hover:text-blue-600"
                              >
                                <Bus className="w-4 h-4" />
                              </button>
                            )}

                            {/* Supprimer */}
                            {(userRole === 'agency' || userRole === 'chef') && (
                              <button 
                                onClick={() => handleDeleteStaff(s.id)}
                                title="Détacher"
                                className="p-2 hover:bg-red-50 rounded-lg transition-all text-[#86868B] hover:text-red-500"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-20 text-center text-[#86868B] italic font-medium">
                      Aucun membre trouvé.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Modals */}
      
      {/* Create Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in zoom-in duration-200">
          <Card className="w-full max-w-2xl shadow-2xl relative overflow-hidden">
            <button 
              onClick={() => setShowAddModal(false)}
              className="absolute right-4 top-4 p-2 hover:bg-black/5 rounded-full transition-colors z-10"
            >
              <X className="w-5 h-5 text-[#86868B]" />
            </button>
            <CardHeader className="pb-2">
              <CardTitle className="text-2xl">Nouveau Membre du Personnel</CardTitle>
              <CardDescription>Enregistrez un nouvel agent dans le système Kongo.</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <AddStaffForm 
                onSuccess={() => {
                  setShowAddModal(false);
                  fetchStaff();
                }}
                onCancel={() => setShowAddModal(false)}
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Edit Modal */}
      {editingStaff && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in zoom-in duration-200">
          <Card className="w-full max-w-2xl shadow-2xl relative overflow-hidden">
            <button 
              onClick={() => setEditingStaff(null)}
              className="absolute right-4 top-4 p-2 hover:bg-black/5 rounded-full transition-colors z-10"
            >
              <X className="w-5 h-5 text-[#86868B]" />
            </button>
            <CardHeader className="pb-2">
              <CardTitle className="text-2xl">Modifier le Profil</CardTitle>
              <CardDescription>Mettez à jour les informations de {editingStaff.full_name}.</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <AddStaffForm 
                initialData={editingStaff}
                onSuccess={() => {
                  setEditingStaff(null);
                  fetchStaff();
                }}
                onCancel={() => setEditingStaff(null)}
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Site Assignment Modal */}
      {assigningSiteStaff && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in zoom-in duration-200">
          <Card className="w-full max-w-md shadow-2xl relative overflow-hidden">
            <button 
              onClick={() => setAssigningSiteStaff(null)}
              className="absolute right-4 top-4 p-2 hover:bg-black/5 rounded-full transition-colors z-10"
            >
              <X className="w-5 h-5 text-[#86868B]" />
            </button>
            <CardHeader className="pb-2">
              <CardTitle className="text-xl">Affectation au Site</CardTitle>
              <CardDescription>Définissez l'agence physique de rattachement.</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <SiteAssignmentForm 
                staffMember={assigningSiteStaff}
                onSuccess={() => {
                  setAssigningSiteStaff(null);
                  fetchStaff();
                }}
                onCancel={() => setAssigningSiteStaff(null)}
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Bus Assignment Modal */}
      {assigningBusStaff && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in zoom-in duration-200">
          <Card className="w-full max-w-md shadow-2xl relative overflow-hidden">
            <button 
              onClick={() => setAssigningBusStaff(null)}
              className="absolute right-4 top-4 p-2 hover:bg-black/5 rounded-full transition-colors z-10"
            >
              <X className="w-5 h-5 text-[#86868B]" />
            </button>
            <CardHeader className="pb-2">
              <CardTitle className="text-xl">Affectation du Bus</CardTitle>
              <CardDescription>Assignez un véhicule de service à ce chauffeur.</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <BusAssignmentForm 
                staffMember={assigningBusStaff}
                onSuccess={() => {
                  setAssigningBusStaff(null);
                  fetchStaff();
                }}
                onCancel={() => setAssigningBusStaff(null)}
              />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
