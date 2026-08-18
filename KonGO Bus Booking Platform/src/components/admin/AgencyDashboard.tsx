// [Agent Dev Web] - Action: Création AgencyDashboard - Gestion bus, voyages, chauffeurs et affectations
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Bus, Map, Users, Loader2, RefreshCw, Ticket, BarChart3, Eye, LogOut, 
  Zap, TrendingUp, Shield, Plus, Pencil, Trash2, Building, Phone, X, 
  UserX, Search, Check, UserCheck, ChevronRight, ClipboardList, MapPin as PinIcon, Flag, AlertTriangle
} from 'lucide-react';
import { Button } from '../ui/button';
import { 
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter 
} from '../ui/dialog';
import { Separator } from '../ui/separator';
import { Badge } from '../ui/badge';
import { BookingDetailModal } from './BookingDetailModal';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';
import { AddBusForm, AddTripForm, AddStaffForm, AddStopForm, AddAgeCategoryForm, AddSiteForm } from './AdminForms';
import { Stop, AgeCategory } from '../app/AppConstants';

type TabType = 'overview' | 'buses' | 'trips' | 'personnel' | 'sites' | 'bookings' | 'stops' | 'pricing';

interface Driver {
  id: string;
  full_name: string;
  phone: string | null;
  license_number: string | null;
  status: string;
  assigned_bus_id: string | null;
  buses?: { name: string; plate_number: string } | null;
}

interface Bus {
  id: string;
  name: string;
  plate_number: string;
  type: string;
  capacity: number;
  status: string;
}

interface Trip {
  id: string;
  departure_time: string;
  arrival_time: string;
  price: number;
  seats_available: number;
  total_seats: number;
  status: string;
  origin?: { name: string };
  destination?: { name: string };
}

interface StaffMember {
  id: string;
  full_name: string;
  email: string | null;
  role: string | null;
  site_id: string | null;
  agency_sites?: { name: string }[] | null;
  created_at: string;
  phone_number?: string | null;
  license_number?: string | null;
  assigned_bus_id?: string | null;
  buses?: { name: string; plate_number: string } | null;
  driver_id?: string | null;
}

interface AgencySite {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  phone: string | null;
  created_at: string;
}

interface AgencyStats {
  buses: number;
  trips: number;
  drivers: number;
  bookings: number;
  revenue: number;
}

const DashboardSkeleton = () => (
  <div className="p-8 space-y-8 animate-pulse max-w-7xl mx-auto">
    <div className="flex justify-between items-center">
      <div className="space-y-2">
        <div className="h-4 w-20 bg-gray-200 rounded"></div>
        <div className="h-10 w-64 bg-gray-200 rounded-xl"></div>
      </div>
      <div className="flex gap-2">
        <div className="h-10 w-32 bg-gray-200 rounded-xl"></div>
        <div className="h-10 w-10 bg-gray-200 rounded-xl"></div>
      </div>
    </div>
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      {[1, 2, 3, 4, 5].map(i => (
        <div key={i} className="h-24 bg-gray-100 rounded-2xl"></div>
      ))}
    </div>
    <div className="h-12 w-full bg-gray-100 rounded-xl"></div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {[1, 2, 3].map(i => (
        <div key={i} className="h-64 bg-gray-50 rounded-3xl"></div>
      ))}
    </div>
  </div>
);

