import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Separator } from '../ui/separator';
import { Bus, Map, Ticket, Users, TrendingUp, AlertCircle, Plus, Building2, Loader2, Eye, User, CreditCard, MapPin, LogOut } from 'lucide-react';
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
            <div className="p-6 space-y-8 flex flex-col items-center justify-center min-h-[60vh]">
                <div className="text-center space-y-4">
                    <div className="w-20 h-20 bg-surface-kongo-lime-light rounded-full flex items-center justify-center mx-auto">
                        <Ticket className="w-10 h-10 text-kongo-lime-dark" />
                    </div>
                    <h1 className="text-display-2 text-kongo-black font-bold">Scanner Billet</h1>
                    <p className="text-body text-tertiary">Scannez le code QR du passager pour vérifier la validité.</p>
                    
                    <button 
                        onClick={() => toast.success("✅ Billet valide", { description: "Passager: Jean Dupont | Siège: 12A" })}
                        className="btn-primary flex items-center justify-center px-8 py-4 rounded-lg shadow-kongo-lime transition-all mt-8 w-full max-w-sm mx-auto text-h4 font-bold"
                    >
                        <Plus className="w-6 h-6 mr-2" /> Simuler un Scan
                    </button>
                    <button 
                        onClick={async () => {
                            await supabase.auth.signOut();
                            localStorage.removeItem('kongo-app-state');
                            window.location.href = '/admin';
                        }}
                        className="btn-outline flex items-center justify-center px-8 py-4 rounded-lg mt-4 w-full max-w-sm mx-auto text-body-large text-error border-error hover:bg-error/10"
                    >
                        <LogOut className="w-5 h-5 mr-3" /> Se déconnecter
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-display-2 text-kongo-black font-bold">
                        {userRole === 'superuser' ? "Super Admin Dashboard" : "Dashboard Agence"}
                    </h1>
                    <p className="text-body text-tertiary">
                        {userRole === 'superuser' ? "Gérez la plateforme de transport KonGO." : "Gérez vos bus, voyages et chauffeurs."}
                    </p>
                </div>
                <div className="flex flex-wrap gap-3">
                    {userRole === 'superuser' && (
                        <button
                            onClick={() => setIsAgencyFormOpen(true)}
                            className="btn-outline flex items-center px-4 py-2 rounded-lg border-kongo-black hover:bg-gray-50 text-body-small font-bold"
                        >
                            <Building2 className="w-4 h-4 mr-2" /> Ajouter Agence
                        </button>
                    )}
                    
                    {(userRole === 'agency' || userRole === 'superuser') && (
                        <>
                            <button
                                onClick={() => setIsDriverFormOpen(true)}
                                className="btn-outline flex items-center px-4 py-2 rounded-lg border-kongo-black hover:bg-gray-50 text-body-small font-bold"
                            >
                                <Users className="w-4 h-4 mr-2" /> Chauffeur
                            </button>
                            <button
                                onClick={() => setIsBusFormOpen(true)}
                                className="btn-outline flex items-center px-4 py-2 rounded-lg border-kongo-black hover:bg-gray-50 text-body-small font-bold"
                            >
                                <Bus className="w-4 h-4 mr-2" /> Ajouter Bus
                            </button>
                            <button
                                onClick={() => setIsTripFormOpen(true)}
                                className="btn-primary flex items-center px-6 py-2 rounded-lg shadow-kongo-lime transition-all"
                            >
                                <Plus className="w-5 h-5 mr-2" /> Créer un Voyage
                            </button>
                        </>
                    )}
                    <button
                        onClick={async () => {
                            await supabase.auth.signOut();
                            localStorage.removeItem('kongo-app-state');
                            window.location.href = '/admin';
                        }}
                        className="btn-outline flex items-center p-2 rounded-lg border-error text-error hover:bg-error/10"
                        title="Se déconnecter"
                    >
                        <LogOut className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Forms Modals */}
            <AddAgencyForm isOpen={isAgencyFormOpen} onClose={() => setIsAgencyFormOpen(false)} />
            <AddDriverForm isOpen={isDriverFormOpen} onClose={() => setIsDriverFormOpen(false)} />
            <AddBusForm isOpen={isBusFormOpen} onClose={() => setIsBusFormOpen(false)} />
            <AddTripForm isOpen={isTripFormOpen} onClose={() => setIsTripFormOpen(false)} />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                {stats.filter(s => userRole === 'superuser' ? true : s.label !== 'Agences').map((stat, idx) => (
                    <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        onClick={() => onPageChange(stat.page)}
                        className="card-elevated p-6 flex items-center space-x-4 cursor-pointer hover:border-kongo-lime transition-all border border-transparent"
                    >
                        <div className={`p-3 rounded-xl bg-gray-50 ${stat.color}`}>
                            <stat.icon className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-label text-tertiary">{stat.label}</p>
                            <p className="text-h3 text-kongo-black font-bold">
                                {isLoading ? <span className="animate-pulse">...</span> : stat.value}
                            </p>
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 card-elevated p-6">
                    <h2 className="text-h4 text-kongo-black font-bold mb-6">Activités Récentes</h2>
                    <div className="space-y-4">
                        {isLoading ? (
                            <div className="py-12 flex justify-center"><Loader2 className="animate-spin text-kongo-lime" /></div>
                        ) : recentBookings.length > 0 ? (
                            recentBookings.map((booking) => (
                                <div key={booking.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                    <div className="flex items-center space-x-4">
                                        <div className="w-10 h-10 rounded-full bg-kongo-black flex items-center justify-center text-on-black text-xs font-bold">
                                            {booking.profiles?.full_name?.slice(0, 2).toUpperCase() || 'KG'}
                                        </div>
                                        <div>
                                            <p className="text-body font-medium">Ticket #{booking.booking_reference}</p>
                                            <p className="text-label text-tertiary">
                                                {booking.trips?.origin?.name} - {booking.trips?.destination?.name} • {getTimeAgo(booking.created_at)}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="text-body-small font-black">{formatPrice(booking.total_price)}</span>
                                        <button 
                                            onClick={() => {
                                                setSelectedBooking(booking);
                                                setIsDetailOpen(true);
                                            }}
                                            className="p-2 hover:bg-gray-100 rounded-lg text-secondary group-hover:text-kongo-lime transition-colors"
                                        >
                                            <Eye className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="py-12 text-center text-tertiary">Aucune activité récente.</div>
                        )}
                    </div>
                </div>

                <BookingDetailModal 
                    booking={selectedBooking} 
                    isOpen={isDetailOpen} 
                    onClose={() => setIsDetailOpen(false)} 
                />

                <div className="card-elevated p-6 bg-kongo-black text-on-black">
                    <h2 className="text-h4 font-bold mb-6">Alertes Système</h2>
                    <div className="space-y-4">
                        <div className="flex space-x-3 p-4 bg-white/10 rounded-lg border border-white/20">
                            <AlertCircle className="w-5 h-5 text-kongo-lime shrink-0" />
                            <div>
                                <p className="text-body-small font-bold">Maintenance requise</p>
                                <p className="text-xs opacity-70">Le bus #BK-405 nécessite une révision après 5000km.</p>
                            </div>
                        </div>
                        <div className="flex space-x-3 p-4 bg-white/10 rounded-lg border border-white/20">
                            <AlertCircle className="w-5 h-5 text-orange-400 shrink-0" />
                            <div>
                                <p className="text-body-small font-bold">Retard signalé</p>
                                <p className="text-xs opacity-70">Trajet Lubumbashi-Bukavu retardé de 45min (météo).</p>
                            </div>
                        </div>
                    </div>
                    <button className="btn-secondary w-full mt-6 text-kongo-black py-2 rounded-lg font-bold">
                        Consulter toutes les alertes
                    </button>

                    {userRole === 'superuser' && (
                        <button
                            onClick={() => onPageChange(NAVIGATION_PAGES.ADMIN_AGENCIES)}
                            className="btn-dark-outline w-full mt-4 flex items-center justify-center gap-2 text-sm font-bold"
                        >
                            <Building2 className="w-4 h-4 mr-2" /> Gérer les Agences
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
