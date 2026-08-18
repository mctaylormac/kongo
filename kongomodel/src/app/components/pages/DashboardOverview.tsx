import React, { useState, useEffect } from "react";
import { 
  DollarSign, 
  Calendar, 
  Bus, 
  TrendingUp, 
  MapPin, 
  Users, 
  Activity, 
  Plus, 
  Building2, 
  Loader2, 
  Eye, 
  ChevronRight,
  User as UserIcon,
  AlertCircle,
  Ticket,
  Search
} from "../../../lib/icons";
import { StatCard } from "../ui/StatCard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/Card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog";
import { motion } from "motion/react";
import { useNavigate } from "react-router";
import { supabase } from "../../../lib/supabase";
import { useAppState } from "../../../hooks/useAppState";
import { toast } from "sonner";
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from "recharts";

// Real-time performance chart data processed from bookings
const fallbackRevenueData = [
  { day: "Lun", revenue: 0 },
  { day: "Mar", revenue: 0 },
  { day: "Mer", revenue: 0 },
  { day: "Jeu", revenue: 0 },
  { day: "Ven", revenue: 0 },
  { day: "Sam", revenue: 0 },
  { day: "Dim", revenue: 0 },
];

export function DashboardOverview() {
  const { userRole, agencyId, isLoading: isAppStateLoading } = useAppState();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [counts, setCounts] = useState({
    buses: 0,
    trips: 0,
    bookings: 0,
    clients: 0,
    agencies: 0,
    occupancyRate: 0,
    totalRevenue: 0,
  });
  const [recentBookings, setRecentBookings] = useState<any[]>([]);
  const [recentReports, setRecentReports] = useState<any[]>([]);
  const [performanceData, setPerformanceData] = useState<any[]>([]);
  const [topRoutes, setTopRoutes] = useState<any[]>([]);
  const [isAutoRefresh, setIsAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [agenciesStats, setAgenciesStats] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBooking, setSelectedBooking] = useState<any | null>(null);
  const [isBookingDetailOpen, setIsBookingDetailOpen] = useState(false);
  const [selectedAgency, setSelectedAgency] = useState<any | null>(null);
  const [isAgencyDetailOpen, setIsAgencyDetailOpen] = useState(false);
  const [agencyPerformance, setAgencyPerformance] = useState<any>(null);
  const [agencyRevenueTrend, setAgencyRevenueTrend] = useState<any[]>([]);
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch counts
      let busQuery = supabase.from('buses').select('*', { count: 'exact', head: true });
      let tripQuery = supabase.from('trips').select('*', { count: 'exact', head: true });
      let bookingQuery = supabase.from('bookings').select('id', { count: 'exact', head: true });
      let clientQuery = supabase.from('profiles').select('*', { count: 'exact', head: true }).in('role', ['user', 'client']);
      let agencyQuery = supabase.from('agencies').select('*', { count: 'exact', head: true });
      let occupancyQuery = supabase.from('trips').select('total_seats, seats_available');
      
      let recentBookingsQuery = supabase
        .from('bookings')
        .select(`
          *,
          profiles!bookings_user_id_profiles_fkey(full_name, phone_number),
          trips(
            *,
            origin:locations!origin_location_id(name), 
            destination:locations!destination_location_id(name),
            agencies(name)
          )
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      let recentReportsQuery = supabase
        .from('driver_reports')
        .select(`
          *,
          profiles!driver_reports_driver_id_fkey(full_name)
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      // Revenue query for the last 7 days
      let revenueQuery: any = supabase
        .from('bookings')
        .select('total_price, created_at')
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: true });

      if (userRole === 'superuser') {
        // Fetch agency stats for superuser
        const { data: ags } = await supabase
          .from('agencies')
          .select(`
            id,
            name,
            status,
            buses(count),
            trips(count)
          `);
        setAgenciesStats(ags || []);
      }

      if (userRole !== 'superuser') {
        if (!agencyId) {
          setCounts({ buses: 0, trips: 0, bookings: 0, clients: 0, agencies: 0, occupancyRate: 0, totalRevenue: 0 });
          setRecentBookings([]);
          setIsLoading(false);
          return;
        }
        busQuery = busQuery.eq('agency_id', agencyId);
        tripQuery = tripQuery.eq('agency_id', agencyId);
        bookingQuery = supabase.from('bookings').select('*, trips!inner(agency_id)', { count: 'exact', head: true }).eq('trips.agency_id', agencyId);
        recentBookingsQuery = supabase
          .from('bookings')
          .select(`
            *,
            profiles!bookings_user_id_profiles_fkey(full_name, phone_number),
            trips!inner(
              *,
              origin:locations!origin_location_id(name), 
              destination:locations!destination_location_id(name),
              agencies(name)
            )
          `)
          .order('created_at', { ascending: false })
          .limit(5);

        recentReportsQuery = supabase
          .from('driver_reports')
          .select(`
            *,
            profiles!driver_reports_driver_id_fkey(full_name)
          `)
          .eq('agency_id', agencyId)
          .order('created_at', { ascending: false })
          .limit(5);

        revenueQuery = (supabase
          .from('bookings')
          .select('total_price, created_at, trips!inner(agency_id)')
          .eq('trips.agency_id', agencyId)
          .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
          .order('created_at', { ascending: true }) as any);

        occupancyQuery = occupancyQuery.eq('agency_id', agencyId);
      }

      // Fetch top routes (trips with most bookings)
      let topRoutesQuery = supabase
        .from('trips')
        .select(`
          id,
          origin:locations!origin_location_id(name),
          destination:locations!destination_location_id(name),
          bookings(count)
        `)
        .limit(20);

      if (userRole !== 'superuser' && agencyId) {
        topRoutesQuery = topRoutesQuery.eq('agency_id', agencyId);
      }

      const results = await Promise.all([
        busQuery,
        tripQuery,
        bookingQuery,
        clientQuery,
        agencyQuery,
        occupancyQuery,
        revenueQuery,
        topRoutesQuery
      ]);

      const [
        { count: busCount },
        { count: tripCount },
        { count: bookingCount },
        { count: clientCount },
        { count: agencyCount },
        { data: tripsData },
        { data: revenueRawData },
        { data: topRoutesData }
      ] = results as any[];

      let totalSeats = 0;
      let totalOccupied = 0;
      if (tripsData) {
        tripsData.forEach(t => {
          const cap = t.total_seats || 0;
          const avail = t.seats_available || 0;
          totalSeats += cap;
          totalOccupied += (cap - avail);
        });
      }

      setCounts({
        buses: busCount || 0,
        trips: tripCount || 0,
        bookings: bookingCount || 0,
        clients: clientCount || 0,
        agencies: agencyCount || 0,
        occupancyRate: totalSeats > 0 ? (totalOccupied / totalSeats) * 100 : 0,
        totalRevenue: revenueRawData?.reduce((acc, curr) => acc + (curr.total_price || 0), 0) || 0
      });

      // 2. Fetch recent bookings and reports
      const [{ data: bks }, { data: reports }] = await Promise.all([
        recentBookingsQuery,
        recentReportsQuery
      ]);

      setRecentBookings(bks || []);
      setRecentReports(reports || []);

      // 3. Process revenue data
      if (revenueRawData) {
        const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
        const last7Days = Array.from({ length: 7 }, (_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - (6 - i));
          return {
            fullDate: d.toISOString().split('T')[0],
            day: days[d.getDay()],
            revenue: 0
          };
        });

        revenueRawData.forEach(rev => {
          const date = rev.created_at.split('T')[0];
          const dayObj = last7Days.find(d => d.fullDate === date);
          if (dayObj) {
            dayObj.revenue += rev.total_price || 0;
          }
        });

        setPerformanceData(last7Days.map(({ day, revenue }) => ({ day, revenue })));
      }

      // 4. Process top routes (aggregate by route name)
      if (topRoutesData) {
        const routeAggregates: Record<string, number> = {};
        
        topRoutesData.forEach((r: any) => {
          const routeName = `${r.origin?.name} → ${r.destination?.name}`;
          const count = r.bookings?.[0]?.count || 0;
          routeAggregates[routeName] = (routeAggregates[routeName] || 0) + count;
        });

        const sortedRoutes = Object.entries(routeAggregates)
          .map(([name, bookings]) => ({ name, bookings }))
          .sort((a, b) => b.bookings - a.bookings)
          .slice(0, 4);

        setTopRoutes(sortedRoutes);
      }
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Dashboard data fetch error:", error);
      toast.error("Erreur lors du chargement des données");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isAppStateLoading && userRole !== 'guest') {
      fetchDashboardData();
    }
  }, [userRole, agencyId, isAppStateLoading]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isAutoRefresh && !isAppStateLoading && userRole !== 'guest') {
      interval = setInterval(() => {
        fetchDashboardData();
      }, 60000); // Refresh every minute
    }
    return () => clearInterval(interval);
  }, [isAutoRefresh, userRole, agencyId, isAppStateLoading]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-CD', { 
      style: 'currency', 
      currency: 'CDF', 
      maximumFractionDigits: 0 
    }).format(price);
  };

  const getTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `Il y a ${mins} min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `Il y a ${hours}h`;
    return new Date(dateStr).toLocaleDateString();
  };

  const getBookingStatusMeta = (booking: any) => {
    const status = booking?.status || "pending";
    if (status === "confirmed" || booking?.payment_status === "paid" || booking?.payment_status === "completed") {
      return { label: "Confirmé", className: "bg-[#34C759]/10 text-[#34C759]" };
    }
    if (status === "cancelled") {
      return { label: "Annulé", className: "bg-[#FF3B30]/10 text-[#FF3B30]" };
    }
    if (status === "completed") {
      return { label: "Utilisé", className: "bg-[#007AFF]/10 text-[#007AFF]" };
    }
    return { label: "En attente", className: "bg-amber-100 text-amber-700" };
  };

  const stats = [
    { label: 'Agences', value: counts.agencies.toString(), icon: Building2, color: '#FF9500', role: 'superuser' },
    { label: 'Total Bus', value: counts.buses.toString(), icon: Bus, color: '#5CB338', role: 'all' },
    { label: 'Voyages Actifs', value: counts.trips.toString(), icon: MapPin, color: '#007AFF', role: 'all' },
    { label: 'Tickets Vendus', value: counts.bookings.toString(), icon: Ticket, color: '#34C759', role: 'all' },
    { label: 'Occupation', value: `${counts.occupancyRate.toFixed(1)}%`, icon: TrendingUp, color: '#AF52DE', role: 'all', subValue: "Moyenne flotte" },
    { label: 'CA (7j)', value: formatPrice(counts.totalRevenue), icon: DollarSign, color: '#FF2D55', role: 'all', change: "+12.5%", changeType: "positive" },
    { label: 'Clients', value: counts.clients.toString(), icon: Users, color: '#6366f1', role: 'superuser' },
  ];

  const filteredBookings = recentBookings.filter(b => 
    b.booking_reference?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.profiles?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.trips?.origin?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.trips?.destination?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Logic pour les actions rapides (Quick Actions)
  const renderQuickActions = () => {
    if (userRole === 'driver') return null;

    return (
      <div className="flex flex-wrap gap-3">
        {userRole === 'superuser' && (
          <button 
            onClick={() => navigate('/agencies')}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-black/5 rounded-xl hover:bg-black/5 transition-all text-[14px] font-medium"
          >
            <Plus className="w-4 h-4" /> Agence
          </button>
        )}
      </div>
    );
  };

  const handleViewAgencyDetails = async (agency: any) => {
    setSelectedAgency(agency);
    setIsAgencyDetailOpen(true);
    setIsDetailLoading(true);
    try {
      // Fetch deeper stats for this specific agency
      const results = await Promise.all([
        supabase
          .from('bookings')
          .select('total_price, created_at, trips!inner(agency_id)')
          .eq('trips.agency_id', agency.id)
          .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
        supabase
          .from('trips')
          .select('id, origin:locations!origin_location_id(name), destination:locations!destination_location_id(name), bookings(count)')
          .eq('agency_id', agency.id)
          .limit(5),
        supabase
          .from('profiles')
          .select('id', { count: 'exact', head: true })
          .eq('agency_id', agency.id)
          .eq('role', 'driver')
      ]);

      const agencyRevenue = results[0].data;
      const agencyTopRoutesRaw = results[1].data;
      const driverCount = results[2].count;

      // Process 30-day revenue trend
      const last30Days = Array.from({ length: 30 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (29 - i));
        return {
          date: d.toISOString().split('T')[0],
          revenue: 0
        };
      });

      if (agencyRevenue) {
        agencyRevenue.forEach(rev => {
          const date = rev.created_at.split('T')[0];
          const dayObj = last30Days.find(d => d.date === date);
          if (dayObj) {
            dayObj.revenue += rev.total_price || 0;
          }
        });
      }
      setAgencyRevenueTrend(last30Days);

      const totalRev = agencyRevenue?.reduce((acc, curr) => acc + (curr.total_price || 0), 0) || 0;
      
      // Aggregate agency top routes
      const routeAggregates: Record<string, number> = {};
      (agencyTopRoutesRaw || []).forEach((r: any) => {
        const routeName = `${r.origin?.name} → ${r.destination?.name}`;
        const count = r.bookings?.[0]?.count || 0;
        routeAggregates[routeName] = (routeAggregates[routeName] || 0) + count;
      });

      const sortedRoutes = Object.entries(routeAggregates)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);

      setAgencyPerformance({
        revenue30d: totalRev,
        topRoutes: sortedRoutes,
        drivers: driverCount || 0
      });
    } catch (error) {
      console.error("Error fetching agency details:", error);
      toast.error("Impossible de charger les détails de l'agence");
    } finally {
      setIsDetailLoading(false);
    }
  };

  // UI Spécifique pour Chauffeur
  if (userRole === 'driver') {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-8">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-32 h-32 bg-[#5CB338] rounded-[2.5rem] flex items-center justify-center shadow-2xl rotate-6"
        >
          <Ticket className="w-16 h-16 text-white" />
        </motion.div>
        <div className="space-y-2">
          <h1 className="text-[32px] font-bold text-[#1D1D1F] tracking-tight">Scanner Billet</h1>
          <p className="text-[#86868B]">Vérifiez instantanément la validité des titres de transport.</p>
        </div>
        <button className="w-full max-w-md h-20 bg-[#1D1D1F] text-white rounded-2xl text-xl font-bold flex items-center justify-center gap-4 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl">
          <Plus className="w-8 h-8" /> Scanner maintenant
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Header section with Role awareness */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-[32px] font-bold text-[#1D1D1F] tracking-tight">
            {userRole === 'superuser' ? "Administration Globale" : (userRole === 'agency' ? "Dashboard Agence" : "Tableau de Bord")}
          </h1>
          <p className="text-[15px] text-[#86868B] mt-1">
            {userRole === 'superuser' ? "Contrôle global de la flotte et des agences." : "Bienvenue ! Voici ce qui se passe aujourd'hui."}
            <span className="ml-2 text-[12px] opacity-60">
              Dernière mise à jour : {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative hidden xl:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#86868B]" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher ticket, passager..." 
              className="pl-10 pr-4 py-2 bg-black/5 border border-transparent focus:border-black/10 focus:bg-white rounded-xl text-[14px] w-64 transition-all outline-none"
            />
          </div>
          <div className="flex items-center gap-2 bg-black/5 px-3 py-1.5 rounded-lg border border-black/5">
            <span className="text-[12px] font-medium text-[#86868B]">Auto-actualisation</span>
            <button 
              onClick={() => setIsAutoRefresh(!isAutoRefresh)}
              className={`w-8 h-4 rounded-full transition-all relative ${isAutoRefresh ? 'bg-[#34C759]' : 'bg-black/20'}`}
            >
              <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${isAutoRefresh ? 'left-4.5' : 'left-0.5'}`} />
            </button>
          </div>
          <button 
            onClick={() => fetchDashboardData()}
            disabled={isLoading}
            className="p-2 hover:bg-black/5 rounded-lg transition-all disabled:opacity-50"
            title="Actualiser les données"
          >
            <Activity className={`w-5 h-5 text-[#1D1D1F] ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          {renderQuickActions()}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        {stats
          .filter(s => s.role === 'all' || s.role === userRole || (userRole === 'superuser'))
          .map((stat, idx) => (
            <StatCard
              key={idx}
              index={idx}
              title={stat.label}
              value={isLoading ? "..." : stat.value}
              subValue={stat.subValue}
              change={stat.change}
              changeType={stat.changeType as any}
              icon={stat.icon}
              iconColor={stat.color}
            />
          ))}
      </div>

      {/* Superuser specific section: Partners performance */}
      {userRole === 'superuser' && (
        <Card className="border-black/5 shadow-sm">
          <CardHeader>
            <CardTitle>Performance des Partenaires</CardTitle>
            <CardDescription>Vue d'ensemble de l'activité par agence</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-black/[0.02] border-y border-black/5">
                  <tr>
                    <th className="px-6 py-4 text-[12px] font-black text-[#1D1D1F] uppercase tracking-widest">Agence</th>
                    <th className="px-6 py-4 text-[12px] font-black text-[#1D1D1F] uppercase tracking-widest">Statut</th>
                    <th className="px-6 py-4 text-[12px] font-black text-[#1D1D1F] uppercase tracking-widest text-center">Buses</th>
                    <th className="px-6 py-4 text-[12px] font-black text-[#1D1D1F] uppercase tracking-widest text-center">Voyages</th>
                    <th className="px-6 py-4 text-[12px] font-black text-[#1D1D1F] uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                  {isLoading ? (
                    <tr><td colSpan={5} className="p-10 text-center"><Loader2 className="animate-spin mx-auto text-black/10" /></td></tr>
                  ) : agenciesStats.map(agency => (
                    <tr key={agency.id} className="hover:bg-black/[0.01] transition-colors">
                      <td className="px-6 py-4">
                        <span className="text-[15px] font-bold text-[#1D1D1F]">{agency.name}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-lg text-[11px] font-black uppercase ${
                          agency.status === 'active' ? 'bg-[#34C759]/10 text-[#34C759]' : 'bg-red-50 text-red-500'
                        }`}>
                          {agency.status === 'active' ? 'Actif' : 'Suspendu'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center text-[14px] font-semibold text-[#1D1D1F]">
                        {agency.buses?.[0]?.count || 0}
                      </td>
                      <td className="px-6 py-4 text-center text-[14px] font-semibold text-[#1D1D1F]">
                        {agency.trips?.[0]?.count || 0}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => handleViewAgencyDetails(agency)}
                          className="text-[13px] font-bold text-[#007AFF] hover:underline flex items-center gap-1 ml-auto"
                        >
                          Détails <ChevronRight className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main content row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity / Bookings */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Activités Récentes</CardTitle>
              <CardDescription>Flux des dernières réservations</CardDescription>
            </div>
            <button className="text-[13px] font-semibold text-[#5CB338] hover:underline">Voir tout</button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-black/5">
              {isLoading ? (
                <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-[#5CB338] w-10 h-10" /></div>
              ) : filteredBookings.length > 0 ? (
                filteredBookings.map((booking) => (
                  <div key={booking.id} className="px-6 py-4 hover:bg-black/5 transition-colors group flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-white border border-black/5 flex items-center justify-center text-[#1D1D1F] text-xs font-bold shadow-sm">
                        {booking.profiles?.full_name?.slice(0, 2).toUpperCase() || 'KG'}
                      </div>
                      <div>
                        <p className="text-[15px] font-semibold text-[#1D1D1F]">
                          Ticket #{booking.booking_reference}
                          {userRole === 'superuser' && (
                            <span className="ml-2 text-[11px] font-black text-[#5CB338] bg-[#5CB338]/10 px-1.5 py-0.5 rounded uppercase">
                              {booking.trips?.agencies?.name}
                            </span>
                          )}
                        </p>
                        <p className="text-[13px] text-[#86868B] flex items-center gap-1">
                          {booking.trips?.origin?.name} <ChevronRight className="w-3 h-3" /> {booking.trips?.destination?.name} • {getTimeAgo(booking.created_at)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <span className="text-[15px] font-bold text-[#1D1D1F]">{formatPrice(booking.total_price)}</span>
                      <button
                        onClick={() => {
                          setSelectedBooking(booking);
                          setIsBookingDetailOpen(true);
                        }}
                        className="w-10 h-10 flex items-center justify-center hover:bg-white rounded-lg border border-transparent hover:border-black/5 transition-all"
                        title="Voir détails du ticket"
                      >
                        <Eye className="w-4 h-4 text-[#86868B]" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-20 text-center text-[#86868B] italic">
                  {searchQuery ? "Aucun résultat pour votre recherche." : "Aucune activité récente."}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Right column: Alerts & Progress */}
        <div className="space-y-8">
          {userRole !== 'cashier' && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle>Signalements Récents</CardTitle>
                <CardDescription>Alertes envoyées par les chauffeurs</CardDescription>
              </div>
              <Activity className="w-5 h-5 text-[#5CB338]/20" />
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? (
                <div className="py-10 flex justify-center"><Loader2 className="animate-spin text-black/10" /></div>
              ) : recentReports.length > 0 ? (
                recentReports.map((report) => (
                  <div key={report.id} className={`flex gap-4 p-4 rounded-2xl border transition-all hover:scale-[1.01] ${
                    report.severity === 'critical' ? 'bg-red-50 border-red-100' : 
                    report.severity === 'high' ? 'bg-orange-50 border-orange-100' :
                    'bg-amber-50 border-amber-100'
                  }`}>
                    <AlertCircle className={`w-5 h-5 shrink-0 ${
                      report.severity === 'critical' ? 'text-red-600' : 
                      report.severity === 'high' ? 'text-orange-600' :
                      'text-amber-600'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className={`text-[13px] font-bold uppercase tracking-wide truncate ${
                          report.severity === 'critical' ? 'text-red-900' : 
                          report.severity === 'high' ? 'text-orange-900' :
                          'text-amber-900'
                        }`}>
                          {report.category || "Signalement"}
                        </p>
                        <span className="text-[10px] text-[#86868B] whitespace-nowrap">
                          {getTimeAgo(report.created_at)}
                        </span>
                      </div>
                      <p className={`text-[12px] mt-0.5 line-clamp-2 ${
                        report.severity === 'critical' ? 'text-red-700' : 
                        report.severity === 'high' ? 'text-orange-700' :
                        'text-amber-700'
                      }`}>
                        {report.description}
                      </p>
                      <p className="text-[11px] text-black/40 mt-1 font-medium">
                        Par: {report.profiles?.full_name || "Chauffeur inconnu"}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-10 text-center text-[#86868B] text-[13px] italic border-2 border-dashed border-black/5 rounded-2xl">
                  Aucun signalement récent.
                </div>
              )}
              
              <button
                onClick={() => navigate('/incidents')}
                className="w-full py-3 bg-white border border-black/5 rounded-xl text-[13px] font-semibold text-[#1D1D1F] hover:bg-black/5 transition-all mt-2"
              >
                Voir tous les signalements
              </button>
            </CardContent>
          </Card>
          )}

          {/* Top Routes section */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-[16px]">Destinations Phares</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? (
                <div className="py-10 flex justify-center"><Loader2 className="animate-spin text-black/10" /></div>
              ) : topRoutes.length > 0 ? (
                topRoutes.map((route, i) => (
                  <div key={i} className="space-y-1.5">
                    <div className="flex justify-between text-[13px]">
                      <span className="font-semibold text-[#1D1D1F]">{route.name}</span>
                      <span className="text-[#86868B]">{route.bookings} ventes</span>
                    </div>
                    <div className="h-1.5 w-full bg-black/5 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, (route.bookings / (topRoutes[0]?.bookings || 1)) * 100)}%` }}
                        transition={{ duration: 1, ease: "easeOut", delay: 0.5 + i * 0.1 }}
                        className="h-full bg-[#007AFF]"
                      />
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-6 text-center text-[#86868B] text-[12px] italic">Données insuffisantes.</div>
              )}
            </CardContent>
          </Card>

          {/* Performance chart for current role */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-[16px]">Performance Hebdomadaire</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[180px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={performanceData.length > 0 ? performanceData : fallbackRevenueData}>
                    <defs>
                      <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#5CB338" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#5CB338" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#00000005" vertical={false} />
                    <Tooltip 
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-white/95 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-black/5">
                              <p className="text-[11px] font-bold text-[#86868B] uppercase tracking-wider mb-1">{label}</p>
                              <p className="text-[16px] font-black text-[#1D1D1F]">
                                {formatPrice(payload[0].value as number)}
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="#5CB338"
                      strokeWidth={3}
                      fill="url(#revenueGradient)"
                      activeDot={{ r: 6, fill: "#5CB338", stroke: "white", strokeWidth: 2 }}
                      animationDuration={1500}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={isBookingDetailOpen} onOpenChange={setIsBookingDetailOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Détail du Ticket</DialogTitle>
            <DialogDescription>
              Réf: {selectedBooking?.booking_code || selectedBooking?.booking_reference || selectedBooking?.id}
            </DialogDescription>
          </DialogHeader>

          {selectedBooking && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <span className={`px-2.5 py-1 rounded-full text-[12px] font-semibold ${getBookingStatusMeta(selectedBooking).className}`}>
                  {getBookingStatusMeta(selectedBooking).label}
                </span>
                <span className="text-[13px] text-[#86868B]">
                  {new Date(selectedBooking.created_at).toLocaleDateString()} à {new Date(selectedBooking.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-black/[0.02] border border-black/5">
                  <p className="text-[11px] uppercase tracking-widest text-[#86868B] font-bold">Client</p>
                  <p className="text-[15px] font-semibold text-[#1D1D1F] mt-1">{selectedBooking.profiles?.full_name || "Client inconnu"}</p>
                  <p className="text-[13px] text-[#86868B] mt-1">{selectedBooking.profiles?.phone_number || "Téléphone non disponible"}</p>
                </div>

                <div className="p-4 rounded-xl bg-black/[0.02] border border-black/5">
                  <p className="text-[11px] uppercase tracking-widest text-[#86868B] font-bold">Paiement</p>
                  <p className="text-[15px] font-semibold text-[#1D1D1F] mt-1">{formatPrice(selectedBooking.total_price || 0)}</p>
                  <p className="text-[13px] text-[#86868B] mt-1">Statut paiement: {selectedBooking.payment_status || "pending"}</p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-white border border-black/5">
                <p className="text-[11px] uppercase tracking-widest text-[#86868B] font-bold mb-2">Trajet</p>
                <p className="text-[15px] font-semibold text-[#1D1D1F]">
                  {selectedBooking.trips?.origin?.name || "Départ"} <ChevronRight className="w-4 h-4 inline" /> {selectedBooking.trips?.destination?.name || "Arrivée"}
                </p>
                <p className="text-[13px] text-[#86868B] mt-1">
                  Départ: {selectedBooking.trips?.departure_time ? new Date(selectedBooking.trips.departure_time).toLocaleString() : "N/A"}
                </p>
                {selectedBooking.trips?.agencies?.name && (
                  <p className="text-[12px] text-[#5CB338] font-semibold mt-1">{selectedBooking.trips.agencies.name}</p>
                )}
              </div>

              <div className="p-4 rounded-xl bg-white border border-black/5">
                <p className="text-[11px] uppercase tracking-widest text-[#86868B] font-bold mb-2">Passagers & Sièges</p>
                <p className="text-[14px] text-[#1D1D1F]">Passagers: <span className="font-semibold">{selectedBooking.passenger_count || 1}</span></p>
                <p className="text-[14px] text-[#1D1D1F] mt-1">
                  Sièges: <span className="font-semibold">
                    {Array.isArray(selectedBooking.seats) ? selectedBooking.seats.join(", ") : (selectedBooking.seats || "N/A")}
                  </span>
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Agency Detail Dialog for Superusers */}
      <Dialog open={isAgencyDetailOpen} onOpenChange={setIsAgencyDetailOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-[#007AFF]" />
              {selectedAgency?.name}
            </DialogTitle>
            <DialogDescription>
              Performance et statistiques détaillées des 30 derniers jours
            </DialogDescription>
          </DialogHeader>

          {isDetailLoading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-4">
              <Loader2 className="w-10 h-10 animate-spin text-[#007AFF]" />
              <p className="text-[14px] text-[#86868B] animate-pulse">Analyse des données en cours...</p>
            </div>
          ) : selectedAgency && agencyPerformance && (
            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-[#007AFF]/5 border border-[#007AFF]/10">
                  <p className="text-[11px] font-black text-[#007AFF] uppercase tracking-widest">Revenu (30j)</p>
                  <p className="text-[20px] font-black text-[#1D1D1F] mt-1">{formatPrice(agencyPerformance.revenue30d)}</p>
                </div>
                <div className="p-4 rounded-2xl bg-[#34C759]/5 border border-[#34C759]/10">
                  <p className="text-[11px] font-black text-[#34C759] uppercase tracking-widest">Chauffeurs</p>
                  <p className="text-[20px] font-black text-[#1D1D1F] mt-1">{agencyPerformance.drivers}</p>
                </div>
                <div className="p-4 rounded-2xl bg-[#FF9500]/5 border border-[#FF9500]/10">
                  <p className="text-[11px] font-black text-[#FF9500] uppercase tracking-widest">Flotte</p>
                  <p className="text-[20px] font-black text-[#1D1D1F] mt-1">{selectedAgency.buses?.[0]?.count || 0}</p>
                </div>
              </div>

              {/* Revenue Trend Chart */}
              <div className="space-y-4">
                <h4 className="text-[14px] font-bold text-[#1D1D1F] flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[#007AFF]" />
                  Tendance du Revenu (30j)
                </h4>
                <div className="h-[180px] w-full bg-black/[0.01] rounded-2xl p-4 border border-black/5">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={agencyRevenueTrend}>
                      <defs>
                        <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#007AFF" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#007AFF" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                      <XAxis 
                        dataKey="date" 
                        hide 
                      />
                      <YAxis hide />
                      <Tooltip 
                        contentStyle={{ 
                          borderRadius: '12px', 
                          border: 'none', 
                          boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
                          fontSize: '12px',
                          fontWeight: 'bold'
                        }}
                        formatter={(value: number) => [formatPrice(value), 'Revenu']}
                        labelFormatter={(label) => new Date(label).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="revenue" 
                        stroke="#007AFF" 
                        strokeWidth={3}
                        fillOpacity={1} 
                        fill="url(#colorRev)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-[14px] font-bold text-[#1D1D1F] flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-[#007AFF]" />
                  Destinations les plus rentables
                </h4>
                <div className="space-y-3">
                  {agencyPerformance.topRoutes.length > 0 ? (
                    agencyPerformance.topRoutes.map((route: any, i: number) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-black/[0.02] border border-black/5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-white border border-black/5 flex items-center justify-center text-[12px] font-bold text-[#007AFF]">
                            {i + 1}
                          </div>
                          <span className="text-[14px] font-medium text-[#1D1D1F]">{route.name}</span>
                        </div>
                        <span className="text-[13px] font-bold text-[#86868B]">{route.count} tickets</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-center py-6 text-[#86868B] text-[13px] italic">Aucune donnée de trajet disponible.</p>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => {
                    setIsAgencyDetailOpen(false);
                    navigate(`/agencies?id=${selectedAgency.id}`);
                  }}
                  className="flex-1 py-3 bg-[#1D1D1F] text-white rounded-xl text-[14px] font-bold hover:bg-[#3A3A3C] transition-all"
                >
                  Gérer l'agence
                </button>
                <button 
                  onClick={() => setIsAgencyDetailOpen(false)}
                  className="flex-1 py-3 bg-white border border-black/10 rounded-xl text-[14px] font-bold text-[#1D1D1F] hover:bg-black/5 transition-all"
                >
                  Fermer
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