export function AgencyDashboard() {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [stats, setStats] = useState<AgencyStats>({ buses: 0, trips: 0, drivers: 0, bookings: 0, revenue: 0 });
  const [buses, setBuses] = useState<Bus[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [sites, setSites] = useState<AgencySite[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [agencyId, setAgencyId] = useState<string | null>(null);
  const [agencyName, setAgencyName] = useState('Mon Agence');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isBusFormOpen, setIsBusFormOpen] = useState(false);
  const [isTripFormOpen, setIsTripFormOpen] = useState(false);
  const [isStaffFormOpen, setIsStaffFormOpen] = useState(false);
  const [isSiteFormOpen, setIsSiteFormOpen] = useState(false);
  const [isStopFormOpen, setIsStopFormOpen] = useState(false);
  const [isCategoryFormOpen, setIsCategoryFormOpen] = useState(false);
  const [editingSite, setEditingSite] = useState<any>(null);
  const [editingStop, setEditingStop] = useState<any>(null);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [editingBus, setEditingBus] = useState<any>(null);
  const [editingTrip, setEditingTrip] = useState<any>(null);
  const [editingStaff, setEditingStaff] = useState<any>(null);
  const [stops, setStops] = useState<Stop[]>([]);
  const [categories, setCategories] = useState<AgeCategory[]>([]);
  const [assignModal, setAssignModal] = useState<{ open: boolean; driver: any | null }>({ open: false, driver: null });
  const [busSearchTerm, setBusSearchTerm] = useState('');
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [personnelFilter, setPersonnelFilter] = useState('all');
  const [endTripModal, setEndTripModal] = useState<{ open: boolean; trip: Trip | null }>({ open: false, trip: null });
  const [isEndingTrip, setIsEndingTrip] = useState(false);

  const fetchData = useCallback(async (refresh = false) => {
    if (refresh) setIsRefreshing(true);
    else setIsLoading(true);
    try {
      // Get current user's agency
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase.from('profiles').select('agency_id').eq('id', user.id).single();
      const aid = profile?.agency_id;
      setAgencyId(aid);

      if (!aid) {
        setIsLoading(false);
        setIsRefreshing(false);
        return;
      }

      const { data: agencyData } = await supabase.from('agencies').select('name').eq('id', aid).single();
      if (agencyData) setAgencyName(agencyData.name);

      // Fetch buses, trips, drivers in parallel
      const [busRes, tripRes, driverRes, staffRes, siteRes] = await Promise.all([
        supabase.from('buses').select('*').eq('agency_id', aid).order('created_at', { ascending: false }),
        supabase.from('trips').select('*, origin:locations!origin_location_id(name), destination:locations!destination_location_id(name)').eq('agency_id', aid).order('departure_time', { ascending: false }),
        supabase.from('drivers').select('*, buses(name, plate_number)').eq('agency_id', aid).order('created_at', { ascending: false }),
        supabase.from('profiles').select('id, full_name, email, phone_number, role, site_id, agency_sites(name), created_at').eq('agency_id', aid).order('created_at', { ascending: false }),
        supabase.from('agency_sites').select('*').eq('agency_id', aid).order('created_at', { ascending: false }),
      ]);

      setBuses(busRes.data || []);
      setTrips(tripRes.data || []);
      setDrivers(driverRes.data || []);
      // Unified staff including drivers from the profiles table
      const filteredStaff = (staffRes.data || []).map((s: any) => {
          // If this staff member is a driver, link their profile to the specific driver data
          const driverInfo = driverRes.data?.find((d: any) => d.user_id === s.id);
          return {
            ...s,
            role: s.role || 'staff',
            phone_number: s.phone_number || driverInfo?.phone,
            license_number: driverInfo?.license_number,
            assigned_bus_id: driverInfo?.assigned_bus_id,
            buses: driverInfo?.buses,
            driver_id: driverInfo?.id // Store the driver table ID for specific actions
          };
      });
      setStaffMembers(filteredStaff);
      setSites(siteRes.data || []);

      // Step 2: fetch bookings filtered by the agency's trip IDs (correct PostgREST pattern)
      const agencyTripIds = (tripRes.data || []).map((t: any) => t.id);
      let bookingsData: any[] = [];
      if (agencyTripIds.length > 0) {
        const { data: bookingRows } = await supabase
          .from('bookings')
          .select('*, profiles!bookings_user_id_profiles_fkey(full_name, phone_number), trips(*, origin:locations!origin_location_id(name), destination:locations!destination_location_id(name))')
          .in('trip_id', agencyTripIds)
          .order('created_at', { ascending: false })
          .limit(50);
        bookingsData = bookingRows || [];
      }
      setBookings(bookingsData);

      const totalRevenue = bookingsData.filter(b => b.payment_status === 'paid' || b.payment_status === 'completed').reduce((sum, b) => sum + (b.total_price || 0), 0);

      setStats({
        buses: busRes.data?.length || 0,
        trips: tripRes.data?.length || 0,
        drivers: driverRes.data?.length || 0,
        bookings: bookingsData.length,
        revenue: totalRevenue,
      });
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    // Realtime bookings
    const channel = supabase.channel('agency-bookings')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'bookings' }, () => {
        toast.info('🎫 Nouvelle réservation reçue !');
        fetchData(true);
      })
      .subscribe();
      
    const fetchStopsAndCategories = async () => {
      const [{ data: sData }, { data: cData }] = await Promise.all([
        supabase.from('stops').select('*').order('city_name'),
        supabase.from('age_categories').select('*').order('discount_percentage')
      ]);
      if (sData) setStops(sData);
      if (cData) setCategories(cData);
    };
    fetchStopsAndCategories();

    const refreshHandler = () => fetchData(true);
    window.addEventListener('refresh-buses', refreshHandler);
    window.addEventListener('refresh-trips', refreshHandler);
    window.addEventListener('refresh-drivers', refreshHandler);
    window.addEventListener('refresh-staff', refreshHandler);
    window.addEventListener('refresh-sites', refreshHandler);
    window.addEventListener('refresh-stops', fetchStopsAndCategories);
    window.addEventListener('refresh-categories', fetchStopsAndCategories);
    
    return () => { 
      supabase.removeChannel(channel); 
      window.removeEventListener('refresh-buses', refreshHandler);
      window.removeEventListener('refresh-trips', refreshHandler);
      window.removeEventListener('refresh-drivers', refreshHandler);
      window.removeEventListener('refresh-staff', refreshHandler);
      window.removeEventListener('refresh-sites', refreshHandler);
      window.removeEventListener('refresh-stops', fetchStopsAndCategories);
      window.removeEventListener('refresh-categories', fetchStopsAndCategories);
    };
  }, [fetchData]);

  const handleDeleteBus = async (id: string) => {
    if (!window.confirm("Voulez-vous vraiment supprimer ce bus ?")) return;
    try {
      const { error } = await supabase.from('buses').delete().eq('id', id);
      if (error) throw error;
      toast.success("Bus supprimé");
      fetchData(true);
    } catch (e: any) {
      toast.error("Erreur: " + e.message);
    }
  };

  const handleDeleteTrip = async (id: string) => {
    if (!window.confirm("Voulez-vous vraiment supprimer ce voyage ?")) return;
    try {
      const { error } = await supabase.from('trips').delete().eq('id', id);
      if (error) throw error;
      toast.success("Voyage supprimé");
      fetchData(true);
    } catch (e: any) {
      toast.error("Erreur: " + e.message);
    }
  };

  const handleEndTrip = async () => {
    if (!endTripModal.trip) return;
    setIsEndingTrip(true);
    try {
      const { error } = await supabase
        .from('trips')
        .update({ status: 'completed' })
        .eq('id', endTripModal.trip.id);
      if (error) throw error;
      toast.success('🏁 Voyage terminé avec succès !', {
        description: `${endTripModal.trip.origin?.name} → ${endTripModal.trip.destination?.name} a été marqué comme complété.`
      });
      setEndTripModal({ open: false, trip: null });
      fetchData(true);
    } catch (e: any) {
      toast.error('Erreur: ' + e.message);
    } finally {
      setIsEndingTrip(false);
    }
  };

  const assignDriverToBus = async (driverId: string, busId: string | null) => {
    // Si on veut affecter (et non retirer)
    if (busId) {
      // 1. Le chauffeur actuel a-t-il déjà un autre bus ?
      const currentDriver = drivers.find(d => d.id === driverId);
      if (currentDriver && currentDriver.assigned_bus_id && currentDriver.assigned_bus_id !== busId) {
        toast.error("Veuillez d'abord séparer/retirer l'affectation actuelle de ce chauffeur !");
        return;
      }
      // 2. Ce bus est-il déjà affecté à un autre chauffeur ?
      const otherDriverUsingBus = drivers.find(d => d.assigned_bus_id === busId && d.id !== driverId);
      if (otherDriverUsingBus) {
        toast.error(`Ce bus est déjà affecté à ${otherDriverUsingBus.full_name}. Veuillez d'abord les séparer.`);
        return;
      }
    }

    const { error } = await supabase.from('drivers').update({ assigned_bus_id: busId }).eq('id', driverId);
    if (error) { toast.error('Erreur: ' + error.message); return; }
    toast.success(busId ? '✅ Chauffeur affecté au bus' : '✅ Affectation retirée');
    setAssignModal({ open: false, driver: null });
    fetchData(true);
  };

  const deleteDriver = async (id: string) => {
    if (!confirm('Supprimer ce chauffeur ?')) return;
    const { error } = await supabase.from('drivers').delete().eq('id', id);
    if (error) { toast.error(error.message); return; }
    toast.success('Chauffeur supprimé');
    fetchData(true);
  };

  const deleteStop = async (id: string) => {
    if (!confirm("Supprimer cet arrêt ?")) return;
    try {
      const { error } = await supabase.from('stops').delete().eq('id', id);
      if (error) throw error;
      toast.success("Arrêt supprimé");
      fetchData();
    } catch (error: any) {
      toast.error("Erreur: " + error.message);
    }
  };

  const deleteStaff = async (id: string, role: string) => {
    if (role === 'superuser') return;
    if (!confirm('Voulez-vous vraiment retirer ce membre du personnel de votre agence ?')) return;
    
    try {
      // 1. Remove from profiles (sever link with agency)
      const { error } = await supabase.from('profiles').update({ agency_id: null, site_id: null }).eq('id', id);
      if (error) throw error;
      
      // 2. If it's a driver, we also remove the driver table entry as it's linked to this agency
      if (role === 'driver') {
          const { error: dError } = await supabase.from('drivers').delete().eq('user_id', id);
          if (dError) console.error("Could not delete driver record:", dError.message);
      }

      toast.success('Membre retiré de l\'agence');
      fetchData(true);
    } catch (e: any) {
      toast.error('Erreur: ' + e.message);
    }
  };

  const deleteCategory = async (id: string) => {
    if (!confirm("Supprimer cette catégorie ?")) return;
    try {
      const { error } = await supabase.from('age_categories').delete().eq('id', id);
      if (error) throw error;
      toast.success("Catégorie supprimée");
      fetchData();
    } catch (error: any) {
      toast.error("Erreur: " + error.message);
    }
  };  const getStatusBadge = (status: string) => {
    const map: Record<string, string> = {
      active: 'bg-green-100 text-green-700',
      inactive: 'bg-gray-100 text-gray-600',
      suspended: 'bg-red-100 text-red-700',
      confirmed: 'bg-green-100 text-green-700',
      pending: 'bg-yellow-100 text-yellow-700',
      cancelled: 'bg-red-100 text-red-700',
      scheduled: 'bg-blue-100 text-blue-700',
      maintenance: 'bg-orange-100 text-orange-700',
    };
    return map[status] || 'bg-gray-100 text-gray-600';
  };

  const getTimeAgo = (d: string) => {
    const diff = Date.now() - new Date(d).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 60) return `${m} min`;
    const h = Math.floor(m / 60);
    return h < 24 ? `${h}h` : new Date(d).toLocaleDateString('fr-CD');
  };

  const tabs = [
    { id: 'overview', label: 'Aperçu', icon: BarChart3 },
    { id: 'personnel', label: `Personnel (${staffMembers.length})`, icon: Users },
    { id: 'buses', label: `Bus (${stats.buses})`, icon: Bus },
    { id: 'trips', label: `Voyages (${stats.trips})`, icon: Map },
    { id: 'sites', label: `Sites/Points vente (${sites.length})`, icon: Building },
    { id: 'bookings', label: `Réservations (${stats.bookings})`, icon: Ticket },
    { id: 'stops', label: `Arrêts (${stops.length})`, icon: Map },
    { id: 'pricing', label: `Tarifs par âge`, icon: Ticket },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-kongo-lime mx-auto" />
          <p className="text-body text-tertiary">Chargement de votre tableau de bord...</p>
        </div>
      </div>
    );
  }

  if (!agencyId) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] p-4">
        <div className="text-center space-y-4 max-w-sm w-full bg-white p-8 rounded-2xl shadow-sm border border-border-secondary">
          <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mx-auto">
            <Bus className="w-10 h-10 text-orange-400" />
          </div>
          <h2 className="text-h3 font-bold text-kongo-black">Compte non lié</h2>
          <p className="text-body text-tertiary">Votre compte n'est pas encore lié à une agence. Veuillez patienter ou contacter l'administration superuser.</p>
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              localStorage.removeItem('kongo-app-state');
              window.location.href = '/admin';
            }}
            className="w-full mt-6 flex items-center justify-center gap-2 bg-red-50 text-red-600 px-4 py-3 rounded-xl font-bold hover:bg-red-100 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Se déconnecter
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Zap className="w-5 h-5 text-kongo-lime" />
            <span className="text-label font-bold text-kongo-lime uppercase tracking-widest">Agence</span>
          </div>
          <h1 className="text-display-2 text-kongo-black font-bold">{agencyName}</h1>
          <p className="text-body text-tertiary">Gestion de votre flotte, voyages et équipe.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => fetchData(true)} disabled={isRefreshing}
            className="btn-outline px-4 py-2 rounded-lg flex items-center gap-2 text-body-small font-bold">
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} /> Actualiser
          </button>
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              localStorage.removeItem('kongo-app-state');
              window.location.href = '/admin';
            }}
            className="w-10 h-10 rounded-lg bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100 transition-colors"
            title="Déconnexion"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Bus', value: stats.buses, icon: Bus, color: 'bg-lime-50 text-lime-700', tab: 'buses' },
          { label: 'Voyages', value: stats.trips, icon: Map, color: 'bg-blue-50 text-blue-700', tab: 'trips' },
          { label: 'Sites', value: sites.length, icon: Building, color: 'bg-cyan-50 text-cyan-700', tab: 'sites' },
          { label: 'Personnel', value: staffMembers.length, icon: Users, color: 'bg-purple-50 text-purple-700', tab: 'personnel' },
          { label: 'Réservations', value: stats.bookings, icon: Ticket, color: 'bg-pink-50 text-pink-700', tab: 'bookings' },
          { label: 'Revenus (CDF)', value: (stats.revenue || 0).toLocaleString('fr-CD'), icon: BarChart3, color: 'bg-orange-50 text-orange-700', tab: 'bookings' },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            onClick={() => setActiveTab(s.tab as TabType)}
            className={`rounded-2xl p-4 cursor-pointer hover:scale-105 transition-transform ${s.color}`}>
            <s.icon className="w-6 h-6 mb-2 opacity-70" />
            <p className="text-2xl font-black">{s.value}</p>
            <p className="text-xs font-medium opacity-70 mt-0.5">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as TabType)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-body-small font-bold whitespace-nowrap transition-all ${activeTab === tab.id ? 'bg-kongo-black text-kongo-lime' : 'bg-gray-100 text-secondary hover:bg-gray-200'}`}>
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Contenu des onglets */}
      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>

          {/* OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Bus rapide */}
              <div className="card-elevated p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-h4 font-bold">Flotte récente</h3>
                  <button onClick={() => setActiveTab('buses')} className="text-kongo-lime text-xs font-bold hover:underline flex items-center gap-1">Tout voir <ChevronRight className="w-3 h-3" /></button>
                </div>
                {buses.slice(0, 3).map(b => (
                  <div key={b.id} className="flex items-center justify-between py-3 border-b border-border-secondary last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center"><Bus className="w-4 h-4 text-secondary" /></div>
                      <div><p className="text-body font-semibold">{b.name}</p><p className="text-xs text-tertiary">{b.plate_number} • {b.type}</p></div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-bold ${getStatusBadge(b.status)}`}>{b.status}</span>
                  </div>
                ))}
                {buses.length === 0 && <p className="text-center text-tertiary text-body-small py-4">Aucun bus enregistré.</p>}
              </div>
              {/* Réservations rapide */}
              <div className="card-elevated p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-h4 font-bold flex items-center gap-2"><Ticket className="w-4 h-4 text-purple-500" /> Réservations Live</h3>
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold animate-pulse">● Live</span>
                </div>
                {bookings.slice(0, 4).map(b => (
                  <div key={b.id} className="flex items-center justify-between py-3 border-b border-border-secondary last:border-0">
                    <div>
                      <p className="text-body font-semibold">{b.booking_code}</p>
                      <p className="text-xs text-tertiary">{b.profiles?.full_name || 'Anonyme'} • {getTimeAgo(b.created_at)}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-bold ${getStatusBadge(b.status)}`}>{b.status}</span>
                  </div>
                ))}
                {bookings.length === 0 && <p className="text-center text-tertiary text-body-small py-4">Aucune réservation.</p>}
              </div>
            </div>
          )}

          {/* BUS */}
          {activeTab === 'buses' && (
            <div className="card-elevated p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-h4 font-bold">Ma Flotte</h2>
                <button onClick={() => { setEditingBus(null); setIsBusFormOpen(true); }} className="btn-primary px-4 py-2 rounded-lg flex items-center gap-2 text-body-small font-bold shadow-kongo-lime">
                  <Plus className="w-4 h-4" /> Ajouter Bus
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead><tr className="text-left border-b border-border-primary text-label text-tertiary">
                    <th className="pb-3">Bus</th><th className="pb-3">Plaque</th><th className="pb-3">Type</th><th className="pb-3">Capac.</th><th className="pb-3">Statut</th><th className="pb-3">Actions</th>
                  </tr></thead>
                  <tbody className="divide-y divide-border-secondary">
                    {buses.length === 0 ? (
                      <tr><td colSpan={5} className="py-8 text-center text-tertiary text-body-small">Aucun bus. <button onClick={() => setIsBusFormOpen(true)} className="text-kongo-lime font-bold hover:underline">Ajouter le premier</button></td></tr>
                    ) : buses.map(b => (
                      <tr key={b.id} className="hover:bg-gray-50">
                        <td className="py-4 font-semibold text-kongo-black">{b.name}</td>
                        <td className="py-4 text-body-small text-secondary font-mono">{b.plate_number}</td>
                        <td className="py-4 text-body-small">{b.type}</td>
                        <td className="py-4 text-body-small">{b.capacity} places</td>
                        <td className="py-4"><span className={`text-xs px-2 py-1 rounded-full font-bold ${getStatusBadge(b.status)}`}>{b.status}</span></td>
                        <td className="py-4">
                          <div className="flex gap-2">
                            <button onClick={() => { setEditingBus(b); setIsBusFormOpen(true); }} className="p-1 hover:text-kongo-lime transition-colors"><Pencil className="w-4 h-4" /></button>
                            <button onClick={() => handleDeleteBus(b.id)} className="p-1 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TRIPS */}
          {activeTab === 'trips' && (
            <div className="card-elevated p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-h4 font-bold">Voyages Programmés</h2>
                  <p className="text-xs text-tertiary mt-0.5">Suivi bus en temps réel • Terminez un voyage depuis cette vue</p>
                </div>
                <button onClick={() => { setEditingTrip(null); setIsTripFormOpen(true); }} className="btn-primary px-4 py-2 rounded-lg flex items-center gap-2 text-body-small font-bold shadow-kongo-lime">
                  <Plus className="w-4 h-4" /> Nouveau Voyage
                </button>
              </div>
              <div className="space-y-3">
                {trips.length === 0 ? (
                  <p className="text-center text-tertiary py-8 text-body-small">Aucun voyage. <button onClick={() => setIsTripFormOpen(true)} className="text-kongo-lime font-bold hover:underline">Créer le premier</button></p>
                ) : trips.map(t => {
                  const canEnd = ['in_progress', 'departed', 'scheduled'].includes(t.status);
                  const isCompleted = t.status === 'completed';
                  const isCancelled = t.status === 'cancelled';
                  return (
                  <div key={t.id} className={`flex items-center justify-between p-4 rounded-xl transition-colors border ${
                    t.status === 'in_progress' ? 'bg-green-50 border-green-200 hover:bg-green-100' :
                    t.status === 'departed' ? 'bg-blue-50 border-blue-200 hover:bg-blue-100' :
                    isCompleted ? 'bg-gray-50 border-gray-200 opacity-70' :
                    isCancelled ? 'bg-red-50 border-red-100 opacity-60' :
                    'bg-gray-50 border-transparent hover:bg-gray-100'
                  }`}>
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        t.status === 'in_progress' ? 'bg-green-100' :
                        t.status === 'departed' ? 'bg-blue-100' :
                        isCompleted ? 'bg-gray-100' : 'bg-blue-50'
                      }`}>
                        <Map className={`w-5 h-5 ${
                          t.status === 'in_progress' ? 'text-green-600' :
                          t.status === 'departed' ? 'text-blue-600' :
                          isCompleted ? 'text-gray-400' : 'text-blue-500'
                        }`} />
                      </div>
                      <div>
                        <p className="font-bold text-kongo-black">{t.origin?.name} → {t.destination?.name}</p>
                        <p className="text-xs text-tertiary">{new Date(t.departure_time).toLocaleString('fr-CD', { dateStyle: 'short', timeStyle: 'short' })} • {t.seats_available}/{t.total_seats} places</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="font-bold text-kongo-black text-body-small">{t.price?.toLocaleString()} CDF</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${getStatusBadge(t.status)}`}>{t.status}</span>
                      </div>
                      <div className="flex gap-1">
                        {canEnd && (
                          <button
                            onClick={() => setEndTripModal({ open: true, trip: t })}
                            title="Terminer ce voyage"
                            className="p-2 bg-white rounded-lg border border-red-200 text-red-500 hover:bg-red-50 hover:border-red-400 transition-all flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider"
                          >
                            <Flag className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Terminer</span>
                          </button>
                        )}
                        <button onClick={() => { setEditingTrip(t); setIsTripFormOpen(true); }} className="p-2 bg-white rounded-lg border border-border-primary hover:text-kongo-lime transition-colors"><Pencil className="w-4 h-4" /></button>
                        <button onClick={() => handleDeleteTrip(t.id)} className="p-2 bg-white rounded-lg border border-border-primary hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                  </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* PERSONNEL UNIFIED */}
          {activeTab === 'personnel' && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 card-elevated p-4">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center">
                        <Users className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div>
                        <h2 className="text-h4 font-black text-kongo-black">Gestion du Personnel</h2>
                        <p className="text-xs text-tertiary">Filtrez par rôle pour gérer vos équipes.</p>
                    </div>
                </div>
                <div className="flex flex-wrap gap-2">
                    <div className="flex bg-gray-100 p-1 rounded-xl">
                        {[
                            { id: 'all', label: 'Tous' },
                            { id: 'driver', label: 'Chauffeurs' },
                            { id: 'cashier', label: 'Vendeurs' },
                            { id: 'chef', label: 'Chefs' },
                            { id: 'agency', label: 'Admins' }
                        ].map(f => (
                            <button
                                key={f.id}
                                onClick={() => setPersonnelFilter(f.id)}
                                className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${
                                    personnelFilter === f.id 
                                    ? 'bg-white text-kongo-black shadow-sm' 
                                    : 'text-tertiary hover:text-kongo-black'
                                }`}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>
                    <Button 
                        onClick={() => { setEditingStaff(null); setIsStaffFormOpen(true); }}
                        className="bg-kongo-black text-white hover:bg-neutral-800 rounded-xl font-bold h-9 px-4"
                    >
                        <Plus className="mr-2 h-4 w-4" /> Ajouter
                    </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {(staffMembers || [])
                  .filter(s => personnelFilter === 'all' || s.role === personnelFilter)
                  .map((staff) => (
                    <motion.div key={staff.id} layout className="bg-white p-5 rounded-3xl border border-neutral-100 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden flex flex-col justify-between min-h-[220px]">
                      <div>
                        <div className="flex justify-between items-start mb-4 relative z-10">
                          <div className="h-12 w-12 rounded-2xl bg-neutral-100 flex items-center justify-center text-kongo-black font-black text-lg shadow-inner">
                            {staff.full_name?.charAt(0) || 'U'}
                          </div>
                          <div className="flex gap-1.5">
                            <button 
                                onClick={() => { setEditingStaff(staff); setIsStaffFormOpen(true); }} 
                                className="p-2 bg-neutral-50 rounded-xl hover:text-kongo-lime transition-colors border border-neutral-100 shadow-sm"
                            >
                              <Pencil size={14} />
                            </button>
                            <button 
                                onClick={() => deleteStaff(staff.id, staff.role || '')} 
                                className="p-2 bg-neutral-50 rounded-xl hover:text-red-500 transition-colors border border-neutral-100 shadow-sm"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                        
                        <div className="relative z-10">
                          <h3 className="font-black text-lg text-kongo-black mb-1 truncate">{staff.full_name}</h3>
                          <div className="flex flex-wrap items-center gap-2 mb-3">
                            <Badge variant="secondary" className={`text-[10px] uppercase font-black px-2 tracking-widest ${
                                staff.role === 'driver' ? 'bg-purple-50 text-purple-600' : 
                                staff.role === 'cashier' ? 'bg-blue-50 text-blue-600' : 
                                staff.role === 'chef' ? 'bg-amber-50 text-amber-600' : 
                                staff.role === 'agency' ? 'bg-indigo-50 text-indigo-600' : 'bg-neutral-50 text-tertiary'
                            }`}>
                              {staff.role === 'driver' ? 'Chauffeur' : 
                               staff.role === 'cashier' ? 'Agent Vente' : 
                               staff.role === 'chef' ? 'Chef Agence' : 
                               staff.role === 'agency' ? 'Admin' : staff.role}
                            </Badge>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex items-center text-xs text-tertiary">
                                <Search size={12} className="mr-2 opacity-50" />
                                {staff.email || 'Pas d\'email'}
                            </div>
                            {staff.phone_number && (
                                <div className="flex items-center text-xs text-tertiary">
                                    <Phone size={12} className="mr-2 opacity-50" />
                                    {staff.phone_number}
                                </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-neutral-50 relative z-10">
                        {staff.role === 'driver' ? (
                            <div className="flex flex-col gap-2">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center text-xs font-bold text-kongo-black">
                                        <Bus size={14} className="mr-2 text-purple-500" />
                                        {staff.buses?.name || 'Aucun bus'} 
                                    </div>
                                    <button 
                                        onClick={() => setAssignModal({ open: true, driver: { ...staff, id: staff.driver_id } })}
                                        className="text-[10px] font-black text-purple-600 hover:underline cursor-pointer"
                                    >
                                        AFFECTER
                                    </button>
                                </div>
                                {staff.license_number && (
                                    <div className="text-[10px] text-tertiary font-bold bg-neutral-50 p-1.5 rounded-lg flex items-center gap-1.5">
                                        <Shield size={10} /> PERMIS: {staff.license_number}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 text-[10px] text-tertiary font-bold bg-neutral-50 p-2 rounded-xl">
                                <Building size={12} />
                                {staff.agency_sites?.[0]?.name || 'Pas d\'affectation site'}
                            </div>
                        )}
                      </div>
                      
                      {/* Decoration */}
                      <Users className="absolute -bottom-6 -right-6 w-24 h-24 text-neutral-50 opacity-40 pointer-events-none" />
                    </motion.div>
                  ))}
                
                {staffMembers.filter(s => personnelFilter === 'all' || s.role === personnelFilter).length === 0 && (
                   <div className="col-span-full py-20 text-center bg-gray-50/50 rounded-3xl border-2 border-dashed border-gray-200">
                      <Users className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                      <h3 className="text-lg font-black text-kongo-black">Aucun membre trouvé</h3>
                      <p className="text-xs text-tertiary max-w-xs mx-auto mt-1">Changez le filtre ou ajoutez un nouveau membre.</p>
                   </div>
                )}
              </div>
            </div>
          )}

          {/* BOOKINGS */}
          {activeTab === 'bookings' && (
            <div className="card-elevated p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-h4 font-bold flex items-center gap-2">
                  <Ticket className="w-5 h-5 text-purple-500" /> Réservations
                </h2>
                <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-bold animate-pulse">● Live</span>
              </div>
              <div className="space-y-3">
                {bookings.length === 0 ? (
                  <p className="text-center text-tertiary py-8 text-body-small">Aucune réservation pour l'instant.</p>
                ) : bookings.map(b => (
                  <div key={b.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-kongo-black text-kongo-lime flex items-center justify-center text-xs font-black">
                        {b.booking_code?.slice(0, 3)}
                      </div>
                      <div>
                        <p className="font-bold text-kongo-black">{b.booking_code}</p>
                        <p className="text-xs text-tertiary">{b.profiles?.full_name || 'Client'} • {getTimeAgo(b.created_at)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-bold ${getStatusBadge(b.status)}`}>{b.status}</span>
                      <span className="font-bold text-kongo-black text-body-small hidden sm:block">{b.total_price?.toLocaleString()} CDF</span>
                      <button 
                        onClick={() => {
                          setSelectedBooking(b);
                          setIsDetailOpen(true);
                        }}
                        className="p-2 hover:bg-gray-100 rounded-lg text-secondary transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <BookingDetailModal 
            booking={selectedBooking} 
            isOpen={isDetailOpen} 
            onClose={() => setIsDetailOpen(false)} 
          />

          {/* STOPS */}
          {activeTab === 'stops' && (
            <div className="card-elevated p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-h4 font-bold flex items-center gap-2">
                  <Map className="w-5 h-5 text-kongo-lime" /> Arrêts disponibles
                </h2>
                <button 
                  onClick={() => { setEditingStop(null); setIsStopFormOpen(true); }} 
                  className="btn-primary px-4 py-2 rounded-lg flex items-center gap-2 text-body-small font-bold"
                >
                  <Plus className="w-4 h-4" /> Ajouter
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {stops.length === 0 ? (
                  <p className="text-center text-tertiary">Aucun arrêt configuré.</p>
                ) : stops.map(s => (
                  <div key={s.id} className="p-4 border border-border-secondary rounded-xl flex justify-between items-center group bg-white hover:border-kongo-lime transition-colors">
                    <div>
                      <p className="font-bold text-kongo-black text-body flex items-center gap-2 flex-wrap">
                        <span>{s.name}</span>
                        <span className="text-xs text-tertiary font-medium">
                          Ville/Province: {s.city_name} {s.address ? `• ${s.address}` : ''}
                        </span>
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => { setEditingStop(s); setIsStopFormOpen(true); }}
                        className="w-8 h-8 rounded-lg bg-gray-50 text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => deleteStop(s.id)}
                        className="w-8 h-8 rounded-lg bg-gray-50 text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PRICING */}
          {activeTab === 'pricing' && (
            <div className="card-elevated p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-h4 font-bold flex items-center gap-2">
                  <Ticket className="w-5 h-5 text-kongo-lime" /> Tarification par âge
                </h2>
                <button 
                  onClick={() => { setEditingCategory(null); setIsCategoryFormOpen(true); }} 
                  className="btn-primary px-4 py-2 rounded-lg flex items-center gap-2 text-body-small font-bold"
                >
                  <Plus className="w-4 h-4" /> Ajouter
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {categories.length === 0 ? (
                  <p className="text-center text-tertiary col-span-full">Aucune catégorie configurée.</p>
                ) : categories.map(c => (
                  <div key={c.id} className="p-4 border border-border-secondary rounded-xl bg-gray-50 flex flex-col items-center group relative hover:border-kongo-lime transition-all">
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => { setEditingCategory(c); setIsCategoryFormOpen(true); }}
                        className="p-1.5 rounded-md bg-white text-gray-400 hover:text-blue-600 shadow-sm"
                      >
                        <Pencil className="w-3 h-3" />
                      </button>
                      <button 
                        onClick={() => deleteCategory(c.id)}
                        className="p-1.5 rounded-md bg-white text-gray-400 hover:text-red-600 shadow-sm"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                    <p className="font-bold text-kongo-black text-h5 mb-1">{c.name}</p>
                    <p className="text-h4 font-bold text-kongo-lime">
                       -{c.discount_percentage}%
                    </p>
                    <p className="text-[10px] text-tertiary mt-2 uppercase tracking-wider font-bold">
                        {(c as any).trip_id ? "✈️ Voyage spécifique" : "🌍 Par défaut"}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SITES (POINTS DE VENTE) */}
          {activeTab === 'sites' && (
            <div className="card-elevated p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-cyan-50 rounded-xl flex items-center justify-center">
                        <Building className="w-5 h-5 text-cyan-600" />
                    </div>
                    <div>
                        <h2 className="text-h4 font-bold">Points de Vente & Bureaux</h2>
                        <p className="text-xs text-tertiary">Gérez les implantations physiques de votre agence.</p>
                    </div>
                </div>
                <button onClick={() => { setEditingSite(null); setIsSiteFormOpen(true); }} className="btn-primary px-4 py-2 rounded-lg flex items-center gap-2 text-body-small font-bold shadow-kongo-lime">
                  <Plus className="w-4 h-4" /> Ajouter un Site
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sites.length === 0 ? (
                  <div className="col-span-full py-12 text-center bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                      <Building className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-tertiary font-medium">Aucun site ou agence physique enregistré.</p>
                      <button onClick={() => setIsSiteFormOpen(true)} className="text-kongo-lime font-bold hover:underline mt-2">Créer votre premier site</button>
                  </div>
                ) : sites.map(site => (
                  <motion.div key={site.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-3xl border border-border-secondary p-5 hover:shadow-xl transition-all group overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="flex gap-2">
                           <button onClick={() => { setEditingSite(site); setIsSiteFormOpen(true); }} className="p-2 bg-white rounded-xl shadow-lg text-secondary hover:text-kongo-lime transition-colors border border-border-primary"><Pencil size={14} /></button>
                           <button onClick={async () => {
                               if(window.confirm("Supprimer ce site ?")) {
                                   try {
                                       const { error } = await supabase.from('agency_sites').delete().eq('id', site.id);
                                       if(error) throw error;
                                       toast.success("Site supprimé");
                                       fetchData(true);
                                   } catch(e: any) { toast.error(e.message); }
                               }
                           }} className="p-2 bg-white rounded-xl shadow-lg text-secondary hover:text-red-500 transition-colors border border-border-primary"><Trash2 size={14} /></button>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-4 mb-5">
                        <div className="w-14 h-14 bg-cyan-100 rounded-2xl flex items-center justify-center text-cyan-700 font-black text-xl">
                            {site.name?.slice(0, 1).toUpperCase()}
                        </div>
                        <div>
                            <h3 className="font-bold text-h4 text-kongo-black leading-tight">{site.name}</h3>
                            <div className="flex items-center gap-1 text-[10px] text-tertiary font-bold uppercase tracking-wider">
                                <PinIcon size={10} /> {site.city || 'Ville non spécifiée'}
                            </div>
                        </div>
                    </div>
                    
                    <div className="space-y-3">
                        <div className="flex items-start gap-3">
                            <PinIcon size={14} className="text-cyan-500 mt-0.5" />
                            <p className="text-body-small text-secondary leading-snug">{site.address || 'Aucune adresse renseignée'}</p>
                        </div>
                        {site.phone && (
                            <div className="flex items-center gap-3">
                                <Phone size={14} className="text-cyan-500" />
                                <p className="text-body-small text-secondary font-mono">{site.phone}</p>
                            </div>
                        )}
                    </div>
                    
                    <div className="mt-6 pt-5 border-t border-dashed border-border-secondary flex items-center justify-between">
                        <div className="flex -space-x-2">
                            {staffMembers.filter(s => s.site_id === site.id).slice(0, 3).map((sm, i) => (
                                <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-[10px] font-black" title={sm.full_name}>
                                    {sm.full_name?.slice(0, 1).toUpperCase()}
                                </div>
                            ))}
                        </div>
                        <p className="text-[10px] font-bold text-tertiary uppercase tracking-widest leading-none">
                            {staffMembers.filter(s => s.site_id === site.id).length} Employés
                        </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Modal Fin de Voyage */}
      <Dialog open={endTripModal.open} onOpenChange={(open: boolean) => !open && !isEndingTrip && setEndTripModal({ open: false, trip: null })}>
        <DialogContent className="sm:max-w-[440px] p-0 overflow-hidden border-none shadow-2xl">
          {/* En-tête rouge */}
          <div className="bg-gradient-to-br from-red-600 to-rose-700 p-8 text-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-10">
              <Flag className="w-40 h-40 absolute -right-8 -bottom-8 rotate-12 text-white" />
            </div>
            <div className="relative z-10">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                <Flag className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-h4 font-black text-white tracking-tight">Terminer le Voyage</h3>
              <p className="text-[11px] text-white/70 mt-1 font-bold uppercase tracking-widest">Suivi Bus • Action irréversible</p>
            </div>
          </div>

          {/* Corps */}
          <div className="p-6 bg-white space-y-5">
            {endTripModal.trip && (
              <div className="bg-gray-50 rounded-2xl p-4 border border-border-secondary">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                    <Map className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="font-black text-kongo-black">{endTripModal.trip.origin?.name} → {endTripModal.trip.destination?.name}</p>
                    <p className="text-xs text-tertiary">{new Date(endTripModal.trip.departure_time).toLocaleString('fr-CD', { dateStyle: 'medium', timeStyle: 'short' })}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className={`px-2 py-0.5 rounded-full font-bold ${getStatusBadge(endTripModal.trip.status)}`}>
                    {endTripModal.trip.status}
                  </span>
                  <span className="text-tertiary">•</span>
                  <span className="text-tertiary">{endTripModal.trip.seats_available}/{endTripModal.trip.total_seats} places disponibles</span>
                </div>
              </div>
            )}

            <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-xl border border-amber-200">
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-black text-amber-800">Cette action est définitive</p>
                <p className="text-[11px] text-amber-700 mt-0.5 leading-relaxed">
                  Le statut du voyage passera à <strong>"Complété"</strong>. Les passagers seront notifiés et le voyage ne sera plus modifiable.
                </p>
              </div>
            </div>
          </div>

          <DialogFooter className="p-6 pt-0 bg-white flex gap-3">
            <Button
              onClick={() => setEndTripModal({ open: false, trip: null })}
              variant="outline"
              disabled={isEndingTrip}
              className="flex-1 rounded-xl font-bold border-border-primary"
            >
              Annuler
            </Button>
            <Button
              onClick={handleEndTrip}
              disabled={isEndingTrip}
              className="flex-1 rounded-xl font-black bg-red-600 hover:bg-red-700 text-white shadow-lg"
            >
              {isEndingTrip ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Traitement...</>
              ) : (
                <><Flag className="w-4 h-4 mr-2" />Confirmer la fin
              </> 
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Affectation Bus */}
      <Dialog open={assignModal.open} onOpenChange={(open: boolean) => !open && setAssignModal({ open: false, driver: null })}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] p-0 overflow-hidden border-none shadow-2xl flex flex-col">
          <div className="bg-kongo-black p-6 text-center relative overflow-hidden shrink-0">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <Bus className="w-24 h-24 rotate-12 text-white" />
            </div>
            <div className="relative z-10">
              <h3 className="text-h4 font-black text-on-black uppercase tracking-tight">Affecter un Bus</h3>
              <p className="text-[10px] text-secondary opacity-60 uppercase font-black tracking-widest mt-1">
                Chauffeur: {assignModal.driver?.full_name}
              </p>
            </div>
          </div>

          <div className="p-6 flex flex-col gap-4 overflow-hidden flex-1 bg-white">
            {/* Barre de recherche */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-tertiary" />
              <input 
                type="text" 
                placeholder="Rechercher par nom ou plaque..." 
                value={busSearchTerm}
                onChange={(e) => setBusSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-border-secondary focus:border-kongo-lime outline-none text-body-small transition-all bg-gray-50"
                autoFocus
              />
            </div>

            <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar space-y-3 pb-2">
              <button 
                onClick={() => { assignDriverToBus(assignModal.driver!.id, null); setAssignModal({ open: false, driver: null }); }}
                className="w-full p-4 rounded-xl border border-dashed border-red-200 text-red-600 bg-red-50/30 hover:bg-red-50 transition-all text-body-small font-black flex items-center justify-center gap-3 uppercase tracking-tighter"
              >
                <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                  <UserX className="w-4 h-4" />
                </div>
                Retirer l'affectation actuelle
              </button>

              <Separator className="my-4" />
              
              <p className="text-[10px] font-black text-tertiary uppercase tracking-widest text-center mb-2">Bus disponibles</p>

              <div className="grid gap-3">
                {buses
                  .filter(b => 
                    b.status === 'active' && 
                    (b.name.toLowerCase().includes(busSearchTerm.toLowerCase()) || 
                     b.plate_number.toLowerCase().includes(busSearchTerm.toLowerCase()))
                  )
                  .map(b => {
                    const isAssignedToOther = drivers.some(d => d.assigned_bus_id === b.id && d.id !== assignModal.driver?.id);
                    const isSelected = assignModal.driver?.assigned_bus_id === b.id;

                    return (
                      <button key={b.id} 
                        onClick={() => !isAssignedToOther && assignDriverToBus(assignModal.driver!.id, b.id)}
                        className={`w-full p-4 rounded-2xl border text-left transition-all group relative overflow-hidden ${
                          isSelected 
                            ? 'border-kongo-lime bg-lime-50/50 ring-2 ring-kongo-lime/20' 
                            : isAssignedToOther 
                              ? 'border-gray-50 bg-gray-50 opacity-60 cursor-not-allowed grayscale' 
                              : 'border-border-primary hover:border-kongo-lime hover:bg-white hover:shadow-lg'
                        }`}
                        disabled={isAssignedToOther}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors shadow-sm ${isSelected ? 'bg-kongo-lime text-kongo-black' : 'bg-white text-secondary group-hover:bg-lime-50 group-hover:text-lime-700'}`}>
                              <Bus className="w-6 h-6" />
                            </div>
                            <div>
                              <p className="font-black text-kongo-black uppercase tracking-tight text-body-large">{b.name}</p>
                              <p className="text-[10px] font-bold text-tertiary uppercase tracking-widest">{b.plate_number} • {b.capacity} PLACES</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {isAssignedToOther && (
                               <Badge variant="outline" className="text-[9px] font-black bg-red-50 text-red-500 border-red-100 uppercase h-5">Occupé</Badge>
                            )}
                            {isSelected ? (
                              <div className="w-8 h-8 rounded-full bg-kongo-lime flex items-center justify-center shadow-kongo-lime/30 shadow-lg scale-110">
                                <Check className="w-5 h-5 text-kongo-black" />
                              </div>
                            ) : !isAssignedToOther && (
                                <ChevronRight className="w-5 h-5 text-border-primary group-hover:text-kongo-lime transition-transform group-hover:translate-x-1" />
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}

                {buses.filter(b => 
                    b.status === 'active' && 
                    (b.name.toLowerCase().includes(busSearchTerm.toLowerCase()) || 
                     b.plate_number.toLowerCase().includes(busSearchTerm.toLowerCase()))
                  ).length === 0 && (
                  <div className="py-12 text-center bg-gray-50 rounded-2xl border border-dashed border-border-secondary">
                    <p className="text-tertiary text-body-small font-bold">Aucun bus ne correspond à votre recherche.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <DialogFooter className="p-6 bg-surface-secondary/50 border-t border-border-primary/5">
            <Button 
                onClick={() => { setAssignModal({ open: false, driver: null }); setBusSearchTerm(''); }}
                variant="outline" 
                className="w-full rounded-xl py-6 font-black uppercase text-xs tracking-widest border-kongo-black hover:bg-kongo-black hover:text-white transition-all shadow-sm"
            >
                Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Forms */}
      <AddBusForm isOpen={isBusFormOpen} onClose={() => { setIsBusFormOpen(false); setEditingBus(null); fetchData(true); }} agencyId={agencyId!} initialData={editingBus} />
      <AddTripForm isOpen={isTripFormOpen} onClose={() => { setIsTripFormOpen(false); setEditingTrip(null); fetchData(true); }} agencyId={agencyId!} initialData={editingTrip} />
      <AddStopForm 
        isOpen={isStopFormOpen} 
        onClose={() => { setIsStopFormOpen(false); fetchData(); setEditingStop(null); }} 
        initialData={editingStop}
      />
      <AddAgeCategoryForm 
        isOpen={isCategoryFormOpen} 
        onClose={() => { setIsCategoryFormOpen(false); fetchData(); setEditingCategory(null); }} 
        initialData={editingCategory}
        trips={trips}
      />
      <AddStaffForm 
        isOpen={isStaffFormOpen} 
        onClose={() => { setIsStaffFormOpen(false); setEditingStaff(null); fetchData(true); }} 
        agencyId={agencyId!} 
        sites={sites} 
        initialData={editingStaff}
      />
      <AddSiteForm 
        isOpen={isSiteFormOpen} 
        onClose={() => { setIsSiteFormOpen(false); setEditingSite(null); fetchData(true); }} 
        agencyId={agencyId!} 
        initialData={editingSite} 
      />
    </div>
  );
}

