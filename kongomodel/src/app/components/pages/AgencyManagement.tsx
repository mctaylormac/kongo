import React, { useState, useEffect, useRef } from "react";
import { 
  Building2, Plus, Search, Filter, MoreHorizontal, 
  ShieldCheck, ShieldAlert, Bus, Map as MapIcon, Ticket, 
  ChevronRight, X, Loader2, Mail, Lock, User, ImagePlus, Upload, Star,
  Edit2, Trash2
} from "../../../lib/icons";
import { Card, CardContent } from "../ui/Card";
import { supabase } from "../../../lib/supabase";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";

interface Agency {
  id: string;
  name: string;
  logo_url: string | null;
  status: 'active' | 'suspended' | 'pending';
  commission_rate: number;
  description: string | null;
  country?: string | null;
  country_code?: string | null;
  is_trusted: boolean;
  created_at: string;
  _count?: {
    buses: number;
    trips: number;
    bookings: number;
  }
}

export function AgencyManagement() {
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAgency, setSelectedAgency] = useState<Agency | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'suspended'>('all');
  const [editMode, setEditMode] = useState(false);
  
  // Form State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    commission_rate: 5,
    description: "",
    country: "République Démocratique du Congo",
    country_code: "RDC",
    admin_email: "",
    admin_password: "",
    admin_name: ""
  });
  const [selectedCountryFilter, setSelectedCountryFilter] = useState<string>("all");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchAgencies();
  }, []);

  const fetchAgencies = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('agencies')
        .select(`
          *,
          buses:buses(count),
          trips:trips(count)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const agenciesData = data || [];

      // Count bookings per agency via trips relation
      const bookingsCountByAgency = await Promise.all(
        agenciesData.map(async (agency) => {
          const { count } = await supabase
            .from('bookings')
            .select('id, trips!inner(agency_id)', { count: 'exact', head: true })
            .eq('trips.agency_id', agency.id);
          return { agencyId: agency.id, count: count || 0 };
        })
      );

      const bookingsCountMap = new Map(
        bookingsCountByAgency.map((item) => [item.agencyId, item.count])
      );

      const formatted = agenciesData.map(agency => ({
        ...agency,
        _count: {
          buses: agency.buses?.[0]?.count || 0,
          trips: agency.trips?.[0]?.count || 0,
          bookings: bookingsCountMap.get(agency.id) || 0
        }
      }));

      setAgencies(formatted);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Erreur lors du chargement des agences");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogoChange = (file: File | null) => {
    if (!file) return;
    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/svg+xml"];
    if (!validTypes.includes(file.type)) {
      toast.error("Format invalide. Utilisez JPG, PNG, WebP ou SVG.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("L'image ne doit pas dépasser 2 Mo.");
      return;
    }
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const openCreateModal = () => {
    setEditMode(false);
    setSelectedAgency(null);
    setFormData({
      name: "",
      commission_rate: 5,
      description: "",
      country: "République Démocratique du Congo",
      country_code: "RDC",
      admin_email: "",
      admin_password: "",
      admin_name: ""
    });
    setLogoFile(null);
    setLogoPreview(null);
    setIsModalOpen(true);
  };

  const openEditModal = (agency: Agency) => {
    setEditMode(true);
    setFormData({
      name: agency.name,
      commission_rate: agency.commission_rate ?? 5,
      description: agency.description || '',
      country: agency.country || 'République Démocratique du Congo',
      country_code: agency.country_code || 'RDC',
      admin_email: '',
      admin_password: '',
      admin_name: ''
    });
    setLogoPreview(agency.logo_url || null);
    setLogoFile(null);
    setIsModalOpen(true);
  };

  const handleCreateAgency = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Upload logo si nouveau fichier sélectionné (avec fallback Data URL si le bucket storage échoue)
      let uploadedLogoUrl: string | null = null;
      if (logoFile) {
        try {
          const fileExt = logoFile.name.split('.').pop();
          const fileName = `agencies/logo_${Date.now()}.${fileExt}`;
          const { error: uploadErr } = await supabase.storage.from('app-assets').upload(fileName, logoFile, { upsert: true });
          if (!uploadErr) {
            const { data: publicData } = supabase.storage.from('app-assets').getPublicUrl(fileName);
            uploadedLogoUrl = publicData.publicUrl;
          } else {
            console.warn("Storage upload warning, using Data URL fallback:", uploadErr);
            uploadedLogoUrl = await new Promise<string>((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result as string);
              reader.readAsDataURL(logoFile);
            });
          }
        } catch (imgErr) {
          console.warn("Image conversion error:", imgErr);
        }
      }

      if (editMode && selectedAgency) {
        // ── MODE ÉDITION : UPDATE ──
        const updatePayload: any = {
          name: formData.name,
          commission_rate: formData.commission_rate,
          description: formData.description || null,
          country: formData.country,
          country_code: formData.country_code,
        };
        if (uploadedLogoUrl) updatePayload.logo_url = uploadedLogoUrl;

        const { error: updateErr } = await supabase
          .from('agencies')
          .update(updatePayload)
          .eq('id', selectedAgency.id);

        if (updateErr) throw updateErr;

        // Mettre à jour l'état local immédiatement
        const updatedAgency = { ...selectedAgency, ...updatePayload };
        setAgencies(prev => prev.map(a => a.id === selectedAgency.id ? updatedAgency : a));
        setSelectedAgency(updatedAgency);

        toast.success(`Agence "${formData.name}" modifiée avec succès !`);
      } else {
        // ── MODE CRÉATION : INSERT + Auth ──
        const { data: newAgency, error: agencyErr } = await supabase
          .from('agencies')
          .insert([{
            name: formData.name,
            commission_rate: formData.commission_rate,
            description: formData.description || null,
            country: formData.country,
            country_code: formData.country_code,
            logo_url: uploadedLogoUrl,
            status: 'active',
            is_trusted: true
          }])
          .select()
          .single();

        if (agencyErr) throw agencyErr;

        const { data: authData, error: authErr } = await supabase.auth.signUp({
          email: formData.admin_email,
          password: formData.admin_password,
          options: {
            data: {
              full_name: formData.admin_name,
              role: 'agency',
              agency_id: newAgency.id
            }
          }
        });

        if (authErr) throw authErr;

        if (authData.user) {
          await supabase.from('profiles').upsert({
            id: authData.user.id,
            email: formData.admin_email,
            full_name: formData.admin_name,
            role: 'agency',
            agency_id: newAgency.id
          });
        }

        toast.success("Agence et compte administrateur créés avec succès !");
        fetchAgencies();
      }

      setIsModalOpen(false);
      setEditMode(false);
      setFormData({ name: "", commission_rate: 5, description: "", country: "République Démocratique du Congo", country_code: "RDC", admin_email: "", admin_password: "", admin_name: "" });
      setLogoFile(null);
      setLogoPreview(null);
    } catch (err: any) {
      console.error("Error:", err);
      toast.error(err.message || "Erreur lors de l'opération");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    try {
      const { error } = await supabase
        .from('agencies')
        .update({ status: newStatus })
        .eq('id', id);
      
      if (error) throw error;
      
      setAgencies(prev => prev.map(a => a.id === id ? { ...a, status: newStatus as any } : a));
      if (selectedAgency?.id === id) setSelectedAgency(prev => prev ? { ...prev, status: newStatus as any } : null);
      
      toast.success(newStatus === 'active' ? "Agence réactivée" : "Agence suspendue");
    } catch (error) {
      toast.error("Erreur lors du changement de statut");
    }
  };

  const toggleTrustedStatus = async (id: string, currentTrusted: boolean) => {
    const newTrusted = !currentTrusted;
    try {
      const { error } = await supabase
        .from('agencies')
        .update({ is_trusted: newTrusted })
        .eq('id', id);

      if (error) throw error;

      setAgencies(prev => prev.map(a => a.id === id ? { ...a, is_trusted: newTrusted } : a));
      if (selectedAgency?.id === id) {
        setSelectedAgency(prev => prev ? { ...prev, is_trusted: newTrusted } : null);
      }

      toast.success(
        newTrusted 
          ? "Agence mise en avant ⭐ (Affichée sur l'accueil mobile dans Agences de Confiance)" 
          : "Agence retirée de la mise en avant"
      );
    } catch (error) {
      toast.error("Erreur lors du changement de statut");
    }
  };

  const handleDeleteAgency = async (agency: Agency) => {
    if (!confirm(`Supprimer définitivement "${agency.name}" ainsi que tous ses bus, voyages, réservations et données associées ? Cette action est irréversible.`)) return;

    try {
      // 1. Tenter la suppression via la fonction RPC SQL
      const { error: rpcErr } = await supabase.rpc('delete_agency_cascade', { p_agency_id: agency.id });

      if (rpcErr) {
        console.warn("RPC delete_agency_cascade fallback:", rpcErr);

        // 2. Cascade client-side si la fonction RPC n'est pas encore appliquée en base
        const { data: trips } = await supabase.from('trips').select('id').eq('agency_id', agency.id);
        const tripIds = (trips || []).map(t => t.id);

        if (tripIds.length > 0) {
          const { data: bookings } = await supabase.from('bookings').select('id').in('trip_id', tripIds);
          const bookingIds = (bookings || []).map(b => b.id);

          if (bookingIds.length > 0) {
            await supabase.from('ticket_scans').delete().in('booking_id', bookingIds);
            await supabase.from('booking_passengers').delete().in('booking_id', bookingIds);
            await supabase.from('payments').delete().in('booking_id', bookingIds);
            await supabase.from('bookings').delete().in('trip_id', tripIds);
          }

          await supabase.from('trip_reviews').delete().in('trip_id', tripIds);
          await supabase.from('incidents').delete().in('trip_id', tripIds);
          await supabase.from('driver_assignments').delete().in('trip_id', tripIds);
          await supabase.from('trips').delete().eq('agency_id', agency.id);
        }

        await supabase.from('buses').delete().eq('agency_id', agency.id);
        await supabase.from('agency_reviews').delete().eq('agency_id', agency.id);
        await supabase.from('extra_services').delete().eq('agency_id', agency.id);
        await supabase.from('notifications').delete().eq('agency_id', agency.id);
        await supabase.from('profiles').update({ agency_id: null }).eq('agency_id', agency.id);

        const { error: finalErr } = await supabase.from('agencies').delete().eq('id', agency.id);
        if (finalErr) throw finalErr;
      }

      setAgencies(prev => prev.filter(a => a.id !== agency.id));
      setSelectedAgency(null);
      toast.success(`Agence "${agency.name}" et toutes ses données associées ont été supprimées.`);
    } catch (err: any) {
      console.error("Delete error:", err);
      toast.error(err.message || "Erreur lors de la suppression de l'agence");
    }
  };

  const filteredAgencies = agencies.filter(a => {
    const matchesSearch = a.name.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    if (selectedCountryFilter !== 'all') {
      const code = (a.country_code || 'RDC').toUpperCase();
      if (code !== selectedCountryFilter) return false;
    }

    if (activeTab === 'active') return a.status === 'active';
    if (activeTab === 'suspended') return a.status === 'suspended';
    return true;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[32px] font-semibold text-[#1D1D1F] tracking-tight">Gestion des Agences & Mise en Avant</h1>
          <p className="text-[15px] text-[#86868B] mt-1">Gérez les partenaires et définissez les agences qui apparaissent dans "Agences de Confiance" sur mobile.</p>
        </div>
        <button 
          onClick={openCreateModal}
          className="h-11 px-5 bg-[#007AFF] text-white rounded-xl flex items-center gap-2 hover:bg-[#0063CC] transition-all shadow-sm hover:shadow-md"
        >
          <Plus className="w-5 h-5" />
          <span className="text-[15px] font-medium">Nouvelle Agence</span>
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card onClick={() => setActiveTab('all')} className="border-black/5 bg-white shadow-sm cursor-pointer hover:border-black/20 transition-all">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-[13px] font-medium text-[#86868B]">Total Agences</p>
              <h3 className="text-[28px] font-bold text-[#1D1D1F] mt-1">{agencies.length}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-black/5 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-[#1D1D1F]" />
            </div>
          </CardContent>
        </Card>

        <Card onClick={() => setActiveTab('featured')} className="border-amber-300 bg-amber-50/40 shadow-sm cursor-pointer hover:border-amber-400 transition-all">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-[13px] font-medium text-amber-800">Mises en Avant (Accueil Mobile)</p>
              <h3 className="text-[28px] font-bold text-amber-700 mt-1">{agencies.filter(a => a.is_trusted).length}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
              <Star className="w-5 h-5 text-amber-600 fill-amber-500" />
            </div>
          </CardContent>
        </Card>

        <Card onClick={() => setActiveTab('active')} className="border-black/5 bg-white shadow-sm cursor-pointer hover:border-black/20 transition-all">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-[13px] font-medium text-[#86868B]">Actives</p>
              <h3 className="text-[28px] font-bold text-[#34C759] mt-1">{agencies.filter(a => a.status === 'active').length}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[#34C759]/10 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-[#34C759]" />
            </div>
          </CardContent>
        </Card>

        <Card onClick={() => setActiveTab('suspended')} className="border-black/5 bg-white shadow-sm cursor-pointer hover:border-black/20 transition-all">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-[13px] font-medium text-[#86868B]">Suspendues</p>
              <h3 className="text-[28px] font-bold text-[#FF3B30] mt-1">{agencies.filter(a => a.status === 'suspended').length}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[#FF3B30]/10 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5 text-[#FF3B30]" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-black/10 pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-xl text-[13px] font-bold transition-all ${
              activeTab === 'all'
                ? 'bg-[#1D1D1F] text-white shadow-sm'
                : 'bg-white border border-black/10 text-[#86868B] hover:bg-black/5'
            }`}
          >
            Toutes les agences ({agencies.length})
          </button>

          <button
            onClick={() => setActiveTab('active')}
            className={`px-4 py-2 rounded-xl text-[13px] font-bold transition-all ${
              activeTab === 'active'
                ? 'bg-[#34C759] text-white shadow-sm'
                : 'bg-white border border-black/10 text-[#86868B] hover:bg-black/5'
            }`}
          >
            Actives ({agencies.filter(a => a.status === 'active').length})
          </button>
        </div>

        {/* Search & Country Filter */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Filtre Pays */}
          <select
            value={selectedCountryFilter}
            onChange={(e) => setSelectedCountryFilter(e.target.value)}
            className="h-9 px-3 bg-white border border-black/10 rounded-xl text-[13px] font-medium text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-[#007AFF]/20 cursor-pointer shadow-sm"
          >
            <option value="all">🌐 Tous les pays</option>
            <option value="RDC">🇨🇩 RDC (Kinshasa, Lubumbashi...)</option>
            <option value="CG">🇨🇬 Congo-Brazzaville</option>
            <option value="CM">🇨🇲 Cameroun</option>
            <option value="CI">🇨🇮 Côte d'Ivoire</option>
            <option value="GA">🇬🇦 Gabon</option>
          </select>

          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#86868B]" />
            <input 
              type="text"
              placeholder="Chercher agence..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 pl-9 pr-3 bg-white border border-black/10 rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-[#007AFF]/20 transition-all"
            />
          </div>
        </div>
      </div>


      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full flex justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-[#007AFF]" />
          </div>
        ) : filteredAgencies.length === 0 ? (
          <div className="col-span-full py-16 text-center text-[#86868B] bg-white rounded-2xl border border-black/5">
            <Building2 className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="font-bold text-[16px] text-[#1D1D1F]">Aucune agence trouvée</p>
            <p className="text-[13px] mt-1">Aucune agence ne correspond aux filtres actuels.</p>
          </div>
        ) : filteredAgencies.map((agency) => (
          <motion.div
            key={agency.id}
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <Card 
              onClick={() => setSelectedAgency(agency)}
              className={`border-black/5 hover:border-black/15 transition-all cursor-pointer group hover:shadow-lg relative overflow-hidden bg-white ${
                agency.is_trusted ? 'border-amber-300 ring-2 ring-amber-400/20' : ''
              }`}
            >
              <CardContent className="p-6">
                <div className="flex flex-col h-full justify-between space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="w-14 h-14 rounded-2xl bg-[#F5F5F7] flex items-center justify-center text-[24px] font-bold text-[#1D1D1F] border border-black/5 group-hover:scale-105 transition-transform">
                      {agency.logo_url ? (
                        <img src={agency.logo_url} alt={agency.name} className="w-full h-full object-cover rounded-2xl" />
                      ) : agency.name.charAt(0)}
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Bouton Mise en Avant ⭐ */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleTrustedStatus(agency.id, agency.is_trusted);
                        }}
                        className={`px-3 py-1 rounded-full text-[11px] font-extrabold flex items-center gap-1.5 transition-all ${
                          agency.is_trusted
                            ? "bg-amber-100 text-amber-800 border border-amber-300 hover:bg-amber-200"
                            : "bg-black/5 text-[#86868B] hover:bg-black/10 hover:text-[#1D1D1F]"
                        }`}
                        title="Afficher/masquer dans les Agences de Confiance sur mobile"
                      >
                        <Star className={`w-3.5 h-3.5 ${agency.is_trusted ? "fill-amber-600 text-amber-600" : ""}`} />
                        <span>{agency.is_trusted ? "Mise en avant ⭐" : "Mettre en avant"}</span>
                      </button>

                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                        agency.status === 'active' ? 'bg-[#34C759]/10 text-[#34C759]' : 
                        agency.status === 'suspended' ? 'bg-[#FF3B30]/10 text-[#FF3B30]' : 
                        'bg-[#FF9500]/10 text-[#FF9500]'
                      }`}>
                        {agency.status === 'active' ? 'Actif' : agency.status === 'suspended' ? 'Suspendu' : 'En attente'}
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-[19px] font-bold text-[#1D1D1F] group-hover:text-[#007AFF] transition-colors">{agency.name}</h3>
                      <span className="text-[11px] font-extrabold bg-[#F5F5F7] px-2 py-0.5 rounded-md border border-black/5 text-[#555]">
                        🌐 {agency.country_code || 'RDC'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[13px] text-[#86868B] mb-4">
                      <ShieldCheck className="w-4 h-4 text-[#34C759]" />
                      <span>Commission : {agency.commission_rate}%</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-4 border-t border-black/5">
                    <div className="text-center">
                      <p className="text-[15px] font-bold text-[#1D1D1F]">{agency._count?.buses}</p>
                      <p className="text-[10px] text-[#86868B] uppercase font-semibold">Bus</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[15px] font-bold text-[#1D1D1F]">{agency._count?.trips}</p>
                      <p className="text-[10px] text-[#86868B] uppercase font-semibold">Voyages</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[15px] font-bold text-[#1D1D1F]">{agency._count?.bookings}</p>
                      <p className="text-[10px] text-[#86868B] uppercase font-semibold">Ventes</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Detail Slide-over */}
      <AnimatePresence>
        {selectedAgency && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedAgency(null)}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[60]"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-[450px] bg-white shadow-2xl z-[70] flex flex-col"
            >
              <div className="p-6 flex items-center justify-between border-b border-black/5">
                <h2 className="text-[20px] font-bold">Détails de l'agence</h2>
                <button onClick={() => setSelectedAgency(null)} className="w-8 h-8 rounded-full hover:bg-black/5 flex items-center justify-center transition-colors">
                  <X className="w-5 h-5 text-[#86868B]" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-8 space-y-8">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="w-24 h-24 rounded-[28px] bg-[#F5F5F7] flex items-center justify-center text-[40px] font-bold text-[#1D1D1F] border border-black/5 shadow-inner overflow-hidden">
                    {selectedAgency.logo_url ? (
                      <img
                        src={selectedAgency.logo_url}
                        alt={selectedAgency.name}
                        className="w-full h-full object-cover"
                        onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    ) : (
                      selectedAgency.name.charAt(0)
                    )}
                  </div>
                  <div>
                    <h3 className="text-[24px] font-bold text-[#1D1D1F]">{selectedAgency.name}</h3>
                    <p className="text-[15px] text-[#86868B] max-w-[300px] mt-2">{selectedAgency.description || "Aucune description fournie."}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-[#F5F5F7] space-y-1">
                    <p className="text-[12px] text-[#86868B] font-medium uppercase">Statut Actuel</p>
                    <p className={`text-[15px] font-bold ${selectedAgency.status === 'active' ? 'text-[#34C759]' : 'text-[#FF3B30]'}`}>
                      {selectedAgency.status === 'active' ? 'Opérationnel' : 'Suspendu'}
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl bg-[#F5F5F7] space-y-1">
                    <p className="text-[12px] text-[#86868B] font-medium uppercase">Mise en avant (Accueil)</p>
                    <p className={`text-[15px] font-bold ${selectedAgency.is_trusted ? 'text-[#D97706]' : 'text-[#86868B]'}`}>
                      {selectedAgency.is_trusted ? '⭐ Oui (Agences de Confiance)' : 'Non'}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-[14px] font-bold text-[#1D1D1F] uppercase tracking-wider">Indicateurs de Performance</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 rounded-xl border border-black/5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#007AFF]/10 flex items-center justify-center">
                          <Bus className="w-4 h-4 text-[#007AFF]" />
                        </div>
                        <span className="text-[14px] font-medium">Flotte de bus</span>
                      </div>
                      <span className="font-bold">{selectedAgency._count?.buses}</span>
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-xl border border-black/5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#34C759]/10 flex items-center justify-center">
                          <MapIcon className="w-4 h-4 text-[#34C759]" />
                        </div>
                        <span className="text-[14px] font-medium">Itinéraires actifs</span>
                      </div>
                      <span className="font-bold">{selectedAgency._count?.trips}</span>
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-xl border border-black/5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#FF9500]/10 flex items-center justify-center">
                          <Ticket className="w-4 h-4 text-[#FF9500]" />
                        </div>
                        <span className="text-[14px] font-medium">Billets vendus</span>
                      </div>
                      <span className="font-bold">{selectedAgency._count?.bookings}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-black/5 bg-[#F5F5F7]/30 space-y-3">
                {/* Boutons principaux : Modifier + Supprimer */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => openEditModal(selectedAgency)}
                    className="h-11 rounded-xl flex items-center justify-center gap-2 text-[13px] font-bold bg-[#007AFF] text-white hover:bg-[#0068D9] transition-all"
                  >
                    <Edit2 className="w-4 h-4" />
                    Modifier
                  </button>
                  <button
                    onClick={() => handleDeleteAgency(selectedAgency)}
                    className="h-11 rounded-xl flex items-center justify-center gap-2 text-[13px] font-bold bg-white border border-[#FF3B30] text-[#FF3B30] hover:bg-[#FF3B30] hover:text-white transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                    Supprimer
                  </button>
                </div>
                <button 
                  onClick={() => toggleStatus(selectedAgency.id, selectedAgency.status)}
                  className={`w-full h-11 rounded-xl flex items-center justify-center gap-2 text-[13px] font-semibold transition-all ${
                    selectedAgency.status === 'active' 
                    ? 'bg-[#FF9500]/10 border border-[#FF9500]/40 text-[#CC7700] hover:bg-[#FF9500] hover:text-white' 
                    : 'bg-[#34C759]/10 border border-[#34C759]/40 text-[#1A8A38] hover:bg-[#34C759] hover:text-white'
                  }`}
                >
                  {selectedAgency.status === 'active' ? <ShieldAlert className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                  {selectedAgency.status === 'active' ? "Suspendre l'agence" : "Réactiver l'agence"}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Create Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-[600px] bg-white rounded-[32px] shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-black/5 flex items-center justify-between">
                <div>
                  <h2 className="text-[24px] font-bold text-[#1D1D1F]">
                    {editMode ? `Modifier — ${formData.name}` : 'Ajouter une agence'}
                  </h2>
                  <p className="text-[14px] text-[#86868B] mt-1">
                    {editMode ? 'Mettez à jour les informations de cette agence' : 'Créez une entité agence et son compte administrateur'}
                  </p>
                </div>
                <button onClick={() => { setIsModalOpen(false); setEditMode(false); }} className="w-10 h-10 rounded-full hover:bg-[#F5F5F7] flex items-center justify-center transition-colors">
                  <X className="w-6 h-6 text-[#86868B]" />
                </button>
              </div>

              <form onSubmit={handleCreateAgency} className="p-8 space-y-6">
                <div className="space-y-4">
                  <h3 className="text-[14px] font-bold text-[#1D1D1F] uppercase tracking-wider flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-[#007AFF]" />
                    Informations Agence
                  </h3>

                  {/* Logo Upload */}
                  <div className="flex items-center gap-5">
                    <div
                      onClick={() => logoInputRef.current?.click()}
                      className="w-20 h-20 rounded-2xl bg-[#F5F5F7] border-2 border-dashed border-black/10 flex flex-col items-center justify-center cursor-pointer hover:border-[#007AFF] hover:bg-[#007AFF]/5 transition-all overflow-hidden group shrink-0"
                    >
                      {logoPreview ? (
                        <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
                      ) : (
                        <>
                          <ImagePlus className="w-6 h-6 text-[#86868B] group-hover:text-[#007AFF] transition-colors" />
                          <span className="text-[9px] text-[#86868B] mt-1 group-hover:text-[#007AFF]">Logo</span>
                        </>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-[13px] font-semibold text-[#1D1D1F]">Logo de l'agence</p>
                      <p className="text-[12px] text-[#86868B] mt-0.5">JPG, PNG, WebP ou SVG · max 2 Mo</p>
                      <button
                        type="button"
                        onClick={() => logoInputRef.current?.click()}
                        className="mt-2 h-8 px-3 bg-white border border-black/10 rounded-lg text-[12px] font-medium text-[#1D1D1F] hover:bg-black/5 transition-all flex items-center gap-1.5"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        {logoPreview ? "Changer" : "Choisir"}
                      </button>
                    </div>
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={e => handleLogoChange(e.target.files?.[0] || null)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[13px] font-semibold text-[#1D1D1F] ml-1">Nom de l'entreprise</label>
                      <input 
                        required
                        value={formData.name}
                        onChange={e => setFormData({...formData, name: e.target.value})}
                        className="w-full h-12 px-4 bg-[#F5F5F7] border-0 rounded-2xl focus:ring-2 focus:ring-[#007AFF]/20 transition-all text-[15px]"
                        placeholder="Ex: Kongo Trans"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[13px] font-semibold text-[#1D1D1F] ml-1">Commission (%)</label>
                      <input 
                        type="number"
                        min="0" max="100"
                        required
                        value={formData.commission_rate}
                        onChange={e => setFormData({...formData, commission_rate: parseInt(e.target.value)})}
                        className="w-full h-12 px-4 bg-[#F5F5F7] border-0 rounded-2xl focus:ring-2 focus:ring-[#007AFF]/20 transition-all text-[15px]"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[13px] font-semibold text-[#1D1D1F] ml-1">Pays d'opération</label>
                    <select
                      value={formData.country_code}
                      onChange={e => {
                        const code = e.target.value;
                        const countryNames: Record<string, string> = {
                          RDC: "République Démocratique du Congo",
                          CG: "République du Congo",
                          CM: "Cameroun",
                          CI: "Côte d'Ivoire",
                          GA: "Gabon"
                        };
                        setFormData({
                          ...formData,
                          country_code: code,
                          country: countryNames[code] || "République Démocratique du Congo"
                        });
                      }}
                      className="w-full h-12 px-4 bg-[#F5F5F7] border-0 rounded-2xl focus:ring-2 focus:ring-[#007AFF]/20 transition-all text-[15px] font-medium"
                    >
                      <option value="RDC">🇨🇩 République Démocratique du Congo (RDC)</option>
                      <option value="CG">🇨🇬 République du Congo (Brazzaville)</option>
                      <option value="CM">🇨🇲 Cameroun (CM)</option>
                      <option value="CI">🇨🇮 Côte d'Ivoire (CI)</option>
                      <option value="GA">🇬🇦 Gabon (GA)</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[13px] font-semibold text-[#1D1D1F] ml-1">Description (Optionnel)</label>
                    <textarea 
                      value={formData.description}
                      onChange={e => setFormData({...formData, description: e.target.value})}
                      className="w-full h-24 p-4 bg-[#F5F5F7] border-0 rounded-2xl focus:ring-2 focus:ring-[#007AFF]/20 transition-all text-[15px] resize-none"
                      placeholder="Détails sur l'agence..."
                    />
                  </div>
                </div>

                {/* Section Admin — masquée en mode édition */}
                {!editMode && (
                  <div className="space-y-4 pt-6 border-t border-black/5">
                    <h3 className="text-[14px] font-bold text-[#1D1D1F] uppercase tracking-wider flex items-center gap-2">
                      <User className="w-4 h-4 text-[#34C759]" />
                      Compte Administrateur Agence
                    </h3>
                    <div className="space-y-1.5">
                      <label className="text-[13px] font-semibold text-[#1D1D1F] ml-1">Nom complet du Gérant</label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#86868B]" />
                        <input 
                          required={!editMode}
                          value={formData.admin_name}
                          onChange={e => setFormData({...formData, admin_name: e.target.value})}
                          className="w-full h-12 pl-12 pr-4 bg-[#F5F5F7] border-0 rounded-2xl focus:ring-2 focus:ring-[#007AFF]/20 transition-all text-[15px]"
                          placeholder="Prénom Nom"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[13px] font-semibold text-[#1D1D1F] ml-1">Email professionnel</label>
                        <div className="relative">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#86868B]" />
                          <input 
                            type="email"
                            required={!editMode}
                            value={formData.admin_email}
                            onChange={e => setFormData({...formData, admin_email: e.target.value})}
                            className="w-full h-12 pl-12 pr-4 bg-[#F5F5F7] border-0 rounded-2xl focus:ring-2 focus:ring-[#007AFF]/20 transition-all text-[15px]"
                            placeholder="admin@agence.com"
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[13px] font-semibold text-[#1D1D1F] ml-1">Mot de passe provisoire</label>
                        <div className="relative">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#86868B]" />
                          <input 
                            type="password"
                            required={!editMode}
                            value={formData.admin_password}
                            onChange={e => setFormData({...formData, admin_password: e.target.value})}
                            className="w-full h-12 pl-12 pr-4 bg-[#F5F5F7] border-0 rounded-2xl focus:ring-2 focus:ring-[#007AFF]/20 transition-all text-[15px]"
                            placeholder="••••••••"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full h-14 text-white rounded-[20px] font-bold text-[16px] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl active:scale-[0.98] flex items-center justify-center gap-2 ${
                    editMode ? 'bg-[#007AFF] hover:bg-[#0063CC]' : 'bg-[#007AFF] hover:bg-[#0063CC]'
                  }`}
                >
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
                  {editMode ? 'Enregistrer les modifications' : "Créer l'agence et son administrateur"}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
