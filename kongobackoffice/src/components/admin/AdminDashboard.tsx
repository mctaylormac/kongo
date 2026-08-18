import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Separator } from '../ui/separator';
import { Bus, Map, Ticket, Users, TrendingUp, AlertCircle, Plus, Building2, Loader2, Eye, User, CreditCard, MapPin, LogOut, ChevronRight } from 'lucide-react';
import { AddAgencyForm, AddBusForm, AddTripForm, AddDriverForm } from './AdminForms';
import { BookingDetailModal } from './BookingDetailModal';
import { NAVIGATION_PAGES } from '../app/AppConstants';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';

interface AdminDashboardProps {
    onPageChange: (page: string) => void;
    userRole?: 'guest' | 'superuser' | 'agency' | 'chef' | 'driver' | 'cashier';
}

export function AdminDashboard({ onPageChange, userRole = 'superuser' }: AdminDashboardProps) {
    const [isAgencyFormOpen, setIsAgencyFormOpen] = useState(false);
    const [isDriverFormOpen, setIsDriverFormOpen] = useState(false);
    const [isBusFormOpen, setIsBusFormOpen] = useState(false);
    const [isTripFormOpen, setIsTripFormOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [recentBookings, setRecentBookings] = useState<any[]>([]);
    const [selectedBooking, setSelectedBooking] = useState<any>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);

    const [counts, setCounts] = useState({
        buses: 0,
        trips: 0,
        bookings: 0,
        clients: 0,
        agencies: 0
    });

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [
                { count: busCount },
                { count: tripCount },
                { count: bookingCount },
                { count: clientCount },
                { count: agencyCount }
            ] = await Promise.all([
                supabase.from('buses').select('*', { count: 'exact', head: true }),
                supabase.from('trips').select('*', { count: 'exact', head: true }),
                supabase.from('bookings').select('*', { count: 'exact', head: true }),
                supabase.from('profiles').select('*', { count: 'exact', head: true }),
                supabase.from('agencies').select('*', { count: 'exact', head: true })
            ]);

            setCounts({
                buses: busCount || 0,
                trips: tripCount || 0,
                bookings: bookingCount || 0,
                clients: clientCount || 0,
                agencies: agencyCount || 0
            });

            const { data: bks } = await supabase
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

            setRecentBookings(bks || []);

        } catch (error: any) {
            console.error("Dashboard fetch error:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();

        const handleRefresh = () => fetchData();
        window.addEventListener('refresh-agencies', handleRefresh);
        window.addEventListener('refresh-buses', handleRefresh);
        window.addEventListener('refresh-trips', handleRefresh);

        return () => {
            window.removeEventListener('refresh-agencies', handleRefresh);
            window.removeEventListener('refresh-buses', handleRefresh);
            window.removeEventListener('refresh-trips', handleRefresh);
        };
    }, []);

    const stats = [
        { label: 'Agences', value: counts.agencies, icon: Building2, color: 'text-orange-500', page: NAVIGATION_PAGES.ADMIN_AGENCIES },
        { label: 'Total Bus', value: counts.buses, icon: Bus, color: 'text-kongo-lime', page: NAVIGATION_PAGES.ADMIN_BUSES },
        { label: 'Voyages Actifs', value: counts.trips, icon: Map, color: 'text-blue-500', page: NAVIGATION_PAGES.ADMIN_TRIPS },
        { label: 'Tickets Vendus', value: counts.bookings, icon: Ticket, color: 'text-green-500', page: NAVIGATION_PAGES.ADMIN_BOOKINGS },
        { label: 'Clients', value: counts.clients, icon: Users, color: 'text-purple-500', page: NAVIGATION_PAGES.ADMIN_CLIENTS },
    ];

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('fr-CD', { style: 'currency', currency: 'CDF', maximumFractionDigits: 0 }).format(price);
    };

    const getTimeAgo = (dateStr: string) => {
        const diff = Date.now() - new Date(dateStr).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 60) return `Il y a ${mins} min`;
        const hours = Math.floor(mins / 60);
        if (hours < 24) return `Il y a ${hours}h`;
        return new Date(dateStr).toLocaleDateString();
    };

    // Dashboard pour le chauffeur (Interface simplifiée de scan)
    if (userRole === 'driver') {
        return (
            <div className="space-y-12">
                <div className="max-w-xl mx-auto text-center space-y-6 pt-12">
                     <motion.div 
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="w-32 h-32 bg-kongo-lime rounded-[2.5rem] flex items-center justify-center mx-auto shadow-2xl shadow-kongo-lime/20 rotate-6"
                     >
                        <Ticket className="w-16 h-16 text-kongo-black" />
                     </motion.div>
                     <div className="space-y-2">
                        <h1 className="text-display-3 font-black text-white">Scanner Billet</h1>
                        <p className="text-slate-400">Vérifiez instantanément la validité des titres de transport.</p>
                     </div>
                     
                     <Button 
                        variant="premium"
                        size="premium"
                        onClick={() => toast.success("✅ Billet valide", { description: "Passager: Jean Dupont | Siège: 12A" })}
                        className="w-full h-20 text-xl"
                     >
                        <Plus className="w-8 h-8 mr-2" /> 
                        Scanner maintenant
                     </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-display-3 text-white font-black tracking-tighter">
                        {userRole === 'superuser' ? "Super Admin" : "Dashboard Agence"}
                    </h1>
                    <p className="text-slate-400 mt-1">
                        {userRole === 'superuser' ? "Contrôle global de la flotte et des agences." : "Gestion de vos opérations quotidiennes."}
                    </p>
                </div>
                <div className="flex flex-wrap gap-3">
                    {userRole === 'superuser' && (
                        <Button
                            variant="outline"
                            size="premium"
                            onClick={() => setIsAgencyFormOpen(true)}
                        >
                            <Building2 className="w-4 h-4 mr-2 opacity-50" /> Agence
                        </Button>
                    )}
                    
                    {(userRole === 'agency' || userRole === 'superuser') && (
                        <>
                            <Button
                                variant="outline"
                                size="premium"
                                onClick={() => setIsDriverFormOpen(true)}
                            >
                                <Users className="w-4 h-4 mr-2 opacity-50" /> Chauffeur
                            </Button>
                            <Button
                                variant="outline"
                                size="premium"
                                onClick={() => setIsBusFormOpen(true)}
                            >
                                <Bus className="w-4 h-4 mr-2 opacity-50" /> Bus
                            </Button>
                            <Button
                                variant="premium"
                                size="premium"
                                onClick={() => setIsTripFormOpen(true)}
                            >
                                <Plus className="w-5 h-5 mr-3 opacity-50" /> Créer un Voyage
                            </Button>
                        </>
                    )}
                </div>
            </div>

            {/* Forms Modals */}
            <AddAgencyForm isOpen={isAgencyFormOpen} onClose={() => setIsAgencyFormOpen(false)} />
            <AddDriverForm isOpen={isDriverFormOpen} onClose={() => setIsDriverFormOpen(false)} />
            <AddBusForm isOpen={isBusFormOpen} onClose={() => setIsBusFormOpen(false)} />
            <AddTripForm isOpen={isTripFormOpen} onClose={() => setIsTripFormOpen(false)} />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {stats.filter(s => userRole === 'superuser' ? true : s.label !== 'Agences').map((stat, idx) => (
                    <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        onClick={() => onPageChange(stat.page)}
                        className="p-6 rounded-[2rem] bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 hover:border-kongo-lime/50 transition-all flex flex-col gap-4 group"
                    >
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center bg-white/5 ${stat.color} group-hover:scale-110 transition-transform`}>
                            <stat.icon className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{stat.label}</p>
                            <p className="text-3xl text-white font-black mt-1">
                                {isLoading ? <span className="animate-pulse">...</span> : stat.value}
                            </p>
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 p-8 rounded-[2.5rem] bg-white/5 border border-white/10">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-xl text-white font-black tracking-tight">Activités Récentes</h2>
                        <Button variant="ghost" size="sm" className="text-kongo-lime hover:bg-kongo-lime/10">Voir tout</Button>
                    </div>
                    <div className="space-y-4">
                        {isLoading ? (
                            <div className="py-12 flex justify-center"><Loader2 className="animate-spin text-kongo-lime w-12 h-12" /></div>
                        ) : recentBookings.length > 0 ? (
                            recentBookings.map((booking) => (
                                <div key={booking.id} className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-white/10 transition-all group">
                                    <div className="flex items-center space-x-4">
                                        <div className="w-12 h-12 rounded-xl bg-slate-900 border border-white/5 flex items-center justify-center text-white text-xs font-black shadow-inner">
                                            {booking.profiles?.full_name?.slice(0, 2).toUpperCase() || 'KG'}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-white">Ticket #{booking.booking_reference}</p>
                                            <p className="text-xs text-slate-400 mt-1">
                                                {booking.trips?.origin?.name} <ChevronRight className="inline w-3 h-3 mx-1" /> {booking.trips?.destination?.name} • {getTimeAgo(booking.created_at)}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="text-sm font-black text-kongo-lime">{formatPrice(booking.total_price)}</span>
                                        <Button 
                                            variant="outline"
                                            size="icon"
                                            onClick={() => {
                                                setSelectedBooking(booking);
                                                setIsDetailOpen(true);
                                            }}
                                            className="w-10 h-10 hover:border-kongo-lime/30"
                                        >
                                            <Eye className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="py-12 text-center text-slate-500 italic">Aucune activité récente.</div>
                        )}
                    </div>
                </div>

                <BookingDetailModal 
                    booking={selectedBooking} 
                    isOpen={isDetailOpen} 
                    onClose={() => setIsDetailOpen(false)} 
                />

                <div className="p-8 rounded-[2.5rem] bg-kongo-black border border-white/5 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-kongo-lime/5 blur-3xl -z-0" />
                    <h2 className="text-xl font-black mb-6 text-white tracking-tight relative z-10">Alertes Système</h2>
                    <div className="space-y-4 relative z-10">
                        <div className="flex space-x-3 p-4 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-all">
                            <AlertCircle className="w-5 h-5 text-kongo-lime shrink-0" />
                            <div>
                                <p className="text-xs font-black text-white uppercase tracking-wider">Maintenance requise</p>
                                <p className="text-[11px] text-slate-400 mt-0.5">Le bus #BK-405 nécessite une révision après 5000km.</p>
                            </div>
                        </div>
                        <div className="flex space-x-3 p-4 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-all">
                            <AlertCircle className="w-5 h-5 text-orange-400 shrink-0" />
                            <div>
                                <p className="text-xs font-black text-white uppercase tracking-wider">Retard signalé</p>
                                <p className="text-[11px] text-slate-400 mt-0.5">Trajet Lubumbashi-Bukavu retardé de 45min (météo).</p>
                            </div>
                        </div>
                    </div>
                    <Button variant="outline" size="premium" className="w-full mt-8">
                        Consulter toutes les alertes
                    </Button>

                    {userRole === 'superuser' && (
                        <Button
                            variant="premium"
                            size="premium"
                            onClick={() => onPageChange(NAVIGATION_PAGES.ADMIN_AGENCIES)}
                            className="w-full mt-4"
                        >
                            <Building2 className="w-4 h-4 mr-2" /> Gérer les Agences
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
