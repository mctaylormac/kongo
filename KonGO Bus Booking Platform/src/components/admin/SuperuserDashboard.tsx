// [Agent Dev Web] - Action: Création SuperuserDashboard - Gestion des agences + stats globales cliquables
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Building2, Bus, Map, Ticket, Users, X, Plus, Loader2,
  ChevronRight, TrendingUp, Globe, Shield, RefreshCw, Eye, LogOut
} from 'lucide-react';
import { BookingDetailModal } from './BookingDetailModal';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';
import { AddAgencyForm, AddAgencyAdminForm } from './AdminForms';

interface AgencyDetail {
  id: string;
  name: string;
  contact_email: string | null;
  contact_phone: string | null;
  address: string | null;
  rating: number;
  created_at: string;
  bus_count?: number;
  trip_count?: number;
}

interface GlobalStats {
  agencies: number;
  buses: number;
  trips: number;
  bookings: number;
  clients: number;
  drivers: number;
}

interface DrilldownModal {
  open: boolean;
  type: 'agencies' | 'buses' | 'trips' | 'bookings' | null;
  data: any[];
}

export function SuperuserDashboard() {
  const [stats, setStats] = useState<GlobalStats>({ agencies: 0, buses: 0, trips: 0, bookings: 0, clients: 0, drivers: 0 });
  const [agencies, setAgencies] = useState<AgencyDetail[]>([]);
  const [recentBookings, setRecentBookings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isAgencyFormOpen, setIsAgencyFormOpen] = useState(false);
  const [isAdminFormOpen, setIsAdminFormOpen] = useState(false);
  const [drilldown, setDrilldown] = useState<DrilldownModal>({ open: false, type: null, data: [] });
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const fetchData = useCallback(async (refresh = false) => {
    if (refresh) setIsRefreshing(true);
    else setIsLoading(true);
    try {
      const [
        { count: agencyCount },
        { count: busCount },
        { count: tripCount },
        { count: bookingCount },
        { count: clientCount },
        { count: driverCount }
      ] = await Promise.all([
        supabase.from('agencies').select('*', { count: 'exact', head: true }),
        supabase.from('buses').select('*', { count: 'exact', head: true }),
        supabase.from('trips').select('*', { count: 'exact', head: true }),
        supabase.from('bookings').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('drivers').select('*', { count: 'exact', head: true }),
      ]);

      setStats({
        agencies: agencyCount || 0,
        buses: busCount || 0,
        trips: tripCount || 0,
        bookings: bookingCount || 0,
        clients: clientCount || 0,
        drivers: driverCount || 0,
      });

      // Fetch agencies with bus/trip counts
      const { data: agencyData } = await supabase.from('agencies').select('*').order('created_at', { ascending: false });
      if (agencyData) {
        const enriched = await Promise.all(agencyData.map(async (ag) => {
          const [{ count: bc }, { count: tc }] = await Promise.all([
            supabase.from('buses').select('*', { count: 'exact', head: true }).eq('agency_id', ag.id),
            supabase.from('trips').select('*', { count: 'exact', head: true }).eq('agency_id', ag.id),
          ]);
          return { ...ag, bus_count: bc || 0, trip_count: tc || 0 };
        }));
        setAgencies(enriched);
      }

      // Recent bookings with all details for the modal
      const { data: bks } = await supabase
        .from('bookings')
        .select(`
          *,
          profiles!bookings_user_id_profiles_fkey(full_name, phone_number),
          trips(
            agency_id, 
            agencies(name), 
            origin:locations!origin_location_id(name), 
            destination:locations!destination_location_id(name)
          )
        `)
        .order('created_at', { ascending: false })
        .limit(8);
      setRecentBookings(bks || []);

    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    // Realtime subscription on bookings
    const channel = supabase
      .channel('superuser-bookings')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'bookings' }, (payload) => {
        toast.success('🎫 Nouvelle réservation !', { description: `Code: ${payload.new.booking_code}` });
        fetchData(true);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchData]);

  const openDrilldown = async (type: 'agencies' | 'buses' | 'trips' | 'bookings') => {
    let data: any[] = [];
    if (type === 'agencies') data = agencies;
    else if (type === 'buses') {
      const { data: d } = await supabase.from('buses').select('*, agencies(name)').order('created_at', { ascending: false });
      data = d || [];
    } else if (type === 'trips') {
      const { data: d } = await supabase.from('trips').select('*, agencies(name), origin:locations!origin_location_id(name), destination:locations!destination_location_id(name)').order('created_at', { ascending: false }).limit(30);
      data = d || [];
    } else if (type === 'bookings') {
      data = recentBookings;
    }
    setDrilldown({ open: true, type, data });
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, string> = {
      confirmed: 'bg-green-100 text-green-700',
      pending: 'bg-yellow-100 text-yellow-700',
      cancelled: 'bg-red-100 text-red-700',
      completed: 'bg-blue-100 text-blue-700',
    };
    return map[status] || 'bg-gray-100 text-gray-700';
  };

  const getTimeAgo = (d: string) => {
    const diff = Date.now() - new Date(d).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 60) return `${m} min`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h`;
    return new Date(d).toLocaleDateString('fr-CD');
  };

  const statCards = [
    { key: 'agencies', label: 'Agences', value: stats.agencies, icon: Building2, color: 'from-orange-500 to-amber-500', clickable: true },
    { key: 'buses', label: 'Bus Total', value: stats.buses, icon: Bus, color: 'from-lime-500 to-green-500', clickable: true },
    { key: 'trips', label: 'Voyages', value: stats.trips, icon: Map, color: 'from-blue-500 to-cyan-500', clickable: true },
    { key: 'bookings', label: 'Réservations', value: stats.bookings, icon: Ticket, color: 'from-purple-500 to-violet-500', clickable: true },
    { key: 'clients', label: 'Clients', value: stats.clients, icon: Users, color: 'from-pink-500 to-rose-500', clickable: false },
    { key: 'drivers', label: 'Chauffeurs', value: stats.drivers, icon: Shield, color: 'from-teal-500 to-emerald-500', clickable: false },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-kongo-lime mx-auto" />
          <p className="text-body text-tertiary">Chargement du tableau de bord...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 bg-kongo-black rounded-xl flex items-center justify-center">
              <Globe className="w-5 h-5 text-kongo-lime" />
            </div>
            <span className="text-label font-bold text-kongo-lime uppercase tracking-widest">Superuser</span>
          </div>
          <h1 className="text-display-2 text-kongo-black font-bold">Vue Globale KonGO</h1>
          <p className="text-body text-tertiary">Supervision de toutes les agences de transport.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchData(true)}
            disabled={isRefreshing}
            className="btn-outline px-4 py-2 rounded-lg flex items-center gap-2 text-body-small font-bold"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Actualiser
          </button>
          <button
            onClick={() => setIsAgencyFormOpen(true)}
            className="btn-primary px-5 py-2 rounded-lg flex items-center gap-2 font-bold shadow-kongo-lime"
          >
            <Plus className="w-4 h-4" /> Nouvelle Agence
          </button>
          <button
            onClick={() => setIsAdminFormOpen(true)}
            className="btn-outline px-5 py-2 rounded-lg flex items-center gap-2 font-bold"
          >
            <Shield className="w-4 h-4" /> Créer Admin
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

      {/* Stat Cards — cliquable pour drilldown */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((s, i) => (
          <motion.div
            key={s.key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            onClick={() => s.clickable && openDrilldown(s.key as any)}
            className={`relative overflow-hidden rounded-2xl p-5 text-white bg-gradient-to-br ${s.color} ${s.clickable ? 'cursor-pointer hover:scale-105 transition-transform' : ''}`}
          >
            <s.icon className="w-7 h-7 opacity-80 mb-3" />
            <p className="text-3xl font-black">{s.value}</p>
            <p className="text-xs opacity-80 mt-1 font-medium">{s.label}</p>
            {s.clickable && <Eye className="absolute top-3 right-3 w-4 h-4 opacity-50" />}
          </motion.div>
        ))}
      </div>

      {/* Agences Table */}
      <div className="card-elevated p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-h4 text-kongo-black font-bold">Agences Enregistrées</h2>
          <button onClick={() => openDrilldown('agencies')} className="text-body-small text-kongo-lime font-bold flex items-center gap-1 hover:underline">
            Voir tout <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left border-b border-border-primary">
                <th className="pb-3 text-label text-tertiary font-medium">Agence</th>
                <th className="pb-3 text-label text-tertiary font-medium text-center">Bus</th>
                <th className="pb-3 text-label text-tertiary font-medium text-center">Voyages</th>
                <th className="pb-3 text-label text-tertiary font-medium hidden md:table-cell">Contact</th>
                <th className="pb-3 text-label text-tertiary font-medium hidden md:table-cell">Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-secondary">
              {agencies.length === 0 ? (
                <tr><td colSpan={5} className="py-8 text-center text-tertiary text-body-small">Aucune agence enregistrée.</td></tr>
              ) : agencies.map((ag) => (
                <tr key={ag.id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-kongo-black flex items-center justify-center text-kongo-lime font-black text-xs">
                        {ag.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-body font-semibold text-kongo-black">{ag.name}</p>
                        <p className="text-xs text-tertiary hidden sm:block">{ag.address || '—'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 text-center">
                    <span className="inline-flex items-center gap-1 bg-lime-50 text-lime-700 px-2 py-1 rounded-lg text-body-small font-bold">
                      <Bus className="w-3 h-3" /> {ag.bus_count}
                    </span>
                  </td>
                  <td className="py-4 text-center">
                    <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-1 rounded-lg text-body-small font-bold">
                      <Map className="w-3 h-3" /> {ag.trip_count}
                    </span>
                  </td>
                  <td className="py-4 hidden md:table-cell">
                    <p className="text-body-small text-secondary">{ag.contact_email || ag.contact_phone || '—'}</p>
                  </td>
                  <td className="py-4 hidden md:table-cell">
                    <div className="flex items-center gap-1">
                      <span className="text-yellow-400">★</span>
                      <span className="text-body-small font-bold">{ag.rating || '—'}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Réservations Récentes */}
      <div className="card-elevated p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-h4 text-kongo-black font-bold flex items-center gap-2">
            <Ticket className="w-5 h-5 text-purple-500" /> Réservations en Temps Réel
          </h2>
          <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-bold animate-pulse">● Live</span>
        </div>
        <div className="space-y-3">
          {recentBookings.length === 0 ? (
            <p className="text-center text-tertiary py-8 text-body-small">Aucune réservation pour l'instant.</p>
          ) : recentBookings.map((b) => (
            <motion.div
              key={b.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-kongo-black text-kongo-lime flex items-center justify-center text-xs font-black">
                  {b.booking_code?.slice(0, 3) || 'KG'}
                </div>
                <div>
                  <p className="text-body font-semibold">{b.booking_code}</p>
                  <p className="text-xs text-tertiary">
                    {b.trips?.origin?.name} → {b.trips?.destination?.name} • {b.trips?.agencies?.name} • {getTimeAgo(b.created_at)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs px-2 py-1 rounded-full font-bold ${getStatusBadge(b.status)}`}>
                  {b.status}
                </span>
                <span className="text-body-small font-bold text-kongo-black hidden sm:block">
                  {b.total_price?.toLocaleString('fr-CD')} CDF
                </span>
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
            </motion.div>
          ))}
        </div>
      </div>

      <BookingDetailModal 
        booking={selectedBooking} 
        isOpen={isDetailOpen} 
        onClose={() => setIsDetailOpen(false)} 
      />

      {/* Drilldown Modal */}
      <AnimatePresence>
        {drilldown.open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
            onClick={() => setDrilldown({ ...drilldown, open: false })}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-h4 font-bold text-kongo-black capitalize">Détail : {drilldown.type}</h3>
                <button onClick={() => setDrilldown({ ...drilldown, open: false })} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {drilldown.type === 'agencies' && (
                <div className="space-y-3">
                  {drilldown.data.map((ag: AgencyDetail) => (
                    <div key={ag.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-kongo-black text-kongo-lime flex items-center justify-center font-black text-sm">
                          {ag.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-kongo-black">{ag.name}</p>
                          <p className="text-xs text-tertiary">{ag.contact_email || ag.contact_phone || '—'}</p>
                        </div>
                      </div>
                      <div className="flex gap-4 text-xs font-bold text-right">
                        <div className="text-center">
                          <p className="text-lime-600">{(ag as any).bus_count ?? '—'}</p>
                          <p className="text-tertiary font-normal">bus</p>
                        </div>
                        <div className="text-center">
                          <p className="text-blue-600">{(ag as any).trip_count ?? '—'}</p>
                          <p className="text-tertiary font-normal">voyages</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {drilldown.type === 'buses' && (
                <div className="space-y-2">
                  {drilldown.data.map((b: any) => (
                    <div key={b.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <div>
                        <p className="font-bold text-kongo-black text-body">{b.name}</p>
                        <p className="text-xs text-tertiary">{b.plate_number} • {b.type} • {b.agencies?.name}</p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full font-bold ${b.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {b.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {drilldown.type === 'trips' && (
                <div className="space-y-2">
                  {drilldown.data.map((t: any) => (
                    <div key={t.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <div>
                        <p className="font-bold text-kongo-black text-body">{t.origin?.name} → {t.destination?.name}</p>
                        <p className="text-xs text-tertiary">{t.agencies?.name} • {new Date(t.departure_time).toLocaleString('fr-CD')}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-kongo-black text-body-small">{t.price?.toLocaleString()} CDF</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusBadge(t.status)}`}>{t.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {drilldown.type === 'bookings' && (
                <div className="space-y-2">
                  {drilldown.data.map((b: any) => (
                    <div key={b.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <div>
                        <p className="font-bold text-kongo-black text-body">{b.booking_code}</p>
                        <p className="text-xs text-tertiary">{b.trips?.origin?.name} → {b.trips?.destination?.name} • {getTimeAgo(b.created_at)}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-body-small">{b.total_price?.toLocaleString()} CDF</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusBadge(b.status)}`}>{b.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AddAgencyForm isOpen={isAgencyFormOpen} onClose={() => { setIsAgencyFormOpen(false); fetchData(true); }} />
      <AddAgencyAdminForm isOpen={isAdminFormOpen} onClose={() => { setIsAdminFormOpen(false); fetchData(true); }} />
    </div>
  );
}
