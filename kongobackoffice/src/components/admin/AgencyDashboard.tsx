// [Agent Dev Web] - Action: Création AgencyDashboard - Gestion bus, voyages, chauffeurs et affectations
// [Agent Analytique] - Action: Refonte Overview - KPIs, Histogramme CA par site, Filtres temporels
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Bus, Map, Users, Loader2, RefreshCw, Ticket, BarChart3, Eye, LogOut,
  Zap, TrendingUp, Shield, Plus, Pencil, Trash2, Building, Phone, X,
  UserX, Search, Check, UserCheck, ChevronRight, ClipboardList, MapPin as PinIcon, MapPin, Clock,
  ScanLine, Calendar, CalendarRange, Smartphone, Monitor, Building2, History, Inbox, Compass
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
import { AddBusForm, AddTripForm, AddStaffForm, AddStopForm, AddAgeCategoryForm, AddSiteForm, AddExtraServiceForm } from './AdminForms';
import { Stop, AgeCategory } from '../app/AppConstants';
import { LiveMapTab } from './LiveMapTab';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell
} from 'recharts';

// [Agent Dev Web] - Action: Ajout onglet Carte Live GPS - AgencyDashboard
import { TriangleAlert, Wallet } from 'lucide-react';
type TabType = 'overview' | 'buses' | 'trips' | 'personnel' | 'sites' | 'bookings' | 'stops' | 'pricing' | 'services' | 'map' | 'reports';
type StatsPeriod = 'today' | '7days' | 'month' | 'total' | 'custom';

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
  bus_id: string;
  origin?: { name: string };
  destination?: { name: string };
  buses?: { name: string } | null;
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
  avatar_url?: string | null;
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
  reports: number;
}

