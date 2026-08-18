// [Agent Dev Web] - Action: Création ChefDashboard - Vue lecture seule pour le rôle Chef
import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import {
  Bus, Map, Users, Loader2, RefreshCw, Ticket,
  BarChart3, Eye, LogOut, Zap, TrendingUp, Shield
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Separator } from '../ui/separator';
import { BookingDetailModal } from './BookingDetailModal';

interface AgencyStats {
  buses: number;
  trips: number;
  drivers: number;
  bookings: number;
  revenue: number;
  cashiers: number;
}

interface BusItem {
  id: string;
  name: string;
  plate_number: string;
  type: string;
  capacity: number;
  status: string;
}

interface TripItem {
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

interface DriverItem {
  id: string;
  full_name: string;
  phone: string | null;
  license_number: string | null;
  status: string;
  role: string;
  assigned_bus_id: string | null;
  buses?: { name: string; plate_number: string } | null;
  avatar_url?: string | null;
}

type TabType = 'overview' | 'buses' | 'trips' | 'team' | 'bookings';

import { PageProps } from '../app/AppHelpers';

export function ChefDashboard({ onLogout }: PageProps) {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [stats, setStats] = useState<AgencyStats>({ buses: 0, trips: 0, drivers: 0, bookings: 0, revenue: 0, cashiers: 0 });
  const [buses, setBuses] = useState<BusItem[]>([]);
  const [trips, setTrips] = useState<TripItem[]>([]);
  const [drivers, setDrivers] = useState<DriverItem[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [agencyId, setAgencyId] = useState<string | null>(null);
  const [agencyName, setAgencyName] = useState('Mon Agence');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const fetchData = useCallback(async (refresh = false) => {
    if (refresh) setIsRefreshing(true);
    else setIsLoading(true);
    try {
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

      const [busRes, tripRes, driverRes] = await Promise.all([
        supabase.from('buses').select('*').eq('agency_id', aid).order('created_at', { ascending: false }),
        supabase.from('trips').select('*, origin:locations!origin_location_id(name), destination:locations!destination_location_id(name)').eq('agency_id', aid).order('departure_time', { ascending: false }),
        supabase.from('drivers').select('*, buses(name, plate_number)').eq('agency_id', aid).order('created_at', { ascending: false }),
      ]);

      setBuses(busRes.data || []);
      setTrips(tripRes.data || []);
      setDrivers(driverRes.data || []);

      // Fetch bookings via trip IDs
      const agencyTripIds = (tripRes.data || []).map((t: any) => t.id);
      let bookingsData: any[] = [];
      if (agencyTripIds.length > 0) {
        const { data: bookingRows } = await supabase
          .from('bookings')
          .select('*, profiles!bookings_user_id_profiles_fkey(full_name, phone_number), trips(*, origin:locations!origin_location_id(name), destination:locations!destination_location_id(name), agencies(name))')
          .in('trip_id', agencyTripIds)
          .order('created_at', { ascending: false })
          .limit(100);
        bookingsData = bookingRows || [];
      }
      setBookings(bookingsData);

      const totalRevenue = bookingsData
        .filter(b => b.payment_status === 'paid' || b.payment_status === 'completed')
        .reduce((sum, b) => sum + (b.total_price || 0), 0);

      const cashierCount = (driverRes.data || []).filter((d: any) => d.role === 'cashier').length;
      const driverCount = (driverRes.data || []).filter((d: any) => d.role !== 'cashier').length;

      setStats({
        buses: busRes.data?.length || 0,
        trips: tripRes.data?.length || 0,
        drivers: driverCount,
        bookings: bookingsData.length,
        revenue: totalRevenue,
        cashiers: cashierCount,
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
    const channel = supabase.channel('chef-bookings')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'bookings' }, () => {
        fetchData(true);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchData]);

  const getStatusBadge = (status: string) => {
    const map: Record<string, string> = {
      active: 'bg-green-100 text-green-700',
      inactive: 'bg-gray-100 text-gray-600',
      confirmed: 'bg-green-100 text-green-700',
      pending: 'bg-yellow-100 text-yellow-700',
      cancelled: 'bg-red-100 text-red-700',
      scheduled: 'bg-blue-100 text-blue-700',
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
    { id: 'buses', label: `Bus (${stats.buses})`, icon: Bus },
    { id: 'trips', label: `Voyages (${stats.trips})`, icon: Map },
    { id: 'team', label: `Équipe (${stats.drivers + stats.cashiers})`, icon: Users },
    { id: 'bookings', label: `Réservations (${stats.bookings})`, icon: Ticket },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-kongo-lime mx-auto" />
          <p className="text-body text-tertiary">Chargement du tableau de bord Chef...</p>
        </div>
      </div>
    );
  }

  if (!agencyId) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] p-4">
        <div className="text-center space-y-4 max-w-sm w-full bg-white p-8 rounded-2xl shadow-sm border border-border-secondary">
          <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mx-auto">
            <Eye className="w-10 h-10 text-orange-400" />
          </div>
          <h2 className="text-h3 font-bold text-kongo-black">Compte non lié</h2>
          <p className="text-body text-tertiary">Votre compte Chef n'est pas encore lié à une agence.</p>
          <Button
            variant="outline"
            size="premium"
            onClick={async () => {
              await supabase.auth.signOut();
              localStorage.removeItem('kongo-app-state');
              window.location.href = '/admin';
            }}
            className="w-full mt-6 text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
          >
            <LogOut className="w-5 h-5 mr-2" />
            Se déconnecter
          </Button>
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
            <Eye className="w-5 h-5 text-amber-500" />
            <span className="text-label font-bold text-amber-500 uppercase tracking-widest">Chef — Lecture Seule</span>
          </div>
          <h1 className="text-display-2 text-kongo-black font-bold">{agencyName}</h1>
          <p className="text-body text-tertiary">Consultez les informations de votre agence. Aucune modification n'est autorisée.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="premium"
            onClick={() => fetchData(true)} 
            disabled={isRefreshing}
            className="font-bold"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} /> Actualiser
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              onLogout();
            }}
            className="w-10 h-10 bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
            title="Déconnexion"
          >
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Read-only banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
        <Shield className="w-5 h-5 text-amber-600 shrink-0" />
        <p className="text-body-small text-amber-800 font-medium">
          Mode consultation uniquement. Pour toute modification, contactez l'administrateur de votre agence.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: 'Bus', value: stats.buses, icon: Bus, color: 'bg-lime-50 text-lime-700' },
          { label: 'Voyages', value: stats.trips, icon: Map, color: 'bg-blue-50 text-blue-700' },
          { label: 'Chauffeurs', value: stats.drivers, icon: Users, color: 'bg-purple-50 text-purple-700' },
          { label: 'Caissiers', value: stats.cashiers, icon: Ticket, color: 'bg-teal-50 text-teal-700' },
          { label: 'Réservations', value: stats.bookings, icon: Ticket, color: 'bg-pink-50 text-pink-700' },
          { label: 'Revenus (CDF)', value: stats.revenue.toLocaleString('fr-CD'), icon: TrendingUp, color: 'bg-orange-50 text-orange-700' },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            className={`rounded-2xl p-4 ${s.color}`}>
            <s.icon className="w-6 h-6 mb-2 opacity-70" />
            <p className="text-2xl font-black">{s.value}</p>
            <p className="text-xs font-medium opacity-70 mt-0.5">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {tabs.map(tab => (
          <Button 
            key={tab.id} 
            variant={activeTab === tab.id ? 'premium' : 'ghost'}
            size="premium"
            onClick={() => setActiveTab(tab.id as TabType)}
            className={`whitespace-nowrap ${activeTab === tab.id ? '' : 'text-slate-500 bg-gray-100'}`}
          >
            <tab.icon className="w-4 h-4 mr-2" />
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Tab Content — All READ-ONLY */}
      <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>

        {/* OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card-elevated p-6">
              <h3 className="text-h4 font-bold mb-4 flex items-center gap-2">
                <Bus className="w-5 h-5 text-lime-600" /> Flotte récente
              </h3>
              {buses.slice(0, 5).map(b => (
                <div key={b.id} className="flex items-center justify-between py-3 border-b border-border-secondary last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Bus className="w-4 h-4 text-secondary" />
                    </div>
                    <div>
                      <p className="text-body font-semibold">{b.name}</p>
                      <p className="text-xs text-tertiary">{b.plate_number} • {b.type} • {b.capacity} places</p>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-bold ${getStatusBadge(b.status)}`}>{b.status}</span>
                </div>
              ))}
              {buses.length === 0 && <p className="text-center text-tertiary text-body-small py-4">Aucun bus.</p>}
            </div>

            <div className="card-elevated p-6">
              <h3 className="text-h4 font-bold mb-4 flex items-center gap-2">
                <Ticket className="w-5 h-5 text-purple-500" /> Réservations récentes
                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold animate-pulse ml-auto">● Live</span>
              </h3>
              {bookings.slice(0, 5).map(b => (
                <div key={b.id} className="flex items-center justify-between py-3 border-b border-border-secondary last:border-0">
                  <div>
                    <p className="text-body font-semibold">{b.booking_code}</p>
                    <p className="text-xs text-tertiary">{b.profiles?.full_name || 'Client'} • {getTimeAgo(b.created_at)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded-full font-bold ${getStatusBadge(b.status)}`}>{b.status}</span>
                    <span className="font-bold text-kongo-black text-body-small">{b.total_price?.toLocaleString()} CDF</span>
                  </div>
                </div>
              ))}
              {bookings.length === 0 && <p className="text-center text-tertiary text-body-small py-4">Aucune réservation.</p>}
            </div>
          </div>
        )}

        {/* BUSES — Lecture seule */}
        {activeTab === 'buses' && (
          <div className="card-elevated p-6">
            <h2 className="text-h4 font-bold mb-6 flex items-center gap-2">
              <Bus className="w-5 h-5" /> Flotte de l'agence
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr className="text-left border-b border-border-primary text-label text-tertiary">
                  <th className="pb-3">Bus</th><th className="pb-3">Plaque</th><th className="pb-3">Type</th><th className="pb-3">Capacité</th><th className="pb-3">Statut</th>
                </tr></thead>
                <tbody className="divide-y divide-border-secondary">
                  {buses.length === 0 ? (
                    <tr><td colSpan={5} className="py-8 text-center text-tertiary">Aucun bus enregistré.</td></tr>
                  ) : buses.map(b => (
                    <tr key={b.id} className="hover:bg-gray-50">
                      <td className="py-4 font-semibold text-kongo-black">{b.name}</td>
                      <td className="py-4 text-body-small text-secondary font-mono">{b.plate_number}</td>
                      <td className="py-4 text-body-small">{b.type}</td>
                      <td className="py-4 text-body-small">{b.capacity} places</td>
                      <td className="py-4"><span className={`text-xs px-2 py-1 rounded-full font-bold ${getStatusBadge(b.status)}`}>{b.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TRIPS — Lecture seule */}
        {activeTab === 'trips' && (
          <div className="card-elevated p-6">
            <h2 className="text-h4 font-bold mb-6 flex items-center gap-2">
              <Map className="w-5 h-5" /> Voyages programmés
            </h2>
            <div className="space-y-3">
              {trips.length === 0 ? (
                <p className="text-center text-tertiary py-8">Aucun voyage.</p>
              ) : trips.map(t => (
                <div key={t.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                      <Map className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                      <p className="font-bold text-kongo-black">{t.origin?.name} → {t.destination?.name}</p>
                      <p className="text-xs text-tertiary">
                        {new Date(t.departure_time).toLocaleString('fr-CD', { dateStyle: 'short', timeStyle: 'short' })} • {t.seats_available}/{t.total_seats} places
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-kongo-black text-body-small">{t.price?.toLocaleString()} CDF</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${getStatusBadge(t.status)}`}>{t.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TEAM — Lecture seule */}
        {activeTab === 'team' && (
          <div className="card-elevated p-6">
            <h2 className="text-h4 font-bold mb-6 flex items-center gap-2">
              <Users className="w-5 h-5" /> Équipe de l'agence
            </h2>
            <div className="space-y-3">
              {drivers.length === 0 ? (
                <p className="text-center text-tertiary py-8">Aucun membre dans l'équipe.</p>
              ) : drivers.map(d => (
                <div key={d.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-black text-sm overflow-hidden border border-slate-200">
                      {d.avatar_url ? (
                          <img src={d.avatar_url} alt={d.full_name} className="w-full h-full object-cover" />
                      ) : (
                          <span className="text-slate-500">{d.full_name.slice(0, 2).toUpperCase()}</span>
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-kongo-black">{d.full_name}</p>
                      <p className="text-xs text-tertiary">
                        {d.phone} {d.license_number ? `• Permis: ${d.license_number}` : ''}
                      </p>
                      <p className={`text-xs font-bold mt-0.5 ${d.role === 'cashier' ? 'text-teal-600' : 'text-blue-600'}`}>
                        {d.role === 'cashier' ? '🏪 Caissier' : '🚌 Chauffeur'}
                        {d.buses ? ` • ${d.buses.name} (${d.buses.plate_number})` : ''}
                      </p>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-bold ${getStatusBadge(d.status)}`}>{d.status}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* BOOKINGS — Lecture seule */}
        {activeTab === 'bookings' && (
          <div className="card-elevated p-6">
            <h2 className="text-h4 font-bold mb-6 flex items-center gap-2">
              <Ticket className="w-5 h-5 text-purple-500" /> Toutes les réservations
              <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-bold animate-pulse ml-auto">● Live</span>
            </h2>
            <div className="space-y-3">
              {bookings.length === 0 ? (
                <p className="text-center text-tertiary py-8">Aucune réservation.</p>
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
                    <Button 
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setSelectedBooking(b);
                        setIsDetailOpen(true);
                      }}
                      className="w-10 h-10 text-slate-400 hover:text-kongo-black"
                      title="Consulter les détails"
                    >
                      <Eye className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>

      <BookingDetailModal 
        booking={selectedBooking} 
        isOpen={isDetailOpen} 
        onClose={() => setIsDetailOpen(false)} 
      />
    </div>
  );
}
