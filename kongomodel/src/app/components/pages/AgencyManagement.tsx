import React, { useState, useEffect, useRef } from "react";
import { 
  Building2, Plus, Search, Filter, MoreHorizontal, 
  ShieldCheck, ShieldAlert, Bus, Map as MapIcon, Ticket, 
  ChevronRight, X, Loader2, Mail, Lock, User, ImagePlus, Upload
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
  
  // Form State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    commission_rate: 5,
    description: "",
    admin_email: "",
    admin_password: "",
    admin_name: ""
  });
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

      // Count bookings per agency via trips relation (bookings -> trips.agency_id)
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

  const handleCreateAgency = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      let logo_url: string | null = null;

      // Upload du logo si sélectionné
      if (logoFile) {
        const ext = logoFile.name.split('.').pop();
        const path = `agency-logos/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from('agency-assets')
          .upload(path, logoFile, { upsert: true, contentType: logoFile.type });

        if (uploadError) throw new Error(`Upload logo : ${uploadError.message}`);

        const { data: urlData } = supabase.storage.from('agency-assets').getPublicUrl(path);
        logo_url = urlData.publicUrl;
      }

      const { data, error } = await supabase.functions.invoke('create-agency-admin', {
        body: { ...formData, logo_url }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      
      toast.success("Agence et compte administrateur créés avec succès");
      setIsModalOpen(false);
      setFormData({ name: "", commission_rate: 5, description: "", admin_email: "", admin_password: "", admin_name: "" });
      setLogoFile(null);
      setLogoPreview(null);
      fetchAgencies();
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la création");
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

  const filteredAgencies = agencies.filter(a => 
    a.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[32px] font-semibold text-[#1D1D1F] tracking-tight">Gestion des Partenaires</h1>
          <p className="text-[15px] text-[#86868B] mt-1">Gérez les entreprises de transport et leurs comptes administrateurs</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="h-11 px-5 bg-[#007AFF] text-white rounded-xl flex items-center gap-2 hover:bg-[#0063CC] transition-all shadow-sm hover:shadow-md"
        >
          <Plus className="w-5 h-5" />
          <span className="text-[15px] font-medium">Nouvelle Agence</span>
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-black/5 bg-[#F5F5F7]/50">
          <CardContent className="p-6">
            <p className="text-[13px] font-medium text-[#86868B]">Total Agences</p>
            <h3 className="text-[28px] font-bold text-[#1D1D1F] mt-1">{agencies.length}</h3>
          </CardContent>
        </Card>
        <Card className="border-black/5 bg-[#F5F5F7]/50">
          <CardContent className="p-6">
            <p className="text-[13px] font-medium text-[#86868B]">Actives</p>
            <h3 className="text-[28px] font-bold text-[#34C759] mt-1">{agencies.filter(a => a.status === 'active').length}</h3>
          </CardContent>
        </Card>
        <Card className="border-black/5 bg-[#F5F5F7]/50">
          <CardContent className="p-6">
            <p className="text-[13px] font-medium text-[#86868B]">Suspendeues</p>
            <h3 className="text-[28px] font-bold text-[#FF3B30] mt-1">{agencies.filter(a => a.status === 'suspended').length}</h3>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-[#86868B]" />
          <input 
            type="text"
            placeholder="Rechercher une agence..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-11 pl-11 pr-4 bg-white border border-black/10 rounded-xl text-[15px] focus:outline-none focus:ring-2 focus:ring-[#007AFF]/20 transition-all"
          />
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full flex justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-[#007AFF]" />
          </div>
        ) : filteredAgencies.map((agency) => (
          <motion.div 
            layoutId={agency.id}
            key={agency.id}
            onClick={() => setSelectedAgency(agency)}
          >
            <Card className={`group cursor-pointer hover:shadow-xl transition-all duration-300 border-black/5 overflow-hidden ${agency.status === 'suspended' ? 'opacity-75 grayscale' : ''}`}>
              <CardContent className="p-0">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-14 h-14 rounded-2xl bg-[#F5F5F7] flex items-center justify-center text-[24px] font-bold text-[#1D1D1F] border border-black/5 group-hover:scale-105 transition-transform">
                      {agency.logo_url ? (
                        <img src={agency.logo_url} alt={agency.name} className="w-full h-full object-cover rounded-2xl" />
                      ) : agency.name.charAt(0)}
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                      agency.status === 'active' ? 'bg-[#34C759]/10 text-[#34C759]' : 
                      agency.status === 'suspended' ? 'bg-[#FF3B30]/10 text-[#FF3B30]' : 
                      'bg-[#FF9500]/10 text-[#FF9500]'
                    }`}>
                      {agency.status === 'active' ? 'Actif' : agency.status === 'suspended' ? 'Suspendu' : 'En attente'}
                    </span>
                  </div>
                  
                  <h3 className="text-[19px] font-bold text-[#1D1D1F] mb-1 group-hover:text-[#007AFF] transition-colors">{agency.name}</h3>
                  <div className="flex items-center gap-1.5 text-[13px] text-[#86868B] mb-4">
                    <ShieldCheck className="w-4 h-4 text-[#34C759]" />
                    <span>Commission : {agency.commission_rate}%</span>
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
                    <p className="text-[12px] text-[#86868B] font-medium uppercase">Commission</p>
                    <p className="text-[15px] font-bold text-[#1D1D1F]">{selectedAgency.commission_rate}% par vente</p>
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
                <button 
                  onClick={() => toggleStatus(selectedAgency.id, selectedAgency.status)}
                  className={`w-full h-12 rounded-xl flex items-center justify-center gap-2 font-semibold transition-all ${
                    selectedAgency.status === 'active' 
                    ? 'bg-white border border-[#FF3B30] text-[#FF3B30] hover:bg-[#FF3B30] hover:text-white' 
                    : 'bg-[#34C759] text-white hover:bg-[#28A745]'
                  }`}
                >
                  {selectedAgency.status === 'active' ? <ShieldAlert className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
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
                  <h2 className="text-[24px] font-bold text-[#1D1D1F]">Ajouter une agence</h2>
                  <p className="text-[14px] text-[#86868B] mt-1">Créez une entité agence et son compte administrateur</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="w-10 h-10 rounded-full hover:bg-[#F5F5F7] flex items-center justify-center transition-colors">
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
                    <label className="text-[13px] font-semibold text-[#1D1D1F] ml-1">Description (Optionnel)</label>
                    <textarea 
                      value={formData.description}
                      onChange={e => setFormData({...formData, description: e.target.value})}
                      className="w-full h-24 p-4 bg-[#F5F5F7] border-0 rounded-2xl focus:ring-2 focus:ring-[#007AFF]/20 transition-all text-[15px] resize-none"
                      placeholder="Détails sur l'agence..."
                    />
                  </div>
                </div>

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
                        required
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
                          required
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
                          required
                          value={formData.admin_password}
                          onChange={e => setFormData({...formData, admin_password: e.target.value})}
                          className="w-full h-12 pl-12 pr-4 bg-[#F5F5F7] border-0 rounded-2xl focus:ring-2 focus:ring-[#007AFF]/20 transition-all text-[15px]"
                          placeholder="••••••••"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-14 bg-[#007AFF] text-white rounded-[20px] font-bold text-[16px] hover:bg-[#0063CC] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
                  Créer l'agence et son administrateur
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