interface DriverReport {
  id: string;
  driver_id: string;
  category: string;
  severity: string;
  location: string | null;
  description: string;
  status: string;
  created_at: string;
  profiles?: { full_name: string; phone_number: string } | null;
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

import { PageProps } from '../app/AppHelpers';

export function AgencyDashboard({ onLogout }: PageProps) {
  const getTabFromHash = () => {
    if (typeof window === 'undefined') return 'overview';
    const hash = window.location.hash.replace('#', '');
    const validTabs: TabType[] = ['overview', 'map', 'buses', 'trips', 'personnel', 'sites', 'bookings', 'stops', 'pricing', 'services', 'reports'];
    return validTabs.includes(hash as TabType) ? (hash as TabType) : 'overview';
  };

  const [activeTab, setActiveTab] = useState<TabType>(getTabFromHash);

  useEffect(() => {
    const handleHash = () => setActiveTab(getTabFromHash());
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);
  // [Agent Analytique] - Action: Ajout états analytiques
  const [statsPeriod, setStatsPeriod] = useState<StatsPeriod>('today');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [ticketScans, setTicketScans] = useState<any[]>([]);
  const [allBookings, setAllBookings] = useState<any[]>([]);

  const [stats, setStats] = useState<AgencyStats>({ buses: 0, trips: 0, drivers: 0, bookings: 0, revenue: 0, reports: 0 });
  const [buses, setBuses] = useState<Bus[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [busLocations, setBusLocations] = useState<any[]>([]);
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [sites, setSites] = useState<AgencySite[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [reports, setReports] = useState<DriverReport[]>([]);
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
  const [extraServices, setExtraServices] = useState<any[]>([]);
  const [isExtraServiceFormOpen, setIsExtraServiceFormOpen] = useState(false);
  const [editingExtraService, setEditingExtraService] = useState<any>(null);
  const [personnelFilter, setPersonnelFilter] = useState('all');

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
      const [busRes, tripRes, driverRes, staffRes, siteRes, extraServicesRes, busLocRes] = await Promise.all([
        supabase.from('buses').select('*').eq('agency_id', aid).order('created_at', { ascending: false }),
        supabase.from('trips').select('*, origin:locations!origin_location_id(name), destination:locations!destination_location_id(name)').eq('agency_id', aid).order('departure_time', { ascending: true }),
        supabase.from('drivers').select('*, buses(name, plate_number)').eq('agency_id', aid).order('created_at', { ascending: false }),
        supabase.from('profiles').select('id, full_name, email, phone_number, role, site_id, avatar_url, agency_sites(name), created_at').eq('agency_id', aid).order('created_at', { ascending: false }),
        supabase.from('agency_sites').select('*').eq('agency_id', aid).order('created_at', { ascending: false }),
        supabase.from('extra_services').select('*').eq('agency_id', aid).order('created_at', { ascending: false }),
        supabase.from('bus_locations').select('*').eq('agency_id', aid)
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
      setExtraServices(extraServicesRes.data || []);
      setBusLocations(busLocRes.data || []);

      // [Agent Analytique] - Action: Fetch all bookings + ticket_scans pour analytics
      const agencyTripIds = (tripRes.data || []).map((t: any) => t.id);
      let bookingsData: any[] = [];
      if (agencyTripIds.length > 0) {
        const { data: bookingRows } = await supabase
          .from('bookings')
          .select('*, profiles!bookings_user_id_profiles_fkey(full_name, phone_number), trips(*, origin:locations!origin_location_id(name), destination:locations!destination_location_id(name))')
          .in('trip_id', agencyTripIds)
          .order('created_at', { ascending: false });
        bookingsData = bookingRows || [];

        // Fetch ticket scans for these trips
        const { data: scansData } = await supabase
          .from('ticket_scans')
          .select('*')
          .in('trip_id', agencyTripIds);
        setTicketScans(scansData || []);
      }
      setBookings(bookingsData.slice(0, 50)); // UI list keeps last 50
      setAllBookings(bookingsData); // Full list for analytics

      const totalRevenue = bookingsData.filter(b => b.payment_status === 'paid' || b.payment_status === 'completed').reduce((sum, b) => sum + (b.total_price || 0), 0);

      setStats({
        buses: busRes.data?.length || 0,
        trips: tripRes.data?.length || 0,
        drivers: driverRes.data?.length || 0,
        bookings: bookingsData.length,
        revenue: totalRevenue,
        reports: 0, // Fallback if report query fails
      });

      try {
        console.log("Fetching reports for agency:", aid);
        const { data: reportsData, error: reportsError } = await supabase
          .from('driver_reports')
          .select('*, profiles(full_name, phone_number)')
          .eq('agency_id', aid)
          .order('created_at', { ascending: false });
        
        if (reportsError) {
          console.error("Error fetching reports (simple join):", reportsError);
          // Try fallback join if the schema hasn't been updated with the named FK
          const { data: fallbackData } = await supabase
            .from('driver_reports')
            .select('*, profiles!driver_reports_driver_id_fkey(full_name, phone_number)')
            .eq('agency_id', aid)
            .order('created_at', { ascending: false });
          
          if (fallbackData) {
            setReports(fallbackData);
            setStats(prev => ({ ...prev, reports: fallbackData.filter((r: any) => r.status === 'pending').length }));
          }
        } else if (reportsData) {
          console.log("Reports fetched successfully:", reportsData.length);
          setReports(reportsData);
          setStats(prev => ({ ...prev, reports: reportsData.filter((r: any) => r.status === 'pending').length }));
        }
      } catch (err) {
        console.error("Unexpected error in fetchReports block:", err);
      }

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
    window.addEventListener('refresh-stops', () => fetchData(true));
    window.addEventListener('refresh-pricing', () => fetchData(true));
    window.addEventListener('refresh-extra-services', () => fetchData(true));
    
    return () => { 
      supabase.removeChannel(channel); 
      window.removeEventListener('refresh-buses', refreshHandler);
      window.removeEventListener('refresh-trips', refreshHandler);
      window.removeEventListener('refresh-drivers', refreshHandler);
      window.removeEventListener('refresh-staff', refreshHandler);
      window.removeEventListener('refresh-sites', refreshHandler);
    window.removeEventListener('refresh-stops', refreshHandler);
    window.removeEventListener('refresh-pricing', refreshHandler);
    window.removeEventListener('refresh-extra-services', refreshHandler);
    window.removeEventListener('refresh-categories', refreshHandler);
    };
  }, [fetchData]);

  const handleDeleteBus = async (id: string) => {
    if (!window.confirm("Voulez-vous vraiment supprimer ce bus ?")) return;
    try {
      const { error } = await supabase.from('buses').delete().eq('id', id);
      if (error) throw error;
      toast.success("Bus supprimé");
      fetchData(true);
    } catch (e: any) { toast.error(e.message); }
  };

  const handleDeleteExtraService = async (id: string) => {
    if (!window.confirm("Voulez-vous vraiment supprimer ce service ?")) return;
    try {
      const { error } = await supabase.from('extra_services').delete().eq('id', id);
      if (error) throw error;
      toast.success("Service supprimé");
      fetchData(true);
    } catch (e: any) { toast.error(e.message); }
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

  // [Agent Analytique] - Action: Memos pour filtrage dynamique par période
  const isInPeriod = useCallback((dateStr: string | undefined): boolean => {
    if (!dateStr) return statsPeriod === 'total';
    const d = new Date(dateStr);
    const now = new Date();
    if (statsPeriod === 'today') return d.toDateString() === now.toDateString();
    if (statsPeriod === '7days') { const w = new Date(); w.setDate(now.getDate() - 7); return d >= w; }
    if (statsPeriod === 'month') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    if (statsPeriod === 'custom' && customFrom && customTo) {
      return d >= new Date(customFrom) && d <= new Date(customTo + 'T23:59:59');
    }
    return true; // 'total'
  }, [statsPeriod, customFrom, customTo]);

  const analyticsStats = useMemo(() => {
    const fb = allBookings.filter(b => isInPeriod(b.created_at));
    const paidBookings = fb.filter((b: any) => b.payment_status === 'paid' || b.payment_status === 'completed' || b.status === 'confirmed');
    const revenue = paidBookings.reduce((s: number, b: any) => s + (b.total_price || 0), 0);
    const tickets = ticketScans.filter(s => isInPeriod(s.scanned_at ?? s.created_at)).filter((s: any) => s.result === 'valid' || s.scan_status === 'valid').length;
    const tripsInPeriod = new Set(fb.map((b: any) => b.trip_id)).size;

    // Bus status breakdown (temps réel, non filtré par période)
    const busesEnVoyage = buses.filter(b => {
      const loc = busLocations.find((l: any) => l.bus_id === b.id);
      const gpsActive = loc && (Date.now() - new Date(loc.updated_at).getTime() < 10 * 60 * 1000) && loc.status === 'active';
      const tripActive = trips.some(t => t.bus_id === b.id && t.status === 'in_progress');
      return gpsActive || tripActive;
    }).length;
    const busesEnPanne = buses.filter(b => b.status === 'maintenance').length;
    const busesEnRepos = buses.length - busesEnVoyage - busesEnPanne;

    return { revenue, tickets, tripsInPeriod, busesEnVoyage, busesEnPanne, busesEnRepos, totalBuses: buses.length, totalBookings: fb.length };
  }, [allBookings, ticketScans, buses, busLocations, trips, isInPeriod]);

  const revenuePerSite = useMemo(() => {
    const fb = allBookings
      .filter((b: any) => isInPeriod(b.created_at))
      .filter((b: any) => b.payment_status === 'paid' || b.payment_status === 'completed' || b.status === 'confirmed');
    const siteMap: Record<string, { name: string; revenue: number; channel: string }> = {};

    // Initialize with real sites
    sites.forEach(s => { siteMap[s.id] = { name: s.name, revenue: 0, channel: 'site' }; });
    // Virtual channels
    siteMap['__online__'] = { name: 'Mobile/Web', revenue: 0, channel: 'online' };
    siteMap['__kiosk__'] = { name: 'Borne', revenue: 0, channel: 'kiosk' };

    fb.forEach((booking: any) => {
      const amount = booking.total_price || 0;
      
      const isBorne = booking.contact_email?.includes('borne') || booking.booking_code?.startsWith('KGO-B');
      const isOnline = !booking.cashier_id && !isBorne && booking.booking_code?.startsWith('KGO');
      
      if (isBorne) {
        siteMap['__kiosk__'].revenue += amount;
      } else if (isOnline) {
        siteMap['__online__'].revenue += amount;
      } else if (booking.cashier_id) {
        // Find cashier in staffMembers to determine their site
        const cashier = staffMembers.find(s => s.id === booking.cashier_id);
        const cashierSiteId = cashier?.site_id;
        
        if (cashierSiteId && siteMap[cashierSiteId]) {
          siteMap[cashierSiteId].revenue += amount;
        } else {
          siteMap['__online__'].revenue += amount; // Fallback if site is missing
        }
      } else {
         // Ultimate fallback
         siteMap['__online__'].revenue += amount;
      }
    });

    return Object.values(siteMap).filter(s => s.revenue > 0).sort((a, b) => b.revenue - a.revenue);
  }, [allBookings, sites, staffMembers, isInPeriod]);

  const dailyRevenueDetail = useMemo(() => {
    const fb = allBookings
      .filter((b: any) => isInPeriod(b.created_at))
      .filter((b: any) => b.payment_status === 'paid' || b.payment_status === 'completed' || b.status === 'confirmed');
    
    const daySiteMap: Record<string, { timestamp: number; date: string; siteName: string; revenue: number; channel: string; count: number }> = {};

    fb.forEach((booking: any) => {
      const d = new Date(booking.created_at);
      const dateStr = d.toLocaleDateString('fr-CD', { day: '2-digit', month: 'long', year: 'numeric' });
      const dayKey = d.toISOString().split('T')[0];
      const amount = booking.total_price || 0;
      
      const isBorne = booking.contact_email?.includes('borne') || booking.booking_code?.startsWith('KGO-B');
      const isOnline = !booking.cashier_id && !isBorne && booking.booking_code?.startsWith('KGO');
      
      let siteId = '__online__';
      let siteName = 'Mobile/Web';
      let channel = 'online';

      if (isBorne) {
        siteId = '__kiosk__';
        siteName = 'Borne Tactile';
        channel = 'kiosk';
      } else if (booking.cashier_id) {
        const cashier = staffMembers.find(s => s.id === booking.cashier_id);
        const cashierSiteId = cashier?.site_id;
        const site = sites.find(s => s.id === cashierSiteId);
        if (site) {
          siteId = site.id;
          siteName = site.name;
          channel = 'site';
        }
      }

      const key = `${dayKey}_${siteId}`;
      if (!daySiteMap[key]) {
        daySiteMap[key] = { 
            timestamp: d.getTime(), 
            date: dateStr, 
            siteName, 
            revenue: 0, 
            channel,
            count: 0
        };
      }
      daySiteMap[key].revenue += amount;
      daySiteMap[key].count += 1;
    });

    return Object.values(daySiteMap).sort((a, b) => b.timestamp - a.timestamp);
  }, [allBookings, sites, staffMembers, isInPeriod]);

  const tabs = [
    { id: 'overview', label: 'Aperçu', icon: BarChart3 },
    { id: 'map', label: 'Carte Live', icon: MapPin, badge: 'LIVE' },
    { id: 'personnel', label: `Personnel (${staffMembers.length})`, icon: Users },
    { id: 'buses', label: `Bus (${stats.buses})`, icon: Bus },
    { id: 'trips', label: `Voyages (${stats.trips})`, icon: Map },
    { id: 'reports', label: `Signalements (${stats.reports})`, icon: TriangleAlert },
    { id: 'sites', label: `Sites/Points vente (${sites.length})`, icon: Building },
    { id: 'bookings', label: `Réservations (${stats.bookings})`, icon: Ticket },
    { id: 'stops', label: `Arrêts (${stops.length})`, icon: Map },
    { id: 'pricing', label: `Tarifs par âge`, icon: Ticket },
    { id: 'services', label: `Services & Bagages`, icon: Wallet },
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
      <div className="flex items-center justify-center min-h-[80vh] bg-slate-50 p-6 selection:bg-kongo-lime/20">
        <div className="text-center space-y-8 max-w-sm w-full bg-white p-10 rounded-2xl border border-slate-200 shadow-xl relative overflow-hidden group">
          <div className="w-20 h-20 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-center mx-auto shadow-sm relative z-10 transition-transform group-hover:scale-105">
            <Bus className="w-10 h-10 text-slate-400" />
          </div>

          <div className="relative z-10 space-y-2">
            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight leading-none">Compte non lié</h2>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider leading-relaxed max-w-[200px] mx-auto opacity-70">
              Votre agence n'est pas encore activée ou liée.
            </p>
          </div>

          <div className="h-[1px] bg-slate-100 w-full relative z-10" />

          <Button
            variant="premium"
            size="premium"
            onClick={() => {
              onLogout();
            }}
            className="w-full h-12 flex items-center justify-center gap-3"
          >
            <LogOut className="w-4 h-4 text-kongo-lime" />
            Se déconnecter
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-6 animate-in fade-in duration-700">
      <div className="flex items-center justify-between gap-4 mb-2">
         <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center border border-emerald-100">
               <Zap className="w-4 h-4 text-emerald-600" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">Vue d'ensemble</h2>
         </div>
         <div className="flex items-center gap-2 bg-white p-1.5 rounded-xl border border-slate-200 shadow-sm">
          <Button
            variant="premium"
            size="icon"
            onClick={() => fetchData(true)}
            disabled={isRefreshing}
            className="w-11 h-11 rounded-xl active:scale-95 group"
            title="Actualiser les données"
          >
            <RefreshCw className={`w-4 h-4 text-white transition-all duration-500 ${isRefreshing ? 'animate-spin' : 'group-hover:rotate-180'}`} />
          </Button>
          <div className="h-6 w-[1px] bg-slate-200 mx-1" />
          <div className="flex -space-x-2 px-2">
             {staffMembers.slice(0, 3).map((s, i) => (
                 <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-900 shadow-sm overflow-hidden">
                     {s.avatar_url ? (
                         <img src={s.avatar_url} alt={s.full_name} className="w-full h-full object-cover" />
                     ) : (
                         s.full_name?.charAt(0)
                     )}
                 </div>
             ))}
             {staffMembers.length > 3 && (
                 <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-900 flex items-center justify-center text-[8px] font-black text-white shadow-sm">
                     +{staffMembers.length - 3}
                 </div>
             )}
          </div>
        </div>
      </div>




      {/* Contenu des onglets */}
      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>

          {/* CARTE LIVE GPS */}
          {activeTab === 'map' && (
            <LiveMapTab agencyId={agencyId} />
          )}

          {/* OVERVIEW ANALYTIQUE */}
          {activeTab === 'overview' && (
            <div className="space-y-8">

              {/* === FILTRES TEMPORELS === */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="flex items-center bg-white border border-slate-200 p-1 rounded-xl shadow-sm gap-1 flex-wrap">
                  {([
                    { id: 'today', label: "Aujourd'hui", icon: Clock },
                    { id: '7days', label: '7 Jours', icon: Calendar },
                    { id: 'month', label: 'Ce Mois', icon: CalendarRange },
                    { id: 'total', label: 'Global', icon: TrendingUp },
                    { id: 'custom', label: 'Période', icon: CalendarRange },
                  ] as { id: StatsPeriod; label: string; icon: any }[]).map(p => (
                    <button
                      key={p.id}
                      onClick={() => setStatsPeriod(p.id)}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all border border-transparent ${
                        statsPeriod === p.id
                          ? 'shadow-lg ring-1 ring-slate-900/5'
                          : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                      style={{
                        backgroundColor: statsPeriod === p.id ? '#101820' : 'transparent',
                        color: statsPeriod === p.id ? '#FFFFFF' : undefined
                      }}
                    >
                      <p.icon className={`w-3.5 h-3.5 ${statsPeriod === p.id ? 'text-kongo-lime' : 'text-slate-400'}`} />
                      {p.label}
                    </button>
                  ))}
                </div>
                {statsPeriod === 'custom' && (
                  <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl p-2 shadow-sm">
                    <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)}
                      className="text-[10px] font-bold text-slate-700 border border-slate-200 rounded-lg px-3 py-1.5 bg-slate-50 uppercase outline-none focus:border-slate-900 transition-colors" />
                    <span className="text-slate-400 font-black text-xs">→</span>
                    <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)}
                      className="text-[10px] font-bold text-slate-700 border border-slate-200 rounded-lg px-3 py-1.5 bg-slate-50 uppercase outline-none focus:border-slate-900 transition-colors" />
                  </div>
                )}
              </div>

              {/* === KPI CARDS COMPACTS === */}
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
                {/* Agents */}
                <div className="bg-white border border-slate-200 rounded-xl p-2.5 shadow-sm hover:shadow-md transition-all group flex flex-col justify-center min-h-[80px]">
                  <div className="flex items-center gap-1.5 mb-1">
                    <div className="w-6 h-6 bg-indigo-50 rounded-lg flex items-center justify-center border border-indigo-100">
                      <Users className="w-3 h-3 text-indigo-600" />
                    </div>
                    <span className="text-[6.5px] font-black text-slate-500 uppercase tracking-widest leading-none">Agents</span>
                  </div>
                  <p className="text-lg font-black text-slate-900 tabular-nums leading-none tracking-tight">{staffMembers.length}</p>
                  <p className="text-[6px] text-slate-400 font-bold uppercase tracking-widest mt-1">Personnel total</p>
                </div>

                {/* Bus */}
                <div className="bg-white border border-slate-200 rounded-xl p-2.5 shadow-sm hover:shadow-md transition-all group col-span-2 md:col-span-1 min-h-[80px] flex flex-col justify-center">
                  <div className="flex items-center gap-1.5 mb-1">
                    <div className="w-6 h-6 bg-slate-900 rounded-lg flex items-center justify-center">
                      <Bus className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-[6.5px] font-black text-slate-500 uppercase tracking-widest leading-none">Flotte</span>
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <p className="text-lg font-black text-slate-900 tabular-nums leading-none tracking-tight">{analyticsStats.totalBuses}</p>
                    <div className="flex items-center gap-1 flex-wrap">
                      <span className="text-[5.5px] font-black text-emerald-600 uppercase tracking-wider">
                        {analyticsStats.busesEnVoyage} voyage
                      </span>
                      <span className="text-[5.5px] font-black text-amber-600 uppercase tracking-wider">
                        {analyticsStats.busesEnPanne} panne
                      </span>
                    </div>
                  </div>
                </div>

                {/* Voyages */}
                <div className="bg-white border border-slate-200 rounded-xl p-2.5 shadow-sm hover:shadow-md transition-all group min-h-[80px] flex flex-col justify-center">
                  <div className="flex items-center gap-1.5 mb-1">
                    <div className="w-6 h-6 bg-blue-50 rounded-lg flex items-center justify-center border border-blue-100">
                      <Map className="w-3 h-3 text-blue-600" />
                    </div>
                    <span className="text-[6.5px] font-black text-slate-500 uppercase tracking-widest leading-none">Voyages</span>
                  </div>
                  <p className="text-lg font-black text-slate-900 tabular-nums leading-none tracking-tight">{analyticsStats.tripsInPeriod}</p>
                  <p className="text-[6px] text-slate-400 font-bold uppercase tracking-widest mt-1">Sur la période</p>
                </div>

                {/* Tickets validés */}
                <div className="bg-white border border-slate-200 rounded-xl p-2.5 shadow-sm hover:shadow-md transition-all group min-h-[80px] flex flex-col justify-center">
                  <div className="flex items-center gap-1.5 mb-1">
                    <div className="w-6 h-6 bg-emerald-50 rounded-lg flex items-center justify-center border border-emerald-100">
                      <ScanLine className="w-3 h-3 text-emerald-600" />
                    </div>
                    <span className="text-[6.5px] font-black text-slate-500 uppercase tracking-widest leading-none">Tickets Validés</span>
                  </div>
                  <p className="text-lg font-black text-slate-900 tabular-nums leading-none tracking-tight">{analyticsStats.tickets}</p>
                  <p className="text-[6px] text-slate-400 font-bold uppercase tracking-widest mt-1">Scans valides</p>
                </div>

                {/* Sites */}
                <div className="bg-white border border-slate-200 rounded-xl p-2.5 shadow-sm hover:shadow-md transition-all group min-h-[80px] flex flex-col justify-center">
                  <div className="flex items-center gap-1.5 mb-1">
                    <div className="w-6 h-6 bg-purple-50 rounded-lg flex items-center justify-center border border-purple-100">
                      <Building className="w-3 h-3 text-purple-600" />
                    </div>
                    <span className="text-[6.5px] font-black text-slate-500 uppercase tracking-widest leading-none">Sites</span>
                  </div>
                  <p className="text-lg font-black text-slate-900 tabular-nums leading-none tracking-tight">{sites.length}</p>
                  <p className="text-[6px] text-slate-400 font-bold uppercase tracking-widest mt-1">Points de vente</p>
                </div>
              </div>

              {/* === HISTOGRAMME CA PAR SITE === */}
              <div className="grid grid-cols-1 gap-6">
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-200">
                        <BarChart3 className="w-4.5 h-4.5 text-slate-900" />
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">CA par Point de Vente</h3>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Revenus par canal / site physique</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1 text-[9px] font-bold text-slate-500">
                        <Smartphone className="w-3 h-3" /> Mobile/Web
                      </span>
                      <span className="flex items-center gap-1 text-[9px] font-bold text-slate-500">
                        <Monitor className="w-3 h-3" /> Borne
                      </span>
                    </div>
                  </div>
                  {revenuePerSite.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-slate-300">
                      <BarChart3 className="w-12 h-12 mb-3" />
                      <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Aucune donnée pour cette période</p>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={revenuePerSite} margin={{ top: 0, right: 0, left: -10, bottom: 0 }} barSize={32}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                        <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', fill: '#64748b' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} />
                        <Tooltip
                          formatter={(value: number) => [`${value.toLocaleString('fr-CD')} CDF`, 'CA']}
                          contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', fontSize: '11px', fontWeight: 700 }}
                          cursor={{ fill: 'rgba(0,0,0,0.03)' }}
                        />
                        <Bar dataKey="revenue" radius={[6, 6, 0, 0]}>
                          {revenuePerSite.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={
                                entry.channel === 'online' ? '#6366f1' :
                                entry.channel === 'kiosk' ? '#f59e0b' :
                                entry.name === revenuePerSite.filter(e => e.channel === 'site').sort((a, b) => b.revenue - a.revenue)[0]?.name
                                  ? '#0f172a' : '#cbd5e1'
                              }
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                  {/* Légende */}
                  <div className="flex items-center gap-4 mt-4 flex-wrap">
                    <span className="flex items-center gap-1.5 text-[9px] font-black text-slate-500 uppercase tracking-widest">
                      <span className="w-3 h-3 rounded-sm bg-indigo-500" /> Mobile / Web (client en ligne)
                    </span>
                    <span className="flex items-center gap-1.5 text-[9px] font-black text-slate-500 uppercase tracking-widest">
                      <span className="w-3 h-3 rounded-sm bg-amber-500" /> Borne tactile
                    </span>
                    <span className="flex items-center gap-1.5 text-[9px] font-black text-slate-500 uppercase tracking-widest">
                      <span className="w-3 h-3 rounded-sm bg-slate-900" /> Site (meilleur)
                    </span>
                  </div>
                </div>
              </div>

              {/* === JOURNAL DES REVENUS PAR SITE === */}
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col gap-6">
                    {/* Titre principal */}
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center border border-slate-200 shadow-sm transition-transform hover:scale-105">
                            <History className="w-6 h-6 text-slate-900" />
                        </div>
                        <div>
                            <h3 className="text-base font-black text-slate-900 uppercase tracking-tight leading-none">Journal des Revenus</h3>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1.5">Détail analytique des encaissements par point de vente</p>
                        </div>
                    </div>

                    {/* Indicateurs clés */}
                    <div className="flex flex-wrap items-center gap-8 lg:gap-14 pt-2">
                        <div className="flex flex-col">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 opacity-70">Chiffre d'Affaires</span>
                            <div className="flex items-baseline gap-1.5">
                                <p className="text-2xl font-black text-slate-900 tabular-nums leading-none tracking-tight">
                                    {analyticsStats.revenue.toLocaleString('fr-CD')}
                                </p>
                                <span className="text-[11px] text-slate-500 font-black uppercase">CDF</span>
                            </div>
                        </div>
                        
                        <div className="w-px h-10 bg-slate-200 hidden sm:block" />
                        
                        <div className="flex flex-col">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 opacity-70">Réservations</span>
                            <div className="flex items-baseline gap-1.5">
                                <p className="text-2xl font-black text-slate-900 tabular-nums leading-none tracking-tight">
                                    {analyticsStats.totalBookings}
                                </p>
                                <span className="text-[11px] text-slate-500 font-black uppercase">Résa.</span>
                            </div>
                        </div>
                        
                        <div className="w-px h-10 bg-slate-200 hidden sm:block" />
                        
                        <div className="flex flex-col">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 opacity-70">Panier Moyen</span>
                            <div className="flex items-baseline gap-1.5">
                                <p className="text-2xl font-black text-slate-900 tabular-nums leading-none tracking-tight">
                                    {analyticsStats.totalBookings > 0 ? Math.round(analyticsStats.revenue / analyticsStats.totalBookings).toLocaleString('fr-CD') : '—'}
                                </p>
                                <span className="text-[11px] text-slate-500 font-black uppercase">CDF / Résa.</span>
                            </div>
                        </div>
                    </div>

                    {/* Répartition par site */}
                    <div className="flex flex-wrap items-center gap-3 pt-6 border-t border-slate-200/60">
                        <div className="flex items-center gap-2 mr-2">
                            <TrendingUp className="w-3 h-3 text-slate-400" />
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Répartition par Site :</span>
                        </div>
                        {revenuePerSite.map((site, idx) => (
                            <div key={idx} className="flex items-center gap-4 px-4 py-2 bg-white border border-slate-100 rounded-xl shadow-sm hover:border-slate-300 transition-all hover:shadow-md group">
                                <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${
                                        site.channel === 'online' ? 'bg-indigo-500' :
                                        site.channel === 'kiosk' ? 'bg-amber-500' :
                                        'bg-slate-900'
                                    }`} />
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">{site.name}</span>
                                </div>
                                <div className="w-px h-3 bg-slate-200" />
                                <span className="text-[11px] font-black text-slate-900 tabular-nums leading-none">
                                    {site.revenue.toLocaleString('fr-CD')} <span className="text-[9px] text-slate-400 font-bold ml-1">CDF</span>
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50/30">
                            <tr className="text-left border-b border-slate-100">
                                <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                                <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Point de Vente / Canal</th>
                                <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Volume</th>
                                <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Recette Totale</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {dailyRevenueDetail.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="py-12 text-center">
                                        <div className="flex flex-col items-center gap-2 text-slate-300">
                                            <Inbox className="w-8 h-8 opacity-20" />
                                            <p className="text-[10px] font-bold uppercase tracking-widest">Aucun encaissement sur cette période</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : dailyRevenueDetail.map((item, idx) => (
                                <tr key={idx} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="py-4 px-6">
                                        <span className="text-[11px] font-black text-slate-900 uppercase tracking-tight">{item.date}</span>
                                    </td>
                                    <td className="py-4 px-6">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center border shadow-sm ${
                                                item.channel === 'online' ? 'bg-indigo-50 border-indigo-100 text-indigo-600' :
                                                item.channel === 'kiosk' ? 'bg-amber-50 border-amber-100 text-amber-600' :
                                                'bg-slate-900 border-slate-800 text-white'
                                            }`}>
                                                {item.channel === 'online' ? <Smartphone className="w-4 h-4" /> :
                                                 item.channel === 'kiosk' ? <Monitor className="w-4 h-4" /> :
                                                 <Building2 className="w-4 h-4" />}
                                            </div>
                                            <div>
                                                <p className="text-xs font-black text-slate-900 tracking-tight leading-none mb-1">{item.siteName}</p>
                                                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{item.channel === 'site' ? 'Paiement Physique' : 'Paiement Numérique'}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-4 px-6 text-center">
                                        <span className="text-[10px] font-black bg-slate-100 text-slate-600 px-2 py-1 rounded-md">{item.count} résa.</span>
                                    </td>
                                    <td className="py-4 px-6 text-right">
                                        <p className="text-sm font-black text-slate-900 tabular-nums leading-none mb-1">{item.revenue.toLocaleString('fr-CD')} <span className="text-[9px] text-slate-400">CDF</span></p>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
              </div>



            </div>
          )}

          {/* BUS */}
          {activeTab === 'buses' && (() => {
            const filteredBuses = buses.filter(b => 
              b.name?.toLowerCase().includes(busSearchTerm.toLowerCase()) ||
              b.plate_number?.toLowerCase().includes(busSearchTerm.toLowerCase()) ||
              b.type?.toLowerCase().includes(busSearchTerm.toLowerCase())
            );

            return (
              <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-6 overflow-hidden">
                  <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-200">
                          <Bus className="w-6 h-6 text-slate-900" />
                      </div>
                      <div>
                          <h2 className="text-2xl text-slate-900 font-black tracking-tight uppercase leading-none">MA FLOTTE</h2>
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Gestion technique du parc</p>
                      </div>
                  </div>

                  <div className="flex items-center gap-3 flex-1 max-w-md">
                    <div className="relative w-full group">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-slate-900 transition-colors" />
                      <input 
                        type="text"
                        placeholder="Rechercher un bus (Nom, Plaque, Type)..."
                        value={busSearchTerm}
                        onChange={(e) => setBusSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 placeholder:text-slate-400 placeholder:font-medium focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 transition-all"
                      />
                    </div>
                    <Button 
                        variant="premium"
                        size="premium"
                        onClick={() => { setEditingBus(null); setIsBusFormOpen(true); }} 
                        className="shrink-0"
                    >
                      <Plus className="w-4 h-4 text-kongo-lime" /> Nouveau Bus
                    </Button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead><tr className="text-left border-b border-slate-100">
                      <th className="pb-4 text-[10px] font-black text-slate-500 uppercase tracking-widest px-4">Identifiant Bus</th>
                      <th className="pb-4 text-[10px] font-black text-slate-500 uppercase tracking-widest px-4">Immatriculation</th>
                      <th className="pb-4 text-[10px] font-black text-slate-500 uppercase tracking-widest px-4">Type / Capacité</th>
                      <th className="pb-4 text-[10px] font-black text-slate-500 uppercase tracking-widest px-4">Statut</th>
                      <th className="pb-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right px-4">Actions</th>
                    </tr></thead>
                    <tbody className="divide-y divide-slate-50">
                      {filteredBuses.length === 0 ? (
                        <tr><td colSpan={5} className="py-24 text-center text-slate-400 border border-slate-200 border-dashed rounded-xl">
                          <Bus className="w-12 h-12 opacity-20 mx-auto mb-4" />
                          <p className="text-sm font-bold text-slate-900 uppercase">Aucun bus trouvé</p>
                          <p className="text-[10px] font-bold uppercase tracking-widest mt-1">Essayez une autre recherche ou créez un nouveau bus</p>
                        </td></tr>
                      ) : filteredBuses.map(b => (
                        <tr key={b.id} className="group hover:bg-slate-50 transition-colors">
                          <td className="py-5 px-4">
                              <div className="flex items-center gap-4">
                                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-slate-200 group-hover:scale-105 transition-transform shadow-sm">
                                    <Bus className="w-4.5 h-4.5 text-slate-400 group-hover:text-slate-900 transition-colors" />
                                  </div>
                                  <span className="font-black text-slate-900 uppercase tracking-tight text-sm">{b.name}</span>
                              </div>
                          </td>
                          <td className="py-5 px-4 text-sm text-slate-700 font-bold uppercase tracking-tight">{b.plate_number}</td>
                          <td className="py-5 px-4">
                              <div className="flex flex-col">
                                  <span className="text-sm text-slate-900 font-black uppercase tracking-tight">{b.type}</span>
                                  <span className="text-sm text-slate-500 font-bold uppercase tracking-tight opacity-70">{b.capacity} PLACES</span>
                              </div>
                          </td>
                          <td className="py-5 px-4">
                              <span className={`text-[10px] px-3 py-1.5 rounded-lg font-black uppercase tracking-widest border shadow-sm ${
                                  b.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                  b.status === 'maintenance' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                  'bg-rose-50 text-rose-700 border-rose-200'
                              }`}>{b.status}</span>
                          </td>
                          <td className="py-5 px-4 text-right">
                            <div className="flex gap-2 justify-end">
                              <Button variant="outline" size="icon" onClick={() => { setEditingBus(b); setIsBusFormOpen(true); }} className="w-9 h-9 rounded-xl border-slate-200 hover:border-slate-400 group-hover:bg-white transition-all shadow-sm" title="Modifier"><Pencil className="w-4 h-4 text-slate-600" /></Button>
                              <Button 
                                variant="outline" 
                                size="icon" 
                                onClick={() => handleDeleteBus(b.id)} 
                                className="w-9 h-9 rounded-xl border-rose-300/60 hover:border-rose-400 hover:bg-rose-50 text-rose-500 transition-all shadow-sm" 
                                title="Supprimer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })()}

          {/* TRIPS */}
          {activeTab === 'trips' && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-5 overflow-hidden">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center border border-slate-200">
                      <Map className="w-5 h-5 text-slate-900" />
                    </div>
                    <div>
                      <h2 className="text-base text-slate-900 font-black tracking-tight uppercase leading-none">PROGRAMMATEUR</h2>
                      <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest mt-1 opacity-70">Voyages planifiés</p>
                    </div>
                </div>
                <Button 
                    variant="premium"
                    size="sm"
                    onClick={() => { setEditingTrip(null); setIsTripFormOpen(true); }} 
                    className="h-8 px-4 text-[9px] font-black uppercase tracking-widest"
                >
                  <Plus className="w-3.5 h-3.5 text-kongo-lime mr-1.5" /> Nouveau Voyage
                </Button>
              </div>
              
              <div className="space-y-2">
                {trips.length === 0 ? (
                  <div className="py-16 text-center text-slate-400 border border-slate-200 border-dashed rounded-xl">
                      <Map className="w-8 h-8 opacity-20 mx-auto mb-3" />
                      <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Aucun voyage programmé</p>
                      <button onClick={() => setIsTripFormOpen(true)} className="text-slate-900 font-black uppercase text-[8px] tracking-widest hover:underline mt-4">Créer le premier</button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-2">
                    {trips.map(t => (
                      <div key={t.id} className="group flex flex-col lg:flex-row lg:items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-xl hover:bg-white hover:border-slate-300 hover:shadow-md transition-all gap-4">
                        <div className="flex items-center gap-4 flex-1">
                          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-slate-100 shadow-sm shrink-0 group-hover:scale-105 transition-transform">
                            <Map className="w-5 h-5 text-slate-400 group-hover:text-slate-900" />
                          </div>
                          
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                              <h3 className="text-xs font-black text-slate-900 uppercase truncate">
                                {t.origin?.name} <span className="text-slate-300 mx-1">→</span> {t.destination?.name}
                              </h3>
                              <span className={`text-[7px] px-1.5 py-0.5 rounded-md font-black uppercase tracking-wider border shadow-sm ${
                                  t.status === 'scheduled' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                  t.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                  'bg-rose-50 text-rose-700 border-rose-100'
                              }`}>{t.status}</span>
                            </div>
                            
                            <div className="flex flex-wrap items-center gap-2">
                              <div className="flex items-center gap-1.5 px-2 py-0.5 bg-white rounded-md border border-slate-200/50">
                                <Clock className="w-2.5 h-2.5 text-slate-400" />
                                <span className="text-[8px] font-black text-slate-600 uppercase">
                                  {new Date(t.departure_time).toLocaleString('fr-CD', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 px-2 py-0.5 bg-white rounded-md border border-slate-200/50">
                                <Users className="w-2.5 h-2.5 text-slate-400" />
                                <span className="text-[8px] font-black text-slate-600 uppercase">
                                  {t.seats_available}/{t.total_seats} PLACES
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-900/5 rounded-md">
                                <Bus className="w-2.5 h-2.5 text-slate-500" />
                                <span className="text-[8px] font-black text-slate-500 uppercase">{t.buses?.name || 'Bus ?'}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between lg:justify-end gap-6 border-t lg:border-0 border-slate-200/60 pt-3 lg:pt-0">
                          <div className="text-left lg:text-right">
                            <p className="text-base font-black text-slate-900 tabular-nums leading-none mb-1">
                              {t.price?.toLocaleString('fr-CD')} <span className="text-[8px] text-slate-500 font-bold">CDF</span>
                            </p>
                            <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Tarif Unitaire</p>
                          </div>
                          
                          <div className="flex items-center gap-1.5">
                            <Button 
                              variant="outline" 
                              size="icon" 
                              onClick={() => { setEditingTrip(t); setIsTripFormOpen(true); }} 
                              className="w-8 h-8 rounded-lg border-slate-200 hover:border-slate-400 hover:bg-white shadow-sm"
                            >
                               <Pencil className="w-3.5 h-4 text-slate-600" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="icon" 
                              onClick={() => handleDeleteTrip(t.id)} 
                              className="w-8 h-8 rounded-lg border-rose-100 hover:border-rose-400 hover:bg-rose-50 text-rose-500 shadow-sm"
                            >
                              <Trash2 className="w-3.5 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* PERSONNEL UNIFIED */}
          {activeTab === 'personnel' && (
            <div className="space-y-4">
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center border border-slate-200">
                        <Users className="w-5 h-5 text-slate-900" />
                    </div>
                    <div>
                        <h2 className="text-base font-black text-slate-900 tracking-tight uppercase leading-none">ÉQUIPE</h2>
                        <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest mt-1 opacity-70">Accès et rôles</p>
                    </div>
                </div>
                
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="flex items-center bg-slate-50 p-0.5 rounded-lg border border-slate-200">
                        {[
                            { id: 'all', label: 'Tous' },
                            { id: 'driver', label: 'Chauffeurs' },
                            { id: 'cashier', label: 'Caisse' },
                            { id: 'chef', label: 'Chefs' },
                            { id: 'agency', label: 'Admins' }
                        ].map(f => (
                            <button
                                key={f.id}
                                onClick={() => setPersonnelFilter(f.id)}
                                className={`px-2.5 py-1 text-[8px] font-black uppercase tracking-wider rounded-md transition-all ${
                                    personnelFilter === f.id 
                                    ? 'bg-slate-900 text-white shadow-sm' 
                                    : 'text-slate-500 hover:text-slate-900'
                                }`}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>
                        <Button 
                        variant="premium"
                        size="compact"
                        onClick={() => { setEditingStaff(null); setIsStaffFormOpen(true); }}
                    >
                        <Plus className="w-3.5 h-3.5 text-kongo-lime" /> Recruter
                    </Button>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 text-[8px] font-black text-slate-500 uppercase tracking-widest bg-slate-50/50">
                        <th className="px-6 py-3">Membre</th>
                        <th className="px-4 py-3">Rôle</th>
                        <th className="px-4 py-3">Affectation / Site</th>
                        <th className="px-6 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {(staffMembers || [])
                        .filter(s => personnelFilter === 'all' || s.role === personnelFilter)
                        .map((staff) => (
                          <tr key={staff.id} className="group hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-2.5">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-900 font-bold text-[10px] overflow-hidden shrink-0 shadow-sm group-hover:border-slate-300 transition-all">
                                  {staff.avatar_url ? (
                                    <img 
                                      src={staff.avatar_url} 
                                      alt={staff.full_name} 
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        (e.target as any).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(staff.full_name)}&background=f1f5f9&color=0f172a&bold=true`;
                                      }}
                                    />
                                  ) : (
                                    staff.full_name?.charAt(0) || 'U'
                                  )}
                                </div>
                                <div className="max-w-[200px]">
                                  <p className="font-black text-xs text-slate-900 transition-colors">{staff.full_name}</p>
                                  <p className="text-[8px] text-slate-400 font-bold uppercase truncate tracking-wider">{staff.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-2.5">
                              <span className={`text-[7px] uppercase font-black px-1.5 py-0.5 rounded-md tracking-wider border ${
                                  staff.role === 'driver' ? 'bg-purple-50 text-purple-700 border-purple-100' : 
                                  staff.role === 'cashier' ? 'bg-blue-50 text-blue-700 border-blue-100' : 
                                  staff.role === 'chef' ? 'bg-amber-50 text-amber-700 border-amber-100' : 
                                  staff.role === 'agency' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' : 'bg-slate-50 text-slate-600 border-slate-100'
                              }`}>
                                {staff.role === 'driver' ? 'Chauffeur' : 
                                 staff.role === 'cashier' ? 'Vendeur' : 
                                 staff.role === 'chef' ? 'Chef' : 
                                 staff.role === 'agency' ? 'Admin' : staff.role}
                              </span>
                            </td>
                            <td className="px-4 py-2.5">
                              {staff.role === 'driver' ? (
                                <div className="flex items-center gap-2">
                                  <div className="flex items-center bg-white px-2 py-0.5 rounded-md border border-slate-100 group/bus cursor-help" title={staff.buses?.plate_number}>
                                    <Bus className="w-2.5 h-2.5 mr-1.5 text-slate-400" />
                                    <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">{staff.buses?.name || 'NON AFFECTÉ'}</span>
                                  </div>
                                  <button 
                                    onClick={() => setAssignModal({ open: true, driver: { ...staff, id: staff.driver_id } })}
                                    className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-900 transition-all border border-transparent"
                                  >
                                    <RefreshCw className="w-2.5 h-2.5" />
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1.5 text-[8px] text-slate-500 font-bold uppercase tracking-widest">
                                  <Building className="w-2.5 h-2.5 opacity-30" />
                                  <span>{staff.agency_sites?.[0]?.name || "Non affecté"}</span>
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-2.5 text-right">
                              <div className="flex justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-all">
                                 <Button 
                                     variant="outline" 
                                     size="icon"
                                     onClick={() => { setEditingStaff(staff); setIsStaffFormOpen(true); }} 
                                     className="w-7 h-7 rounded-lg border-slate-200 hover:border-slate-400 transition-all"
                                 >
                                   <Pencil className="w-3 h-3 text-slate-600" />
                                 </Button>
                                 <Button 
                                     variant="outline" 
                                     size="icon"
                                     onClick={() => deleteStaff(staff.id, staff.role || '')} 
                                     className="w-7 h-7 rounded-lg border-rose-100 hover:border-rose-400 hover:bg-rose-50 text-rose-500 transition-all"
                                 >
                                    <Trash2 className="w-3 h-3" />
                                 </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      
                      {staffMembers.filter(s => personnelFilter === 'all' || s.role === personnelFilter).length === 0 && (
                        <tr>
                          <td colSpan={4} className="py-24 text-center">
                            <Users className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                            <h3 className="text-lg font-black text-slate-900 uppercase">Aucun membre</h3>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-2 px-4">Recrutez pour gérer votre équipe.</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* BOOKINGS */}
          {activeTab === 'bookings' && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-5 overflow-hidden">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center border border-slate-200">
                        <Ticket className="w-5 h-5 text-slate-900" />
                    </div>
                    <div>
                        <h2 className="text-base text-slate-900 font-black tracking-tight uppercase leading-none">RÉSERVATIONS</h2>
                        <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest mt-1 opacity-70">Historique des ventes</p>
                    </div>
                </div>
                <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-md font-black text-[7px] uppercase tracking-widest flex items-center gap-1.5 shadow-sm">
                    <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" /> LIVE
                </span>
              </div>
              <div className="space-y-2">
                {bookings.length === 0 ? (
                  <div className="py-16 text-center text-slate-400 border border-slate-200 border-dashed rounded-xl">
                      <Ticket className="w-8 h-8 opacity-20 mx-auto mb-3" />
                      <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Aucune réservation trouvée</p>
                  </div>
                ) : bookings.map(b => (
                  <div key={b.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-xl hover:bg-white hover:border-slate-300 transition-all group gap-4 shadow-sm border-l-4 border-l-slate-900">
                    <div className="flex items-center gap-4">
                      <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-[10px] font-black text-slate-900 shadow-sm group-hover:scale-105 transition-transform shrink-0">
                        {b.booking_code?.slice(0, 3)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-black text-slate-900 tracking-tight">{b.booking_code}</p>
                            <span className={`text-[7px] px-1.5 py-0.5 rounded-md font-black uppercase tracking-wider border ${
                                b.status === 'confirmed' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                b.status === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                'bg-rose-50 text-rose-700 border-rose-100'
                            }`}>{b.status}</span>
                        </div>
                        <p className="text-[9px] text-slate-500 font-bold uppercase tracking-tight opacity-70">{b.profiles?.full_name || 'Client'} • {getTimeAgo(b.created_at)}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end border-t sm:border-t-0 border-slate-200 pt-4 sm:pt-0 gap-6">
                      <div className="text-left sm:text-right">
                        <p className="text-xl font-black text-slate-900 tracking-tight tabular-nums leading-none mb-1">{b.total_price?.toLocaleString()} <span className="text-[10px] text-slate-500 font-bold">CDF</span></p>
                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Montant réglé</p>
                      </div>
                      <Button 
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          setSelectedBooking(b);
                          setIsDetailOpen(true);
                        }}
                        className="w-10 h-10 rounded-lg group-hover:border-slate-300 active:scale-95 group-hover:scale-105"
                      >
                        <Eye className="w-5 h-5" />
                      </Button>
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
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-5 overflow-hidden">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center border border-slate-200">
                        <MapPin className="w-5 h-5 text-slate-900" />
                    </div>
                    <div>
                        <h2 className="text-base text-slate-900 font-black tracking-tight uppercase leading-none">ARRÊTS</h2>
                        <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest mt-1 opacity-70">Points de ramassage configurés</p>
                    </div>
                </div>
                <Button 
                   variant="premium"
                   size="compact"
                   onClick={() => { setEditingStop(null); setIsStopFormOpen(true); }} 
                >
                  <Plus className="w-3.5 h-3.5 text-kongo-lime" /> Nouvel Arrêt
                </Button>
              </div>
              <div className="space-y-2">
                {stops.length === 0 ? (
                  <div className="py-16 text-center text-slate-400 border border-slate-200 border-dashed rounded-xl">
                      <MapPin className="w-8 h-8 opacity-20 mx-auto mb-3" />
                      <p className="text-[11px] font-bold uppercase tracking-widest">Aucun arrêt configuré</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {stops.map(s => (
                      <div key={s.id} className="group bg-white border border-slate-100 rounded-xl p-3 hover:border-slate-300 transition-all flex items-center gap-4 shadow-sm">
                        {/* Clean Marker Icon */}
                        <div className="w-10 h-10 shrink-0 flex items-center justify-center bg-slate-50 rounded-lg group-hover:bg-slate-900 group-hover:text-white transition-colors">
                          <MapPin className="w-5 h-5 text-slate-400 group-hover:text-white" />
                        </div>

                        {/* Text Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <h3 className="text-[13px] font-black text-slate-900 uppercase tracking-tight truncate">
                              {s.name}
                            </h3>
                            <div className="w-1 h-1 rounded-full bg-slate-200" />
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              {s.city_name}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                             <div className="flex items-center gap-1">
                               <Compass className="w-3 h-3 text-slate-300" />
                               <span className="text-[10px] text-slate-500 font-medium truncate max-w-[300px]">
                                 {s.address || 'Aucune adresse'}
                               </span>
                             </div>
                          </div>
                        </div>

                        {/* Status + Actions */}
                        <div className="flex items-center gap-4">
                           <div className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 bg-slate-900 rounded-full">
                              <div className="w-1 h-1 rounded-full bg-kongo-lime" />
                              <span className="text-[8px] font-black text-white uppercase tracking-widest">ACTIF</span>
                           </div>

                           <div className="flex items-center gap-1">
                             <Button 
                               variant="ghost" 
                               size="icon" 
                               onClick={() => { setEditingStop(s); setIsStopFormOpen(true); }} 
                               className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-900"
                             >
                               <Pencil className="w-3.5 h-3.5" />
                             </Button>
                             <Button 
                               variant="ghost" 
                               size="icon" 
                               onClick={() => deleteStop(s.id)} 
                               className="w-8 h-8 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-500"
                             >
                               <Trash2 className="w-3.5 h-3.5" />
                             </Button>
                           </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
</div>
            </div>
          )}

          {/* PRICING & REVENUE */}
          {activeTab === 'pricing' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm relative overflow-hidden group hover:border-slate-900/10 transition-all">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-slate-50 blur-3xl -mr-8 -mt-8 group-hover:bg-slate-100 transition-all" />
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center">
                      <TrendingUp className="w-4 h-4 text-slate-900" />
                    </div>
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none">CA Global</p>
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight tabular-nums">
                    {stats.revenue?.toLocaleString()} <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">CDF</span>
                  </h3>
                  <div className="mt-3 flex items-center gap-2 text-[8px] font-black text-slate-900 bg-slate-50 w-fit px-2 py-0.5 rounded-md uppercase tracking-widest border border-slate-200 shadow-sm">
                    <Zap className="w-2.5 h-2.5" />
                    Total cumulé
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm relative overflow-hidden group hover:border-slate-900/10 transition-all">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-slate-50 blur-3xl -mr-8 -mt-8 group-hover:bg-slate-100 transition-all" />
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center">
                      <Ticket className="w-4 h-4 text-slate-900" />
                    </div>
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none">Panier Moyen</p>
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight tabular-nums">
                    {(stats.bookings > 0 ? Math.round(stats.revenue / stats.bookings) : 0).toLocaleString()} <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">CDF</span>
                  </h3>
                  <div className="mt-3 flex items-center gap-2 text-[8px] font-black text-slate-900 bg-slate-50 w-fit px-2 py-0.5 rounded-md uppercase tracking-widest border border-slate-200 shadow-sm">
                    <Users className="w-2.5 h-2.5" />
                    Par Ticket
                  </div>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-5 overflow-hidden">
                  <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-200">
                          <Ticket className="w-5 h-5 text-slate-900" />
                      </div>
                      <div>
                          <h2 className="text-base text-slate-900 font-black tracking-tight uppercase leading-none">RÉDUCTIONS</h2>
                          <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest mt-1 opacity-70">Tarifs préférentiels</p>
                      </div>
                  </div>
                  <Button 
                    variant="premium"
                    size="premium"
                    onClick={() => { setEditingCategory(null); setIsCategoryFormOpen(true); }} 
                  >
                    <Plus className="w-4 h-4 text-kongo-lime" /> Nouvelle Règle
                  </Button>
                </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {categories.length === 0 ? (
                  <div className="col-span-full py-16 text-center text-slate-400 border border-slate-200 border-dashed rounded-xl">
                      <Ticket className="w-10 h-10 opacity-20 mx-auto mb-3" />
                      <p className="text-sm font-medium">Aucune réduction configurée.</p>
                  </div>
                ) : categories.map(c => (
                  <div key={c.id} className="p-6 bg-slate-50 border border-slate-200 rounded-xl flex flex-col items-center justify-center group relative hover:bg-white transition-all overflow-hidden min-h-[180px] shadow-sm">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-white blur-2xl -mr-8 -mt-8 pointer-events-none group-hover:bg-slate-50 transition-all" />
                    <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                      <Button 
                        variant="outline"
                        size="icon"
                        onClick={() => { setEditingCategory(c); setIsCategoryFormOpen(true); }}
                        className="w-8 h-8 rounded-lg border-slate-200 hover:border-slate-400 transition-all"
                        title="Modifier"
                      >
                        <Pencil className="w-3.5 h-3.5 text-slate-600" />
                      </Button>
                      <Button 
                        variant="outline"
                        size="icon"
                        onClick={() => deleteCategory(c.id)}
                        className="w-8 h-8 rounded-lg border-rose-300/60 hover:border-rose-400 hover:bg-rose-50 text-rose-500 transition-all"
                        title="Supprimer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                    <p className="font-black text-xl text-slate-900 mb-2 relative z-10 text-center tracking-tight uppercase leading-none">{c.name}</p>
                    <p className="text-5xl font-black text-slate-900 relative z-10 drop-shadow-sm leading-none py-1">
                       -{c.discount_percentage}%
                    </p>
                    <div className="mt-4 px-3 py-1 bg-white border border-slate-200 rounded-lg relative z-10 shadow-sm">
                        <p className="text-[9px] text-slate-500 uppercase tracking-widest font-black flex items-center gap-1.5">
                            {(c as any).trip_id ? <><MapPin className="w-3 h-3 text-slate-400" /> Spécifique</> : <><MapPin className="w-3 h-3 text-slate-400" /> Global</>}
                        </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* SITES (POINTS DE VENTE) */}
        {activeTab === 'sites' && (
          <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm">
              <div className="flex items-center justify-between mb-8 overflow-hidden">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-200">
                        <Building className="w-6 h-6 text-slate-900" />
                    </div>
                    <div>
                        <h2 className="text-2xl text-slate-900 font-black tracking-tight uppercase leading-none">BUREAUX</h2>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Sites & Points de vente physiques</p>
                    </div>
                </div>
                <Button 
                  variant="premium"
                  size="premium"
                  onClick={() => { setEditingSite(null); setIsSiteFormOpen(true); }} 
                >
                  <Plus className="w-4 h-4 text-kongo-lime" /> Nouveau Bureau
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {sites.length === 0 ? (
                  <div className="col-span-full py-16 text-center bg-slate-50 border border-dashed border-slate-200 rounded-xl">
                      <Building className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                      <p className="text-[11px] font-black uppercase tracking-widest text-slate-500">Aucun bureau enregistré</p>
                  </div>
                ) : sites.map(site => (
                  <div key={site.id} className="group bg-white border border-slate-100 rounded-xl p-4 hover:border-slate-300 hover:shadow-lg transition-all relative flex flex-col overflow-hidden">
                    {/* Abstract Office Wave Decoration */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full -mr-16 -mt-16 opacity-30 group-hover:bg-slate-100 transition-all pointer-events-none" />
                    
                    <div className="flex justify-between items-start mb-4 relative z-10">
                        <div className="flex-1 min-w-0 pr-4">
                           <div className="flex items-center gap-2 mb-1">
                             <div className="px-1.5 py-0.5 bg-slate-900 rounded text-[8px] font-black text-white uppercase tracking-widest">
                               {site.city || 'SIT_'}
                             </div>
                             <span className="text-[9px] font-black text-slate-400 tracking-widest">#{site.id.slice(0, 4).toUpperCase()}</span>
                           </div>
                           <h3 className="text-base font-black text-slate-900 tracking-tight leading-tight uppercase truncate">
                             {site.name}
                           </h3>
                        </div>

                        <div className="flex gap-1">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => { setEditingSite(site); setIsSiteFormOpen(true); }} 
                              className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-900"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={async () => {
                                  if(window.confirm("Supprimer ce site ?")) {
                                      try {
                                          const { error } = await supabase.from('agency_sites').delete().eq('id', site.id);
                                          if(error) throw error;
                                          toast.success("Site supprimé");
                                          fetchData(true);
                                      } catch(e: any) { toast.error(e.message); }
                                  }
                              }} 
                              className="w-8 h-8 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-500"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                        </div>
                    </div>
                    
                    <div className="space-y-2 mb-6 relative z-10">
                        {site.address && (
                          <div className="flex items-start gap-2">
                             <Compass className="w-3.5 h-3.5 text-slate-300 shrink-0 mt-0.5" />
                             <p className="text-[10px] font-medium text-slate-600 uppercase tracking-tight line-clamp-2">
                               {site.address}
                             </p>
                          </div>
                        )}
                        {site.phone && (
                          <div className="flex items-center gap-2">
                             <Phone className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                             <p className="text-[10px] font-bold text-slate-900 tracking-widest">{site.phone}</p>
                          </div>
                        )}
                    </div>

                    <div className="mt-auto pt-3 border-t border-slate-100 flex items-center justify-between relative z-10">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <div className="flex -space-x-1 shrink-0">
                              {staffMembers.filter(s => s.site_id === site.id).length > 0 ? (
                                staffMembers.filter(s => s.site_id === site.id).slice(0, 3).map((sm, i) => (
                                    <div key={i} className="w-5 h-5 rounded-full border border-white bg-slate-900 flex items-center justify-center text-[7px] font-black text-white" title={sm.full_name}>
                                        {sm.full_name?.slice(0, 1).toUpperCase()}
                                    </div>
                                ))
                              ) : (
                                <div className="w-5 h-5 rounded-full border border-slate-200 bg-slate-100 flex items-center justify-center">
                                  <Users className="w-2.5 h-2.5 text-slate-400" />
                                </div>
                              )}
                          </div>
                          <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest whitespace-nowrap overflow-hidden text-ellipsis">
                            {staffMembers.filter(s => s.site_id === site.id).length} Dispatchers
                          </p>
                        </div>
                        
                        <div className="shrink-0 ml-2">
                           <div className="px-1.5 py-0.5 bg-emerald-50 border border-emerald-100 rounded text-[7px] font-black text-emerald-700 uppercase tracking-widest whitespace-nowrap">
                              En ligne
                           </div>
                        </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SIGNALEMENTS CHAUFFEURS */}
          {activeTab === 'reports' && (
            <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm">
              <div className="flex items-center justify-between mb-8 overflow-hidden">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-rose-50 rounded-xl flex items-center justify-center border border-rose-200">
                    <TriangleAlert className="w-6 h-6 text-rose-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl text-slate-900 font-black tracking-tight uppercase leading-none">Signalements</h2>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
                      Incidents rapportés par vos chauffeurs
                    </p>
                  </div>
                </div>
              </div>

              {reports.length === 0 ? (
                <div className="py-16 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50">
                  <TriangleAlert className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500 font-bold">Aucun signalement</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {reports.map((r) => (
                    <div key={r.id} className="group bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 relative overflow-hidden flex flex-col">
                      <div className={`absolute top-0 right-0 w-24 h-24 blur-[40px] opacity-20 -z-10 bg-slate-800`} />
                      
                      <div className="flex items-start justify-between mb-4 relative z-10 w-full">
                        <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                          <TriangleAlert className="w-6 h-6 text-slate-700" />
                        </div>
                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                          r.status === 'pending' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                          r.status === 'in_review' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                          'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}>
                          {r.status === 'pending' ? 'Nouveau' : r.status === 'in_review' ? 'En cours' : 'Résolu'}
                        </span>
                      </div>

                      <div className="relative z-10 space-y-1 mb-4 flex-1">
                        <p className={`font-black uppercase tracking-tighter text-lg leading-none ${
                            r.severity === 'critical' ? 'text-rose-600' : 
                            r.severity === 'high' ? 'text-amber-600' : 'text-slate-900'
                        }`}>
                          {r.category === 'breakdown' ? 'Panne mécanique' : 
                          r.category === 'accident' ? 'Accident' :
                          r.category === 'passenger' ? 'Incident passager' :
                          r.category === 'delay' ? 'Retard important' :
                          r.category === 'theft' ? 'Problème de sécurité' :
                          r.category === 'road' ? 'Route barrée' :
                          r.category === 'fuel' ? 'Manque de carburant' :
                          'Autre problème'}
                        </p>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                          CHAUFFEUR : {r.profiles?.full_name || 'Inconnu'}
                        </p>
                      </div>

                      <div className="space-y-3 relative z-10 w-full bg-slate-50 p-4 rounded-xl border border-slate-100">
                        {r.location && (
                          <div className="flex items-start gap-2">
                            <MapPin className="w-3.5 h-3.5 text-slate-500 mt-0.5 shrink-0" />
                            <p className="text-xs text-slate-600 font-medium">Lieu: {r.location}</p>
                          </div>
                        )}
                        <p className="text-xs text-slate-600 italic line-clamp-3">"{r.description}"</p>
                      </div>
                      
                      <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-[9px] font-black text-slate-400 uppercase tracking-widest relative z-10 w-full">
                          <span>{new Date(r.created_at).toLocaleString('fr-CD')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {/* SERVICES & OPTIONS */}
          {activeTab === 'services' && (
            <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm">
                <div className="flex items-center justify-between mb-8 overflow-hidden">
                  <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-200">
                          <Plus className="w-6 h-6 text-slate-900" />
                      </div>
                      <div>
                          <h2 className="text-2xl text-slate-900 font-black tracking-tight uppercase leading-none">SERVICES & OPTIONS</h2>
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Gérez vos options de voyage et frais de bagages</p>
                      </div>
                  </div>
                  <Button 
                    variant="premium"
                    size="premium"
                    onClick={() => { setEditingExtraService(null); setIsExtraServiceFormOpen(true); }} 
                  >
                    <Plus className="w-4 h-4 text-kongo-lime" /> Nouveau Service
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {extraServices.length === 0 ? (
                    <div className="col-span-full py-20 text-center bg-slate-50 border border-slate-200 border-dashed rounded-xl">
                        <Plus className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                        <p className="text-slate-900 font-black uppercase tracking-tight text-sm">Aucun service configuré.</p>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-2 px-4">Ajoutez des options (assurance, bagages, repas...) pour vos passagers.</p>
                    </div>
                  ) : extraServices.map(service => (
                    <div key={service.id} className={`bg-white border border-slate-200 p-6 rounded-xl shadow-sm hover:shadow-md transition-all group relative overflow-hidden flex flex-col min-h-[160px] ${!service.is_active ? 'opacity-60' : ''}`}>
                      <div className="absolute top-0 right-0 w-24 h-24 bg-slate-50 blur-2xl -mr-8 -mt-8 pointer-events-none group-hover:bg-slate-100 transition-all" />
                      
                      <div className="flex justify-between items-start mb-4 relative z-10">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-xl shadow-sm">
                                {service.category === 'baggage' ? '🧳' : service.category === 'insurance' ? '🛡️' : service.category === 'meal' ? '🍱' : service.category === 'wifi' ? '📶' : '✨'}
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-slate-900 tracking-tight leading-tight pr-4 uppercase">{service.title}</h3>
                                <Badge className="bg-slate-900 text-[8px] uppercase tracking-widest px-2 py-0.5 mt-1 border-none">
                                    {service.category === 'baggage' ? `Poids: ${service.min_weight}-${service.max_weight || '∞'}kg` : service.category}
                                </Badge>
                            </div>
                          </div>
                          <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                              <Button 
                                variant="outline"
                                size="icon"
                                onClick={() => { setEditingExtraService(service); setIsExtraServiceFormOpen(true); }} 
                                className="w-8 h-8 rounded-lg group-hover:border-slate-300"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </Button>
                              <Button 
                                variant="outline"
                                size="icon"
                                onClick={() => handleDeleteExtraService(service.id)} 
                                className="w-8 h-8 rounded-lg border-rose-300/60 hover:border-rose-400 hover:bg-rose-50 text-rose-500 transition-all"
                                title="Supprimer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                          </div>
                      </div>
                      
                      <div className="space-y-3 mt-auto relative z-10">
                          <p className="text-xs text-slate-500 line-clamp-2">{service.description || "Aucune description"}</p>
                          <div className="flex items-center justify-between mt-4">
                            <span className="text-xl font-black text-slate-900 tabular-nums">
                                {service.price.toLocaleString()} <span className="text-[10px] text-slate-400">CDF</span>
                            </span>
                            {!service.is_active && <Badge variant="outline" className="text-[8px] uppercase">Inactif</Badge>}
                          </div>
                      </div>
                    </div>
                  ))}
                </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <AddExtraServiceForm 
        isOpen={isExtraServiceFormOpen} 
        onClose={() => setIsExtraServiceFormOpen(false)} 
        agencyId={agencyId!} 
        initialData={editingExtraService} 
      />

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

          <div className="p-8 flex flex-col gap-6 overflow-hidden flex-1 bg-background selection:bg-kongo-lime/30">
            {/* Barre de recherche */}
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-kongo-lime transition-colors" />
              <input 
                type="text" 
                placeholder="Rechercher par nom ou plaque..." 
                value={busSearchTerm}
                onChange={(e) => setBusSearchTerm(e.target.value)}
                className="w-full pl-12 pr-5 py-4 rounded-2xl border border-slate-200 focus:border-kongo-black outline-none text-xs font-black uppercase tracking-widest transition-all bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:bg-white shadow-inner"
                autoFocus
              />
            </div>

            <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar space-y-4 pb-4">
              <Button 
                variant="destructive"
                size="premium"
                onClick={() => { assignDriverToBus(assignModal.driver!.id, null); setAssignModal({ open: false, driver: null }); }}
                className="w-full h-12 flex items-center justify-center gap-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border-rose-500/20"
              >
                <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center">
                  <UserX className="w-4 h-4" />
                </div>
                Retirer l'affectation actuelle
              </Button>

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
                        onClick={() => {
                          if (isAssignedToOther) return;
                          
                          // "En Voyage" check: active GPS or active trip
                          const busLoc = busLocations.find(l => l.bus_id === b.id);
                          const isActiveGps = busLoc && (Date.now() - new Date(busLoc.updated_at).getTime() < 10 * 60 * 1000) && busLoc.status === 'active';
                          const hasActiveTrip = trips.some(t => t.bus_id === b.id && t.status === 'in_progress');
                          const isEnVoyage = isActiveGps || hasActiveTrip;

                          if (isEnVoyage) {
                            toast.error("Imposible : Ce bus est actuellement en voyage et suivi par GPS.");
                            return;
                          }

                          assignDriverToBus(assignModal.driver!.id, b.id);
                        }}
                        className={`w-full p-5 rounded-2xl border text-left transition-all group relative overflow-hidden active:scale-[0.98] ${
                          isSelected 
                            ? 'border-slate-900 bg-slate-900/5 shadow-xl shadow-slate-200' 
                            : isAssignedToOther 
                              ? 'border-slate-100 bg-slate-50 opacity-40 cursor-not-allowed grayscale' 
                              : 'border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 hover:shadow-2xl'
                        }`}
                        disabled={isAssignedToOther}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-5">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all shadow-2xl relative z-10 ${isSelected ? 'bg-kongo-lime text-kongo-black rotate-3' : 'bg-slate-800 text-slate-500 group-hover:text-white group-hover:scale-110'}`}>
                              <Bus className="w-7 h-7" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className={`font-black uppercase tracking-tighter text-lg leading-none ${isSelected ? 'text-slate-900' : 'text-slate-900'}`}>{b.name}</p>
                                {(() => {
                                  const busLoc = busLocations.find(l => l.bus_id === b.id);
                                  const isActiveGps = busLoc && (Date.now() - new Date(busLoc.updated_at).getTime() < 10 * 60 * 1000) && busLoc.status === 'active';
                                  const hasActiveTrip = trips.some(t => t.bus_id === b.id && t.status === 'in_progress');
                                  if (isActiveGps || hasActiveTrip) {
                                    return <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" title="En voyage (GPS Actif)" />;
                                  }
                                  return null;
                                })()}
                              </div>
                              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-1.5">{b.plate_number} • {b.capacity} PLACES</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3 relative z-10">
                            {isAssignedToOther && (
                               <span className="px-3 py-1 bg-white/5 text-slate-600 border border-white/5 rounded-lg text-[9px] font-black uppercase tracking-widest">Occupé</span>
                            )}
                            {isSelected ? (
                              <div className="w-9 h-9 rounded-2xl bg-kongo-lime text-kongo-black flex items-center justify-center shadow-kongo-lime/40 shadow-2xl scale-110 rotate-6">
                                <Check className="w-5 h-5 font-black" />
                              </div>
                            ) : !isAssignedToOther && (
                                <ChevronRight className="w-6 h-6 text-white/10 group-hover:text-kongo-lime transition-all group-hover:translate-x-1" />
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
          
          <DialogFooter className="p-6 bg-slate-50 border-t border-slate-100 shrink-0">
            <Button 
                onClick={() => { setAssignModal({ open: false, driver: null }); setBusSearchTerm(''); }}
                variant="outline" 
                size="premium"
                className="w-full active:scale-95"
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
